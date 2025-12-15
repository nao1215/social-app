/**
 * @fileoverview メニューコンポーネント（ネイティブ版 - iOS/Android）
 * Menu component (Native version - iOS/Android)
 *
 * このファイルは、React Native（iOS/Android）環境でのメニュー実装を提供します。
 * メニューはモーダルダイアログとして表示され、ボトムシートスタイルのUIを提供します。
 *
 * This file provides menu implementation for React Native (iOS/Android) environment.
 * Menus are displayed as modal dialogs with bottom sheet style UI.
 *
 * ## アーキテクチャ概要:
 * - メニューはDialogコンポーネントをベースに構築されています
 * - ネイティブプラットフォームでは、メニューは画面下部からスライドアップするボトムシートとして表示
 * - Web版（index.web.tsx）では、Radix UIライブラリを使用したドロップダウンメニューとして表示
 *
 * ## プラットフォーム固有ファイルについて（Goユーザー向け）:
 * - `.tsx` ファイル: 全プラットフォーム共通（存在しない場合のフォールバック）
 * - `.native.tsx` ファイル: iOS/Android専用（ネイティブプラットフォームで優先使用）
 * - `.web.tsx` ファイル: Web専用（Web環境で優先使用）
 * - `.ios.tsx` ファイル: iOS専用
 * - `.android.tsx` ファイル: Android専用
 * - ビルド時に、プラットフォームに応じて適切なファイルが自動選択されます
 * - Goのビルドタグ（`//go:build`）に似た仕組みです
 *
 * ## Goユーザー向けの説明:
 * - このファイルには多くのReactフック（useState, useMemo, useEffectなど）が使用されています
 * - フックは関数コンポーネントで状態やライフサイクルを管理するReactの仕組みです
 * - 各フックの詳細な説明はコード内に記載しています
 */

// Reactコアフック - 要素のクローン、フラグメント、バリデーション、メモ化
import {cloneElement, Fragment, isValidElement, useMemo} from 'react'
// ↑ cloneElement: 既存のReact要素を複製して新しいプロパティを追加
// ↑ Fragment: 複数要素をグループ化する軽量コンテナ（<></>の正式名）
// ↑ isValidElement: 値がReact要素かどうかを判定
// ↑ useMemo: 計算結果をメモ化（キャッシュ）してパフォーマンス最適化
// ↑ Goユーザー向け: useXxxはReactフック。コンポーネント内でのみ使用可能

// React Native基本コンポーネントと型定義 - UI構築のため
import {
  Pressable,      // タッチ可能コンポーネント - ボタンやクリック可能な要素に使用
  type StyleProp, // スタイルプロパティ型 - React Nativeのスタイルオブジェクト型
  type TextStyle, // テキストスタイル型 - フォント、色、サイズなどの型定義
  View,           // 基本ビューコンポーネント - HTMLのdivに相当
  type ViewStyle, // ビュースタイル型 - レイアウト、背景、ボーダーなどの型定義
} from 'react-native'
// ↑ Goユーザー向け: Reactでは型と値を同じimport文で扱います
// ↑ `type`キーワードは型専用インポートを示します（実行時には削除される）

// Lingui国際化ライブラリ - メッセージの多言語対応
import {msg, Trans} from '@lingui/macro'  // 翻訳メッセージマクロ - ビルド時に変換される
import {useLingui} from '@lingui/react'   // Lingui Reactフック - 現在のロケールと翻訳関数を提供
// ↑ msg: ビルド時にメッセージIDに変換されるマクロ
// ↑ Trans: 翻訳可能なテキストコンポーネント（JSX内で使用）
// ↑ Goユーザー向け: Linguiはビルド時にメッセージを抽出・変換します（i18nのGoライブラリに似た仕組み）

// React子要素をフラット化するユーティリティ - ネストされた子要素を一列化
import flattenReactChildren from 'react-keyed-flatten-children'
// ↑ ネストされた配列やFragmentを含む子要素を平坦化し、各要素に一意のキーを付与
// ↑ Goでの類似例: スライスのスライスを1次元スライスに変換する処理

// プラットフォーム検出 - Android、iOS、ネイティブ環境の判定
import {isAndroid, isIOS, isNative} from '#/platform/detection'
// ↑ isAndroid: Android環境かどうか（boolean）
// ↑ isIOS: iOS環境かどうか（boolean）
// ↑ isNative: ネイティブアプリ環境かどうか（Web以外）
// ↑ Goユーザー向け: runtime.GOOSによるOS判定に似た仕組み

// デザインシステム - スタイルとテーマ管理
import {atoms as a, useTheme} from '#/alf'
// ↑ atoms (as a): アトミックCSSスタイルのユーティリティ（a.flex_row, a.gap_smなど）
// ↑ useTheme: 現在のテーマ（ライト/ダーク）を取得するフック
// ↑ Goユーザー向け: `as a`は import "atoms" のエイリアスに相当

// ボタンコンポーネント - インタラクティブな操作用
import {Button, ButtonText} from '#/components/Button'
// ↑ Button: 標準的なボタンコンポーネント
// ↑ ButtonText: ボタン内のテキスト表示用コンポーネント

// ダイアログコンポーネント群 - メニューはダイアログとして表示
import * as Dialog from '#/components/Dialog'
// ↑ `import *`：名前空間インポート。Dialog.Outer, Dialog.Handleのように使用
// ↑ Goユーザー向け: import dialog "..." のようなパッケージインポートに相当

