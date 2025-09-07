// React Nativeのウィンドウサイズ取得フックをインポート
// Import React Native window dimensions hook
import {useWindowDimensions} from 'react-native'
// セーフエリアのインセット情報を取得するフックをインポート
// Import safe area insets hook
import {useSafeAreaInsets} from 'react-native-safe-area-context'

// ボトムバーのオフセットを取得するカスタムフックをインポート
// Import custom hook to get bottom bar offset
import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'

// 投稿の最小高さ（ピクセル）
// Minimum post height in pixels
const MIN_POST_HEIGHT = 100

/**
 * 初回レンダリング時に表示するアイテム数を計算するカスタムフック
 * Custom hook to calculate the number of items to render initially
 * FlatListの初回レンダリングパフォーマンスを最適化するために使用
 * Used to optimize FlatList initial rendering performance
 * @param options オプション設定 / Option settings
 * @returns 初回レンダリングするアイテム数 / Number of items to render initially
 */
export function useInitialNumToRender({
  minItemHeight = MIN_POST_HEIGHT, // アイテムの最小高さ / Minimum item height
  screenHeightOffset = 0, // 画面高さのオフセット / Screen height offset
}: {minItemHeight?: number; screenHeightOffset?: number} = {}) {
  // 画面の幅と高さを取得
  // Get screen width and height
  const {height: screenHeight} = useWindowDimensions()
  // セーフエリアのインセット情報を取得（上部のみ）
  // Get safe area insets (top only)
  const {top: topInset} = useSafeAreaInsets()
  // ボトムバーの高さを取得
  // Get bottom bar height
  const bottomBarHeight = useBottomBarOffset()

  // 実際にコンテンツ表示に使用できる高さを計算
  // Calculate the actual height available for content display
  const finalHeight =
    screenHeight - screenHeightOffset - topInset - bottomBarHeight

  // 最小アイテム高さに基づいて表示可能なアイテム数を計算
  // Calculate the number of items that can be displayed based on minimum item height
  const minItems = Math.floor(finalHeight / minItemHeight)
  // 最低1アイテムは表示するように保証
  // Ensure at least 1 item is displayed
  if (minItems < 1) {
    return 1
  }
  return minItems
}
