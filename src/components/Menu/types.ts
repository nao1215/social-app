/**
 * @fileoverview メニューコンポーネントの型定義
 * Menu component type definitions
 *
 * このファイルはメニューシステムで使用される全ての型定義を提供します。
 * メニューコンポーネントはドロップダウンメニュー、コンテキストメニュー、アクションシートなどに使用されます。
 *
 * This file provides all type definitions used in the menu system.
 * Menu components are used for dropdown menus, context menus, action sheets, etc.
 *
 * ## Goユーザー向けの説明 (For Go developers):
 * - TypeScriptの`type`は、Goの`type`エイリアスに似ています
 * - TypeScriptの`interface`は、Goの`struct`タグのような構造定義です
 * - Union型（`|`）は、Goの空インターフェース+型アサーションに似た概念です
 * - `React.PropsWithChildren`は、childrenフィールドを自動追加するジェネリック型です（Goの構造体埋め込みに類似）
 */

// Reactコアライブラリ - UIコンポーネント構築のための基本機能
import React from 'react'
// React Native型定義 - モバイル/Webアプリのネイティブコンポーネント型
import {
  AccessibilityProps,     // アクセシビリティプロパティの型定義
  AccessibilityRole,      // アクセシビリティロールの型（button, menuなど）
  GestureResponderEvent,  // タッチ/クリックイベントの型
  PressableProps,         // タッチ可能コンポーネントのプロパティ型
} from 'react-native'

// デザインシステム型 - スタイルとテーマ関連の型定義
import {TextStyleProp, ViewStyleProp} from '#/alf'
// ダイアログコンポーネント型 - メニューはダイアログ上に構築される
import * as Dialog from '#/components/Dialog'
// SVGアイコンプロパティ型 - メニューアイテムに表示するアイコン用
import {Props as SVGIconProps} from '#/components/icons/common'

/**
 * メニューコンテキストの型定義
 * Menu context type definition
 *
 * メニュー全体で共有される状態とメソッドを保持します。
 * Holds state and methods shared across the entire menu.
 *
 * ## Goユーザー向けの説明:
 * これはGoのcontextパターンに似ていますが、TypeScriptではReact Contextとして実装されます。
 * `control`フィールドは、メニューの開閉を制御するメソッドを持つオブジェクトです。
 *
 * @example
 * // Goでの類似パターン:
 * type MenuContext struct {
 *   control DialogControl
 * }
 */
export type ContextType = {
  // Dialogの制御オブジェクト - メニューの開閉やID管理を担当
  // Dialog control object - handles menu open/close and ID management
  control: Dialog.DialogOuterProps['control']
  // ↑ Indexed Access Type: Dialog.DialogOuterProps型の'control'プロパティの型を取得
  // ↑ Indexed Access Type: Gets the type of 'control' property from Dialog.DialogOuterProps
  // Goでは: type Control = DialogOuterProps.Control のような型エイリアスに相当
}

/**
 * メニューアイテムコンテキストの型定義
 * Menu item context type definition
 *
 * 個々のメニューアイテムの状態を保持します。
 * Holds state for individual menu items.
 *
 * ## Goユーザー向けの説明:
 * これは各メニューアイテムに関連する状態を表すシンプルな構造体です。
 *
 * @example
 * // Goでの類似パターン:
 * type ItemContext struct {
 *   Disabled bool
 * }
 */
export type ItemContextType = {
  // アイテムが無効化されているかどうか
  // Whether the item is disabled
  disabled: boolean
}

/**
 * Radix UIから渡されるトリガープロパティ
 * Trigger properties passed from Radix UI
 *
 * Web環境でRadix UIライブラリから渡される低レベルのプロパティです。
 * Low-level properties passed from Radix UI library in web environment.
 *
 * ## Goユーザー向けの説明:
 * - `ref`はGoのポインタに似た概念で、DOM要素への参照を保持します
 * - `['data-disabled']`のような角括弧記法は、ハイフンを含むプロパティ名を定義するTypeScript構文です
 * - Goでは`type Props map[string]interface{}`のようなマップで表現されることが多いです
 */
