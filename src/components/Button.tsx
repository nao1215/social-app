/**
 * @file Button.tsx
 * @description 汎用ボタンコンポーネント - 様々なスタイル、サイズ、状態を持つインタラクティブなボタン
 *
 * このファイルは、Blueskyアプリ全体で使用される統一されたボタンコンポーネントを提供します。
 * 複数のバリアント（solid, outline, ghost）、色テーマ、サイズをサポートし、
 * アクセシビリティとクロスプラットフォーム対応を実現しています。
 *
 * ## Goユーザー向け概要
 *
 * ### TypeScriptの主要概念
 * - **interface/type**: Goのstructに相当。オブジェクトの形状を定義
 * - **Union型**: `'solid' | 'outline'` のように複数の値のいずれかを取る型
 * - **Pick/Omit**: 既存の型から一部のフィールドを選択/除外して新しい型を作成
 * - **Generics**: Go同様、型パラメータを使用した型の抽象化
 *
 * ### React固有の概念
 * - **コンポーネント**: UIの再利用可能な部品。Goの関数やstructに似ているが、UIを返す
 * - **Props**: コンポーネントへの引数。Goの関数パラメータに相当
 * - **フック(Hook)**: `use`で始まる関数。コンポーネント内で状態やライフサイクルを管理
 *   - `useState`: 状態変数を作成。再レンダリング時に値を保持
 *   - `useContext`: 親コンポーネントから値を受け取る仕組み
 *   - `useCallback`: 関数をメモ化し、不要な再作成を防ぐ
 *   - `useMemo`: 値をメモ化し、再計算を最小化
 * - **Context**: Goのcontext.Contextに似ているが、コンポーネントツリーで値を共有する仕組み
 *
 * ### JavaScript/TypeScript構文
 * - **分割代入**: `const {x, y} = obj` - Goの `x, y := obj.x, obj.y` に相当
 * - **スプレッド演算子**: `...rest` - 残りのプロパティをすべて取得
 * - **オプショナルチェイニング**: `func?.()` - funcが存在する場合のみ呼び出し
 * - **アロー関数**: `() => {}` - 無名関数の簡潔な書き方
 */

// Reactフレームワークのメインライブラリ - UIコンポーネント作成のため
// GoでいうHTMLテンプレートエンジンに近いが、より宣言的で型安全
import React from 'react'

// React Nativeのコアコンポーネントと型定義 - クロスプラットフォーム対応のため
// iOS/Android/Webで動作する統一されたUIコンポーネントライブラリ
import {
  type AccessibilityProps, // アクセシビリティ機能のプロパティ型（スクリーンリーダー対応など）
  type GestureResponderEvent, // タッチ・ジェスチャーイベント型（モバイル特有のイベント）
  type MouseEvent, // マウスイベント型（Web/デスクトップ用）
  type NativeSyntheticEvent, // ネイティブ合成イベント型（プラットフォーム間で統一されたイベント）
  Pressable, // タッチ可能なコンポーネント（ボタンやリンクなどインタラクティブ要素の基底）
  type PressableProps, // Pressableのプロパティ型
  type StyleProp, // スタイルプロパティ型（複数のスタイルオブジェクトを配列で受け取れる）
  StyleSheet, // スタイルシート作成ユーティリティ（CSSに相当、パフォーマンス最適化済み）
  type TargetedEvent, // ターゲット指定イベント型
  type TextProps, // テキストコンポーネントのプロパティ型
  type TextStyle, // テキストスタイル型（フォント、色、サイズなど）
  View, // 基本的なUIコンテナ（HTMLのdivに相当）
  type ViewStyle, // ビュースタイル型（レイアウト、背景、ボーダーなど）
} from 'react-native'

// アプリのデザインシステム - 統一されたスタイリングのため
// `atoms`はアトミックCSSクラスの集合、`flatten`はスタイル配列を単一オブジェクトに変換
import {atoms as a, flatten, select, useTheme} from '#/alf'
// SVGアイコンコンポーネント用の共通プロパティ型
import {type Props as SVGIconProps} from '#/components/icons/common'
// タイポグラフィコンポーネント - テキスト表示のため
import {Text} from '#/components/Typography'

/**
 * The `Button` component, and some extensions of it like `Link` are intended
 * to be generic and therefore apply no styles by default. These `VariantProps`
 * are what control the `Button`'s presentation, and are intended only use cases where the buttons appear as, well, buttons.
 *
 * `Button`コンポーネントおよび`Link`などの拡張は汎用的であり、
 * デフォルトではスタイルを適用しません。この`VariantProps`は
 * `Button`の表示を制御し、実際のボタンとして表示される用途でのみ使用されます。
 *
 * If `Button` or an extension of it are used for other compound components, use this property to avoid misuse of these variant props further down the line.
 *
 * `Button`またはその拡張が他の複合コンポーネントで使用される場合、
 * このプロパティを使用して、これらのバリアントプロパティの誤用を防いでください。
 *
 * @example
 * type MyComponentProps = Omit<ButtonProps, UninheritableButtonProps> & {...}
 */
/**
 * 継承してはいけないButtonプロパティ型 - 複合コンポーネントでの誤用防止のため
 *
 * Goユーザー向け補足:
 * - これはリテラル型のUnion型（文字列定数の集合）です
 * - Goの `const` グループに似ていますが、型レベルで制約を表現
 * - `Omit<ButtonProps, UninheritableButtonProps>` は型から特定フィールドを除外
 *   → Goでは埋め込みstructから一部フィールドを隠蔽する場合に相当
 */
export type UninheritableButtonProps = 'variant' | 'color' | 'size' | 'shape'

/**
 * ボタンのバリアント（外観スタイル）型定義
 *
 * Goユーザー向け補足:
 * - Union型: 3つの文字列リテラルのいずれか1つのみを許可
 * - Goでは以下のように表現する場合に相当:
 *   type ButtonVariant string
 *   const (
 *       VariantSolid   ButtonVariant = "solid"
 *       VariantOutline ButtonVariant = "outline"
 *       VariantGhost   ButtonVariant = "ghost"
 *   )
 * - TypeScriptではコンパイル時に型チェックされ、不正な値を防止
 */
export type ButtonVariant = 'solid' | 'outline' | 'ghost'

/**
 * ボタンの色テーマ型定義
 *
 * 各色の用途:
 * - primary: メインアクション（投稿、送信など）
 * - secondary: サブアクション（キャンセル、戻るなど）
 * - secondary_inverted: 暗い背景上のセカンダリアクション
 * - negative: 破壊的アクション（削除、ブロックなど）
 * - primary_subtle: 控えめなプライマリアクション
 * - negative_subtle: 控えめな破壊的アクション
 */
