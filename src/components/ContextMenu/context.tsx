/**
 * コンテキストメニューのReact Context定義
 *
 * このファイルは、コンテキストメニューの状態をコンポーネントツリー全体で共有するための
 * React Contextを定義しています。
 *
 * React Contextについて（Goユーザー向け）:
 * - Goのcontext.Contextと似ていますが、値の伝播に特化しています
 * - Provider/Consumerパターンで、親から子孫へ値を渡します
 * - プロップドリリング（中間コンポーネントへの不要なprops渡し）を回避
 *
 * 定義されるContext:
 * - Context: コンテキストメニュー全体の状態と操作
 * - MenuContext: メニューの配置情報
 * - ItemContext: 個別項目の状態
 *
 * @module ContextMenu/Context
 */

// React標準ライブラリ
import React from 'react'

// コンテキストメニューの型定義（types.tsから）
import {
  type ContextType, // メニュー全体の状態型
  type ItemContextType, // 項目の状態型
  type MenuContextType, // メニュー配置の状態型
} from '#/components/ContextMenu/types'

/**
 * コンテキストメニュー全体のコンテキスト
 *
 * メニューの開閉状態、アニメーション、トリガー位置などを管理します。
 * 初期値はnull（Providerでラップされていない場合はエラー）
 *
 * React.createContext（Goユーザー向け）:
 * - Goのcontext.WithValue()に似ていますが、コンポーネントツリーに特化
 * - ジェネリック型で型安全性を確保
 */
export const Context = React.createContext<ContextType | null>(null)
Context.displayName = 'ContextMenuContext'

/**
 * メニューの配置方向を管理するコンテキスト
 *
 * 左揃え/右揃えの情報を子孫コンポーネントに伝播します。
 * これにより、各メニュー項目が適切な位置に配置されます。
 */
export const MenuContext = React.createContext<MenuContextType | null>(null)
MenuContext.displayName = 'ContextMenuMenuContext'

/**
 * 個別メニュー項目の状態を管理するコンテキスト
 *
 * 項目の無効化状態を子コンポーネント（アイコン、テキスト等）に伝播します。
 * これにより、無効な項目は適切なスタイルで表示されます。
 */
export const ItemContext = React.createContext<ItemContextType | null>(null)
ItemContext.displayName = 'ContextMenuItemContext'

/**
 * コンテキストメニューのコンテキストを取得するフック
 *
 * useContext（Goユーザー向け）:
 * - React Hook（関数コンポーネント内でのみ使用可能）
 * - コンポーネントツリー上位のProviderから値を取得
 * - Goのcontext.Value()に似た動作
 *
 * エラーハンドリング:
 * - Providerの外で使用された場合はエラーをスロー
 * - これにより、誤った使用を早期に検出
 *
 * @returns コンテキストメニューの状態と操作関数
 * @throws Providerの外で使用された場合
 */
export function useContextMenuContext() {
  // useContext: 最も近い親のProviderから値を取得
  const context = React.useContext(Context)

  // Providerが存在しない場合はエラー
  if (!context) {
    throw new Error(
      'useContextMenuContext must be used within a Context.Provider',
    )
  }

  return context
}

/**
 * メニュー配置のコンテキストを取得するフック
 *
 * メニューの左右配置情報を取得します。
 * 項目の位置計算に使用されます。
 *
 * @returns メニューの配置情報
 * @throws Providerの外で使用された場合
 */
export function useContextMenuMenuContext() {
  const context = React.useContext(MenuContext)

  if (!context) {
    throw new Error(
      'useContextMenuMenuContext must be used within a Context.Provider',
    )
  }

  return context
}

/**
 * メニュー項目のコンテキストを取得するフック
 *
 * 項目の無効化状態を取得します。
 * アイコンやテキストのスタイリングに使用されます。
 *
 * @returns 項目の状態
 * @throws Providerの外で使用された場合
 */
export function useContextMenuItemContext() {
  const context = React.useContext(ItemContext)

  if (!context) {
    throw new Error(
      'useContextMenuItemContext must be used within a Context.Provider',
    )
  }

  return context
}