export type RadixPassThroughTriggerProps = {
  // DOM要素への参照 - Reactでの要素アクセスに使用
  // Reference to DOM element - used for element access in React
  ref: React.RefObject<any>
  // ↑ RefObject<T>: Reactの参照オブジェクト型。Goのポインタ*Tに類似

  // 一意のID - アクセシビリティとARIAアトリビュート用
  // Unique ID - for accessibility and ARIA attributes
  id: string

  // HTML要素のタイプ
  // HTML element type
  type: 'button'
  // ↑ リテラル型: 文字列"button"のみを許可。Goの定数に似た概念

  // 無効状態
  // Disabled state
  disabled: boolean

  // データ属性: 無効状態をHTML属性として表現
  // Data attribute: represents disabled state as HTML attribute
  ['data-disabled']: boolean
  // ↑ 角括弧記法: ハイフンを含むプロパティ名の定義方法

  // データ属性: メニューの開閉状態（"open" | "closed"）
  // Data attribute: menu open/close state ("open" | "closed")
  ['data-state']: string

  // ARIA属性: このボタンが制御する要素のID（オプション）
  // ARIA attribute: ID of the element this button controls (optional)
  ['aria-controls']?: string
  // ↑ `?`マーク: オプショナルプロパティ。Goのポインタフィールド *stringに類似

  // ARIA属性: ポップアップメニューを持つかどうか（オプション）
  // ARIA attribute: whether it has a popup menu (optional)
  ['aria-haspopup']?: boolean

  // ARIA属性: メニューが展開されているかどうか（オプション）
  // ARIA attribute: whether the menu is expanded (optional)
  ['aria-expanded']?: AccessibilityProps['aria-expanded']

  // キーボードイベントハンドラー - キー入力時のコールバック
  // Keyboard event handler - callback for key inputs
  onKeyDown: (e: React.KeyboardEvent) => void
  // ↑ 関数型: Goの`type Handler func(e KeyboardEvent)`に相当

  /**
   * ポインターダウンイベントハンドラー
   * Pointer down event handler
   *
   * RadixはこれをデフォルトでonClickに使用しますが、
   * Web版ではスクロール中の誤タップを防ぐため、onPressをオーバーライドします。
   *
   * Radix provides this by default for onClick,
   * but we override it on web to use onPress instead to avoid false taps while scrolling.
   */
  onPointerDown: PressableProps['onPointerDown']
  // ↑ Indexed Access Type: PressablePropsからonPointerDownの型を抽出
}

/**
 * メニュートリガーのプロパティ型
 * Menu trigger properties type
 *
 * メニューを開くためのトリガーコンポーネントのプロパティです。
 * Properties for the trigger component that opens the menu.
 *
 * ## Goユーザー向けの説明:
 * - `children`はレンダープロパティパターンで、関数を子要素として受け取ります
 * - これはGoのコールバック関数に似ていますが、UIの描画を返す点が特徴的です
 */
export type TriggerProps = {
  // レンダープロパティ関数 - トリガーの見た目をカスタマイズ
  // Render property function - customizes trigger appearance
  children(props: TriggerChildProps): React.ReactNode
  // ↑ 関数型プロパティ: 子要素として関数を受け取るパターン（Render Props Pattern）
  // ↑ Goでは: Children func(props TriggerChildProps) ReactNode に相当

  // アクセシビリティラベル - スクリーンリーダー用のテキスト
  // Accessibility label - text for screen readers
  label: string

  // アクセシビリティヒント - 追加の説明（オプション）
  // Accessibility hint - additional description (optional)
  hint?: string

  // アクセシビリティロール - 要素の役割（オプション、デフォルト: button）
  // Accessibility role - element's role (optional, default: button)
  role?: AccessibilityRole
}

/**
 * トリガーの子要素プロパティ型（Union型）
 * Trigger child properties type (Union type)
 *
 * ネイティブ環境とWeb環境で異なるプロパティを持つため、Union型で定義します。
 * Uses Union type as properties differ between native and web environments.
 *
 * ## Goユーザー向けの説明:
 * Union型（`|`演算子）は、複数の型のいずれかを許可する型です。
 * Goでは interface{} + 型スイッチや型アサーションで実現する概念に似ています。
 *
 * @example
 * // Goでの類似パターン:
 * type TriggerChildProps interface {
 *   isNativePlatform() bool
 * }
 * type NativeTriggerProps struct { IsNative bool; ... }
 * type WebTriggerProps struct { IsNative bool; ... }
 */
