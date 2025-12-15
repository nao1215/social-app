/**
 * @fileoverview 投稿にいいねしたユーザー一覧表示モジュール
 *
 * このモジュールは、特定の投稿にいいねしたユーザーのリストを表示する。
 * AT ProtocolのGetLikes APIを使用して、無限スクロール可能なリストを実現。
 *
 * 主な機能:
 * - いいねユーザーの一覧表示（プロフィールカード形式）
 * - 無限スクロールによるページネーション
 * - プルトゥリフレッシュ機能
 * - エラーハンドリングと空状態の表示
 *
 * @note Goユーザー向け補足:
 * - useCallback, useMemoはGoのクロージャに似ているが、再計算を最適化するReactフック
 * - useStateはコンポーネントの状態管理フック（再レンダリングをトリガー）
 * - JSXは関数が返すUI記述（HTMLライクな構文だがJavaScript）
 */

// Reactの基本フック（Goのクロージャに似ているが、状態管理とメモ化機能付き）
import {useCallback, useMemo, useState} from 'react'
// AT Protocol APIの型定義（いいね情報取得用）
import {AppBskyFeedGetLikes as GetLikes} from '@atproto/api'
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
// いいねユーザー取得クエリフック（TanStack Query使用）
import {useLikedByQuery} from '#/state/queries/post-liked-by'
// URI解決クエリフック（AT Protocol URIを解決）
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
// フォローボタン付きプロフィールカードコンポーネント
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
// 仮想化リストコンポーネント（パフォーマンス最適化）
import {List} from '#/view/com/util/List'
// リストのフッターとプレースホルダーコンポーネント
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'

/**
 * リストアイテムレンダリング関数
 *
 * 各いいねユーザーをプロフィールカード形式で表示する。
 *
 * @param item - いいね情報（ユーザープロフィールを含む）
 * @param index - リスト内のインデックス（最初の要素の境界線制御に使用）
 * @returns プロフィールカードコンポーネント
 *
 * @note Goユーザー向け補足:
 * - JSX構文: return以降のHTMLライクな記述がUI要素を返す
 * - <Component prop={value} />はGoの構造体初期化に似ているがReactコンポーネント
 */
function renderItem({item, index}: {item: GetLikes.Like; index: number}) {
  return (
    <ProfileCardWithFollowBtn
      key={item.actor.did}
      profile={item.actor}
      noBorder={index === 0}
    />
  )
}

/**
 * リストアイテムのキー抽出関数
 *
 * React仮想化リストで各アイテムを一意に識別するためのキーを返す。
 * DID（Decentralized Identifier）を使用して一意性を保証。
 *
 * @param item - いいね情報
 * @returns ユーザーのDID（分散型識別子）
 */
function keyExtractor(item: GetLikes.Like) {
  return item.actor.did
}

/**
 * 投稿にいいねしたユーザー一覧コンポーネント
 *
 * 指定されたURIの投稿にいいねしたユーザーを一覧表示する。
 * 無限スクロールとプルトゥリフレッシュに対応。
 *
 * @param uri - 投稿のAT Protocol URI
 * @returns いいねユーザー一覧のUIコンポーネント
 *
 * @note Goユーザー向け補足:
 * - この関数コンポーネントはGoの関数に似ているが、JSXを返しUIをレンダリングする
 * - constはGoのconst宣言に似ているが、ブロックスコープの不変変数
 */
export function PostLikedBy({uri}: {uri: string}) {
  // 国際化関数を取得（翻訳文字列の適用用）
  const {_} = useLingui()
  // 初期レンダリング件数を取得（デバイスに応じた最適化）
  const initialNumToRender = useInitialNumToRender()

  // プルトゥリフレッシュ中フラグ（useState: 状態管理フック）
  // @note Goユーザー向け: useStateは値と更新関数のペアを返す（Goの変数とセッター関数に相当）
  const [isPTRing, setIsPTRing] = useState(false)

  // URI解決クエリ（AT Protocol URIを正規化）
  // @note Goユーザー向け: 構造体の分割代入（Goの多値返却に似ている）
  const {
    data: resolvedUri,
    error: resolveError,
    isLoading: isLoadingUri,
  } = useResolveUriQuery(uri)

  // いいねユーザー取得クエリ（無限スクロール対応）
  const {
    data, // ページネーションされたデータ
    isLoading: isLoadingLikes, // 初回ロード中フラグ
    isFetchingNextPage, // 次ページ取得中フラグ
    hasNextPage, // 次ページ存在フラグ
    fetchNextPage, // 次ページ取得関数
    error, // エラー情報
    refetch, // 再取得関数
  } = useLikedByQuery(resolvedUri?.uri)

  // エラー状態の判定（URI解決エラーまたはいいね取得エラー）
  const isError = Boolean(resolveError || error)

  // いいねユーザーリストのメモ化（useMemo: 依存配列が変わらない限り再計算しない）
  // @note Goユーザー向け: useMemoは計算結果をキャッシュするフック（高コスト計算の最適化）
  const likes = useMemo(() => {
    // ページネーションデータを平坦化（全ページのいいねを1つの配列に）
    if (data?.pages) {
      return data.pages.flatMap(page => page.likes)
    }
    return []
  }, [data]) // dataが変更された時のみ再計算

  // プルトゥリフレッシュハンドラー（useCallback: 関数のメモ化）
  // @note Goユーザー向け: useCallbackは関数をメモ化し、不要な再生成を防ぐ
  const onRefresh = useCallback(async () => {
    setIsPTRing(true) // リフレッシュ中フラグを立てる
    try {
      await refetch() // いいねデータを再取得
    } catch (err) {
      // エラーをログに記録（ユーザーには表示しない）
      logger.error('Failed to refresh likes', {message: err})
    }
    setIsPTRing(false) // リフレッシュ完了
  }, [refetch, setIsPTRing]) // 依存する値が変わった時のみ関数を再生成

  // 無限スクロールハンドラー（リスト末尾到達時に次ページ取得）
  const onEndReached = useCallback(async () => {
    // 次ページ取得中、次ページなし、エラー時は何もしない
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage() // 次ページのいいねデータを取得
    } catch (err) {
      logger.error('Failed to load more likes', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  // いいねが0件の場合は空状態またはエラーを表示
  if (likes.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingUri || isLoadingLikes} // ローディング状態
        isError={isError} // エラー状態
        emptyType="results" // 空状態タイプ（検索結果なし）
        emptyTitle={_(msg`No likes yet`)} // 空状態タイトル
        emptyMessage={_(
          msg`Nobody has liked this yet. Maybe you should be the first!`,
        )} // 空状態メッセージ
        errorMessage={cleanError(resolveError || error)} // エラーメッセージ
        sideBorders={false} // サイドボーダーなし
        topBorder={false} // トップボーダーなし
      />
    )
  }

  // いいねユーザーリストを表示（無限スクロール対応）
  // @note Goユーザー向け: JSXは<tag prop={value}>の形でコンポーネントを構築
  return (
    <List
      data={likes} // 表示するいいねユーザーデータ
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
        />
      }
      desktopFixedHeight // デスクトップでは固定高さ
      initialNumToRender={initialNumToRender} // 初期レンダリング件数
      windowSize={11} // レンダリングウィンドウサイズ（パフォーマンス最適化）
      sideBorders={false} // サイドボーダーなし
    />
  )
}
