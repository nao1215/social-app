/**
 * プロフィールホバーカードコンポーネント（ネイティブ版）
 *
 * このファイルはReact Native（iOS/Android）向けの実装です。
 * ネイティブプラットフォームではホバー操作が存在しないため、
 * 子要素をそのまま返すだけのシンプルな実装になっています。
 *
 * 実際のホバーカード機能はWeb版（index.web.tsx）で実装されています。
 *
 * プラットフォーム固有ファイル:
 * - index.tsx: ネイティブ版（iOS/Android）
 * - index.web.tsx: Web版（ブラウザ）
 * Metro bundlerが実行環境に応じて適切なファイルを選択します。
 *
 * Go言語との対比:
 * - ビルドタグに似た仕組み（.web.tsx, .native.tsx, .ios.tsx, .android.tsx）
 */

import {type ProfileHoverCardProps} from './types'

/**
 * プロフィールホバーカードコンポーネント（ネイティブ実装）
 *
 * ネイティブプラットフォームではホバー操作が存在しないため、
 * 子要素をそのまま返します。これにより、Web版とネイティブ版で
 * 同じAPIを使用できます（プラットフォーム抽象化）。
 *
 * @param {ProfileHoverCardProps} props - コンポーネントのプロパティ
 * @param {React.ReactNode} props.children - 表示する子要素
 * @returns {React.ReactNode} 子要素をそのまま返す
 *
 * @example
 * <ProfileHoverCard did="did:plc:xyz123">
 *   <Text>@username</Text>
 * </ProfileHoverCard>
 * // ネイティブでは <Text>@username</Text> がそのまま表示される
 */
export function ProfileHoverCard({children}: ProfileHoverCardProps) {
  return children
}
