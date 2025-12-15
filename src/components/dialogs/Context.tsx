/**
 * グローバルダイアログコントロールのコンテキストモジュール
 *
 * このモジュールは、アプリケーション全体で使用される各種ダイアログ（モーダル）の
 * 表示・非表示を制御するための一元管理コンテキストを提供します。
 * React ContextとカスタムフックでProvider Patternを実装しています。
 *
 * 【Goユーザー向け補足】
 * - createContext: Goのcontext.Contextに似た、コンポーネントツリー全体で共有する値を作成
 * - useContext: 親コンポーネントから提供されたコンテキスト値を取得するフック
 * - useMemo: 値のメモ化（キャッシュ）を行うフック。依存配列の値が変わらない限り再計算しない
 * - useState: コンポーネントの状態を管理するフック。Goでは構造体のフィールドに相当
 */

// React Contextの基本フック群をインポート
// createContext: グローバルな状態共有のためのコンテキストを作成
// useContext: 作成したコンテキストの値を取得
// useMemo: 計算結果をメモ化してパフォーマンスを最適化
// useState: コンポーネントの状態管理
import {createContext, useContext, useMemo, useState} from 'react'

// 年齢確認リダイレクトダイアログの状態型をインポート
import {type AgeAssuranceRedirectDialogState} from '#/components/ageAssurance/AgeAssuranceRedirectDialog'
// Dialog コンポーネントの全機能をインポート（名前空間として使用）
import * as Dialog from '#/components/Dialog'
// メールダイアログの画面型をインポート
import {type Screen} from '#/components/dialogs/EmailDialog/types'

/**
 * ダイアログコントロールの基本型
 * Dialog.DialogControlPropsはopen/closeなどのメソッドを持つ
 */
type Control = Dialog.DialogControlProps

/**
 * 状態を持つダイアログコントロールの型定義
 *
 * ジェネリック型Tでダイアログが保持するデータの型を指定します。
 *
 * @template T - ダイアログが保持する値の型
 *
 * 【Goユーザー向け補足】
 * - interface/typeはGoのstructに相当
 * - ジェネリック<T>はGoの型パラメータ（Go 1.18以降）に相当
 * - undefinedは値が存在しない可能性を示す（Goのnilに近い）
 */
export type StatefulControl<T> = {
  control: Control // 基本的なダイアログ制御（開く/閉じる）
  open: (value: T) => void // 値を設定してダイアログを開く
  clear: () => void // 保持している値をクリア
  value: T | undefined // 現在保持している値（undefinedの可能性あり）
}

/**
 * グローバルダイアログコントロールを集約したコンテキスト型
 *
 * アプリケーション内の全ダイアログを一箇所で管理するための型定義です。
 *
 * 【Goユーザー向け補足】
 * - この型はGoの構造体フィールドの集合に相当
 * - 各フィールドがそれぞれのダイアログの制御機能を持つ
 */
type ControlsContext = {
  mutedWordsDialogControl: Control // ミュート単語設定ダイアログ
  signinDialogControl: Control // サインインダイアログ
  inAppBrowserConsentControl: StatefulControl<string> // アプリ内ブラウザ同意ダイアログ（URL文字列を保持）
  emailDialogControl: StatefulControl<Screen> // メール設定ダイアログ（画面状態を保持）
  linkWarningDialogControl: StatefulControl<{
    // リンク警告ダイアログ（リンク情報を保持）
    href: string // リンク先URL
    displayText: string // 表示テキスト
    share?: boolean // 共有モードかどうか（オプショナル）
  }>
  ageAssuranceRedirectDialogControl: StatefulControl<AgeAssuranceRedirectDialogState> // 年齢確認リダイレクトダイアログ
}

/**
 * グローバルダイアログコントロールのReact Context
 *
 * 【Goユーザー向け補足】
 * - createContextはGoのcontext.WithValueに似た機能
 * - null初期値は、Providerでラップされていない場合のデフォルト値
 */
const ControlsContext = createContext<ControlsContext | null>(null)
// デバッグツールで表示される名前を設定
ControlsContext.displayName = 'GlobalDialogControlsContext'

/**
 * グローバルダイアログコントロールコンテキストを取得するカスタムフック
 *
 * このフックはコンポーネント内でグローバルダイアログの制御機能にアクセスするために使用します。
 * Providerでラップされていない場合はエラーをスローします。
 *
 * @returns {ControlsContext} グローバルダイアログコントロール
 * @throws {Error} Providerでラップされていない場合
 *
 * @example
 * function MyComponent() {
 *   const {signinDialogControl} = useGlobalDialogsControlContext()
 *   return <button onClick={() => signinDialogControl.open()}>Sign In</button>
 * }
 *
 * 【Goユーザー向け補足】
 * - カスタムフック（useで始まる関数）はReactのルールに従った再利用可能なロジック
 * - useContextはGoのcontext.Valueに相当する値の取得方法
 */
