/**
 * @fileoverview タイポグラフィコンポーネント - アプリ全体で使用されるテキスト表示コンポーネント群
 *
 * このモジュールはBlueskyアプリの統一的なテキスト表示を実現するコンポーネント群を提供します。
 *
 * 【主要な機能】
 * - Text: メインのテキストコンポーネント（絵文字対応、スタイル正規化、テーマ統合）
 * - H1-H6: セマンティックな見出しコンポーネント（アクセシビリティ対応）
 * - P: 段落コンポーネント（セマンティックマークアップ）
 * - Span: インライン要素（React Native互換）
 *
 * 【アーキテクチャ設計】
 * - UITextView統合: iOS/macOSネイティブのテキストレンダリングを活用
 * - デザインシステム統合: ALFテーマとアトミックスタイルの適用
 * - 絵文字最適化: 絵文字専用レンダリングパス（パフォーマンス向上）
 * - Web互換性: WAI-ARIAセマンティック属性のサポート
 * - フォントスケーリング: アクセシビリティ設定に応じた動的スケーリング
 *
 * 【Goユーザー向け補足】
 * - このファイルはGoの「パッケージ」に相当するTypeScriptモジュールです
 * - import文はGoの`import`に相当し、他モジュールから機能をインポートします
 * - export文はGoの大文字開始の公開識別子に相当します
 * - type TextProps はGoのstructに相当する型定義です
 *
 * @module components/Typography
 */

// React Native UITextView - iOS/macOS用の高機能テキスト表示コンポーネント
// Goの外部ライブラリインポートに相当（例: import "github.com/..."）
import {UITextView} from 'react-native-uitextview'

// ログ出力ユーティリティ - 開発時のデバッグ情報出力のため
// Goのlog.Printf()やloggerライブラリに相当
import {logger} from '#/logger'

// アプリのデザインシステム - 統一されたスタイリングとテーマ管理
// atoms: アトミックスタイル定義（最小単位のスタイル）
// flatten: ネストされたスタイル配列を平坦化する関数
// useAlf: ALFデザインシステムのコンテキストを取得するReactフック（後述）
// useTheme: 現在のテーマ（light/dark）を取得するReactフック
// web: Web専用の属性を条件付きで返すヘルパー関数
import {atoms, flatten, useAlf, useTheme, web} from '#/alf'

// タイポグラフィ関連のユーティリティとプロパティ型
// 【Goユーザー向け】`type TextProps`は型のみのインポート（ランタイムではなくコンパイル時のみ使用）
import {
  childHasEmoji,         // 子要素に絵文字が含まれるかチェックする関数
  normalizeTextStyles,   // テキストスタイルを正規化する関数（複数スタイルのマージ、フォント設定適用）
  renderChildrenWithEmoji, // 絵文字を含む子要素をレンダリングする関数（絵文字専用最適化パス）
  type TextProps,        // テキストコンポーネントのプロパティ型（Goのstructに相当）
} from '#/alf/typography'

// ============================================================
// 型エクスポート - 他のコンポーネントで再利用するための型定義の公開
// ============================================================

// TextPropsをエクスポート - 他のコンポーネントでTextの型を利用するため
// 【Goユーザー向け】Goの `type MyType = OtherType` のような型エイリアスに相当
// ただし、TypeScriptでは型のみのエクスポート（ランタイムコード生成なし）
export type {TextProps}

// React NativeのTextをSpanとしてエクスポート - Web互換性のため
// 【Goユーザー向け】Goの `var Span = Text` のような変数エイリアスに相当
// HTMLの<span>要素に対応する名前で、既存のTextコンポーネントをエクスポート
export {Text as Span} from 'react-native'

// ============================================================
// メインテキストコンポーネント
// ============================================================

