/**
 * @fileoverview ダイアログ状態管理システム
 *
 * このモジュールは、アプリケーション全体でダイアログの状態を管理するための
 * Reactコンテキストシステムを提供します。
 *
 * ## 主な機能
 * - アクティブなダイアログの追跡と管理
 * - 全ダイアログの一括クローズ機能
 * - 完全展開状態のダイアログ数の追跡（iOSステータスバー制御用）
 * - Web/Nativeプラットフォーム別の実装
 *
 * ## Goユーザー向けの説明
 * - React.createContext: Goのcontext.Contextに似た依存性注入の仕組み
 *   - アプリケーション全体で共有する値を保持
 *   - コンポーネントツリーを通じて値を伝播（prop drillingを回避）
 * - React.useContext: Goのcontext.Value()に相当、コンテキストから値を取得
 * - React.useState: コンポーネント内の状態変数（値が変更されると再レンダリング）
 * - React.useRef: 再レンダリングを引き起こさない参照型の値（Goのポインタに近い）
 * - React.useCallback: 関数のメモ化（依存配列が変わらない限り同じ関数インスタンスを返す）
 * - React.useMemo: 計算結果のメモ化（依存配列が変わらない限り再計算しない）
 *
 * ## アーキテクチャ
 * このファイルは3つのコンテキストを提供:
 * 1. DialogContext: アクティブなダイアログの状態を保持
 * 2. DialogControlContext: ダイアログ制御機能（開閉、全クローズ）を提供
 * 3. DialogFullyExpandedCountContext: 完全展開ダイアログ数を保持（iOS用）
 */

// Reactライブラリのインポート - コンポーネントの作成に使用
import React from 'react'

// プラットフォーム検出ユーティリティ - WebかNativeかの判定
import {isWeb} from '#/platform/detection'
// ダイアログ制御の型定義 - ダイアログの制御プロパティ
import {type DialogControlRefProps} from '#/components/Dialog'
// グローバルダイアログプロバイダー - アプリ全体でダイアログコンテキストを提供
import {Provider as GlobalDialogsProvider} from '#/components/dialogs/Context'
// ネイティブボトムシートコンポーネント - ネイティブプラットフォーム用のシート表示
import {BottomSheetNativeComponent} from '../../../modules/bottom-sheet'

/**
 * ダイアログコンテキストの型定義（Goのstructに相当）
 * アクティブなダイアログの状態管理を行う
 *
 * ## Goユーザー向け
 * - MutableRefObject: Goのポインタに似た概念、再レンダリングを引き起こさない参照
 * - Map: Goのmap[string]T に相当する連想配列
 * - Set: Goのmap[string]struct{} に相当する集合
 */
interface IDialogContext {
  /**
   * 現在アクティブな `useDialogControl` フックのコレクション
   * ダイアログIDから制御インターフェースへのマッピング
   *
   * The currently active `useDialogControl` hooks.
   *
   * ## Goユーザー向け
   * Goで書くと: activeDialogs *map[string]*DialogControlRefProps
   */
  activeDialogs: React.MutableRefObject<
    Map<string, React.MutableRefObject<DialogControlRefProps>>
  >
  /**
   * 現在開いているダイアログのID一覧（`useId`で生成されたIDで参照）
   * ダイアログの開閉状態を高速に確認するためのSet
   *
   * The currently open dialogs, referenced by their IDs, generated from
   * `useId`.
   *
   * ## Goユーザー向け
   * Goで書くと: openDialogs *map[string]struct{}
   */
  openDialogs: React.MutableRefObject<Set<string>>
}

/**
 * ダイアログ制御コンテキストの型定義（Goのstructに相当）
 * ダイアログの開閉制御機能を提供
 *
 * ## Goユーザー向け
 * - React.Dispatch<React.SetStateAction<T>>: Goの関数型 func(T) または func(func(T) T)
 *   - 値を直接設定: setCount(5)
 *   - 前の値を使って更新: setCount(prev => prev + 1)
 */
interface IDialogControlContext {
  /** 全ダイアログを閉じる関数（閉じたダイアログがあればtrue） */
  closeAllDialogs(): boolean
  /** 特定ダイアログの開閉状態を設定する関数 */
  setDialogIsOpen(id: string, isOpen: boolean): void
  /** 完全展開ダイアログ数の更新関数（useState のセッター） */
  setFullyExpandedCount: React.Dispatch<React.SetStateAction<number>>
}

// ダイアログ状態管理用のReactコンテキスト
const DialogContext = React.createContext<IDialogContext>({} as IDialogContext)
DialogContext.displayName = 'DialogContext' // デバッグ用表示名

