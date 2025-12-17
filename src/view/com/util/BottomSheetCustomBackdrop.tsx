/**
 * ボトムシートカスタムバックドロップ
 * Bottom Sheet Custom Backdrop
 *
 * 【概要】
 * ボトムシート（下からスライドするモーダル）の背景をカスタマイズ。
 * 半透明の黒いオーバーレイで、タップで閉じる機能付き。
 *
 * 【動作】
 * 1. ボトムシートが開くとバックドロップが表示
 * 2. アニメーションで透明度が変化（閉じた状態: 0, 開いた状態: 0.5）
 * 3. バックドロップをタップするとonCloseが呼ばれる
 *
 * 【Goユーザー向け補足】
 * - interpolate: 数値の補間（GoのmathパッケージのLerp関数に相当）
 * - Extrapolation.CLAMP: 範囲外の値を境界値に制限
 * - useAnimatedStyle: アニメーション駆動のスタイル計算
 * - Factory Pattern: createCustomBackdropは関数を返す関数
 */

// Reactフック
// React hooks
import React, {useMemo} from 'react'

// React Nativeのタッチコンポーネント
// React Native touch component
import {TouchableWithoutFeedback} from 'react-native'

// React Native Reanimatedアニメーション
// React Native Reanimated animation
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'

// ボトムシートバックドロップのProps型
// Bottom sheet backdrop props type
import {BottomSheetBackdropProps} from '@discord/bottom-sheet/src'

// 国際化マクロ
// Internationalization macro
import {msg} from '@lingui/macro'

// 国際化フック
// Internationalization hook
import {useLingui} from '@lingui/react'

/**
 * カスタムバックドロップを作成するファクトリ関数
 * Factory function to create custom backdrop
 *
 * @param onClose 閉じる時のコールバック / Close callback
 * @returns バックドロップコンポーネント / Backdrop component
 */
export function createCustomBackdrop(
  onClose?: (() => void) | undefined,
): React.FC<BottomSheetBackdropProps> {
  const CustomBackdrop = ({animatedIndex, style}: BottomSheetBackdropProps) => {
    const {_} = useLingui()

    // animated variables
    const opacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        animatedIndex.get(), // current snap index
        [-1, 0], // input range
        [0, 0.5], // output range
        Extrapolation.CLAMP,
      ),
    }))

    const containerStyle = useMemo(
      () => [style, {backgroundColor: '#000'}, opacity],
      [style, opacity],
    )

    return (
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityLabel={_(msg`Close bottom drawer`)}
        accessibilityHint=""
        onAccessibilityEscape={() => {
          if (onClose !== undefined) {
            onClose()
          }
        }}>
        <Animated.View style={containerStyle} />
      </TouchableWithoutFeedback>
    )
  }
  return CustomBackdrop
}
