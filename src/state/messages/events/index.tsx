// Reactライブラリ - コンテキスト、コンポーネント、フックのため
import React from 'react'
// React NativeのAppState - アプリのアクティブ/バックグラウンド状態を監視
import {AppState} from 'react-native'

// メッセージイベントバスクラス - リアルタイムメッセージイベント管理
import {MessagesEventBus} from '#/state/messages/events/agent'
// セッション管理フック - AT Protocolエージェントとユーザーセッション情報取得
import {useAgent, useSession} from '#/state/session'

/**
 * メッセージイベントバスコンテキスト - アプリ全体でメッセージイベントバスのインスタンスを共有
 * Message event bus context - shares message event bus instance across the app
 * 
 * ログイン状態によってnullまたはインスタンスを保持
 * Holds null or instance depending on login state
 */
const MessagesEventBusContext = React.createContext<MessagesEventBus | null>(
  null, // デフォルト値: 未ログイン状態 / Default value: not logged in state
)
// デバッグ時の表示名設定
MessagesEventBusContext.displayName = 'MessagesEventBusContext'

/**
 * メッセージイベントバスフック - メッセージイベントバスのインスタンスを取得
 * Message event bus hook - retrieves message event bus instance
 * 
 * @returns メッセージイベントバスのインスタンス / Message event bus instance
 * @throws MessagesEventBusProvider内で使用されない場合エラー / Error if used outside MessagesEventBusProvider
 */
export function useMessagesEventBus() {
  const ctx = React.useContext(MessagesEventBusContext)
  if (!ctx) {
    throw new Error(
      'useMessagesEventBus must be used within a MessagesEventBusProvider',
    )
  }
  return ctx
}

/**
 * メッセージイベントバスプロバイダーコンポーネント - ログイン状態に基づいた条件付きプロバイダー
 * Message event bus provider component - conditional provider based on login state
 * 
 * ログイン済みの場合のみイベントバスを初期化し、未ログインの場合はnullを提供
 * Initializes event bus only when logged in, provides null when not logged in
 * 
 * @param children - 子コンポーネント / Child components
 */
export function MessagesEventBusProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const {currentAccount} = useSession()

  // ログインしていない場合はnullを提供（メッセージ機能は無効）
  if (!currentAccount) {
    return (
      <MessagesEventBusContext.Provider value={null}>
        {children}
      </MessagesEventBusContext.Provider>
    )
  }

  // ログイン済みの場合は実際のイベントバスを提供
  return (
    <MessagesEventBusProviderInner>{children}</MessagesEventBusProviderInner>
  )
}

/**
 * メッセージイベントバスプロバイダー内部コンポーネント - 実際のイベントバスを管理
 * Message event bus provider inner component - manages actual event bus
 * 
 * イベントバスのライフサイクルとアプリ状態に基づく状態管理を担当
 * Handles event bus lifecycle and state management based on app state
 * 
 * @param children - 子コンポーネント / Child components
 */
export function MessagesEventBusProviderInner({
  children,
}: {
  children: React.ReactNode
}) {
  const agent = useAgent()
  
  // メッセージイベントバスのインスタンスを作成（コンポーネントのライフサイクル全体で一度だけ）
  const [bus] = React.useState(
    () =>
      new MessagesEventBus({
        agent,
      }),
  )

  // コンポーネントのライフサイクル管理 - マウント時に開始、アンマウント時に停止
  React.useEffect(() => {
    bus.resume() // イベントバスを開始

    return () => {
      bus.suspend() // イベントバスを停止
    }
  }, [bus])

  // アプリ状態の監視 - アクティブ/バックグラウンド変更時の処理
  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        bus.resume() // アプリアクティブ時: イベントバスを再開
      } else {
        bus.background() // アプリバックグラウンド時: イベントバスをバックグラウンド状態に
      }
    }

    // アプリ状態変更リスナーを登録
    const sub = AppState.addEventListener('change', handleAppStateChange)

    // クリーンアップ関数
    return () => {
      sub.remove()
    }
  }, [bus])

  // イベントバスのインスタンスをコンテキスト経由で提供
  return (
    <MessagesEventBusContext.Provider value={bus}>
      {children}
    </MessagesEventBusContext.Provider>
  )
}
