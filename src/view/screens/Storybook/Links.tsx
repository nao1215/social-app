/**
 * @file Links.tsx - リンクコンポーネントのカタログ
 * @description テキストリンク、ボタン形式リンク、カスタムリンクのStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - Link: 内部/外部URLへのナビゲーション（HTMLの<a>タグ相当）
 * - InlineLinkText: テキスト内に埋め込むリンク（文中のハイパーリンク）
 * - 内部リンク: bsky.app, bsky.social 等アプリ内ナビゲーション
 * - 外部リンク: google.com 等の外部サイト（新しいタブで開く）
 *
 * ## 表示されるコンポーネント
 * - InlineLinkText: インラインテキストリンク（スタイルカスタマイズ可能）
 * - Link as button: ボタンスタイルのリンク（variant, color, size 指定）
 * - Link with custom children: カスタムUIを持つリンク（カード形式等）
 *
 * ## アーキテクチャ
 * - to プロパティで遷移先URL指定（内部パス or 外部URL）
 * - label プロパティでアクセシビリティ用ラベル指定
 * - variant/color/size でボタン形式リンクのスタイル指定
 *
 * @module view/screens/Storybook/Links
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステム（atoms: 共通スタイル、useTheme: テーマフック）
import {atoms as a, useTheme} from '#/alf'
// ボタンテキストコンポーネント
import {ButtonText} from '#/components/Button'
// リンクコンポーネント群
import {InlineLinkText, Link} from '#/components/Link'
// 見出し・テキストコンポーネント
import {H1, Text} from '#/components/Typography'

/**
 * Links - リンクコンポーネントのカタログ表示
 *
 * インラインリンク、ボタン形式リンク、カスタムリンクの
 * 各バリエーションを視覚的に確認できる
 */
export function Links() {
  const t = useTheme()
  return (
    <View style={[a.gap_md, a.align_start]}>
      <H1>Links</H1>

      <View style={[a.gap_md, a.align_start]}>
        <InlineLinkText label="foo" to="https://google.com" style={[a.text_lg]}>
          https://google.com
        </InlineLinkText>
        <InlineLinkText label="foo" to="https://google.com" style={[a.text_lg]}>
          External with custom children (google.com)
        </InlineLinkText>
        <InlineLinkText
          label="foo"
          to="https://bsky.social"
          style={[a.text_md, t.atoms.text_contrast_low]}>
          Internal (bsky.social)
        </InlineLinkText>
        <InlineLinkText
          label="foo"
          to="https://bsky.app/profile/bsky.app"
          style={[a.text_md]}>
          Internal (bsky.app)
        </InlineLinkText>

        <Link
          variant="solid"
          color="primary"
          size="large"
          label="View @bsky.app's profile"
          to="https://bsky.app/profile/bsky.app">
          <ButtonText>Link as a button</ButtonText>
        </Link>

        <Link
          label="View @bsky.app's profile"
          to="https://bsky.app/profile/bsky.app">
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.gap_md,
              a.rounded_md,
              a.p_md,
              t.atoms.bg_contrast_25,
            ]}>
            <View
              style={[
                {width: 32, height: 32},
                a.rounded_full,
                t.atoms.bg_contrast_200,
              ]}
            />
            <Text>View @bsky.app's profile</Text>
          </View>
        </Link>
      </View>
    </View>
  )
}
