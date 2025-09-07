// AT ProtocolのセッションイベントとBskyエージェント型をインポート
// Import AT Protocol session events and Bsky agent types
import {type AtpSessionEvent, type BskyAgent} from '@atproto/api'

// 公開エージェント作成関数をインポート / Import public agent creation function
import {createPublicAgent} from './agent'
// ログ記録用リデューサーラッパーをインポート / Import reducer wrapper for logging
import {wrapSessionReducerForLogging} from './logging'
// セッションアカウント型をインポート / Import session account type
import {type SessionAccount} from './types'

// リデューサーがエージェントの内部にアクセスできないようにするハック
// リデューサーの観点からは、完全に不透明なオブジェクトとして扱うべき
// A hack so that the reducer can't read anything from the agent.
// From the reducer's point of view, it should be a completely opaque object.
type OpaqueBskyAgent = {
  readonly service: URL // サービスURL（読み取り専用） / Service URL (read-only)
  readonly api: unknown // APIインターフェース（不明型） / API interface (unknown type)
  readonly app: unknown // アプリインターフェース（不明型） / App interface (unknown type)
  readonly com: unknown // 通信インターフェース（不明型） / Communication interface (unknown type)
}

// エージェント状態型（エージェントと関連付けられたユーザーIDを管理）
// Agent state type (manages agent and associated user ID)
type AgentState = {
  readonly agent: OpaqueBskyAgent // 不透明なBskyエージェント / Opaque Bsky agent
  readonly did: string | undefined // ユーザーのDecentralized Identifier（未ログイン時はundefined） / User's Decentralized Identifier (undefined when not logged in)
}

/**
 * セッションリデューサーの状態型
 * アカウント一覧、現在のエージェント状態、永続化フラグを管理
 * 
 * Session reducer state type
 * Manages account list, current agent state, and persistence flag
 */
export type State = {
  readonly accounts: SessionAccount[] // 保存された全アカウントの一覧 / List of all saved accounts
  readonly currentAgentState: AgentState // 現在アクティブなエージェントの状態 / State of currently active agent
  needsPersist: boolean // 永続化が必要かどうかのフラグ（副作用で変更される） / Flag indicating if persistence is needed (mutated in an effect)
}

/**
 * セッションリデューサーのアクション型
 * すべてのセッション操作を表現するUnion型
 * 
 * Session reducer action type
 * Union type representing all session operations
 */
export type Action =
  | {
      // エージェントイベント受信（トークン更新、期限切れ等）
      // Agent event received (token refresh, expiration, etc.)
      type: 'received-agent-event'
      agent: OpaqueBskyAgent // イベントを発生させたエージェント / Agent that triggered the event
      accountDid: string // 関連するアカウントのID / Associated account ID
      refreshedAccount: SessionAccount | undefined // 更新されたアカウント情報 / Refreshed account info
      sessionEvent: AtpSessionEvent // AT Protocolセッションイベント / AT Protocol session event
    }
  | {
      // アカウント切り替え（ログイン、アカウント作成、セッション復帰）
      // Account switching (login, account creation, session resume)
      type: 'switched-to-account'
      newAgent: OpaqueBskyAgent // 新しいエージェント / New agent
      newAccount: SessionAccount // 切り替え先のアカウント / Account to switch to
    }
  | {
      // アカウント削除（保存リストからの除去）
      // Account removal (remove from saved list)
      type: 'removed-account'
      accountDid: string // 削除するアカウントのID / Account ID to remove
    }
  | {
      // 現在のアカウントのみログアウト
      // Logout current account only
      type: 'logged-out-current-account'
    }
  | {
      // 全アカウントログアウト（ハードログアウト）
      // All accounts logout (hard logout)
      type: 'logged-out-every-account'
    }
  | {
      // 他のタブからのアカウント同期
      // Account synchronization from other tabs
      type: 'synced-accounts'
      syncedAccounts: SessionAccount[] // 同期されたアカウント一覧 / Synchronized account list
      syncedCurrentDid: string | undefined // 同期された現在のアカウントID / Synchronized current account ID
    }
  | {
      // 部分セッション更新（特定のフィールドのみ更新）
      // Partial session refresh (update specific fields only)
      type: 'partial-refresh-session'
      accountDid: string // 更新対象のアカウントID / Account ID to update
      patch: Pick<SessionAccount, 'emailConfirmed' | 'emailAuthFactor'> // 更新するフィールド / Fields to update
    }

/**
 * 公開エージェント状態を作成する関数（未ログイン状態）
 * 認証なしで公開コンテンツにアクセスできるエージェントを作成
 * 
 * Function to create public agent state (unauthenticated state)
 * Creates an agent that can access public content without authentication
 */
