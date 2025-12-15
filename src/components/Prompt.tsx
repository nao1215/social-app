/**
 * Prompt.tsx
 *
 * ユーザーに確認を求めるプロンプト（確認ダイアログ）コンポーネント
 * DialogコンポーネントをベースにしたPrompt APIを提供し、
 * タイトル、説明、アクションボタン（確認/キャンセル）を含む標準的な確認ダイアログを実装
 *
 * 主な機能:
 * - カスタマイズ可能なタイトルと説明文
 * - 確認/キャンセルボタンのカスタマイズ
 * - アクセシビリティ対応（ARIA属性による画面読み上げ対応）
 * - レスポンシブレイアウト（モバイル/デスクトップで異なるボタン配置）
 *
 * Goユーザー向けの補足:
 * - React.createContext: Goのcontext.Contextに類似した、コンポーネントツリー内でデータを共有する仕組み
 * - React.useId: ユニークなIDを生成するフック（SSR対応）
 * - React.useMemo: Goのsync.Onceに似た、計算結果のメモ化フック
 * - React.useContext: Contextから値を取得するフック
 * - React.useCallback: 関数のメモ化フック（依存配列が変わらない限り同じ関数インスタンスを返す）
 */

// Reactのコア機能
import React from 'react'
// React Nativeのジェスチャーイベント型とViewコンポーネント
import {type GestureResponderEvent, View} from 'react-native'
// 国際化（i18n）のためのLingui - メッセージ定義とフック
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// デザインシステム関連のインポート
import {
  atoms as a,             // アトミックスタイル（ユーティリティCSS的なスタイル）
  useBreakpoints,         // レスポンシブデザイン用のブレークポイントフック
  useTheme,               // テーマ（ダークモード対応など）のフック
  type ViewStyleProp,     // Viewのスタイルプロパティの型定義
  web,                    // Web専用スタイルのヘルパー関数
} from '#/alf'
// ボタンコンポーネントとその型定義
import {Button, type ButtonColor, ButtonText} from '#/components/Button'
// ダイアログコンポーネント（Promptの基盤）
import * as Dialog from '#/components/Dialog'
// テキスト表示コンポーネント
import {Text} from '#/components/Typography'
// ネイティブのBottomSheetのプロパティ型定義
import {type BottomSheetViewProps} from '../../modules/bottom-sheet'

/**
 * Dialog関連の型とフックを再エクスポート
 * PromptとDialogで同じ制御APIを使用できるようにする
 *
 * Goユーザー向けの補足:
 * - type エイリアスは Go の type MyType = OtherType に相当
 */
export {
  type DialogControlProps as PromptControlProps,
  useDialogControl as usePromptControl,
} from '#/components/Dialog'

/**
 * PromptContext - アクセシビリティID共有用のContext
 *
 * タイトルと説明のIDをコンポーネントツリー内で共有し、
 * ARIA属性でスクリーンリーダーに正しい関連付けを提供
 *
 * Goユーザー向けの補足:
 * - React.createContext は Go の context.Context に似ているが、
 *   より限定的なスコープ（コンポーネントツリー内）で値を共有
 * - displayName はデバッグツールで表示される名前
 */
const Context = React.createContext<{
  titleId: string           // タイトル要素のユニークID
  descriptionId: string     // 説明要素のユニークID
}>({
  titleId: '',              // デフォルト値（空文字列）
  descriptionId: '',
})
Context.displayName = 'PromptContext'

/**
 * Outer - プロンプトの外側コンテナコンポーネント
 *
 * ダイアログの基本構造を提供し、アクセシビリティIDを生成・共有する
 *
 * @param children - プロンプト内に表示する子要素
 * @param control - ダイアログの開閉を制御するためのコントロールオブジェクト
 * @param testID - テスト用の識別子
 * @param nativeOptions - ネイティブプラットフォーム（iOS/Android）固有のBottomSheetオプション
 *
 * Goユーザー向けの補足:
 * - React.PropsWithChildren: Goの埋め込み型に似た、childrenプロパティを追加する型
 * - Omit<T, K>: Goには直接の対応物がないが、型Tから特定のフィールドKを除外する型操作
 */
