// AT Protocolのセッションデータとイベント型をインポート
// Import AT Protocol session data and event types
import {type AtpSessionData, type AtpSessionEvent} from '@atproto/api'
// SHA256ハッシュ化ライブラリ（センシティブデータの匿名化用）
// SHA256 hashing library (for anonymizing sensitive data)
import {sha256} from 'js-sha256'
// 統計・分析用ライブラリ
// Statistics and analytics library
import {Statsig} from 'statsig-react-native-expo'

// 内部ビルドかどうかの判定フラグ
// Flag to determine if this is an internal build
import {IS_INTERNAL} from '#/env'
// 永続化データのスキーマ型
// Persistent data schema types
import {type Schema} from '../persisted'
// リデューサーのアクションと状態型
// Reducer action and state types
import {type Action, type State} from './reducer'
// セッションアカウント型
// Session account type
import {type SessionAccount} from './types'

// リデューサー関数の型定義
// Reducer function type definition
type Reducer = (state: State, action: Action) => State

/**
 * セッションデバッグログの型定義
 * セッション操作に関する全てのログイベントを表現するUnion型
 * 
 * Session debug log type definition
 * Union type representing all log events for session operations
 */
type Log =
  | {
      // リデューサー初期化ログ
      // Reducer initialization log
      type: 'reducer:init'
      state: State // 初期化時の状態 / State during initialization
    }
  | {
      // リデューサー呼び出しログ
      // Reducer call log
      type: 'reducer:call'
      action: Action // 実行されたアクション / Executed action
      prevState: State // 変更前の状態 / Previous state
      nextState: State // 変更後の状態 / Next state
    }
  | {
      // メソッド開始ログ
      // Method start log
      type: 'method:start'
      method:
        | 'createAccount' // アカウント作成 / Account creation
        | 'login' // ログイン / Login
        | 'logout' // ログアウト / Logout
        | 'resumeSession' // セッション復帰 / Session resume
        | 'removeAccount' // アカウント削除 / Account removal
      account?: SessionAccount // 関連するアカウント情報（オプション）/ Related account info (optional)
    }
  | {
      // メソッド終了ログ
      // Method end log
      type: 'method:end'
      method:
        | 'createAccount' // アカウント作成 / Account creation
        | 'login' // ログイン / Login
        | 'logout' // ログアウト / Logout
        | 'resumeSession' // セッション復帰 / Session resume
        | 'removeAccount' // アカウント削除 / Account removal
      account?: SessionAccount // 関連するアカウント情報（オプション）/ Related account info (optional)
    }
  | {
      // 永続化データ送信ログ（他のタブへの送信）
      // Persistent data broadcast log (send to other tabs)
      type: 'persisted:broadcast'
      data: Schema['session'] // 送信されるセッションデータ / Session data being sent
    }
  | {
      // 永続化データ受信ログ（他のタブからの受信）
      // Persistent data receive log (receive from other tabs)
      type: 'persisted:receive'
      data: Schema['session'] // 受信されるセッションデータ / Session data being received
    }
  | {
      // エージェント切り替えログ
      // Agent switch log
      type: 'agent:switch'
      prevAgent: object // 切り替え前のエージェント / Previous agent
      nextAgent: object // 切り替え後のエージェント / Next agent
    }
  | {
      // エージェントセッション部分更新ログ
      // Agent session partial update log
      type: 'agent:patch'
      agent: object // 更新されたエージェント / Updated agent
      prevSession: AtpSessionData | undefined // 更新前のセッションデータ / Previous session data
      nextSession: AtpSessionData | undefined // 更新後のセッションデータ / Next session data
    }

/**
 * セッションリデューサーをログ記録機能でラップする関数
 * リデューサーの呼び出しと状態変更をログに記録するラッパーを返す
 * 
 * Function to wrap session reducer with logging functionality
 * Returns wrapper that logs reducer calls and state changes
 */
export function wrapSessionReducerForLogging(reducer: Reducer): Reducer {
  return function loggingWrapper(prevState: State, action: Action): State {
    // 元のリデューサーを実行して新しい状態を取得
    // Execute original reducer to get new state
    const nextState = reducer(prevState, action)
    // リデューサー呼び出しログを記録
    // Record reducer call log
    addSessionDebugLog({type: 'reducer:call', prevState, action, nextState})
    return nextState
  }
}

// メッセージインデックスのカウンター（ログの一意識別用）
// Message index counter (for unique log identification)
let nextMessageIndex = 0
// ログスライスの最大長（ログの分割送信用）
// Maximum log slice length (for splitting log transmission)
const MAX_SLICE_LENGTH = 1000

/**
 * セッションエラーログを追加する関数（ゲート制御なし）
 * セッション関連のエラーイベントを統計サービスに送信
 * 
 * Function to add session error log (not gated)
 * Sends session-related error events to statistics service
 */
export function addSessionErrorLog(did: string, event: AtpSessionEvent) {
  try {
    // Statsigが初期化されていないか、安定IDがない場合はスキップ
    // Skip if Statsig is not initialized or no stable ID exists
    if (!Statsig.initializeCalled() || !Statsig.getStableID()) {
      return
    }
    // エラースタックトレースを取得（最大長で切り詰め）
    // Get error stack trace (truncated to maximum length)
    const stack = (new Error().stack ?? '').slice(0, MAX_SLICE_LENGTH)
    // エラーログを統計サービスに送信
    // Send error log to statistics service
    Statsig.logEvent('session:error', null, {
      did, // ユーザーDID / User DID
      event, // エラーイベント / Error event
      stack, // スタックトレース / Stack trace
    })
  } catch (e) {
    // ログ記録中のエラーはコンソールに出力
    // Output errors during logging to console
    console.error(e)
  }
}

