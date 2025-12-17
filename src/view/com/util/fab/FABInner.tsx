/**
 * FAB（Floating Action Button）内部コンポーネント
 * FAB (Floating Action Button) Inner Component
 *
 * 【概要】
 * 画面右下に浮遊する円形のアクションボタン。
 * Material Designのパターンに基づく主要アクションボタン。
 *
 * 【使用場面】
 * - フィード画面: 新規投稿作成ボタン
 * - チャット画面: 新規チャット開始ボタン
 *
 * 【機能】
 * - ハプティックフィードバック（タップ時の振動）
 * - スケールアニメーション（押下時に縮小）
 * - グラデーション背景
 * - Safe Area対応（ノッチ/ホームバー回避）
 * - ミニマルシェルモードでの変形
 *
 * 【Goユーザー向け補足】
 * - Animated: React Native Reanimatedによるアニメーション
 * - useSafeAreaInsets: デバイスの安全領域取得（ノッチ等）
 * - LinearGradient: グラデーション背景（CSSのlinear-gradientに相当）
 * - useHaptics: バイブレーションフィードバック
 */

// Reactの型
// React types
import {ComponentProps} from 'react'

// React Nativeの基本コンポーネント
// React Native basic components
import {StyleSheet, TouchableWithoutFeedback} from 'react-native'

// React Native Reanimatedアニメーション
// React Native Reanimated animation
import Animated from 'react-native-reanimated'

// Safe Area取得フック
// Safe area insets hook
import {useSafeAreaInsets} from 'react-native-safe-area-context'

// グラデーションコンポーネント
// Linear gradient component
import {LinearGradient} from 'expo-linear-gradient'

// スケールアニメーション対応Pressable
// Pressable with scale animation
import {PressableScale} from '#/lib/custom-animations/PressableScale'

// ハプティックフィードバックフック
// Haptic feedback hook
import {useHaptics} from '#/lib/haptics'

// ミニマルシェルFAB変形フック
// Minimal shell FAB transform hook
import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'

// Webメディアクエリフック
// Web media queries hook
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

// 数値クランプユーティリティ
// Number clamp utility
import {clamp} from '#/lib/numbers'

// グラデーション定義
// Gradient definitions
import {gradients} from '#/lib/styles'

// プラットフォーム検出
// Platform detection
import {isWeb} from '#/platform/detection'

// iOS専用ヘルパー
// iOS-only helper
import {ios} from '#/alf'

/**
 * FABコンポーネントのProps型
 * FAB Component Props type
 */
export interface FABProps
  extends ComponentProps<typeof TouchableWithoutFeedback> {
  /** テストID / Test ID */
  testID?: string
  /** 表示するアイコン / Icon to display */
  icon: JSX.Element
}

/**
 * FAB内部コンポーネント
 * FAB Inner Component
 *
 * @param testID テストID / Test ID
 * @param icon 表示するアイコン / Icon to display
 * @param onPress 押下時のコールバック / Press callback
 */
export function FABInner({testID, icon, onPress, ...props}: FABProps) {
  const insets = useSafeAreaInsets()
  const {isMobile, isTablet} = useWebMediaQueries()
  const playHaptic = useHaptics()
  const fabMinimalShellTransform = useMinimalShellFabTransform()

  const size = isTablet ? styles.sizeLarge : styles.sizeRegular

  const tabletSpacing = isTablet
    ? {right: 50, bottom: 50}
    : {right: 24, bottom: clamp(insets.bottom, 15, 60) + 15}

  return (
    <Animated.View
      style={[
        styles.outer,
        size,
        tabletSpacing,
        isMobile && fabMinimalShellTransform,
      ]}>
      <PressableScale
        testID={testID}
        onPressIn={ios(() => playHaptic('Light'))}
        onPress={evt => {
          onPress?.(evt)
          playHaptic('Light')
        }}
        onLongPress={ios((evt: any) => {
          onPress?.(evt)
          playHaptic('Heavy')
        })}
        targetScale={0.9}
        {...props}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.inner, size]}>
          {icon}
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  sizeRegular: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sizeLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  outer: {
    // @ts-ignore web-only
    position: isWeb ? 'fixed' : 'absolute',
    zIndex: 1,
    cursor: 'pointer',
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