// ダイアログ制御用のReactコンテキスト
const DialogControlContext = React.createContext<IDialogControlContext>(
  {} as IDialogControlContext,
)
DialogControlContext.displayName = 'DialogControlContext' // デバッグ用表示名

/**
 * 完全展開状態のダイアログ数のコンテキスト
 * iOSでステータスバーの背景色を決定するために使用される
 * The number of dialogs that are fully expanded. This is used to determine the background color of the status bar
 * on iOS.
 */
const DialogFullyExpandedCountContext = React.createContext<number>(0)
DialogFullyExpandedCountContext.displayName = 'DialogFullyExpandedCountContext' // デバッグ用表示名

/**
 * ダイアログ状態コンテキスト取得フック
 * アクティブなダイアログ情報と開いているダイアログのリストを取得
 * @returns ダイアログ状態コンテキストオブジェクト
 */
export function useDialogStateContext() {
  return React.useContext(DialogContext)
}

/**
 * ダイアログ制御コンテキスト取得フック
 * ダイアログの制御機能（開閉、カウント更新など）を取得
 * @returns ダイアログ制御コンテキストオブジェクト
 */
export function useDialogStateControlContext() {
  return React.useContext(DialogControlContext)
}

/**
 * 完全展開ダイアログ数取得フック
 * 完全に展開されているダイアログの数を取得
 * @returns 完全展開状態のダイアログ数
 */
export function useDialogFullyExpandedCountContext() {
  return React.useContext(DialogFullyExpandedCountContext)
}

/**
 * ダイアログプロバイダー
 * アプリケーション全体でダイアログの状態管理と制御機能を提供
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  // 完全展開状態のダイアログ数を管理
  const [fullyExpandedCount, setFullyExpandedCount] = React.useState(0)

  // アクティブなダイアログの参照マップ（ID -> ダイアログ制御ref）
  const activeDialogs = React.useRef<
    Map<string, React.MutableRefObject<DialogControlRefProps>>
  >(new Map())
  // 開いているダイアログのID集合
  const openDialogs = React.useRef<Set<string>>(new Set())

  // 全ダイアログを閉じる関数（プラットフォーム依存の実装）
  const closeAllDialogs = React.useCallback(() => {
    if (isWeb) {
      // Web環境：各ダイアログの制御refを使って個別に閉じる
      openDialogs.current.forEach(id => {
        const dialog = activeDialogs.current.get(id)
        if (dialog) dialog.current.close()
      })

      return openDialogs.current.size > 0 // 閉じたダイアログがあったかを返却
    } else {
      // ネイティブ環境：ネイティブコンポーネントで一括クローズ
      BottomSheetNativeComponent.dismissAll()
      return false // ネイティブでは常にfalseを返却
    }
  }, [])

  // 特定ダイアログの開閉状態を設定する関数
  const setDialogIsOpen = React.useCallback((id: string, isOpen: boolean) => {
    if (isOpen) {
      // ダイアログを開く場合：IDを集合に追加
      openDialogs.current.add(id)
    } else {
      // ダイアログを閉じる場合：IDを集合から削除
      openDialogs.current.delete(id)
    }
  }, [])

  // ダイアログ状態コンテキストの値をメモ化
  const context = React.useMemo<IDialogContext>(
    () => ({
      activeDialogs, // アクティブダイアログマップ
      openDialogs,   // 開いているダイアログID集合
    }),
    [activeDialogs, openDialogs],
  )
  
  // ダイアログ制御機能をメモ化
  const controls = React.useMemo(
    () => ({
      closeAllDialogs,        // 全ダイアログクローズ関数
      setDialogIsOpen,        // ダイアログ開閉設定関数
      setFullyExpandedCount,  // 完全展開数更新関数
    }),
    [closeAllDialogs, setDialogIsOpen, setFullyExpandedCount],
  )

  return (
    // ダイアログ状態コンテキストプロバイダー
    <DialogContext.Provider value={context}>
      {/* ダイアログ制御コンテキストプロバイダー */}
      <DialogControlContext.Provider value={controls}>
        {/* 完全展開ダイアログ数コンテキストプロバイダー */}
        <DialogFullyExpandedCountContext.Provider value={fullyExpandedCount}>
          {/* グローバルダイアログプロバイダーでラップ */}
          <GlobalDialogsProvider>{children}</GlobalDialogsProvider>
        </DialogFullyExpandedCountContext.Provider>
      </DialogControlContext.Provider>
    </DialogContext.Provider>
  )
}
Provider.displayName = 'DialogsProvider' // デバッグ用表示名
