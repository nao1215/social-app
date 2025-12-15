/**
 * @fileoverview 投稿シャドウキャッシュシステム
 *
 * このモジュールは、サーバーから受信した投稿データに対してクライアント側で
 * 一時的な状態変更を管理する「シャドウ」システムを提供します。
 *
 * ## 主な機能
 * - いいね・リポスト・ブックマークなどのUI上の即座な反映（楽観的更新）
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
// AT Protocol APIの型定義 - Blueskyの投稿とエンベッド機能
import {
  AppBskyEmbedRecord,        // レコードエンベッドタイプ
  AppBskyEmbedRecordWithMedia, // メディア付きレコードエンベッドタイプ
  type AppBskyFeedDefs,      // フィード定義の型
} from '@atproto/api'
// TanStack React Queryのクライアント型 - キャッシュクライアント
import {type QueryClient} from '@tanstack/react-query'
// イベントエミッター - 投稿の変更を通知するために使用
// Node.jsスタイルのイベント駆動アーキテクチャ（Pub/Subパターン）
import EventEmitter from 'eventemitter3'

// バッチ更新ユーティリティ - パフォーマンス最適化のための一括更新
import {batchedUpdates} from '#/lib/batchedUpdates'
// 各種クエリデータから投稿を検索するためのユーティリティ関数群
import {findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData} from '#/state/queries/explore-feed-previews' // 探索フィードプレビューから投稿検索
import {findAllPostsInQueryData as findAllPostsInNotifsQueryData} from '#/state/queries/notifications/feed'             // 通知フィードから投稿検索
import {findAllPostsInQueryData as findAllPostsInFeedQueryData} from '#/state/queries/post-feed'                        // 投稿フィードから投稿検索
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '#/state/queries/post-quotes'                     // 引用投稿から投稿検索
import {findAllPostsInQueryData as findAllPostsInThreadQueryData} from '#/state/queries/post-thread'                   // スレッドから投稿検索
import {findAllPostsInQueryData as findAllPostsInSearchQueryData} from '#/state/queries/search-posts'                  // 検索結果から投稿検索
import {findAllPostsInQueryData as findAllPostsInThreadV2QueryData} from '#/state/queries/usePostThread/queryCache'    // スレッドV2から投稿検索
// シャドウ型とキャスト関数のインポート - キャッシュシステムの型安全性確保
import {castAsShadow, type Shadow} from './types'
export type {Shadow} from './types'

/**
 * 投稿シャドウデータの型定義
 * サーバーから受信した投稿データに対するクライアント側の一時的な状態変更を表現
 * UI上の即座な反応のため、サーバー反映前に楽観的更新として使用
 */
export interface PostShadow {
  likeUri: string | undefined              // いいねのURI（いいね済みの場合）
  repostUri: string | undefined            // リポストのURI（リポスト済みの場合）
  isDeleted: boolean                       // 削除フラグ（削除済みの場合true）
  embed: AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined // エンベッドコンテンツ
  pinned: boolean                          // ピン留めフラグ
  optimisticReplyCount: number | undefined // 楽観的リプライ数（実際の数値が反映される前の一時的な数値）
  bookmarked: boolean | undefined          // ブックマークフラグ
}

// 削除された投稿を表すトゥームストーンシンボル
export const POST_TOMBSTONE = Symbol('PostTombstone')

// 投稿の変更を通知するためのグローバルイベントエミッター
const emitter = new EventEmitter()

// 投稿とそのシャドウデータのマッピング（WeakMapで自動ガベージコレクション対応）
const shadows: WeakMap<
  AppBskyFeedDefs.PostView, // 元の投稿データ
  Partial<PostShadow>       // 部分的なシャドウデータ
> = new WeakMap()

/**
 * 危険な操作：投稿の生のシャドウデータを取得
 * 注意して使用してください！この関数は投稿の生のシャドウデータを返します。
 * 通常は `usePostShadow` を使用することを推奨します。
 * Use with caution! This function returns the raw shadow data for a post.
 * Prefer using `usePostShadow`.
 * @param post 対象の投稿データ
 * @returns 投稿に関連付けられたシャドウデータ（存在しない場合はundefined）
 */
export function dangerousGetPostShadow(post: AppBskyFeedDefs.PostView) {
  return shadows.get(post)
}

/**
 * 投稿シャドウフック - 投稿データとそのシャドウ状態を統合
 * サーバーデータとクライアント側の一時的な変更を組み合わせて表示用データを作成
 * @param post 元の投稿データ
 * @returns シャドウ状態が統合された投稿データ、または削除された投稿のトゥームストーン
 */
