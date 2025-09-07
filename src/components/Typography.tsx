// React Native UITextView - iOS/macOS用の高機能テキスト表示コンポーネント
import {UITextView} from 'react-native-uitextview'

// ログ出力ユーティリティ - 開発時のデバッグ情報出力のため
import {logger} from '#/logger'
// アプリのデザインシステム - 統一されたスタイリングとテーマ管理
import {atoms, flatten, useAlf, useTheme, web} from '#/alf'
// タイポグラフィ関連のユーティリティとプロパティ型
import {
  childHasEmoji,         // 子要素に絵文字が含まれるかチェックする関数
  normalizeTextStyles,   // テキストスタイルを正規化する関数
  renderChildrenWithEmoji, // 絵文字を含む子要素をレンダリングする関数
  type TextProps,        // テキストコンポーネントのプロパティ型
} from '#/alf/typography'

// TextPropsをエクスポート - 他のコンポーネントで型を利用するため
export type {TextProps}
// React NativeのTextをSpanとしてエクスポート - Web互換性のため
export {Text as Span} from 'react-native'

/**
 * Our main text component. Use this most of the time.
 * メインのテキストコンポーネント。ほとんどの場合はこれを使用してください。
 */
export function Text({
  children,   // 子要素（テキスト内容）
  emoji,      // 絵文字レンダリング有効フラグ
  style,      // カスタムスタイル
  selectable, // テキスト選択可能フラグ
  title,      // ツールチップ用タイトル
  dataSet,    // HTML data属性（Web用）
  ...rest     // その他のプロパティ
}: TextProps) {
  const {fonts, flags} = useAlf()  // ALF（デザインシステム）からフォント設定とフラグを取得
  const t = useTheme()              // 現在のテーマ取得
  // テキストスタイルを正規化 - デフォルトスタイル、テーマスタイル、カスタムスタイルを結合
  const s = normalizeTextStyles([atoms.text_sm, t.atoms.text, flatten(style)], {
    fontScale: fonts.scaleMultiplier,  // フォントスケール倍率
    fontFamily: fonts.family,          // フォントファミリー
    flags,                            // 機能フラグ
  })

  // 開発環境でのみ実行される絵文字チェック
  if (__DEV__) {
    if (!emoji && childHasEmoji(children)) {
      logger.warn(
        `Text: emoji detected but emoji not enabled: "${children}"\n\nPlease add <Text emoji />'`,
      )
    }
  }

  // UITextViewに渡す共通プロパティ
  const shared = {
    uiTextView: true,                                       // UITextView使用フラグ
    selectable,                                             // テキスト選択可能性
    style: s,                                               // 正規化されたスタイル
    dataSet: Object.assign({tooltip: title}, dataSet || {}), // data属性（ツールチップ含む）
    ...rest,                                                // その他のプロパティを展開
  }

  return (
    <UITextView {...shared}>
      {/* 絵文字対応の子要素レンダリング - 絵文字フラグに基づいて適切にレンダリング */}
      {renderChildrenWithEmoji(children, shared, emoji ?? false)}
    </UITextView>
  )
}

/**
 * 見出し要素を作成するファクトリー関数
 * Factory function to create heading elements with proper semantic attributes
 */
function createHeadingElement({level}: {level: number}) {
  return function HeadingElement({style, ...rest}: TextProps) {
    // Web環境でのセマンティックHTML属性設定
    const attr =
      web({
        role: 'heading',      // WAI-ARIA見出しロール
        'aria-level': level,   // 見出しレベル（1-6）
      }) || {}
    return <Text {...attr} {...rest} style={style} />
  }
}

/*
 * Use semantic components when it's beneficial to the user or to a web scraper
 * ユーザーやWebクローラーにとって有益な場合は、セマンティックコンポーネントを使用してください
 */
// 各レベルの見出しコンポーネント - SEOとアクセシビリティの向上のため
export const H1 = createHeadingElement({level: 1}) // 最上位見出し
export const H2 = createHeadingElement({level: 2}) // セクション見出し
export const H3 = createHeadingElement({level: 3}) // サブセクション見出し
export const H4 = createHeadingElement({level: 4}) // 小見出し
export const H5 = createHeadingElement({level: 5}) // 細見出し
export const H6 = createHeadingElement({level: 6}) // 最小見出し
/**
 * 段落コンポーネント - セマンティックな段落要素
 * Paragraph component with semantic paragraph role
 */
export function P({style, ...rest}: TextProps) {
  // Web環境での段落ロール設定
  const attr =
    web({
      role: 'paragraph', // WAI-ARIA段落ロール
    }) || {}
  return (
    <Text
      {...attr}  // Web属性を展開
      {...rest}  // その他のプロパティを展開
      style={[atoms.text_md, atoms.leading_normal, flatten(style)]} // 中サイズフォント、通常行間、カスタムスタイル
    />
  )
}
