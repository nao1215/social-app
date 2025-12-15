/**
 * @file Theming.tsx - テーマカラーのカタログ
 * @description デザインシステムのテーマカラー（背景、テキスト、ボーダー）を表示するStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - テーマ: ライト/ダーク/Dimモード対応のカラーセット
 * - atoms: デザインシステムのスタイルプリミティブ（共通スタイル）
 * - t.atoms: テーマ依存のスタイル（bg, text_contrast_* 等）
 *
 * ## 表示されるカラー
 * - テキストカラー: text, text_contrast_high/medium/low
 * - 背景カラー: bg, bg_contrast_25/50/100/200/300
 * - ボーダーカラー: border_contrast_high/medium/low
 *
 * ## アーキテクチャ
 * - useTheme() でテーマオブジェクトを取得
 * - Palette コンポーネントでカラーパレット詳細を表示
 * - 各コントラストレベルを視覚的に比較可能
 *
 * @module view/screens/Storybook/Theming
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステム（atoms: 共通スタイル、useTheme: テーマフック）
import {atoms as a, useTheme} from '#/alf'
// テキストコンポーネント
import {Text} from '#/components/Typography'
// カラーパレット詳細表示コンポーネント
import {Palette} from './Palette'

/**
 * Theming - テーマカラーのカタログ表示
 *
 * テキスト、背景、ボーダーの各コントラストレベルを
 * 視覚的に確認できるサンプル集
 */
export function Theming() {
  const t = useTheme()

  return (
    <View style={[t.atoms.bg, a.gap_lg, a.p_xl]}>
      <Palette />

      <Text style={[a.font_bold, a.pt_xl, a.px_md]}>theme.atoms.text</Text>

      <View style={[a.flex_1, t.atoms.border_contrast_high, a.border_t]} />
      <Text style={[a.font_bold, t.atoms.text_contrast_high, a.px_md]}>
        theme.atoms.text_contrast_high
      </Text>

      <View style={[a.flex_1, t.atoms.border_contrast_medium, a.border_t]} />
      <Text style={[a.font_bold, t.atoms.text_contrast_medium, a.px_md]}>
        theme.atoms.text_contrast_medium
      </Text>

      <View style={[a.flex_1, t.atoms.border_contrast_low, a.border_t]} />
      <Text style={[a.font_bold, t.atoms.text_contrast_low, a.px_md]}>
        theme.atoms.text_contrast_low
      </Text>

      <View style={[a.flex_1, t.atoms.border_contrast_low, a.border_t]} />

      <View style={[a.w_full, a.gap_md]}>
        <View style={[t.atoms.bg, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg</Text>
        </View>
        <View style={[t.atoms.bg_contrast_25, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_25</Text>
        </View>
        <View style={[t.atoms.bg_contrast_50, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_50</Text>
        </View>
        <View style={[t.atoms.bg_contrast_100, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_100</Text>
        </View>
        <View style={[t.atoms.bg_contrast_200, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_200</Text>
        </View>
        <View style={[t.atoms.bg_contrast_300, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_300</Text>
        </View>
      </View>
    </View>
  )
}