/**
 * メインのテキストコンポーネント - アプリ全体で最も頻繁に使用されるテキスト表示コンポーネント
 *
 * アプリ内のほとんどのテキスト表示にこのコンポーネントを使用してください。
 * デザインシステムの統合、絵文字の最適化、アクセシビリティ対応などの機能を提供します。
 *
 * 【主な機能】
 * - テーマ統合: light/darkモードに自動対応
 * - スタイル正規化: アトミックスタイル、テーマスタイル、カスタムスタイルの統合
 * - 絵文字最適化: 絵文字専用レンダリングパスによるパフォーマンス向上
 * - フォントスケーリング: システムのアクセシビリティ設定に対応
 * - 開発時デバッグ: 絵文字設定の警告表示
 *
 * 【使用例】
 * ```tsx
 * // 基本的な使用
 * <Text>こんにちは</Text>
 *
 * // 絵文字を含む場合（最適化のためemojiプロパティを指定）
 * <Text emoji>こんにちは 👋</Text>
 *
 * // カスタムスタイル適用
 * <Text style={{color: 'red', fontSize: 16}}>重要なメッセージ</Text>
 *
 * // テキスト選択可能
 * <Text selectable>コピー可能なテキスト</Text>
 * ```
 *
 * @param props - テキストコンポーネントのプロパティ
 * @param props.children - 表示するテキスト内容（文字列またはReact要素）
 * @param props.emoji - 絵文字を含む場合はtrue（パフォーマンス最適化のため明示的に指定）
 * @param props.style - カスタムスタイル（アトミックスタイル、オブジェクト、配列）
 * @param props.selectable - ユーザーがテキストを選択可能にするかどうか
 * @param props.title - ツールチップ用のタイトル（Web環境でホバー時に表示）
 * @param props.dataSet - HTML data属性（Web環境でのカスタム属性）
 * @returns レンダリングされたテキストコンポーネント
 *
 * 【Goユーザー向け補足】
 * - この関数はReactの「関数コンポーネント」です（Goの関数に相当）
 * - 引数の`{children, emoji, ...}`は「分割代入」という構文です
 *   Goで例えると: `func Text(props TextProps)` の代わりに
 *   `func Text(children, emoji, style, ... string)` のように個別の引数として受け取るイメージ
 * - `...rest`は「レストパラメータ」で、Goの可変長引数`...args`に似ています
 *   残りのプロパティを全て`rest`オブジェクトにまとめます
 * - `TextProps`はGoのstructに相当する型（interfaceまたはtype）で定義されています
 */
