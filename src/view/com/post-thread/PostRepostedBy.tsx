/**
 * @fileoverview 投稿をリポストしたユーザー一覧表示モジュール
 *
 * このモジュールは、特定の投稿をリポスト（再投稿）したユーザーの一覧を表示する。
 * AT ProtocolのGetRepostedBy APIを使用して、無限スクロール可能なリストを実現。
 *
 * 主な機能:
 * - リポストユーザーの一覧表示（プロフィールカード形式）
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
// AT Protocol APIの型定義（アクター情報取得用）
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
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
// リポストユーザー取得クエリフック（TanStack Query使用）
import {usePostRepostedByQuery} from '#/state/queries/post-reposted-by'
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
 * 各リポストユーザーをプロフィールカード形式で表示する。
 *
 * @param item - プロフィール情報
 * @param index - リスト内のインデックス（最初の要素の境界線制御に使用）
 * @returns プロフィールカードコンポーネント
 *
 * @note Goユーザー向け補足:
 * - JSX構文: return以降のHTMLライクな記述がUI要素を返す
 * - <Component prop={value} />はGoの構造体初期化に似ているがReactコンポーネント
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
      key={item.did}
      profile={item}
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
 * @param item - プロフィール基本情報
 * @returns ユーザーのDID（分散型識別子）
 */
function keyExtractor(item: ActorDefs.ProfileViewBasic) {
  return item.did
}

/**
 * 投稿をリポストしたユーザー一覧コンポーネント
 *
 * 指定されたURIの投稿をリポストしたユーザーを一覧表示する。
 * 無限スクロールとプルトゥリフレッシュに対応。
 *
 * @param uri - 投稿のAT Protocol URI
 * @returns リポストユーザー一覧のUIコンポーネント
 *
 * @note Goユーザー向け補足:
 * - この関数コンポーネントはGoの関数に似ているが、JSXを返しUIをレンダリングする
 * - export functionはGoのexported functionに相当（パッケージ外から利用可能）
 */
export function PostRepostedBy({uri}: {uri: string}) {
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

  // リポストユーザー取得クエリ（無限スクロール対応）
  const {
    data, // ページネーションされたデータ
    isLoading: isLoadingRepostedBy, // 初回ロード中フラグ
    isFetchingNextPage, // 次ページ取得中フラグ
    hasNextPage, // 次ページ存在フラグ
    fetchNextPage, // 次ページ取得関数
    error, // エラー情報
    refetch, // 再取得関数
  } = usePostRepostedByQuery(resolvedUri?.uri)

  // エラー状態の判定（URI解決エラーまたはリポスト取得エラー）
  const isError = Boolean(resolveError || error)

  // リポストユーザーリストのメモ化（useMemo: 依存配列が変わらない限り再計算しない）
  // @note Goユーザー向け: useMemoは計算結果をキャッシュするフック（高コスト計算の最適化）
  const repostedBy = useMemo(() => {
    // ページネーションデータを平坦化（全ページのリポストユーザーを1つの配列に）
    if (data?.pages) {
      return data.pages.flatMap(page => page.repostedBy)
    }
    return []
  }, [data]) // dataが変更された時のみ再計算

  // プルトゥリフレッシュハンドラー（useCallback: 関数のメモ化）
  // @note Goユーザー向け: useCallbackは関数をメモ化し、不要な再生成を防ぐ
  const onRefresh = useCallback(async () => {
    setIsPTRing(true) // リフレッシュ中フラグを立てる
    try {
      await refetch() // リポストデータを再取得
    } catch (err) {
      // エラーをログに記録（ユーザーには表示しない）
      logger.error('Failed to refresh reposts', {message: err})
    }
    setIsPTRing(false) // リフレッシュ完了
  }, [refetch, setIsPTRing]) // 依存する値が変わった時のみ関数を再生成

  // 無限スクロールハンドラー（リスト末尾到達時に次ページ取得）
  const onEndReached = useCallback(async () => {
    // 次ページ取得中、次ページなし、エラー時は何もしない
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage() // 次ページのリポストデータを取得
    } catch (err) {
      logger.error('Failed to load more reposts', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  // リポストが0件の場合は空状態またはエラーを表示
  if (repostedBy.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingUri || isLoadingRepostedBy} // ローディング状態
        isError={isError} // エラー状態
        emptyType="results" // 空状態タイプ（検索結果なし）
        emptyTitle={_(msg`No reposts yet`)} // 空状態タイトル
        emptyMessage={_(
          msg`Nobody has reposted this yet. Maybe you should be the first!`,
        )} // 空状態メッセージ
        errorMessage={cleanError(resolveError || error)} // エラーメッセージ
        sideBorders={false} // サイドボーダーなし
      />
    )
  }

  // リポストユーザーリストを表示（無限スクロール対応）
  // loaded
  // =
  return (
    <List
      data={repostedBy} // 表示するリポストユーザーデータ
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
      // @ts-ignore our .web version only -prf
      desktopFixedHeight // デスクトップでは固定高さ
      initialNumToRender={initialNumToRender} // 初期レンダリング件数
      windowSize={11} // レンダリングウィンドウサイズ（パフォーマンス最適化）
      sideBorders={false} // サイドボーダーなし
    />
  )
}