/**
 * セッションデバッグログを追加する関数
 * 内部ビルドでのみセッションの詳細なデバッグ情報を記録
 * 
 * Function to add session debug log
 * Records detailed session debug information for internal builds only
 */
export function addSessionDebugLog(log: Log) {
  try {
    // Statsigが初期化されていないか、安定IDがない場合はスキップ
    // Skip if Statsig is not initialized or no stable ID exists
    if (!Statsig.initializeCalled() || !Statsig.getStableID()) {
      // 現在はこれらのログを破棄 / Drop these logs for now
      return
    }
    // EMEによるゲート無効化 @TODO EME-GATE
    // DISABLING THIS GATE DUE TO EME @TODO EME-GATE
    if (!IS_INTERNAL) {
      // 内部ビルドではない場合はログを送信しない / Don't send logs if not internal build
      return
    }
    // デバッグセッションゲートのチェック（現在無効化）
    // Check for debug session gate (currently disabled)
    // if (!Statsig.checkGate('debug_session')) {
    //   return
    // }
    
    // メッセージに一意のインデックスを割り当て
    // Assign unique index to message
    const messageIndex = nextMessageIndex++
    // ログタイプとコンテンツを分離
    // Separate log type and content
    const {type, ...content} = log
    // コンテントをJSON化（センシティブデータはフィルタリング）
    // Convert content to JSON (filtering sensitive data)
    let payload = JSON.stringify(content, replacer)

    // 大きなペイロードをスライスに分割して送信
    // Split large payload into slices for transmission
    let nextSliceIndex = 0
    while (payload.length > 0) {
      const sliceIndex = nextSliceIndex++
      // 最大長でスライスを切り出し / Cut out slice at maximum length
      const slice = payload.slice(0, MAX_SLICE_LENGTH)
      // 残りのペイロードを更新 / Update remaining payload
      payload = payload.slice(MAX_SLICE_LENGTH)
      // デバッグログを統計サービスに送信
      // Send debug log to statistics service
      Statsig.logEvent('session:debug', null, {
        realmId, // レルムID（アプリインスタンス識別子） / Realm ID (app instance identifier)
        messageIndex: String(messageIndex), // メッセージインデックス / Message index
        messageType: type, // メッセージタイプ / Message type
        sliceIndex: String(sliceIndex), // スライスインデックス / Slice index
        slice, // スライスデータ / Slice data
      })
    }
  } catch (e) {
    // ログ記録中のエラーはコンソールに出力
    // Output errors during logging to console
    console.error(e)
  }
}

// エージェントオブジェクトとそのIDのマッピング（WeakMapでメモリリークを防ぐ）
// Mapping between agent objects and their IDs (WeakMap prevents memory leaks)
let agentIds = new WeakMap<object, string>()
// レルムID（アプリインスタンスの一意識別子）
// Realm ID (unique identifier for app instance)
let realmId = Math.random().toString(36).slice(2)
// 次のエージェントIDのカウンター
// Counter for next agent ID
let nextAgentId = 1

/**
 * エージェントオブジェクトの一意識別子を取得する関数
 * 初回アクセス時に新しいIDを生成し、以後は同じIDを返す
 * 
 * Function to get unique identifier for agent object
 * Generates new ID on first access, returns same ID thereafter
 */
function getAgentId(agent: object) {
  // エージェントの既存IDを検索
  // Search for existing ID of agent
  let id = agentIds.get(agent)
  if (id === undefined) {
    // IDがない場合は新しいIDを生成（レルムID + 連番）
    // If no ID exists, generate new ID (realm ID + sequence number)
    id = realmId + '::' + nextAgentId++
    // エージェントとIDのマッピングを保存
    // Save mapping between agent and ID
    agentIds.set(agent, id)
  }
  return id
}

/**
 * JSON.stringify用のリプレーサー関数
 * センシティブなデータをフィルタリング・匿名化してログの安全性を確保
 * 
 * Replacer function for JSON.stringify
 * Filters and anonymizes sensitive data to ensure log security
 */
function replacer(key: string, value: unknown) {
  // エージェントオブジェクトの場合は一意識別子に置き換え
  // Replace agent objects with unique identifiers
  if (typeof value === 'object' && value != null && 'api' in value) {
    return getAgentId(value)
  }
  // センシティブな情報はログから除外（undefinedを返すことでJSONから除外）
  // Exclude sensitive information from logs (return undefined to exclude from JSON)
  if (
    key === 'service' || // サービスURL / Service URL
    key === 'email' || // メールアドレス / Email address
    key === 'emailConfirmed' || // メール確認状態 / Email confirmation status
    key === 'emailAuthFactor' || // メール認証因子 / Email authentication factor
    key === 'pdsUrl' // PDS URL
  ) {
    return undefined
  }
  // JWTトークンはSHA256ハッシュ化して匿名化
  // Hash JWT tokens with SHA256 for anonymization
  if (
    typeof value === 'string' &&
    (key === 'refreshJwt' || key === 'accessJwt') // リフレッシュトークンまたはアクセストークン
  ) {
    return sha256(value) // SHA256ハッシュで匿名化 / Anonymize with SHA256 hash
  }
  // その他の値はそのまま返す
  // Return other values as-is
  return value
}