// インタラクション状態フック - ホバー、フォーカス、プレス状態管理
import {useInteractionState} from '#/components/hooks/useInteractionState'
// ↑ useInteractionState: ユーザーのインタラクション状態を管理するカスタムフック
// ↑ 戻り値: {state: boolean, onIn: () => void, onOut: () => void}
// ↑ state: 現在の状態（true/false）
// ↑ onIn: 状態をtrueにする関数（フォーカス時、マウス進入時など）
// ↑ onOut: 状態をfalseにする関数（フォーカス喪失時、マウス退出時など）

// メニューコンテキスト - メニュー内での状態共有
import {
  Context,            // メニュー全体のコンテキスト - 制御オブジェクトを提供
  ItemContext,        // メニューアイテムのコンテキスト - アイテム固有の状態を提供
  useMenuContext,     // メニューコンテキスト取得フック
  useMenuItemContext, // メニューアイテムコンテキスト取得フック
} from '#/components/Menu/context'

// メニューコンポーネントの型定義
import {
  type ContextType,    // コンテキスト型 - {control: DialogControl}
  type GroupProps,     // グループプロパティ型 - メニューアイテムをグループ化
  type ItemIconProps,  // アイテムアイコンプロパティ型 - アイコン表示用
  type ItemProps,      // アイテムプロパティ型 - メニューアイテムの基本型
  type ItemTextProps,  // アイテムテキストプロパティ型 - テキスト表示用
  type TriggerProps,   // トリガープロパティ型 - メニューを開くボタンの型
} from '#/components/Menu/types'

// タイポグラフィコンポーネント - テキスト表示用
import {Text} from '#/components/Typography'

// ダイアログ制御をメニュー制御としてエクスポート - メニューはダイアログをベースに構築
// Export dialog control as menu control - menus are built on top of dialogs
export {
  type DialogControlProps as MenuControlProps, // メニュー制御プロパティ型のエイリアス
  useDialogControl as useMenuControl,          // メニュー制御フックのエイリアス
} from '#/components/Dialog'
// ↑ 型とフックを別名でエクスポート（再エクスポートパターン）
// ↑ Goユーザー向け: type MenuControlProps = DialogControlProps のような型エイリアスに相当

// メニューコンテキストフックをエクスポート
// Export menu context hook
export {useMenuContext}

/**
 * メニューのルートコンポーネント - メニュー全体のコンテキストを提供
 * Menu root component providing context for the entire menu
 *
 * このコンポーネントは、メニュー階層のトップに配置され、
 * 子孫コンポーネント全体でメニュー制御オブジェクトを共有します。
 *
 * This component is placed at the top of the menu hierarchy and
 * shares menu control object across all descendant components.
 *
 * ## Goユーザー向けの説明:
 * - 関数コンポーネント: UIを返すJavaScript関数です
 * - `{children, control}`: 分割代入でpropsからchildrenとcontrolを取り出す
 * - Goでは: func Root(props RootProps) ReactNode { children := props.Children; ... }
 *
 * ## React.PropsWithChildren型について:
 * - childrenプロパティを自動的に追加するジェネリック型
 * - `React.PropsWithChildren<{control?: X}>` = `{children: ReactNode, control?: X}`
 * - Goでは構造体埋め込みに似た概念
 *
 * @param {React.ReactNode} children - 子要素（メニューの内容）
 * @param {Dialog.DialogControlProps} [control] - メニュー制御オブジェクト（オプション）
 * @returns {JSX.Element} Contextプロバイダーでラップされた子要素
 *
 * @example
 * // 使用例:
 * function MyMenu() {
 *   const control = useMenuControl(); // メニュー制御を作成
 *
 *   return (
 *     <Menu.Root control={control}>
 *       <Menu.Trigger>{...}</Menu.Trigger>
 *       <Menu.Outer>{...}</Menu.Outer>
 *     </Menu.Root>
 *   );
 * }
 */
export function Root({
  children, // 子要素 - メニューの全コンテンツ
  control,  // メニュー制御オブジェクト（オプション）- 未指定時はデフォルトが作成される
}: React.PropsWithChildren<{
  control?: Dialog.DialogControlProps
}>) {
  // デフォルトコントロールを作成 - controlが渡されない場合に使用
  // Create default control - used when control is not provided
  const defaultControl = Dialog.useDialogControl()
  // ↑ useDialogControl: ダイアログの開閉を管理する制御オブジェクトを作成
  // ↑ 戻り値: {id, ref, isOpen, open: () => void, close: () => void}
  // ↑ Goユーザー向け: フック（use始まり）は、コンポーネント内で状態を保持する特殊な関数

  // メニューコンテキストをメモ化 - パフォーマンス最適化のため
  // Memoize menu context - for performance optimization
  const context = useMemo<ContextType>(
    // ↑ useMemo: 計算結果をキャッシュし、依存値が変わらない限り再計算しない
    // ↑ ジェネリック型<ContextType>で戻り値の型を明示
    // ↑ Goユーザー向け: sync.Onceやキャッシュに似た仕組み（ただし依存配列による再計算あり）
    () => ({
      // ↑ 第1引数: 値を計算する関数（ここではオブジェクトを返す）
      control: control || defaultControl, // 渡されたコントロールまたはデフォルトを使用
      // ↑ ||演算子: JavaScriptの短絡評価。controlがnullish（null/undefined）ならdefaultControlを使用
      // ↑ Goでの類似例: if control != nil { use control } else { use defaultControl }
    }),
    [control, defaultControl], // ↑ 第2引数: 依存配列 - これらの値が変わった時のみ再計算
    // ↑ Goユーザー向け: これらの変数が変わると、新しいcontextオブジェクトが作成される
  )

  // Contextプロバイダーで子要素をラップ - 子孫コンポーネントがuseMenuContext()でアクセス可能
  // Wrap children with Context provider - descendant components can access via useMenuContext()
  return <Context.Provider value={context}>{children}</Context.Provider>
  // ↑ JSX構文: XMLライクなReactの構文（ビルド時にReact.createElement()に変換）
  // ↑ Context.Provider: コンテキスト値を子孫コンポーネントに提供
  // ↑ value={context}: 提供する値を指定
  // ↑ {children}: 波括弧でJavaScript式を埋め込む
}

