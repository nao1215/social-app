/**
 * 投稿プレースホルダーコンポーネント
 *
 * 削除済み、ブロック済み、または作成者によって削除された投稿など、
 * 実際のコンテンツを表示できない場合に表示されるプレースホルダーUI。
 *
 * 主な機能:
 * - 投稿が利用不可の理由を視覚的に表示
 * - 情報アイコンと説明テキストを含む統一されたUIデザイン
 * - テーマに対応したスタイリング
 *
 * Go言語との対比:
 * - children: React.ReactNode - Goのinterface{}に似た任意の要素を受け入れる型
 * - StyleSheet.create: スタイルオブジェクトを最適化して作成（Goの構造体リテラルに相当）
 */

import {StyleSheet, View} from 'react-native'

// カラーパレットフックをインポート（テーマカラー取得用）
import {usePalette} from '#/lib/hooks/usePalette'
// 情報アイコンコンポーネントをインポート
import {InfoCircleIcon} from '#/lib/icons'
// テキストコンポーネントをインポート
import {Text} from '#/view/com/util/text/Text'
// デザインシステムのアトムとテーマフックをインポート
import {atoms as a, useTheme} from '#/alf'

/**
 * 投稿プレースホルダーコンポーネント
 *
 * 投稿が表示できない場合（削除済み、ブロック済みなど）に、
 * 理由を示すメッセージを表示するためのコンポーネント。
 *
 * Reactフック解説:
 * - useTheme(): テーマ情報を取得するフック（Goのcontext.Valueに似た仕組み）
 * - usePalette(): カラーパレットを取得するカスタムフック
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {React.ReactNode} props.children - 表示するメッセージ（"削除済み"、"ブロック済み"など）
 * @returns {JSX.Element} プレースホルダーUI
 */
export function PostPlaceholder({children}: {children: React.ReactNode}) {
  // テーマ情報を取得（ダークモード/ライトモード対応）
  const t = useTheme()
  // カラーパレットを取得（テキスト色などに使用）
  const pal = usePalette('default')

  return (
    <View
      // スタイル配列: 複数のスタイルオブジェクトをマージ（後のものが優先）
      style={[styles.errorContainer, a.border, t.atoms.border_contrast_low]}>
      {/* 情報アイコンを表示 */}
      <InfoCircleIcon size={18} style={pal.text} />
      {/* メッセージテキストを表示 */}
      <Text type="lg" style={pal.text}>
        {children}
      </Text>
    </View>
  )
}

/**
 * スタイル定義
 *
 * StyleSheet.create()で最適化されたスタイルオブジェクトを作成。
 * Go言語の構造体リテラルに相当しますが、実行時に最適化されます。
 */
const styles = StyleSheet.create({
  errorContainer: {
    flexDirection: 'row', // 横並びレイアウト（Goにはない概念、CSSのFlexbox）
    alignItems: 'center', // 垂直方向の中央揃え
    gap: 4, // 子要素間のスペース（4px）
    borderRadius: 8, // 角丸（8px）
    marginTop: 8, // 上部マージン（8px）
    paddingVertical: 14, // 縦方向のパディング（14px）
    paddingHorizontal: 14, // 横方向のパディング（14px）
    borderWidth: StyleSheet.hairlineWidth, // 最小の境界線幅（プラットフォーム依存）
  },
})
