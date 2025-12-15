/**
 * コンテキストメニュー用背景コンポーネント（デフォルト実装）
 *
 * このファイルはAndroidおよびWeb用のデフォルト背景実装です。
 * iOS版（Backdrop.ios.tsx）とは異なり、BlurViewを使用せず透明度のみで実装されています。
 *
 * プラットフォーム分離の仕組み:
 * - Backdrop.ios.tsx: iOSで使用（BlurView対応）
 * - Backdrop.tsx: Android/Webで使用（透明度ベース）
 *
 * 主な機能:
 * - モードに応じた透明度調整（full/auxiliary-only）
 * - アニメーション対応の背景表示
 * - アクセシビリティ対応（スクリーンリーダー対応）
 *
 * @module ContextMenu/Backdrop (Default)
 */

// React Native標準コンポーネント（タップ可能な領域）
import {Pressable} from 'react-native'
// アニメーションライブラリ - 60FPSの滑らかなアニメーション
import Animated, {
  Extrapolation, // 補間範囲外の動作を定義
  interpolate, // 値のマッピング関数
  type SharedValue, // UIスレッドで共有される値（Goのポインタに類似）
  useAnimatedStyle, // アニメーション化されたスタイルフック
} from 'react-native-reanimated'
// 国際化マクロ - ビルド時翻訳抽出
import {msg} from '@lingui/macro'
// 国際化フック - 実行時翻訳
import {useLingui} from '@lingui/react'

// デザインシステム（アトミックスタイル + テーマ）
import {atoms as a, useTheme} from '#/alf'
// コンテキストメニューの状態管理
import {useContextMenuContext} from './context'

/**
 * コンテキストメニューの背景コンポーネント
 *
 * モードに応じて異なる透明度を適用:
 * - full: intensity/100（デフォルト50% = 0.5）
 * - auxiliary-only: 0.05（5%の透明度）
 *
 * iOS版と異なり、ブラー効果を使用せず透明度のみで実装されています。
 * これにより、すべてのプラットフォームで一貫した動作を保証します。
 *
 * @param animation - アニメーション進行度を保持するSharedValue（0〜1）
 * @param intensity - ブラー強度の代わりに使用される透明度（デフォルト: 50）
 * @param onPress - 背景タップ時のコールバック（メニューを閉じる）
 */
export function Backdrop({
  animation,
  intensity = 50,
  onPress,
}: {
  animation: SharedValue<number>
  intensity?: number
  onPress?: () => void
}) {
  // テーマオブジェクトを取得（ライト/ダークモード）
  const t = useTheme()
  // 翻訳関数を取得
  const {_} = useLingui()
  // コンテキストメニューのモードを取得
  const {mode} = useContextMenuContext()

  // 補助モードかどうかを判定
  const reduced = mode === 'auxiliary-only'

  /**
   * 目標の透明度を計算:
   * - reduced=true: 0.05（5%）
   * - reduced=false: intensity/100（例: 50/100=0.5 → 50%）
   */
  const target = reduced ? 0.05 : intensity / 100

  /**
   * useAnimatedStyle:
   * React Hook（Goにはない概念）で、アニメーション化されたスタイルを作成。
   * workletとして実行されるため、メインスレッドをブロックしません。
   *
   * interpolate:
   * animation値（0〜1）をopacity値（0〜target）にマッピング
   * 例: animation=0.5, target=0.5 → opacity=0.25
   */
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animation.get(), // 現在のアニメーション進行度を取得
      [0, 1], // 入力範囲（閉じた状態〜開いた状態）
      [0, target], // 出力範囲（完全透明〜目標透明度）
      Extrapolation.CLAMP, // 範囲外の値を制限（負の値や1超過を防ぐ）
    ),
  }))

  return (
    <Animated.View
      style={[a.absolute, a.inset_0, t.atoms.bg_contrast_975, animatedStyle]}>
      {/* 画面全体を覆うタップ可能な領域 */}
      <Pressable
        style={a.flex_1}
        accessibilityLabel={_(msg`Close menu`)}
        accessibilityHint={_(msg`Tap to close context menu`)}
        onPress={onPress}
      />
    </Animated.View>
  )
}
