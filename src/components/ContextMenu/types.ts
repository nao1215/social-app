/**
 * コンテキストメニューコンポーネントの型定義
 *
 * このファイルは、コンテキストメニューシステム全体で使用される型定義を提供します。
 * TypeScriptのtype/interfaceは、Goのstructに相当する概念です。
 *
 * 主な型:
 * - ContextType: コンテキストメニューの状態と操作を定義
 * - TriggerProps: メニューのトリガー（起動ボタン）の設定
 * - ItemProps: メニュー項目の設定
 * - Measurement: 要素の位置とサイズ情報
 *
 * @module ContextMenu/Types
 */

// React Nativeの基本型（アクセシビリティ、イベント、スタイル）
import {
  type AccessibilityRole, // アクセシビリティロール（button, menu等）
  type GestureResponderEvent, // タッチイベントの型
  type StyleProp, // スタイルプロパティの型
  type ViewStyle, // Viewコンポーネントのスタイル型
} from 'react-native'
// Reanimatedライブラリの共有値型（UIスレッドで使用）
import {type SharedValue} from 'react-native-reanimated'
// React型定義
import type React from 'react'

// ダイアログコンポーネントの型（コンテキストメニューと互換性あり）
import type * as Dialog from '#/components/Dialog'
// メニューコンポーネントの基本型
import {
  type ItemProps as MenuItemProps, // メニュー項目の基本プロパティ
  type RadixPassThroughTriggerProps, // Radix UI（Web）のトリガープロパティ
} from '#/components/Menu/types'

/**
 * メニューコンポーネントの共通型をエクスポート
 * 他のメニュー実装との互換性を保つため
 */
export type {
  GroupProps, // メニューグループのプロパティ
  ItemIconProps, // メニュー項目アイコンのプロパティ
  ItemTextProps, // メニュー項目テキストのプロパティ
} from '#/components/Menu/types'

/**
 * 補助ビューのプロパティ（GoのstructのようなものTypes）
 *
 * 補助ビューは、メニューの横に表示される追加コンテンツです。
 * 例: リアクション絵文字のパレット
 *
 * @property children - 表示する子要素
 * @property align - 配置方向（左揃え/右揃え）
 */
export type AuxiliaryViewProps = {
  children?: React.ReactNode
  align?: 'left' | 'right'
}

/**
 * メニュー項目のプロパティ（Goのstructに相当）
 *
 * MenuItemPropsを継承し、コンテキストメニュー固有の機能を追加しています。
 *
 * @property unstyled - デフォルトスタイルを無効化（絵文字リアクション等で使用）
 * @property onPress - 項目タップ時のコールバック（必須）
 * @property children - 静的な子要素 or ホバー状態を受け取る関数
 * @property position - 親要素の絶対位置（AuxiliaryView使用時に必要）
 */
export type ItemProps = Omit<MenuItemProps, 'onPress' | 'children'> & {
  // remove default styles (i.e. for emoji reactions)
  unstyled?: boolean
  onPress: (evt?: GestureResponderEvent) => void
  children?: React.ReactNode | ((hovered: boolean) => React.ReactNode)
  // absolute position of the parent element. if undefined, assumed to
  // be in the context menu. use this if using AuxiliaryView
  position?: Measurement
}

/**
 * 要素の測定情報（GoのstructのようなもTypes）
 *
 * React Nativeのmeasureメソッドで取得される要素の位置とサイズ。
 * コンテキストメニューの表示位置計算に使用されます。
 *
 * @property x - 画面左端からのX座標（ピクセル）
 * @property y - 画面上端からのY座標（ピクセル）
 * @property width - 要素の幅（ピクセル）
 * @property height - 要素の高さ（ピクセル）
 */
export type Measurement = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * コンテキストメニューのコンテキスト型（Goのstructに相当）
 *
 * React Contextで共有されるコンテキストメニューの状態と操作。
 * この型は、useContextMenuContextフックを通じてアクセスされます。
 *
 * @property isOpen - メニューが開いているか
 * @property measurement - トリガー要素の測定情報
 * @property animationSV - アニメーション進行度のSharedValue（0〜1）
 * @property translationSV - Y軸の移動量（画面内に収めるため）
 * @property mode - 表示モード（full: 完全なメニュー、auxiliary-only: 補助ビューのみ）
 * @property open - メニューを開く関数
 * @property close - メニューを閉じる関数
 * @property registerHoverable - ホバー可能な項目を登録（タッチ追跡用）
 * @property hoverablesSV - 登録された項目の位置情報（UIスレッド用）
 * @property hoveredMenuItem - 現在ホバーされている項目のID
 * @property setHoveredMenuItem - ホバー項目を設定する関数
 * @property onTouchUpMenuItem - 項目から指を離した時のコールバック
 */
