// AT Protocol API型定義 - Blueskyエージェントと会話ログ取得APIの型
import {BskyAgent, ChatBskyConvoGetLog} from '@atproto/api'

/**
 * メッセージイベントバスパラメータ型 - イベントバスの初期化パラメータ
 * Message event bus parameters type - initialization parameters for event bus
 */
export type MessagesEventBusParams = {
  agent: BskyAgent // AT Protocolエージェントインスタンス / AT Protocol agent instance
}

/**
 * メッセージイベントバス状態列挙型 - イベントバスのライフサイクル状態
 * Message event bus status enum - lifecycle states of event bus
 */
export enum MessagesEventBusStatus {
  Initializing = 'initializing', // 初期化中 - イベントバスの初期設定中
  Ready = 'ready',               // 準備完了 - アクティブにメッセージをポーリング中
  Error = 'error',               // エラー - エラーが発生して停止中
  Backgrounded = 'backgrounded', // バックグラウンド - 低頻度でポーリング中
  Suspended = 'suspended',       // 一時停止 - ポーリングを一時停止中
}

/**
 * メッセージイベントバスディスパッチイベント列挙型 - 状態変更を指示するイベント
 * Message event bus dispatch event enum - events that instruct state changes
 */
export enum MessagesEventBusDispatchEvent {
  Ready = 'ready',           // 準備完了 - 初期化完了でアクティブ状態に遷移
  Error = 'error',           // エラー - エラー状態に遷移
  Background = 'background', // バックグラウンド - バックグラウンド状態に遷移
  Suspend = 'suspend',       // 一時停止 - 停止状態に遷移
  Resume = 'resume',         // 再開 - アクティブ状態に復帰
  UpdatePoll = 'updatePoll', // ポーリング更新 - ポーリング間隔の再計算と更新
}

/**
 * メッセージイベントバスエラーコード列挙型 - イベントバスのエラー種別
 * Message event bus error code enum - types of errors in event bus
 */
export enum MessagesEventBusErrorCode {
  Unknown = 'unknown',       // 不明なエラー - 特定できないエラー
  InitFailed = 'initFailed',   // 初期化失敗 - イベントバスの初期化時のエラー
  PollFailed = 'pollFailed',   // ポーリング失敗 - メッセージログ取得時のエラー
}

/**
 * メッセージイベントバスエラー型 - エラーの詳細情報
 * Message event bus error type - detailed error information
 */
export type MessagesEventBusError = {
  code: MessagesEventBusErrorCode // エラーコード / Error code
  exception?: Error // 元の例外オブジェクト（ある場合） / Original exception object (if any)
  retry: () => void // 再試行関数 - エラーからの復旧を試みる / Retry function to attempt recovery
}

/**
 * メッセージイベントバスディスパッチアクション型 - 状態変更を指示するアクション
 * Message event bus dispatch action type - actions that instruct state changes
 */
export type MessagesEventBusDispatch =
  | { // 準備完了アクション
      event: MessagesEventBusDispatchEvent.Ready
    }
  | { // バックグラウンドアクション
      event: MessagesEventBusDispatchEvent.Background
    }
  | { // 一時停止アクション
      event: MessagesEventBusDispatchEvent.Suspend
    }
  | { // 再開アクション
      event: MessagesEventBusDispatchEvent.Resume
    }
  | { // エラーアクション（エラー情報を含む）
      event: MessagesEventBusDispatchEvent.Error
      payload: MessagesEventBusError
    }
  | { // ポーリング更新アクション
      event: MessagesEventBusDispatchEvent.UpdatePoll
    }

/**
 * メッセージイベントバスイベント型 - 購読者に配信されるイベント
 * Message event bus event type - events delivered to subscribers
 */
export type MessagesEventBusEvent =
  | { // 接続イベント - イベントバスが正常に接続した時
      type: 'connect'
    }
  | { // エラーイベント - エラーが発生した時
      type: 'error'
      error: MessagesEventBusError // エラー詳細情報 / Error details
    }
  | { // ログイベント - 新しいメッセージログが取得された時
      type: 'logs'
      logs: ChatBskyConvoGetLog.OutputSchema['logs'] // メッセージログの配列 / Array of message logs
    }
