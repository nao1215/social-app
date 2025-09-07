// AT Protocol API型定義 - Blueskyエージェントと会話ログ取得APIの型
import {type BskyAgent, type ChatBskyConvoGetLog} from '@atproto/api'
// イベントエミッター - 非同期イベント配信系統
// Event emitter - asynchronous event delivery system
import EventEmitter from 'eventemitter3'
// 一意ID生成 - インスタンスとリクエストの一意識別子生成
import {nanoid} from 'nanoid/non-secure'

// ネットワーク再試行ユーティリティ - API呼び出しの自動リトライ機能
import {networkRetry} from '#/lib/async/retry'
// ダイレクトメッセージサービス用ヘッダー - DM API呼び出しに必要なHTTPヘッダー
import {DM_SERVICE_HEADERS} from '#/lib/constants'
// ネットワークエラー判定 - エラーがネットワーク起因か判断
import {isNetworkError} from '#/lib/strings/errors'
// ログ出力システム - デバッグとエラートラッキング
import {Logger} from '#/logger'
// メッセージイベントバスのポーリング間隔定数 - アクティブとバックグラウンド時の更新頻度
import {
  BACKGROUND_POLL_INTERVAL,
  DEFAULT_POLL_INTERVAL,
} from '#/state/messages/events/const'
// メッセージイベントバスの型定義 - イベント、ディスパッチ、ステータスなどの型
import {
  type MessagesEventBusDispatch,
  MessagesEventBusDispatchEvent,
  MessagesEventBusErrorCode,
  type MessagesEventBusEvent,
  type MessagesEventBusParams,
  MessagesEventBusStatus,
} from '#/state/messages/events/types'

// メッセージイベントバス専用ログインスタンス - DMエージェントのログ出力用
const logger = Logger.create(Logger.Context.DMsAgent)

/**
 * メッセージイベントバスクラス - リアルタイムメッセージイベントの配信と管理
 * Message event bus class - manages real-time message event delivery and distribution
 * 
 * AT Protocolのメッセージログを定期的にポーリングし、新しいイベントを検出して購読者に配信
 * Periodically polls AT Protocol message logs, detects new events and delivers them to subscribers
 */
export class MessagesEventBus {
  // 内部インスタンスID - デバッグとログ出力用の一意識別子
  private id: string

  // AT Protocolエージェントとイベントエミッター
  private agent: BskyAgent // APIクライアントインスタンス / API client instance
  private emitter = new EventEmitter<{event: [MessagesEventBusEvent]}>() // イベント配信システム / Event delivery system

  // イベントバスの状態管理
  private status: MessagesEventBusStatus = MessagesEventBusStatus.Initializing // 初期状態は初期化中 / Initial state is initializing
  private latestRev: string | undefined = undefined // 最新リビジョン番号 - 差分更新用 / Latest revision number for incremental updates
  private pollInterval = DEFAULT_POLL_INTERVAL // 現在のポーリング間隔 / Current polling interval
  private requestedPollIntervals: Map<string, number> = new Map() // リクエストされたポーリング間隔の管理 / Management of requested polling intervals

  /**
   * メッセージイベントバスのコンストラクタ
   * Constructor for message event bus
   * 
   * @param params - 初期化パラメータ / Initialization parameters
   */
  constructor(params: MessagesEventBusParams) {
    // デバッグ用の短いランダムID生成
    this.id = nanoid(3)
    // AT Protocolエージェントを設定
    this.agent = params.agent

    // 初期化処理を開始
    this.init()
  }

  /**
   * ポーリング間隔のリクエスト - 特定のコンポーネントが特定の更新頻度を要求
   * Request polling interval - specific component requests specific update frequency
   * 
   * 複数のリクエストがある場合、最短間隔が採用される
   * When multiple requests exist, the shortest interval is adopted
   * 
   * @param interval - 希望するポーリング間隔（ミリ秒） / Desired polling interval in milliseconds
   * @returns リクエストをキャンセルする関数 / Function to cancel the request
   */
  requestPollInterval(interval: number) {
    // ユニークIDでリクエストを管理
    const id = nanoid()
    this.requestedPollIntervals.set(id, interval)
    // ポーリング間隔の更新をディスパッチ
    this.dispatch({
      event: MessagesEventBusDispatchEvent.UpdatePoll,
    })
    // キャンセル関数を返す
    return () => {
      this.requestedPollIntervals.delete(id)
      this.dispatch({
        event: MessagesEventBusDispatchEvent.UpdatePoll,
      })
    }
  }

  /**
   * 最新リビジョン取得 - 現在の最新メッセージリビジョン番号を返す
   * Get latest revision - returns current latest message revision number
   * 
   * @returns 最新リビジョン番号 / Latest revision number
   */
  getLatestRev() {
    return this.latestRev
  }

