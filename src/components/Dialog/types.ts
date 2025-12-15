/**
 * @file Dialog コンポーネントの型定義ファイル
 * @description ダイアログシステムの全型定義を提供
 *
 * このファイルはDialog関連の全型を一元管理し、以下を定義：
 * - DialogControlProps: ダイアログ開閉制御の公開API
 * - DialogContextProps: ダイアログ内部で使用されるContext型
 * - DialogOuterProps: ダイアログの外側コンテナProps
 * - DialogInnerProps: ダイアログの内側コンテンツProps
 *
 * Go言語との対比：
 * - type/interface: Goのstructやinterfaceに相当
 * - Union型(|): Goには直接的な対応物なし、interface{}や型スイッチで実現
 * - Partial<T>: 全フィールドをオプショナルにする（Goでは*付きポインタで表現）
 * - Required<T>: 全フィールドを必須にする（Goのデフォルト動作）
 * - Omit<T, K>: 特定フィールドを除外した型（Goでは埋め込みで近い表現）
 */

// React Native基本型 - UI関連のアクセシビリティとイベント、スタイル型
import {
  type AccessibilityProps,  // アクセシビリティプロパティ型（Goのstructタグに相当）
  type GestureResponderEvent, // タッチイベント型（Go: イベントハンドラー関数型に相当）
  type ScrollViewProps,       // スクロールビューのProps型
  type StyleProp,             // スタイルプロパティ型（柔軟なスタイル定義）
  type ViewStyle,             // Viewコンポーネントのスタイル型
} from 'react-native'
// React型定義 - コンポーネントと参照の型
import type React from 'react'

// プロジェクト内部型 - カスタムスタイル型とボトムシート関連型
import {type ViewStyleProp} from '#/alf'
import {type BottomSheetViewProps} from '../../../modules/bottom-sheet'
import {type BottomSheetSnapPoint} from '../../../modules/bottom-sheet/src/BottomSheet.types'

/**
 * アクセシビリティプロパティの必須版型
 * Required<T>: TypeScriptのユーティリティ型で、全プロパティを必須化
 *
 * Go言語との対比：
 * - TypeScriptのRequired<T>はGoでは全フィールド非ポインタのstructに相当
 * - オプショナルフィールド（?:）を全て必須フィールドに変換
 */
type A11yProps = Required<AccessibilityProps>

/**
 * ダイアログ制御の参照型 - useImperativeHandleで外部公開されるAPI
 *
 * この型はuseImperativeHandleによって変更され、ダイアログを制御するための
 * 公開APIを提供します。ここで定義されたメソッドは、実際には`Dialog.Outer`
 * コンポーネント内で定義されたハンドラーになります。
 *
 * `Partial<GestureResponderEvent>`の追加により、この型をボタンの`onPress`
 * プロパティに直接渡すことができます。この型がない場合、`.open()`をラップする
 * 関数を作成する必要があります。
 *
 * Go言語との対比：
 * - interface型に相当（メソッドセットの定義）
 * - Partial<T>: 全フィールドをオプショナルにする（Go: ポインタフィールド）
 * - 交差型(&): Goでは埋め込みで表現
 *
 * 使用例：
 * ```typescript
 * const control = useDialogControl()
 * // ボタンのonPressに直接渡せる
 * <Button onPress={control.open} />
 * // またはオプション付きで呼び出し
 * control.open({ index: 1 })
 * ```
 */
export type DialogControlRefProps = {
  /**
   * ダイアログを開くメソッド
   *
   * @param options - オプション設定（スナップポイントのインデックスなど）
   *                  Partial<GestureResponderEvent>により、イベントオブジェクトとしても機能
   *
   * Go言語との対比：
   * - 関数型フィールド: Go: `Open func(options ...OpenOption) error`
   * - オプショナルパラメータ(?): Goでは可変長引数や関数オプションパターンで実現
   */
  open: (
    options?: DialogControlOpenOptions & Partial<GestureResponderEvent>,
  ) => void

  /**
   * ダイアログを閉じるメソッド
   *
   * @param callback - 閉じた後に実行されるコールバック関数（オプション）
   *
   * Go言語との対比：
   * - コールバック関数: Goでは `func(callback func())` で表現
   * - オプショナルパラメータ: Goでは `callback ...func()` で可変長引数として表現
   */
  close: (callback?: () => void) => void
}

