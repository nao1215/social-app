/**
 * プロフィールフォロー中一覧コンポーネント
 *
 * 【モジュール概要】
 * ユーザーがフォローしているユーザー一覧を表示。
 * 無限スクロール、Pull-to-Refresh、エラーハンドリングをサポート。
 *
 * 【主な機能】
 * - フォロー中ユーザー一覧表示（無限スクロール対応）
 * - Pull-to-Refresh（引っ張って更新）
 * - 空状態表示（フォロー中ユーザーなし）
 * - エラーハンドリングとリトライ
 * - ユーザーハンドル/DIDからの解決
 *
 * 【データフロー】
 * 1. ユーザー名（ハンドル）をDIDに解決
 * 2. DIDを使ってフォロー中一覧をクエリ
 * 3. ページネーション対応の無限スクロール
 * 4. ProfileCardWithFollowBtnでレンダリング
 *
 * 【ProfileFollowersとの違い】
 * - ProfileFollowers: 自分をフォローしている人（フォロワー）
 * - ProfileFollows: 自分がフォローしている人（フォロー中）
 *
 * 【Go開発者向け補足】
 * - React.useMemo: 計算結果のメモ化（Goのsync.Onceに類似）
 * - React.useCallback: 関数のメモ化（不要な再生成を防ぐ）
 * - flatMap: ページデータを1次元配列に平坦化（Goのappend in loopに類似）
 */
import React from 'react' // Reactライブラリ
import {AppBskyActorDefs as ActorDefs} from '@atproto/api' // AT Protocol アクター定義
import {msg} from '@lingui/macro' // 国際化マクロ
import {useLingui} from '@lingui/react' // Linguiフック

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender' // 初期レンダリング数フック
import {cleanError} from '#/lib/strings/errors' // エラーメッセージクリーニング
import {logger} from '#/logger' // ロガー
import {useProfileFollowsQuery} from '#/state/queries/profile-follows' // フォロー中取得クエリ
import {useResolveDidQuery} from '#/state/queries/resolve-uri' // ハンドル→DID解決クエリ
import {useSession} from '#/state/session' // セッション状態管理
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists' // リストコンポーネント
import {List} from '../util/List' // 仮想化リストコンポーネント
import {ProfileCardWithFollowBtn} from './ProfileCard' // プロフィールカードコンポーネント

/**
 * renderItem - リストアイテムレンダリング関数
 *
 * 【Go開発者向け補足】
 * - renderItem: Reactのリスト最適化パターン（関数コンポーネント外で定義）
 *   コンポーネント再レンダリング時に関数が再生成されるのを防ぐ
 * - item: 各プロフィールビュー
 * - index: 配列インデックス（0始まり）
 *
 * @param item - プロフィールビューデータ
 * @param index - リストインデックス
 * @returns JSX要素 - プロフィールカード
 */
function renderItem({
  item,
  index,
}: {
  item: ActorDefs.ProfileView
  index: number
}) {
  return (
    <ProfileCardWithFollowBtn
      key={item.did} // React key（一意識別子、GoのmapキーPに類似）
      profile={item}
      noBorder={index === 0} // 最初の要素のみ境界線なし
    />
  )
}

/**
 * keyExtractor - リストアイテムのキー抽出関数
 *
 * 【機能説明】
 * React Listの最適化のため、各アイテムの一意キーを抽出。
 * DID（分散型ID）をキーとして使用し、アイテムの再レンダリングを最小化。
 *
 * 【Go開発者向け補足】
 * - keyExtractor: Reactのリスト最適化（Goのmap iterationでキーを使うのに類似）
 * - item.did: 分散型ID（一意識別子）
 *
 * @param item - プロフィールビュー基本データ
 * @returns DID文字列
 */
function keyExtractor(item: ActorDefs.ProfileViewBasic) {
  return item.did
}

/**
 * ProfileFollows - プロフィールフォロー中一覧コンポーネント
 *
 * 【機能説明】
 * 指定ユーザーがフォローしているユーザー一覧を表示する画面コンポーネント。
 * - ユーザーハンドルからDIDを解決
 * - フォロー中一覧を無限スクロールで取得
 * - Pull-to-Refresh対応
 * - 空状態とエラー状態の処理
 *
 * 【状態管理】
 * - isPTRing: Pull-to-Refreshの進行状態
 * - resolvedDid: 解決されたDID
 * - data: ページネーション対応のフォロー中データ
 *
 * 【Go開発者向け補足】
 * - useState: Reactの状態管理フック（Goのローカル変数に相当、再レンダリングトリガー）
 * - useCallback: 関数メモ化（依存配列が変わらない限り同じ関数を返す）
 * - async/await: 非同期処理（Goのgoroutine + channelに類似）
 *
 * @param name - ユーザーハンドルまたはDID
 * @returns JSX要素 - フォロー中一覧
 */