export function Text({
  children,   // 子要素（テキスト内容） - Reactでは親コンポーネントからネストされた内容を受け取る特殊なプロパティ
  emoji,      // 絵文字レンダリング有効フラグ - trueの場合、絵文字専用の最適化パスを使用
  style,      // カスタムスタイル - CSSライクなスタイルオブジェクト、配列、またはアトミックスタイル参照
  selectable, // テキスト選択可能フラグ - trueの場合、ユーザーがテキストをコピー可能
  title,      // ツールチップ用タイトル - Web環境でホバー時に表示されるテキスト
  dataSet,    // HTML data属性（Web用） - data-*属性をオブジェクトで指定（例: {foo: 'bar'} → data-foo="bar"）
  ...rest     // その他のプロパティ - 【スプレッド演算子】上記以外の全プロパティをrestオブジェクトにまとめる
}: TextProps) {
  // ============================================================
  // Reactフック - コンポーネントの状態やコンテキストにアクセスする特殊な関数
  // 【Goユーザー向け】フックはReact特有の概念で、関数コンポーネント内でのみ使用可能
  // Goのグローバル変数やコンテキストアクセスに似ていますが、Reactのレンダリングライフサイクルと統合されています
  // ============================================================

  // useAlf: ALFデザインシステムのコンテキストを取得
  // 【Reactフック説明】useAlfはReactのuseContext()をラップしたカスタムフックです
  // Goのcontext.Contextに似ていますが、コンポーネントツリー全体で共有される値にアクセスします
  // 返り値を分割代入で取得: {fonts, flags} ← Goの多値返却 `fonts, flags := useAlf()` に似ています
  const {fonts, flags} = useAlf()

  // useTheme: 現在のテーマ（light/darkモード）を取得
  // 【Reactフック説明】これもuseContext()ベースのカスタムフックです
  // アプリ全体のテーマ設定（配色、スタイル）にアクセスします
  const t = useTheme()

  // テキストスタイルを正規化 - 複数のスタイルソースを統合して最終スタイルを生成
  // 【処理フロー】
  // 1. atoms.text_sm: ベースとなる小サイズテキストスタイル
  // 2. t.atoms.text: テーマ固有のテキストスタイル（light/darkで異なる配色）
  // 3. flatten(style): ユーザー指定のカスタムスタイルを平坦化
  // これらを配列としてまとめ、normalizeTextStyles()で統合・正規化します
  const s = normalizeTextStyles(
    [atoms.text_sm, t.atoms.text, flatten(style)], // スタイル配列 - 後のスタイルが前のスタイルを上書き
    {
      fontScale: fonts.scaleMultiplier,  // フォントスケール倍率 - アクセシビリティ設定（大きな文字）に対応
      fontFamily: fonts.family,          // フォントファミリー - システムフォントまたはカスタムフォント
      flags,                             // 機能フラグ - 実験的機能の有効/無効を制御
    }
  )

  // ============================================================
  // 開発環境でのデバッグチェック
  // ============================================================

  // __DEV__: 開発環境でのみtrue（本番ビルドでは削除される）
  // 【Goユーザー向け】Goのビルドタグ（//go:build dev）に似た仕組みです
  // JavaScriptのバンドラー（Metro/Webpack）が本番ビルド時にこのブロックを削除します
  if (__DEV__) {
    // 絵文字チェック: emojiプロパティなしで絵文字を使用している場合に警告
    // パフォーマンス最適化のため、絵文字を含む場合は明示的に<Text emoji>と指定すべき
    if (!emoji && childHasEmoji(children)) {
      logger.warn(
        `Text: emoji detected but emoji not enabled: "${children}"\n\nPlease add <Text emoji />'`,
      )
    }
  }

  // ============================================================
  // UITextViewへ渡すプロパティの構築
  // ============================================================

  // 共通プロパティオブジェクトを構築
  // 【Goユーザー向け】Goでのstructリテラル構築に相当します:
  // shared := UITextViewProps{
  //   UITextView: true,
  //   Selectable: selectable,
  //   ...
  // }
  const shared = {
    uiTextView: true,  // UITextView使用フラグ - ネイティブUITextViewを使用することを示す

    selectable,  // テキスト選択可能性 - 【プロパティ省略記法】selectable: selectableの省略形

    style: s,  // 正規化されたスタイル - 上で計算した最終スタイル

    // data属性の構築 - Web環境でのHTML data-*属性
    // Object.assign()でtooltip属性とカスタムdataSetをマージ
    // 【Goユーザー向け】Goのmap結合に似ています:
    // merged := map[string]string{"tooltip": title}
    // for k, v := range dataSet { merged[k] = v }
    dataSet: Object.assign({tooltip: title}, dataSet || {}),  // `|| {}`はdataSetがundefinedの場合の空オブジェクト

    // ...rest: スプレッド演算子 - restオブジェクトの全プロパティを展開
    // 【Goユーザー向け】Goで構造体をマージするイメージ:
    // for k, v := range rest { shared[k] = v }
    ...rest,
  }

  // ============================================================
  // JSXによるコンポーネントレンダリング
  // 【Goユーザー向け】JSXはHTMLライクな構文ですが、実際はJavaScriptの関数呼び出しに変換されます
  // <UITextView {...shared}>...</UITextView> は以下に変換されます:
  // React.createElement(UITextView, shared, children)
  // ============================================================
  return (
    <UITextView {...shared}>
      {/*
        絵文字対応の子要素レンダリング
        【処理内容】
        - emoji=trueの場合: 絵文字専用の最適化レンダリングパス
        - emoji=falseの場合: 通常のテキストレンダリング
        - emoji ?? false: emojiがundefinedの場合はfalseとして扱う（Null合体演算子）

        【Goユーザー向け】
        - `??`はNull合体演算子で、Goでの三項演算子に似ています:
          emoji != nil ? emoji : false
        - JSXの{}内はJavaScript式を埋め込む構文です
      */}
      {renderChildrenWithEmoji(children, shared, emoji ?? false)}
    </UITextView>
  )
}

// ============================================================
// セマンティック見出しコンポーネント（H1-H6）
// ============================================================

