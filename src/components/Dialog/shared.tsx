/**
 * @file Dialog 共有コンポーネントファイル
 * @description ダイアログヘッダーとヘッダーテキストの共通コンポーネント
 *
 * このファイルは以下を提供：
 * - Header: ダイアログヘッダーコンポーネント（左右にボタン、中央にタイトル）
 * - HeaderText: ヘッダー内で使用するテキストコンポーネント
 *
 * これらのコンポーネントはプラットフォーム（iOS/Android/Web）間で
 * 共有され、一貫したUI体験を提供します。
 *
 * Go言語との対比：
 * - コンポーネント: Goでは構造体とメソッドで表現
 * - Props: Goでは構造体フィールドとして定義
 * - React.ReactNode: Goでは interface{} またはカスタムインターフェース
 */

// React Native基本コンポーネントと型定義
import {
  type LayoutChangeEvent, // レイアウト変更イベント型
  type StyleProp,         // スタイルプロパティ型（柔軟なスタイル定義）
  type TextStyle,         // テキストスタイル型
  View,                   // 基本ビューコンポーネント（Goのdivに相当）
  type ViewStyle,         // ビュースタイル型
} from 'react-native'

// デザインシステム - アトミックスタイルとテーマフック
import {atoms as a, useTheme} from '#/alf'
// タイポグラフィコンポーネント - テキスト表示用
import {Text} from '#/components/Typography'

/**
 * ダイアログヘッダーコンポーネント
 *
 * ダイアログの上部に表示されるヘッダーを提供します。
 * 左側、中央、右側に要素を配置できる柔軟なレイアウト構造です。
 *
 * @param props - ヘッダーのプロパティ
 * @param props.renderLeft - 左側に表示する要素を返す関数（通常は閉じるボタン）
 * @param props.renderRight - 右側に表示する要素を返す関数（通常はアクションボタン）
 * @param props.children - 中央に表示する要素（通常はタイトルテキスト）
 * @param props.style - カスタムスタイル
 * @param props.onLayout - レイアウト変更時のコールバック
 *
 * Go言語との対比：
 * - 関数コンポーネント: Goでは構造体とRenderメソッドで表現
 *   ```go
 *   type Header struct {
 *       RenderLeft  func() ReactNode
 *       RenderRight func() ReactNode
 *       Children    ReactNode
 *       Style       ViewStyle
 *       OnLayout    func(LayoutChangeEvent)
 *   }
 *
 *   func (h *Header) Render() ReactNode {
 *       // レンダリング処理
 *   }
 *   ```
 * - 分割代入: Goでは構造体フィールドアクセスで実現
 * - オプショナルフィールド(?: ): Goではポインタで表現
 *
 * 使用例：
 * ```typescript
 * <Header
 *   renderLeft={() => <CloseButton />}
 *   renderRight={() => <SaveButton />}
 * >
 *   <HeaderText>設定</HeaderText>
 * </Header>
 * ```
 */