export type ButtonColor =
  | 'primary'            // プライマリカラー（アクセントカラー、主要アクション用）
  | 'secondary'          // セカンダリカラー（通常のアクション用）
  | 'secondary_inverted' // 反転セカンダリカラー（暗い背景用）
  | 'negative'           // ネガティブカラー（警告・削除用、赤系）
  | 'primary_subtle'     // 控えめプライマリカラー（淡い背景）
  | 'negative_subtle'    // 控えめネガティブカラー（淡い警告背景）

/**
 * ボタンのサイズ型定義
 *
 * Goユーザー向け補足:
 * - これもUnion型で、3つのサイズから1つを選択
 * - 各サイズは後述のスタイル計算ロジックでパディングやフォントサイズを決定
 */
export type ButtonSize = 'tiny' | 'small' | 'large'

/**
 * ボタンの形状型定義
 *
 * - default: 通常の角丸長方形ボタン
 * - round: 完全な円形ボタン（アイコンボタンに使用）
 * - square: 正方形ボタン（角丸あり）
 */
export type ButtonShape = 'round' | 'square' | 'default'

/**
 * バリアント制御用プロパティ型定義
 *
 * Goユーザー向け補足:
 * - これはGoのstructに相当するinterface定義
 * - `?` はオプショナルプロパティ（省略可能）を意味
 *   → Goのポインタ型 `*ButtonVariant` に近い（nilの代わりにundefined）
 * - 構造的部分型（Structural Typing）のため、この形状を満たせば互換性あり
 */
export type VariantProps = {
  /**
   * The style variation of the button
   * ボタンのスタイルバリエーション
   * @deprecated Use `color` instead.
   * @deprecated 代わりに`color`を使用してください
   */
  variant?: ButtonVariant
  /**
   * The color of the button
   * ボタンの色
   */
  color?: ButtonColor
  /**
   * The size of the button
   * ボタンのサイズ
   */
  size?: ButtonSize
  /**
   * The shape of the button
   * ボタンの形状
   */
  shape?: ButtonShape
}

/**
 * ボタンの状態を表す型定義
 *
 * Goユーザー向け補足:
 * - これはGoのstructにそのまま対応
 *   type ButtonState struct {
 *       Hovered  bool
 *       Focused  bool
 *       Pressed  bool
 *       Disabled bool
 *   }
 * - これらの状態はユーザーインタラクションに応じて動的に変化
 * - Reactの useState フックで管理される
 */
export type ButtonState = {
  hovered: boolean  // ホバー（マウスオーバー）状態 - Web/デスクトップのみ
  focused: boolean  // フォーカス状態 - キーボードナビゲーション用
  pressed: boolean  // 押下状態 - タッチ中またはクリック中
  disabled: boolean // 無効化状態 - インタラクション不可
}

/**
 * ボタンコンテキスト型 - バリアントプロパティと状態の組み合わせ
 *
 * Goユーザー向け補足:
 * - `&` は交差型（Intersection Type）で、複数の型を結合
 * - Goでは以下のように表現する場合に相当:
 *   type ButtonContext struct {
 *       VariantProps  // 埋め込み
 *       ButtonState   // 埋め込み
 *   }
 * - この型はContextを通じて子コンポーネントに渡される
 */
export type ButtonContext = VariantProps & ButtonState

/**
 * テキスト以外の要素型定義 - ボタンの子要素として使用可能な型
 *
 * Goユーザー向け補足:
 * - Union型で、以下のいずれかを許可:
 *   1. 単一のReact要素（JSX）
 *   2. React要素の配列（null/undefined/booleanも許可 - 条件付きレンダリング用）
 * - `Iterable<T>` はGoのスライスに相当（反復可能なコレクション）
 * - null/undefined/booleanは無視されるため、条件式で便利:
 *   {isLoading && <Spinner />}  // isLoadingがfalseならSpinnerは非表示
 */
type NonTextElements =
  | React.ReactElement // 単一のReact要素（JSXで記述されたUI部品）
  | Iterable<React.ReactElement | null | undefined | boolean> // 反復可能な要素の配列

/**
 * Buttonコンポーネントのプロパティ型定義
 *
 * Goユーザー向け補足:
 * - `Pick<T, K>` はユーティリティ型で、既存の型TからキーセットKのフィールドのみ抽出
 *   → Goでは手動でstructを再定義する必要があるが、TypeScriptでは自動生成
 * - `&` で複数の型を結合（Goの埋め込みstructに相当）
 * - この型定義により、以下のような使用が可能:
 *   <Button
 *     label="送信"
 *     color="primary"
 *     size="large"
 *     onPress={() => console.log('pressed')}
 *   >
 *     <ButtonText>送信</ButtonText>
 *   </Button>
 */
export type ButtonProps = Pick<
  PressableProps,
  | 'disabled'    // 無効化フラグ - ボタンを無効にする
  | 'onPress'     // 押下時のハンドラー - クリック/タップ完了時に呼ばれる
  | 'testID'      // テスト用ID - 自動テストでの要素識別用
  | 'onLongPress' // 長押し時のハンドラー - 長押しジェスチャー用（モバイル）
  | 'hitSlop'     // タッチ可能領域の拡張 - 見た目より大きなタッチ領域を設定（モバイルUX向上）
  | 'onHoverIn'   // ホバー開始時のハンドラー - マウスオーバー時（Web/デスクトップ）
  | 'onHoverOut'  // ホバー終了時のハンドラー - マウスアウト時
  | 'onPressIn'   // 押下開始時のハンドラー - タッチ/クリック開始時
  | 'onPressOut'  // 押下終了時のハンドラー - タッチ/クリック終了時
  | 'onFocus'     // フォーカス取得時のハンドラー - キーボードナビゲーション用
  | 'onBlur'      // フォーカス喪失時のハンドラー - フォーカスが外れた時
> &
  AccessibilityProps & // アクセシビリティ関連プロパティ（スクリーンリーダー対応）
  VariantProps & {     // バリアント制御プロパティ（色、サイズ、形状）
    testID?: string
    /**
     * For a11y, try to make this descriptive and clear
     * アクセシビリティのため、分かりやすく明確な説明を記述してください
     *
     * Goユーザー向け補足:
     * - スクリーンリーダーで読み上げられる説明文
     * - 視覚障害者向けのアクセシビリティ対応で必須
     */
    label: string // ボタンのラベル（アクセシビリティ用、必須）
    style?: StyleProp<ViewStyle>     // 基本スタイル（カスタムスタイルを追加可能）
    hoverStyle?: StyleProp<ViewStyle> // ホバー時のスタイル（マウスオーバー時の見た目）
    /**
     * 子要素または関数
     *
     * Goユーザー向け補足:
     * - Union型で、以下の2パターンを許可:
     *   1. 静的な子要素（JSX）
     *   2. 関数 - コンテキストを受け取って動的にJSXを生成
     *      → Render Props パターン（関数コンポーネント）
     *      → 状態に応じて子要素の見た目を変える場合に使用
     * - 例:
     *   children={(context) => context.pressed ? <Icon1 /> : <Icon2 />}
     */
    children: NonTextElements | ((context: ButtonContext) => NonTextElements)
    /**
     * カスタムPressableコンポーネント
     *
     * Goユーザー向け補足:
     * - デフォルトは React Native の Pressable だが、カスタム実装に差し替え可能
     * - 依存性注入（Dependency Injection）パターン
     * - 例: リンクとして動作させたい場合は別のコンポーネントを渡す
     */
    PressableComponent?: React.ComponentType<PressableProps>
  }

