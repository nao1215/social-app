/**
 * @fileoverview プロフィールシャドウキャッシュシステム
 *
 * このモジュールは、サーバーから受信したプロフィールデータに対してクライアント側で
 * 一時的な状態変更を管理する「シャドウ」システムを提供します。
 *
 * ## 主な機能
 * - フォロー・ミュート・ブロックなどのUI上の即座な反映（楽観的更新）
 * - 認証状態やアクティビティサブスクリプションの管理
 * - サーバー反映を待たずにユーザーに素早いフィードバックを提供
 * - WeakMapによる自動メモリ管理（元データが削除されればシャドウも自動削除）
 * - EventEmitter経由でのリアクティブな更新通知
 *
 * ## Goユーザー向けの説明
 * - useState: Goにおける構造体フィールドのような状態変数（変更すると再レンダリング）
 * - useEffect: コンポーネントのライフサイクルに応じて実行される副作用処理
 *   - 第2引数の依存配列が変更された時、またはマウント/アンマウント時に実行
 *   - return文でクリーンアップ関数を返すことができる（defer的な役割）
 * - useMemo: 計算コストの高い処理結果をキャッシュ（依存配列が変更されない限り再計算しない）
 * - WeakMap: キーがGCされると自動的にエントリも削除されるMap（メモリリーク防止）
 * - EventEmitter: Node.jsスタイルのイベント駆動アーキテクチャ（Pub/Subパターン）
 */

// React Hooksのインポート - 状態管理とエフェクト処理
// useState: コンポーネント内の状態を管理（Goのstructフィールドに相当、変更で再レンダリング）
// useEffect: 副作用処理（マウント/アンマウント時やデータ変更時に実行）
// useMemo: 計算結果のメモ化（依存配列が変わらない限り再計算しない）
import {useEffect, useMemo, useState} from 'react'
// AT Protocol APIの型定義 - Blueskyのプロフィールと通知機能
import {type AppBskyActorDefs, type AppBskyNotificationDefs} from '@atproto/api'
// TanStack React Queryのクライアント型 - キャッシュクライアント
import {type QueryClient} from '@tanstack/react-query'
// イベントエミッター - プロフィールの変更を通知するために使用
// Node.jsスタイルのイベント駆動アーキテクチャ（Pub/Subパターン）
import EventEmitter from 'eventemitter3'

// バッチ更新ユーティリティ - パフォーマンス最適化のための一括更新
import {batchedUpdates} from '#/lib/batchedUpdates'
// 各種クエリデータからプロフィールを検索するためのユーティリティ関数群
import {findAllProfilesInQueryData as findAllProfilesInActivitySubscriptionsQueryData} from '#/state/queries/activity-subscriptions' // アクティビティサブスクリプション
import {findAllProfilesInQueryData as findAllProfilesInActorSearchQueryData} from '#/state/queries/actor-search'                       // アカウント検索
import {findAllProfilesInQueryData as findAllProfilesInExploreFeedPreviewsQueryData} from '#/state/queries/explore-feed-previews'       // 探索フィードプレビュー
import {findAllProfilesInQueryData as findAllProfilesInKnownFollowersQueryData} from '#/state/queries/known-followers'                 // 既知のフォロワー
import {findAllProfilesInQueryData as findAllProfilesInListMembersQueryData} from '#/state/queries/list-members'                       // リストメンバー
import {findAllProfilesInQueryData as findAllProfilesInListConvosQueryData} from '#/state/queries/messages/list-conversations'         // メッセージ会話一覧
import {findAllProfilesInQueryData as findAllProfilesInMyBlockedAccountsQueryData} from '#/state/queries/my-blocked-accounts'          // ブロック済みアカウント
import {findAllProfilesInQueryData as findAllProfilesInMyMutedAccountsQueryData} from '#/state/queries/my-muted-accounts'              // ミュート済みアカウント
import {findAllProfilesInQueryData as findAllProfilesInFeedsQueryData} from '#/state/queries/post-feed'                                // フィード
import {findAllProfilesInQueryData as findAllProfilesInPostLikedByQueryData} from '#/state/queries/post-liked-by'                      // いいねユーザー
import {findAllProfilesInQueryData as findAllProfilesInPostQuotesQueryData} from '#/state/queries/post-quotes'                         // 引用投稿
import {findAllProfilesInQueryData as findAllProfilesInPostRepostedByQueryData} from '#/state/queries/post-reposted-by'                // リポストユーザー
import {findAllProfilesInQueryData as findAllProfilesInPostThreadQueryData} from '#/state/queries/post-thread'                         // スレッド
import {findAllProfilesInQueryData as findAllProfilesInProfileQueryData} from '#/state/queries/profile'                                // プロフィール
import {findAllProfilesInQueryData as findAllProfilesInProfileFollowersQueryData} from '#/state/queries/profile-followers'             // フォロワー一覧
import {findAllProfilesInQueryData as findAllProfilesInProfileFollowsQueryData} from '#/state/queries/profile-follows'                 // フォロー一覧
import {findAllProfilesInQueryData as findAllProfilesInSuggestedFollowsQueryData} from '#/state/queries/suggested-follows'             // おすすめフォロー
import {findAllProfilesInQueryData as findAllProfilesInSuggestedUsersQueryData} from '#/state/queries/trending/useGetSuggestedUsersQuery' // おすすめユーザー
import {findAllProfilesInQueryData as findAllProfilesInPostThreadV2QueryData} from '#/state/queries/usePostThread/queryCache'          // スレッドV2
// Blueskyの型定義をインポート
import type * as bsky from '#/types/bsky'
// シャドウ型とキャスト関数のインポート - キャッシュシステムの型安全性確保
import {castAsShadow, type Shadow} from './types'

