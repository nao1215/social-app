/**
 * @file Shadows.tsx - シャドウスタイルのカタログ
 * @description デザインシステムのシャドウ（影）バリエーションを表示するStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - シャドウ: UIコンポーネントに立体感を与えるCSS的なbox-shadow
 * - t.atoms.shadow_*: テーマ対応のシャドウスタイル
 * - React Nativeではプラットフォームごとにシャドウ実装が異なる
 *
 * ## 表示されるシャドウ
 * - shadow_sm: 小さい影（カード、ボタン等の軽い浮き）
 * - shadow_md: 中程度の影（モーダル、ドロップダウン等）
 * - shadow_lg: 大きい影（ダイアログ、ポップオーバー等）
 *
 * ## アーキテクチャ
 * - 各シャドウを同じサイズの要素に適用して比較表示
 * - テーマに応じてシャドウの色が変化（ライト/ダーク対応）
 *
 * @module view/screens/Storybook/Shadows
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステム（atoms: 共通スタイル、useTheme: テーマフック）
import {atoms as a, useTheme} from '#/alf'
// 見出し・テキストコンポーネント
import {H1, Text} from '#/components/Typography'

/**
 * Shadows - シャドウスタイルのカタログ表示
 *
 * sm/md/lg の3段階のシャドウを視覚的に比較できる
 */
export function Shadows() {
  const t = useTheme()

  return (
    <View style={[a.gap_md]}>
      <H1>Shadows</H1>

      <View style={[a.flex_row, a.gap_5xl]}>
        <View
          style={[
            a.flex_1,
            a.justify_center,
            a.px_lg,
            a.py_2xl,
            t.atoms.bg,
            t.atoms.shadow_sm,
          ]}>
          <Text>shadow_sm</Text>
        </View>

        <View
          style={[
            a.flex_1,
            a.justify_center,
            a.px_lg,
            a.py_2xl,
            t.atoms.bg,
            t.atoms.shadow_md,
          ]}>
          <Text>shadow_md</Text>
        </View>

        <View
          style={[
            a.flex_1,
            a.justify_center,
            a.px_lg,
            a.py_2xl,
            t.atoms.bg,
            t.atoms.shadow_lg,
          ]}>
          <Text>shadow_lg</Text>
        </View>
      </View>
    </View>
  )
}
