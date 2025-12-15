/**
 * プロフィールホバーカード型定義モジュール
 *
 * ユーザープロフィールをホバー時に表示するカード（ポップオーバー）コンポーネントの
 * 型定義を提供します。Web版では実際のホバーカードを表示し、ネイティブ版では
 * 子要素をそのまま返します（プラットフォーム固有の実装）。
 *
 * Go言語との対比:
 * - type: Goのstructに相当（構造的型付け）
 * - React.ReactNode: Goのinterface{}に似た任意のReact要素型
 * - ViewStyleProp: スタイルプロパティの型（オプショナル）
 */

import type React from 'react'

// デザインシステムのスタイルプロパティ型をインポート
import {type ViewStyleProp} from '#/alf'

/**
 * プロフィールホバーカードコンポーネントのプロパティ型
 *
 * ViewStylePropを継承し、スタイルプロパティも受け入れます。
 *
 * @property {React.ReactNode} children - カード内に表示する子要素（通常はユーザー名やリンク）
 * @property {string} did - ユーザーのDID（分散識別子、AT ProtocolでのユーザーID）
 * @property {boolean} [disable] - ホバーカード機能を無効にするかどうか
 * @property {boolean} [inline] - インライン表示にするかどうか
 */
export type ProfileHoverCardProps = ViewStyleProp & {
  children: React.ReactNode
  did: string
  disable?: boolean
  inline?: boolean
}