export type {Shadow} from './types'

/**
 * プロフィールシャドウデータの型定義（Goのstructに相当）
 * サーバーから受信したプロフィールデータに対するクライアント側の一時的な状態変更を表現
 * UI上の即座な反応のため、サーバー反映前に楽観的更新として使用
 */
export interface ProfileShadow {
  /** フォロー済みの場合のURI（フォロー関係を示す） */
  followingUri: string | undefined
  /** ミュート状態フラグ */
  muted: boolean | undefined
  /** ブロック済みの場合のURI（ブロック関係を示す） */
  blockingUri: string | undefined
  /** 認証状態（verified等） */
  verification: AppBskyActorDefs.VerificationState
  /** ステータス表示（アカウントの状態情報） */
  status: AppBskyActorDefs.StatusView | undefined
  /** アクティビティサブスクリプション（通知設定） */
  activitySubscription: AppBskyNotificationDefs.ActivitySubscription | undefined
}

// プロフィールとそのシャドウデータのマッピング（WeakMapで自動ガベージコレクション対応）
// Goユーザー向け: WeakMapはキーがGCされると自動的にエントリも削除される特殊なMap
const shadows: WeakMap<
  bsky.profile.AnyProfileView,  // 元のプロフィールデータ
  Partial<ProfileShadow>        // 部分的なシャドウデータ
> = new WeakMap()
// プロフィールの変更を通知するためのグローバルイベントエミッター
const emitter = new EventEmitter()

/**
 * プロフィールシャドウフック - プロフィールデータとそのシャドウ状態を統合
 * サーバーデータとクライアント側の一時的な変更を組み合わせて表示用データを作成
 *
 * ## 処理の流れ
 * 1. プロフィールのシャドウデータを状態として保持
 * 2. プロフィールが変更されたら新しいシャドウデータを取得
 * 3. EventEmitterでプロフィール変更を監視
 * 4. 元データとシャドウを統合して返却
 *
 * @param profile 元のプロフィールデータ
 * @returns シャドウ状態が統合されたプロフィールデータ
 */
export function useProfileShadow<
  TProfileView extends bsky.profile.AnyProfileView,
>(profile: TProfileView): Shadow<TProfileView> {
  // プロフィールのシャドウデータの状態管理
  // Goユーザー向け: useStateは値が変更されるとコンポーネントを再レンダリングする
  const [shadow, setShadow] = useState(() => shadows.get(profile))
  // 前回のプロフィール参照を追跡（プロフィールが変更された際の処理のため）
  const [prevPost, setPrevPost] = useState(profile)

  // プロフィールが変更された場合のシャドウデータ更新
  if (profile !== prevPost) {
    setPrevPost(profile)
    setShadow(shadows.get(profile)) // 新しいプロフィールのシャドウデータを取得
  }

  // プロフィールの変更通知を監視するエフェクト
  // Goユーザー向け: useEffectはマウント時・依存配列変更時に実行され、
  // return文でクリーンアップ関数を返す（defer的な役割）
  useEffect(() => {
    function onUpdate() {
      // プロフィールのシャドウデータが更新されたときの処理
      setShadow(shadows.get(profile))
    }
    // 該当プロフィールのDIDでイベントリスナーを登録
    emitter.addListener(profile.did, onUpdate)
    return () => {
      // クリーンアップ：イベントリスナーを削除（Goのdefer的な役割）
      emitter.removeListener(profile.did, onUpdate)
    }
  }, [profile])

  // 元のプロフィールデータとシャドウデータを統合して返却
  // Goユーザー向け: useMemoは依存配列（profile, shadow）が変更されない限り再計算をスキップ
  return useMemo(() => {
    if (shadow) {
      // シャドウデータがある場合は統合
      return mergeShadow(profile, shadow)
    } else {
      // シャドウデータがない場合は元データをシャドウ型にキャスト
      return castAsShadow(profile)
    }
  }, [profile, shadow])
}