export function usePostShadow(
  post: AppBskyFeedDefs.PostView,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  // 投稿のシャドウデータの状態管理
  const [shadow, setShadow] = useState(() => shadows.get(post))
  // 前回の投稿参照を追跡（投稿が変更された際の処理のため）
  const [prevPost, setPrevPost] = useState(post)
  
  // 投稿が変更された場合のシャドウデータ更新
  if (post !== prevPost) {
    setPrevPost(post)
    setShadow(shadows.get(post)) // 新しい投稿のシャドウデータを取得
  }

  // 投稿の変更通知を監視するエフェクト
  useEffect(() => {
    function onUpdate() {
      // 投稿のシャドウデータが更新されたときの処理
      setShadow(shadows.get(post))
    }
    // 該当投稿のURIでイベントリスナーを登録
    emitter.addListener(post.uri, onUpdate)
    return () => {
      // クリーンアップ：イベントリスナーを削除
      emitter.removeListener(post.uri, onUpdate)
    }
  }, [post, setShadow])

  // 元の投稿データとシャドウデータを統合して返却
  // useMemo: 依存配列（post, shadow）が変更されない限り再計算をスキップ
  return useMemo(() => {
    if (shadow) {
      // シャドウデータがある場合は統合
      return mergeShadow(post, shadow)
    } else {
      // シャドウデータがない場合は元データをシャドウ型にキャスト
      return castAsShadow(post)
    }
  }, [post, shadow])
}

/**
 * 投稿データとシャドウデータを統合する関数
 * サーバーデータとクライアント側の一時的な変更（いいね、リポストなど）を
 * マージして最終的な表示用データを生成する
 *
 * @param post 元の投稿データ（サーバーから取得）
 * @param shadow クライアント側の一時的な変更データ
 * @returns 統合された投稿データまたは削除トゥームストーン
 */
function mergeShadow(
  post: AppBskyFeedDefs.PostView,
  shadow: Partial<PostShadow>,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  // 削除された投稿の場合はトゥームストーンを返す
  if (shadow.isDeleted) {
    return POST_TOMBSTONE
  }

  // いいね数の計算（楽観的更新）
  let likeCount = post.likeCount ?? 0
  if ('likeUri' in shadow) {
    const wasLiked = !!post.viewer?.like    // 以前いいねしていたか
    const isLiked = !!shadow.likeUri        // 現在いいねしているか
    if (wasLiked && !isLiked) {
      likeCount--  // いいね解除：カウント減少
    } else if (!wasLiked && isLiked) {
      likeCount++  // いいね追加：カウント増加
    }
    likeCount = Math.max(0, likeCount)  // 負の値を防ぐ
  }

  // ブックマーク数の計算（楽観的更新）
  let bookmarkCount = post.bookmarkCount ?? 0
  if ('bookmarked' in shadow) {
    const wasBookmarked = !!post.viewer?.bookmarked  // 以前ブックマークしていたか
    const isBookmarked = !!shadow.bookmarked         // 現在ブックマークしているか
    if (wasBookmarked && !isBookmarked) {
      bookmarkCount--  // ブックマーク解除：カウント減少
    } else if (!wasBookmarked && isBookmarked) {
      bookmarkCount++  // ブックマーク追加：カウント増加
    }
    bookmarkCount = Math.max(0, bookmarkCount)  // 負の値を防ぐ
  }

  // リポスト数の計算（楽観的更新）
  let repostCount = post.repostCount ?? 0
  if ('repostUri' in shadow) {
    const wasReposted = !!post.viewer?.repost  // 以前リポストしていたか
    const isReposted = !!shadow.repostUri      // 現在リポストしているか
    if (wasReposted && !isReposted) {
      repostCount--  // リポスト解除：カウント減少
    } else if (!wasReposted && isReposted) {
      repostCount++  // リポスト追加：カウント増加
    }
    repostCount = Math.max(0, repostCount)  // 負の値を防ぐ
  }

  // リプライ数の計算（楽観的更新）
  let replyCount = post.replyCount ?? 0
  if ('optimisticReplyCount' in shadow) {
    // 楽観的リプライ数が設定されている場合はそれを使用
    replyCount = shadow.optimisticReplyCount ?? replyCount
  }

  // エンベッドコンテンツの処理
  let embed: typeof post.embed
  if ('embed' in shadow) {
    // 元データとシャドウデータの両方が同じエンベッドタイプの場合のみ更新
    if (
      (AppBskyEmbedRecord.isView(post.embed) &&
        AppBskyEmbedRecord.isView(shadow.embed)) ||
      (AppBskyEmbedRecordWithMedia.isView(post.embed) &&
        AppBskyEmbedRecordWithMedia.isView(shadow.embed))
    ) {
      embed = shadow.embed
    }
  }

  // 統合されたデータを構築してシャドウ型として返す
  return castAsShadow({
    ...post,  // 元の投稿データをスプレッド展開
    embed: embed || post.embed,  // エンベッドデータの上書き
    likeCount: likeCount,        // 計算されたいいね数
    repostCount: repostCount,    // 計算されたリポスト数
    replyCount: replyCount,      // 計算されたリプライ数
    bookmarkCount: bookmarkCount,// 計算されたブックマーク数
    viewer: {
      ...(post.viewer || {}),    // 元のビューアーデータをスプレッド展開
      like: 'likeUri' in shadow ? shadow.likeUri : post.viewer?.like,
      repost: 'repostUri' in shadow ? shadow.repostUri : post.viewer?.repost,
      pinned: 'pinned' in shadow ? shadow.pinned : post.viewer?.pinned,
      bookmarked:
        'bookmarked' in shadow ? shadow.bookmarked : post.viewer?.bookmarked,
    },
  })
}

