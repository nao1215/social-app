/**
 * BroadcastChannel Web実装
 * BroadcastChannel Web Implementation
 *
 * 【概要】
 * ブラウザ環境用のBroadcastChannel実装。
 * ブラウザのネイティブBroadcastChannelがサポートされている場合はそれを使用し、
 * サポートされていない場合はスタブ実装にフォールバック。
 *
 * 【プラットフォーム対応】
 * - index.ts: モバイル（iOS/Android）→ スタブ実装
 * - index.web.ts: ブラウザ → ネイティブBroadcastChannel または スタブ
 *
 * 【BroadcastChannelの用途】
 * - 複数のブラウザタブ間での状態同期
 * - ログアウト時の全タブへの通知
 * - リアルタイムデータの同期
 *
 * 【Goユーザー向け補足】
 * - BroadcastChannel: 同一オリジンの複数のブラウザコンテキスト間でメッセージを送受信
 *   Goでいうと、名前付きチャネルを使った複数プロセス間通信（IPC）に似ている
 * - window.BroadcastChannel: ブラウザ組み込みのBroadcastChannel実装
 * - 三項演算子: Goの if-else に相当（condition ? trueValue : falseValue）
 *
 * 【動作例】
 * ```typescript
 * // タブA
 * const bc = new BroadcastChannel('app-state')
 * bc.postMessage({ type: 'logout' })
 *
 * // タブB（別タブ）
 * const bc = new BroadcastChannel('app-state')
 * bc.onmessage = (event) => {
 *   if (event.data.type === 'logout') {
 *     // ログアウト処理
 *   }
 * }
 * ```
 *
 * Goでの同等実装イメージ：
 * ```go
 * // プロセス間通信用の名前付きパイプやUnix domain socket
 * type BroadcastChannel struct {
 *     name string
 *     conn net.Conn
 * }
 * ```
 */

// スタブ実装をインポート（フォールバック用）
// Import stub implementation (for fallback)
import Stub from '#/lib/broadcast/stub'

// ブラウザがBroadcastChannelをサポートしているかチェックし、適切な実装をエクスポート
// Check if browser supports BroadcastChannel and export appropriate implementation
// 'BroadcastChannel' in window: ブラウザがBroadcastChannel APIをサポートしているか判定
// 'BroadcastChannel' in window: Check if browser supports BroadcastChannel API
// → サポートあり: window.BroadcastChannel（ネイティブ実装）を使用
// → サポートなし: Stub（空実装）を使用
// Goでいう: if _, ok := features["BroadcastChannel"]; ok { ... } else { ... }
export default 'BroadcastChannel' in window ? window.BroadcastChannel : Stub