/**
 * 見出し要素を作成するファクトリー関数（高階関数）
 *
 * この関数は指定されたレベル（1-6）の見出しコンポーネントを生成します。
 * Web環境ではWAI-ARIAセマンティック属性を自動的に付与し、アクセシビリティを向上させます。
 *
 * 【設計パターン】
 * - ファクトリーパターン: 同じ構造のコンポーネントを異なるパラメータで生成
 * - 高階関数: 関数を返す関数（Goのクロージャに相当）
 * - セマンティックHTML: スクリーンリーダーとSEOの最適化
 *
 * 【アクセシビリティ】
 * - role="heading": スクリーンリーダーに見出しであることを通知
 * - aria-level: 見出しの階層レベルを通知（h1=1, h2=2, ...）
 * - これにより視覚障害者がページ構造を理解しやすくなります
 *
 * @param options - ファクトリーオプション
 * @param options.level - 見出しレベル（1-6: h1-h6に対応）
 * @returns 指定レベルの見出しコンポーネント関数
 *
 * 【Goユーザー向け補足】
 * - この関数は「高階関数」です（関数を返す関数）
 *   Goで例えると:
 *   func createHeadingElement(level int) func(TextProps) Component {
 *     return func(props TextProps) Component { ... }
 *   }
 * - 内部でクロージャを使用し、levelをキャプチャしています
 * - 引数の`{level}: {level: number}`は型付き分割代入です:
 *   Goでの func(opts struct{ Level int }) に相当
 */
function createHeadingElement({level}: {level: number}) {
  // 見出しコンポーネントを返す（クロージャ）
  // 【Goユーザー向け】この関数はlevel変数をキャプチャするクロージャです
  // Goの無名関数と同様に、外側のスコープの変数にアクセスできます
  return function HeadingElement({style, ...rest}: TextProps) {
    // Web環境でのセマンティックHTML属性設定
    // web()関数はWeb環境でのみ属性オブジェクトを返し、ネイティブ環境ではundefinedを返します
    // `|| {}`でundefinedの場合は空オブジェクトにフォールバック
    const attr =
      web({
        role: 'heading',      // WAI-ARIA見出しロール - スクリーンリーダーに見出しとして認識させる
        'aria-level': level,  // 見出しレベル（1-6） - 階層構造を示す
      }) || {}

    // Textコンポーネントをラップして返す
    // {...attr}: Web属性を展開（Web環境のみ）
    // {...rest}: 親から渡された全プロパティを展開（スプレッド演算子）
    // style: カスタムスタイルを適用
    return <Text {...attr} {...rest} style={style} />
  }
}

// ============================================================
// エクスポート: セマンティック見出しコンポーネント（H1-H6）
// ============================================================

/*
 * セマンティックコンポーネントの使用推奨ケース
 *
 * 以下の場合にH1-H6コンポーネントを使用してください:
 * - ユーザーのアクセシビリティ向上が必要な場合
 * - SEO最適化が重要な場合（検索エンジンのクローラー対応）
 * - スクリーンリーダーでの適切なナビゲーションが必要な場合
 * - ページ構造の階層を明確にしたい場合
 *
 * 単なる大きなテキスト表示が目的の場合は、<Text style={...}>を使用してください。
 */

// 各レベルの見出しコンポーネント - SEOとアクセシビリティの向上のため
// 【Goユーザー向け】これらは関数変数のエクスポートです:
// var H1 = createHeadingElement(HeadingOptions{Level: 1})

/**
 * H1見出しコンポーネント（レベル1）
 * ページタイトルや最上位見出しに使用します。1ページに1つが推奨。
 *
 * 【使用例】
 * ```tsx
 * <H1>Bluesky - ソーシャルネットワーク</H1>
 * ```
 */
export const H1 = createHeadingElement({level: 1})

/**
 * H2見出しコンポーネント（レベル2）
 * メインセクションの見出しに使用します。
 *
 * 【使用例】
 * ```tsx
 * <H2>最新の投稿</H2>
 * ```
 */
export const H2 = createHeadingElement({level: 2})

/**
 * H3見出しコンポーネント（レベル3）
 * サブセクションの見出しに使用します。
 *
 * 【使用例】
 * ```tsx
 * <H3>トレンドトピック</H3>
 * ```
 */
export const H3 = createHeadingElement({level: 3})

/**
 * H4見出しコンポーネント（レベル4）
 * 小見出しに使用します。
 */
export const H4 = createHeadingElement({level: 4})

/**
 * H5見出しコンポーネント（レベル5）
 * より細かい見出しに使用します。
 */
export const H5 = createHeadingElement({level: 5})

/**
 * H6見出しコンポーネント（レベル6）
 * 最小レベルの見出しに使用します。
 */
export const H6 = createHeadingElement({level: 6})
// ============================================================
// セマンティック段落コンポーネント（P）
// ============================================================

