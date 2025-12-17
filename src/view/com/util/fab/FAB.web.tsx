/**
 * FABコンポーネント（Web版）
 * FAB Component (Web Version)
 *
 * 【概要】
 * Web版のFAB。デスクトップでは非表示、モバイルWebでは表示。
 * デスクトップでは左サイドバーにナビゲーションがあるためFAB不要。
 *
 * 【表示条件】
 * - デスクトップWeb: 非表示（空のView）
 * - モバイルWeb: FABInnerを表示
 *
 * 【Goユーザー向け補足】
 * - useWebMediaQueries: CSSメディアクエリに相当するレスポンシブ判定
 * - isDesktop: 画面幅によるデスクトップ判定
 */

// React Nativeの基本コンポーネント
// React Native basic component
import {View} from 'react-native'

// Webメディアクエリフック
// Web media queries hook
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

// FAB内部コンポーネント
// FAB inner component
import {FABInner, FABProps} from './FABInner'

/**
 * FABコンポーネント（Web版）
 * FAB Component (Web Version)
 *
 * デスクトップでは非表示、モバイルWebでは表示
 */
export const FAB = (_opts: FABProps) => {
  const {isDesktop} = useWebMediaQueries()

  // デスクトップでは非表示
  // Hide on desktop
  if (!isDesktop) {
    return <FABInner {..._opts} />
  }

  // 空のViewを返す（レイアウト維持用）
  // Return empty View (for layout consistency)
  return <View />
}