/**
 * useProfileShadowと同じだが、プロフィールがundefinedの場合も許容する
 * プロフィールがまだロードされていない可能性がある場合に有用
 *
 * Same as useProfileShadow, but allows for the profile to be undefined.
 * This is useful for when the profile is not guaranteed to be loaded yet.
 *
 * @param profile 元のプロフィールデータ（undefinedの可能性あり）
 * @returns シャドウ状態が統合されたプロフィールデータまたはundefined
 */
export function useMaybeProfileShadow<
  TProfileView extends bsky.profile.AnyProfileView,
>(profile?: TProfileView): Shadow<TProfileView> | undefined {
  // プロフィールが存在する場合のみシャドウデータを取得
  const [shadow, setShadow] = useState(() =>
    profile ? shadows.get(profile) : undefined,
  )
  // 前回のプロフィール参照を追跡
  const [prevPost, setPrevPost] = useState(profile)
  // プロフィールが変更された場合のシャドウデータ更新
  if (profile !== prevPost) {
    setPrevPost(profile)
    setShadow(profile ? shadows.get(profile) : undefined)
  }

  // プロフィールの変更通知を監視するエフェクト
  useEffect(() => {
    if (!profile) return  // プロフィールが未定義の場合は何もしない
    function onUpdate() {
      if (!profile) return
      setShadow(shadows.get(profile))
    }
    emitter.addListener(profile.did, onUpdate)
    return () => {
      emitter.removeListener(profile.did, onUpdate)
    }
  }, [profile])

  // 元のプロフィールデータとシャドウデータを統合して返却
  return useMemo(() => {
    if (!profile) return undefined  // プロフィールが未定義の場合はundefinedを返す
    if (shadow) {
      return mergeShadow(profile, shadow)
    } else {
      return castAsShadow(profile)
    }
  }, [profile, shadow])
}

/**
 * プロフィールのシャドウデータを更新し、関連する全てのキャッシュに反映する関数
 * フォロー、ミュート、ブロックなどのアクションが実行された際に呼ばれる
 *
 * 処理の流れ:
 * 1. キャッシュ内の該当プロフィールを全て検索
 * 2. 各プロフィールのシャドウデータを更新
 * 3. イベントを発行して UI を更新
 *
 * @param queryClient React Query クライアント（キャッシュアクセス用）
 * @param did プロフィールのDID（分散識別子）
 * @param value 更新するシャドウデータの部分的な値
 */
export function updateProfileShadow(
  queryClient: QueryClient,
  did: string,
  value: Partial<ProfileShadow>,
) {
  // キャッシュ内の該当プロフィールを全て検索（ジェネレータで列挙）
  const cachedProfiles = findProfilesInCache(queryClient, did)
  // 各プロフィールのシャドウデータを更新（既存データとマージ）
  for (let profile of cachedProfiles) {
    shadows.set(profile, {...shadows.get(profile), ...value})
  }
  // バッチ更新でパフォーマンスを最適化しながらイベントを発行
  // これによりUIが更新され、変更が即座に反映される
  batchedUpdates(() => {
    emitter.emit(did, value)
  })
}

/**
 * プロフィールデータとシャドウデータを統合する関数
 * サーバーデータとクライアント側の一時的な変更（フォロー、ミュートなど）を
 * マージして最終的な表示用データを生成する
 *
 * @param profile 元のプロフィールデータ（サーバーから取得）
 * @param shadow クライアント側の一時的な変更データ
 * @returns 統合されたプロフィールデータ
 */
