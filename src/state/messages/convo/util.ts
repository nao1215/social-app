// 会話状態型と列挙型のインポート - 会話状態の判定と操作のため
// Import conversation state types and enums - for conversation state determination and manipulation
import {
  ConvoState,
  ConvoStateBackgrounded,
  ConvoStateDisabled,
  ConvoStateReady,
  ConvoStateSuspended,
  ConvoStatus,
} from './types'

/**
 * アクティブ会話状態型 - 会話が使用可能な状態の統合型
 * Active conversation states type - union type for states where conversation is usable
 * 
 * 会話が使用準備が整った状態 - 準備完了、バックグラウンド、一時停止、または無効状態で再開準備が整っている
 * States where the conversation is ready to be used - either ready, backgrounded/suspended, or disabled but ready for resumption
 */
export type ActiveConvoStates =
  | ConvoStateReady       // 準備完了 - 完全にアクティブな状態
  | ConvoStateBackgrounded // バックグラウンド - 非アクティブだが使用可能
  | ConvoStateSuspended    // 一時停止 - 停止中だが再開可能
  | ConvoStateDisabled     // 無効 - 無効化されているがデータは利用可能

/**
 * 会話がアクティブ状態かどうかを判定する関数
 * Function to determine if a conversation is in an active state
 * 
 * 会話が「アクティブ」状態かどうかをチェックします。
 * アクティブとは、チャットが読み込み済みで使用可能、
 * または一時停止やバックグラウンド状態で再開準備が整った状態です。
 * Checks if a conversation has an "active" status, meaning the chat is loaded and ready to be used,
 * or is in a suspended or background state and ready for resumption.
 * 
 * @param convo - チェックする会話状態 / Conversation state to check
 * @returns アクティブ状態の場合true / True if conversation is in active state
 */
export function isConvoActive(convo: ConvoState): convo is ActiveConvoStates {
  return (
    convo.status === ConvoStatus.Ready ||      // 準備完了状態
    convo.status === ConvoStatus.Backgrounded || // バックグラウンド状態
    convo.status === ConvoStatus.Suspended ||    // 一時停止状態
    convo.status === ConvoStatus.Disabled       // 無効状態
  )
}
