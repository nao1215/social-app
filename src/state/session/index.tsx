// Reactフレームワークのインポート / React framework import
import React from 'react'
// AT Protocolのセッションイベントと Bsky エージェント型をインポート
// Import AT Protocol session events and Bsky agent types
import {type AtpSessionEvent, type BskyAgent} from '@atproto/api'

// ウェブプラットフォーム検出ユーティリティ / Web platform detection utility
import {isWeb} from '#/platform/detection'
// 永続化データ管理モジュール / Persistent data management module
import * as persisted from '#/state/persisted'
// アクティブ要素のクローズ処理フック / Hook for closing active elements
import {useCloseAllActiveElements} from '#/state/util'
// グローバルダイアログ制御コンテキスト / Global dialog control context
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
// セッション切断イベントの発行関数 / Function to emit session dropped event
import {emitSessionDropped} from '../events'
// エージェント関連のユーティリティ関数群
// Agent-related utility functions
import {
  agentToSessionAccount, // エージェントからセッションアカウントへの変換 / Convert agent to session account
  type BskyAppAgent, // Bskyアプリエージェント型 / Bsky app agent type
  createAgentAndCreateAccount, // エージェント作成とアカウント作成 / Create agent and create account
  createAgentAndLogin, // エージェント作成とログイン / Create agent and login
  createAgentAndResume, // エージェント作成とセッション復帰 / Create agent and resume session
  sessionAccountToSession, // セッションアカウントからセッションへの変換 / Convert session account to session
} from './agent'
// 状態管理のリデューサー関数 / State management reducer functions
import {getInitialState, reducer} from './reducer'

// サインアップキュー関連のユーティリティをエクスポート / Export signup queue utility
export {isSignupQueued} from './util'
// セッションデバッグログ機能 / Session debug logging functionality
import {addSessionDebugLog} from './logging'
// セッションアカウント型をエクスポート / Export session account type
export type {SessionAccount} from '#/state/session/types'
// アプリケーションロガー / Application logger
import {logger} from '#/logger'
// セッション関連の型定義 / Session-related type definitions
import {
  type SessionApiContext, // セッションAPI コンテキスト型 / Session API context type
  type SessionStateContext, // セッション状態コンテキスト型 / Session state context type
} from '#/state/session/types'

// セッション状態を管理するReactコンテキスト（アカウント一覧、現在のアカウント等）
// React context for managing session state (account list, current account, etc.)
const StateContext = React.createContext<SessionStateContext>({
  accounts: [], // アカウント一覧の初期値 / Initial value for accounts list
  currentAccount: undefined, // 現在のアカウントの初期値 / Initial value for current account
  hasSession: false, // セッション存在フラグの初期値 / Initial value for session existence flag
})
StateContext.displayName = 'SessionStateContext'

// Bskyエージェントを管理するReactコンテキスト（API通信用のエージェント）
// React context for managing Bsky agent (agent for API communication)
const AgentContext = React.createContext<BskyAgent | null>(null)
AgentContext.displayName = 'SessionAgentContext'

// セッション操作API群を管理するReactコンテキスト（ログイン・ログアウト等）
// React context for managing session operation APIs (login, logout, etc.)
const ApiContext = React.createContext<SessionApiContext>({
  createAccount: async () => {}, // アカウント作成の空実装 / Empty implementation for account creation
  login: async () => {}, // ログインの空実装 / Empty implementation for login
  logoutCurrentAccount: async () => {}, // 現在アカウントのログアウトの空実装 / Empty implementation for current account logout
  logoutEveryAccount: async () => {}, // 全アカウントログアウトの空実装 / Empty implementation for all accounts logout
  resumeSession: async () => {}, // セッション復帰の空実装 / Empty implementation for session resume
  removeAccount: () => {}, // アカウント削除の空実装 / Empty implementation for account removal
  partialRefreshSession: async () => {}, // 部分セッション更新の空実装 / Empty implementation for partial session refresh
})
ApiContext.displayName = 'SessionApiContext'

