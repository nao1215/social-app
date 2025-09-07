// Reactフックと状態管理 - コンポーネントの状態管理と外部ストアの購読
import React, {useContext, useState, useSyncExternalStore} from 'react'
// AT Protocol会話定義 - 会話メタデータの型定義
import {type ChatBskyConvoDefs} from '@atproto/api'
// React Navigationのフォーカスイベント - 画面のアクティブ/非アクティブ状態を管理
import {useFocusEffect} from '@react-navigation/native'
// React Queryクライアント - キャッシュ無効化とデータ管理
import {useQueryClient} from '@tanstack/react-query'

// アプリ状態フック - アプリがアクティブ/バックグラウンド状態の管理
import {useAppState} from '#/lib/hooks/useAppState'
// 会話エージェントクラス - 単一会話の状態管理とメッセージ操作
import {Convo} from '#/state/messages/convo/agent'
// 会話状態とパラメータの型定義 - 様々な会話状態を表現する型
import {
  type ConvoParams,
  type ConvoState,
  type ConvoStateBackgrounded,
  type ConvoStateDisabled,
  type ConvoStateReady,
  type ConvoStateSuspended,
} from '#/state/messages/convo/types'
// 会話状態ユーティリティ - 状態判定ヘルパー関数
import {isConvoActive} from '#/state/messages/convo/util'
// メッセージイベントバス - リアルタイムイベント配信システム
import {useMessagesEventBus} from '#/state/messages/events'
// 会話関連クエリ - 会話データ取得と既読管理
import {
  RQKEY as getConvoKey,
  useMarkAsReadMutation,
} from '#/state/queries/messages/conversation'
// 会話一覧クエリキー - キャッシュ無効化用
import {RQKEY_ROOT as ListConvosQueryKeyRoot} from '#/state/queries/messages/list-conversations'
// プロフィールクエリキー - ブロック状態変更時のキャッシュ無効化用
import {RQKEY as createProfileQueryKey} from '#/state/queries/profile'
// AT Protocolエージェント - APIクライアントへのアクセス
import {useAgent} from '#/state/session'

// 会話ユーティリティ関数を再エクスポート - 状態判定等のヘルパー関数
export * from '#/state/messages/convo/util'

// 会話状態のReactコンテキスト - 会話コンポーネント間で状態を共有
const ChatContext = React.createContext<ConvoState | null>(null)
// デバッグ時の表示名設定
ChatContext.displayName = 'ChatContext'

/**
 * 会話状態フック - 会話コンテキストから現在の会話状態を取得
 * Conversation state hook - retrieves current conversation state from context
 * 
 * @returns 現在の会話状態 / Current conversation state
 * @throws ConvoProvider内で使用されない場合エラー / Error if used outside ConvoProvider
 */
export function useConvo() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useConvo must be used within a ConvoProvider')
  }
  return ctx
}

/**
 * アクティブな会話状態フック - 会話が使用可能状態の時のみ使用
 * Active conversation state hook - only use when conversation is in usable state
 * 
 * このフックは会話が「アクティブ」状態の時のみ使用すべきです。
 * つまり、チャットが読み込まれ使用準備が整った状態、
 * または一時停止やバックグラウンド状態で再開準備が整った状態。
 * This hook should only be used when the conversation is "active", meaning 
 * the chat is loaded and ready to use, or in a suspended/background state ready for resumption.
 * 
 * @returns アクティブな会話状態 / Active conversation state
 * @throws 非アクティブ状態で使用された場合エラー / Error if used in inactive state
 */
export function useConvoActive() {
  const ctx = useContext(ChatContext) as
    | ConvoStateReady
    | ConvoStateBackgrounded
    | ConvoStateSuspended
    | ConvoStateDisabled
  if (!ctx) {
    throw new Error('useConvo must be used within a ConvoProvider')
  }
  // 会話がアクティブ状態かチェック
  if (!isConvoActive(ctx)) {
    throw new Error(
      `useConvoActive must only be rendered when the Convo is ready.`,
    )
  }
  return ctx
}

/**
 * 会話プロバイダーコンポーネント - 会話状態を管理し子コンポーネントに提供
 * Conversation provider component - manages conversation state and provides it to child components
 * 
 * @param convoId - 管理する会話のID / ID of the conversation to manage
 * @param children - 子コンポーネント / Child components
 */
export function ConvoProvider({
  children,
  convoId,
}: Pick<ConvoParams, 'convoId'> & {children: React.ReactNode}) {
  // React QueryクライアントとAT Protocolエージェント、イベントバスを取得
  const queryClient = useQueryClient()
  const agent = useAgent() 
  const events = useMessagesEventBus()
  
  // 会話エージェントを作成（コンポーネントのライフサイクル全体で一度だけ）
  const [convo] = useState(() => {
    // キャッシュからプレースホルダーデータを取得（早期描画用）
    const placeholder = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(
      getConvoKey(convoId),
    )
    // 会話エージェントのインスタンスを作成
    return new Convo({
      convoId,
      agent,
      events,
      placeholderData: placeholder ? {convo: placeholder} : undefined,
    })
  })
  // 外部ストアとの同期 - 会話状態の変更を追跡
  const service = useSyncExternalStore(convo.subscribe, convo.getSnapshot)
  // 既読マーク機能 - メッセージを既読にするためのミューテーション
  const {mutate: markAsRead} = useMarkAsReadMutation()

  // アプリ状態の監視 - アクティブ/バックグラウンド状態を管理
  const appState = useAppState()
  const isActive = appState === 'active'
  
  // 画面フォーカスイベントの処理 - 会話画面のアクティブ/非アクティブ状態管理
  useFocusEffect(
    React.useCallback(() => {
      if (isActive) {
        // アクティブ時: 会話を再開し、既読マーク
        convo.resume()
        markAsRead({convoId})

        // 非アクティブ時: 会話をバックグラウンド状態にし、既読マーク
        return () => {
          convo.background()
          markAsRead({convoId})
        }
      }
    }, [isActive, convo, convoId, markAsRead]),
  )

  // 会話イベントリスナー - 会話エージェントからのイベントを処理
  React.useEffect(() => {
    return convo.on(event => {
      switch (event.type) {
        // ブロック状態無効化イベント - ユーザーがブロックされた際のキャッシュクリア
        case 'invalidate-block-state': {
          // 関連するアカウントのプロフィールキャッシュを無効化
          for (const did of event.accountDids) {
            queryClient.invalidateQueries({
              queryKey: createProfileQueryKey(did),
            })
          }
          // 会話一覧のキャッシュも無効化（ブロック状態の変更を反映）
          queryClient.invalidateQueries({
            queryKey: [ListConvosQueryKeyRoot],
          })
        }
      }
    })
  }, [convo, queryClient])

  // 会話コンテキストを子コンポーネントに提供
  return <ChatContext.Provider value={service}>{children}</ChatContext.Provider>
}