/**
 * ButtonTextコンポーネントのプロパティ型定義
 *
 * Goユーザー向け補足:
 * - `&` で3つの型を結合（TextProps + VariantProps + 新規プロパティ）
 * - ボタン内のテキスト専用コンポーネントのプロパティ
 */
export type ButtonTextProps = TextProps & VariantProps & {disabled?: boolean}

/**
 * ボタンコンテキスト - 子コンポーネント間でボタンの状態を共有するため
 *
 * Goユーザー向け補足:
 * - React.createContext はコンポーネントツリーで値を共有する仕組みを作成
 * - Goのcontext.Contextに似ているが、以下の違いがある:
 *   - Go: リクエストスコープの値やキャンセルシグナルを伝播
 *   - React: UIコンポーネント間でpropsをバケツリレーせずに値を共有
 * - デフォルト値を指定（Providerがない場合に使用される）
 * - この例では、ボタンの状態（pressed, hovered等）を子コンポーネントに伝える
 *   → ButtonTextやButtonIconがボタンの状態に応じてスタイルを変更できる
 */
const Context = React.createContext<VariantProps & ButtonState>({
  hovered: false,  // デフォルト: ホバーしていない
  focused: false,  // デフォルト: フォーカスしていない
  pressed: false,  // デフォルト: 押されていない
  disabled: false, // デフォルト: 有効
})
Context.displayName = 'ButtonContext' // React DevToolsでの表示名

/**
 * ボタンコンテキストを取得するカスタムフック
 * Gets button context for child components
 *
 * Goユーザー向け補足:
 * - カスタムフック: `use`で始まる関数で、他のフックを組み合わせてロジックを再利用
 * - Goでいう汎用ヘルパー関数に近いが、Reactのルールに従う必要がある:
 *   1. コンポーネント内またはカスタムフック内でのみ呼び出せる
 *   2. 条件分岐の中で呼び出してはいけない（常に同じ順序で実行）
 * - この関数は子コンポーネント（ButtonText, ButtonIcon）で使用され、
 *   親ボタンの状態（pressed, color, size等）を取得する
 *
 * @example
 * function MyButtonChild() {
 *   const {pressed, color} = useButtonContext()
 *   // pressedやcolorに応じてスタイルを変更
 *   return <View style={pressed ? pressedStyle : normalStyle} />
 * }
 */
export function useButtonContext() {
  return React.useContext(Context) // Contextからボタンの現在の状態とプロパティを取得
}

/**
 * 汎用ボタンコンポーネント - 様々なスタイルと状態を持つインタラクティブなボタン
 * Generic button component with various styles and interactive states
 *
 * Goユーザー向け補足:
 * - React.forwardRef: refを子コンポーネントに転送する高階関数
 *   → Goでいうと、関数をラップして追加機能を提供するデコレータパターン
 *   → 親コンポーネントが子のDOM要素に直接アクセスできるようにする
 *   → 例: フォーカス制御、スクロール位置取得、サイズ測定など
 *
 * - 型引数: React.forwardRef<View, ButtonProps>
 *   → 第1引数: refが参照する要素の型（この場合はView）
 *   → 第2引数: コンポーネントのprops型
 *
 * - 関数コンポーネント: Goの関数に似ているが、以下の特徴がある:
 *   1. propsを受け取り、JSX（UI記述）を返す
 *   2. 再レンダリング時に再実行される（状態やpropsが変わると）
 *   3. フックを使って状態やライフサイクルを管理
 *
 * @param props - ボタンのプロパティ（分割代入で個別の変数に展開）
 * @param ref - 親コンポーネントから渡されたref（DOM要素への参照）
 * @returns JSX.Element - レンダリングされるUI
 */