export function ProfileFollows({name}: {name: string}) {
  const {_} = useLingui() // 翻訳関数取得
  const initialNumToRender = useInitialNumToRender() // 初期レンダリング数（パフォーマンス最適化）
  const {currentAccount} = useSession() // 現在のアカウント情報

  // Pull-to-Refresh状態（true: リフレッシュ中、false: 通常状態）
  const [isPTRing, setIsPTRing] = React.useState(false)

  // ユーザーハンドル→DID解決クエリ
  // 【Go開発者向け補足】useQuery: TanStack Queryのフック（自動キャッシュ、再取得、エラーハンドリング）
  const {
    data: resolvedDid, // 解決されたDID
    isLoading: isDidLoading, // 解決中フラグ
    error: resolveError, // 解決エラー
  } = useResolveDidQuery(name)

  // フォロー中一覧取得クエリ（無限スクロール対応）
  const {
    data, // ページネーションデータ（pages配列）
    isLoading: isFollowsLoading, // 初回ロード中
    isFetchingNextPage, // 次ページ取得中
    hasNextPage, // 次ページ存在フラグ
    fetchNextPage, // 次ページ取得関数
    error, // エラー
    refetch, // 再取得関数
  } = useProfileFollowsQuery(resolvedDid)

  const isError = !!resolveError || !!error // エラー判定（!!: 真偽値への変換）
  const isMe = resolvedDid === currentAccount?.did // 自分自身のプロフィールか判定

  /**
   * フォロー中データを1次元配列に平坦化
   *
   * 【Go開発者向け補足】
   * - useMemo: 依存配列（data?.pages）が変わらない限り、前回の計算結果を再利用
   * - flatMap: ページデータを平坦化（Goのappend in loopに類似）
   * - data?.pages: オプショナルチェーン（Goのif data != nil { data.pages }に類似）
   */
  const follows = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.follows) // 全ページのフォロー中ユーザーを結合
    }
    return [] // データなしの場合は空配列
  }, [data])

  /**
   * Pull-to-Refresh（引っ張って更新）ハンドラー
   *
   * 【機能説明】
   * ユーザーが画面を引っ張った際にフォロー中一覧を再取得。
   * エラー時もログ記録し、UI状態は正常に戻す。
   *
   * 【Go開発者向け補足】
   * - useCallback: 関数メモ化（依存配列が変わらない限り同じ関数を返す）
   * - async/await: 非同期処理（Goのgoroutine + channelに類似）
   * - try/catch: 例外処理（Goのif err != nilに類似）
   */
  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true) // リフレッシュ開始
    try {
      await refetch() // フォロー中一覧を再取得
    } catch (err) {
      logger.error('Failed to refresh follows', {error: err}) // エラーログ記録
    }
    setIsPTRing(false) // リフレッシュ終了（成功でも失敗でも必ず実行）
  }, [refetch, setIsPTRing])

  /**
   * リスト末尾到達時のハンドラー（無限スクロール）
   *
   * 【機能説明】
   * リストの末尾に近づいた際、自動的に次ページを取得。
   * エラー時や取得中、次ページなしの場合は何もしない。
   *
   * 【Go開発者向け補足】
   * - ガード節パターン: 早期リターンで条件分岐を減らす（Goでよく使うパターン）
   * - fetchNextPage: TanStack QueryのInfinite Query機能
   */
  const onEndReached = React.useCallback(async () => {
    // 次ページ取得中、次ページなし、エラー状態の場合は何もしない
    if (isFetchingNextPage || !hasNextPage || !!error) return
    try {
      await fetchNextPage() // 次ページ取得
    } catch (err) {
      logger.error('Failed to load more follows', {error: err})
    }
  }, [error, fetchNextPage, hasNextPage, isFetchingNextPage])

  /**
   * 空状態・エラー状態の表示
   *
   * 【条件】
   * フォロー中ユーザーが1人もいない場合、プレースホルダーを表示。
   * - ローディング状態
   * - エラー状態（リトライボタン付き）
   * - 空状態（自分/他人で異なるメッセージ）
   */
  if (follows.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isDidLoading || isFollowsLoading} // DID解決中またはフォロー中取得中
        isError={isError} // エラー状態
        emptyType="results" // 空状態タイプ（"results"）
        emptyMessage={
          isMe
            ? _(msg`You are not following anyone.`) // 自分: フォロー中ユーザーなし
            : _(msg`This user isn't following anyone.`) // 他人: フォロー中ユーザーなし
        }
        errorMessage={cleanError(resolveError || error)} // エラーメッセージ（クリーニング済み）
        onRetry={isError ? refetch : undefined} // エラー時のリトライ関数
        sideBorders={false} // サイドボーダーなし
      />
    )
  }

  /**
   * JSX返却: フォロー中一覧リスト
   *
   * 【構造説明】
   * - List: 仮想化リストコンポーネント（パフォーマンス最適化）
   * - Pull-to-Refresh対応
   * - 無限スクロール対応
   * - フッター: 次ページ取得中のインジケーター
   *
   * 【Go開発者向け補足】
   * - <Component />: JSX記法（Goのテンプレート呼び出しに類似）
   * - prop={value}: プロパティ渡し（Goの関数引数に相当）
   * - @ts-ignore: TypeScript型チェック無視（.web専用プロパティ）
   */
  return (
    <List
      data={follows} // フォロー中データ配列
      renderItem={renderItem} // アイテムレンダリング関数
      keyExtractor={keyExtractor} // キー抽出関数
      refreshing={isPTRing} // リフレッシュ状態
      onRefresh={onRefresh} // Pull-to-Refreshハンドラー
      onEndReached={onEndReached} // リスト末尾到達ハンドラー
      onEndReachedThreshold={4} // 末尾到達の閾値（画面の4倍手前で発火）
      ListFooterComponent={
        // リストフッター: 次ページ取得中のインジケーター、エラー表示
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          error={cleanError(error)}
          onRetry={fetchNextPage}
        />
      }
      // @ts-ignore Web専用プロパティ（デスクトップで固定高さ）
      desktopFixedHeight
      initialNumToRender={initialNumToRender} // 初期レンダリング数（パフォーマンス最適化）
      windowSize={11} // 仮想化ウィンドウサイズ（表示領域の11倍をメモリ保持）
      sideBorders={false} // サイドボーダーなし
    />
  )
}
