/**
 * @file Admonitions.tsx - 警告/注意/情報ボックスのカタログ
 * @description ユーザーへの注意喚起UIコンポーネントを表示するStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - Admonition: 重要なメッセージを目立たせるボックス（ドキュメントの「Note」「Warning」に相当）
 * - type プロパティ: メッセージの種類に応じた色とアイコンを適用
 * - 子要素にテキストやリンクを含めることが可能
 *
 * ## 表示されるタイプ
 * - default: 標準メッセージ（特に強調なし）
 * - info: 情報メッセージ（青色、情報アイコン）
 * - tip: ヒントメッセージ（緑色、電球アイコン）
 * - warning: 警告メッセージ（黄色、警告アイコン）
 * - error: エラーメッセージ（赤色、エラーアイコン）
 *
 * ## アーキテクチャ
 * - 各タイプを並べて視覚的に比較
 * - info タイプにはインラインリンクの例を含む
 * - サンプルテキストには "The quick brown fox..." を使用
 *
 * @module view/screens/Storybook/Admonitions
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステムのスタイルプリミティブ
import {atoms as a} from '#/alf'
// 警告/注意/情報ボックスコンポーネント
import {Admonition} from '#/components/Admonition'
// インラインリンクコンポーネント
import {InlineLinkText} from '#/components/Link'
// 見出しコンポーネント
import {H1} from '#/components/Typography'

/**
 * Admonitions - 警告/注意/情報ボックスのカタログ表示
 *
 * default, info, tip, warning, error の5タイプを
 * 並べて視覚的に比較できる
 */
export function Admonitions() {
  return (
    <View style={[a.gap_md]}>
      <H1>Admonitions</H1>

      <Admonition>The quick brown fox jumps over the lazy dog.</Admonition>
      <Admonition type="info">
        How happy the blameless vestal's lot, the world forgetting by the world
        forgot.{' '}
        <InlineLinkText
          label="test"
          to="https://letterboxd.com/film/eternal-sunshine-of-the-spotless-mind/">
          Eternal sunshine of the spotless mind
        </InlineLinkText>
        ! Each pray'r accepted, and each wish resign'd.
      </Admonition>
      <Admonition type="tip">
        The quick brown fox jumps over the lazy dog.
      </Admonition>
      <Admonition type="warning">
        The quick brown fox jumps over the lazy dog.
      </Admonition>
      <Admonition type="error">
        The quick brown fox jumps over the lazy dog.
      </Admonition>
    </View>
  )
}