export type TriggerChildProps =
  // ネイティブプラットフォーム（iOS/Android）用のプロパティ
  // Properties for native platforms (iOS/Android)
  | {
      // プラットフォームフラグ: true = ネイティブ
      // Platform flag: true = native
      isNative: true
      // ↑ リテラル型: trueのみを許可。型の判別に使用（Discriminated Union）

      // メニュー制御オブジェクト
      // Menu control object
      control: Dialog.DialogOuterProps['control']

      // インタラクション状態
      // Interaction state
      state: {
        /**
         * ホバー状態（ネイティブでは常にfalse）
         * Hover state (always false on native)
         *
         * モバイルデバイスにはホバーの概念がないため、常にfalse
         * Always false as mobile devices don't have hover concept
         */
        hovered: false
        // ↑ リテラル型false: hoveredは常にfalseであることを型レベルで保証

        // フォーカス状態
        // Focus state
        focused: boolean

        // プレス状態（タッチ中かどうか）
        // Press state (whether being touched)
        pressed: boolean
      }

      /**
       * プロパティオブジェクト
       * Properties object
       *
       * これらのプロパティをどの要素に適用するか不明なため、
       * 一つずつ手動で適用する必要があります。
       *
       * We don't necessarily know what these will be spread on to,
       * so we should add props one-by-one.
       *
       * Web版では親Pressableに適用されるため、このオブジェクトは空です。
       * On web, these properties are applied to a parent Pressable,
       * so this object is empty.
       */
      props: {
        // 要素参照（ネイティブではnull）
        // Element reference (null on native)
        ref: null

        // プレスイベントハンドラー
        // Press event handler
        onPress: () => void

        // フォーカスイベントハンドラー
        // Focus event handler
        onFocus: () => void

        // フォーカス喪失イベントハンドラー
        // Blur event handler
        onBlur: () => void

        // プレス開始イベントハンドラー
        // Press in event handler
        onPressIn: () => void

        // プレス終了イベントハンドラー
        // Press out event handler
        onPressOut: () => void

        // アクセシビリティヒント（オプション）
        // Accessibility hint (optional)
        accessibilityHint?: string

        // アクセシビリティラベル
        // Accessibility label
        accessibilityLabel: string

        // アクセシビリティロール
        // Accessibility role
        accessibilityRole: AccessibilityRole
      }
    }
  // Webプラットフォーム用のプロパティ
  // Properties for web platform
  | {
      // プラットフォームフラグ: false = Web
      // Platform flag: false = web
      isNative: false
      // ↑ リテラル型: falseのみを許可。Union型の判別に使用

      // メニュー制御オブジェクト
      // Menu control object
      control: Dialog.DialogOuterProps['control']

      // インタラクション状態
      // Interaction state
      state: {
        // ホバー状態（マウスカーソルが上にあるか）
        // Hover state (whether mouse cursor is over)
        hovered: boolean

        // フォーカス状態
        // Focus state
        focused: boolean

        /**
         * プレス状態（Webでは常にfalse）
         * Press state (always false on web)
         *
         * Webではマウスイベントを使用するため、プレス状態は使用しません
         * Press state is not used on web as we use mouse events
         */
        pressed: false
        // ↑ リテラル型false: pressedは常にfalseであることを型レベルで保証
      }

      // プロパティオブジェクト（Radix UI + カスタムプロパティ）
      // Properties object (Radix UI + custom properties)
      props: RadixPassThroughTriggerProps & {
        // ↑ インターセクション型（&）: 複数の型を結合。Goの構造体埋め込みに類似
        // ↑ Intersection type (&): Combines multiple types. Similar to struct embedding in Go

        // プレスイベントハンドラー
        // Press event handler
        onPress: () => void

        // フォーカスイベントハンドラー
        // Focus event handler
        onFocus: () => void

        // フォーカス喪失イベントハンドラー
        // Blur event handler
        onBlur: () => void

        // マウス進入イベントハンドラー
        // Mouse enter event handler
        onMouseEnter: () => void

        // マウス退出イベントハンドラー
        // Mouse leave event handler
        onMouseLeave: () => void

        // アクセシビリティヒント（オプション）
        // Accessibility hint (optional)
        accessibilityHint?: string

        // アクセシビリティラベル
        // Accessibility label
        accessibilityLabel: string

        // アクセシビリティロール
        // Accessibility role
        accessibilityRole: AccessibilityRole
      }
    }