function createPublicAgentState(): AgentState {
  return {
    agent: createPublicAgent(), // 公開アクセス用のエージェントを作成 / Create agent for public access
    did: undefined, // 未ログインなのDIDはundefined / DID is undefined when not logged in
  }
}

/**
 * 初期状態を取得する関数
 * 永続化されたアカウント情報からセッションの初期状態を構築
 * 
 * Function to get initial state
 * Builds session initial state from persisted account information
 */
export function getInitialState(persistedAccounts: SessionAccount[]): State {
  return {
    accounts: persistedAccounts, // 永続化されたアカウント一覧 / List of persisted accounts
    currentAgentState: createPublicAgentState(), // 初期は公開エージェント状態 / Initially in public agent state
    needsPersist: false, // 初期化時は永続化不要 / No persistence needed during initialization
  }
}

/**
 * セッション状態管理リデューサー
 * すべてのセッション関連の状態変更を処理
 * 
 * Session state management reducer
 * Handles all session-related state changes
 */
let reducer = (state: State, action: Action): State => {
  switch (action.type) {
    // エージェントイベント受信処理（トークン更新、期限切れ等）
    // Agent event reception handling (token refresh, expiration, etc.)
    case 'received-agent-event': {
      const {agent, accountDid, refreshedAccount, sessionEvent} = action
      
      // セッションがクリアされたが、アクティブアカウントではない場合の処理
      // Handle case where session was cleared but this isn't the active account
      if (
        refreshedAccount === undefined &&
        agent !== state.currentAgentState.agent
      ) {
        // セッションがクリアされた（期限切れやネットワークエラーなど）が、
        // このアカウントがアクティブではない場合、今はクリアしない
        // これにより、問題が一時的なら次の復帰時に動作する
        // If the session got cleared out (e.g. due to expiry or network error) but
        // this account isn't the active one, don't clear it out at this time.
        // This way, if the problem is transient, it'll work on next resume.
        return state
      }
      
      // ネットワークエラーは一時的なものと仮定
      // Assume network errors are transient
      if (sessionEvent === 'network-error') {
        return state
      }
      
      // 既存のアカウントを検索 / Find existing account
      const existingAccount = state.accounts.find(a => a.did === accountDid)
      
      // アカウントが存在しないか、変更がない場合は状態更新なし
      // No state update if account doesn't exist or no changes
      if (
        !existingAccount ||
        JSON.stringify(existingAccount) === JSON.stringify(refreshedAccount)
      ) {
        // 状態更新なしの高速パス / Fast path without a state update
        return state
      }
      
      // アカウント情報を更新して新しい状態を返す
      // Update account information and return new state
      return {
        accounts: state.accounts.map(a => {
          if (a.did === accountDid) {
            if (refreshedAccount) {
              return refreshedAccount // 更新されたアカウント情報を使用 / Use refreshed account info
            } else {
              // 更新されたアカウントを受け取れなかった場合、トークンをクリア
              // If we didn't receive a refreshed account, clear out the tokens
              return {
                ...a,
                accessJwt: undefined, // アクセストークンをクリア / Clear access token
                refreshJwt: undefined, // リフレッシュトークンをクリア / Clear refresh token
              }
            }
          } else {
            return a // 他のアカウントはそのまま / Keep other accounts unchanged
          }
        }),
        currentAgentState: refreshedAccount
          ? state.currentAgentState // アカウントが更新された場合は現在の状態を維持 / Keep current state if account refreshed
          : createPublicAgentState(), // 期限切れの場合はログアウト / Log out if expired
        needsPersist: true, // 永続化が必要 / Persistence needed
      }
    }
    // アカウント切り替え処理（ログイン、アカウント作成、セッション復帰）
    // Account switching handling (login, account creation, session resume)
    case 'switched-to-account': {
      const {newAccount, newAgent} = action
      return {
        // 新しいアカウントを先頭に置き、重複を除去
        // Place new account at the front and remove duplicates
        accounts: [
          newAccount, // 新しいアカウントを最初に配置 / Place new account first
          ...state.accounts.filter(a => a.did !== newAccount.did), // 重複を除いて他のアカウントを続ける / Add other accounts excluding duplicates
        ],
        currentAgentState: {
          did: newAccount.did, // 新しいアカウントのIDを設定 / Set new account ID
          agent: newAgent, // 新しいエージェントを設定 / Set new agent
        },
        needsPersist: true, // 永続化が必要 / Persistence needed
      }
    }
    // アカウント削除処理（保存リストからの除去）
    // Account removal handling (remove from saved list)
    case 'removed-account': {
      const {accountDid} = action
      return {
        // 指定されたアカウントをリストから除去
        // Remove specified account from list
        accounts: state.accounts.filter(a => a.did !== accountDid),
        currentAgentState:
          state.currentAgentState.did === accountDid
            ? createPublicAgentState() // 現在のアカウントを削除する場合はログアウト / Log out if removing the current one
            : state.currentAgentState, // 他のアカウントの場合は現在の状態を維持 / Keep current state if removing other account
        needsPersist: true, // 永続化が必要 / Persistence needed
      }
    }
    // 現在のアカウントのみログアウト処理
    // Current account only logout handling
    case 'logged-out-current-account': {
      const {currentAgentState} = state
      return {
        // 現在のアカウントのトークンのみをクリア（他はそのまま）
        // Clear tokens only for current account (keep others unchanged)
        accounts: state.accounts.map(a =>
          a.did === currentAgentState.did
            ? {
                ...a,
                refreshJwt: undefined, // リフレッシュトークンをクリア / Clear refresh token
                accessJwt: undefined, // アクセストークンをクリア / Clear access token
              }
            : a, // 他のアカウントはそのまま / Keep other accounts unchanged
        ),
        currentAgentState: createPublicAgentState(), // 公開エージェント状態に変更 / Switch to public agent state
        needsPersist: true, // 永続化が必要 / Persistence needed
      }
    }
    // 全アカウントログアウト処理（ハードログアウト）
    // All accounts logout handling (hard logout)
    case 'logged-out-every-account': {
      return {
        // 全てのアカウントのトークンをクリア（ハードログアウト）
        // Clear tokens for *every* account (this is a hard logout)
        accounts: state.accounts.map(a => ({
          ...a,
          refreshJwt: undefined, // 全アカウントのリフレッシュトークンをクリア / Clear refresh tokens for all accounts
          accessJwt: undefined, // 全アカウントのアクセストークンをクリア / Clear access tokens for all accounts
        })),
        currentAgentState: createPublicAgentState(), // 公開エージェント状態に変更 / Switch to public agent state
        needsPersist: true, // 永続化が必要 / Persistence needed
      }
    }
    // 他のタブからのアカウント同期処理
    // Account synchronization from other tabs handling
    case 'synced-accounts': {
      const {syncedAccounts, syncedCurrentDid} = action
      return {
        accounts: syncedAccounts, // 同期されたアカウント一覧で更新 / Update with synchronized account list
        currentAgentState:
          syncedCurrentDid === state.currentAgentState.did
            ? state.currentAgentState // 同じユーザーの場合は現在の状態を維持 / Keep current state if same user
            : createPublicAgentState(), // 異なるユーザーの場合はログアウト / Log out if different user
        needsPersist: false, // 他のタブからの同期なので、サイクルを避けるため永続化しない / Synced from another tab. Don't persist to avoid cycles
      }
    }
    // 部分セッション更新処理（特定のフィールドのみを軽量更新）
    // Partial session refresh handling (lightweight update of specific fields only)
    case 'partial-refresh-session': {
      const {accountDid, patch} = action
      const agent = state.currentAgentState.agent as BskyAgent

      /*
       * 安全な値のみを変更。これには細心の注意が必要。
       * Only mutating values that are safe. Be very careful with this.
       */
      if (agent.session) {
        // エージェントのセッション情報を部分更新
        // Partially update agent session information
        agent.session.emailConfirmed =
          patch.emailConfirmed ?? agent.session.emailConfirmed // メール確認状態を更新 / Update email confirmation status
        agent.session.emailAuthFactor =
          patch.emailAuthFactor ?? agent.session.emailAuthFactor // メール認証因子を更新 / Update email authentication factor
      }

      return {
        ...state,
        currentAgentState: {
          ...state.currentAgentState,
          agent, // 更新されたエージェント / Updated agent
        },
        // アカウント一覧も同様に部分更新
        // Partially update account list as well
        accounts: state.accounts.map(a => {
          if (a.did === accountDid) {
            return {
              ...a,
              emailConfirmed: patch.emailConfirmed ?? a.emailConfirmed, // メール確認状態 / Email confirmation status
              emailAuthFactor: patch.emailAuthFactor ?? a.emailAuthFactor, // メール認証因子 / Email authentication factor
            }
          }
          return a // 他のアカウントはそのまま / Keep other accounts unchanged
        }),
        needsPersist: true, // 永続化が必要 / Persistence needed
      }
    }
  }
}

// ログ記録機能付きリデューサーでラップ（デバッグ用）
// Wrap reducer with logging functionality (for debugging)
reducer = wrapSessionReducerForLogging(reducer)
export {reducer}
