/**
 * @file レイアウト用Reactコンテキストの定義
 * @description スクロールバーのオフセット情報を子コンポーネントツリーに提供するためのコンテキスト
 *
 * Webプラットフォームでは、スクロールバーの表示によってレイアウトがずれる問題があります。
 * このコンテキストを使用することで、オフセットビュー内のコンポーネントが適切に配置されます。
 */

// Reactのコアライブラリ - createContextでコンテキストを作成
import React from 'react'

/**
 * スクロールバーオフセットコンテキスト
 *
 * Goユーザー向け説明:
 * - React Context: Goのcontext.Contextに似ており、コンポーネントツリー全体にデータを伝播
 * - createContext: デフォルト値を持つコンテキストオブジェクトを作成
 * - Provider/Consumer: コンテキストの提供者と消費者のペアで動作
 *
 * 使用例:
 * ```tsx
 * // 提供側
 * <ScrollbarOffsetContext.Provider value={{ isWithinOffsetView: true }}>
 *   <ChildComponents />
 * </ScrollbarOffsetContext.Provider>
 *
 * // 消費側
 * const { isWithinOffsetView } = useContext(ScrollbarOffsetContext)
 * ```
 *
 * @property {boolean} isWithinOffsetView - オフセット適用済みビュー内にいるかどうか
 * - true: このビュー内ではスクロールバーオフセットを再適用しない
 * - false: スクロールバーオフセットを適用する必要がある
 */
export const ScrollbarOffsetContext = React.createContext({
  isWithinOffsetView: false,
})

/**
 * デバッグ時に役立つ表示名を設定
 *
 * React DevToolsでコンポーネントツリーを見たときに、
 * "Context.Provider" ではなく "ScrollbarOffsetContext.Provider" と表示されます
 */
ScrollbarOffsetContext.displayName = 'ScrollbarOffsetContext'