export function Header({
  renderLeft,   // 左側要素のレンダリング関数（オプション）
  renderRight,  // 右側要素のレンダリング関数（オプション）
  children,     // 中央要素（オプション）
  style,        // カスタムスタイル（オプション）
  onLayout,     // レイアウト変更ハンドラー（オプション）
}: {
  /**
   * 左側に表示する要素を返す関数
   *
   * Go言語との対比：
   * - 関数型フィールド: Goでは `RenderLeft func() interface{}` で表現
   * - React.ReactNode: Goでは interface{} やカスタムNodeインターフェース
   * - オプショナル(?: ): Goでは *func() で表現
   *
   * ReactNodeとは：
   * - JSX要素、文字列、数値、null、undefined、boolean、配列など
   * - レンダリング可能な全ての型の総称
   */
  renderLeft?: () => React.ReactNode

  /** 右側に表示する要素を返す関数 */
  renderRight?: () => React.ReactNode

  /**
   * 中央に表示する子要素
   *
   * React.ReactNode: レンダリング可能な任意の型
   * - コンポーネント、テキスト、数値、配列など
   */
  children?: React.ReactNode

  /**
   * カスタムスタイルオブジェクト
   *
   * StyleProp<ViewStyle>: 柔軟なスタイル型定義
   * - ViewStyle: 単一のスタイルオブジェクト
   * - ViewStyle[]: スタイル配列（後のスタイルが優先）
   * - false | null | undefined: 条件付きスタイルで使用
   *
   * Go言語との対比：
   * - StyleProp: Goでは interface{} やunion型で表現必要
   *   ```go
   *   type StyleProp interface {
   *       isStyleProp()
   *   }
   *   type ViewStyle struct { ... }
   *   func (v ViewStyle) isStyleProp() {}
   *   ```
   */
  style?: StyleProp<ViewStyle>

  /**
   * レイアウト変更時のコールバック関数
   *
   * LayoutChangeEvent: レイアウト情報（x, y, width, height）を含むイベント
   * - ヘッダーのサイズ変更時に呼ばれる
   * - スクロール位置調整などに使用
   *
   * Go言語との対比：
   * - コールバック: Goでは `OnLayout func(event LayoutChangeEvent)`
   * - イベント型: Goでは構造体で表現
   *   ```go
   *   type LayoutChangeEvent struct {
   *       Layout struct {
   *           X, Y, Width, Height float64
   *       }
   *   }
   *   ```
   */
  onLayout?: (event: LayoutChangeEvent) => void
}) {
  /**
   * useTheme: 現在のテーマ（ライト/ダーク）を取得するフック
   *
   * Go言語との対比：
   * - useTheme: Goでは Context から取得
   *   ```go
   *   theme := context.GetTheme(ctx)
   *   ```
   * - フック: Goには直接対応する概念なし、Contextや関数で実現
   */
  const t = useTheme()

  /**
   * JSXレンダリング
   *
   * Go言語との対比：
   * - JSX: Goには直接対応する構文なし、テンプレートやビルダーパターンで実現
   *   ```go
   *   return View{
   *       OnLayout: onLayout,
   *       Style: []Style{
   *           styles.Sticky,
   *           styles.Top0,
   *           // ...
   *       },
   *       Children: []Node{
   *           renderLeftNode(),
   *           childrenNode,
   *           renderRightNode(),
   *       },
   *   }
   *   ```
   * - 配列スタイル[...]: 後のスタイルが前のスタイルを上書き
   */
  return (
    <View
      onLayout={onLayout} // レイアウト変更時のコールバック
      style={[
        // アトミックスタイル（デザインシステムの基本スタイル）
        a.sticky,         // 位置固定（スクロール時も上部に固定）
        a.top_0,          // 上端からの距離0
        a.relative,       // 相対位置指定（子要素の絶対配置の基準）
        a.w_full,         // 幅100%
        a.py_sm,          // 上下パディング（小）
        a.flex_row,       // フレックスボックス（横並び）
        a.justify_center, // 水平方向中央揃え
        a.align_center,   // 垂直方向中央揃え
        {minHeight: 50},  // 最小高さ50px（オブジェクトリテラルスタイル）
        a.border_b,       // 下部ボーダー
        // テーマ依存のスタイル（ライト/ダークモード対応）
        t.atoms.border_contrast_medium, // 中程度のコントラストボーダー色
        t.atoms.bg,                     // 背景色（テーマに応じて変わる）
        // 上部の角丸（左右のみ）
        {borderTopLeftRadius: a.rounded_md.borderRadius},   // 左上角丸
        {borderTopRightRadius: a.rounded_md.borderRadius},  // 右上角丸
        style, // カスタムスタイル（最後に適用され、前のスタイルを上書き可能）
      ]}>
      {/* 左側要素（条件付きレンダリング） */}
      {/**
       * 条件付きレンダリング: renderLeft && (...)
       *
       * Go言語との対比：
       * - 論理演算子による条件レンダリング: Goでは if文で実現
       *   ```go
       *   var leftNode Node
       *   if renderLeft != nil {
       *       leftNode = View{
       *           Style: []Style{styles.Absolute, {Left: 6}},
       *           Children: []Node{renderLeft()},
       *       }
       *   }
       *   ```
       *
       * && 演算子の動作：
       * - renderLeftが真（存在する）なら、後続の式を評価してレンダリング
       * - renderLeftが偽（undefined）なら、何もレンダリングしない
       */}
      {renderLeft && (
        <View style={[a.absolute, {left: 6}]}>
          {/* 左側要素のレンダリング関数を呼び出し */}
          {renderLeft()}
        </View>
      )}

      {/* 中央要素 */}
      {children}

      {/* 右側要素（条件付きレンダリング） */}
      {renderRight && (
        <View style={[a.absolute, {right: 6}]}>
          {/* 右側要素のレンダリング関数を呼び出し */}
          {renderRight()}
        </View>
      )}
    </View>
  )
}

/**
 * ヘッダーテキストコンポーネント
 *
 * ダイアログヘッダー内で使用するテキストコンポーネントです。
 * 事前に定義されたスタイル（大きなフォント、太字、中央揃え）を適用します。
 *
 * @param props - テキストプロパティ
 * @param props.children - 表示するテキスト内容
 * @param props.style - カスタムスタイル（追加スタイル）
 *
 * Go言語との対比：
 * - 関数コンポーネント: Goでは構造体とRenderメソッド
 *   ```go
 *   type HeaderText struct {
 *       Children string
 *       Style    TextStyle
 *   }
 *
 *   func (h *HeaderText) Render() ReactNode {
 *       return Text{
 *           Style: append(defaultStyles, h.Style),
 *           Children: h.Children,
 *       }
 *   }
 *   ```
 *
 * 使用例：
 * ```typescript
 * <HeaderText style={{color: 'red'}}>
 *   設定
 * </HeaderText>
 * ```
 */
export function HeaderText({
  children, // 表示するテキスト内容
  style,    // カスタムテキストスタイル
}: {
  /** テキスト内容（任意のReactノード） */
  children?: React.ReactNode

  /**
   * テキストスタイル
   *
   * StyleProp<TextStyle>: テキスト専用のスタイル型
   * - fontSize, fontWeight, color, textAlign など
   * - ViewStyleとは異なる（width, height などは含まない）
   *
   * Go言語との対比：
   * - TextStyle: Goでは専用の構造体として定義
   *   ```go
   *   type TextStyle struct {
   *       FontSize   float64
   *       FontWeight string
   *       Color      string
   *       TextAlign  string
   *   }
   *   ```
   */
  style?: StyleProp<TextStyle>
}) {
  /**
   * JSXレンダリング
   *
   * スタイル配列の順序：
   * 1. a.text_lg: 大きなフォントサイズ
   * 2. a.text_center: 中央揃え
   * 3. a.font_heavy: 太字フォント
   * 4. style: カスタムスタイル（最後に適用され上書き可能）
   */
  return (
    <Text style={[a.text_lg, a.text_center, a.font_heavy, style]}>
      {children}
    </Text>
  )
}
