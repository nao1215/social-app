// AT Protocol API型定義 - Blueskyエージェント、アクター、会話、メッセージ送信の型
import {
  type BskyAgent,
  type ChatBskyActorDefs,
  type ChatBskyConvoDefs,
  type ChatBskyConvoSendMessage,
} from '@atproto/api'

// メッセージイベントバス型 - リアルタイムメッセージ配信システムの型
import {type MessagesEventBus} from '#/state/messages/events/agent'

/**
 * 会話パラメータ型 - 会話エージェントの初期化パラメータ
 * Conversation parameters type - initialization parameters for conversation agent
 */
export type ConvoParams = {
  convoId: string // 会話の一意識別子 / Unique conversation identifier
  agent: BskyAgent // AT Protocolエージェントインスタンス / AT Protocol agent instance
  events: MessagesEventBus // リアルタイムイベントバス / Real-time event bus
  placeholderData?: { // プレースホルダーデータ（UIの早期描画用） / Placeholder data for early UI rendering
    convo: ChatBskyConvoDefs.ConvoView
  }
}

/**
 * 会話状態列挙型 - 会話のライフサイクル状態を表現
 * Conversation status enum - represents conversation lifecycle states
 */
export enum ConvoStatus {
  Uninitialized = 'uninitialized', // 未初期化 - 会話がまだ初期化されていない状態
  Initializing = 'initializing',   // 初期化中 - 会話データを読み込み中
  Ready = 'ready',                 // 準備完了 - 会話が使用可能状態
  Error = 'error',                 // エラー - 会話にエラーが発生した状態
  Backgrounded = 'backgrounded',   // バックグラウンド - 会話が非アクティブ状態
  Suspended = 'suspended',         // 一時停止 - 会話が一時的に停止された状態
  Disabled = 'disabled',           // 無効 - 会話機能が無効化された状態
}

/**
 * 会話アイテムエラー列挙型 - 会話内で発生するエラーの種類
 * Conversation item error enum - types of errors that can occur within conversations
 */
export enum ConvoItemError {
  /**
   * イベントファイアホースへの接続エラー - リアルタイムメッセージ配信システムでの障害
   * Error connecting to event firehose - failure in real-time message delivery system
   */
  FirehoseFailed = 'firehoseFailed',
  /**
   * 過去メッセージ取得エラー - 会話履歴の読み込み失敗
   * Error fetching past messages - failure loading conversation history
   */
  HistoryFailed = 'historyFailed',
}

/**
 * 会話エラーコード列挙型 - 会話レベルのエラーコード
 * Conversation error code enum - conversation-level error codes
 */
export enum ConvoErrorCode {
  InitFailed = 'initFailed', // 初期化失敗 - 会話の初期化が失敗した状態
}

/**
 * 会話エラー型 - 会話で発生したエラーの詳細情報
 * Conversation error type - detailed information about errors that occurred in conversation
 */
export type ConvoError = {
  code: ConvoErrorCode // エラーコード / Error code
  exception?: Error // 元の例外オブジェクト（ある場合） / Original exception object (if any)
  retry: () => void // 再試行関数 - エラーからの復旧を試みる / Retry function to attempt recovery from error
}

/**
 * 会話ディスパッチイベント列挙型 - 会話状態変更イベントの種類
 * Conversation dispatch event enum - types of events that trigger conversation state changes
 */
export enum ConvoDispatchEvent {
  Init = 'init',           // 初期化 - 会話の初期化を開始
  Ready = 'ready',         // 準備完了 - 会話が使用可能状態に遷移
  Resume = 'resume',       // 再開 - 会話をアクティブ状態に戻す
  Background = 'background', // バックグラウンド - 会話を非アクティブ状態にする
  Suspend = 'suspend',     // 一時停止 - 会話を一時的に停止
  Error = 'error',         // エラー - エラー状態に遷移
  Disable = 'disable',     // 無効化 - 会話機能を無効化
}

/**
 * 会話ディスパッチアクション型 - 状態変更を指示するアクション
 * Conversation dispatch action type - actions that instruct state changes
 */
export type ConvoDispatch =
  | { // 初期化アクション
      event: ConvoDispatchEvent.Init
    }
  | { // 準備完了アクション
      event: ConvoDispatchEvent.Ready
    }
  | { // 再開アクション
      event: ConvoDispatchEvent.Resume
    }
  | { // バックグラウンドアクション
      event: ConvoDispatchEvent.Background
    }
  | { // 一時停止アクション
      event: ConvoDispatchEvent.Suspend
    }
  | { // エラーアクション（エラー情報を含む）
      event: ConvoDispatchEvent.Error
      payload: ConvoError
    }
  | { // 無効化アクション
      event: ConvoDispatchEvent.Disable
    }

