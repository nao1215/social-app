/**
 * Webスクロール復元フック（ネイティブ版・スタブ実装）
 *
 * 【概要】
 * ネイティブアプリではWebスクロール復元は不要。
 * Web版との互換性のためにスタブ実装を提供。
 *
 * 【ネイティブでは不要な理由】
 * - React Navigationが自動的にスクロール位置を管理
 * - 各画面は独立したスクロールビューを持つ
 * - history APIは存在しない
 *
 * 【Goユーザー向け補足】
 * - .native.ts: ネイティブ環境（iOS/Android）でのみ読み込まれる
 *   Goのビルドタグ（// +build ios android）に相当
 */

/**
 * スクロール復元フック（ネイティブ版・何もしない）
 *
 * @returns undefined（ネイティブでは使用しない）
 */
export function useWebScrollRestoration() {
  return undefined
}