/**
 * メニュートリガーコンポーネント - メニューを開くためのトリガー要素
 * Menu trigger component for opening the menu
 *
 * レンダープロパティパターンを使用して、トリガーの見た目を完全にカスタマイズ可能にします。
 * Uses render props pattern to allow full customization of trigger appearance.
 *
 * ## レンダープロパティパターンについて（Goユーザー向け）:
 * - children プロパティに関数を渡すパターン
 * - 関数には、インタラクション状態とイベントハンドラーが渡される
 * - 関数は、これらを使って任意のUIを返す
 * - Goでのコールバック関数に似ていますが、UIを返す点が特徴
 *
 * @param {Function} children - レンダープロパティ関数（トリガーUIを返す）
 * @param {string} label - アクセシビリティラベル
 * @param {string} role - アクセシビリティロール（デフォルト: 'button'）
 * @param {string} [hint] - アクセシビリティヒント（オプション）
 * @returns {JSX.Element} カスタマイズされたトリガー要素
 *
 * @example
 * // 使用例:
 * <Menu.Trigger label="オプション">
 *   {({state, props}) => (
 *     <button {...props} style={{ backgroundColor: state.pressed ? 'blue' : 'gray' }}>
 *       メニュー
 *     </button>
 *   )}
 * </Menu.Trigger>
 */
export function Trigger({
  children,           // レンダープロパティ関数 - (props) => ReactNode
  label,             // アクセシビリティラベル - スクリーンリーダーが読み上げる
  role = 'button',   // アクセシビリティロール - デフォルト値は'button'
  // ↑ Goユーザー向け: = 'button'は、デフォルト引数。Goでは関数内でnilチェックして初期化することに相当
  hint,              // アクセシビリティヒント - 追加の説明（オプション）
}: TriggerProps) {
  // メニューコンテキストを取得
  // Get menu context
  const context = useMenuContext()
  // ↑ useMenuContext: Contextプロバイダーから値を取得するカスタムフック
  // ↑ Goユーザー向け: Providerがない場合はpanicする（エラーの早期検出）

  // フォーカス状態を管理 - キーボードフォーカス時のビジュアルフィードバック用
  // Manage focus state - for visual feedback during keyboard focus
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  // ↑ 分割代入: オブジェクトのプロパティを個別の変数に展開
  // ↑ state: focusedに名前変更（as focused）
  // ↑ onIn: onFocusに名前変更
  // ↑ onOut: onBlurに名前変更
  // ↑ Goユーザー向け:
  // ↑   result := useInteractionState()
  // ↑   focused := result.State
  // ↑   onFocus := result.OnIn
  // ↑   onBlur := result.OnOut

  // プレス状態を管理 - タッチ時の視覚フィードバックのため
  // Manage press state - for visual feedback during touch
  const {
    state: pressed,   // プレス状態（true/false）
    onIn: onPressIn,  // プレス開始ハンドラー
    onOut: onPressOut, // プレス終了ハンドラー
  } = useInteractionState()

  // レンダープロパティ関数にメニュー状態とプロパティを渡す
  // Call render props function with menu state and properties
  return children({
    // ↑ children関数を呼び出して、オブジェクトを引数として渡す
    // ↑ Goユーザー向け: return children(TriggerChildProps{...}) に相当
    isNative: true,              // ネイティブ環境であることを示すフラグ
    // ↑ リテラル型true: 型システムがisNative=trueのブランチを選択
    // ↑ TypeScriptのDiscriminated Union（判別可能なユニオン型）の判別子
    control: context.control,    // メニュー制御オブジェクト
    state: {
      hovered: false,            // ホバー状態（ネイティブでは常にfalse）
      // ↑ モバイルデバイスにはマウスカーソルがないため、ホバーは存在しない
      focused,                   // フォーカス状態（キーボードフォーカス）
      pressed,                   // プレス状態（タッチ中）
    },
    props: {
      // ↑ トリガー要素に適用すべきプロパティ
      ref: null,                           // 参照（ネイティブではnull、Web版では使用）
      onPress: context.control.open,       // メニューを開くハンドラー
      // ↑ context.control.open: メニューを開く関数
      // ↑ Goユーザー向け: func() { context.Control.Open() } のようなクロージャ
      onFocus,                            // フォーカスハンドラー（キーボードフォーカス取得時）
      onBlur,                             // フォーカス喪失ハンドラー
      onPressIn,                          // プレス開始ハンドラー（タッチ開始時）
      onPressOut,                         // プレス終了ハンドラー（タッチ終了時）
      accessibilityHint: hint,            // アクセシビリティヒント
      accessibilityLabel: label,          // アクセシビリティラベル
      accessibilityRole: role,            // アクセシビリティロール
    },
  })
}

