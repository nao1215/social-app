/**
 * @file Breakpoints.tsx - ブレイクポイントデバッガー
 * @description レスポンシブデザインのブレイクポイント状態を確認するStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - ブレイクポイント: 画面幅に応じてレイアウトを切り替える基準値
 * - useBreakpoints: 現在の画面サイズに基づくブレイクポイントフラグを取得
 * - gtMobile, gtTablet: 「Mobile より大きい」「Tablet より大きい」のフラグ
 *
 * ## 表示される情報
 * - 現在のブレイクポイント名: mobile, tablet, desktop
 * - ブレイクポイントオブジェクトのJSON表示
 *
 * ## ブレイクポイント定義
 * - mobile: 〜599px（スマートフォン）
 * - tablet: 600px〜899px（タブレット）
 * - desktop: 900px〜（デスクトップ）
 *
 * ## アーキテクチャ
 * - useBreakpoints() が画面サイズ変更を監視
 * - 条件分岐で現在のブレイクポイント名を表示
 * - JSON.stringify でデバッグ用に全フラグを表示
 *
 * @module view/screens/Storybook/Breakpoints
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステム（atoms: 共通スタイル、useBreakpoints: ブレイクポイントフック）
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
// 見出し・テキストコンポーネント
import {H3, Text} from '#/components/Typography'

/**
 * Breakpoints - ブレイクポイントデバッガー表示
 *
 * 現在の画面サイズがどのブレイクポイントに該当するかを
 * リアルタイムで確認できる開発者向けツール
 */
export function Breakpoints() {
  const t = useTheme()
  const breakpoints = useBreakpoints()

  return (
    <View>
      <H3 style={[a.pb_md]}>Breakpoint Debugger</H3>
      <Text style={[a.pb_md]}>
        Current breakpoint: {!breakpoints.gtMobile && <Text>mobile</Text>}
        {breakpoints.gtMobile && !breakpoints.gtTablet && <Text>tablet</Text>}
        {breakpoints.gtTablet && <Text>desktop</Text>}
      </Text>
      <Text
        style={[a.p_md, t.atoms.bg_contrast_100, {fontFamily: 'monospace'}]}>
        {JSON.stringify(breakpoints, null, 2)}
      </Text>
    </View>
  )
}
