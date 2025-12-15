/**
 * @file Typography.tsx - タイポグラフィカタログ
 * @description デザインシステムのテキストスタイルを網羅的に表示するStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - タイポグラフィ: テキストのスタイル体系（フォントサイズ、太さ、スタイル）
 * - atoms: デザインシステムのスタイルプリミティブ（CSSのユーティリティクラスに相当）
 * - RichText: メンションやリンクを含むリッチテキスト（HTMLのようなマークアップ）
 *
 * ## 表示されるバリエーション
 * - フォントサイズ: text_5xl〜text_2xs（特大〜極小）
 * - フォントウェイト: regular, medium, bold, heavy
 * - フォントスタイル: normal, italic
 * - RichText: メンション（@bsky.app）、リンク（https://）の自動検出
 *
 * ## アーキテクチャ
 * - 各スタイルの実際の表示を確認できるサンプルテキスト
 * - atoms スタイルの適用例をそのまま表示
 * - selectable プロパティでテキスト選択機能のデモ
 *
 * @module view/screens/Storybook/Typography
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステムのスタイルプリミティブ
import {atoms as a} from '#/alf'
// リッチテキストコンポーネント（メンション、リンクの自動リンク化）
import {RichText} from '#/components/RichText'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * Typography - タイポグラフィのカタログ表示
 *
 * 全てのテキストスタイル（サイズ × ウェイト × スタイル）を
 * 視覚的に確認できるサンプル集
 */
export function Typography() {
  return (
    <View style={[a.gap_md]}>
      <Text selectable style={[a.text_5xl]}>
        atoms.text_5xl
      </Text>
      <Text style={[a.text_4xl]}>atoms.text_4xl</Text>
      <Text style={[a.text_3xl]}>atoms.text_3xl</Text>
      <Text style={[a.text_2xl]}>atoms.text_2xl</Text>
      <Text style={[a.text_xl]}>atoms.text_xl</Text>
      <Text style={[a.text_lg]}>atoms.text_lg</Text>
      <Text style={[a.text_md]}>atoms.text_md</Text>
      <Text style={[a.text_sm]}>atoms.text_sm</Text>
      <Text style={[a.text_xs]}>atoms.text_xs</Text>
      <Text style={[a.text_2xs]}>atoms.text_2xs</Text>

      <Text style={[a.text_xl]}>This is regular text</Text>
      <Text style={[a.text_xl, a.italic]}>This is regular italic text</Text>
      <Text style={[a.text_xl, a.font_medium]}>This is medium text</Text>
      <Text style={[a.text_xl, a.font_medium, a.italic]}>
        This is medium italic text
      </Text>
      <Text style={[a.text_xl, a.font_bold]}>This is bold text</Text>
      <Text style={[a.text_xl, a.font_bold, a.italic]}>
        This is bold italic text
      </Text>
      <Text style={[a.text_xl, a.font_heavy]}>This is heavy text</Text>
      <Text style={[a.text_xl, a.font_heavy, a.italic]}>
        This is heavy italic text
      </Text>

      <RichText
        // TODO: This only supports already resolved facets.
        // Resolving them on read is bad anyway.
        value={`This is rich text. It can have mentions like @bsky.app or links like https://bsky.social`}
      />
      <RichText
        selectable
        // TODO: This only supports already resolved facets.
        // Resolving them on read is bad anyway.
        value={`This is rich text. It can have mentions like @bsky.app or links like https://bsky.social`}
        style={[a.text_xl]}
      />
    </View>
  )
}