/**
 * セッション管理プロバイダーコンポーネント
 * アプリ全体のセッション状態とAPI関数を提供する
 * 
 * Session management provider component
 * Provides session state and API functions for the entire app
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  // 同時実行されるタスクを一つに制限するフック（競合状態を防ぐ）
  // Hook to limit concurrent tasks to one (prevents race conditions)
  const cancelPendingTask = useOneTaskAtATime()
  // セッション状態のリデューサー（永続化されたアカウント情報から初期状態を構築）
  // Session state reducer (builds initial state from persisted account info)
  const [state, dispatch] = React.useReducer(reducer, null, () => {
    const initialState = getInitialState(persisted.get('session').accounts)
    addSessionDebugLog({type: 'reducer:init', state: initialState})
    return initialState
  })

  // エージェントのセッション変更イベントハンドラー（トークン更新、期限切れ等に対応）
  // Agent session change event handler (handles token refresh, expiration, etc.)
  const onAgentSessionChange = React.useCallback(
    (agent: BskyAgent, accountDid: string, sessionEvent: AtpSessionEvent) => {
      // エージェントから最新のアカウント情報を取得（ミューテーブルなので即座にスナップショット）
      // Get latest account info from agent (mutable, so snapshot it right away)
      const refreshedAccount = agentToSessionAccount(agent)
      // セッション期限切れまたは作成失敗時にはセッション切断イベントを発行
      // Emit session dropped event when session expires or creation fails
      if (sessionEvent === 'expired' || sessionEvent === 'create-failed') {
        emitSessionDropped()
      }
      // 状態更新をディスパッチ
      // Dispatch state update
      dispatch({
        type: 'received-agent-event',
        agent,
        refreshedAccount,
        accountDid,
        sessionEvent,
      })
    },
    [],
  )

  // アカウント作成関数（新規ユーザー登録処理）
  // Account creation function (new user registration process)
  const createAccount = React.useCallback<SessionApiContext['createAccount']>(
    async (params, metrics) => {
      addSessionDebugLog({type: 'method:start', method: 'createAccount'})
      // 他のタスクをキャンセルして同時実行を防ぐ
      // Cancel other tasks to prevent concurrent execution
      const signal = cancelPendingTask()
      // アカウント作成開始のメトリクスを記録
      // Record account creation start metrics
      logger.metric('account:create:begin', {}, {statsig: true})
      // エージェント作成とアカウント作成を同時実行
      // Create agent and account simultaneously
      const {agent, account} = await createAgentAndCreateAccount(
        params,
        onAgentSessionChange,
      )

      // キャンセルされた場合は早期リターン
      // Early return if cancelled
      if (signal.aborted) {
        return
      }
      // 作成したアカウントに切り替え
      // Switch to the created account
      dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      // アカウント作成成功のメトリクスを記録
      // Record account creation success metrics
      logger.metric('account:create:success', metrics, {statsig: true})
      addSessionDebugLog({type: 'method:end', method: 'createAccount', account})
    },
    [onAgentSessionChange, cancelPendingTask],
  )

  // ログイン関数（既存ユーザーの認証処理）
  // Login function (authentication process for existing users)
  const login = React.useCallback<SessionApiContext['login']>(
    async (params, logContext) => {
      addSessionDebugLog({type: 'method:start', method: 'login'})
      // 他のタスクをキャンセルして同時実行を防ぐ
      // Cancel other tasks to prevent concurrent execution
      const signal = cancelPendingTask()
      // エージェント作成とログインを同時実行
      // Create agent and perform login simultaneously
      const {agent, account} = await createAgentAndLogin(
        params,
        onAgentSessionChange,
      )

      // キャンセルされた場合は早期リターン
      // Early return if cancelled
      if (signal.aborted) {
        return
      }
      // ログインしたアカウントに切り替え
      // Switch to the logged in account
      dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      // ログイン成功のメトリクスを記録（パスワード認証あり）
      // Record login success metrics (with password authentication)
      logger.metric(
        'account:loggedIn',
        {logContext, withPassword: true},
        {statsig: true},
      )
      addSessionDebugLog({type: 'method:end', method: 'login', account})
    },
    [onAgentSessionChange, cancelPendingTask],
  )

  // 現在のアカウントのログアウト関数（単一アカウントのみセッション終了）
  // Current account logout function (terminates session for single account only)
  const logoutCurrentAccount = React.useCallback<
    SessionApiContext['logoutCurrentAccount']
  >(
    logContext => {
      addSessionDebugLog({type: 'method:start', method: 'logout'})
      // 進行中のタスクをキャンセル
      // Cancel any pending tasks
      cancelPendingTask()
      // 現在のアカウントのみログアウト
      // Logout only the current account
      dispatch({
        type: 'logged-out-current-account',
      })
      // ログアウトのメトリクスを記録（スコープ：現在のアカウントのみ）
      // Record logout metrics (scope: current account only)
      logger.metric(
        'account:loggedOut',
        {logContext, scope: 'current'},
        {statsig: true},
      )
      addSessionDebugLog({type: 'method:end', method: 'logout'})
    },
    [cancelPendingTask],
  )

  // 全アカウントのログアウト関数（保存された全アカウントのセッションを終了）
  // All accounts logout function (terminates sessions for all saved accounts)
  const logoutEveryAccount = React.useCallback<
    SessionApiContext['logoutEveryAccount']
  >(
    logContext => {
      addSessionDebugLog({type: 'method:start', method: 'logout'})
      // 進行中のタスクをキャンセル
      // Cancel any pending tasks
      cancelPendingTask()
      // 全てのアカウントをログアウト
      // Logout all accounts
      dispatch({
        type: 'logged-out-every-account',
      })
      // ログアウトのメトリクスを記録（スコープ：全アカウント）
      // Record logout metrics (scope: all accounts)
      logger.metric(
        'account:loggedOut',
        {logContext, scope: 'every'},
        {statsig: true},
      )
      addSessionDebugLog({type: 'method:end', method: 'logout'})
    },
    [cancelPendingTask],
  )

  // セッション復帰関数（保存されたアカウントでセッションを再開）
  // Session resume function (reopen session with saved account)
  const resumeSession = React.useCallback<SessionApiContext['resumeSession']>(
    async storedAccount => {
      addSessionDebugLog({
        type: 'method:start',
        method: 'resumeSession',
        account: storedAccount,
      })
      // 他のタスクをキャンセルして同時実行を防ぐ
      // Cancel other tasks to prevent concurrent execution
      const signal = cancelPendingTask()
      // 保存されたアカウント情報でエージェントを作成しセッションを復帰
      // Create agent with saved account info and resume session
      const {agent, account} = await createAgentAndResume(
        storedAccount,
        onAgentSessionChange,
      )

      // キャンセルされた場合は早期リターン
      // Early return if cancelled
      if (signal.aborted) {
        return
      }
      // 復帰したアカウントに切り替え
      // Switch to the resumed account
      dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      addSessionDebugLog({type: 'method:end', method: 'resumeSession', account})
    },
    [onAgentSessionChange, cancelPendingTask],
  )

  // 部分セッション更新関数（特定のフィールドのみを軽量更新）
  // Partial session refresh function (lightweight update of specific fields only)
  const partialRefreshSession = React.useCallback<
    SessionApiContext['partialRefreshSession']
  >(async () => {
    const agent = state.currentAgentState.agent as BskyAppAgent
    // 他のタスクをキャンセル
    // Cancel other tasks
    const signal = cancelPendingTask()
    // サーバーから最新のセッション情報を取得
    // Get latest session info from server
    const {data} = await agent.com.atproto.server.getSession()
    // キャンセルされた場合は早期リターン
    // Early return if cancelled
    if (signal.aborted) return
    // 特定のフィールド（メール確認状態、メール認証因子）のみを更新
    // Update only specific fields (email confirmation status, email auth factor)
    dispatch({
      type: 'partial-refresh-session',
      accountDid: agent.session!.did,
      patch: {
        emailConfirmed: data.emailConfirmed, // メール確認状態 / Email confirmation status
        emailAuthFactor: data.emailAuthFactor, // メール認証因子 / Email authentication factor
      },
    })
  }, [state, cancelPendingTask])

  // アカウント削除関数（保存アカウントリストから指定アカウントを除去）
  // Account removal function (remove specified account from saved account list)
  const removeAccount = React.useCallback<SessionApiContext['removeAccount']>(
    account => {
      addSessionDebugLog({
        type: 'method:start',
        method: 'removeAccount',
        account,
      })
      // 進行中のタスクをキャンセル
      // Cancel any pending tasks
      cancelPendingTask()
      // 指定されたアカウントを状態から削除
      // Remove the specified account from state
      dispatch({
        type: 'removed-account',
        accountDid: account.did,
      })
      addSessionDebugLog({type: 'method:end', method: 'removeAccount', account})
    },
    [cancelPendingTask],
  )

  // セッション状態の永続化処理（状態が変更されたときにストレージに保存）
  // Session state persistence (save to storage when state changes)
  React.useEffect(() => {
    // 永続化が必要な場合のみ実行 / Execute only when persistence is needed
    if (state.needsPersist) {
      state.needsPersist = false
      // 永続化用データを構築（アカウント一覧と現在のアカウント）
      // Build data for persistence (account list and current account)
      const persistedData = {
        accounts: state.accounts,
        currentAccount: state.accounts.find(
          a => a.did === state.currentAgentState.did,
        ),
      }
      addSessionDebugLog({type: 'persisted:broadcast', data: persistedData})
      // セッションデータをストレージに書き込み / Write session data to storage
      persisted.write('session', persistedData)
    }
  }, [state])

  // 永続化データの変更監視（他のタブやウィンドウからの同期更新を受信）
  // Monitor persistent data changes (receive sync updates from other tabs/windows)
  React.useEffect(() => {
    return persisted.onUpdate('session', nextSession => {
      const synced = nextSession
      addSessionDebugLog({type: 'persisted:receive', data: synced})
      // 同期されたアカウント情報で状態を更新
      // Update state with synchronized account information
      dispatch({
        type: 'synced-accounts',
        syncedAccounts: synced.accounts,
        syncedCurrentDid: synced.currentAccount?.did,
      })
      // 同期された現在のアカウントを検索
      // Find the synchronized current account
      const syncedAccount = synced.accounts.find(
        a => a.did === synced.currentAccount?.did,
      )
      // リフレッシュトークンがある場合の処理 / Handle cases with refresh token
      if (syncedAccount && syncedAccount.refreshJwt) {
        // 異なるアカウントの場合はセッションを復帰 / Resume session if different account
        if (syncedAccount.did !== state.currentAgentState.did) {
          resumeSession(syncedAccount)
        } else {
          // 同じアカウントの場合はエージェントのセッションを直接更新
          // If same account, directly update agent session
          const agent = state.currentAgentState.agent as BskyAgent
          const prevSession = agent.session
          agent.sessionManager.session = sessionAccountToSession(syncedAccount)
          addSessionDebugLog({
            type: 'agent:patch',
            agent,
            prevSession,
            nextSession: agent.session,
          })
        }
      }
    })
  }, [state, resumeSession])

  // コンテキスト用のセッション状態をメモ化（パフォーマンス最適化）
  // Memoize session state for context (performance optimization)
  const stateContext = React.useMemo(
    () => ({
      accounts: state.accounts, // 全アカウント一覧 / All accounts list
      currentAccount: state.accounts.find(
        a => a.did === state.currentAgentState.did,
      ), // 現在のアクティブアカウント / Currently active account
      hasSession: !!state.currentAgentState.did, // セッション有無フラグ / Session existence flag
    }),
    [state],
  )

  // API関数群をメモ化（不必要な再レンダリングを防ぐ）
  // Memoize API functions (prevent unnecessary re-rendering)
  const api = React.useMemo(
    () => ({
      createAccount, // アカウント作成関数 / Account creation function
      login, // ログイン関数 / Login function
      logoutCurrentAccount, // 現在アカウントログアウト関数 / Current account logout function
      logoutEveryAccount, // 全アカウントログアウト関数 / All accounts logout function
      resumeSession, // セッション復帰関数 / Session resume function
      removeAccount, // アカウント削除関数 / Account removal function
      partialRefreshSession, // 部分セッション更新関数 / Partial session refresh function
    }),
    [
      createAccount,
      login,
      logoutCurrentAccount,
      logoutEveryAccount,
      resumeSession,
      removeAccount,
      partialRefreshSession,
    ],
  )

  // 開発環境でのデバッグ用（ウェブコンソールからエージェントにアクセス可能）
  // For development debugging (allows access to agent from web console)
  // @ts-expect-error window type is not declared, debug only
  if (__DEV__ && isWeb) window.agent = state.currentAgentState.agent

  // 現在のエージェントと旧エージェントの管理（メモリリーク防止）
  // Management of current and old agents (prevent memory leaks)
  const agent = state.currentAgentState.agent as BskyAppAgent
  const currentAgentRef = React.useRef(agent)
  React.useEffect(() => {
    // エージェントが変更された場合の処理 / Handle agent changes
    if (currentAgentRef.current !== agent) {
      // 前の値を読み取り、すぐにポインタを更新
      // Read the previous value and immediately advance the pointer
      const prevAgent = currentAgentRef.current
      currentAgentRef.current = agent
      addSessionDebugLog({type: 'agent:switch', prevAgent, nextAgent: agent})
      // エージェントは再利用しないので、前のエージェントを完全に無効化
      // We never reuse agents so let's fully neutralize the previous one
      // これにより、リフレッシュトークンの使用を試みないようにする
      // This ensures it won't try to consume any refresh tokens
      prevAgent.dispose()
    }
  }, [agent])

  return (
    <AgentContext.Provider value={agent}>
      <StateContext.Provider value={stateContext}>
        <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
      </StateContext.Provider>
    </AgentContext.Provider>
  )
}

/**
 * 同時実行制御フック（一度に一つのタスクのみ実行を許可）
 * セッション関連の操作で競合状態や予期しない動作を防ぐ
 * 
 * Concurrent execution control hook (allows only one task at a time)
 * Prevents race conditions and unexpected behavior in session-related operations
 */
