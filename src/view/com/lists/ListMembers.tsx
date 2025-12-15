/**
 * リストメンバー表示コンポーネント
 *
 * このファイルは、Blueskyのリスト（ユーザーのコレクション）に属する
 * メンバー一覧を表示するためのReactコンポーネントを提供します。
 *
 * 主な機能:
 * - リストメンバーの無限スクロール表示
 * - プルツーリフレッシュ（Pull-to-Refresh）機能
 * - リストオーナーによるメンバー編集機能
 * - ローディング・エラー・空状態の適切な表示
 *
 * Go開発者向け補足:
 * - useCallbackやuseStateはReactの「フック」と呼ばれる機能で、
 *   関数コンポーネント内で状態管理や最適化を行うためのものです
 * - JSXは関数の戻り値として記述されるHTML風の構文です
 * - interfaceやtypeはGoのstructに相当する型定義です
 *
 * @module ListMembers
 */

import React, {useCallback} from 'react' // React本体とuseCallbackフック（関数メモ化用）
import {
  Dimensions, // デバイス画面サイズ取得
  type GestureResponderEvent, // タッチイベント型定義
  type StyleProp, // スタイルプロパティ型
  View, // UIコンテナコンポーネント
  type ViewStyle, // Viewスタイル型定義
} from 'react-native'
import {type AppBskyGraphDefs} from '@atproto/api' // AT Protocol APIのグラフ（ソーシャルグラフ）型定義
import {msg, Trans} from '@lingui/macro' // 国際化ライブラリ（翻訳マクロ）
import {useLingui} from '@lingui/react' // Linguiフック（翻訳関数取得用）

