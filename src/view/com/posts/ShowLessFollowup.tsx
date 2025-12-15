/**
 * ShowLessFollowup - 「表示を減らす」フィードバック確認コンポーネント
 *
 * 【概要】
 * ユーザーが投稿に対して「表示を減らす」アクションを実行した後に表示される
 * 確認メッセージコンポーネント。フィードバックがフィード運営者に送信されたことを
 * ユーザーに通知します。
 *
 * 【機能】
 * - チェックマークアイコンと確認メッセージの表示
 * - フィード運営者へのフィードバック送信完了の通知
 * - 視覚的に区別されたカード型デザイン
 *
 * 【Goユーザー向け補足】
 * - このファイルはReact Nativeコンポーネント（UI部品）を定義しています
 * - export functionで外部から利用可能にします（Goのpublic funcに相当）
 * - JSXはReactのUI記述言語（HTMLに似た構文でUIツリーを構築）
 *
 * @module ShowLessFollowup
 */

// React Nativeコア - Viewコンポーネント（コンテナとして機能）
import {View} from 'react-native'
// 国際化（i18n）ライブラリ - 多言語対応テキスト翻訳
import {Trans} from '@lingui/macro'

// デザインシステム - アトミックスタイルとテーマフック
import {atoms as a, useTheme} from '#/alf'
// チェックマークアイコンコンポーネント
import {CircleCheck_Stroke2_Corner0_Rounded} from '#/components/icons/CircleCheck'
// テキストコンポーネント - タイポグラフィシステム
import {Text} from '#/components/Typography'

/**
 * ShowLessFollowup - フィードバック送信完了通知コンポーネント
 *
 * 【表示内容】
 * - チェックマークアイコン（成功を視覚的に表現）
 * - 「フィードバックがフィード運営者に送信されました」メッセージ
 * - 背景色と枠線で視覚的に区別されたカードデザイン
 *
 * 【Reactフック】
 * - useTheme: 現在のテーマ（ライト/ダーク）を取得
 *
 * 【Goユーザー向け補足】
 * - この関数コンポーネントはステートレス（状態を持たない）
 * - useThemeフックでテーマ情報を取得（Goのcontext.Contextに似た役割）
 * - JSXの返却により、宣言的にUIを構築
 *
 * @returns {JSX.Element} フィードバック確認UI
 */
export function ShowLessFollowup() {
  // 現在のテーマを取得（ライトモード/ダークモード対応）
  const t = useTheme()

  /**
   * レンダリング部分
   *
   * 【JSX構造】
   * - 外側View: 上ボーダーと背景色を持つコンテナ
   * - 内側View: カード型のコンテナ（枠線と角丸）
   * - CircleCheck: チェックマークアイコン
   * - Text: 確認メッセージ
   *
   * 【スタイルシステム】
   * - t.atoms: テーマベースのスタイル（カラーパレット）
   * - a: アトミックスタイル（パディング、ボーダー、レイアウトなど）
   *
   * 【Goユーザー向け補足】
   * - styleプロパティは配列で複数スタイルをマージ可能
   * - Flexboxレイアウトで要素を横並び配置（a.flex_row）
   */
  return (
    <View
      style={[
        t.atoms.border_contrast_low, // テーマのボーダー色（低コントラスト）
        a.border_t, // 上ボーダーのみ
        t.atoms.bg_contrast_25, // 背景色（25%コントラスト）
        a.p_sm, // 小さめのパディング
      ]}>
      {/* カード型コンテナ */}
      <View
        style={[
          t.atoms.bg, // テーマの基本背景色
          t.atoms.border_contrast_low, // 低コントラストのボーダー色
          a.border, // 全周にボーダー
          a.rounded_sm, // 小さめの角丸
          a.p_md, // 中程度のパディング
          a.flex_row, // 子要素を横並びに配置（Flexbox）
          a.gap_sm, // 子要素間のスペース（ギャップ）
        ]}>
        {/* チェックマークアイコン */}
        <CircleCheck_Stroke2_Corner0_Rounded
          style={[t.atoms.text_contrast_low]} // アイコン色（低コントラストテキスト色）
          size="sm" // 小サイズ
        />

        {/* 確認メッセージテキスト */}
        <Text
          style={[
            a.flex_1, // 残りのスペースを全て使用（Flexbox）
            a.text_sm, // 小さめのテキストサイズ
            t.atoms.text_contrast_medium, // 中程度のコントラストテキスト色
            a.leading_snug, // 行間を詰める（line-height）
          ]}>
          <Trans>
            Thank you for your feedback! It has been sent to the feed operator.
          </Trans>
        </Text>
      </View>
    </View>
  )
}