export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      // Goユーザー向け補足: 分割代入（Destructuring）
      // オブジェクトのプロパティを個別の変数に展開する構文
      // Go equivalent:
      //   children := props.children
      //   variant := props.variant
      //   color := props.color
      //   ...
      children,       // 子要素（ボタン内のコンテンツ）
      variant,        // バリアント（solid/outline/ghost）
      color,          // 色テーマ
      size,           // サイズ
      shape = 'default',  // 形状（デフォルト値を指定）
      label,          // アクセシビリティラベル
      disabled = false,   // 無効化フラグ
      style,          // カスタムスタイル
      hoverStyle: hoverStyleProp,  // ホバー時スタイル（変数名を変更）
      PressableComponent = Pressable,  // カスタムPressableコンポーネント
      onPressIn: onPressInOuter,   // 外部ハンドラー（内部ハンドラーと区別）
      onPressOut: onPressOutOuter,
      onHoverIn: onHoverInOuter,
      onHoverOut: onHoverOutOuter,
      onFocus: onFocusOuter,
      onBlur: onBlurOuter,
      ...rest  // 残りのプロパティ（スプレッド演算子）
               // Goでいう可変長引数 `...args` に似ているが、
               // オブジェクトの残りフィールドをまとめて取得
    },
    ref,  // 転送されたref（親が子のDOM要素にアクセスするため）
  ) => {
    /**
     * 後方互換性のための variant から color への移行ロジック
     *
     * The `variant` prop is deprecated in favor of simply specifying `color`.
     * `variant`プロパティは非推奨となり、単純に`color`を指定することが推奨されています。
     * If a `color` is set, then we want to use the existing codepaths for
     * "solid" buttons. This is to maintain backwards compatibility.
     * `color`が設定されている場合、既存の"solid"ボタンのコードパスを使用します。
     * これは後方互換性を保つためです。
     */
    if (!variant && color) {
      variant = 'solid'
    }

    /**
     * テーマ取得フック - アプリ全体で統一されたテーマ情報を取得
     *
     * Goユーザー向け補足:
     * - useTheme は内部で useContext を使用してテーマを取得
     * - テーマには色パレット、トークン、アトミックスタイルなどが含まれる
     * - ダークモード/ライトモードの切り替えもテーマで管理
     */
    const t = useTheme()

    /**
     * ボタンの状態管理 - ユーザーインタラクションの追跡
     *
     * Goユーザー向け補足:
     * - useState: Reactの状態管理フック
     * - 戻り値は2要素の配列: [現在の値, 更新関数]
     *   → Goでいうとタプルのような概念（配列の分割代入で取得）
     * - 状態が更新されるとコンポーネントが再レンダリングされる
     * - 初期値としてオブジェクトを渡している（複数の状態をまとめて管理）
     *
     * Go equivalent (疑似コード):
     *   type ButtonInternalState struct {
     *       Pressed bool
     *       Hovered bool
     *       Focused bool
     *   }
     *   state := ButtonInternalState{Pressed: false, Hovered: false, Focused: false}
     *   // ただし、Goでは更新時にUIが自動で再描画されない点が異なる
     */
    const [state, setState] = React.useState({
      pressed: false, // 押下状態 - タッチ中またはクリック中
      hovered: false, // ホバー状態 - マウスポインタがボタン上にある
      focused: false, // フォーカス状態 - キーボードでボタンが選択されている
    })

    /**
     * 押下開始ハンドラー - 押下状態を更新し外部ハンドラーを呼び出し
     *
     * Goユーザー向け補足:
     * - useCallback: 関数をメモ化（キャッシュ）するフック
     *   → 依存配列の値が変わらない限り、同じ関数インスタンスを再利用
     *   → パフォーマンス最適化: 不要な再レンダリングを防ぐ
     *   → Goでは関数は常に新しいインスタンスだが、Reactでは再作成コストを削減
     *
     * - 第1引数: メモ化する関数（コールバック）
     * - 第2引数: 依存配列 - この配列の値が変わったら関数を再作成
     *
     * - setState(s => ({...s, pressed: true})) の説明:
     *   → 関数形式の状態更新（前の状態を受け取って新しい状態を返す）
     *   → `...s` はスプレッド演算子で、既存の状態を展開
     *   → `pressed: true` で特定フィールドのみ上書き
     *   → Go equivalent: newState := state; newState.Pressed = true
     *
     * - onPressInOuter?.(e) の説明:
     *   → オプショナルチェイニング + 関数呼び出し
     *   → onPressInOuterが存在する場合のみ実行（nilチェック不要）
     *   → Go equivalent: if onPressInOuter != nil { onPressInOuter(e) }
     */
    const onPressIn = React.useCallback(
      (e: GestureResponderEvent) => {
        // 内部状態を更新（押下状態をtrueに）
        setState(s => ({
          ...s,
          pressed: true,
        }))
        // 外部から渡されたハンドラーがあれば実行（イベントを親に伝播）
        onPressInOuter?.(e)
      },
      [setState, onPressInOuter], // 依存配列: これらが変わったら関数を再作成
    )
    /**
     * 押下終了ハンドラー - 押下状態を解除し外部ハンドラーを呼び出し
     * 押下開始とペアで動作し、ボタンの視覚的フィードバックを提供
     */
    const onPressOut = React.useCallback(
      (e: GestureResponderEvent) => {
        setState(s => ({
          ...s,
          pressed: false, // 押下状態をfalseに設定（ボタンを元の見た目に戻す）
        }))
        onPressOutOuter?.(e)
      },
      [setState, onPressOutOuter],
    )

    /**
     * ホバー開始ハンドラー - マウスがボタン上に入った時の処理
     * Web/デスクトップのみで動作（モバイルではホバーイベントは発生しない）
     */
    const onHoverIn = React.useCallback(
      (e: MouseEvent) => {
        setState(s => ({
          ...s,
          hovered: true, // ホバー状態をtrueに設定（ホバースタイルを適用）
        }))
        onHoverInOuter?.(e)
      },
      [setState, onHoverInOuter],
    )

    /**
     * ホバー終了ハンドラー - マウスがボタンから離れた時の処理
     */
    const onHoverOut = React.useCallback(
      (e: MouseEvent) => {
        setState(s => ({
          ...s,
          hovered: false, // ホバー状態をfalseに設定（通常スタイルに戻す）
        }))
        onHoverOutOuter?.(e)
      },
      [setState, onHoverOutOuter],
    )

    /**
     * フォーカス取得ハンドラー - キーボードナビゲーションでボタンが選択された時
     * Tabキーでの移動やスクリーンリーダー使用時に重要
     */
    const onFocus = React.useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        setState(s => ({
          ...s,
          focused: true, // フォーカス状態をtrueに設定（フォーカスリングを表示）
        }))
        onFocusOuter?.(e)
      },
      [setState, onFocusOuter],
    )

    /**
     * フォーカス喪失ハンドラー - ボタンからフォーカスが外れた時
     */
    const onBlur = React.useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        setState(s => ({
          ...s,
          focused: false, // フォーカス状態をfalseに設定
        }))
        onBlurOuter?.(e)
      },
      [setState, onBlurOuter],
    )

    /**
     * スタイル計算 - バリアント、色、サイズに基づいて動的にスタイルを生成
     *
     * Goユーザー向け補足:
     * - useMemo: 計算結果をメモ化（キャッシュ）するフック
     *   → 依存配列の値が変わらない限り、前回の計算結果を再利用
     *   → 高コストな計算の最適化に使用（この例では複雑なスタイル計算）
     *   → useCallbackは関数をメモ化、useMemoは値をメモ化
     *
     * - 第1引数: 計算を実行する関数（戻り値がメモ化される）
     * - 第2引数: 依存配列 - これらが変わったら再計算
     *
     * - 分割代入で戻り値を取得: const {baseStyles, hoverStyles} = ...
     *   → この関数は {baseStyles: [...], hoverStyles: [...]} というオブジェクトを返す
     *   → Go equivalent: result := useMemo(...); baseStyles := result.baseStyles
     *
     * - このコードの目的:
     *   → ボタンの見た目（背景色、パディング、ボーダーなど）を動的に計算
     *   → color, size, variant, disabledの組み合わせでスタイルが変わる
     *   → 膨大なif文でスタイルを条件分岐（デザインシステムの実装）
     */
    const {baseStyles, hoverStyles} = React.useMemo(() => {
      const baseStyles: ViewStyle[] = []  // 基本スタイル配列（通常時のスタイル）
      const hoverStyles: ViewStyle[] = [] // ホバー時スタイル配列（マウスオーバー時のスタイル）

      /*
       * This is the happy path for new button styles, following the
       * deprecation of `variant` prop. This redundant `variant` check is here
       * just to make this handling easier to understand.
       * これは新しいボタンスタイルのハッピーパスで、`variant`プロパティの
       * 非推奨化に従っています。この冗長な`variant`チェックは、
       * この処理をより理解しやすくするためにあります。
       *
       * Goユーザー向け補足:
       * - ここから約300行にわたる巨大なif/else文が続く
       * - これはデザインシステムの中核部分で、以下の組み合わせでスタイルを決定:
       *   1. variant（solid/outline/ghost）
       *   2. color（primary/secondary/negative等）
       *   3. disabled（有効/無効）
       *   4. size（tiny/small/large）
       *   5. shape（default/round/square）
       * - baseStyles配列にスタイルオブジェクトを追加していく
       *   → 後でこれらを結合して最終的なスタイルを生成
       * - t.palette.primary_500 などはテーマから色を取得
       *   → ダークモード/ライトモードで自動的に適切な色に切り替わる
       */
      // solidバリアント（塗りつぶしボタン）のスタイル設定
      if (variant === 'solid') {
        // プライマリカラー（アクセントカラー）の場合
        if (color === 'primary') {
          if (!disabled) {
            // 有効状態: プライマリカラーの背景
            baseStyles.push({
              backgroundColor: t.palette.primary_500, // テーマのプライマリカラー（500番台は標準の明度）
            })
            // ホバー時: 少し暗いプライマリカラー（視覚的フィードバック）
            hoverStyles.push({
              backgroundColor: t.palette.primary_600, // 600番台は500より暗い
            })
          } else {
            // 無効状態: 淡いプライマリカラー（操作不可を示す）
            baseStyles.push({
              backgroundColor: t.palette.primary_200, // 200番台は淡い色
            })
            // 無効時はホバースタイルなし（インタラクション不可のため）
          }
        } else if (color === 'secondary') {
          if (!disabled) {
            baseStyles.push(t.atoms.bg_contrast_25)
            hoverStyles.push(t.atoms.bg_contrast_100)
          } else {
            baseStyles.push(t.atoms.bg_contrast_50)
          }
        } else if (color === 'secondary_inverted') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.contrast_900,
            })
            hoverStyles.push({
              backgroundColor: t.palette.contrast_975,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.contrast_600,
            })
          }
        } else if (color === 'negative') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.negative_500,
            })
            hoverStyles.push({
              backgroundColor: t.palette.negative_600,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.negative_700,
            })
          }
        } else if (color === 'primary_subtle') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.primary_50,
                dim: t.palette.primary_100,
                dark: t.palette.primary_100,
              }),
            })
            hoverStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.primary_100,
                dim: t.palette.primary_200,
                dark: t.palette.primary_200,
              }),
            })
          } else {
            baseStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.primary_25,
                dim: t.palette.primary_50,
                dark: t.palette.primary_50,
              }),
            })
          }
        } else if (color === 'negative_subtle') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.negative_50,
                dim: t.palette.negative_100,
                dark: t.palette.negative_100,
              }),
            })
            hoverStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.negative_100,
                dim: t.palette.negative_200,
                dark: t.palette.negative_200,
              }),
            })
          } else {
            baseStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.negative_25,
                dim: t.palette.negative_50,
                dark: t.palette.negative_50,
              }),
            })
          }
        }
      } else {
        /*
         * BEGIN DEPRECATED STYLES
         * 非推奨スタイルの開始
         */
        if (color === 'primary') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.primary_500,
              })
              hoverStyles.push(a.border, {
                backgroundColor: t.palette.primary_50,
              })
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.primary_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.primary_100,
              })
            }
          }
        } else if (color === 'secondary') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.contrast_300,
              })
              hoverStyles.push(t.atoms.bg_contrast_50)
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.contrast_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.contrast_25,
              })
            }
          }
        } else if (color === 'secondary_inverted') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.contrast_300,
              })
              hoverStyles.push(t.atoms.bg_contrast_50)
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.contrast_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.contrast_25,
              })
            }
          }
        } else if (color === 'negative') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.negative_500,
              })
              hoverStyles.push(a.border, {
                backgroundColor: t.palette.negative_50,
              })
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.negative_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.negative_100,
              })
            }
          }
        } else if (color === 'negative_subtle') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.negative_500,
              })
              hoverStyles.push(a.border, {
                backgroundColor: t.palette.negative_50,
              })
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.negative_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.negative_100,
              })
            }
          }
        }
        /*
         * END DEPRECATED STYLES
         * 非推奨スタイルの終了
         */
      }

      // デフォルト形状の場合のサイズ別パディング設定
      if (shape === 'default') {
        if (size === 'large') {
          baseStyles.push({
            paddingVertical: 12,   // 縦方向パディング
            paddingHorizontal: 25, // 横方向パディング
            borderRadius: 10,      // 角丸
            gap: 3,               // 子要素間の間隔
          })
        } else if (size === 'small') {
          baseStyles.push({
            paddingVertical: 8,
            paddingHorizontal: 13,
            borderRadius: 8,
            gap: 3,
          })
        } else if (size === 'tiny') {
          baseStyles.push({
            paddingVertical: 5,
            paddingHorizontal: 9,
            borderRadius: 6,
            gap: 2,
          })
        }
      } else if (shape === 'round' || shape === 'square') {
        /*
         * These sizes match the actual rendered size on screen, based on
         * Chrome's web inspector
         * これらのサイズは、Chromeのウェブインスペクターに基づいて
         * 画面上の実際のレンダリングサイズと一致します
         */
        if (size === 'large') {
          if (shape === 'round') {
            baseStyles.push({height: 44, width: 44})
          } else {
            baseStyles.push({height: 44, width: 44})
          }
        } else if (size === 'small') {
          if (shape === 'round') {
            baseStyles.push({height: 33, width: 33})
          } else {
            baseStyles.push({height: 33, width: 33})
          }
        } else if (size === 'tiny') {
          if (shape === 'round') {
            baseStyles.push({height: 25, width: 25})
          } else {
            baseStyles.push({height: 25, width: 25})
          }
        }

        if (shape === 'round') {
          baseStyles.push(a.rounded_full)
        } else if (shape === 'square') {
          if (size === 'tiny') {
            baseStyles.push({
              borderRadius: 6,
            })
          } else {
            baseStyles.push(a.rounded_sm)
          }
        }
      }

      return {
        baseStyles,
        hoverStyles,
      }
    }, [t, variant, color, size, shape, disabled])

    /**
     * ボタンコンテキストの作成 - 子コンポーネントで使用される状態とプロパティの組み合わせ
     *
     * Goユーザー向け補足:
     * - useMemoで最適化されたコンテキストオブジェクトを生成
     * - このオブジェクトがContext.Providerを通じて子コンポーネントに渡される
     * - スプレッド演算子 ...state で state の全フィールドを展開
     *   → pressed, hovered, focused が個別のプロパティとして含まれる
     */
    const context = React.useMemo<ButtonContext>(
      () => ({
        ...state,                    // 現在の状態（hovered, focused, pressed）をスプレッド展開
        variant,                     // バリアント
        color,                       // 色
        size,                        // サイズ
        disabled: disabled || false, // 無効化状態（undefinedの場合はfalse）
      }),
      [state, variant, color, size, disabled], // これらが変わったら再計算
    )

    /**
     * スタイルの結合 - 基本スタイルと外部から渡されたスタイルをマージ
     *
     * Goユーザー向け補足:
     * - flatten関数: スタイル配列を単一のオブジェクトに平坦化
     * - React NativeではスタイルをCSSのように結合できる
     * - 後ろのスタイルが前のスタイルを上書き（CSSのcascadingに似ている）
     */
    const flattenedBaseStyles = flatten([baseStyles, style])

    /**
     * JSX要素を返す - UIのレンダリング
     *
     * Goユーザー向け補足:
     * - JSX: JavaScriptの拡張構文で、HTMLライクにUIを記述
     *   → コンパイル時にReact.createElement()呼び出しに変換される
     *   → Go equivalent: html/template に似ているが、型安全で式を埋め込める
     *
     * - <PressableComponent ...> の説明:
     *   → タグ名が大文字で始まる場合はコンポーネント（変数）
     *   → この例では props.PressableComponent（デフォルトは Pressable）
     *   → 依存性注入パターンで、カスタムコンポーネントに差し替え可能
     *
     * - {...rest} の説明:
     *   → スプレッド演算子でオブジェクトの全プロパティを展開
     *   → 明示的に分割代入していないプロパティをまとめて渡す
     *   → Go equivalent: 構造体の全フィールドをコピーして渡す感じ
     *
     * - style={[...]} の説明:
     *   → 配列内のスタイルオブジェクトを順に適用（後勝ち）
     *   → 条件式でスタイルを動的に変更（三項演算子）
     *   → スプレッド演算子で配列を展開（条件付きでスタイルを追加）
     */
    return (
      <PressableComponent
        role="button" // ボタンロールの指定（Webアクセシビリティ、スクリーンリーダー用）
        accessibilityHint={undefined} // アクセシビリティヒント（追加説明、ここでは未使用）
        {...rest} // その他のプロパティを展開（testID, onPress等の追加プロパティ）
        // @ts-ignore - this will always be a pressable
        // TypeScript型チェックを無視（refの型が複雑で正確に表現できないため）
        ref={ref} // 参照の転送（親コンポーネントがこの要素にアクセスできるように）
        aria-label={label} // ARIAラベル（Webアクセシビリティ用、ボタンの説明）
        aria-pressed={state.pressed} // ARIA押下状態（Webアクセシビリティ、現在押されているか）
        accessibilityLabel={label} // アクセシビリティラベル（ネイティブアプリ用、スクリーンリーダーが読む）
        disabled={disabled || false} // 無効化状態（trueの場合タッチ不可）
        accessibilityState={{
          disabled: disabled || false, // アクセシビリティ状態での無効化フラグ（スクリーンリーダーに伝える）
        }}
        style={[
          // 基本的なレイアウトスタイル（アトミックCSS）
          a.flex_row,           // 横方向のフレックスレイアウト（子要素を横並び）
          a.align_center,       // 縦方向の中央揃え（子要素を縦方向中央に）
          a.justify_center,     // 横方向の中央揃え（子要素を横方向中央に）
          a.curve_continuous,   // 連続曲線の角丸効果（滑らかな角丸）
          flattenedBaseStyles,  // 結合された基本スタイル（色、サイズ等）
          // 条件付きスタイル適用（三項演算子 + スプレッド演算子）
          // ホバーまたは押下状態の場合、ホバースタイルを適用
          ...(state.hovered || state.pressed
            ? [hoverStyles, flatten(hoverStyleProp)] // ホバー/押下時: ホバースタイルを配列に展開
            : []), // それ以外: 空配列（スタイル追加なし）
        ]}
        // イベントハンドラーの接続（全てuseCallbackでメモ化済み）
        onPressIn={onPressIn}     // 押下開始時
        onPressOut={onPressOut}   // 押下終了時
        onHoverIn={onHoverIn}     // ホバー開始時
        onHoverOut={onHoverOut}   // ホバー終了時
        onFocus={onFocus}         // フォーカス取得時
        onBlur={onBlur}>          {/* フォーカス喪失時 */}
        {/*
          Context.Provider: コンテキストを子孫コンポーネントに提供

          Goユーザー向け補足:
          - Context.Provider は React の Context API の一部
          - value属性で渡した値が、子孫コンポーネントで useContext(Context) で取得可能
          - Go の context.WithValue に似ているが、型安全で自動的に再レンダリング
          - この例では、ボタンの状態（pressed, color等）を ButtonText や ButtonIcon に伝える
        */}
        <Context.Provider value={context}>
          {/*
            子要素のレンダリング - 条件付きレンダリング

            Goユーザー向け補足:
            - {式} でJavaScript式を埋め込める
            - typeof children === 'function' で型判定
            - 三項演算子: 条件 ? 真の場合 : 偽の場合
            - children が関数の場合: children(context) で関数を呼び出し、戻り値をレンダリング
              → Render Props パターン（高度なReactパターン）
              → 子要素がボタンの状態に応じて動的に見た目を変えられる
            - children が関数でない場合: そのまま children をレンダリング
              → 通常のパターン（静的な子要素）
          */}
          {typeof children === 'function' ? children(context) : children}
        </Context.Provider>
      </PressableComponent>
    )
  },
)
Button.displayName = 'Button'