/**
 * 投稿のシャドウデータを更新し、関連する全てのキャッシュに反映する関数
 * いいね、リポスト、ブックマークなどのアクションが実行された際に呼ばれる
 *
 * 処理の流れ:
 * 1. キャッシュ内の該当投稿を全て検索
 * 2. 各投稿のシャドウデータを更新
 * 3. イベントを発行して UI を更新
 *
 * @param queryClient React Query クライアント（キャッシュアクセス用）
 * @param uri 投稿のURI（AT Protocol識別子）
 * @param value 更新するシャドウデータの部分的な値
 */
export function updatePostShadow(
  queryClient: QueryClient,
  uri: string,
  value: Partial<PostShadow>,
) {
  // キャッシュ内の該当投稿を全て検索（ジェネレータで列挙）
  const cachedPosts = findPostsInCache(queryClient, uri)
  // 各投稿のシャドウデータを更新（既存データとマージ）
  for (let post of cachedPosts) {
    shadows.set(post, {...shadows.get(post), ...value})
  }
  // バッチ更新でパフォーマンスを最適化しながらイベントを発行
  // これによりUIが更新され、変更が即座に反映される
  batchedUpdates(() => {
    emitter.emit(uri)
  })
}

/**
 * React Query キャッシュ内の全ての場所から指定URIの投稿を検索するジェネレータ関数
 *
 * ## Goユーザー向けの説明
 * - ジェネレータ関数（function*）: Goのchannelに似た仕組みで、yieldで値を1つずつ返す
 * - for...of文: Goのrange的な使い方でイテレータを反復処理
 * - この関数は複数のクエリキャッシュを横断して同じ投稿の全インスタンスを列挙する
 *
 * 投稿は複数の場所にキャッシュされている可能性がある:
 * - フィード（タイムライン）
 * - 通知一覧
 * - スレッド表示
 * - 検索結果
 * - 引用投稿一覧
 * - 探索フィードプレビュー
 *
 * @param queryClient React Query クライアント
 * @param uri 検索対象の投稿URI
 * @yields キャッシュ内で見つかった投稿データ
 */
function* findPostsInCache(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
  // フィードキャッシュから投稿を検索
  for (let post of findAllPostsInFeedQueryData(queryClient, uri)) {
    yield post
  }
  // 通知キャッシュから投稿を検索
  for (let post of findAllPostsInNotifsQueryData(queryClient, uri)) {
    yield post
  }
  // スレッドキャッシュから投稿を検索
  for (let node of findAllPostsInThreadQueryData(queryClient, uri)) {
    if (node.type === 'post') {
      yield node.post
    }
  }
  // スレッドV2キャッシュから投稿を検索
  for (let post of findAllPostsInThreadV2QueryData(queryClient, uri)) {
    yield post
  }
  // 検索結果キャッシュから投稿を検索
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield post
  }
  // 引用投稿キャッシュから投稿を検索
  for (let post of findAllPostsInQuoteQueryData(queryClient, uri)) {
    yield post
  }
  // 探索フィードプレビューキャッシュから投稿を検索
  for (let post of findAllPostsInExploreFeedPreviewsQueryData(
    queryClient,
    uri,
  )) {
    yield post
  }
}