/**
 * メニューの外側コンポーネント - ダイアログとして表示されるメニューのコンテナ
 * Menu outer component - container for the menu displayed as a dialog
 *
 * ネイティブプラットフォームでは、メニューは画面下部からスライドアップするボトムシートとして表示されます。
 * On native platforms, menus are displayed as bottom sheets that slide up from the bottom of the screen.
 *
 * ## ダイアログのポータリングについて（Goユーザー向け）:
 * - Dialogコンポーネントは、React Portalを使用してDOMのルートにレンダリングされます
 * - そのため、コンテキストが失われる可能性があります
 * - Context.Providerで再ラップすることで、コンテキストを再提供します
 * - これはReactの特性で、Goには直接的な類似概念はありません
 *
 * @param {React.ReactNode} children - メニューの内容
 * @param {boolean} [showCancel] - キャンセルボタンを表示するか
 * @param {StyleProp<ViewStyle>} [style] - 追加のスタイル（未使用、型互換性のため）
 * @returns {JSX.Element} ダイアログとしてレンダリングされたメニュー
 *
 * @example
 * // 使用例:
 * <Menu.Outer showCancel>
 *   <Menu.Item label="編集" onPress={handleEdit}>
 *     <Menu.ItemText>編集</Menu.ItemText>
 *   </Menu.Item>
 * </Menu.Outer>
 */