/**
 * メニューアイテムのプロパティ型
 * Menu item properties type
 *
 * メニュー内の選択可能なアイテムのプロパティです。
 * Properties for selectable items within the menu.
 *
 * ## Goユーザー向けの説明:
 * - `React.PropsWithChildren<T>`はTにchildrenプロパティを追加するジェネリック型です
 * - `Omit<T, K>`は型TからキーKを除外する型です。Goの構造体埋め込みの逆操作に相当します
 * - `&`はインターセクション型で、複数の型を結合します
 *
 * @example
 * // Goでの類似パターン:
 * type ItemProps struct {
 *   PressableProps  // 埋め込み（styleを除く）
 *   ViewStyleProp   // 埋め込み
 *   Children        interface{}
 *   Label           string
 *   OnPress         func(e GestureResponderEvent)
 * }
 */
export type ItemProps = React.PropsWithChildren<
  // ↑ ジェネリック型: childrenプロパティを自動追加
  // ↑ Generic type: automatically adds children property
  Omit<PressableProps, 'style'> &
  // ↑ Omit: PressablePropsから'style'プロパティを除外
  // ↑ Omit: Excludes 'style' property from PressableProps
    ViewStyleProp & {
      // メニューアイテムのラベル
      // Menu item label
      label: string

      // プレスイベントハンドラー（必須）
      // Press event handler (required)
      onPress: (e: GestureResponderEvent) => void
    }
>

/**
 * メニューアイテムテキストのプロパティ型
 * Menu item text properties type
 *
 * メニューアイテム内のテキスト表示用のプロパティです。
 * Properties for text display within menu items.
 *
 * ## Goユーザー向けの説明:
 * `& {}`は、現時点では追加プロパティがないことを示しています。
 * 将来的な拡張のために型エイリアスとして定義されています。
 */
export type ItemTextProps = React.PropsWithChildren<TextStyleProp & {}>
// ↑ 空のオブジェクト型との結合: 将来的な拡張のための予約

/**
 * メニューアイテムアイコンのプロパティ型
 * Menu item icon properties type
 *
 * メニューアイテム内のアイコン表示用のプロパティです。
 * Properties for icon display within menu items.
 *
 * ## Goユーザー向けの説明:
 * - `React.ComponentType<T>`は、Reactコンポーネントを表す型です
 * - Goでは`type IconComponent func(props SVGIconProps) ReactNode`のような関数型に相当します
 */
export type ItemIconProps = React.PropsWithChildren<{
  // アイコンコンポーネント
  // Icon component
  icon: React.ComponentType<SVGIconProps>
  // ↑ ComponentType: Reactコンポーネントの型。関数コンポーネントまたはクラスコンポーネント
  // ↑ ComponentType: Type for React components. Function or class components

  // アイコンの位置（左または右、オプション）
  // Icon position (left or right, optional)
  position?: 'left' | 'right'
  // ↑ Union型: 'left'または'right'の文字列リテラルのみを許可
  // ↑ Union type: Only allows string literals 'left' or 'right'
}>

/**
 * メニューグループのプロパティ型
 * Menu group properties type
 *
 * 関連するメニューアイテムをグループ化するためのプロパティです。
 * Properties for grouping related menu items.
 *
 * ## Goユーザー向けの説明:
 * 現時点ではViewStylePropのみを継承していますが、
 * 将来的にグループ固有のプロパティを追加するための型定義です。
 *
 * @example
 * // Goでの類似パターン:
 * type GroupProps struct {
 *   ViewStyleProp
 *   Children interface{}
 * }
 */
export type GroupProps = React.PropsWithChildren<ViewStyleProp & {}>
// ↑ 現時点では追加プロパティなし。将来的な拡張のための型定義