function useOneTaskAtATime() {
  // AbortControllerで進行中のタスクを管理 / Manage ongoing tasks with AbortController
  const abortController = React.useRef<AbortController | null>(null)
  // 進行中のタスクをキャンセルして新しいタスクを開始する関数
  // Function to cancel ongoing task and start a new one
  const cancelPendingTask = React.useCallback(() => {
    // 既存のタスクがある場合はキャンセル / Cancel existing task if any
    if (abortController.current) {
      abortController.current.abort()
    }
    // 新しいAbortControllerを作成してシグナルを返す / Create new AbortController and return signal
    abortController.current = new AbortController()
    return abortController.current.signal
  }, [])
  return cancelPendingTask
}

/**
 * セッション状態を取得するフック（アカウント一覧、現在のアカウント、セッション有無）
 * Session state retrieval hook (account list, current account, session existence)
 */
export function useSession() {
  return React.useContext(StateContext)
}

/**
 * セッションAPI関数群を取得するフック（ログイン・ログアウト等の操作）
 * Session API functions retrieval hook (login, logout, and other operations)
 */
export function useSessionApi() {
  return React.useContext(ApiContext)
}

/**
 * 認証が必要な操作を実行するためのフック
 * セッションがある場合は関数を実行、ない場合はログインダイアログを表示
 * 
 * Hook for performing operations that require authentication
 * Executes function if session exists, otherwise shows login dialog
 */
export function useRequireAuth() {
  const {hasSession} = useSession()
  // アクティブな要素を全てクローズするフック / Hook to close all active elements
  const closeAll = useCloseAllActiveElements()
  // グローバルダイアログ制御（サインインダイアログ） / Global dialog control (sign-in dialog)
  const {signinDialogControl} = useGlobalDialogsControlContext()

  return React.useCallback(
    (fn: () => void) => {
      // セッションがある場合は関数を実行 / Execute function if session exists
      if (hasSession) {
        fn()
      } else {
        // セッションがない場合はアクティブ要素をクローズしてログインダイアログを表示
        // If no session, close active elements and show login dialog
        closeAll()
        signinDialogControl.open()
      }
    },
    [hasSession, signinDialogControl, closeAll],
  )
}

/**
 * Bskyエージェントを取得するフック（API通信用エージェント）
 * セッションプロバイダーの下で使用する必要がある
 * 
 * Hook to retrieve Bsky agent (agent for API communication)
 * Must be used under the session provider
 */
export function useAgent(): BskyAgent {
  const agent = React.useContext(AgentContext)
  if (!agent) {
    throw Error('useAgent() must be below <SessionProvider>.')
  }
  return agent
}