export function useGlobalDialogsControlContext() {
  // コンテキストから現在の値を取得
  const ctx = useContext(ControlsContext)
  // Providerでラップされていない場合（ctx === null）はエラー
  if (!ctx) {
    throw new Error(
      'useGlobalDialogsControlContext must be used within a Provider',
    )
  }
  return ctx
}

/**
 * グローバルダイアログコントロールのプロバイダーコンポーネント
 *
 * アプリケーションのルート付近でこのコンポーネントでラップすることで、
 * 子孫コンポーネント全てがグローバルダイアログにアクセスできるようになります。
 *
 * @param {React.PropsWithChildren<{}>} props - 子要素を含むprops
 *
 * 【Goユーザー向け補足】
 * - Provider PatternはGoのDependency Injectionパターンに似ている
 * - childrenは子コンポーネントを表す特別なprop（Goのコンポジションに相当）
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  // 各ダイアログのコントロールを初期化
  // Dialog.useDialogControl()は開閉状態を管理するフックを返す
  const mutedWordsDialogControl = Dialog.useDialogControl()
  const signinDialogControl = Dialog.useDialogControl()
  // useStatefulDialogControl()は値を保持できる拡張版コントロールを返す
  const inAppBrowserConsentControl = useStatefulDialogControl<string>()
  const emailDialogControl = useStatefulDialogControl<Screen>()
  const linkWarningDialogControl = useStatefulDialogControl<{
    href: string
    displayText: string
    share?: boolean
  }>()
  const ageAssuranceRedirectDialogControl =
    useStatefulDialogControl<AgeAssuranceRedirectDialogState>()

  // 全てのコントロールをまとめたコンテキスト値を作成
  // useMemoで依存配列の値が変わらない限り再生成を防ぐ（パフォーマンス最適化）
  const ctx = useMemo<ControlsContext>(
    () => ({
      mutedWordsDialogControl,
      signinDialogControl,
      inAppBrowserConsentControl,
      emailDialogControl,
      linkWarningDialogControl,
      ageAssuranceRedirectDialogControl,
    }),
    // 依存配列: これらの値が変更された時のみctxを再生成
    [
      mutedWordsDialogControl,
      signinDialogControl,
      inAppBrowserConsentControl,
      emailDialogControl,
      linkWarningDialogControl,
      ageAssuranceRedirectDialogControl,
    ],
  )

  // コンテキストプロバイダーで子要素をラップして値を提供
  return (
    <ControlsContext.Provider value={ctx}>{children}</ControlsContext.Provider>
  )
}

/**
 * 値を保持できるダイアログコントロールを作成するカスタムフック
 *
 * 通常のダイアログコントロールに加えて、任意の型の値を保持・管理する機能を追加します。
 * ダイアログを開く際にデータを渡し、ダイアログ内でその値を参照できます。
 *
 * @template T - 保持する値の型
 * @param {T} [initialValue] - 初期値（オプショナル）
 * @returns {StatefulControl<T>} 状態を持つダイアログコントロール
 *
 * @example
 * const control = useStatefulDialogControl<string>()
 * control.open('https://example.com') // URLを渡してダイアログを開く
 * console.log(control.value) // 'https://example.com'
 * control.clear() // 値をクリア
 *
 * 【Goユーザー向け補足】
 * - useStateは状態管理フック。[現在値, 更新関数]のペアを返す（分割代入で受け取る）
 * - useMemoは計算結果をキャッシュ。依存配列の値が変わるまで再計算しない
 * - 関数内で関数を定義（クロージャ）してvalueやsetValueにアクセスできる
 */
export function useStatefulDialogControl<T>(
  initialValue?: T,
): StatefulControl<T> {
  // 状態管理: valueが現在の値、setValueが更新関数
  const [value, setValue] = useState(initialValue)
  // 基本的なダイアログコントロール（開閉機能）を取得
  const control = Dialog.useDialogControl()
  // メモ化されたコントロールオブジェクトを返す
  return useMemo(
    () => ({
      control, // 基本コントロールをそのまま含める
      // 値を設定してダイアログを開く関数
      open: (v: T) => {
        setValue(v) // 新しい値を設定
        control.open() // ダイアログを開く
      },
      // 値を初期値にリセットする関数
      clear: () => setValue(initialValue),
      value, // 現在の値
    }),
    // これらの値が変わった時のみオブジェクトを再生成
    [control, value, initialValue],
  )
}
