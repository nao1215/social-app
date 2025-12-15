/**
 * @file Icons.tsx - アイコンコンポーネントのカタログ
 * @description デザインシステムのアイコンとサイズバリエーションを表示するStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - SVGアイコン: ベクター形式の画像（Goのテンプレートで埋め込むSVGと同様）
 * - サイズバリエーション: xs, sm, md, lg, xl の5段階
 * - テーマ対応: fill属性でテーマカラーを適用（ダークモード対応）
 * - グラデーション: gradient="sky" でグラデーション塗りを適用
 *
 * ## 表示されるアイコン
 * - Globe: 地球アイコン（言語選択、公開設定等に使用）
 * - ArrowTopRight: 右上矢印（外部リンク表示に使用）
 * - CalendarDays: カレンダー（日付選択に使用）
 * - Loader: ローディングスピナー（読み込み中表示）
 *
 * ## アーキテクチャ
 * - 各アイコンを全サイズ並べて表示（視覚的比較用）
 * - useTheme() でテーマカラーを取得して fill に適用
 * - Loader はアニメーション付き（回転スピナー）
 *
 * @module view/screens/Storybook/Icons
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステム（atoms: スタイル、useTheme: テーマフック）
import {atoms as a, useTheme} from '#/alf'
// アイコンコンポーネント群
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRight} from '#/components/icons/Arrow'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarDays} from '#/components/icons/CalendarDays'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
// ローディングスピナーコンポーネント
import {Loader} from '#/components/Loader'
// 見出しコンポーネント
import {H1} from '#/components/Typography'

/**
 * Icons - アイコンコンポーネントのカタログ表示
 *
 * 各アイコンの全サイズバリエーション（xs〜xl）と
 * グラデーション塗りオプションを視覚的に確認できる
 */
export function Icons() {
  const t = useTheme()
  return (
    <View style={[a.gap_md]}>
      <H1>Icons</H1>

      <View style={[a.flex_row, a.gap_xl]}>
        <Globe size="xs" fill={t.atoms.text.color} />
        <Globe size="sm" fill={t.atoms.text.color} />
        <Globe size="md" fill={t.atoms.text.color} />
        <Globe size="lg" fill={t.atoms.text.color} />
        <Globe size="xl" fill={t.atoms.text.color} />
      </View>

      <View style={[a.flex_row, a.gap_xl]}>
        <ArrowTopRight size="xs" fill={t.atoms.text.color} />
        <ArrowTopRight size="sm" fill={t.atoms.text.color} />
        <ArrowTopRight size="md" fill={t.atoms.text.color} />
        <ArrowTopRight size="lg" fill={t.atoms.text.color} />
        <ArrowTopRight size="xl" fill={t.atoms.text.color} />
      </View>

      <View style={[a.flex_row, a.gap_xl]}>
        <CalendarDays size="xs" fill={t.atoms.text.color} />
        <CalendarDays size="sm" fill={t.atoms.text.color} />
        <CalendarDays size="md" fill={t.atoms.text.color} />
        <CalendarDays size="lg" fill={t.atoms.text.color} />
        <CalendarDays size="xl" fill={t.atoms.text.color} />
      </View>

      <View style={[a.flex_row, a.gap_xl]}>
        <Loader size="xs" fill={t.atoms.text.color} />
        <Loader size="sm" fill={t.atoms.text.color} />
        <Loader size="md" fill={t.atoms.text.color} />
        <Loader size="lg" fill={t.atoms.text.color} />
        <Loader size="xl" fill={t.atoms.text.color} />
      </View>

      <View style={[a.flex_row, a.gap_xl]}>
        <Globe size="xs" gradient="sky" />
        <Globe size="sm" gradient="sky" />
        <Globe size="md" gradient="sky" />
        <Globe size="lg" gradient="sky" />
        <Globe size="xl" gradient="sky" />
      </View>
    </View>
  )
}
