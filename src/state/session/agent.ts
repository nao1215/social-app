// AT Protocolのコアエージェントと関連型をインポート
// Import AT Protocol core agent and related types
import {
  Agent as BaseAgent, // ベースエージェントクラス / Base agent class
  type AtprotoServiceType, // AT Protocolサービス型 / AT Protocol service type
  type AtpSessionData, // AT Protocolセッションデータ型 / AT Protocol session data type
  type AtpSessionEvent, // AT Protocolセッションイベント型 / AT Protocol session event type
  BskyAgent, // Blueskyエージェントクラス / Bluesky agent class
  type Did, // 分散識別子型 / Decentralized Identifier type
} from '@atproto/api'
// HTTP通信関連の型をインポート / Import HTTP communication related types
import {type FetchHandler} from '@atproto/api/dist/agent'
import {type SessionManager} from '@atproto/api/dist/session-manager'
// 一意識別子ユーティリティ / Unique identifier utility
import {TID} from '@atproto/common-web'
// XRPC通信オプション型 / XRPC communication options type
import {type FetchHandlerOptions} from '@atproto/xrpc'

// 非同期処理のリトライユーティリティ / Asynchronous retry utility
import {networkRetry} from '#/lib/async/retry'
// アプリケーション定数をインポート / Import application constants
import {
  BLUESKY_PROXY_HEADER, // Blueskyプロキシヘッダー / Bluesky proxy header
  BSKY_SERVICE, // BlueskyサービスURL / Bluesky service URL
  DISCOVER_SAVED_FEED, // ディスカバー保存フィード / Discover saved feed
  IS_PROD_SERVICE, // 本番環境判定関数 / Production environment check function
  PUBLIC_BSKY_SERVICE, // 公開BlueskyサービスURL / Public Bluesky service URL
  TIMELINE_SAVED_FEED, // タイムライン保存フィード / Timeline saved feed
} from '#/lib/constants'
// 統計機能ゲート取得ユーティリティ / Statistics feature gate fetch utility
import {tryFetchGates} from '#/lib/statsig/statsig'
// 年齢計算ユーティリティ / Age calculation utility
import {getAge} from '#/lib/strings/time'
// アプリケーションロガー / Application logger
import {logger} from '#/logger'
// メール確認プロンプトスヌーズ機能 / Email confirmation prompt snooze function
import {snoozeEmailConfirmationPrompt} from '#/state/shell/reminders'
// ネットワーク状態イベント発行関数 / Network status event emission functions
import {emitNetworkConfirmed, emitNetworkLost} from '../events'
// セッションエラーログ記録関数 / Session error logging function
import {addSessionErrorLog} from './logging'
// モデレーション設定関数群 / Moderation configuration functions
import {
  configureModerationForAccount, // アカウント用モデレーション設定 / Moderation configuration for account
  configureModerationForGuest, // ゲスト用モデレーション設定 / Moderation configuration for guest
} from './moderation'
// セッションアカウント型 / Session account type
import {type SessionAccount} from './types'
// セッション関連ユーティリティ関数 / Session related utility functions
import {isSessionExpired, isSignupQueued} from './util'

// プロキシヘッダー値の型定義（DID#サービス型の形式）
// Proxy header value type definition (format: DID#ServiceType)
export type ProxyHeaderValue = `${Did}#${AtprotoServiceType}`

/**
 * 公開エージェントを作成する関数（未認証ユーザー用）
 * 認証が不要な公開コンテンツにアクセスするためのエージェントを作成
 * 
 * Function to create public agent (for unauthenticated users)
 * Creates an agent for accessing public content that doesn't require authentication
 */
export function createPublicAgent() {
  // ゲスト用のモデレーションを設定（副作用ありだがテストでのみ関連）
  // Configure moderation for guest (side effect but only relevant for tests)
  configureModerationForGuest()

  // 公開Blueskyサービスでエージェントを作成
  // Create agent with public Bluesky service
  const agent = new BskyAppAgent({service: PUBLIC_BSKY_SERVICE})
  // プロキシヘッダーを設定
  // Configure proxy header
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())
  return agent
}

