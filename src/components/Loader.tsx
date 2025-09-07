import React from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'                                   // アニメーション機能

import {atoms as a, flatten, useTheme} from '#/alf'                 // テーマ・スタイル
import {Props, useCommonSVGProps} from '#/components/icons/common'  // アイコン共通プロパティ
import {Loader_Stroke2_Corner0_Rounded as Icon} from '#/components/icons/Loader'  // ローダーアイコン

/**
 * 回転アニメーション付きのローディングスピナーコンポーネント
 * データ読み込み中や処理中であることを視覚的に表示する
 * 
 * @param props - アイコンのプロパティ（サイズ、スタイルなど）
 */
export function Loader(props: Props) {
  const t = useTheme()                        // 現在のテーマ取得
  const common = useCommonSVGProps(props)     // SVGアイコン共通プロパティ
  const rotation = useSharedValue(0)          // 回転角度のアニメーション値

  // 回転アニメーションのスタイル定義
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{rotate: rotation.get() + 'deg'}],  // 現在の回転角度を適用
  }))

  // コンポーネントマウント時にアニメーション開始
  React.useEffect(() => {
    rotation.set(() =>
      withRepeat(
        withTiming(360, {duration: 500, easing: Easing.linear}),  // 0.5秒で360度回転
        -1  // 無限リピート
      )
    )
  }, [rotation])

  return (
    <Animated.View
      style={[
        a.relative,                                // 相対位置
        a.justify_center,                          // 縦方向中央揃え
        a.align_center,                            // 横方向中央揃え
        {width: common.size, height: common.size}, // アイコンサイズに合わせたコンテナサイズ
        animatedStyles,                            // 回転アニメーション適用
      ]}>
      <Icon
        {...props}
        style={[
          a.absolute,                    // 絶対位置
          a.inset_0,                     // 上下左右0で配置
          t.atoms.text_contrast_high,    // 高コントラストテキスト色
          flatten(props.style),          // 外部から渡されたスタイル
        ]}
      />
    </Animated.View>
  )
}