export function Outer({
  children,
  control,
  testID,
  nativeOptions,
}: React.PropsWithChildren<{
  control: Dialog.DialogControlProps
  testID?: string
  nativeOptions?: Omit<BottomSheetViewProps, 'children'>
}>) {
  // アクセシビリティ用のユニークID生成（SSR対応）
  // Goユーザー向けの補足: React.useId は uuid.New() に似ているが、SSR時の一貫性を保証
  const titleId = React.useId()
  const descriptionId = React.useId()

  // Context値のメモ化（依存配列のIDが変わらない限り同じオブジェクトを返す）
  // Goユーザー向けの補足: useMemo は計算コストの高い処理の結果をキャッシュする
  // 依存配列 [titleId, descriptionId] が変わらない限り、再計算しない
  const context = React.useMemo(
    () => ({titleId, descriptionId}),
    [titleId, descriptionId],
  )

  return (
    <Dialog.Outer
      control={control}
      testID={testID}
      // Web版: 中央揃えで表示
      webOptions={{alignCenter: true}}
      // ネイティブ版: 拡張を防止し、外部オプションをマージ
      // Goユーザー向けの補足: スプレッド演算子 {...obj} は Go の構造体埋め込みに似ている
      nativeOptions={{preventExpansion: true, ...nativeOptions}}>
      {/* ドラッグハンドル（モバイルでダイアログを閉じるためのUI） */}
      <Dialog.Handle />
      {/* Context.Provider でIDをツリー下位に提供 */}
      <Context.Provider value={context}>
        {/* スクロール可能な内部コンテナ */}
        <Dialog.ScrollableInner
          accessibilityLabelledBy={titleId}      // スクリーンリーダー用: タイトルとの関連付け
          accessibilityDescribedBy={descriptionId}  // スクリーンリーダー用: 説明との関連付け
          style={web({maxWidth: 400})}>          {/* Web版のみ最大幅400px */}
          {children}
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

/**
 * TitleText - プロンプトのタイトルテキストコンポーネント
 *
 * 大きめのフォント、太字で強調表示されるタイトル
 * アクセシビリティIDを設定し、スクリーンリーダーとの連携を実現
 *
 * @param children - タイトルとして表示するテキスト
 * @param style - 追加のスタイル（オプション）
 */
export function TitleText({
  children,
  style,
}: React.PropsWithChildren<ViewStyleProp>) {
  // Contextからタイトル用のIDを取得
  const {titleId} = React.useContext(Context)
  return (
    <Text
      nativeID={titleId}      // アクセシビリティ用のID設定
      style={[
        a.flex_1,             // flex: 1（利用可能なスペースを埋める）
        a.text_2xl,           // フォントサイズ: 2xl（大きめ）
        a.font_bold,          // フォントウェイト: 太字
        a.pb_sm,              // padding-bottom: small
        a.leading_snug,       // line-height: snug（行間を狭く）
        style,                // 外部から渡された追加スタイル
      ]}>
      {children}
    </Text>
  )
}

/**
 * DescriptionText - プロンプトの説明テキストコンポーネント
 *
 * タイトルの下に表示される詳細説明
 * アクセシビリティIDを設定し、選択可能オプションをサポート
 *
 * @param children - 説明として表示するテキスト
 * @param selectable - テキストを選択可能にするかどうか
 */
export function DescriptionText({
  children,
  selectable,
}: React.PropsWithChildren<{selectable?: boolean}>) {
  const t = useTheme()                      // 現在のテーマ取得
  const {descriptionId} = React.useContext(Context)  // 説明用のID取得
  return (
    <Text
      nativeID={descriptionId}              // アクセシビリティ用のID設定
      selectable={selectable}               // テキスト選択可能フラグ
      style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high, a.pb_lg]}>
      {children}
    </Text>
  )
}

/**
 * Actions - アクションボタンのコンテナコンポーネント
 *
 * 確認/キャンセルボタンを含むコンテナ
 * レスポンシブレイアウト:
 * - モバイル: 縦並び（上から順に表示）
 * - デスクトップ: 横並び、逆順（右から確認、キャンセルの順）
 *
 * @param children - アクションボタン要素
 *
 * Goユーザー向けの補足:
 * - {} は空のインターフェース（any相当）だが、TypeScriptでは非推奨
 */
export function Actions({children}: React.PropsWithChildren<{}>) {
  const {gtMobile} = useBreakpoints()  // モバイルより大きい画面かどうか

  return (
    <View
      style={[
        a.w_full,             // width: 100%
        a.gap_md,             // gap: medium（子要素間の間隔）
        a.justify_end,        // justify-content: flex-end
        // レスポンシブスタイル: 画面サイズに応じてレイアウトを切り替え
        gtMobile
          ? [a.flex_row, a.flex_row_reverse, a.justify_start]  // デスクトップ: 横並び逆順
          : [a.flex_col],                                       // モバイル: 縦並び
      ]}>
      {children}
    </View>
  )
}

/**
 * Cancel - キャンセルボタンコンポーネント
 *
 * プロンプトを閉じるためのキャンセルボタン
 * 押下時にダイアログを閉じ、何もアクションを実行しない
 *
 * @param cta - ボタンのラベルテキスト（省略時は"Cancel"）
 */
export function Cancel({
  cta,
}: {
  /**
   * Optional i18n string. If undefined, it will default to "Cancel".
   * オプションの国際化文字列。未定義の場合は「キャンセル」がデフォルト。
   */
  cta?: string
}) {
  const {_} = useLingui()                 // 国際化関数（翻訳用）
  const {gtMobile} = useBreakpoints()     // レスポンシブフラグ
  const {close} = Dialog.useDialogContext()  // ダイアログ制御コンテキスト

  // キャンセルボタン押下時のハンドラ
  // Goユーザー向けの補足: useCallback は関数をメモ化し、依存配列が変わらない限り
  // 同じ関数インスタンスを返す（無駄な再レンダリングを防ぐ）
  const onPress = React.useCallback(() => {
    close()  // ダイアログを閉じる
  }, [close])

  return (
    <Button
      variant="solid"                               // ボタンスタイル: ソリッド
      color="secondary"                             // ボタン色: セカンダリ
      size={gtMobile ? 'small' : 'large'}          // レスポンシブサイズ
      label={cta || _(msg`Cancel`)}                // アクセシビリティラベル
      onPress={onPress}>
      <ButtonText>{cta || _(msg`Cancel`)}</ButtonText>
    </Button>
  )
}

