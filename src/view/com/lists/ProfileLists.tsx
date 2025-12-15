/**
 * プロフィールリスト表示コンポーネント
 *
 * このファイルは、特定のユーザーが作成・所有しているリストの一覧を
 * 表示するためのReactコンポーネントを提供します。
 *
 * 主な機能:
 * - ユーザーのリスト一覧の無限スクロール表示
 * - プルツーリフレッシュ機能
 * - スクロール位置の外部制御（forwardRefを使用）
 * - iOS専用のスクロール最適化
 * - ローディング・エラー・空状態の適切な表示
 *
 * Go開発者向け補足:
 * - React.forwardRefは親コンポーネントからrefを受け取るための特殊な関数です
 * - useEffectはコンポーネントのライフサイクル（マウント、更新、アンマウント）で
 *   副作用処理を実行するためのフックです
 * - useQueryClientはTanStack Queryのキャッシュを直接操作するためのフックです
 *
 * @module ProfileLists
 */

import React from 'react' // React本体
import {
  findNodeHandle, // React Nativeのネイティブノードハンドル取得（iOS最適化用）
  type ListRenderItemInfo, // リストアイテムレンダリング情報の型
  type StyleProp, // スタイルプロパティ型
  View, // UIコンテナコンポーネント
  type ViewStyle, // Viewスタイル型定義
} from 'react-native'
import {msg} from '@lingui/macro' // 国際化ライブラリ（翻訳マクロ）
import {useLingui} from '@lingui/react' // Linguiフック（翻訳関数取得用）
import {useQueryClient} from '@tanstack/react-query' // TanStack Queryクライアント（キャッシュ操作用）

import {cleanError} from '#/lib/strings/errors' // エラーメッセージ整形ユーティリティ
import {logger} from '#/logger' // ロギングシステム
import {isIOS, isNative, isWeb} from '#/platform/detection' // プラットフォーム検出ユーティリティ
import {RQKEY, useProfileListsQuery} from '#/state/queries/profile-lists' // プロフィールリスト取得クエリ
import {EmptyState} from '#/view/com/util/EmptyState' // 空状態表示コンポーネント
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage' // エラー表示コンポーネント
import {List, type ListRef} from '#/view/com/util/List' // 仮想化リストコンポーネント
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder' // ローディングプレースホルダー
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn' // 読み込み再試行ボタン
import {atoms as a, ios, useTheme} from '#/alf' // デザインシステム（アトミックスタイル）
import * as ListCard from '#/components/ListCard' // リストカードコンポーネント群
import {ListFooter} from '#/components/Lists' // リストフッター（ページネーション表示）

// 特殊なリストアイテムの識別子（Goの定数に相当）
const LOADING = {_reactKey: '__loading__'} // ローディング表示用アイテム
const EMPTY = {_reactKey: '__empty__'} // 空状態表示用アイテム
const ERROR_ITEM = {_reactKey: '__error__'} // エラー表示用アイテム
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'} // 追加読み込みエラー用アイテム

/**
 * セクション参照インターフェース
 * 親コンポーネントから呼び出せるメソッドを定義
 * （Goのinterface型に相当）
 */
interface SectionRef {
  scrollToTop: () => void // 最上部にスクロールするメソッド
}

/**
 * ProfileListsコンポーネントのプロパティ型定義
 * （Goのstructに相当）
 */
interface ProfileListsProps {
  did: string // ユーザーのDID（分散型識別子）
  scrollElRef: ListRef // スクロール要素への参照
  headerOffset: number // ヘッダーのオフセット高さ
  enabled?: boolean // コンポーネントが有効化されているか（タブ切り替え時の最適化用）
  style?: StyleProp<ViewStyle> // コンポーネントのスタイル
  testID?: string // テスト用ID
  setScrollViewTag: (tag: number | null) => void // スクロールビューのタグ設定（iOS最適化用）
}

/**
 * プロフィールリスト表示コンポーネント
 *
 * 特定のユーザーが作成したリストの一覧を表示します。
 * React.forwardRefを使用して親コンポーネントからスクロール位置を制御可能にしています。
 *
 * Go開発者向け補足:
 * - forwardRefは親から受け取った参照（ref）を子コンポーネント内で使用できるようにします
 * - 第二引数のrefが親から渡される参照オブジェクトです
 * - useImperativeHandleで親に公開するメソッドを定義します
 */