/**
 * 保存されたアカウントでエージェントを作成しセッションを復帰する関数
 * ログアウト後の再ログインやアプリ再起動時のセッション復元に使用
 * 
 * Function to create agent and resume session with saved account
 * Used for re-login after logout or session restoration on app restart
 */
export async function createAgentAndResume(
  storedAccount: SessionAccount, // 保存されたアカウント情報 / Saved account information
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void, // セッション変更イベントハンドラー / Session change event handler
) {
  // 保存されたサービスでエージェントを作成
  // Create agent with saved service
  const agent = new BskyAppAgent({service: storedAccount.service})
  
  // PDS URLが保存されている場合は設定
  // Set PDS URL if saved
  if (storedAccount.pdsUrl) {
    agent.sessionManager.pdsUrl = new URL(storedAccount.pdsUrl)
  }
  
  // 統計機能ゲートを非同期で取得（低レイテンシ優先）
  // Asynchronously fetch statistics feature gates (prefer low latency)
  const gates = tryFetchGates(storedAccount.did, 'prefer-low-latency')
  
  // アカウント用のモデレーションを非同期で設定
  // Asynchronously configure moderation for account
  const moderation = configureModerationForAccount(agent, storedAccount)
  
  // 保存されたアカウントからセッションデータを構築
  // Build session data from saved account
  const prevSession: AtpSessionData = sessionAccountToSession(storedAccount)
  
  // セッションの期限切れチェックと復帰処理
  // Check session expiration and handle resumption
  if (isSessionExpired(storedAccount)) {
    // 期限切れの場合は同期的にセッション復帰を実行（1回リトライ）
    // If expired, synchronously resume session (1 retry)
    await networkRetry(1, () => agent.resumeSession(prevSession))
  } else {
    // 期限内の場合はセッションを直接設定
    // If not expired, directly set session
    agent.sessionManager.session = prevSession
    
    // サインアップキューにいない場合は非同期でセッション復帰を試行
    // If not in signup queue, try asynchronous session resume
    if (!storedAccount.signupQueued) {
      networkRetry(3, () => agent.resumeSession(prevSession)).catch(
        (e: any) => {
          // セッション復帰失敗時のエラーログ記録
          // Log error when session resume fails
          logger.error(`networkRetry failed to resume session`, {
            status: e?.status || 'unknown',
            // このフィールド名はSentryスクラバーによって無視される
            // this field name is ignored by Sentry scrubbers
            safeMessage: e?.message || 'unknown',
          })

          throw e
        },
      )
    }
  }

  // プロキシヘッダーを設定
  // Configure proxy header
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  // エージェントを準備して返す
  // Prepare and return the agent
  return agent.prepare(gates, moderation, onSessionChange)
}

/**
 * エージェントを作成してログインする関数
 * 既存ユーザーの認証処理を行い、セッションを開始する
 * 
 * Function to create agent and perform login
 * Handles authentication for existing users and starts a session
 */
