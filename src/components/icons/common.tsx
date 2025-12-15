// React Native - StyleSheetとテキストプロパティ型
import {StyleSheet, type TextProps} from 'react-native'
// React Native SVG - SVG関連のコンポーネントと型定義
import {type PathProps, type SvgProps} from 'react-native-svg'
import {Defs, LinearGradient, Stop} from 'react-native-svg' // SVGグラデーション関連要素
// ユニーID生成 - グラデーションの一意識別子用
import {nanoid} from 'nanoid/non-secure'

// デザイントークンとテーマ - 色、サイズ、グラデーションなどのデザイン定数
import {tokens, useTheme} from '#/alf'

// SVGアイコンの共通プロパティ型定義
export type Props = {
  fill?: PathProps['fill']              // 塗りつぶし色（パスの塗りつぶしプロパティと同じ）
  style?: TextProps['style']            // スタイル（テキストスタイルと同じ型）
  size?: keyof typeof sizes             // サイズ（事前定義されたサイズから選択）
  gradient?: keyof typeof tokens.gradients // グラデーション（デザイントークンから選択）
} & Omit<SvgProps, 'style' | 'size'>     // SVGプロパティからstyleとsizeを除外したもの

// アイコンサイズの定義 - 一貫性を保つための標準サイズ
export const sizes = {
  xs: 12,    // 極小: 12px
  sm: 16,    // 小: 16px
  md: 20,    // 中: 20px (デフォルト)
  lg: 24,    // 大: 24px
  xl: 28,    // 特大: 28px
  '2xl': 32, // 超特大: 32px
} as const

/**
 * SVGアイコンの共通プロパティを処理し正規化するフック
 * Processes and normalizes common SVG icon properties
 */
export function useCommonSVGProps(props: Props) {
  const t = useTheme()                                          // 現在のテーマ取得
  const {fill, size, gradient, ...rest} = props                 // プロパティを分解
  const style = StyleSheet.flatten(rest.style)                  // スタイルをフラット化
  const _size = Number(size ? sizes[size] : rest.width || sizes.md) // サイズを数値に変換（デフォルト: md）
  let _fill = fill || style?.color || t.palette.primary_500     // 塗りつぶし色を決定（デフォルト: プライマリ色）
  let gradientDef = null                                        // グラデーション定義の初期化

  // グラデーションが指定されている場合の処理
  if (gradient && tokens.gradients[gradient]) {
    const id = gradient + '_' + nanoid()           // ユニーIDでグラデーションIDを生成
    const config = tokens.gradients[gradient]       // グラデーション設定を取得
    _fill = `url(#${id})`                          // 塗りつぶしをグラデーション参照に設定
    // SVGグラデーション定義を作成
    gradientDef = (
      <Defs> {/* SVG定義セクション */}
        <LinearGradient
          id={id}                                 // グラデーションの一意識別子
          x1="0"                                  // グラデーション開始X座標
          y1="0"                                  // グラデーション開始Y座標
          x2="100%"                               // グラデーション終了X座標
          y2="0"                                  // グラデーション終了Y座標
          // グラデーションを45度回転
          gradientTransform="rotate(45)">
          {/* グラデーションの色停止点をマッピング */}
          {config.values.map(([stop, fill]) => (
            <Stop key={stop} offset={stop} stopColor={fill} /> // 各色停止点を定義
          ))}
        </LinearGradient>
      </Defs>
    )
  }

  // 処理されたプロパティを返す
  return {
    fill: _fill,        // 決定された塗りつぶし色
    size: _size,        // 決定されたサイズ
    style,              // フラット化されたスタイル
    gradient: gradientDef, // グラデーション定義（ある場合）
    ...rest,            // その他のプロパティ
  }
}
