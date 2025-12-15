/**
 * スクロールロックコンポーネント - ネイティブ版
 *
 * このファイルはiOS/Android専用の実装です。
 * ネイティブアプリでは、Web版のようなbodyスクロール制御が不要なため、何もしません。
 *
 * プラットフォーム別の挙動:
 * - Web: react-remove-scroll-barを使用してスクロールを無効化
 * - ネイティブ: モーダルは自動的に背景スクロールをブロック（OS機能）
 *
 * ネイティブアプリでの背景スクロール制御:
 * - React NativeのModalコンポーネントが自動的に処理
 * - overlayとして表示される要素は自然に背景をブロック
 * - 追加のスクロール制御は不要
 *
 * @module LockScroll/Native
 */

/**
 * スクロールロックコンポーネント（何もしない実装）
 *
 * Web版との互換性のために存在します。
 * ネイティブアプリではスクロールロックが自動的に処理されるため、
 * このコンポーネントは常にnullを返します。
 *
 * 使用例:
 * ```tsx
 * <Modal>
 *   <LockScroll /> {/* ネイティブでは何もしない */}
 *   <ModalContent />
 * </Modal>
 * ```
 *
 * @returns null（何もレンダリングしない）
 */
export function LockScroll() {
  return null
}
