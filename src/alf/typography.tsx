/**
 * タイポグラフィシステム
 *
 * 【主な機能】
 * - 統一されたフォントスタイルとサイズ管理
 * - レスポンシブな行間計算
 * - 絵文字の適切なレンダリング処理
 * - プラットフォーム固有のテキスト最適化
 *
 * 【デザインシステム】
 * - アトミックデザインに基づくテキストスタイル
 * - スケーラブルなフォントサイズシステム
 * - アクセシビリティ対応（フォントスケーリング）
 * - 一貫したタイポグラフィ階層
 *
 * 【プラットフォーム対応】
 * - Web: 相対的な行間とフォント最適化
 * - iOS: システムフォントと絵文字の最適化
 * - Android: ネイティブテキストレンダリング
 *
 * @module Typography - テキスト表示とスタイリングのコアシステム
 */

// Reactコアライブラリ - 子要素の処理とReact型定義
import {Children} from 'react'                      // 子要素の反復処理
import {type TextProps as RNTextProps} from 'react-native'  // React Nativeテキストプロパティ型
import {type StyleProp, type TextStyle} from 'react-native' // スタイル型定義
import {UITextView} from 'react-native-uitextview' // UITextViewコンポーネント（iOS特化）
import createEmojiRegex from 'emoji-regex'         // 絵文字検出用正規表現
import type React from 'react'                     // React型定義

// プラットフォーム検出 - レンダリング方法の分岐用
import {isNative} from '#/platform/detection'      // ネイティブ環境判定
import {isIOS} from '#/platform/detection'         // iOS環境判定
// デザインシステム - フォント管理とスタイル適用
import {type Alf, applyFonts, atoms, flatten} from '#/alf'

/**
 * テキストサイズと行間アトムから行間値を計算するユーティリティ
 * Util to calculate lineHeight from a text size atom and a leading atom
 *
 * フォントサイズと相対的な行間値を組み合わせて、実際のピクセル値を計算する
 *
 * 使用例:
 *   `leading(atoms.text_md, atoms.leading_normal)` // => 24
 *
 * @param textSize - フォントサイズを含むスタイルオブジェクト
 * @param leading - 行間比率を含むスタイルオブジェクト
 * @returns 計算された行間値（ピクセル）
 */
export function leading<
  Size extends {fontSize?: number},
  Leading extends {lineHeight?: number},
>(textSize: Size, leading: Leading) {
  const size = textSize?.fontSize || atoms.text_md.fontSize          // フォントサイズ取得（デフォルト：中サイズ）
  const lineHeight = leading?.lineHeight || atoms.leading_normal.lineHeight  // 行間比率取得（デフォルト：通常）
  return Math.round(size * lineHeight)  // フォントサイズと行間比率を乗算して四捨五入
}

/**
 * Ensures that `lineHeight` defaults to a relative value of `1`, or applies
 * other relative leading atoms.
 *
 * If the `lineHeight` value is > 2, we assume it's an absolute value and
 * returns it as-is.
 */
export function normalizeTextStyles(
  styles: StyleProp<TextStyle>,
  {
    fontScale,
    fontFamily,
  }: {
    fontScale: number
    fontFamily: Alf['fonts']['family']
  } & Pick<Alf, 'flags'>,
) {
  const s = flatten(styles)
  // should always be defined on these components
  s.fontSize = (s.fontSize || atoms.text_md.fontSize) * fontScale

  if (s?.lineHeight) {
    if (s.lineHeight !== 0 && s.lineHeight <= 2) {
      s.lineHeight = Math.round(s.fontSize * s.lineHeight)
    }
  } else if (!isNative) {
    s.lineHeight = s.fontSize
  }

  applyFonts(s, fontFamily)

  return s
}

export type StringChild = string | (string | null)[]
export type TextProps = RNTextProps & {
  /**
   * Lets the user select text, to use the native copy and paste functionality.
   */
  selectable?: boolean
  /**
   * Provides `data-*` attributes to the underlying `UITextView` component on
   * web only.
   */
  dataSet?: Record<string, string | number | undefined>
  /**
   * Appears as a small tooltip on web hover.
   */
  title?: string
  /**
   * Whether the children could possibly contain emoji.
   */
  emoji?: boolean
}

const EMOJI = createEmojiRegex()

export function childHasEmoji(children: React.ReactNode) {
  let hasEmoji = false
  Children.forEach(children, child => {
    if (typeof child === 'string' && createEmojiRegex().test(child)) {
      hasEmoji = true
    }
  })
  return hasEmoji
}

export function renderChildrenWithEmoji(
  children: React.ReactNode,
  props: Omit<TextProps, 'children'> = {},
  emoji: boolean,
) {
  if (!isIOS || !emoji) {
    return children
  }
  return Children.map(children, child => {
    if (typeof child !== 'string') return child

    const emojis = child.match(EMOJI)

    if (emojis === null) {
      return child
    }

    return child.split(EMOJI).map((stringPart, index) => [
      stringPart,
      emojis[index] ? (
        <UITextView
          {...props}
          style={[props?.style, {fontFamily: 'System'}]}
          key={index}>
          {emojis[index]}
        </UITextView>
      ) : null,
    ])
  })
}

const SINGLE_EMOJI_RE = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u
export function isOnlyEmoji(text: string) {
  return text.length <= 15 && SINGLE_EMOJI_RE.test(text)
}