/**
 * Action - 確認アクションボタンコンポーネント
 *
 * プロンプトのメインアクション（確認）ボタン
 * 押下時にダイアログを閉じ、その後にコールバックを実行
 *
 * @param onPress - ダイアログが閉じた後に実行されるコールバック
 * @param color - ボタンの色（デフォルト: primary）
 * @param cta - ボタンのラベルテキスト（省略時は"Confirm"）
 * @param testID - テスト用の識別子
 */
export function Action({
  onPress,
  color = 'primary',
  cta,
  testID,
}: {
  /**
   * Callback to run when the action is pressed. The method is called _after_
   * the dialog closes.
   *
   * Note: The dialog will close automatically when the action is pressed, you
   * should NOT close the dialog as a side effect of this method.
   *
   * アクションボタン押下時に実行されるコールバック。
   * このメソッドはダイアログが閉じた「後」に呼び出される。
   *
   * 注意: ダイアログは自動的に閉じるため、このメソッド内で
   * ダイアログを閉じる処理を行ってはいけない。
   */
  onPress: (e: GestureResponderEvent) => void
  color?: ButtonColor
  /**
   * Optional i18n string. If undefined, it will default to "Confirm".
   * オプションの国際化文字列。未定義の場合は「確認」がデフォルト。
   */
  cta?: string
  testID?: string
}) {
  const {_} = useLingui()                         // 国際化関数
  const {gtMobile} = useBreakpoints()             // レスポンシブフラグ
  const {close} = Dialog.useDialogContext()       // ダイアログ制御コンテキスト

  // 確認ボタン押下時のハンドラ
  // ダイアログを閉じ、その後にコールバックを実行
  const handleOnPress = React.useCallback(
    (e: GestureResponderEvent) => {
      // closeの第1引数にコールバックを渡すことで、閉じた後に実行される
      close(() => onPress?.(e))
    },
    [close, onPress],
  )

  return (
    <Button
      variant="solid"                              // ボタンスタイル: ソリッド
      color={color}                                // ボタン色（カスタマイズ可能）
      size={gtMobile ? 'small' : 'large'}         // レスポンシブサイズ
      label={cta || _(msg`Confirm`)}              // アクセシビリティラベル
      onPress={handleOnPress}                     // 押下ハンドラ
      testID={testID}>
      <ButtonText>{cta || _(msg`Confirm`)}</ButtonText>
    </Button>
  )
}

/**
 * Basic - 基本的なプロンプトコンポーネント（完全版）
 *
 * タイトル、説明、確認/キャンセルボタンを含む標準的な確認ダイアログ
 * 一般的なユースケースに対応したシンプルなAPI
 *
 * @param control - ダイアログの開閉を制御するコントロールオブジェクト
 * @param title - プロンプトのタイトル
 * @param description - プロンプトの説明文（オプション）
 * @param cancelButtonCta - キャンセルボタンのラベル（オプション）
 * @param confirmButtonCta - 確認ボタンのラベル（オプション）
 * @param onConfirm - 確認ボタン押下時のコールバック
 * @param confirmButtonColor - 確認ボタンの色（オプション）
 * @param showCancel - キャンセルボタンを表示するかどうか（デフォルト: true）
 */
export function Basic({
  control,
  title,
  description,
  cancelButtonCta,
  confirmButtonCta,
  onConfirm,
  confirmButtonColor,
  showCancel = true,
}: React.PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  title: string
  description?: string
  cancelButtonCta?: string
  confirmButtonCta?: string
  /**
   * Callback to run when the Confirm button is pressed. The method is called
   * _after_ the dialog closes.
   *
   * Note: The dialog will close automatically when the action is pressed, you
   * should NOT close the dialog as a side effect of this method.
   *
   * 確認ボタン押下時に実行されるコールバック。
   * このメソッドはダイアログが閉じた「後」に呼び出される。
   *
   * 注意: ダイアログは自動的に閉じるため、このメソッド内で
   * ダイアログを閉じる処理を行ってはいけない。
   */
  onConfirm: (e: GestureResponderEvent) => void
  confirmButtonColor?: ButtonColor
  showCancel?: boolean
}>) {
  return (
    <Outer control={control} testID="confirmModal">
      {/* タイトル */}
      <TitleText>{title}</TitleText>
      {/* 説明文（オプション） */}
      {description && <DescriptionText>{description}</DescriptionText>}
      {/* アクションボタン */}
      <Actions>
        {/* 確認ボタン */}
        <Action
          cta={confirmButtonCta}
          onPress={onConfirm}
          color={confirmButtonColor}
          testID="confirmBtn"
        />
        {/* キャンセルボタン（条件付き表示） */}
        {showCancel && <Cancel cta={cancelButtonCta} />}
      </Actions>
    </Outer>
  )
}