/**
 * ボタン内テキストの共有スタイルを取得するカスタムフック
 * Gets shared styles for button text based on current button context
 *
 * Goユーザー向け補足:
 * - この関数は ButtonText コンポーネント内で呼ばれる
 * - useButtonContext() で親ボタンの状態（color, size等）を取得
 * - 親ボタンの状態に応じて、テキストの色とフォントサイズを決定
 * - useMemoで最適化されたスタイルオブジェクトを返す
 *
 * @returns TextStyle - テキスト用のスタイルオブジェクト（色、サイズ、太さ等）
 */
export function useSharedButtonTextStyles() {
  const t = useTheme() // テーマ取得（色パレット、トークン等）
  /**
   * ボタンコンテキストから状態とプロパティを取得
   *
   * Goユーザー向け補足:
   * - 分割代入で必要なフィールドのみ取得
   * - useButtonContext() は親の <Button> コンポーネントが
   *   Context.Provider で提供した値を取得
   * - これにより、子コンポーネント（ButtonText）が親の状態にアクセス可能
   */
  const {color, variant, disabled, size} = useButtonContext()

  return React.useMemo(() => {
    const baseStyles: TextStyle[] = [] // テキストスタイル配列（後で結合）

    /*
     * This is the happy path for new button styles, following the
     * deprecation of `variant` prop. This redundant `variant` check is here
     * just to make this handling easier to understand.
     * これは新しいボタンスタイルのハッピーパスで、`variant`プロパティの
     * 非推奨化に従っています。この冗長な`variant`チェックは、
     * この処理をより理解しやすくするためにあります。
     */
    if (variant === 'solid') {
      if (color === 'primary') {
        if (!disabled) {
          baseStyles.push({color: t.palette.white})
        } else {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.white,
              dim: t.atoms.text_inverted.color,
              dark: t.atoms.text_inverted.color,
            }),
          })
        }
      } else if (color === 'secondary') {
        if (!disabled) {
          baseStyles.push(t.atoms.text_contrast_medium)
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
          })
        }
      } else if (color === 'secondary_inverted') {
        if (!disabled) {
          baseStyles.push(t.atoms.text_inverted)
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
          })
        }
      } else if (color === 'negative') {
        if (!disabled) {
          baseStyles.push({color: t.palette.white})
        } else {
          baseStyles.push({color: t.palette.negative_300})
        }
      } else if (color === 'primary_subtle') {
        if (!disabled) {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.primary_600,
              dim: t.palette.primary_800,
              dark: t.palette.primary_800,
            }),
          })
        } else {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.primary_200,
              dim: t.palette.primary_200,
              dark: t.palette.primary_200,
            }),
          })
        }
      } else if (color === 'negative_subtle') {
        if (!disabled) {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.negative_600,
              dim: t.palette.negative_800,
              dark: t.palette.negative_800,
            }),
          })
        } else {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.negative_200,
              dim: t.palette.negative_200,
              dark: t.palette.negative_200,
            }),
          })
        }
      }
    } else {
      /*
       * BEGIN DEPRECATED STYLES
       * 非推奨スタイルの開始
       */
      if (color === 'primary') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.primary_600,
            })
          } else {
            baseStyles.push({color: t.palette.primary_600, opacity: 0.5})
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({color: t.palette.primary_600})
          } else {
            baseStyles.push({color: t.palette.primary_600, opacity: 0.5})
          }
        }
      } else if (color === 'secondary') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.contrast_600,
            })
          } else {
            baseStyles.push({
              color: t.palette.contrast_300,
            })
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.contrast_600,
            })
          } else {
            baseStyles.push({
              color: t.palette.contrast_300,
            })
          }
        }
      } else if (color === 'secondary_inverted') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.contrast_600,
            })
          } else {
            baseStyles.push({
              color: t.palette.contrast_300,
            })
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.contrast_600,
            })
          } else {
            baseStyles.push({
              color: t.palette.contrast_300,
            })
          }
        }
      } else if (color === 'negative') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({color: t.palette.negative_400})
          } else {
            baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({color: t.palette.negative_400})
          } else {
            baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
          }
        }
      } else if (color === 'negative_subtle') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({color: t.palette.negative_400})
          } else {
            baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({color: t.palette.negative_400})
          } else {
            baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
          }
        }
      }
      /*
       * END DEPRECATED STYLES
       * 非推奨スタイルの終了
       */
    }

    // サイズ別フォントスタイル設定
    if (size === 'large') {
      baseStyles.push(a.text_md, a.leading_snug, a.font_medium) // 大サイズ: 中フォント、スナッグ行間、ミディアム太さ
    } else if (size === 'small') {
      baseStyles.push(a.text_sm, a.leading_snug, a.font_medium) // 小サイズ: 小フォント、スナッグ行間、ミディアム太さ
    } else if (size === 'tiny') {
      baseStyles.push(a.text_xs, a.leading_snug, a.font_medium) // 極小サイズ: 極小フォント、スナッグ行間、ミディアム太さ
    }

    return StyleSheet.flatten(baseStyles) // スタイル配列をフラット化して返す
  }, [t, variant, color, size, disabled]) // 依存関係: テーマ、バリアント、色、サイズ、無効化状態
}

