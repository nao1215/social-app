/**
 * コンテキストメニュー用背景コンポーネント（iOS専用実装）
 *
 * このファイルはiOS専用の背景実装で、BlurViewを使用したブラー効果を提供します。
 * React Nativeのプラットフォーム分離により、.ios.tsxファイルはiOSでのみ使用されます。
 *
 * 主な機能:
 * - フルモード: BlurView（ガラス効果）を使用した背景
 * - 補助モード: 透明度ベースの背景
 * - アニメーション対応の背景表示
 *
 * @module ContextMenu/Backdrop (iOS)
 */

// React Native標準コンポーネント（タップ可能な領域）
import {Pressable} from 'react-native'
// アニメーションライブラリ - workletベースの高性能アニメーション
import Animated, {
  Extrapolation, // 補間の外挿方法を定義（CLAMP: 範囲外の値を制限）
  interpolate, // 値の範囲を別の範囲にマッピング（アニメーション用）
  type SharedValue, // workletスレッドで共有される値の型（Goのポインタに類似）
  useAnimatedProps, // アニメーション化されたプロパティを作成（再レンダリングなし）
  useAnimatedStyle, // アニメーション化されたスタイルを作成（UIスレッドで実行）
} from 'react-native-reanimated'
// Expo提供のブラー（ぼかし）エフェクトコンポーネント（iOS/Androidネイティブ機能）
import {BlurView} from 'expo-blur'
// 国際化マクロ - ビルド時に翻訳文字列を抽出
import {msg} from '@lingui/macro'
// 国際化フック - 翻訳関数を提供
import {useLingui} from '@lingui/react'

// デザインシステムのアトミックスタイルとテーマフック
import {atoms as a, useTheme} from '#/alf'
// コンテキストメニューの状態を取得するフック
import {useContextMenuContext} from './context'

// BlurViewをアニメーション対応にする（Animated.createAnimatedComponentでラップ）
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

/**
 * Propsの型定義（Goのstructに相当）
 *
 * @property animation - アニメーション進行度（0〜1）を保持するSharedValue
 * @property intensity - ブラー強度（デフォルト: 50）
 * @property onPress - 背景タップ時のコールバック
 */
type Props = {
  animation: SharedValue<number>
  intensity?: number
  onPress?: () => void
}

/**
 * コンテキストメニューの背景コンポーネント
 *
 * モードに応じて適切な背景を表示:
 * - full: ブラーエフェクト背景（iOS標準のガラス効果）
 * - auxiliary-only: 透明度ベースの軽量背景
 *
 * @param props - コンポーネントのプロパティ
 * @returns モードに応じた背景コンポーネント
 */
export function Backdrop(props: Props) {
  // コンテキストからモードを取得
  const {mode} = useContextMenuContext()
  switch (mode) {
    case 'full':
      // フルモード時はブラー背景を使用
      return <BlurredBackdrop {...props} />
    case 'auxiliary-only':
      // 補助モード時は透明度背景を使用
      return <OpacityBackdrop {...props} />
  }
}

/**
 * ブラーエフェクトを使用した背景コンポーネント（iOSネイティブ機能）
 *
 * iOS標準のガラス効果（Material Design）を使用して背景をぼかします。
 * アニメーションに応じてブラー強度が0から指定値まで変化します。
 *
 * @param animation - アニメーション進行度（0〜1）
 * @param intensity - 最大ブラー強度（デフォルト: 50）
 * @param onPress - タップ時のコールバック（通常はメニューを閉じる）
 */
function BlurredBackdrop({animation, intensity = 50, onPress}: Props) {
  // 翻訳関数を取得
  const {_} = useLingui()

  /**
   * useAnimatedProps:
   * React Hook（Goにはない概念）で、アニメーション化されたプロパティを作成。
   * workletスレッドで実行されるため、JavaScriptスレッドをブロックしません。
   *
   * interpolate:
   * animation値（0〜1）をintensity値（0〜intensity）にマッピング
   * 例: animation=0.5, intensity=50 → 25
   */
  const animatedProps = useAnimatedProps(() => ({
    intensity: interpolate(
      animation.get(), // 現在のアニメーション値を取得
      [0, 1], // 入力範囲（0%〜100%）
      [0, intensity], // 出力範囲（ブラー強度0〜intensity）
      Extrapolation.CLAMP, // 範囲外の値を制限（0未満→0、1超過→intensity）
    ),
  }))

  return (
    <AnimatedBlurView
      animatedProps={animatedProps}
      style={[a.absolute, a.inset_0]} // 画面全体を覆う絶対配置
      tint="systemMaterialDark"> {/* iOS標準のダークマテリアル */}
      <Pressable
        style={a.flex_1}
        accessibilityLabel={_(msg`Close menu`)}
        accessibilityHint={_(msg`Tap to close context menu`)}
        onPress={onPress}
      />
    </AnimatedBlurView>
  )
}

/**
 * 透明度ベースの背景コンポーネント（軽量版）
 *
 * ブラーエフェクトを使用せず、透明度のみで背景を表現します。
 * 補助表示モード（auxiliary-only）で使用され、パフォーマンスが重視されます。
 *
 * @param animation - アニメーション進行度（0〜1）
 * @param onPress - タップ時のコールバック
 */
function OpacityBackdrop({animation, onPress}: Props) {
  // テーマオブジェクトを取得（ダーク/ライトモード対応）
  const t = useTheme()
  const {_} = useLingui()

  /**
   * useAnimatedStyle:
   * React Hookで、UIスレッドで実行されるアニメーション化されたスタイルを作成。
   * 通常のuseStateと異なり、再レンダリングを引き起こしません。
   *
   * 透明度を0（完全透明）から0.05（5%の透明度）にアニメーション
   */
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animation.get(),
      [0, 1], // アニメーション進行度
      [0, 0.05], // 透明度（0%〜5%）
      Extrapolation.CLAMP,
    ),
  }))

  return (
    <Animated.View
      style={[a.absolute, a.inset_0, t.atoms.bg_contrast_975, animatedStyle]}>
      <Pressable
        style={a.flex_1}
        accessibilityLabel={_(msg`Close menu`)}
        accessibilityHint={_(msg`Tap to close context menu`)}
        onPress={onPress}
      />
    </Animated.View>
  )
}