/**
 * 会話アイテム型 - 会話内で表示される各種アイテムの統合型
 * Conversation item type - union type for various items displayed in conversations
 */
export type ConvoItem =
  | { // 通常のメッセージアイテム / Regular message item
      type: 'message'
      key: string // 一意キー / Unique key
      message: ChatBskyConvoDefs.MessageView // メッセージデータ / Message data
      nextMessage: // 次のメッセージ（UIのグルーピング用） / Next message (for UI grouping)
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
      prevMessage: // 前のメッセージ（UIのグルーピング用） / Previous message (for UI grouping)
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
    }
  | { // 送信中メッセージアイテム / Pending message item
      type: 'pending-message'
      key: string
      message: ChatBskyConvoDefs.MessageView
      nextMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
      prevMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
      failed: boolean // 送信失敗フラグ / Send failure flag
      /**
       * メッセージの再送関数。存在する場合、メッセージは失敗状態。
       * Retry function for sending the message. If present, the message is in a failed state.
       */
      retry?: () => void
    }
  | { // 削除済みメッセージアイテム / Deleted message item
      type: 'deleted-message'
      key: string
      message: ChatBskyConvoDefs.DeletedMessageView // 削除済みメッセージデータ / Deleted message data
      nextMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
      prevMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
    }
  | { // エラーアイテム / Error item
      type: 'error'
      key: string
      code: ConvoItemError // エラーコード / Error code
      /**
       * 存在する場合、エラーは復旧可能。
       * If present, error is recoverable.
       */
      retry?: () => void
    }

// 会話操作関数の型定義 - 会話内で実行可能なアクションの型
// Type definitions for conversation operation functions - types for actions available within conversations

// メッセージ削除関数型 - 特定メッセージを削除する関数
type DeleteMessage = (messageId: string) => Promise<void>
// メッセージ送信関数型 - 新しいメッセージを送信する関数
type SendMessage = (
  message: ChatBskyConvoSendMessage.InputSchema['message'],
) => void
// メッセージ履歴取得関数型 - 過去のメッセージを追加読み込みする関数
type FetchMessageHistory = () => Promise<void>
// 会話承認関数型 - 会話リクエストを承認する関数
type MarkConvoAccepted = () => void
// リアクション追加関数型 - メッセージに絵文字リアクションを追加する関数
type AddReaction = (messageId: string, reaction: string) => Promise<void>
// リアクション削除関数型 - メッセージから絵文字リアクションを削除する関数
type RemoveReaction = (messageId: string, reaction: string) => Promise<void>

/**
 * 会話状態型定義群 - 各ライフサイクル段階での会話の状態を表現
 * Conversation state type definitions - represent conversation state at each lifecycle stage
 * 
 * 各状態で利用可能な機能やデータが異なり、型安全性を確保している
 * Different features and data are available in each state, ensuring type safety
 */

/**
 * 未初期化状態 - 会話がまだ初期化されていない状態
 * Uninitialized state - conversation has not been initialized yet
 */
export type ConvoStateUninitialized = {
  status: ConvoStatus.Uninitialized
  items: [] // メッセージなし / No messages
  convo: ChatBskyConvoDefs.ConvoView | undefined // 会話メタデータ未確定 / Conversation metadata uncertain
  error: undefined // エラーなし / No error
  sender: ChatBskyActorDefs.ProfileViewBasic | undefined // 送信者情報未確定 / Sender info uncertain
  recipients: ChatBskyActorDefs.ProfileViewBasic[] | undefined // 受信者情報未確定 / Recipients info uncertain
  isFetchingHistory: false // 履歴取得中ではない / Not fetching history
  // 以下の機能は全て無効 / All functions below are disabled
  deleteMessage: undefined
  sendMessage: undefined
  fetchMessageHistory: undefined
  markConvoAccepted: undefined
  addReaction: undefined
  removeReaction: undefined
}
/**
 * 初期化中状態 - 会話データを読み込み中の状態
 * Initializing state - conversation data is being loaded
 */
export type ConvoStateInitializing = {
  status: ConvoStatus.Initializing
  items: [] // メッセージはまだ読み込まれていない / Messages not loaded yet
  convo: ChatBskyConvoDefs.ConvoView | undefined
  error: undefined
  sender: ChatBskyActorDefs.ProfileViewBasic | undefined
  recipients: ChatBskyActorDefs.ProfileViewBasic[] | undefined
  isFetchingHistory: boolean // 履歴取得状態は変動可能 / History fetching status can vary
  // 機能はまだ無効 / Functions still disabled
  deleteMessage: undefined
  sendMessage: undefined
  fetchMessageHistory: undefined
  markConvoAccepted: undefined
  addReaction: undefined
  removeReaction: undefined
}
/**
 * 準備完了状態 - 会話が完全に使用可能な状態
 * Ready state - conversation is fully usable
 */
