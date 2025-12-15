/**
 * @file Spacing.tsx - スペーシングスケールのカタログ
 * @description デザインシステムの余白（padding, margin, gap）スケールを表示するStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - スペーシング: UI要素間の余白を統一するためのサイズスケール
 * - 8pxグリッド: 基本単位を8pxとし、2xs〜5xlまで段階的に定義
 * - atoms.pt_*: padding-topのショートハンド（p_* はpadding全体）
 *
 * ## 表示されるスペーシング
 * - 2xs: 2px（極小余白、ボーダー付近）
 * - xs: 4px（小さい余白、アイコン周り）
 * - sm: 8px（標準的な小余白）
 * - md: 12px（中程度の余白）
 * - lg: 16px（標準的な余白）
 * - xl: 20px（大きめの余白）
 * - 2xl: 24px（セクション間）
 * - 3xl: 28px（大セクション間）
 * - 4xl: 32px（画面上下端）
 * - 5xl: 40px（特大余白）
 *
 * ## アーキテクチャ
 * - 各スペーシングをバー表示で視覚的に比較
 * - サイズ名とピクセル値を並べて表示
 *
 * @module view/screens/Storybook/Spacing
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステム（atoms: 共通スタイル、useTheme: テーマフック）
import {atoms as a, useTheme} from '#/alf'
// 見出し・テキストコンポーネント
import {H1, Text} from '#/components/Typography'

/**
 * Spacing - スペーシングスケールのカタログ表示
 *
 * 2xs〜5xl の10段階のスペーシングを
 * バーの高さで視覚的に比較できる
 */
export function Spacing() {
  const t = useTheme()
  return (
    <View style={[a.gap_md]}>
      <H1>Spacing</H1>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>2xs (2px)</Text>
        <View style={[a.flex_1, a.pt_2xs, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>xs (4px)</Text>
        <View style={[a.flex_1, a.pt_xs, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>sm (8px)</Text>
        <View style={[a.flex_1, a.pt_sm, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>md (12px)</Text>
        <View style={[a.flex_1, a.pt_md, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>lg (16px)</Text>
        <View style={[a.flex_1, a.pt_lg, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>xl (20px)</Text>
        <View style={[a.flex_1, a.pt_xl, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>2xl (24px)</Text>
        <View style={[a.flex_1, a.pt_2xl, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>3xl (28px)</Text>
        <View style={[a.flex_1, a.pt_3xl, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>4xl (32px)</Text>
        <View style={[a.flex_1, a.pt_4xl, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>5xl (40px)</Text>
        <View style={[a.flex_1, a.pt_5xl, t.atoms.bg_contrast_300]} />
      </View>
    </View>
  )
}
