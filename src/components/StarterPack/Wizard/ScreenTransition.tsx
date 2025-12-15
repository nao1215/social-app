/**
 * @file スクリーン遷移アニメーションコンポーネント
 * @description ウィザード形式のUIで画面遷移時にアニメーションを提供するコンポーネント。
 *              前後のページ遷移に応じて適切なスライドアニメーションを適用します。
 */

// React: Reactライブラリ
import React from 'react'
// React Nativeのスタイル関連型定義
import {StyleProp, ViewStyle} from 'react-native'
// React Native Reanimated: 高性能アニメーションライブラリ
// Go開発者向け補足: Reanimatedはネイティブスレッドで動作する高性能アニメーションライブラリです
import Animated, {
  FadeIn, // フェードイン（徐々に表示）
  FadeOut, // フェードアウト（徐々に非表示）
  SlideInLeft, // 左からスライドイン
  SlideInRight, // 右からスライドイン
} from 'react-native-reanimated'

// プラットフォーム検出（Web判定）
import {isWeb} from '#/platform/detection'

/**
 * @component ScreenTransition
 * @description ウィザード画面の遷移アニメーションを提供するコンポーネント。
 *              遷移方向（前進/後退）に応じて異なるアニメーションを適用します。
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {'Backward' | 'Forward'} props.direction - 遷移方向（前進または後退）
 * @param {StyleProp<ViewStyle>} props.style - 追加のスタイル（オプショナル）
 * @param {React.ReactNode} props.children - 子要素（アニメーション対象のコンテンツ）
 * @returns {JSX.Element} アニメーション付きビュー
 *
 * Go開発者向け補足:
 * - React.ReactNodeはGoのinterface{}に似た概念で、あらゆるReact要素を表します
 * - StylePropはオプショナルなスタイル定義で、Goのポインタに似ています
 */
export function ScreenTransition({
  direction,
  style,
  children,
}: {
  direction: 'Backward' | 'Forward'
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  // 遷移方向に応じてエントリーアニメーションを選択
  // Forward（前進）: 右からスライドイン（次のページへ進む）
  // Backward（後退）: 左からスライドイン（前のページに戻る）
  const entering = direction === 'Forward' ? SlideInRight : SlideInLeft

  return (
    <Animated.View
      // エントリーアニメーション: Web環境ではフェードイン、ネイティブではスライド
      // Go開発者向け補足: 三項演算子（?:）はGoのif-else文に相当します
      entering={isWeb ? FadeIn.duration(90) : entering}
      // イグジットアニメーション: 常にフェードアウト（90ミリ秒）
      exiting={FadeOut.duration(90)} // Totally vibes based（感覚的に調整された値）
      style={style}>
      {children}
    </Animated.View>
  )
}
