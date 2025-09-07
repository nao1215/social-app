// ログ機能とユーティリティ
import {nanoid} from 'nanoid/non-secure'            // セキュアでないnanoid（パフォーマンス重視）

// 統計・ログ管理
import {logEvent} from '#/lib/statsig/statsig'      // StatSigイベントログ
import {add} from '#/logger/logDump'                // ログダンプ追加
import {type MetricEvents} from '#/logger/metrics'  // メトリクスイベント型

// ログトランスポート（出力先）
import {bitdriftTransport} from '#/logger/transports/bitdrift' // Bitdriftトランスポート
import {consoleTransport} from '#/logger/transports/console'   // コンソールトランスポート
import {sentryTransport} from '#/logger/transports/sentry'     // Sentryトランスポート

// ログ型定義・ユーティリティ
import {
  LogContext,
  LogLevel,
  type Metadata,
  type Transport,
} from '#/logger/types'                             // ログ型定義
import {enabledLogLevels} from '#/logger/util'     // 有効ログレベル
import {isNative} from '#/platform/detection'      // プラットフォーム判定
import {ENV} from '#/env'                           // 環境変数

const TRANSPORTS: Transport[] = (function configureTransports() {
  switch (ENV) {
    case 'production': {
      return [sentryTransport, isNative && bitdriftTransport].filter(
        Boolean,
      ) as Transport[]
    }
    case 'test': {
      return []
    }
    default: {
      return [consoleTransport]
    }
  }
})()

export class Logger {
  static Level = LogLevel
  static Context = LogContext

  level: LogLevel
  context: LogContext | undefined = undefined
  contextFilter: string = ''

  protected debugContextRegexes: RegExp[] = []
  protected transports: Transport[] = []

  static create(context?: LogContext) {
    const logger = new Logger({
      level: process.env.EXPO_PUBLIC_LOG_LEVEL as LogLevel,
      context,
      contextFilter: process.env.EXPO_PUBLIC_LOG_DEBUG || '',
    })
    for (const transport of TRANSPORTS) {
      logger.addTransport(transport)
    }
    return logger
  }

  constructor({
    level,
    context,
    contextFilter,
  }: {
    level?: LogLevel
    context?: LogContext
    contextFilter?: string
  } = {}) {
    this.context = context
    this.level = level || LogLevel.Info
    this.contextFilter = contextFilter || ''
    if (this.contextFilter) {
      this.level = LogLevel.Debug
    }
    this.debugContextRegexes = (this.contextFilter || '')
      .split(',')
      .map(filter => {
        return new RegExp(filter.replace(/[^\w:*-]/, '').replace(/\*/g, '.*'))
      })
  }

  debug(message: string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Debug, message, metadata})
  }

  info(message: string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Info, message, metadata})
  }

  log(message: string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Log, message, metadata})
  }

  warn(message: string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Warn, message, metadata})
  }

  error(error: Error | string, metadata: Metadata = {}) {
    this.transport({level: LogLevel.Error, message: error, metadata})
  }

  metric<E extends keyof MetricEvents>(
    event: E & string,
    metadata: MetricEvents[E],
    options: {
      /**
       * Optionally also send to StatSig
       */
      statsig?: boolean
    } = {statsig: true},
  ) {
    logEvent(event, metadata, {
      lake: !options.statsig,
    })

    for (const transport of this.transports) {
      transport(LogLevel.Info, LogContext.Metric, event, metadata, Date.now())
    }
  }

  addTransport(transport: Transport) {
    this.transports.push(transport)
    return () => {
      this.transports.splice(this.transports.indexOf(transport), 1)
    }
  }

  protected transport({
    level,
    message,
    metadata = {},
  }: {
    level: LogLevel
    message: string | Error
    metadata: Metadata
  }) {
    if (
      level === LogLevel.Debug &&
      !!this.contextFilter &&
      !!this.context &&
      !this.debugContextRegexes.find(reg => reg.test(this.context!))
    )
      return

    const timestamp = Date.now()
    const meta = metadata || {}

    // send every log to syslog
    add({
      id: nanoid(),
      timestamp,
      level,
      context: this.context,
      message,
      metadata: meta,
    })

    if (!enabledLogLevels[this.level].includes(level)) return

    for (const transport of this.transports) {
      transport(level, this.context, message, meta, timestamp)
    }
  }
}

/**
 * Default logger instance. See `@/logger/README` for docs.
 *
 * Basic usage:
 *
 *   `logger.debug(message[, metadata])`
 *   `logger.info(message[, metadata])`
 *   `logger.log(message[, metadata])`
 *   `logger.warn(message[, metadata])`
 *   `logger.error(error[, metadata])`
 */
export const logger = Logger.create(Logger.Context.Default)