export type ContextType = {
  isOpen: boolean
  measurement: Measurement | null
  /* Spring animation between 0 and 1 */
  animationSV: SharedValue<number>
  /* Translation in Y axis to ensure everything's onscreen */
  translationSV: SharedValue<number>
  mode: 'full' | 'auxiliary-only'
  open: (evt: Measurement, mode: 'full' | 'auxiliary-only') => void
  close: () => void
  registerHoverable: (
    id: string,
    rect: Measurement,
    onTouchUp: () => void,
  ) => void
  hoverablesSV: SharedValue<Record<string, {id: string; rect: Measurement}>>
  hoveredMenuItem: string | null
  setHoveredMenuItem: React.Dispatch<React.SetStateAction<string | null>>
  onTouchUpMenuItem: (id: string) => void
}

/**
 * メニューコンテキストの型（GoのstructのようなもTypes）
 *
 * メニューの配置方向を管理するコンテキスト。
 * 左揃え/右揃えでメニュー項目の表示位置が変わります。
 *
 * @property align - メニューの配置方向
 */
export type MenuContextType = {
  align: 'left' | 'right'
}

/**
 * 項目コンテキストの型（GoのstructのようなもTypes）
 *
 * 個別のメニュー項目の状態を管理するコンテキスト。
 * 無効化状態を子コンポーネントに伝播します。
 *
 * @property disabled - 項目が無効化されているか
 */
export type ItemContextType = {
  disabled: boolean
}

/**
 * トリガーコンポーネントのプロパティ（GoのstructのようなもTypes）
 *
 * コンテキストメニューを起動するトリガー要素の設定。
 * 長押し、ダブルタップで異なるモードのメニューを表示できます。
 *
 * @property children - レンダープロップ関数（状態と制御を受け取る）
 * @property label - トリガーのアクセシビリティラベル
 * @property contentLabel - 起動後のコンテンツのラベル（iOS/Android）
 * @property hint - アクセシビリティヒント
 * @property role - アクセシビリティロール
 * @property style - スタイルプロパティ
 */
export type TriggerProps = {
  children(props: TriggerChildProps): React.ReactNode
  label: string
  /**
   * When activated, this is the accessibility label for the entire thing that has been triggered.
   * For example, if the trigger is a message bubble, use the message content.
   *
   * @platform ios, android
   */
  contentLabel: string
  hint?: string
  role?: AccessibilityRole
  style?: StyleProp<ViewStyle>
}

/**
 * トリガーの子要素に渡されるプロパティ（ユニオン型）
 *
 * プラットフォームによって異なるプロパティを提供:
 * - Native（iOS/Android）: ジェスチャー制御、状態は常にfalse
 * - Web: Radix UIベースの制御、マウス/フォーカスイベント
 *
 * これは判別可能なユニオン型で、isNativeプロパティで分岐できます。
 */
export type TriggerChildProps =
  | {
      isNative: true
      control: {
        isOpen: boolean
        open: (mode: 'full' | 'auxiliary-only') => void
      }
      state: {
        hovered: false
        focused: false
        pressed: false
      }
      /**
       * We don't necessarily know what these will be spread on to, so we
       * should add props one-by-one.
       *
       * On web, these properties are applied to a parent `Pressable`, so this
       * object is empty.
       */
      props: {
        ref: null
        onPress: null
        onFocus: null
        onBlur: null
        onPressIn: null
        onPressOut: null
        accessibilityHint: null
        accessibilityLabel: string
        accessibilityRole: null
      }
    }
  | {
      isNative: false
      control: Dialog.DialogOuterProps['control']
      state: {
        hovered: false
        focused: false
        pressed: false
      }
      props: RadixPassThroughTriggerProps & {
        onPress: () => void
        onFocus: () => void
        onBlur: () => void
        onMouseEnter: () => void
        onMouseLeave: () => void
        accessibilityHint?: string
        accessibilityLabel: string
        accessibilityRole: AccessibilityRole
      }
    }