export function Outer({
  children,    // 子要素 - メニューアイテムなど
  showCancel,  // キャンセルボタンを表示するかどうか
}: React.PropsWithChildren<{
  showCancel?: boolean
  style?: StyleProp<ViewStyle> // ↑ オプショナル（?）: 指定しなくても良い
  // ↑ Goユーザー向け: *ViewStyle のようなポインタ型に似た概念
}>) {
  // メニューコンテキストを取得
  // Get menu context
  const context = useMenuContext()

  // 翻訳関数を取得 - 現在のロケールに応じたメッセージを取得
  // Get translation function - gets messages according to current locale
  const {_} = useLingui()
  // ↑ useLingui: 国際化フック。翻訳関数_と現在のロケールを提供
  // ↑ _(msg`...`): メッセージIDを現在の言語の文字列に変換
  // ↑ Goユーザー向け: i18n.T("message.id") のような翻訳関数に相当

  return (
    <Dialog.Outer
      control={context.control}                           // メニュー制御オブジェクト
      nativeOptions={{preventExpansion: true}}>          {/* メニューの自動展開を禁止 */}
      {/* ↑ preventExpansion: ダイアログの高さを自動的に全画面にしない */}
      {/* ↑ ネイティブオプション: プラットフォーム固有の動作を制御 */}

      <Dialog.Handle />  {/* ダイアログハンドル - スワイプで閉じるためのビジュアルインジケーター */}
      {/* ↑ Handle: ボトムシートの上部に表示される水平バー（ドラッグして閉じる） */}

      {/* Re-wrap with context since Dialogs are portal-ed to root */}
      {/* ダイアログはルートにポータルされるため、コンテキストを再ラップ */}
      <Context.Provider value={context}>
        {/* ↑ ポータルによってReactツリーの別の場所にレンダリングされるため、 */}
        {/* ↑ コンテキストが失われる可能性がある。再度Providerでラップして解決 */}

        <Dialog.ScrollableInner label={_(msg`Menu`)}> {/* スクロール可能なメニュー内部 */}
          {/* ↑ ScrollableInner: メニュー内容がスクロール可能なコンテナ */}
          {/* ↑ _(msg`Menu`): "Menu"を現在の言語に翻訳（日本語なら「メニュー」） */}

          <View style={[a.gap_lg]}> {/* 大きなギャップでアイテムを配置 */}
            {/* ↑ a.gap_lg: アトミックCSSスタイル。子要素間に大きな余白を追加 */}
            {/* ↑ []: 配列記法。複数のスタイルを結合可能（ここでは1つだけ） */}
            {children}
            {/* ↑ メニューアイテムなどの子要素をレンダリング */}

            {/* ネイティブ環境でキャンセルボタンが有効な場合のみ表示 */}
            {/* Only show cancel button on native when enabled */}
            {isNative && showCancel && <Cancel />}
            {/* ↑ 条件付きレンダリング: 条件がtrueの場合のみ<Cancel />をレンダリング */}
            {/* ↑ &&演算子: 左辺がtrueなら右辺を評価（JavaScriptの短絡評価） */}
            {/* ↑ Goでの類似例: if isNative && showCancel { return <Cancel /> } */}
          </View>
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

/**
 * メニューアイテムコンポーネント - 選択可能なメニューアイテム
 * Menu item component - selectable menu item
 *
 * メニュー内の個々の選択可能なアイテムを表示します。
 * プレス時にアクションを実行し、プラットフォームに応じた適切なタイミングでメニューを閉じます。
 *
 * Displays individual selectable items within the menu.
 * Executes action on press and closes menu at appropriate timing based on platform.
 *
 * ## プラットフォーム別の動作の違い（Goユーザー向け）:
 * - **Android**: onPress実行後に即座にメニューを閉じる
 * - **iOS**: メニューを閉じるアニメーション完了後にonPressを実行（UIの滑らかさのため）
 * - この違いは、各プラットフォームのUXガイドラインに従っています
 *
 * ## オプショナルチェイニング（?.）について:
 * - `onPress?.(e)` は、onPressが存在する場合のみ呼び出す
 * - Goでの類似例: if onPress != nil { onPress(e) }
 * - TypeScriptの便利構文で、nullチェックを簡潔に記述
 *
 * @param {React.ReactNode} children - アイテムの内容（アイコン、テキストなど）
 * @param {string} label - アクセシビリティラベル
 * @param {StyleProp<ViewStyle>} [style] - 追加のスタイル
 * @param {Function} onPress - プレス時のコールバック関数
 * @param {PressableProps} rest - その他のPressableプロパティ（スプレッド演算子で展開）
 * @returns {JSX.Element} プレス可能なメニューアイテム
 *
 * @example
 * // 使用例:
 * <Menu.Item
 *   label="削除"
 *   onPress={() => handleDelete()}
 *   disabled={!canDelete}
 * >
 *   <Menu.ItemIcon icon={TrashIcon} />
 *   <Menu.ItemText>削除</Menu.ItemText>
 * </Menu.Item>
 */
export function Item({children, label, style, onPress, ...rest}: ItemProps) {
  // ↑ 分割代入 + restパラメータ:
  // ↑ children, label, style, onPressを個別の変数に展開
  // ↑ ...rest: 残りのプロパティを全てrestオブジェクトに集約
  // ↑ Goユーザー向け:
  // ↑   children := props.Children
  // ↑   label := props.Label
  // ↑   style := props.Style
  // ↑   onPress := props.OnPress
  // ↑   rest := props // 他の全フィールド

  // 現在のテーマを取得（ライト/ダークモード）
  // Get current theme (light/dark mode)
  const t = useTheme()
  // ↑ useTheme: テーマオブジェクトを返すフック
  // ↑ t.atoms: スタイルユーティリティ（t.atoms.bg_contrast_25など）
  // ↑ t.palette: カラーパレット（t.palette.primary_500など）
  // ↑ t.name: テーマ名（'light' | 'dark'）

  // メニューコンテキストを取得
  // Get menu context
  const context = useMenuContext()

  // フォーカス状態を管理
  // Manage focus state
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  // プレス状態を管理
  // Manage press state
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return (
    <Pressable
      {...rest}
      {/* ↑ スプレッド演算子: restオブジェクトの全プロパティを展開 */}
      {/* ↑ Goでの類似例: 構造体の全フィールドをコピー */}
      {/* ↑ 例: disabled, testIDなどのPressablePropsが含まれる */}

      accessibilityHint=""
      {/* ↑ 空文字列: アクセシビリティヒントなし */}
      accessibilityLabel={label}
      {/* ↑ アクセシビリティラベル: スクリーンリーダーが読み上げる */}

      onFocus={onFocus}
      {/* ↑ フォーカス取得時のハンドラー */}
      onBlur={onBlur}
      {/* ↑ フォーカス喪失時のハンドラー */}

      onPress={async e => {
        // ↑ 非同期アロー関数: async (e) => {...}
        // ↑ Goユーザー向け: func(e Event) { ... } の無名関数に相当
        // ↑ asyncキーワード: この関数内でawaitを使用可能（非同期処理）
        // ↑ ただし、ここではawaitは使用されていない（将来的な拡張の余地）

        if (isAndroid) {
          /**
           * Below fix for iOS doesn't work for Android, this does.
           * iOS向けの修正はAndroidでは動作しないため、この方法を使用
           *
           * Android特有の動作:
           * - onPressを即座に実行
           * - その後、メニューを閉じる
           * - これによりスムーズなユーザー体験を提供
           */
          onPress?.(e)
          // ↑ オプショナルチェイニング: onPressが存在する場合のみ呼び出す
          // ↑ Goでの類似例: if onPress != nil { onPress(e) }
          context.control.close()
          // ↑ メニューを閉じる
        } else if (isIOS) {
          /**
           * Fixes a subtle bug on iOS
           * iOSの微妙なバグを修正
           *
           * iOS特有の動作:
           * - メニューを閉じるアニメーションを開始
           * - アニメーション完了後にonPressを実行
           * - これにより、アニメーションがスムーズになる
           *
           * {@link https://github.com/bluesky-social/social-app/pull/5849/files#diff-de516ef5e7bd9840cd639213301df38cf03acfcad5bda85a1d63efd249ba79deL124-L127}
           */
          context.control.close(() => {
            // ↑ closeメソッドにコールバック関数を渡す
            // ↑ 閉じるアニメーション完了後にこのコールバックが実行される
            onPress?.(e)
          })
        }
      }}

      onPressIn={e => {
        // ↑ プレス開始時のハンドラー（タッチ開始時）
        onPressIn()
        // ↑ プレス状態をtrueに設定（視覚フィードバックのため）
        rest.onPressIn?.(e)
        // ↑ 親から渡されたonPressInハンドラーがあれば実行
        // ↑ これにより、カスタムハンドラーと内部ハンドラーの両方が動作
      }}

      onPressOut={e => {
        // ↑ プレス終了時のハンドラー（タッチ終了時）
        onPressOut()
        // ↑ プレス状態をfalseに設定
        rest.onPressOut?.(e)
        // ↑ 親から渡されたonPressOutハンドラーがあれば実行
      }}

      style={[
        // ↑ スタイル配列: 複数のスタイルオブジェクトを結合
        // ↑ 後の要素が前の要素を上書き（CSSのカスケードに似た仕組み）
        // ↑ Goユーザー向け: スライスの要素を順に適用するイメージ

        // 基本レイアウトスタイル
        a.flex_row,        // Flexboxの行レイアウト（横並び）
        a.align_center,    // 縦方向の中央揃え
        a.gap_sm,          // 子要素間に小さな余白
        a.px_md,           // 水平方向のパディング（中サイズ）
        a.rounded_md,      // 中程度の角丸
        a.border,          // ボーダーを表示

        // テーマに応じたスタイル
        t.atoms.bg_contrast_25,      // 背景色（コントラスト25%）
        t.atoms.border_contrast_low, // ボーダー色（低コントラスト）

        // サイズ指定
        {minHeight: 44, paddingVertical: 10},
        // ↑ オブジェクトリテラル: カスタムスタイルを直接指定
        // ↑ minHeight: 最小高さ44px（タッチターゲットサイズ）
        // ↑ paddingVertical: 上下のパディング10px

        // 親から渡されたカスタムスタイル
        style,
        // ↑ 親コンポーネントから渡されたスタイルで上書き可能

        // インタラクション状態に応じたスタイル（条件付き）
        (focused || pressed) && !rest.disabled && [t.atoms.bg_contrast_50],
        // ↑ 条件付きスタイル: フォーカスまたはプレス状態で、かつ無効化されていない場合
        // ↑ 背景色を濃く（コントラスト50%）して視覚フィードバック
        // ↑ &&演算子: 条件がtrueの場合のみ右辺（スタイル配列）を適用
        // ↑ Goユーザー向け: if (focused || pressed) && !disabled { apply style }
      ]}>

      <ItemContext.Provider value={{disabled: Boolean(rest.disabled)}}>
        {/* ↑ ItemContextプロバイダー: 子コンポーネントにdisabled状態を提供 */}
        {/* ↑ Boolean(): 値を真偽値に変換（rest.disabledがundefinedならfalse） */}
        {/* ↑ Goユーザー向け: rest.disabled != nil && *rest.disabled のような変換 */}

        {children}
        {/* ↑ メニューアイテムの子要素（アイコン、テキストなど）をレンダリング */}
      </ItemContext.Provider>
    </Pressable>
  )
}

/**
 * メニューアイテムテキストコンポーネント - アイテム内のテキスト表示
 * Menu item text component - text display within items
 *
 * メニューアイテム内のテキストを表示します。
 * アイテムの無効状態に応じてスタイルが変化します。
 *
 * Displays text within menu items.
 * Style changes based on item's disabled state.
 *
 * @param {React.ReactNode} children - テキスト内容
 * @param {StyleProp<TextStyle>} [style] - 追加のテキストスタイル
 * @returns {JSX.Element} スタイル付きテキスト要素
 *
 * @example
 * // 使用例:
 * <Menu.ItemText>設定を開く</Menu.ItemText>
 */
export function ItemText({children, style}: ItemTextProps) {
  // テーマを取得
  const t = useTheme()

  // アイテムコンテキストからdisabled状態を取得
  // Get disabled state from item context
  const {disabled} = useMenuItemContext()
  // ↑ 親のItemコンポーネントが提供するdisabled状態を取得
  // ↑ Goユーザー向け: コンテキストから値を取得するイメージ

  return (
    <Text
      numberOfLines={1}
      {/* ↑ 1行に制限 - 長いテキストは省略される */}
      ellipsizeMode="middle"
      {/* ↑ 省略記号の位置: 中央（"Long...Text"のような形） */}
      {/* ↑ 他のオプション: "head"（先頭）, "tail"（末尾）, "clip"（切り取り） */}

      style={[
        // テキストスタイル配列
        a.flex_1,          // フレックスボックスで利用可能なスペースを埋める
        a.text_md,         // 中サイズのテキスト
        a.font_bold,       // 太字フォント
        t.atoms.text_contrast_high, // 高コントラストのテキスト色
        {paddingTop: 3},   // 上部パディング（視覚的なバランス調整）
        style,             // カスタムスタイル
        disabled && t.atoms.text_contrast_low, // 無効時は低コントラスト色
        // ↑ 条件付きスタイル: disabledがtrueの場合のみ適用
      ]}>
      {children}
    </Text>
  )
}

/**
 * メニューアイテムアイコンコンポーネント - アイテム内のアイコン表示
 * Menu item icon component - icon display within items
 *
 * メニューアイテム内にアイコンを表示します。
 * アイテムの無効状態に応じて色が変化します。
 *
 * Displays icons within menu items.
 * Color changes based on item's disabled state.
 *
 * ## React.ComponentType について（Goユーザー向け）:
 * - Reactコンポーネントの型
 * - 関数コンポーネントまたはクラスコンポーネント
 * - Goでは: type IconComponent func(props SVGIconProps) ReactNode
 *
 * @param {React.ComponentType<SVGIconProps>} icon - アイコンコンポーネント
 * @returns {JSX.Element} スタイル付きアイコン要素
 *
 * @example
 * // 使用例:
 * import {Settings_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/Settings'
 * <Menu.ItemIcon icon={SettingsIcon} />
 */
export function ItemIcon({icon: Comp}: ItemIconProps) {
  // ↑ 分割代入 + 名前変更: iconプロパティをCompという名前で取得
  // ↑ Compは、Reactコンポーネント（大文字で始まる必要がある）
  // ↑ Goユーザー向け: Comp := props.Icon のようなイメージ

  // テーマを取得
  const t = useTheme()

  // アイテムの無効状態を取得
  const {disabled} = useMenuItemContext()

  return (
    <Comp
      {/* ↑ コンポーネントを動的にレンダリング */}
      {/* ↑ Goユーザー向け: 関数ポインタを呼び出すイメージ */}
      size="lg"
      {/* ↑ アイコンサイズ: 大 */}
      fill={
        // ↑ アイコンの塗りつぶし色
        disabled
          ? t.atoms.text_contrast_low.color   // 無効時: 低コントラスト色
          : t.atoms.text_contrast_medium.color // 通常時: 中コントラスト色
        // ↑ 三項演算子: condition ? trueValue : falseValue
        // ↑ Goユーザー向け: if disabled { return low } else { return medium }
      }
    />
  )
}

/**
 * メニューアイテムラジオボタンコンポーネント - 選択状態を示すラジオボタン
 * Menu item radio button component - radio button indicating selection state
 *
 * メニューアイテム内にラジオボタンを表示します。
 * 選択状態を視覚的に示すために使用されます。
 *
 * Displays radio button within menu items.
 * Used to visually indicate selection state.
 *
 * ## ラジオボタンのUIデザイン:
 * - 外側の円: ボーダーで描画
 * - 内側の円: 選択時のみ表示（プライマリーカラー）
 * - 未選択時: 外側の円のみ
 * - 選択時: 外側の円 + 内側の塗りつぶし円
 *
 * @param {boolean} selected - 選択されているかどうか
 * @returns {JSX.Element} ラジオボタンUI
 *
 * @example
 * // 使用例:
 * <Menu.ItemRadio selected={currentTheme === 'dark'} />
 */
export function ItemRadio({selected}: {selected: boolean}) {
  // テーマを取得
  const t = useTheme()

  return (
    <View
      style={[
        // 外側の円のスタイル
        a.justify_center,    // 縦方向の中央揃え
        a.align_center,      // 横方向の中央揃え
        a.rounded_full,      // 完全な円形
        t.atoms.border_contrast_high, // 高コントラストのボーダー色
        {
          borderWidth: 1,    // ボーダー幅1px
          height: 20,        // 高さ20px
          width: 20,         // 幅20px
        },
      ]}>
      {selected ? (
        // ↑ 条件付きレンダリング: 選択されている場合のみ内側の円を表示
        // ↑ Goユーザー向け: if selected { return <View /> } else { return null }
        <View
          style={[
            // 内側の円のスタイル
            a.absolute,        // 絶対位置指定（親の中央に配置）
            a.rounded_full,    // 完全な円形
            {height: 14, width: 14}, // 14x14pxの円
            selected
              ? {
                  backgroundColor: t.palette.primary_500, // プライマリーカラーで塗りつぶし
                }
              : {}, // 未選択時は空オブジェクト（スタイルなし）
            // ↑ この三項演算子は実質的に常にtrueブランチ（外側のselectedチェックで保証）
            // ↑ おそらく将来的な拡張のための記述
          ]}
        />
      ) : null}
      {/* ↑ 未選択時はnullを返す（何もレンダリングしない） */}
    </View>
  )
}

/**
 * コンテナアイテムコンポーネント - プレス不可能なメニューアイテム
 * Container item component - non-pressable menu item
 *
 * ネイティブプラットフォーム専用のコンポーネント。
 * プレスできないアイテム（ラベル、説明など）をメニューに追加するために使用します。
 *
 * Native platform only component.
 * Used to add non-pressable items (labels, descriptions, etc.) to the menu.
 *
 * @platform ios, android
 *
 * @param {React.ReactNode} children - アイテムの内容
 * @param {StyleProp<ViewStyle>} [style] - 追加のスタイル
 * @returns {JSX.Element} プレス不可能なコンテナ
 *
 * @example
 * // 使用例:
 * <Menu.ContainerItem>
 *   <Menu.LabelText>テーマ設定</Menu.LabelText>
 * </Menu.ContainerItem>
 */
export function ContainerItem({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  // テーマを取得
  const t = useTheme()

  return (
    <View
      style={[
        // Itemコンポーネントと同様のスタイルだが、Pressableではない
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_md,
        a.rounded_md,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {paddingVertical: 10},
        style,
      ]}>
      {children}
    </View>
  )
}

/**
 * ラベルテキストコンポーネント - メニュー内のラベル表示
 * Label text component - label display within menu
 *
 * メニュー内のセクションラベルやヘッダーテキストを表示します。
 * 通常のアイテムテキストよりも控えめなスタイルで表示されます。
 *
 * Displays section labels or header text within menu.
 * Displayed with more subdued style than regular item text.
 *
 * @param {React.ReactNode} children - ラベルテキスト
 * @param {StyleProp<TextStyle>} [style] - 追加のテキストスタイル
 * @returns {JSX.Element} スタイル付きラベルテキスト
 *
 * @example
 * // 使用例:
 * <Menu.LabelText>表示設定</Menu.LabelText>
 */
export function LabelText({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<TextStyle>
}) {
  // テーマを取得
  const t = useTheme()

  return (
    <Text
      style={[
        a.font_bold,                    // 太字
        t.atoms.text_contrast_medium,   // 中コントラストの色（控えめ）
        {marginBottom: -8},             // 下マージンを負の値に（次の要素との間隔調整）
        // ↑ 負のマージン: 次の要素を上に引き寄せる（視覚的な間隔調整）
        style,
      ]}>
      {children}
    </Text>
  )
}

/**
 * グループコンポーネント - 関連するメニューアイテムをグループ化
 * Group component - groups related menu items
 *
 * 関連するメニューアイテムを視覚的にグループ化します。
 * グループ内のアイテムは、角丸のコンテナ内に配置され、区切り線で分離されます。
 *
 * Visually groups related menu items.
 * Items within group are placed in rounded container and separated by dividers.
 *
 * ## flattenReactChildren について（Goユーザー向け）:
 * - ネストされたReact要素配列を平坦化するユーティリティ
 * - Fragment（<></>）内の要素も展開する
 * - 各要素に一意のキーを自動付与
 * - Goでの類似例: スライスのスライスを1次元化
 *
 * ## cloneElement について（Goユーザー向け）:
 * - 既存のReact要素を複製して新しいプロパティを追加
 * - 元の要素は変更せず、新しい要素を返す（イミュータブル）
 * - Goでの類似例: 構造体をコピーしてフィールドを上書き
 *
 * @param {React.ReactNode} children - グループ内のアイテム
 * @param {StyleProp<ViewStyle>} [style] - 追加のスタイル
 * @returns {JSX.Element} グループ化されたメニューアイテム
 *
 * @example
 * // 使用例:
 * <Menu.Group>
 *   <Menu.Item label="編集" onPress={handleEdit}>
 *     <Menu.ItemText>編集</Menu.ItemText>
 *   </Menu.Item>
 *   <Menu.Item label="削除" onPress={handleDelete}>
 *     <Menu.ItemText>削除</Menu.ItemText>
 *   </Menu.Item>
 * </Menu.Group>
 */
export function Group({children, style}: GroupProps) {
  // テーマを取得
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_md,        // 中程度の角丸
        a.overflow_hidden,   // はみ出した部分を隠す（角丸を維持）
        a.border,            // ボーダーを表示
        t.atoms.border_contrast_low, // 低コントラストのボーダー色
        style,
      ]}>
      {flattenReactChildren(children).map((child, i) => {
        // ↑ flattenReactChildren: ネストされた子要素を平坦化
        // ↑ .map(): 配列の各要素を変換（Goのforループに相当）
        // ↑ (child, i): 各子要素とインデックス
        // ↑ Goユーザー向け: for i, child := range flattenChildren(children) { ... }

        return isValidElement(child) &&
          (child.type === Item || child.type === ContainerItem) ? (
          // ↑ isValidElement: childがReact要素かどうかを判定
          // ↑ child.type: 要素のコンポーネント型（ItemまたはContainerItem）
          // ↑ Goユーザー向け: 型アサーションと型スイッチの組み合わせに似た概念
          <Fragment key={i}>
            {/* ↑ Fragment: 複数要素をグループ化（余分なDOMノードを追加しない） */}
            {/* ↑ key={i}: Reactのリスト要素に必須の一意識別子 */}
            {i > 0 ? (
              // ↑ 最初のアイテム以外の前に区切り線を表示
              <View style={[a.border_b, t.atoms.border_contrast_low]} />
              // ↑ a.border_b: 下ボーダー（区切り線）
            ) : null}
            {cloneElement(child, {
              // ↑ cloneElement: 既存の要素を複製して新しいプロパティを追加
              // ↑ Goユーザー向け: 構造体のコピー作成に似た操作
              // @ts-expect-error cloneElement is not aware of the types
              // ↑ TypeScriptエラーを無視: cloneElementは型推論が完全ではない
              style: {
                borderRadius: 0,  // 角丸を無効化（グループの角丸を使用）
                borderWidth: 0,   // ボーダーを無効化（グループのボーダーを使用）
              },
            })}
          </Fragment>
        ) : null
        // ↑ ItemまたはContainerItem以外の要素はスキップ（nullを返す）
      })}
    </View>
  )
}