function mergeShadow<TProfileView extends bsky.profile.AnyProfileView>(
  profile: TProfileView,
  shadow: Partial<ProfileShadow>,
): Shadow<TProfileView> {
  // 統合されたデータを構築してシャドウ型として返す
  return castAsShadow({
    ...profile,  // 元のプロフィールデータをスプレッド展開
    viewer: {
      ...(profile.viewer || {}),  // 元のビューアーデータをスプレッド展開
      // フォロー状態の上書き（シャドウにあればそれを使用、なければ元データ）
      following:
        'followingUri' in shadow
          ? shadow.followingUri
          : profile.viewer?.following,
      // ミュート状態の上書き
      muted: 'muted' in shadow ? shadow.muted : profile.viewer?.muted,
      // ブロック状態の上書き
      blocking:
        'blockingUri' in shadow ? shadow.blockingUri : profile.viewer?.blocking,
      // アクティビティサブスクリプションの上書き
      activitySubscription:
        'activitySubscription' in shadow
          ? shadow.activitySubscription
          : profile.viewer?.activitySubscription,
    },
    // 認証状態の上書き
    verification:
      'verification' in shadow ? shadow.verification : profile.verification,
    // ステータスの上書き
    status:
      'status' in shadow
        ? shadow.status
        : 'status' in profile
          ? profile.status
          : undefined,
  })
}

/**
 * React Query キャッシュ内の全ての場所から指定DIDのプロフィールを検索するジェネレータ関数
 *
 * ## Goユーザー向けの説明
 * - ジェネレータ関数（function*）: Goのchannelに似た仕組みで、yieldで値を1つずつ返す
 * - yield*: 別のジェネレータを委譲（Goのfor range channel的な使い方）
 * - この関数は複数のクエリキャッシュを横断して同じプロフィールの全インスタンスを列挙する
 *
 * プロフィールは複数の場所にキャッシュされている可能性がある:
 * - リストメンバー
 * - ブロック済み/ミュート済みアカウント
 * - いいね/リポストユーザー
 * - フォロワー/フォロー一覧
 * - おすすめユーザー
 * - 検索結果
 * - メッセージ会話
 * - フィード/スレッド表示
 * - 探索フィードプレビュー
 * - アクティビティサブスクリプション
 *
 * @param queryClient React Query クライアント
 * @param did 検索対象のプロフィールDID（分散識別子）
 * @yields キャッシュ内で見つかったプロフィールデータ
 */
function* findProfilesInCache(
  queryClient: QueryClient,
  did: string,
): Generator<bsky.profile.AnyProfileView, void> {
  // 各種キャッシュからプロフィールを検索（yield*で委譲）
  yield* findAllProfilesInListMembersQueryData(queryClient, did)               // リストメンバー
  yield* findAllProfilesInMyBlockedAccountsQueryData(queryClient, did)         // ブロック済みアカウント
  yield* findAllProfilesInMyMutedAccountsQueryData(queryClient, did)           // ミュート済みアカウント
  yield* findAllProfilesInPostLikedByQueryData(queryClient, did)               // いいねユーザー
  yield* findAllProfilesInPostRepostedByQueryData(queryClient, did)            // リポストユーザー
  yield* findAllProfilesInPostQuotesQueryData(queryClient, did)                // 引用投稿
  yield* findAllProfilesInProfileQueryData(queryClient, did)                   // プロフィール
  yield* findAllProfilesInProfileFollowersQueryData(queryClient, did)          // フォロワー一覧
  yield* findAllProfilesInProfileFollowsQueryData(queryClient, did)            // フォロー一覧
  yield* findAllProfilesInSuggestedUsersQueryData(queryClient, did)            // おすすめユーザー
  yield* findAllProfilesInSuggestedFollowsQueryData(queryClient, did)          // おすすめフォロー
  yield* findAllProfilesInActorSearchQueryData(queryClient, did)               // アカウント検索
  yield* findAllProfilesInListConvosQueryData(queryClient, did)                // メッセージ会話一覧
  yield* findAllProfilesInFeedsQueryData(queryClient, did)                     // フィード
  yield* findAllProfilesInPostThreadQueryData(queryClient, did)                // スレッド
  yield* findAllProfilesInPostThreadV2QueryData(queryClient, did)              // スレッドV2
  yield* findAllProfilesInKnownFollowersQueryData(queryClient, did)            // 既知のフォロワー
  yield* findAllProfilesInExploreFeedPreviewsQueryData(queryClient, did)       // 探索フィードプレビュー
  yield* findAllProfilesInActivitySubscriptionsQueryData(queryClient, did)     // アクティビティサブスクリプション
}
