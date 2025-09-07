// Reactライブラリ - コンポーネント作成のため
import React from 'react'

// 現在の会話IDプロバイダー - アクティブな会話のID管理
import {CurrentConvoIdProvider} from '#/state/messages/current-convo-id'
// メッセージイベントバスプロバイダー - リアルタイムメッセージイベント配信
import {MessagesEventBusProvider} from '#/state/messages/events'
// 会話一覧プロバイダー - 会話リストのデータ管理
import {ListConvosProvider} from '#/state/queries/messages/list-conversations'
// メッセージ下書きプロバイダー - 編集中メッセージの一時保存
import {MessageDraftsProvider} from './message-drafts'

/**
 * メッセージ総合プロバイダーコンポーネント - メッセージ機能に必要な全プロバイダーを統合
 * Messages comprehensive provider component - integrates all providers needed for messaging functionality
 * 
 * メッセージ機能に必要な以下のプロバイダーを正しい順序で組み合わせる：
 * Combines the following providers in the correct order for messaging functionality:
 * 1. CurrentConvoIdProvider - アクティブ会話のID管理 / Active conversation ID management
 * 2. MessageDraftsProvider - 下書きメッセージ管理 / Draft message management
 * 3. MessagesEventBusProvider - リアルタイムイベント / Real-time events
 * 4. ListConvosProvider - 会話一覧データ / Conversation list data
 * 
 * @param children - 子コンポーネント / Child components
 */
export function MessagesProvider({children}: {children: React.ReactNode}) {
  return (
    <CurrentConvoIdProvider>
      <MessageDraftsProvider>
        <MessagesEventBusProvider>
          <ListConvosProvider>{children}</ListConvosProvider>
        </MessagesEventBusProvider>
      </MessageDraftsProvider>
    </CurrentConvoIdProvider>
  )
}