/**
 * 段落コンポーネント - セマンティックな段落要素
 *
 * 本文の段落表示に使用するコンポーネントです。
 * Web環境ではWAI-ARIA段落ロールを自動的に付与し、アクセシビリティを向上させます。
 *
 * 【デフォルトスタイル】
 * - フォントサイズ: 中サイズ（text_md）
 * - 行間: 通常（leading_normal）
 * - これらはカスタムスタイルで上書き可能
 *
 * 【アクセシビリティ】
 * - role="paragraph": スクリーンリーダーに段落として認識させる
 * - セマンティックな構造により、文書構造が明確になる
 *
 * 【使用例】
 * ```tsx
 * <P>これは段落のテキストです。読みやすい行間で表示されます。</P>
 *
 * // カスタムスタイルの適用
 * <P style={{color: 'blue', fontSize: 18}}>
 *   カスタムスタイルの段落
 * </P>
 * ```
 *
 * @param props - 段落コンポーネントのプロパティ
 * @param props.style - カスタムスタイル（デフォルトスタイルを上書き）
 * @param props....rest - その他のTextコンポーネントプロパティ
 * @returns レンダリングされた段落コンポーネント
 *
 * 【Goユーザー向け補足】
 * - 引数の`{style, ...rest}`は分割代入とレストパラメータの組み合わせです
 *   Goで例えると:
 *   func P(style Style, rest ...interface{}) のようなイメージ
 * - styleだけを取り出し、残りの全プロパティをrestにまとめます
 */
export function P({style, ...rest}: TextProps) {
  // Web環境での段落ロール設定
  // web()関数はWeb環境でのみ属性オブジェクトを返し、ネイティブ環境ではundefinedを返します
  // 【Goユーザー向け】条件付きの値生成です:
  // attr := web(map[string]string{"role": "paragraph"})
  // if attr == nil { attr = map[string]string{} }
  const attr =
    web({
      role: 'paragraph', // WAI-ARIA段落ロール - スクリーンリーダーに段落として認識させる
    }) || {}

  // Textコンポーネントを返す
  // 【スタイル配列の処理】
  // 1. atoms.text_md: 中サイズフォント（14-16px相当）
  // 2. atoms.leading_normal: 通常の行間（1.5倍程度）
  // 3. flatten(style): ユーザー指定のカスタムスタイルを平坦化
  // 配列の後方のスタイルが前方を上書きします（CSSのカスケーディングに似た挙動）
  return (
    <Text
      {...attr}  // Web属性を展開 - Web環境でのみrole="paragraph"が設定される
      {...rest}  // その他のプロパティを展開（children, emoji, selectableなど）
      style={[atoms.text_md, atoms.leading_normal, flatten(style)]} // スタイル配列 - デフォルト + カスタム
    />
  )
}

// ============================================================
// モジュール設計の要約
// ============================================================

/*
 * このモジュールの全体構成:
 *
 * 1. 基本コンポーネント
 *    - Text: 汎用テキストコンポーネント（絵文字対応、テーマ統合）
 *    - Span: インライン要素（React Native互換）
 *
 * 2. セマンティックコンポーネント
 *    - H1-H6: 見出しコンポーネント（アクセシビリティとSEO最適化）
 *    - P: 段落コンポーネント（読みやすい行間、セマンティックマークアップ）
 *
 * 3. 設計原則
 *    - デザインシステム統合: ALFテーマとアトミックスタイルの活用
 *    - アクセシビリティ優先: WAI-ARIA属性、スクリーンリーダー対応
 *    - パフォーマンス最適化: 絵文字専用レンダリングパス
 *    - マルチプラットフォーム: iOS/Android/Web対応
 *    - 型安全性: TypeScriptによる厳密な型定義
 *
 * 【Goユーザー向け学習ポイント】
 * このファイルで登場したReact/TypeScript特有の概念:
 * - Reactフック（useContext, useTheme, useAlf）: コンポーネント状態とコンテキスト管理
 * - 分割代入: オブジェクトプロパティを個別変数に展開
 * - スプレッド演算子: オブジェクトや配列の要素を展開
 * - レストパラメータ: 残りの引数をまとめる
 * - JSX構文: HTMLライクな記法（実際は関数呼び出し）
 * - 高階関数: 関数を返す関数（ファクトリーパターン）
 * - 型のみのインポート: コンパイル時のみ使用される型定義
 * - Null合体演算子（??）: nullやundefinedの場合のデフォルト値
 * - オブジェクトプロパティ省略記法: {selectable} = {selectable: selectable}
 */