export async function createAgentAndLogin(
  {
    service, // サービスURL / Service URL
    identifier, // ユーザー識別子（メールまたはハンドル） / User identifier (email or handle)
    password, // パスワード / Password
    authFactorToken, // 二要素認証トークン（オプション） / Two-factor auth token (optional)
  }: {
    service: string
    identifier: string
    password: string
    authFactorToken?: string
  },
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void, // セッション変更イベントハンドラー / Session change event handler
) {
  // 指定されたサービスでエージェントを作成
  // Create agent with specified service
  const agent = new BskyAppAgent({service})
  
  // ログイン処理を実行
  // Perform login process
  await agent.login({
    identifier, // ユーザー識別子 / User identifier
    password, // パスワード / Password
    authFactorToken, // 二要素認証トークン / Two-factor auth token
    allowTakendown: true, // 停止されたアカウントのログインを許可 / Allow login for suspended accounts
  })

  // エージェントからアカウント情報を取得（エラー時は例外をスロー）
  // Get account info from agent (throw exception on error)
  const account = agentToSessionAccountOrThrow(agent)
  
  // 統計機能ゲートを非同期で取得（新鮮なゲート優先）
  // Asynchronously fetch statistics feature gates (prefer fresh gates)
  const gates = tryFetchGates(account.did, 'prefer-fresh-gates')
  
  // アカウント用のモデレーションを非同期で設定
  // Asynchronously configure moderation for account
  const moderation = configureModerationForAccount(agent, account)

  // プロキシヘッダーを設定
  // Configure proxy header
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  // エージェントを準備して返す
  // Prepare and return the agent
  return agent.prepare(gates, moderation, onSessionChange)
}

/**
 * エージェントを作成して新しいアカウントを作成する関数
 * 新規ユーザーのアカウント作成処理を行い、初期設定も実行
 * 
 * Function to create agent and create new account
 * Handles account creation for new users and performs initial setup
 */
export async function createAgentAndCreateAccount(
  {
    service, // サービスURL / Service URL
    email, // メールアドレス / Email address
    password, // パスワード / Password
    handle, // ユーザーハンドル / User handle
    birthDate, // 生年月日 / Birth date
    inviteCode, // 招待コード（オプション） / Invite code (optional)
    verificationPhone, // 認証用電話番号（オプション） / Phone number for verification (optional)
    verificationCode, // 認証コード（オプション） / Verification code (optional)
  }: {
    service: string
    email: string
    password: string
    handle: string
    birthDate: Date
    inviteCode?: string
    verificationPhone?: string
    verificationCode?: string
  },
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void, // セッション変更イベントハンドラー / Session change event handler
) {
  // 指定されたサービスでエージェントを作成
  // Create agent with specified service
  const agent = new BskyAppAgent({service})
  
  // アカウント作成処理を実行
  // Perform account creation process
  await agent.createAccount({
    email, // メールアドレス / Email address
    password, // パスワード / Password
    handle, // ユーザーハンドル / User handle
    inviteCode, // 招待コード / Invite code
    verificationPhone, // 認証用電話番号 / Phone number for verification
    verificationCode, // 認証コード / Verification code
  })
  
  // エージェントからアカウント情報を取得（エラー時は例外をスロー）
  // Get account info from agent (throw exception on error)
  const account = agentToSessionAccountOrThrow(agent)
  
  // 統計機能ゲートを非同期で取得（新鮮なゲート優先）
  // Asynchronously fetch statistics feature gates (prefer fresh gates)
  const gates = tryFetchGates(account.did, 'prefer-fresh-gates')
  
  // アカウント用のモデレーションを非同期で設定
  // Asynchronously configure moderation for account
  const moderation = configureModerationForAccount(agent, account)

  // オンボーディングに進めるように、この処理は待機しない
  // 日付を設定するまで成人向けコンテンツのトグルは許可しないので問題ない
  // Not awaited so that we can still get into onboarding.
  // This is OK because we won't let you toggle adult stuff until you set the date.
  if (IS_PROD_SERVICE(service)) {
    // 本番環境でのみ初期設定を実行 / Perform initial setup only in production environment
    try {
      networkRetry(1, async () => {
        // 個人詳細（生年月日）を設定 / Set personal details (birth date)
        await agent.setPersonalDetails({birthDate: birthDate.toISOString()})
        
        // デフォルトの保存フィードを設定（ディスカバーとタイムライン）
        // Set default saved feeds (Discover and Timeline)
        await agent.overwriteSavedFeeds([
          {
            ...DISCOVER_SAVED_FEED, // ディスカバーフィード設定 / Discover feed configuration
            id: TID.nextStr(), // 一意なIDを生成 / Generate unique ID
          },
          {
            ...TIMELINE_SAVED_FEED, // タイムラインフィード設定 / Timeline feed configuration
            id: TID.nextStr(), // 一意なIDを生成 / Generate unique ID
          },
        ])

        // 18歳未満の場合はチャットを無効に設定 / Disable chat for users under 18
        if (getAge(birthDate) < 18) {
          await agent.api.com.atproto.repo.putRecord({
            repo: account.did, // ユーザーのリポジトリ / User's repository
            collection: 'chat.bsky.actor.declaration', // チャット設定コレクション / Chat settings collection
            rkey: 'self', // レコードキー / Record key
            record: {
              $type: 'chat.bsky.actor.declaration',
              allowIncoming: 'none', // 受信チャットを無効に設定 / Set incoming chat to disabled
            },
          })
        }
      })
    } catch (e: any) {
      // 初期設定失敗時のエラーログ記録 / Log error when initial setup fails
      logger.error(e, {
        message: `session: createAgentAndCreateAccount failed to save personal details and feeds`,
      })
    }
  } else {
    // テスト環境ではシンプルに生年月日のみ設定 / In test environment, only set birth date simply
    agent.setPersonalDetails({birthDate: birthDate.toISOString()})
  }

  try {
    // サインアップ後の最初のプロンプトをスヌーズし、次のプロンプトに延期
    // snooze first prompt after signup, defer to next prompt
    snoozeEmailConfirmationPrompt()
  } catch (e: any) {
    // メール確認プロンプトスヌーズ失敗時のエラーログ / Error log when email confirmation prompt snooze fails
    logger.error(e, {message: `session: failed snoozeEmailConfirmationPrompt`})
  }

  // プロキシヘッダーを設定
  // Configure proxy header
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  // エージェントを準備して返す
  // Prepare and return the agent
  return agent.prepare(gates, moderation, onSessionChange)
}