/**
 * ボタン内のテキストコンポーネント
 * Button text component with proper styling based on button context
 *
 * Goユーザー向け補足:
 * - このコンポーネントは <Button> の子要素として使用される
 * - 親ボタンの状態（color, size, disabled等）に応じて自動的にスタイルが変わる
 * - useSharedButtonTextStyles() で親の状態を取得し、適切なテキストスタイルを適用
 *
 * @example 使用例
 * <Button color="primary" size="large" label="送信">
 *   <ButtonText>送信する</ButtonText>
 * </Button>
 *
 * @param props - テキストコンポーネントのプロパティ
 * @param props.children - 表示するテキスト（文字列またはReact要素）
 * @param props.style - 追加のカスタムスタイル（オプション）
 * @param props....rest - その他のTextコンポーネントのプロパティ
 * @returns JSX.Element - レンダリングされたテキスト要素
 */
export function ButtonText({children, style, ...rest}: ButtonTextProps) {
  // 親ボタンの状態に基づいたテキストスタイルを取得
  const textStyles = useSharedButtonTextStyles()

  /**
   * Textコンポーネントをレンダリング
   *
   * Goユーザー向け補足:
   * - style={[...]} は配列でスタイルを結合
   *   1. a.text_center - 中央揃え（アトミックCSS）
   *   2. textStyles - 親ボタンの状態に応じた色とサイズ
   *   3. style - 外部から渡されたカスタムスタイル（最優先）
   * - {...rest} で他のプロパティを展開（accessibilityLabel等）
   * - {children} でテキスト内容を表示
   */
  return (
    <Text {...rest} style={[a.text_center, textStyles, style]}>
      {children}
    </Text>
  )
}

