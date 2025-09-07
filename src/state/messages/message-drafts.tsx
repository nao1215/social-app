// Reactフックとコンポーネント - 状態管理、メモ化、Reducer、Ref管理
import React, {useEffect, useMemo, useReducer, useRef} from 'react'

// 現在の会話IDフック - アクティブな会話のID取得
import {useCurrentConvoId} from './current-convo-id'

/**
 * メッセージ下書きコンテキスト - 編集中メッセージの一時保存状態を全体で共有
 * Message drafts context - shares temporary storage state of messages being edited across the app
 * 
 * 各会話ごとに編集中テキストを保持し、ユーザーが他の会話に移動しても内容を維持
 * Maintains editing text for each conversation, preserving content even when user switches to other conversations
 */
const MessageDraftsContext = React.createContext<{
  state: State // 会話IDごとの下書きテキスト状態 / Draft text state per conversation ID
  dispatch: React.Dispatch<Actions> // 状態更新用ディスパッチ関数 / Dispatch function for state updates
} | null>(null)
// デバッグ時の表示名設定
MessageDraftsContext.displayName = 'MessageDraftsContext'

/**
 * メッセージ下書きコンテキストフック - 下書きコンテキストへのアクセス
 * Message drafts context hook - access to drafts context
 * 
 * @returns 下書き状態とディスパッチ関数 / Draft state and dispatch function
 * @throws MessageDraftsProvider内で使用されない場合エラー / Error if used outside MessageDraftsProvider
 */
function useMessageDraftsContext() {
  const ctx = React.useContext(MessageDraftsContext)
  if (!ctx) {
    throw new Error(
      'useMessageDrafts must be used within a MessageDraftsContext',
    )
  }
  return ctx
}

/**
 * メッセージ下書きフック - 現在の会話の下書きメッセージを操作
 * Message draft hook - manipulate draft message for current conversation
 * 
 * 現在アクティブな会話の下書きメッセージの取得とクリア機能を提供
 * Provides functionality to get and clear draft message for currently active conversation
 * 
 * @returns 下書き操作用の関数群 / Functions for draft manipulation
 */
export function useMessageDraft() {
  const {currentConvoId} = useCurrentConvoId()
  const {state, dispatch} = useMessageDraftsContext()
  return useMemo(
    () => ({
      // 現在の会話の下書きを取得（ない場合は空文字列）
      getDraft: () => (currentConvoId && state[currentConvoId]) || '',
      // 現在の会話の下書きをクリア
      clearDraft: () => {
        if (currentConvoId) {
          dispatch({type: 'clear', convoId: currentConvoId})
        }
      },
    }),
    [state, dispatch, currentConvoId],
  )
}

/**
 * メッセージ下書き保存フック - コンポーネントのアンマウント時に下書きを自動保存
 * Message draft save hook - automatically saves draft when component unmounts
 * 
 * ユーザーが他の会話に移動したり、アプリを閉じた時に編集中のテキストを保存
 * Saves text being edited when user switches to other conversation or closes app
 * 
 * @param message - 保存するメッセージテキスト / Message text to save
 */
export function useSaveMessageDraft(message: string) {
  const {currentConvoId} = useCurrentConvoId()
  const {dispatch} = useMessageDraftsContext()
  // 最新のメッセージ内容をRefで管理（クロージャの古い値参照を回避）
  const messageRef = useRef(message)
  messageRef.current = message

  // コンポーネントのクリーンアップ時に下書きを保存
  useEffect(() => {
    return () => {
      if (currentConvoId) {
        dispatch({
          type: 'set',
          convoId: currentConvoId,
          draft: messageRef.current,
        })
      }
    }
  }, [currentConvoId, dispatch])
}

/**
 * 下書き状態型 - 会話IDをキーとして下書きテキストを管理
 * Draft state type - manages draft text with conversation ID as key
 */
type State = {[convoId: string]: string}

/**
 * 下書きアクション型 - 下書きの設定とクリアアクション
 * Draft action type - actions for setting and clearing drafts
 */
type Actions =
  | {type: 'set'; convoId: string; draft: string}   // 下書き設定アクション / Set draft action
  | {type: 'clear'; convoId: string}              // 下書きクリアアクション / Clear draft action

/**
 * 下書き状態Reducer - 下書き状態の更新ロジック
 * Draft state reducer - logic for updating draft state
 * 
 * @param state - 現在の状態 / Current state
 * @param action - 実行するアクション / Action to perform
 * @returns 新しい状態 / New state
 */
function reducer(state: State, action: Actions): State {
  switch (action.type) {
    case 'set':
      // 指定された会話の下書きを設定
      return {...state, [action.convoId]: action.draft}
    case 'clear':
      // 指定された会話の下書きをクリア
      return {...state, [action.convoId]: ''}
    default:
      return state
  }
}

/**
 * メッセージ下書きプロバイダーコンポーネント - 下書き状態を管理し子コンポーネントに提供
 * Message drafts provider component - manages draft state and provides it to child components
 * 
 * 全ての会話の下書きメッセージをメモリに保持し、ユーザーが会話間を移動しても内容を維持
 * Keeps draft messages for all conversations in memory, preserving content when user navigates between conversations
 * 
 * @param children - 子コンポーネント / Child components
 */
export function MessageDraftsProvider({children}: {children: React.ReactNode}) {
  // Reducerで下書き状態を管理（初期値は空オブジェクト）
  const [state, dispatch] = useReducer(reducer, {})

  // コンテキスト値をメモ化 - stateが変更された時のみ再計算
  const ctx = useMemo(() => {
    return {state, dispatch}
  }, [state])

  // 下書きコンテキストを子コンポーネントに提供
  return (
    <MessageDraftsContext.Provider value={ctx}>
      {children}
    </MessageDraftsContext.Provider>
  )
}
