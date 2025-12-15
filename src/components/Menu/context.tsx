/**
 * @fileoverview メニューコンテキスト管理
 * Menu context management
 *
 * このファイルは、メニューコンポーネント階層全体で状態を共有するためのReact Contextを提供します。
 * React Contextは、プロパティのバケツリレー（prop drilling）を避けて、深い階層の子コンポーネントに状態を渡すための仕組みです。
 *
 * This file provides React Context for sharing state across the entire menu component hierarchy.
 * React Context is a mechanism to pass state to deeply nested child components without prop drilling.
 *
 * ## Goユーザー向けの説明 (For Go developers):
 * - React Contextは、Goの`context.Context`に名前は似ていますが、用途は異なります
 * - Goのcontextはキャンセルやタイムアウトに使われますが、React Contextは状態共有に使われます
 * - より近い概念は、リクエストスコープの依存性注入（DI）やスレッドローカル変数です
 * - Context.Providerは値を提供し、useContextフックで子孫コンポーネントが値を取得します
 *
 * ## React Contextの仕組み:
 * 1. `React.createContext(defaultValue)` でコンテキストを作成
 * 2. `<Context.Provider value={...}>` でコンポーネントツリーに値を注入
 * 3. `useContext(Context)` で任意の子孫コンポーネントから値を取得
 * 4. Provider外で使用するとエラーをスロー（安全性のため）
 */

// Reactコアライブラリ - Contextとフックの基本機能
import React from 'react'

// メニューコンテキストの型定義をインポート
import {type ContextType, type ItemContextType} from '#/components/Menu/types'

/**
 * メニュー全体のコンテキスト
 * Context for entire menu
 *
 * メニューの制御オブジェクト（開閉、ID管理など）を子孫コンポーネント全体で共有します。
 * Shares menu control object (open/close, ID management, etc.) across descendant components.
 *
 * ## Goユーザー向けの説明:
 * `React.createContext<T | null>(null)`は、型Tまたはnullを保持するコンテキストを作成します。
 * nullをデフォルト値とし、Provider外で使用された場合に検出できるようにしています。
 * Goでの類似例: `var menuContext *MenuContext = nil` のようなグローバル変数（ただしスレッドセーフ）
 *
 * @example
 * // 使用例:
 * function MenuComponent() {
 *   const context = useMenuContext(); // コンテキスト値を取得
 *   context.control.open(); // メニューを開く
 * }
 */
export const Context = React.createContext<ContextType | null>(null)
// ↑ createContext: React Contextオブジェクトを作成。ジェネリック型でコンテキストの値の型を指定
// ↑ createContext: Creates React Context object. Generic type specifies the type of context value
// ↑ Goでは: var Context = NewContext[ContextType](nil) のような関数呼び出しに相当

// デバッグツールでの表示名を設定 - React DevToolsで見やすくする
// Set display name for debugging tools - makes it easier to see in React DevTools
Context.displayName = 'MenuContext'
// ↑ displayName: React DevToolsでのコンポーネント名。デバッグ時に役立つ

/**
 * メニューアイテムのコンテキスト
 * Context for menu items
 *
 * 個々のメニューアイテムの状態（無効化など）を子コンポーネントで共有します。
 * Shares state of individual menu items (disabled, etc.) with child components.
 *
 * ## Goユーザー向けの説明:
 * メニューアイテムごとに独立したコンテキストを持つことで、アイテム固有の状態を管理します。
 * これはネストされたコンテキストの例で、親メニューコンテキストの中に複数のアイテムコンテキストが存在します。
 *
 * @example
 * // 使用例:
 * function MenuItem({ disabled }) {
 *   return (
 *     <ItemContext.Provider value={{ disabled }}>
 *       <MenuItemIcon /> {/* ここでdisabled状態にアクセス可能 *\/}
 *     </ItemContext.Provider>
 *   );
 * }
 */
export const ItemContext = React.createContext<ItemContextType | null>(null)
// ↑ アイテムごとの状態を保持するコンテキスト
Context.displayName = 'MenuItemContext'

