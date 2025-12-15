/**
 * @fileoverview 投稿の引用一覧表示モジュール
 *
 * このモジュールは、特定の投稿を引用した投稿の一覧を表示する。
 * AT ProtocolのGetQuotes APIを使用して、無限スクロール可能なリストを実現。
 *
 * 主な機能:
 * - 引用投稿の一覧表示（投稿カード形式）
 * - 無限スクロールによるページネーション
 * - プルトゥリフレッシュ機能
 * - モデレーション（コンテンツフィルタリング）適用
 * - エラーハンドリングと空状態の表示
 *
 * @note Goユーザー向け補足:
 * - useCallback, useStateはReactフック（Goのクロージャ + 状態管理）
 * - interface/typeはGoのstructに相当（型定義）
 * - JSXは関数が返すUI記述（HTMLライクな構文だがJavaScript）
 */

// Reactの基本フック（コールバックメモ化と状態管理）
import {useCallback, useState} from 'react'
// AT Protocol APIの型定義（投稿・モデレーション関連）
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  moderatePost,
  ModerationDecision,
} from '@atproto/api'
// 国際化マクロ（翻訳文字列定義用）
import {msg} from '@lingui/macro'
// 国際化フック（現在の言語設定を取得）
import {useLingui} from '@lingui/react'

// 初期レンダリング件数を計算するカスタムフック（パフォーマンス最適化）
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
// エラーメッセージの整形ユーティリティ
import {cleanError} from '#/lib/strings/errors'
// ログ出力ユーティリティ（エラー追跡用）
import {logger} from '#/logger'
// モデレーションオプション取得フック（ユーザー設定に基づくフィルタリング）
import {useModerationOpts} from '#/state/preferences/moderation-opts'
// 引用投稿取得クエリフック（TanStack Query使用）
import {usePostQuotesQuery} from '#/state/queries/post-quotes'
// URI解決クエリフック（AT Protocol URIを解決）
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
// 投稿カードコンポーネント
import {Post} from '#/view/com/post/Post'
// リストのフッターとプレースホルダーコンポーネント
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
// 仮想化リストコンポーネント（パフォーマンス最適化）
import {List} from '../util/List'

/**
 * リストアイテムレンダリング関数
 *
 * 各引用投稿を投稿カード形式で表示する。
 *
 * @param item - 投稿情報（投稿データ、モデレーション決定、レコード含む）
 * @param index - リスト内のインデックス（最初の要素の境界線制御に使用）
 * @returns 投稿カードコンポーネント
 *
 * @note Goユーザー向け補足:
 * - interface定義は引数の型を厳密に指定（Goの構造体フィールドタグに似ている）
 * - <Post>はJSXコンポーネント（Reactの描画単位）
 */
function renderItem({
  item,
  index,
}: {
  item: {
    post: AppBskyFeedDefs.PostView
    moderation: ModerationDecision
    record: AppBskyFeedPost.Record
  }
  index: number
}) {
  return <Post post={item.post} hideTopBorder={index === 0} />
}

/**
 * リストアイテムのキー抽出関数
 *
 * React仮想化リストで各アイテムを一意に識別するためのキーを返す。
 * 投稿のURIを使用して一意性を保証。
 *
 * @param item - 投稿情報
 * @returns 投稿のURI（一意識別子）
 */
function keyExtractor(item: {
  post: AppBskyFeedDefs.PostView
  moderation: ModerationDecision
  record: AppBskyFeedPost.Record
}) {
  return item.post.uri
}

/**
 * 投稿の引用一覧コンポーネント
 *
 * 指定されたURIの投稿を引用した投稿を一覧表示する。
 * 無限スクロール、プルトゥリフレッシュ、モデレーションフィルタリングに対応。
 *
 * @param uri - 投稿のAT Protocol URI
 * @returns 引用投稿一覧のUIコンポーネント
 *
 * @note Goユーザー向け補足:
 * - export functionはGoのexported functionに相当（パッケージ外から利用可能）
 * - この関数コンポーネントはUIをレンダリングし、状態を管理する
 */
