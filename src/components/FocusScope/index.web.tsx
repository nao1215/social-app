/**
 * フォーカススコープコンポーネント - Web版
 *
 * このファイルはWeb専用のフォーカス管理実装です。
 * Radix UIのFocusScopeを使用して、適切なフォーカストラップを提供します。
 *
 * フォーカストラップとは:
 * - モーダルやダイアログ内でフォーカスを閉じ込める機能
 * - ユーザーがTab/Shift+Tabで範囲外に移動できないようにする
 * - アクセシビリティ（キーボードナビゲーション）で重要
 *
 * Web版の特徴:
 * - Radix UIの完全な実装を使用
 * - キーボードナビゲーション完全対応
 * - スクリーンリーダー対応
 *
 * @module FocusScope/Web
 */

// React基本型
import {type ReactNode} from 'react'
// Radix UI内部のFocusScopeコンポーネント（業界標準のフォーカス管理）
import {FocusScope as RadixFocusScope} from 'radix-ui/internal'

/**
 * フォーカススコープコンポーネント
 *
 * Radix UIのFocusScopeをラップして、統一されたAPIを提供します。
 * モーダル、ダイアログ、ドロワーなどで使用されます。
 *
 * Radix UIのFocusScopeの機能:
 * - loop: 最後の要素から最初の要素へTabでループ
 * - asChild: 子要素に直接プロパティを適用（追加のDOMノードなし）
 * - trapped: フォーカスをスコープ内に閉じ込める
 *
 * @param children - フォーカスをトラップする子要素
 * @returns フォーカス管理されたコンポーネント
 */
export function FocusScope({children}: {children: ReactNode}) {
  return (
    <RadixFocusScope.FocusScope loop asChild trapped>
      {children}
    </RadixFocusScope.FocusScope>
  )
}