/**
 * useDialogControlフックの戻り値型
 *
 * DialogControlRefPropsを拡張し、追加のメタデータを含みます。
 * この型はダイアログ制御フックが返すオブジェクトの完全な型です。
 *
 * Go言語との対比：
 * - 型の拡張(&): Goでは構造体の埋め込み（embedding）で表現
 *   ```go
 *   type DialogControlProps struct {
 *       DialogControlRefProps // 埋め込み
 *       ID      string
 *       Ref     *DialogControlRefProps
 *       IsOpen  *bool // オプショナルフィールドはポインタ
 *   }
 *   ```
 */
export type DialogControlProps = DialogControlRefProps & {
  /** ダイアログの一意識別子（複数ダイアログの区別に使用） */
  id: string

  /**
   * ダイアログ制御の参照オブジェクト
   * React.RefObject<T>: Reactの参照型（Goのポインタに近い）
   *
   * Go言語との対比：
   * - RefObject: Goの *T（ポインタ型）に相当
   * - .current: Goのポインタデリファレンス（*ptr）に相当
   */
  ref: React.RefObject<DialogControlRefProps>

  /**
   * ダイアログが開いているかどうかのフラグ（オプション）
   *
   * Go言語との対比：
   * - オプショナルフィールド(?: ): Goでは *bool で表現
   * - undefined可能: Goではnilで表現
   */
  isOpen?: boolean
}

/**
 * ダイアログContext型 - ダイアログツリー内で共有される状態と関数
 *
 * この型はReact Contextを通じてダイアログの子孫コンポーネントに
 * 提供される値を定義します。
 *
 * Go言語との対比：
 * - Context: Goのcontext.Contextに似た概念だが、値の伝播方法が異なる
 * - React Context: コンポーネントツリーで値を下方伝播
 * - Go context: リクエストスコープで値を伝播
 */
export type DialogContextProps = {
  /** ダイアログを閉じる関数（DialogControlPropsから取得） */
  close: DialogControlProps['close']

  /** ネイティブダイアログ（ボトムシート）かどうか */
  isNativeDialog: boolean

  /**
   * ネイティブダイアログのスナップポイント（表示高さの段階）
   *
   * BottomSheetSnapPoint: ボトムシートの表示状態を表す列挙型
   * - Hidden: 非表示
   * - Partial: 部分表示
   * - Full: 全画面表示
   */
  nativeSnapPoint: BottomSheetSnapPoint

  /** ドラッグ操作を無効化するかどうか */
  disableDrag: boolean

  /**
   * ドラッグ無効化状態を設定する関数
   * React.Dispatch<React.SetStateAction<T>>: React状態更新関数の型
   *
   * Go言語との対比：
   * - Dispatch: Goでは `func(bool)` または `func(func(bool) bool)` で表現
   * - SetStateAction<T>: 値または値を返す関数を受け取る（関数型オプション）
   *
   * 使用例：
   * ```typescript
   * setDisableDrag(true)              // 直接値を設定
   * setDisableDrag(prev => !prev)     // 前の値を基に設定（Goの更新関数）
   * ```
   */
  setDisableDrag: React.Dispatch<React.SetStateAction<boolean>>

  /**
   * フックがダイアログ内で使用されているかどうか
   *
   * この値により、useDialogContextがダイアログ外で呼ばれた場合に
   * 適切なデフォルト値を返すことができます。
   */
  isWithinDialog: boolean
}

/**
 * ダイアログ開くオプション型
 *
 * open()メソッドに渡すオプション設定を定義します。
 * 現在はネイティブ専用のスナップポイント指定のみ対応。
 */
export type DialogControlOpenOptions = {
  /**
   * ネイティブ専用オプション
   *
   * ボトムシートを開く際のスナップポイントのインデックス（オプション）。
   * デフォルトは0で、最初のスナップポイント（つまり「開く」状態）を意味します。
   *
   * 例: index: 0 = 部分表示, index: 1 = 全画面表示
   */
  index?: number
}

/**
 * ダイアログ外側コンテナのProps型
 *
 * Dialog.Outerコンポーネントが受け取るプロパティを定義します。
 * プラットフォーム固有のオプション（nativeOptions, webOptions）を
 * 条件付きで提供できます。
 *
 * Go言語との対比：
 * - オプショナルフィールド(?: ): Goではポインタフィールドで表現
 * - Omit<T, K>: 型TからフィールドKを除外（Goでは新しいstructを定義）
 */