export function PostQuotes({uri}: {uri: string}) {
  // 国際化関数を取得（翻訳文字列の適用用）
  const {_} = useLingui()
  // 初期レンダリング件数を取得（デバイスに応じた最適化）
  const initialNumToRender = useInitialNumToRender()
  // プルトゥリフレッシュ中フラグ（useState: 状態管理フック）
  const [isPTRing, setIsPTRing] = useState(false)

  // URI解決クエリ（AT Protocol URIを正規化）
  const {
    data: resolvedUri,
    error: resolveError,
    isLoading: isLoadingUri,
  } = useResolveUriQuery(uri)

  // 引用投稿取得クエリ（無限スクロール対応）
  const {
    data, // ページネーションされたデータ
    isLoading: isLoadingQuotes, // 初回ロード中フラグ
    isFetchingNextPage, // 次ページ取得中フラグ
    hasNextPage, // 次ページ存在フラグ
    fetchNextPage, // 次ページ取得関数
    error, // エラー情報
    refetch, // 再取得関数
  } = usePostQuotesQuery(resolvedUri?.uri)

  // モデレーションオプション取得（ユーザー設定に基づくフィルタリング）
  const moderationOpts = useModerationOpts()

  // エラー状態の判定（URI解決エラーまたは引用取得エラー）
  const isError = Boolean(resolveError || error)

  // 引用投稿リストの構築（モデレーション適用）
  // @note Goユーザー向け: ?.はオプショナルチェーン演算子（nilチェックと同等）
  const quotes =
    data?.pages
      .flatMap(page =>
        page.posts.map(post => {
          // 投稿レコードの型チェック（型アサーション）
          if (!AppBskyFeedPost.isRecord(post.record) || !moderationOpts) {
            return null
          }
          // モデレーション決定を適用（ユーザー設定に基づくフィルタリング）
          const moderation = moderatePost(post, moderationOpts)
          return {post, record: post.record, moderation}
        }),
      )
      .filter(item => item !== null) ?? [] // nullを除外し、データなしの場合は空配列

  // プルトゥリフレッシュハンドラー（useCallback: 関数のメモ化）
  const onRefresh = useCallback(async () => {
    setIsPTRing(true) // リフレッシュ中フラグを立てる
    try {
      await refetch() // 引用データを再取得
    } catch (err) {
      // エラーをログに記録（ユーザーには表示しない）
      logger.error('Failed to refresh quotes', {message: err})
    }
    setIsPTRing(false) // リフレッシュ完了
  }, [refetch, setIsPTRing])

  // 無限スクロールハンドラー（リスト末尾到達時に次ページ取得）
  const onEndReached = useCallback(async () => {
    // 次ページ取得中、次ページなし、エラー時は何もしない
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage() // 次ページの引用データを取得
    } catch (err) {
      logger.error('Failed to load more quotes', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  // 引用が0件の場合は空状態またはエラーを表示
  if (quotes.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingUri || isLoadingQuotes} // ローディング状態
        isError={isError} // エラー状態
        emptyType="results" // 空状態タイプ（検索結果なし）
        emptyTitle={_(msg`No quotes yet`)} // 空状態タイトル
        emptyMessage={_(
          msg`Nobody has quoted this yet. Maybe you should be the first!`,
        )} // 空状態メッセージ
        errorMessage={cleanError(resolveError || error)} // エラーメッセージ
        sideBorders={false} // サイドボーダーなし
      />
    )
  }

  // 引用投稿リストを表示（無限スクロール対応）
  // loaded
  // =
  return (
    <List
      data={quotes} // 表示する引用投稿データ
      renderItem={renderItem} // 各アイテムのレンダリング関数
      keyExtractor={keyExtractor} // アイテムのキー抽出関数
      refreshing={isPTRing} // プルトゥリフレッシュ中フラグ
      onRefresh={onRefresh} // プルトゥリフレッシュハンドラー
      onEndReached={onEndReached} // リスト末尾到達ハンドラー
      onEndReachedThreshold={4} // 末尾到達判定の閾値（アイテム4個分手前）
      ListFooterComponent={
        // リストフッター（次ページ取得中インジケーターとエラー表示）
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          error={cleanError(error)}
          onRetry={fetchNextPage}
          showEndMessage // 終端メッセージ表示フラグ
          endMessageText={_(msg`That's all, folks!`)} // 終端メッセージテキスト
        />
      }
      // @ts-ignore our .web version only -prf
      desktopFixedHeight // デスクトップでは固定高さ
      initialNumToRender={initialNumToRender} // 初期レンダリング件数
      windowSize={11} // レンダリングウィンドウサイズ（パフォーマンス最適化）
      sideBorders={false} // サイドボーダーなし
    />
  )
}