/**
 * エージェントからセッションアカウントへの変換（例外あり）
 * アクティブなセッションがない場合は例外をスロー
 * 
 * Convert agent to session account (with exception)
 * Throws exception if no active session exists
 */
export function agentToSessionAccountOrThrow(agent: BskyAgent): SessionAccount {
  // エージェントからアカウント情報を取得を試行 / Try to get account info from agent
  const account = agentToSessionAccount(agent)
  if (!account) {
    // アカウントが取得できない場合は例外をスロー / Throw exception if account cannot be retrieved
    throw Error('Expected an active session')
  }
  return account
}

/**
 * エージェントからセッションアカウントへの変換関数
 * エージェントのセッション情報から永続化可能なアカウント情報を作成
 * 
 * Function to convert agent to session account
 * Creates persistable account info from agent's session information
 */
export function agentToSessionAccount(
  agent: BskyAgent,
): SessionAccount | undefined {
  // セッションがない場合はundefinedを返す / Return undefined if no session exists
  if (!agent.session) {
    return undefined
  }
  
  // エージェントのセッション情報からセッションアカウントを構築
  // Build session account from agent's session information
  return {
    service: agent.service.toString(), // サービスURL / Service URL
    did: agent.session.did, // 分散識別子 / Decentralized Identifier
    handle: agent.session.handle, // ユーザーハンドル / User handle
    email: agent.session.email, // メールアドレス / Email address
    emailConfirmed: agent.session.emailConfirmed || false, // メール確認状態 / Email confirmation status
    emailAuthFactor: agent.session.emailAuthFactor || false, // メール認証因子 / Email authentication factor
    refreshJwt: agent.session.refreshJwt, // リフレッシュトークン / Refresh token
    accessJwt: agent.session.accessJwt, // アクセストークン / Access token
    signupQueued: isSignupQueued(agent.session.accessJwt), // サインアップキュー状態 / Signup queue status
    active: agent.session.active, // アクティブステータス / Active status
    status: agent.session.status as SessionAccount['status'], // アカウント状態 / Account status
    pdsUrl: agent.pdsUrl?.toString(), // PDS URL（Personal Data Server）
    isSelfHosted: !agent.serviceUrl.toString().startsWith(BSKY_SERVICE), // セルフホスティングフラグ / Self-hosting flag
  }
}

