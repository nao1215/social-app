/**
 * コンテキストメニュー - Web版実装
 *
 * このファイルはWeb専用のコンテキストメニュー実装です。
 * ネイティブ版（index.tsx）とは異なり、標準のMenuコンポーネントを再エクスポートします。
 *
 * プラットフォーム分離戦略:
 * - index.web.tsx: Web版（Radix UIベースのMenu）
 * - index.tsx: ネイティブ版（カスタムジェスチャー実装）
 *
 * Webでは:
 * - 標準的なドロップダウンメニュー動作
 * - マウスホバー対応
 * - キーボードナビゲーション対応
 *
 * @module ContextMenu/Web
 */

// AuxiliaryViewの型定義（Web版では使用されない）
import {type AuxiliaryViewProps} from './types'

/**
 * すべてのMenuコンポーネントを再エクスポート
 *
 * Web版では、ネイティブ版のような複雑なジェスチャー処理は不要です。
 * 代わりに、標準的なMenuコンポーネント（Radix UIベース）を使用します。
 *
 * エクスポートされるコンポーネント:
 * - Root, Trigger, Outer: メニューの基本構造
 * - Item, ItemText, ItemIcon: メニュー項目
 * - その他: Menu コンポーネントの全機能
 */
export * from '#/components/Menu'

/**
 * Providerコンポーネント（Web版では何もしない）
 *
 * ネイティブ版との互換性のために存在します。
 * Web版では特別な初期化が不要なため、子要素をそのまま返します。
 *
 * @param children - 子要素
 * @returns 子要素をそのまま返す
 */
export function Provider({children}: {children: React.ReactNode}) {
  return children
}

/**
 * AuxiliaryViewコンポーネント（Web版では未実装）
 *
 * ネイティブ専用機能のため、Web版ではnullを返します。
 * 補助ビュー（リアクション絵文字パレット等）はネイティブアプリでのみ使用されます。
 *
 * @param props - プロパティ（使用されない）
 * @returns null（何も表示しない）
 */
export function AuxiliaryView({}: AuxiliaryViewProps) {
  return null
}
