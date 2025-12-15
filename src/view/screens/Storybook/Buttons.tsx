/**
 * @file Buttons.tsx - ボタンコンポーネントのカタログ
 * @description デザインシステムのボタンバリエーションを網羅的に表示するStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - Fragment: 余分なDOMノードを追加せずに複数要素をグループ化（GoのHTML出力で不要なdivを避けるのと同様）
 * - マトリクス表示: color × size の組み合わせを全て表示
 * - Compound Component: Button + ButtonText + ButtonIcon の組み合わせパターン
 *
 * ## 表示されるバリエーション
 * - color: primary, secondary, secondary_inverted, negative, primary_subtle, negative_subtle
 * - size: tiny, small, large
 * - 状態: 通常, disabled
 * - 形状: デフォルト, round, square
 * - アイコン位置: left, right, アイコンのみ
 *
 * ## アーキテクチャ
 * - 二重ループでカラーとサイズの全組み合わせを生成
 * - 各組み合わせで複数のボタンパターンを横並び表示
 * - アイコン付きボタンは左右配置のサンプルを提供
 *
 * @module view/screens/Storybook/Buttons
 */

// Reactフラグメント（複数要素をラップするが余分なDOM生成なし）
import {Fragment} from 'react'
// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステムのスタイルプリミティブ
import {atoms as a} from '#/alf'
// ボタンコンポーネントと型定義
import {
  Button,
  type ButtonColor,
  ButtonIcon,
  type ButtonSize,
  ButtonText,
} from '#/components/Button'
// アイコンコンポーネント
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * Buttons - ボタンコンポーネントのカタログ表示
 *
 * 全てのボタンバリエーション（color × size × state × shape × icon position）を
 * マトリクス形式で表示し、デザインの一貫性を確認できるようにする
 */
export function Buttons() {
  return (
    <View style={[a.gap_md]}>
      <Text style={[a.font_heavy, a.text_5xl]}>Buttons</Text>

      {[
        'primary',
        'secondary',
        'secondary_inverted',
        'negative',
        'primary_subtle',
        'negative_subtle',
      ].map(color => (
        <Fragment key={color}>
          {['tiny', 'small', 'large'].map(size => (
            <Fragment key={size}>
              <Text style={[a.font_heavy, a.text_2xl]}>
                color={color} size={size}
              </Text>
              <View style={[a.flex_row, a.align_start, a.gap_md]}>
                <Button
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  label="Click here">
                  <ButtonText>Button</ButtonText>
                </Button>
                <Button
                  disabled
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  label="Click here">
                  <ButtonText>Button</ButtonText>
                </Button>
                <Button
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  shape="round"
                  label="Click here">
                  <ButtonIcon icon={ChevronLeft} />
                </Button>
                <Button
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  shape="square"
                  label="Click here">
                  <ButtonIcon icon={ChevronLeft} />
                </Button>
              </View>
              <View style={[a.flex_row, a.gap_md]}>
                <Button
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  label="Click here">
                  <ButtonIcon icon={Globe} position="left" />
                  <ButtonText>Button</ButtonText>
                </Button>
                <Button
                  disabled
                  color={color as ButtonColor}
                  size={size as ButtonSize}
                  label="Click here">
                  <ButtonText>Button</ButtonText>
                  <ButtonIcon icon={Globe} position="right" />
                </Button>
              </View>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </View>
  )
}
