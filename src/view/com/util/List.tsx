/**
 * 高機能リストコンポーネント（ネイティブ版）
 * Enhanced List Component (Native Version)
 *
 * 【概要】
 * React Native FlatListをベースに、スクロール状態管理、
 * プルリフレッシュ、アイテム表示追跡などの機能を追加した高機能リスト。
 *
 * 【主な機能】
 * - スクロール位置の監視と状態管理
 * - プルリフレッシュ対応
 * - ヘッダーオフセット対応（固定ヘッダー用）
 * - アイテム表示追跡（インプレッション計測等）
 * - 動画の自動再生/停止制御
 *
 * 【Goユーザー向け補足】
 * - FlatList: 仮想化リスト（表示領域のみレンダリング）
 * - useSharedValue: UIスレッドとJSスレッド間で共有される値
 * - runOnJS: UIスレッドからJSスレッドへの関数呼び出し
 * - RefreshControl: プルリフレッシュのUI制御
 * - forwardRef: 親から子へのref転送（Goのポインタ渡しに似る）
 */

// Reactコア（memo: メモ化HOC）
// React core (memo: memoization HOC)
import React, {memo} from 'react'

// リフレッシュコントロール、ビュートークン型
// Refresh control, view token type
import {RefreshControl, type ViewToken} from 'react-native'

// Reanimated（アニメーション対応スクロール）
// Reanimated (animated scroll support)
import {
  type FlatListPropsWithLayout,
  runOnJS,
  useSharedValue,
} from 'react-native-reanimated'

// 動画ビューの更新（表示中の動画を検出）
// Video view update (detect visible videos)
import {updateActiveVideoViewAsync} from '@haileyok/bluesky-video'

// 修正版アニメーションスクロールハンドラー
// Fixed animated scroll handler
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'

// 重複呼び出し防止フック
// Dedupe hook (prevent duplicate calls)
import {useDedupe} from '#/lib/hooks/useDedupe'

// スクロールコンテキスト（親子間でスクロールイベント共有）
// Scroll context (share scroll events between parent and child)
import {useScrollHandlers} from '#/lib/ScrollContext'

// スタイル追加ユーティリティ
// Style addition utility
import {addStyle} from '#/lib/styles'

// プラットフォーム検出
// Platform detection
import {isIOS} from '#/platform/detection'

// ライトボックス状態（画像フルスクリーン表示）
// Lightbox state (fullscreen image display)
import {useLightbox} from '#/state/lightbox'

// テーマフック
// Theme hook
import {useTheme} from '#/alf'

// 内部FlatListコンポーネント
// Internal FlatList component
import {FlatList_INTERNAL} from './Views'

/**
 * Listコンポーネントのメソッド型
 * List component methods type
 */
export type ListMethods = FlatList_INTERNAL

/**
 * Listコンポーネントのprops型
 * List component props type
 *
 * 【注意】
 * いくつかのpropsはScrollContext経由で管理されるため、
 * 直接指定できないようにOmitで除外している。
 */
export type ListProps<ItemT = any> = Omit<
  FlatListPropsWithLayout<ItemT>,
  | 'onMomentumScrollBegin' // ScrollContext経由を使用 / Use ScrollContext instead.
  | 'onMomentumScrollEnd' // ScrollContext経由を使用 / Use ScrollContext instead.
  | 'onScroll' // ScrollContext経由を使用 / Use ScrollContext instead.
  | 'onScrollBeginDrag' // ScrollContext経由を使用 / Use ScrollContext instead.
  | 'onScrollEndDrag' // ScrollContext経由を使用 / Use ScrollContext instead.
  | 'refreshControl' // refreshing/onRefreshを代わりに使用 / Pass refreshing and/or onRefresh instead.
  | 'contentOffset' // headerOffsetを代わりに使用 / Pass headerOffset instead.
  | 'progressViewOffset' // アニメーション値にできない / Can't be an animated value
> & {
  /** スクロール位置変更時コールバック（下にスクロールしたかどうか） / Callback on scroll position change */
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  /** ヘッダーオフセット（固定ヘッダーの高さ） / Header offset (fixed header height) */
  headerOffset?: number
  /** リフレッシュ中かどうか / Whether refreshing */
  refreshing?: boolean
  /** プルリフレッシュ時のコールバック / Pull-to-refresh callback */
  onRefresh?: () => void
  /** アイテムが表示された時のコールバック（インプレッション計測等） / Callback when item becomes visible */
  onItemSeen?: (item: ItemT) => void
  /** デスクトップ固定高さ / Desktop fixed height */
  desktopFixedHeight?: number | boolean
  /** Web専用: ウィンドウ全体ではなくコンテナ内でスクロール / Web only: scroll within container */
  disableFullWindowScroll?: boolean
  /** サイドボーダー表示 / Show side borders */
  sideBorders?: boolean
  /** プログレスビューのオフセット / Progress view offset */
  progressViewOffset?: number
}