/**
 * セッションアカウントからAT Protocolセッションデータへの変換関数
 * 永続化されたアカウント情報をエージェントが使用できるセッション形式に変換
 * 
 * Function to convert session account to AT Protocol session data
 * Converts persisted account info to session format that agents can use
 */
export function sessionAccountToSession(
  account: SessionAccount,
): AtpSessionData {
  return {
    // BskyAgentが返すのと同じプロパティ順でソート（アルファベット順）
    // Sorted in the same property order as when returned by BskyAgent (alphabetical)
    accessJwt: account.accessJwt ?? '', // アクセストークン（空文字列でフォールバック） / Access token (fallback to empty string)
    did: account.did, // 分散識別子 / Decentralized Identifier
    email: account.email, // メールアドレス / Email address
    emailAuthFactor: account.emailAuthFactor, // メール認証因子 / Email authentication factor
    emailConfirmed: account.emailConfirmed, // メール確認状態 / Email confirmation status
    handle: account.handle, // ユーザーハンドル / User handle
    refreshJwt: account.refreshJwt ?? '', // リフレッシュトークン（空文字列でフォールバック） / Refresh token (fallback to empty string)
    /**
     * アクティブステータス（デフォルトはtrue）
     * Active status (default to true)
     * @see https://github.com/bluesky-social/atproto/blob/c5d36d5ba2a2c2a5c4f366a5621c06a5608e361e/packages/api/src/agent.ts#L188
     */
    active: account.active ?? true,
    status: account.status, // アカウント状態 / Account status
  }
}

/**
 * プロキシヘッダー対応の拡張エージェントクラス
 * ベースエージェントにプロキシ設定機能を追加
 * 
 * Extended agent class with proxy header support
 * Adds proxy configuration functionality to the base agent
 */
export class Agent extends BaseAgent {
  constructor(
    proxyHeader: ProxyHeaderValue | null, // プロキシヘッダー値（nullの場合はプロキシなし） / Proxy header value (no proxy if null)
    options: SessionManager | FetchHandler | FetchHandlerOptions, // エージェントの設定オプション / Agent configuration options
  ) {
    super(options)
    // プロキシヘッダーが指定されている場合は設定
    // Configure proxy if proxy header is specified
    if (proxyHeader) {
      this.configureProxy(proxyHeader)
    }
  }
}

// エクスポートしない。上記のファクトリ関数を使用して作成する。
// 警告：上記のファクトリでは、必要な処理の後で手動でプロキシヘッダーを設定している。
// 理想的にはこれをしない方が良いが、PDSへの呼び出しが必要なロジックが多いため、
// それらをそのまま実行し、後でヘッダーを設定する方が安全に感じる。
// Not exported. Use factories above to create it.
// WARN: In the factories above, we _manually set a proxy header_ for the agent after we do whatever it is we are supposed to do.
// Ideally, we wouldn't be doing this. However, since there is so much logic that requires making calls to the PDS right now, it
// feels safer to just let those run as-is and set the header afterward.

// 元のfetch関数を保存 / Store original fetch function
let realFetch = globalThis.fetch
/**
 * Blueskyアプリ用の特化エージェントクラス
 * ネットワーク状態監視とセッション永続化機能を追加
 * 
 * Specialized agent class for Bluesky app
 * Adds network status monitoring and session persistence functionality
 */
class BskyAppAgent extends BskyAgent {
  // セッション永続化ハンドラー（初期化時はundefined）
  // Session persistence handler (undefined during initialization)
  persistSessionHandler: ((event: AtpSessionEvent) => void) | undefined =
    undefined