export type ConvoStateReady = {
  status: ConvoStatus.Ready
  items: ConvoItem[] // メッセージアイテムが利用可能 / Message items available
  convo: ChatBskyConvoDefs.ConvoView // 会話メタデータ確定 / Conversation metadata confirmed
  error: undefined // エラーなし / No error
  sender: ChatBskyActorDefs.ProfileViewBasic // 送信者情報確定 / Sender info confirmed
  recipients: ChatBskyActorDefs.ProfileViewBasic[] // 受信者情報確定 / Recipients info confirmed
  isFetchingHistory: boolean
  // 全ての機能が利用可能 / All functions available
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
  markConvoAccepted: MarkConvoAccepted
  addReaction: AddReaction
  removeReaction: RemoveReaction
}
/**
 * バックグラウンド状態 - 会話が非アクティブだが機能は利用可能な状態
 * Backgrounded state - conversation is inactive but functions remain available
 */
export type ConvoStateBackgrounded = {
  status: ConvoStatus.Backgrounded
  items: ConvoItem[] // メッセージは維持 / Messages maintained
  convo: ChatBskyConvoDefs.ConvoView
  error: undefined
  sender: ChatBskyActorDefs.ProfileViewBasic
  recipients: ChatBskyActorDefs.ProfileViewBasic[]
  isFetchingHistory: boolean
  // 機能は全て利用可能（Ready状態と同じ） / All functions available (same as Ready state)
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
  markConvoAccepted: MarkConvoAccepted
  addReaction: AddReaction
  removeReaction: RemoveReaction
}
/**
 * 一時停止状態 - 会話が一時的に停止された状態
 * Suspended state - conversation is temporarily suspended
 */
export type ConvoStateSuspended = {
  status: ConvoStatus.Suspended
  items: ConvoItem[] // メッセージは維持 / Messages maintained
  convo: ChatBskyConvoDefs.ConvoView
  error: undefined
  sender: ChatBskyActorDefs.ProfileViewBasic
  recipients: ChatBskyActorDefs.ProfileViewBasic[]
  isFetchingHistory: boolean
  // 機能は利用可能だが、リアルタイム更新は停止 / Functions available but real-time updates paused
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
  markConvoAccepted: MarkConvoAccepted
  addReaction: AddReaction
  removeReaction: RemoveReaction
}
/**
 * エラー状態 - 会話にエラーが発生した状態
 * Error state - an error has occurred in the conversation
 */
export type ConvoStateError = {
  status: ConvoStatus.Error
  items: [] // メッセージなし / No messages
  convo: undefined // 会話データなし / No conversation data
  error: ConvoError // エラー情報あり / Error information present
  sender: undefined // 送信者情報なし / No sender info
  recipients: undefined // 受信者情報なし / No recipients info
  isFetchingHistory: false
  // 全機能無効 / All functions disabled
  deleteMessage: undefined
  sendMessage: undefined
  fetchMessageHistory: undefined
  markConvoAccepted: undefined
  addReaction: undefined
  removeReaction: undefined
}
/**
 * 無効化状態 - 会話機能が無効化された状態（ユーザーがチャット無効設定等）
 * Disabled state - conversation functionality is disabled (e.g., user has chat disabled)
 */
export type ConvoStateDisabled = {
  status: ConvoStatus.Disabled
  items: ConvoItem[] // メッセージは表示可能 / Messages can be displayed
  convo: ChatBskyConvoDefs.ConvoView
  error: undefined
  sender: ChatBskyActorDefs.ProfileViewBasic
  recipients: ChatBskyActorDefs.ProfileViewBasic[]
  isFetchingHistory: boolean
  // 機能は利用可能だが、実際の動作は制限される場合がある
  // Functions available but actual operations may be restricted
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
  markConvoAccepted: MarkConvoAccepted
  addReaction: AddReaction
  removeReaction: RemoveReaction
}
/**
 * 会話状態統合型 - 全ての可能な会話状態の統合
 * Conversation state union type - union of all possible conversation states
 */
export type ConvoState =
  | ConvoStateUninitialized
  | ConvoStateInitializing
  | ConvoStateReady
  | ConvoStateBackgrounded
  | ConvoStateSuspended
  | ConvoStateError
  | ConvoStateDisabled

/**
 * 会話イベント型 - 会話から発生するイベントの型
 * Conversation event type - types of events emitted by conversations
 */
export type ConvoEvent = {
  type: 'invalidate-block-state' // ブロック状態無効化イベント / Block state invalidation event
  accountDids: string[] // 関連アカウントのDIDリスト / List of related account DIDs
}