/**
 * Listのref型
 * List ref type
 */
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>

/**
 * スクロールダウン判定の閾値（ピクセル）
 * Threshold for scroll down detection (pixels)
 *
 * この値以上スクロールすると「下にスクロールした」と判定される
 */
const SCROLLED_DOWN_LIMIT = 200

let List = React.forwardRef<ListMethods, ListProps>(
  (
    {
      onScrolledDownChange,
      refreshing,
      onRefresh,
      onItemSeen,
      headerOffset,
      style,
      progressViewOffset,
      automaticallyAdjustsScrollIndicatorInsets = false,
      ...props
    },
    ref,
  ): React.ReactElement => {
    const isScrolledDown = useSharedValue(false)
    const t = useTheme()
    const dedupe = useDedupe(400)
    const {activeLightbox} = useLightbox()

    function handleScrolledDownChange(didScrollDown: boolean) {
      onScrolledDownChange?.(didScrollDown)
    }

    // Intentionally destructured outside the main thread closure.
    // See https://github.com/bluesky-social/social-app/pull/4108.
    const {
      onBeginDrag: onBeginDragFromContext,
      onEndDrag: onEndDragFromContext,
      onScroll: onScrollFromContext,
      onMomentumEnd: onMomentumEndFromContext,
    } = useScrollHandlers()
    const scrollHandler = useAnimatedScrollHandler({
      onBeginDrag(e, ctx) {
        onBeginDragFromContext?.(e, ctx)
      },
      onEndDrag(e, ctx) {
        runOnJS(updateActiveVideoViewAsync)()
        onEndDragFromContext?.(e, ctx)
      },
      onScroll(e, ctx) {
        onScrollFromContext?.(e, ctx)

        const didScrollDown = e.contentOffset.y > SCROLLED_DOWN_LIMIT
        if (isScrolledDown.get() !== didScrollDown) {
          isScrolledDown.set(didScrollDown)
          if (onScrolledDownChange != null) {
            runOnJS(handleScrolledDownChange)(didScrollDown)
          }
        }

        if (isIOS) {
          runOnJS(dedupe)(updateActiveVideoViewAsync)
        }
      },
      // Note: adding onMomentumBegin here makes simulator scroll
      // lag on Android. So either don't add it, or figure out why.
      onMomentumEnd(e, ctx) {
        runOnJS(updateActiveVideoViewAsync)()
        onMomentumEndFromContext?.(e, ctx)
      },
    })

    const [onViewableItemsChanged, viewabilityConfig] = React.useMemo(() => {
      if (!onItemSeen) {
        return [undefined, undefined]
      }
      return [
        (info: {
          viewableItems: Array<ViewToken>
          changed: Array<ViewToken>
        }) => {
          for (const item of info.changed) {
            if (item.isViewable) {
              onItemSeen(item.item)
            }
          }
        },
        {
          itemVisiblePercentThreshold: 40,
          minimumViewTime: 0.5e3,
        },
      ]
    }, [onItemSeen])

    let refreshControl
    if (refreshing !== undefined || onRefresh !== undefined) {
      refreshControl = (
        <RefreshControl
          key={t.atoms.text.color}
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
          tintColor={t.atoms.text.color}
          titleColor={t.atoms.text.color}
          progressViewOffset={progressViewOffset ?? headerOffset}
        />
      )
    }

    let contentOffset
    if (headerOffset != null) {
      style = addStyle(style, {
        paddingTop: headerOffset,
      })
      contentOffset = {x: 0, y: headerOffset * -1}
    }

    return (
      <FlatList_INTERNAL
        showsVerticalScrollIndicator // overridable
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        {...props}
        automaticallyAdjustsScrollIndicatorInsets={
          automaticallyAdjustsScrollIndicatorInsets
        }
        scrollIndicatorInsets={{
          top: headerOffset,
          right: 1,
          ...props.scrollIndicatorInsets,
        }}
        indicatorStyle={t.scheme === 'dark' ? 'white' : 'black'}
        contentOffset={contentOffset}
        refreshControl={refreshControl}
        onScroll={scrollHandler}
        scrollsToTop={!activeLightbox}
        scrollEventThrottle={1}
        style={style}
        // @ts-expect-error FlatList_INTERNAL ref type is wrong -sfn
        ref={ref}
      />
    )
  },
)
List.displayName = 'List'

List = memo(List)
export {List}