  constructor({service}: {service: string}) {
    super({
      service, // サービスURL / Service URL
      // ネットワーク状態監視機能付きfetch関数
      // Custom fetch function with network status monitoring
      async fetch(...args) {
        let success = false
        try {
          // 元のfetch関数でリクエストを実行 / Execute request with original fetch function
          const result = await realFetch(...args)
          success = true // 成功フラグを設定 / Set success flag
          return result
        } catch (e) {
          success = false // 失敗フラグを設定 / Set failure flag
          throw e
        } finally {
          // 結果に関係なくネットワーク状態イベントを発行
          // Emit network status events regardless of result
          if (success) {
            emitNetworkConfirmed() // ネットワーク接続確認イベント / Network connection confirmed event
          } else {
            emitNetworkLost() // ネットワーク接続失敗イベント / Network connection lost event
          }
        }
      },
      // セッション永続化ハンドラー
      // Session persistence handler
      persistSession: (event: AtpSessionEvent) => {
        // ハンドラーが設定されている場合のみ呼び出し / Call handler only if set
        if (this.persistSessionHandler) {
          this.persistSessionHandler(event)
        }
      },
    })
  }

  /**
   * エージェントの準備処理
   * 統計機能ゲートとモデレーション設定の完了を待ち、セッションハンドラーを設定
   * 
   * Agent preparation process
   * Wait for completion of statistics gates and moderation settings, then set session handler
   */
  async prepare(
    // 呼び出し元では待機しないので、ブロッキングを遅らせられる
    // Not awaited in the calling code so we can delay blocking on them
    gates: Promise<void>, // 統計機能ゲートの非同期処理 / Asynchronous statistics feature gates processing
    moderation: Promise<void>, // モデレーション設定の非同期処理 / Asynchronous moderation setup processing
    onSessionChange: (
      agent: BskyAgent,
      did: string,
      event: AtpSessionEvent,
    ) => void, // セッション変更イベントハンドラー / Session change event handler
  ) {
    // 他にやるべきことがないので、ここでブロックする
    // There's nothing else left to do, so block on them here
    await Promise.all([gates, moderation])

    // これでエージェントの準備が完了 / Now the agent is ready
    const account = agentToSessionAccountOrThrow(this)
    // 最後に成功したセッションを保持 / Keep the last successful session
    let lastSession = this.sessionManager.session
    
    // セッション永続化ハンドラーを設定 / Set session persistence handler
    this.persistSessionHandler = event => {
      if (this.sessionManager.session) {
        // セッションがある場合は最後のセッションとして保存
        // If session exists, save it as the last session
        lastSession = this.sessionManager.session
      } else if (event === 'network-error') {
        // ネットワークエラーの場合は後で再試行するため、セッションを復元
        // Put it back for network errors, we'll try again later
        this.sessionManager.session = lastSession
      }

      // セッション変更イベントを通知 / Notify session change event
      onSessionChange(this, account.did, event)
      
      // 作成や更新以外のイベントはエラーとしてログ記録
      // Log events other than create and update as errors
      if (event !== 'create' && event !== 'update') {
        addSessionErrorLog(account.did, event)
      }
    }
    
    // 準備完了したアカウントとエージェントを返す / Return prepared account and agent
    return {account, agent: this}
  }

  /**
   * エージェントのリソース解放処理
   * セッションとハンドラーをクリアしてメモリリークを防ぐ
   * 
   * Agent resource disposal process
   * Clear session and handler to prevent memory leaks
   */
  dispose() {
    // セッションをクリア / Clear session
    this.sessionManager.session = undefined
    // 永続化ハンドラーをクリア / Clear persistence handler
    this.persistSessionHandler = undefined
  }
}

// Blueskyアプリエージェントの型をエクスポート / Export Bluesky app agent type
export type {BskyAppAgent}
