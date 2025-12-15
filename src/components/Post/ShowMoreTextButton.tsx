/**
 * 「もっと見る」テキストボタンコンポーネント
 *
 * 長いテキストを省略表示している際に、全文を表示するためのボタンを提供します。
 * クリックするとアニメーション付きでテキストが展開されます。
 *
 * 主な機能:
 * - テキスト展開ボタンの表示
 * - クリック時のLayoutAnimationによる滑らかな展開
 * - ホバー時の下線表示（Web）
 * - アクセシビリティ対応
 *
 * Go言語との対比:
 * - useCallback: 関数のメモ化（Goのクロージャに似ているが再生成を制御）
 * - useMemo: 計算結果のメモ化（Goのsync.Onceに似た動作）
 */

import {useCallback, useMemo} from 'react'
import {LayoutAnimation, type TextStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// タップ可能領域の拡張定数（10pxのヒットスロップ）
import {HITSLOP_10} from '#/lib/constants'
// デザインシステム
import {atoms as a, flatten, type TextStyleProp, useTheme} from '#/alf'
// ボタンコンポーネント
import {Button} from '#/components/Button'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * 「もっと見る」テキストボタンコンポーネント
 *
 * 省略されたテキストを展開するためのインラインボタンです。
 * クリック時にLayoutAnimationで滑らかに展開されます。
 *
 * Reactフック解説:
 * - useTheme(): テーマ情報を取得（色、ダークモード対応）
 * - useLingui(): 国際化（i18n）のためのフック
 * - useCallback: onPressをメモ化し、不要な再生成を防ぐ
 *   依存配列 [onPressProp] が変わった時のみ新しい関数を生成
 * - useMemo: テキストスタイルをメモ化
 *   styleが変わった時のみ再計算（パフォーマンス最適化）
 *
 * @param {TextStyleProp & {onPress: () => void}} props - コンポーネントプロパティ
 * @param {() => void} props.onPress - ボタンクリック時のコールバック
 * @param {TextStyle} [props.style] - テキストスタイル
 * @returns {JSX.Element} 「もっと見る」ボタン
 */
export function ShowMoreTextButton({
  onPress: onPressProp,
  style,
}: TextStyleProp & {onPress: () => void}) {
  // テーマ情報を取得（プライマリカラーなどに使用）
  const t = useTheme()
  // 国際化関数を取得（アクセシビリティラベルに使用）
  const {_} = useLingui()

  // useCallback: クリック時の処理をメモ化
  // LayoutAnimationで滑らかな展開アニメーションを適用
  // Goのクロージャに似ているが、依存配列で再生成を制御
  const onPress = useCallback(() => {
    // easeInEaseOutアニメーションを設定（200ms程度）
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    // 親から渡されたonPressコールバックを実行
    onPressProp()
  }, [onPressProp]) // onPressPropが変わった時のみ再生成

  // useMemo: テキストスタイルをメモ化
  // flattenで複数のスタイルを1つのオブジェクトに統合
  // Goのsync.Onceに似た動作（依存値が変わるまでキャッシュ）
  const textStyle = useMemo(() => {
    // フォントサイズと行高を持つTextStyle型にキャスト
    return flatten([a.leading_snug, a.text_sm, style]) as TextStyle & {
      fontSize: number
      lineHeight: number
    }
  }, [style]) // styleが変わった時のみ再計算

  return (
    <Button
      // アクセシビリティラベル（スクリーンリーダー用）
      label={_(msg`Expand post text`)}
      onPress={onPress}
      style={[
        a.self_start, // 自身の幅に合わせる（flex-start）
        {
          // テキストと同じフォントサイズの1/3のパディングを下部に追加
          // テキストのベースラインに合わせるため
          paddingBottom: textStyle.fontSize / 3,
        },
      ]}
      // タップ可能領域を10px拡張（タップしやすくする）
      hitSlop={HITSLOP_10}>
      {/* レンダープロップパターン: pressed/hoveredを受け取る関数 */}
      {({pressed, hovered}) => (
        <Text
          style={[
            textStyle,
            {
              color: t.palette.primary_500, // プライマリカラー（青など）
              opacity: pressed ? 0.6 : 1, // プレス時は半透明
              textDecorationLine: hovered ? 'underline' : undefined, // ホバー時下線
            },
          ]}>
          {/* 多言語対応テキスト */}
          <Trans>Show More</Trans>
        </Text>
      )}
    </Button>
  )
}