  /**
   * イベントリスナー登録 - メッセージイベントを購読する
   * Register event listener - subscribe to message events
   * 
   * 特定の会話IDを指定してフィルタリング可能
   * Can filter by specific conversation ID
   * 
   * @param handler - イベントハンドラー関数 / Event handler function
   * @param options - オプション（会話IDフィルター等） / Options (conversation ID filter, etc.)
   * @returns 購諭をキャンセルする関数 / Function to cancel subscription
   */
  on(
    handler: (event: MessagesEventBusEvent) => void,
    options: {
      convoId?: string // フィルターする会話ID / Conversation ID to filter
    },
  ) {
    // イベントハンドラーをラップしてフィルタリング機能を追加
    const handle = (event: MessagesEventBusEvent) => {
      // ログイベントで会話IDフィルターが指定されている場合
      if (event.type === 'logs' && options.convoId) {
        // 指定された会話IDのログのみをフィルター
        const filteredLogs = event.logs.filter(log => {
          if ('convoId' in log && log.convoId === options.convoId) {
            return log.convoId === options.convoId
          }
          return false
        })

        // フィルターされたログが存在する場合のみハンドラーを呼び出し
        if (filteredLogs.length > 0) {
          handler({
            ...event,
            logs: filteredLogs,
          })
        }
      } else {
        // フィルターなしの場合はそのままハンドラーを呼び出し
        handler(event)
      }
    }

    // イベントリスナーを登録
    this.emitter.on('event', handle)

    // 購諭キャンセル関数を返す
    return () => {
      this.emitter.off('event', handle)
    }
  }

  /**
   * バックグラウンド状態に変更 - アプリが非アクティブになった時の処理
   * Change to background state - handle when app becomes inactive
   */
  background() {
    logger.debug(`background`, {})
    this.dispatch({event: MessagesEventBusDispatchEvent.Background})
  }

  /**
   * 一時停止状態に変更 - イベントバスを一時的に停止
   * Change to suspended state - temporarily stop event bus
   */
  suspend() {
    logger.debug(`suspend`, {})
    this.dispatch({event: MessagesEventBusDispatchEvent.Suspend})
  }

  /**
   * アクティブ状態に復帰 - イベントバスを再開
   * Return to active state - resume event bus
   */
  resume() {
    logger.debug(`resume`, {})
    this.dispatch({event: MessagesEventBusDispatchEvent.Resume})
  }