/**
 * メニューコンテキストを取得するカスタムフック
 * Custom hook to retrieve menu context
 *
 * メニューコンテキストを安全に取得し、Provider外で使用された場合はエラーをスローします。
 * Safely retrieves menu context and throws error if used outside Provider.
 *
 * ## Goユーザー向けの説明:
 * - `useContext`は、Reactの「フック」と呼ばれる特殊な関数です
 * - フックは、関数コンポーネント内でのみ使用でき、Reactの機能にアクセスします
 * - Goには直接的な相当物はありませんが、コンテキスト値の取得と考えてください
 * - `use`で始まる名前は、Reactのフックの命名規則です
 *
 * ## React Hooks（フック）とは:
 * - 関数コンポーネントで状態やライフサイクルを扱うための仕組み
 * - `useState`: 状態変数を作成（Goの変数宣言に類似）
 * - `useEffect`: 副作用を実行（コンポーネントマウント時、更新時など）
 * - `useContext`: コンテキスト値を取得
 * - `useMemo`: 計算結果をメモ化（キャッシュ）
 * - `useCallback`: 関数をメモ化
 * - フックは必ずコンポーネントのトップレベルで呼び出す必要があります（条件分岐の中で使用不可）
 *
 * @returns {ContextType} メニューコンテキストオブジェクト
 * @throws {Error} Provider外で使用された場合
 *
 * @example
 * // 使用例:
 * function MenuTrigger() {
 *   // フックを呼び出してコンテキストを取得
 *   const { control } = useMenuContext();
 *   // ↑ 分割代入: control変数にcontext.controlを代入
 *   // ↑ Goでは: control := context.Control のような形
 *
 *   return (
 *     <button onClick={() => control.open()}>
 *       メニューを開く
 *     </button>
 *   );
 * }
 */
export function useMenuContext() {
  // React.useContext: Contextオブジェクトから現在の値を取得
  // React.useContext: Gets current value from Context object
  const context = React.useContext(Context)
  // ↑ useContext(Context): Providerで提供された値を取得
  // ↑ Provider外で呼ばれた場合はnullが返る
  // ↑ Goでの類似例: context := getContextValue() のような関数呼び出し

  // Providerの外で使用された場合はエラーをスロー - 早期エラー検出のため
  // Throw error if used outside Provider - for early error detection
  if (!context) {
    // エラーメッセージ: このフックは必ずContext.Provider内で使用する必要がある
    throw new Error('useMenuContext must be used within a Context.Provider')
    // ↑ Goでは: panic("useMenuContext must be used within a Context.Provider") に相当
    // ↑ ただし、Reactではエラーバウンダリでキャッチ可能
  }

  // コンテキスト値を返す
  return context
  // ↑ 型はContextType（nullではない）。TypeScriptがif文で型を絞り込む
  // ↑ Type is ContextType (not null). TypeScript narrows the type with if statement
}

/**
 * メニューアイテムコンテキストを取得するカスタムフック
 * Custom hook to retrieve menu item context
 *
 * メニューアイテムコンテキストを安全に取得し、Provider外で使用された場合はエラーをスローします。
 * Safely retrieves menu item context and throws error if used outside Provider.
 *
 * ## Goユーザー向けの説明:
 * useMenuContext関数と同じパターンですが、アイテム固有のコンテキストを取得します。
 * メニューアイテム内のアイコンやテキストコンポーネントが、disabled状態などを取得するために使用します。
 *
 * @returns {ItemContextType} メニューアイテムコンテキストオブジェクト
 * @throws {Error} Provider外で使用された場合
 *
 * @example
 * // 使用例:
 * function MenuItemIcon({ icon: Icon }) {
 *   const { disabled } = useMenuItemContext();
 *   // disabled状態に応じてアイコンの色を変更
 *   const color = disabled ? 'gray' : 'black';
 *
 *   return <Icon color={color} />;
 * }
 */
export function useMenuItemContext() {
  // アイテムコンテキストを取得
  // Get item context
  const context = React.useContext(ItemContext)

  // Providerの外で使用された場合はエラーをスロー
  // Throw error if used outside Provider
  if (!context) {
    throw new Error('useMenuItemContext must be used within a Context.Provider')
  }

  return context
}