/**
 * キャンセルボタンコンポーネント（内部使用）
 * Cancel button component (internal use)
 *
 * ネイティブプラットフォームでメニューを閉じるためのキャンセルボタンを表示します。
 * メニューの最下部に配置されます。
 *
 * Displays cancel button for closing menu on native platforms.
 * Placed at the bottom of the menu.
 *
 * @returns {JSX.Element} キャンセルボタン
 */
function Cancel() {
  // 翻訳関数を取得
  const {_} = useLingui()

  // メニューコンテキストを取得
  const context = useMenuContext()

  return (
    <Button
      label={_(msg`Close this dialog`)}
      {/* ↑ アクセシビリティラベル: "このダイアログを閉じる" */}
      size="small"
      {/* ↑ ボタンサイズ: 小 */}
      variant="ghost"
      {/* ↑ ボタンバリアント: ゴースト（背景なし） */}
      color="secondary"
      {/* ↑ ボタンカラー: セカンダリー（控えめな色） */}
      onPress={() => context.control.close()}>
      {/* ↑ プレス時: メニューを閉じる */}
      {/* ↑ アロー関数: () => {...} 短い無名関数の構文 */}

      <ButtonText>
        <Trans>Cancel</Trans>
        {/* ↑ Trans: 翻訳可能なテキストコンポーネント */}
        {/* ↑ "Cancel"が現在の言語に翻訳される（日本語なら「キャンセル」） */}
      </ButtonText>
    </Button>
  )
}

/**
 * 区切り線コンポーネント
 * Divider component
 *
 * ネイティブプラットフォームでは使用されません（nullを返す）。
 * Web版では実際の区切り線を表示します。
 *
 * Not used on native platforms (returns null).
 * Displays actual divider on web version.
 *
 * @platform web
 * @returns {null} ネイティブでは何も表示しない
 */
export function Divider() {
  return null
  // ↑ ネイティブプラットフォームではメニューアイテムがGroupで自動的に区切られるため不要
  // ↑ Web版（index.web.tsx）では実装が異なる
}