export type DialogOuterProps = {
  /** ダイアログ制御オブジェクト（必須） */
  control: DialogControlProps

  /** ダイアログが閉じた時のコールバック関数 */
  onClose?: () => void

  /**
   * ネイティブ専用オプション（iOS/Android）
   *
   * Omit<T, K>: BottomSheetViewPropsから'children'を除外
   * - children はDialog.Outerが管理するため除外
   *
   * Go言語との対比：
   * - Omit: Goでは除外したいフィールドを含まない新しいstructを定義
   */
  nativeOptions?: Omit<BottomSheetViewProps, 'children'>

  /**
   * Web専用オプション
   *
   * オブジェクト型のリテラル定義（インライン型定義）
   * Go: 匿名structに相当
   */
  webOptions?: {
    /** ダイアログを画面中央に配置するか */
    alignCenter?: boolean

    /** 背景クリック時のカスタムハンドラー */
    onBackgroundPress?: (e: GestureResponderEvent) => void
  }

  /** テスト用ID（自動テストでの要素特定に使用） */
  testID?: string
}

/**
 * ダイアログ内側の基本Props型（内部使用）
 *
 * React.PropsWithChildren<T>: 子要素を含む型
 * - children: React.ReactNode を自動的に追加
 *
 * 交差型(&): 複数の型を結合
 * - Go: struct埋め込みに相当
 *
 * ジェネリック型<T>: 追加のプロパティを型パラメータで受け取る
 * - Go: インターフェースの合成で表現
 */
type DialogInnerPropsBase<T> = React.PropsWithChildren<ViewStyleProp> &
  T & {
    /** テスト用ID */
    testID?: string
  }

/**
 * ダイアログ内側のProps型（Union型による2パターン定義）
 *
 * この型は2つの相互排他的なパターンを定義します：
 * 1. labelなし + accessibilityLabelledBy必須パターン
 * 2. label必須 + accessibilityLabelledByなしパターン
 *
 * Union型(|): どちらか一方の型に適合する必要がある
 * - Go: インターフェースやtype switchで近い表現が可能
 *
 * Go言語での近似表現：
 * ```go
 * type DialogInnerProps interface {
 *     isDialogInnerProps()
 * }
 *
 * type DialogInnerPropsWithA11y struct {
 *     AccessibilityLabelledBy string
 *     AccessibilityDescribedBy string
 *     // label は含まない
 * }
 * func (d DialogInnerPropsWithA11y) isDialogInnerProps() {}
 *
 * type DialogInnerPropsWithLabel struct {
 *     Label string
 *     // accessibilityLabelledBy は含まない
 * }
 * func (d DialogInnerPropsWithLabel) isDialogInnerProps() {}
 * ```
 *
 * undefined型の明示: TypeScriptの型安全性のための技法
 * - `label?: undefined`: labelフィールドが存在してはいけないことを明示
 * - Union型で相互排他性を保証するための記述
 */
export type DialogInnerProps =
  // パターン1: アクセシビリティID指定パターン
  | DialogInnerPropsBase<{
      /** label未定義（undefinedのみ許容） */
      label?: undefined

      /**
       * アクセシビリティラベルのID参照
       * aria-labelledby: 別要素のIDを参照してラベルを設定
       *
       * A11yProps['aria-labelledby']: Indexed Access Type
       * - A11yProps型のaria-labelledbyフィールドの型を取得
       * - Go: フィールドの型を直接参照できないため、型エイリアスが必要
       */
      accessibilityLabelledBy: A11yProps['aria-labelledby']

      /**
       * アクセシビリティ説明のID参照
       * aria-describedby: 別要素のIDを参照して説明を設定
       */
      accessibilityDescribedBy: string

      /**
       * キーボード消去モード
       * ScrollViewProps['keyboardDismissMode']: Indexed Access Type
       * - 'none' | 'on-drag' | 'interactive' などの列挙値
       */
      keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']

      /** コンテンツコンテナのスタイル */
      contentContainerStyle?: StyleProp<ViewStyle>

      /** ヘッダー要素（任意のReactノード） */
      header?: React.ReactNode
    }>
  // パターン2: 直接ラベル指定パターン
  | DialogInnerPropsBase<{
      /** ダイアログのラベルテキスト（必須） */
      label: string

      /** accessibilityLabelledBy未定義 */
      accessibilityLabelledBy?: undefined

      /** accessibilityDescribedBy未定義 */
      accessibilityDescribedBy?: undefined

      /** キーボード消去モード */
      keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']

      /** コンテンツコンテナのスタイル */
      contentContainerStyle?: StyleProp<ViewStyle>

      /** ヘッダー要素 */
      header?: React.ReactNode
    }>