import {cleanError} from '#/lib/strings/errors' // エラーメッセージ整形ユーティリティ
import {logger} from '#/logger' // ロギングシステム
import {useModalControls} from '#/state/modals' // モーダル制御フック
import {useModerationOpts} from '#/state/preferences/moderation-opts' // モデレーション設定フック
import {useListMembersQuery} from '#/state/queries/list-members' // リストメンバー取得クエリフック
import {useSession} from '#/state/session' // セッション情報フック（現在のユーザー情報）
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage' // エラー表示コンポーネント
import {List, type ListRef} from '#/view/com/util/List' // 仮想化リストコンポーネント
import {ProfileCardFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder' // ローディングプレースホルダー
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn' // 読み込み再試行ボタン
import {atoms as a, useTheme} from '#/alf' // デザインシステム（アトミックスタイル）
import {Button, ButtonText} from '#/components/Button' // ボタンコンポーネント
import {ListFooter} from '#/components/Lists' // リストフッター（ページネーション表示）
import * as ProfileCard from '#/components/ProfileCard' // プロフィールカードコンポーネント群
import type * as bsky from '#/types/bsky' // Bluesky固有の型定義

// 特殊なリストアイテムの識別子（Goの定数に相当）
// リスト内で表示状態を判別するためのマーカーオブジェクト
const LOADING_ITEM = {_reactKey: '__loading__'} // ローディング表示用アイテム
const EMPTY_ITEM = {_reactKey: '__empty__'} // 空状態表示用アイテム
const ERROR_ITEM = {_reactKey: '__error__'} // エラー表示用アイテム
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'} // 追加読み込みエラー用アイテム

/**
 * ListMembersコンポーネントのプロパティ型定義
 * （Goのstructに相当）
 */
interface ListMembersProps {
  list: string // リストのURI（識別子）
  style?: StyleProp<ViewStyle> // コンポーネントのスタイル
  scrollElRef?: ListRef // スクロール要素への参照（外部制御用）
  onScrolledDownChange: (isScrolledDown: boolean) => void // スクロール状態変更コールバック
  onPressTryAgain?: () => void // 再試行ボタン押下コールバック
  renderHeader: () => JSX.Element // ヘッダーレンダリング関数
  renderEmptyState: () => JSX.Element // 空状態レンダリング関数
  testID?: string // テスト用ID
  headerOffset?: number // ヘッダーのオフセット高さ
  desktopFixedHeightOffset?: number // デスクトップ表示時の固定高さオフセット
}

/**
 * リストメンバー一覧表示コンポーネント
 *
 * リストに属するユーザーの一覧を無限スクロール可能な形式で表示します。
 * TanStack Query（React Query）を使用してデータフェッチとキャッシュを管理します。
 *
 * Go開発者向け補足:
 * - この関数は通常のJavaScript関数ですが、JSX（HTML風の構文）を返すため
 *   Reactコンポーネントとして動作します
 * - 引数はオブジェクトの分割代入（destructuring）で受け取っています
 *
 * @param props - コンポーネントのプロパティ
 * @returns JSX要素（レンダリングされるUI）
 */
export function ListMembers({
  list,
  style,
  scrollElRef,
  onScrolledDownChange,
  onPressTryAgain,
  renderHeader,
  renderEmptyState,
  testID,
  headerOffset = 0,
  desktopFixedHeightOffset,
}: ListMembersProps) {
  // フックを使用した状態管理とデータ取得
  // Go開発者向け補足: フックはコンポーネント内でのみ使用可能な特殊な関数で、
  // 状態管理や副作用処理を行います。関数の最上位で呼び出す必要があります。

  const t = useTheme() // 現在のテーマ（ダークモード/ライトモード）を取得
  const {_} = useLingui() // 翻訳関数を取得（i18n対応）
  const [isRefreshing, setIsRefreshing] = React.useState(false) // リフレッシュ中フラグ（useState: 状態管理フック）
  const {openModal} = useModalControls() // モーダル開閉制御関数を取得
  const {currentAccount} = useSession() // 現在ログイン中のアカウント情報を取得
  const moderationOpts = useModerationOpts() // モデレーション設定（コンテンツフィルタリング）を取得

  // TanStack Queryを使用したリストメンバーデータの取得
  // Go開発者向け補足: このフックは自動的にキャッシング、再取得、エラーハンドリングを行います
  const {
    data, // 取得したデータ（ページネーション形式）
    isFetching, // 取得中かどうか
    isFetched, // 取得完了したかどうか
    isError, // エラーが発生したかどうか
    error, // エラー内容
    refetch, // 再取得関数
    fetchNextPage, // 次のページを取得する関数
    hasNextPage, // 次のページが存在するか
    isFetchingNextPage, // 次のページ取得中か
  } = useListMembersQuery(list)

  // データ状態の判定
  const isEmpty = !isFetching && !data?.pages[0].items.length // データが空かどうか
  const isOwner =
    currentAccount && data?.pages[0].list.creator.did === currentAccount.did // 現在のユーザーがリストのオーナーかどうか

  // リスト表示用のアイテム配列を生成（useMemoでメモ化）
  // Go開発者向け補足: useMemoは依存配列の値が変わらない限り、
  // 計算結果を再利用してパフォーマンスを最適化します
  const items = React.useMemo(() => {
    let items: any[] = []
    if (isFetched) {
      // 取得完了後の処理
      if (isEmpty && isError) {
        // 空でエラーの場合、エラー表示アイテムを追加
        items = items.concat([ERROR_ITEM])
      }
      if (isEmpty) {
        // 空の場合、空状態表示アイテムを追加
        items = items.concat([EMPTY_ITEM])
      } else if (data) {
        // データがある場合、全ページのアイテムを結合
        for (const page of data.pages) {
          items = items.concat(page.items)
        }
      }
      if (!isEmpty && isError) {
        // データはあるがエラーの場合（追加読み込みエラー）
        items = items.concat([LOAD_MORE_ERROR_ITEM])
      }
    } else if (isFetching) {
      // 取得中はローディング表示
      items = items.concat([LOADING_ITEM])
    }
    return items
  }, [isFetched, isEmpty, isError, data, isFetching])

  // ===================================
  // イベントハンドラー定義
  // ===================================

  /**
   * プルツーリフレッシュのハンドラー
   * Go開発者向け補足: useCallbackは関数をメモ化して、
   * 不要な再レンダリングを防ぎます
   */
  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true) // リフレッシュ状態をtrueに設定
    try {
      await refetch() // データを再取得
    } catch (err) {
      logger.error('Failed to refresh lists', {message: err})
    }
    setIsRefreshing(false) // リフレッシュ状態をfalseに戻す
  }, [refetch, setIsRefreshing])

  /**
   * リスト末尾に到達したときのハンドラー（無限スクロール）
   */
  const onEndReached = React.useCallback(async () => {
    // 既に取得中、次ページなし、エラー状態の場合は何もしない
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage() // 次のページを取得
    } catch (err) {
      logger.error('Failed to load more lists', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  /**
   * 追加読み込み再試行ボタンのハンドラー
   */
  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  /**
   * メンバーシップ編集ボタンのハンドラー
   * リストオーナーのみがメンバーの追加・削除を行えます
   */
  const onPressEditMembership = React.useCallback(
    (e: GestureResponderEvent, profile: bsky.profile.AnyProfileView) => {
      e.preventDefault() // デフォルトのイベント動作を抑制
      // メンバー追加・削除用のモーダルを開く
      openModal({
        name: 'user-add-remove-lists',
        subject: profile.did,
        displayName: profile.displayName || profile.handle,
        handle: profile.handle,
      })
    },
    [openModal],
  )

  // ===================================
  // レンダリング関数
  // ===================================

  /**
   * リストアイテムのレンダリング関数
   * Go開発者向け補足: これはFlatListの各アイテムをどう表示するかを定義する関数です
   */
  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      // 特殊アイテムの処理
      if (item === EMPTY_ITEM) {
        return renderEmptyState() // 空状態を表示
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            message={cleanError(error)}
            onPressTryAgain={onPressTryAgain}
          />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label={_(
              msg`There was an issue fetching the list. Tap here to try again.`,
            )}
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING_ITEM) {
        return <ProfileCardFeedLoadingPlaceholder />
      }

      // 通常のリストメンバーの表示
      const profile = (item as AppBskyGraphDefs.ListItemView).subject
      if (!moderationOpts) return null // モデレーション設定がまだ読み込まれていない場合

      // Go開発者向け補足: 以下はJSXで、HTMLに似た構文でUIを記述します
      // Viewはdivのようなコンテナ、ProfileCardはカスタムコンポーネントです
      return (
        <View
          style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}>
          <ProfileCard.Link profile={profile}>
            <ProfileCard.Outer>
              <ProfileCard.Header>
                <ProfileCard.Avatar
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
                <ProfileCard.NameAndHandle
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
                {/* リストオーナーの場合のみ編集ボタンを表示 */}
                {isOwner && (
                  <Button
                    testID={`user-${profile.handle}-editBtn`}
                    label={_(msg({message: 'Edit', context: 'action'}))}
                    onPress={e => onPressEditMembership(e, profile)}
                    size="small"
                    variant="solid"
                    color="secondary">
                    <ButtonText>
                      <Trans context="action">Edit</Trans>
                    </ButtonText>
                  </Button>
                )}
              </ProfileCard.Header>

              <ProfileCard.Labels
                profile={profile}
                moderationOpts={moderationOpts}
              />

              <ProfileCard.Description profile={profile} />
            </ProfileCard.Outer>
          </ProfileCard.Link>
        </View>
      )
    },
    [
      renderEmptyState,
      error,
      onPressTryAgain,
      onPressRetryLoadMore,
      moderationOpts,
      isOwner,
      onPressEditMembership,
      _,
      t,
    ],
  )

  /**
   * リストフッター（ページネーション表示）のレンダリング関数
   */
  const renderFooter = useCallback(() => {
    if (isEmpty) return null // 空の場合はフッター不要
    return (
      <ListFooter
        hasNextPage={hasNextPage} // 次ページがあるか
        error={cleanError(error)} // エラーメッセージ
        isFetchingNextPage={isFetchingNextPage} // 次ページ取得中か
        onRetry={fetchNextPage} // 再試行ハンドラー
        height={180 + headerOffset} // フッター高さ
      />
    )
  }, [
    hasNextPage,
    error,
    isFetchingNextPage,
    fetchNextPage,
    isEmpty,
    headerOffset,
  ])

  // メインレンダリング
  // Go開発者向け補足: returnで返されるJSXが実際に画面に表示されるUIです
  return (
    <View testID={testID} style={style}>
      {/* 仮想化リストコンポーネント（大量データを効率的に表示） */}
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef} // 外部からスクロール制御するための参照
        data={items} // 表示するデータ配列
        keyExtractor={(item: any) => item.subject?.did || item._reactKey} // 各アイテムの一意キー生成関数
        renderItem={renderItem} // アイテムレンダリング関数
        ListHeaderComponent={!isEmpty ? renderHeader : undefined} // ヘッダーコンポーネント
        ListFooterComponent={renderFooter} // フッターコンポーネント
        refreshing={isRefreshing} // プルツーリフレッシュ中フラグ
        onRefresh={onRefresh} // プルツーリフレッシュハンドラー
        headerOffset={headerOffset} // ヘッダーオフセット
        contentContainerStyle={{
          minHeight: Dimensions.get('window').height * 1.5, // 最小高さを画面の1.5倍に設定（スクロール改善）
        }}
        onScrolledDownChange={onScrolledDownChange} // スクロール状態変更コールバック
        onEndReached={onEndReached} // リスト末尾到達時のハンドラー（無限スクロール）
        onEndReachedThreshold={0.6} // 末尾到達判定の閾値（60%スクロール時）
        removeClippedSubviews={true} // 画面外のビューを削除してパフォーマンス向上
        desktopFixedHeight={desktopFixedHeightOffset || true} // デスクトップ表示時の固定高さ設定
      />
    </View>
  )
}
