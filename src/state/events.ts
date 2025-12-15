/**
 * イベント管理モジュール
 *
 * このモジュールはアプリケーション全体で使用されるイベントバスを提供します。
 * EventEmitter3ライブラリを使用してPub/Subパターンを実装しています。
 *
 * 主なイベント:
 * - soft-reset: 画面のソフトリセット（最新データの再読み込み）
 * - session-dropped: セッション切断イベント
 * - network-confirmed: ネットワーク接続確認
 * - network-lost: ネットワーク切断
 * - post-created: 投稿作成完了
 *
 * 【Goユーザー向け補足】
 * EventEmitterパターンはGoのチャネルを使ったPub/Subパターンに似ています。
 * 複数のリスナーが同じイベントを購読でき、イベント発火時に全リスナーが通知されます。
 */

// EventEmitter3 - 軽量で高速なイベントエミッタライブラリ
import EventEmitter from 'eventemitter3'

/**
 * リスナー解除関数の型
 *
 * 【Goユーザー向け補足】
 * Goのcontext.CancelFuncに似た、クリーンアップ用の関数型です。
 */
type UnlistenFn = () => void

// グローバルイベントエミッタインスタンス
const emitter = new EventEmitter()

/**
 * ソフトリセットイベントを発火
 *
 * 画面のソフトリセットを通知します。
 * 通常、トップまでスクロールして最新データを読み込む操作を意味しますが、
 * 画面によって動作が異なる場合があります。
 */
export function emitSoftReset() {
  emitter.emit('soft-reset')
}

/**
 * ソフトリセットイベントを購読
 *
 * @param fn - イベント発火時に呼び出されるコールバック関数
 * @returns リスナーを解除する関数
 *
 * 【Goユーザー向け補足】
 * これはGoのチャネル受信に似ています：
 * ```go
 * ch := make(chan struct{})
 * go func() {
 *   for range ch {
 *     fn()
 *   }
 * }()
 * ```
 */
export function listenSoftReset(fn: () => void): UnlistenFn {
  emitter.on('soft-reset', fn)
  return () => emitter.off('soft-reset', fn)  // クリーンアップ関数を返す
}

/**
 * セッション切断イベントを発火
 *
 * ユーザーセッションが無効化された際に通知します。
 * 通常、再ログインが必要な状況で使用されます。
 */
export function emitSessionDropped() {
  emitter.emit('session-dropped')
}

/**
 * セッション切断イベントを購読
 *
 * @param fn - イベント発火時に呼び出されるコールバック関数
 * @returns リスナーを解除する関数
 */
export function listenSessionDropped(fn: () => void): UnlistenFn {
  emitter.on('session-dropped', fn)
  return () => emitter.off('session-dropped', fn)
}

/**
 * ネットワーク接続確認イベントを発火
 *
 * ネットワーク接続が確認された際に通知します。
 * オフライン状態からの復帰時などに使用されます。
 */
export function emitNetworkConfirmed() {
  emitter.emit('network-confirmed')
}

/**
 * ネットワーク接続確認イベントを購読
 *
 * @param fn - イベント発火時に呼び出されるコールバック関数
 * @returns リスナーを解除する関数
 */
export function listenNetworkConfirmed(fn: () => void): UnlistenFn {
  emitter.on('network-confirmed', fn)
  return () => emitter.off('network-confirmed', fn)
}

/**
 * ネットワーク切断イベントを発火
 *
 * ネットワーク接続が失われた際に通知します。
 * オフライン状態への遷移時に使用されます。
 */
export function emitNetworkLost() {
  emitter.emit('network-lost')
}

/**
 * ネットワーク切断イベントを購読
 *
 * @param fn - イベント発火時に呼び出されるコールバック関数
 * @returns リスナーを解除する関数
 */
export function listenNetworkLost(fn: () => void): UnlistenFn {
  emitter.on('network-lost', fn)
  return () => emitter.off('network-lost', fn)
}

/**
 * 投稿作成完了イベントを発火
 *
 * 新しい投稿が正常に作成された際に通知します。
 * フィード更新などのトリガーとして使用されます。
 */
export function emitPostCreated() {
  emitter.emit('post-created')
}

/**
 * 投稿作成完了イベントを購読
 *
 * @param fn - イベント発火時に呼び出されるコールバック関数
 * @returns リスナーを解除する関数
 */
export function listenPostCreated(fn: () => void): UnlistenFn {
  emitter.on('post-created', fn)
  return () => emitter.off('post-created', fn)
}
