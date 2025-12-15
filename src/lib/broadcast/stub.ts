/**
 * BroadcastChannel スタブ実装
 * BroadcastChannel Stub Implementation
 *
 * 【概要】
 * BroadcastChannelがサポートされていない環境（React Native）向けのダミー実装。
 * 実際のメッセージ送受信は行わず、インターフェースのみを提供する。
 *
 * 【使用目的】
 * - クロスプラットフォーム対応のための型互換性確保
 * - モバイル環境でもコンパイルエラーを回避
 * - Web環境との統一的なAPI提供
 *
 * 【Goユーザー向け補足】
 * - class: Goのstructに似た型定義（メソッドを持てる）
 * - constructor: Goのコンストラクタ関数（NewXXX）に相当
 * - MessageEvent: メッセージイベントの型（Goのstructに相当）
 * - BroadcastChannel: 複数のブラウザタブ/ワーカー間でメッセージを送受信
 *   Goでいうと、複数プロセス間の名前付きチャネル通信に似ている
 *
 * 【BroadcastChannelとは】
 * Web環境で同じオリジンの異なるコンテキスト（タブ、iframe、ワーカー）間で
 * メッセージを送受信するためのAPI。
 *
 * 例：タブAでログアウト → タブBにもログアウトを通知
 *
 * Goでの類似例：
 * ```go
 * // 名前付きチャネルを介した複数プロセス間通信
 * type BroadcastChannel struct {
 *     name string
 *     ch   chan any
 * }
 *
 * func NewBroadcastChannel(name string) *BroadcastChannel {
 *     return &BroadcastChannel{
 *         name: name,
 *         ch:   make(chan any, 100),
 *     }
 * }
 *
 * func (bc *BroadcastChannel) PostMessage(data any) {
 *     bc.ch <- data
 * }
 *
 * func (bc *BroadcastChannel) Close() {
 *     close(bc.ch)
 * }
 * ```
 */

/**
 * BroadcastChannelのスタブクラス
 * BroadcastChannel Stub Class
 *
 * 【実装詳細】
 * - 全てのメソッドは空実装（何もしない）
 * - 型互換性のためにインターフェースのみ提供
 * - モバイル環境では実際のメッセージ送受信は不要
 *
 * 【Goユーザー向け】
 * このクラスは以下のGo structに相当：
 * ```go
 * type BroadcastChannel struct {
 *     Name      string
 *     OnMessage func(event MessageEvent)
 * }
 * ```
 */
export default class BroadcastChannel {
  /**
   * コンストラクタ（チャネル名を受け取る）
   * Constructor (receives channel name)
   *
   * @param name チャネル名（同じ名前のチャネル間でメッセージを共有） / Channel name (messages are shared between channels with same name)
   */
  constructor(public name: string) {}

  /**
   * メッセージを送信（スタブ実装：何もしない）
   * Post message (stub implementation: does nothing)
   *
   * Goでいう: ch <- data
   *
   * @param _data 送信するデータ / Data to send
   */
  postMessage(_data: any) {}

  /**
   * チャネルを閉じる（スタブ実装：何もしない）
   * Close channel (stub implementation: does nothing)
   *
   * Goでいう: close(ch)
   */
  close() {}

  /**
   * メッセージ受信時のコールバック関数
   * Callback function for message reception
   *
   * Goでいう:
   * for msg := range bc.ch {
   *     onMessage(msg)
   * }
   */
  onmessage: (event: MessageEvent) => void = () => {}

  /**
   * イベントリスナーを追加（スタブ実装：何もしない）
   * Add event listener (stub implementation: does nothing)
   *
   * @param _type イベントタイプ（通常は "message"） / Event type (usually "message")
   * @param _listener リスナー関数 / Listener function
   */
  addEventListener(_type: string, _listener: (event: MessageEvent) => void) {}

  /**
   * イベントリスナーを削除（スタブ実装：何もしない）
   * Remove event listener (stub implementation: does nothing)
   *
   * @param _type イベントタイプ（通常は "message"） / Event type (usually "message")
   * @param _listener リスナー関数 / Listener function
   */
  removeEventListener(
    _type: string,
    _listener: (event: MessageEvent) => void,
  ) {}
}