export const ProfileLists = React.forwardRef<SectionRef, ProfileListsProps>(
  function ProfileListsImpl(
    {did, scrollElRef, headerOffset, enabled, style, testID, setScrollViewTag},
    ref,
  ) {
    // フックを使用した状態管理とデータ取得
    const t = useTheme() // 現在のテーマを取得
    const {_} = useLingui() // 翻訳関数を取得
    const [isPTRing, setIsPTRing] = React.useState(false) // プルツーリフレッシュ中フラグ
    const opts = React.useMemo(() => ({enabled}), [enabled]) // クエリオプション（useMemoでメモ化）

    // プロフィールリストデータの取得
    const {
      data, // 取得したリストデータ
      isPending, // 初回読み込み中か
      hasNextPage, // 次ページが存在するか
      fetchNextPage, // 次ページ取得関数
      isFetchingNextPage, // 次ページ取得中か
      isError, // エラーが発生したか
      error, // エラー内容
      refetch, // 再取得関数
    } = useProfileListsQuery(did, opts)
    const isEmpty = !isPending && !data?.pages[0]?.lists.length // データが空かどうか

    // リスト表示用のアイテム配列を生成
    const items = React.useMemo(() => {
      let items: any[] = []
      if (isError && isEmpty) {
        items = items.concat([ERROR_ITEM]) // 空でエラーの場合
      }
      if (isPending) {
        items = items.concat([LOADING]) // 初回読み込み中
      } else if (isEmpty) {
        items = items.concat([EMPTY]) // 空状態
      } else if (data?.pages) {
        // データがある場合、全ページのリストを結合
        for (const page of data?.pages) {
          items = items.concat(page.lists)
        }
      }
      if (isError && !isEmpty) {
        items = items.concat([LOAD_MORE_ERROR_ITEM]) // 追加読み込みエラー
      }
      return items
    }, [isError, isEmpty, isPending, data])

    // ===================================
    // イベントハンドラー定義
    // ===================================

    const queryClient = useQueryClient() // TanStack Queryクライアント取得

    /**
     * 最上部へのスクロールハンドラー
     * スクロール後にキャッシュを無効化して最新データを取得
     */
    const onScrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative, // ネイティブプラットフォームではアニメーション有効
        offset: -headerOffset, // ヘッダー分を考慮したオフセット
      })
      queryClient.invalidateQueries({queryKey: RQKEY(did)}) // キャッシュ無効化
    }, [scrollElRef, queryClient, headerOffset, did])

    /**
     * 親コンポーネントに公開するメソッドを定義
     * Go開発者向け補足: useImperativeHandleは親から呼び出せるメソッドを制限するためのフックです
     */
    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    /**
     * プルツーリフレッシュハンドラー
     */
    const onRefresh = React.useCallback(async () => {
      setIsPTRing(true)
      try {
        await refetch()
      } catch (err) {
        logger.error('Failed to refresh lists', {message: err})
      }
      setIsPTRing(false)
    }, [refetch, setIsPTRing])

    /**
     * リスト末尾到達時のハンドラー（無限スクロール）
     */
    const onEndReached = React.useCallback(async () => {
      if (isFetchingNextPage || !hasNextPage || isError) return
      try {
        await fetchNextPage()
      } catch (err) {
        logger.error('Failed to load more lists', {message: err})
      }
    }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

    /**
     * 追加読み込み再試行ハンドラー
     */
    const onPressRetryLoadMore = React.useCallback(() => {
      fetchNextPage()
    }, [fetchNextPage])

    // ===================================
    // レンダリング関数
    // ===================================

    /**
     * リストアイテムのレンダリング関数
     */
    const renderItemInner = React.useCallback(
      ({item, index}: ListRenderItemInfo<any>) => {
        // 特殊アイテムの処理
        if (item === EMPTY) {
          return (
            <EmptyState
              icon="list-ul"
              message={_(msg`You have no lists.`)}
              testID="listsEmpty"
            />
          )
        } else if (item === ERROR_ITEM) {
          return (
            <ErrorMessage
              message={cleanError(error)}
              onPressTryAgain={refetch}
            />
          )
        } else if (item === LOAD_MORE_ERROR_ITEM) {
          return (
            <LoadMoreRetryBtn
              label={_(
                msg`There was an issue fetching your lists. Tap here to try again.`,
              )}
              onPress={onPressRetryLoadMore}
            />
          )
        } else if (item === LOADING) {
          return <FeedLoadingPlaceholder />
        }
        // 通常のリスト表示
        return (
          <View
            style={[
              (index !== 0 || isWeb) && a.border_t, // 最初のアイテム以外、またはWeb版では上部ボーダー表示
              t.atoms.border_contrast_low,
              a.px_lg,
              a.py_lg,
            ]}>
            <ListCard.Default view={item} />
          </View>
        )
      },
      [error, refetch, onPressRetryLoadMore, _, t.atoms.border_contrast_low],
    )

    /**
     * iOS専用のスクロール最適化
     * Go開発者向け補足: useEffectは依存配列の値が変わったときに実行される副作用フックです
     * コンポーネントのマウント時やpropsの変更時に処理を実行します
     */
    React.useEffect(() => {
      if (isIOS && enabled && scrollElRef.current) {
        const nativeTag = findNodeHandle(scrollElRef.current) // ネイティブビューのハンドル取得
        setScrollViewTag(nativeTag) // 親コンポーネントにタグを通知
      }
    }, [enabled, scrollElRef, setScrollViewTag])

    /**
     * リストフッターのレンダリング関数
     */
    const ProfileListsFooter = React.useCallback(() => {
      if (isEmpty) return null
      return (
        <ListFooter
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onRetry={fetchNextPage}
          error={cleanError(error)}
          height={180 + headerOffset}
        />
      )
    }, [
      hasNextPage,
      error,
      isFetchingNextPage,
      headerOffset,
      fetchNextPage,
      isEmpty,
    ])

    // メインレンダリング
    return (
      <View testID={testID} style={style}>
        <List
          testID={testID ? `${testID}-flatlist` : undefined}
          ref={scrollElRef}
          data={items}
          keyExtractor={keyExtractor} // 各アイテムの一意キー生成関数
          renderItem={renderItemInner}
          ListFooterComponent={ProfileListsFooter}
          refreshing={isPTRing}
          onRefresh={onRefresh}
          headerOffset={headerOffset}
          progressViewOffset={ios(0)} // iOSのプログレスビューオフセット
          removeClippedSubviews={true} // 画面外ビュー削除によるパフォーマンス最適化
          desktopFixedHeight
          onEndReached={onEndReached}
        />
      </View>
    )
  },
)

/**
 * リストアイテムのキー抽出関数
 * Go開発者向け補足: Reactは各リストアイテムに一意のキーが必要です
 */
function keyExtractor(item: any) {
  return item._reactKey || item.uri
}
