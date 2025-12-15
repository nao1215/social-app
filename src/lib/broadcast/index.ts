/**
 * BroadcastChannel モバイル実装（スタブ）
 * BroadcastChannel Mobile Implementation (Stub)
 *
 * 【概要】
 * React Native（iOS/Android）用のBroadcastChannel実装。
 * ネイティブ環境ではBroadcastChannelがサポートされていないため、スタブ実装を使用。
 *
 * 【プラットフォーム対応】
 * - index.ts: モバイル（iOS/Android）→ スタブ実装
 * - index.web.ts: ブラウザ → ネイティブBroadcastChannel
 *
 * 【Goユーザー向け補足】
 * - BroadcastChannel: プロセス間通信（IPC）の仕組み
 *   Goでいうと、複数のgoroutine間で共有されるchannelに似ている
 * - スタブ: 実装が存在しない環境向けのダミー実装
 */

// スタブ実装をインポート（何もしない空実装）
// Import stub implementation (empty implementation that does nothing)
import Stub from '#/lib/broadcast/stub'

// モバイル環境ではスタブ実装をエクスポート
// Export stub implementation for mobile environment
export default Stub
