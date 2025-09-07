// セッション関連のログイベント型をインポート（統計とアナリティクス用）
// Import log event types for session-related statistics and analytics
import {type LogEvents} from '#/lib/statsig/statsig'
// 永続化されたアカウント情報の型をインポート
// Import the type for persisted account information
import {type PersistedAccount} from '#/state/persisted'

// セッションアカウント型（永続化されたアカウント情報と同じ構造）
// Session account type (same structure as persisted account information)
export type SessionAccount = PersistedAccount

/**
 * セッション状態のコンテキスト型
 * セッション管理で使用する状態データを定義
 * 
 * Session state context type
 * Defines state data used in session management
 */
export type SessionStateContext = {
  // 全アカウントのリスト（複数アカウント対応）
  // List of all accounts (supports multiple accounts)
  accounts: SessionAccount[]
  // 現在アクティブなアカウント（未ログインの場合はundefined）
  // Currently active account (undefined when not logged in)
  currentAccount: SessionAccount | undefined
  // セッションが存在するかどうかのフラグ
  // Flag indicating whether a session exists
  hasSession: boolean
}

/**
 * セッションAPIのコンテキスト型
 * セッション操作に必要な関数群を定義
 * 
 * Session API context type
 * Defines the set of functions needed for session operations
 */
export type SessionApiContext = {
  // アカウント作成関数
  // Account creation function
  createAccount: (
    props: {
      service: string // サービスURL / Service URL
      email: string // メールアドレス / Email address
      password: string // パスワード / Password
      handle: string // ユーザーハンドル / User handle
      birthDate: Date // 生年月日 / Birth date
      inviteCode?: string // 招待コード（オプション）/ Invite code (optional)
      verificationPhone?: string // 認証用電話番号（オプション）/ Phone number for verification (optional)
      verificationCode?: string // 認証コード（オプション）/ Verification code (optional)
    },
    metrics: LogEvents['account:create:success'],
  ) => Promise<void>
  // ログイン関数
  // Login function
  login: (
    props: {
      service: string // サービスURL / Service URL
      identifier: string // ユーザー識別子（メールまたはハンドル）/ User identifier (email or handle)
      password: string // パスワード / Password
      authFactorToken?: string | undefined // 二要素認証トークン（オプション）/ Two-factor auth token (optional)
    },
    logContext: LogEvents['account:loggedIn']['logContext'],
  ) => Promise<void>
  // 現在のアカウントのログアウト関数
  // Current account logout function
  logoutCurrentAccount: (
    logContext: LogEvents['account:loggedOut']['logContext'],
  ) => void
  // 全アカウントのログアウト関数（全セッション終了）
  // All accounts logout function (terminates all sessions)
  logoutEveryAccount: (
    logContext: LogEvents['account:loggedOut']['logContext'],
  ) => void
  // セッション復帰関数（保存されたアカウントでセッションを再開）
  // Session resume function (restart session with saved account)
  resumeSession: (account: SessionAccount) => Promise<void>
  // アカウント削除関数（アカウントをリストから削除）
  // Account removal function (remove account from list)
  removeAccount: (account: SessionAccount) => void
  /**
   * 部分的なセッション更新関数
   * `getSession`を呼び出し、現在のアカウントと`BskyAgent`の特定フィールドを更新する
   * `resumeSession`の軽量版で、`persistSessionHandler`による副作用なしでアップデートを適用
   * 
   * Partial session refresh function
   * Calls `getSession` and updates select fields on the current account and
   * `BskyAgent`. This is an alternative to `resumeSession`, which updates
   * current account/agent using the `persistSessionHandler`, but is more load
   * bearing. This patches in updates without causing any side effects via
   * `persistSessionHandler`.
   */
  partialRefreshSession: () => Promise<void>
}
