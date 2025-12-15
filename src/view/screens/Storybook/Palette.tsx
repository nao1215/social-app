/**
 * @file Palette.tsx - カラーパレットの視覚表示
 * @description デザインシステムの全カラーバリエーションを表示するStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - カラーパレット: アプリ全体で使用する色の定義セット
 * - t.atoms.bg_contrast_*: テーマ対応の背景色（コントラスト段階付き）
 * - t.palette.*: 生のカラー値（primary, positive, negative各色相）
 *
 * ## 表示されるカラースケール
 * - contrast: 25〜975（グレースケール、13段階）
 * - primary: 25〜975（ブルー系、ブランドカラー）
 * - positive: 25〜975（グリーン系、成功/確認）
 * - negative: 25〜975（レッド系、エラー/削除）
 *
 * ## カラー段階の意味
 * - 25-100: 非常に薄い（背景のアクセント）
 * - 200-400: 薄い（ホバー状態、選択状態）
 * - 500: ベースカラー（メインの使用色）
 * - 600-800: 濃い（テキスト、アイコン）
 * - 900-975: 非常に濃い（強調、ダークモード用）
 *
 * @module view/screens/Storybook/Palette
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステム（atoms: 共通スタイル、useTheme: テーマフック）
import {atoms as a, useTheme} from '#/alf'

/**
 * Palette - カラーパレットの視覚表示
 *
 * contrast, primary, positive, negative の4つのカラースケールを
 * 横並びのカラーバーで視覚的に表示
 */
export function Palette() {
  const t = useTheme()
  return (
    <View style={[a.gap_md]}>
      <View style={[a.flex_row, a.gap_md]}>
        <View style={[a.flex_1, t.atoms.bg_contrast_25, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_50, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_100, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_200, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_300, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_400, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_500, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_600, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_700, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_800, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_900, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_950, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_975, {height: 60}]} />
      </View>

      <View style={[a.flex_row, a.gap_md]}>
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_25},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_50},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_100},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_200},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_300},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_400},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_500},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_600},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_700},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_800},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_900},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_950},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.primary_975},
          ]}
        />
      </View>
      <View style={[a.flex_row, a.gap_md]}>
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_25},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_50},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_100},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_200},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_300},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_400},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_500},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_600},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_700},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_800},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_900},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_950},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.positive_975},
          ]}
        />
      </View>
      <View style={[a.flex_row, a.gap_md]}>
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_25},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_50},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_100},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_200},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_300},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_400},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_500},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_600},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_700},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_800},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_900},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_950},
          ]}
        />
        <View
          style={[
            a.flex_1,
            {height: 60, backgroundColor: t.palette.negative_975},
          ]}
        />
      </View>
    </View>
  )
}