/**
 * ボタン内のアイコンコンポーネント
 * Button icon component with proper sizing and styling based on button context
 *
 * Goユーザー向け補足:
 * - このコンポーネントは <Button> の子要素として使用される
 * - 親ボタンの状態（size, color等）に応じて自動的にアイコンサイズと色が変わる
 * - アイコンを中央配置し、ボタンサイズに合わせて適切にスケーリング
 * - SVGアイコンをコンポーネントとして受け取り、レンダリング
 *
 * @example 使用例
 * <Button color="primary" size="large" label="追加">
 *   <ButtonIcon icon={PlusIcon} />
 *   <ButtonText>追加</ButtonText>
 * </Button>
 *
 * @param props - アイコンコンポーネントのプロパティ
 * @param props.icon - SVGアイコンコンポーネント（React.ComponentType）
 * @param props.size - アイコンサイズ（オプション、指定しない場合は自動計算）
 * @param props.position - 位置指定（非推奨、互換性のため残存）
 * @returns JSX.Element - レンダリングされたアイコン要素
 */
export function ButtonIcon({
  icon: Comp, // アイコンコンポーネント（名前をCompに変更して使用）
  size,
}: {
  /**
   * SVGアイコンコンポーネント
   *
   * Goユーザー向け補足:
   * - React.ComponentType<T> は Reactコンポーネントの型
   * - Go equivalent: type IconComponent func(props SVGIconProps) Element
   * - SVGIconProps を受け取って React要素を返すコンポーネント
   */
  icon: React.ComponentType<SVGIconProps>
  /**
   * @deprecated no longer needed
   * @deprecated もう必要ありません
   */
  position?: 'left' | 'right' // 位置指定（非推奨、以前はアイコンの左右配置に使用）
  /**
   * アイコンサイズ
   *
   * Goユーザー向け補足:
   * - SVGIconProps['size'] は Indexed Access Type
   *   → SVGIconProps型のsizeフィールドの型を取得
   *   → Go equivalent: type Size = SVGIconProps.Size（もしGoにこの機能があれば）
   * - オプショナルで、指定しない場合はボタンサイズから自動計算
   */
  size?: SVGIconProps['size']
}) {
  const {size: buttonSize} = useButtonContext() // 親ボタンのサイズを取得
  const textStyles = useSharedButtonTextStyles() // テキストスタイルを取得（色情報のため）

  /**
   * アイコンサイズとコンテナサイズの計算
   *
   * Goユーザー向け補足:
   * - useMemoで計算結果をメモ化（ボタンサイズが変わらない限り再計算しない）
   * - 2つの値を返す:
   *   1. iconSize: 実際のSVGアイコンのサイズ（ピクセル）
   *   2. iconContainerSize: アイコンを囲むコンテナのサイズ
   * - コンテナサイズをテキストサイズに合わせることで、
   *   アイコンとテキストの高さを揃える（視覚的な一貫性）
   */
  const {iconSize, iconContainerSize} = React.useMemo(() => {
    /**
     * Pre-set icon sizes for different button sizes
     * 異なるボタンサイズに対する事前設定アイコンサイズ
     *
     * Goユーザー向け補足:
     * - ?? は Nullish Coalescing 演算子（null/undefined の場合のデフォルト値）
     *   → Go equivalent: if size != nil { use size } else { use default }
     * - オブジェクトリテラルをインデックスアクセス: {large: 'md'}[buttonSize]
     *   → Goのmapアクセスに相当: map[string]string{"large": "md"}[buttonSize]
     * - as Exclude<T, U> は型アサーション
     *   → Exclude<T, U> は T から U を除外した型（この場合 undefined を除外）
     *   → 型安全性を保ちつつ、undefinedでないことを保証
     */
    const iconSizeShorthand =
      size ?? // propsでサイズが指定されている場合はそれを使用
      (({
        large: 'md', // 大ボタン: 中サイズアイコン (18px)
        small: 'sm', // 小ボタン: 小サイズアイコン (16px)
        tiny: 'xs',  // 極小ボタン: 極小サイズアイコン (12px)
      }[buttonSize || 'small'] || 'sm') as Exclude<
        SVGIconProps['size'],
        undefined
      >)

    /*
     * Copied here from icons/common.tsx so we can tweak if we need to, but
     * also so that we can calculate transforms.
     * icons/common.tsxからコピーしたもので、必要に応じて調整できるように、
     * また変形計算を行えるようにしています。
     *
     * Goユーザー向け補足:
     * - オブジェクトリテラルでサイズマッピングを定義
     * - インデックスアクセスで数値（ピクセル）を取得
     * - Go equivalent: map[string]int{"xs": 12, "sm": 16, ...}[iconSizeShorthand]
     */
    const iconSize = {
      xs: 12,    // 極小: 12ピクセル
      sm: 16,    // 小: 16ピクセル
      md: 18,    // 中: 18ピクセル
      lg: 24,    // 大: 24ピクセル
      xl: 28,    // 特大: 28ピクセル
      '2xl': 32, // 超特大: 32ピクセル（文字列キーも使用可能）
    }[iconSizeShorthand]

    /*
     * Goal here is to match rendered text size so that different size icons
     * don't increase button size
     * ここでの目標は、レンダリングされたテキストサイズに合わせることで、
     * 異なるサイズのアイコンがボタンサイズを増加させないようにすることです。
     *
     * Goユーザー向け補足:
     * - コンテナサイズをテキストの行高に合わせることで、
     *   アイコンとテキストが同じ高さになる
     * - これにより、ボタンの高さが一貫して保たれる
     */
    const iconContainerSize = {
      large: 20, // 大ボタン: 20px（テキストの行高と一致）
      small: 17, // 小ボタン: 17px
      tiny: 15,  // 極小ボタン: 15px
    }[buttonSize || 'small']

    return {
      iconSize,           // 実際のアイコンサイズ（SVGの幅/高さ）
      iconContainerSize,  // アイコンコンテナサイズ（固定高さでレイアウト統一）
    }
  }, [buttonSize, size]) // 依存配列: これらが変わったら再計算

  /**
   * アイコンをレンダリング
   *
   * Goユーザー向け補足:
   * - 2重のView構造でアイコンを中央配置
   *   1. 外側View: 固定サイズのコンテナ（テキスト行高と一致）
   *   2. 内側View: 絶対位置指定でアイコンを中央配置
   * - transform プロパティで要素を移動（CSS transform に相当）
   *   → top: 50%, left: 50% で要素の左上を中央に
   *   → translateX, translateY で要素の中心を中央に調整
   *   → Go equivalent: x = containerWidth/2 - iconWidth/2
   */
  return (
    <View
      style={[
        a.z_20, // z-index: 20（高い重なり順序、他の要素より前面に表示）
        {
          width: iconContainerSize,  // コンテナ幅（テキスト行高と一致）
          height: iconContainerSize, // コンテナ高さ
        },
      ]}>
      {/* 内側View: アイコンを中央配置するための絶対位置指定コンテナ */}
      <View
        style={[
          a.absolute, // position: absolute（絶対位置指定）
          {
            width: iconSize,   // アイコン幅（実際のSVGサイズ）
            height: iconSize,  // アイコン高さ
            top: '50%',       // 上から50%の位置（親の中央）
            left: '50%',      // 左から50%の位置（親の中央）
            /**
             * transform配列: 要素を移動させる変換処理
             *
             * Goユーザー向け補足:
             * - translateX, translateY は要素を平行移動
             * - (iconSize / 2) * -1 は要素の半分のサイズだけ負の方向に移動
             * - これにより、要素の中心点が親の中央に配置される
             * - 計算式: finalPosition = 50% - (iconSize / 2)
             */
            transform: [
              {
                translateX: (iconSize / 2) * -1, // X軸方向の中央寄せ調整（左に移動）
              },
              {
                translateY: (iconSize / 2) * -1, // Y軸方向の中央寄せ調整（上に移動）
              },
            ],
          },
        ]}>
        {/*
          Comp: SVGアイコンコンポーネントをレンダリング

          Goユーザー向け補足:
          - <Comp /> はコンポーネント変数を使用したレンダリング
          - propsで受け取ったアイコンコンポーネントをここで実際に描画
          - width プロパティでアイコンサイズを指定
          - style で色とイベント無効化を設定
        */}
        <Comp
          width={iconSize} // アイコンの幅を設定（高さは自動的に比率維持）
          style={[
            {
              color: textStyles.color,  // ボタンテキストと同じ色を適用（統一感）
              pointerEvents: 'none',    // ポインターイベントを無効化（親要素でイベント処理）
            },
          ]}
        />
      </View>
    </View>
  )
}