  private dispatch(action: MessagesEventBusDispatch) {
    const prevStatus = this.status

    switch (this.status) {
      case MessagesEventBusStatus.Initializing: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Ready: {
            this.status = MessagesEventBusStatus.Ready
            this.resetPoll()
            this.emitter.emit('event', {type: 'connect'})
            break
          }
          case MessagesEventBusDispatchEvent.Background: {
            this.status = MessagesEventBusStatus.Backgrounded
            this.resetPoll()
            this.emitter.emit('event', {type: 'connect'})
            break
          }
          case MessagesEventBusDispatchEvent.Suspend: {
            this.status = MessagesEventBusStatus.Suspended
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.emitter.emit('event', {type: 'error', error: action.payload})
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Ready: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Background: {
            this.status = MessagesEventBusStatus.Backgrounded
            this.resetPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Suspend: {
            this.status = MessagesEventBusStatus.Suspended
            this.stopPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.stopPoll()
            this.emitter.emit('event', {type: 'error', error: action.payload})
            break
          }
          case MessagesEventBusDispatchEvent.UpdatePoll: {
            this.resetPoll()
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Backgrounded: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Resume: {
            this.status = MessagesEventBusStatus.Ready
            this.resetPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Suspend: {
            this.status = MessagesEventBusStatus.Suspended
            this.stopPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.stopPoll()
            this.emitter.emit('event', {type: 'error', error: action.payload})
            break
          }
          case MessagesEventBusDispatchEvent.UpdatePoll: {
            this.resetPoll()
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Suspended: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Resume: {
            this.status = MessagesEventBusStatus.Ready
            this.resetPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Background: {
            this.status = MessagesEventBusStatus.Backgrounded
            this.resetPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.stopPoll()
            this.emitter.emit('event', {type: 'error', error: action.payload})
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Error: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.UpdatePoll: {
            // basically reset
            this.status = MessagesEventBusStatus.Initializing
            this.latestRev = undefined
            this.init()
            break
          }
          case MessagesEventBusDispatchEvent.Resume: {
            this.status = MessagesEventBusStatus.Ready
            this.resetPoll()
            this.emitter.emit('event', {type: 'connect'})
            break
          }
        }
        break
      }
      default:
        break
    }

    logger.debug(`dispatch '${action.event}'`, {
      id: this.id,
      prev: prevStatus,
      next: this.status,
    })
  }

  private async init() {
    logger.debug(`init`, {})

    try {
      const response = await networkRetry(2, () => {
        return this.agent.chat.bsky.convo.getLog(
          {},
          {headers: DM_SERVICE_HEADERS},
        )
      })
      // throw new Error('UNCOMMENT TO TEST INIT FAILURE')

      const {cursor} = response.data

      // should always be defined
      if (cursor) {
        if (!this.latestRev) {
          this.latestRev = cursor
        } else if (cursor > this.latestRev) {
          this.latestRev = cursor
        }
      }

      this.dispatch({event: MessagesEventBusDispatchEvent.Ready})
    } catch (e: any) {
      if (!isNetworkError(e)) {
        logger.error(`init failed`, {
          safeMessage: e.message,
        })
      }

      this.dispatch({
        event: MessagesEventBusDispatchEvent.Error,
        payload: {
          exception: e,
          code: MessagesEventBusErrorCode.InitFailed,
          retry: () => {
            this.dispatch({event: MessagesEventBusDispatchEvent.Resume})
          },
        },
      })
    }
  }

  /*
   * ポーリング機能 - 定期的なメッセージログのチェック
   * Polling functionality - periodic checking of message logs
   */

  private isPolling = false // ポーリング実行中フラグ / Flag indicating polling in progress
  private pollIntervalRef: NodeJS.Timeout | undefined // ポーリングタイマーの参照 / Reference to polling timer

  /**
   * ポーリング間隔の算出 - 現在の状態とリクエストに基づいて最適な間隔を決定
   * Calculate polling interval - determine optimal interval based on current state and requests
   * 
   * @returns ポーリング間隔（ミリ秒） / Polling interval in milliseconds
   */
  private getPollInterval() {
    switch (this.status) {
      case MessagesEventBusStatus.Ready: {
        // アクティブ状態: リクエストされた間隔の中で最短を採用
        const requested = Array.from(this.requestedPollIntervals.values())
        const lowest = Math.min(DEFAULT_POLL_INTERVAL, ...requested)
        return lowest
      }
      case MessagesEventBusStatus.Backgrounded: {
        // バックグラウンド状態: バッテリー節約のため長い間隔を使用
        return BACKGROUND_POLL_INTERVAL
      }
      default:
        // その他: デフォルト間隔を使用
        return DEFAULT_POLL_INTERVAL
    }
  }

  private resetPoll() {
    this.pollInterval = this.getPollInterval()
    this.stopPoll()
    this.startPoll()
  }

  private startPoll() {
    if (!this.isPolling) this.poll()

    this.pollIntervalRef = setInterval(() => {
      if (this.isPolling) return
      this.poll()
    }, this.pollInterval)
  }

  private stopPoll() {
    if (this.pollIntervalRef) clearInterval(this.pollIntervalRef)
  }

  private async poll() {
    if (this.isPolling) return

    this.isPolling = true

    // logger.debug(
    //   `poll`,
    //   {
    //     requestedPollIntervals: Array.from(
    //       this.requestedPollIntervals.values(),
    //     ),
    //   },
    // )

    try {
      const response = await networkRetry(2, () => {
        return this.agent.chat.bsky.convo.getLog(
          {
            cursor: this.latestRev,
          },
          {headers: DM_SERVICE_HEADERS},
        )
      })

      // throw new Error('UNCOMMENT TO TEST POLL FAILURE')

      const {logs: events} = response.data

      let needsEmit = false
      let batch: ChatBskyConvoGetLog.OutputSchema['logs'] = []

      for (const ev of events) {
        /*
         * If there's a rev, we should handle it. If there's not a rev, we don't
         * know what it is.
         */
        if ('rev' in ev && typeof ev.rev === 'string') {
          /*
           * We only care about new events
           */
          if (ev.rev > (this.latestRev = this.latestRev || ev.rev)) {
            /*
             * Update rev regardless of if it's a ev type we care about or not
             */
            this.latestRev = ev.rev
            needsEmit = true
            batch.push(ev)
          }
        }
      }

      if (needsEmit) {
        this.emitter.emit('event', {type: 'logs', logs: batch})
      }
    } catch (e: any) {
      if (!isNetworkError(e)) {
        logger.error(`poll events failed`, {
          safeMessage: e.message,
        })
      }

      this.dispatch({
        event: MessagesEventBusDispatchEvent.Error,
        payload: {
          exception: e,
          code: MessagesEventBusErrorCode.PollFailed,
          retry: () => {
            this.dispatch({event: MessagesEventBusDispatchEvent.Resume})
          },
        },
      })
    } finally {
      this.isPolling = false
    }
  }
}
