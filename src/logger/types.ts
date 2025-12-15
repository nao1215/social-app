/**
 * ロガー型定義モジュール
 *
 * ログシステムの型定義を提供するモジュール。
 * ログレベル、コンテキスト、トランスポート、メタデータの型を定義。
 *
 * 主な型定義:
 * - LogContext: ログのカテゴリ（session, notifications等）
 * - LogLevel: ログの重要度レベル（debug, info, warn, error）
 * - Transport: ログ出力先の関数型
 * - Metadata: ログに付与する追加情報
 *
 * Go言語との対応:
 * - enumはGoのiota定数に相当
 * - typeはGoのtype aliasに相当
 * - interfaceはGoのstructに相当
 *
 * 注意: このファイルを直接インポートせず、Logger.Context.*経由で使用すること
 */

/**
 * ログコンテキスト（ログのカテゴリ）
 *
 * ログの発生元を分類するための列挙型。
 * Logger.Context.* として静的プロパティ経由でアクセス。
 *
 * Go言語との対応:
 * - enumはGoのconstブロック + iota パターンに相当
 * - 文字列ベースの列挙型（string enum）
 *
 * @example
 * Logger.Context.Session // "session"
 * Logger.Context.Notifications // "notifications"
 */
export enum LogContext {
  Default = 'logger', // デフォルトロガー
  Session = 'session', // セッション管理
  Notifications = 'notifications', // 通知システム
  ConversationAgent = 'conversation-agent', // 会話エージェント
  DMsAgent = 'dms-agent', // ダイレクトメッセージエージェント
  ReportDialog = 'report-dialog', // 報告ダイアログ
  FeedFeedback = 'feed-feedback', // フィードフィードバック
  PostSource = 'post-source', // 投稿ソース
  AgeAssurance = 'age-assurance', // 年齢確認
  PolicyUpdate = 'policy-update', // ポリシー更新
  Geolocation = 'geolocation', // 位置情報

  /**
   * メトリクスコンテキスト（内部使用専用）
   *
   * このコンテキストでロガーを作成しないこと。
   * メトリクス専用のロガーでのみ使用される。
   */
  Metric = 'metric',
}

/**
 * ログレベル（重要度）
 *
 * ログの重要度を表す列挙型。
 * Debug < Info < Log < Warn < Error の順で重要度が上がる。
 *
 * Go言語との対応:
 * - log/slogパッケージのLevelに相当
 * - Debug(-4) < Info(0) < Warn(4) < Error(8)
 *
 * @example
 * logger.debug("デバッグ情報") // 開発時のみ
 * logger.info("情報メッセージ") // 一般的な情報
 * logger.warn("警告メッセージ") // 注意が必要
 * logger.error(new Error("エラー")) // エラー発生
 */
export enum LogLevel {
  Debug = 'debug', // デバッグレベル（最も詳細）
  Info = 'info', // 情報レベル
  Log = 'log', // ログレベル（Infoとほぼ同等）
  Warn = 'warn', // 警告レベル
  Error = 'error', // エラーレベル（最も重要）
}

/**
 * トランスポート関数型
 *
 * ログを実際に出力する関数の型定義。
 * コンソール、Sentry、Bitdriftなどの出力先を抽象化。
 *
 * Go言語との対応:
 * - func(level, context, message, metadata, timestamp)型の関数
 * - io.Writerインターフェースの高レベル版に相当
 *
 * @param level - ログレベル（debug, info, warn, error）
 * @param context - ログコンテキスト（発生元カテゴリ）
 * @param message - ログメッセージまたはErrorオブジェクト
 * @param metadata - 追加メタデータ（オブジェクト）
 * @param timestamp - ログ発生時刻（ミリ秒Unix時刻）
 *
 * @example
 * const consoleTransport: Transport = (level, context, message, metadata, timestamp) => {
 *   console.log(`[${level}] ${context}: ${message}`, metadata);
 * }
 */
export type Transport = (
  level: LogLevel,
  context: LogContext | undefined,
  message: string | Error,
  metadata: Metadata,
  timestamp: number,
) => void

/**
 * メタデータ型
 *
 * ログに付与する追加情報の型定義。
 * SentryのBreadcrumb型とCaptureContext型の統合版。
 *
 * Go言語との対応:
 * - map[string]interface{} に相当
 * - 構造化ロギングのフィールド定義
 *
 * 主なフィールド:
 * - type: Sentryのブレッドクラム種別
 * - tags: Sentryタグ（キーバリューペア）
 * - その他: 任意の追加データ
 */
export type Metadata = {
  /**
   * LogContext追加用の予約フィールド
   *
   * ロギングペイロードにLogContextを追加する際に使用。
   * ユーザーコードでは使用しないこと（内部使用専用）。
   *
   * Go言語との対応:
   * - 構造体の予約フィールド（unexportedフィールド）
   */
  __context__?: undefined

  /**
   * Sentryブレッドクラム種別
   *
   * Sentryのブレッドクラム（パンくずリスト）タイプを指定。
   * デフォルトは'default'。
   *
   * @see https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/#breadcrumb-types
   *
   * Go言語との対応:
   * - 文字列リテラル型のユニオン（Goでは独自型定義が必要）
   */
  type?:
    | 'default' // デフォルト（汎用）
    | 'debug' // デバッグ情報
    | 'error' // エラー
    | 'navigation' // ナビゲーション（画面遷移）
    | 'http' // HTTP通信
    | 'info' // 情報
    | 'query' // クエリ（DB/API）
    | 'transaction' // トランザクション
    | 'ui' // UI操作
    | 'user' // ユーザーアクション

  /**
   * Sentryタグ
   *
   * Sentry.captureExceptionに渡されるタグ情報。
   * エラーの分類やフィルタリングに使用。
   *
   * @see https://github.com/getsentry/sentry-javascript/blob/903addf9a1a1534a6cb2ba3143654b918a86f6dd/packages/types/src/misc.ts#L65
   *
   * Go言語との対応:
   * - map[string]interface{} に相当
   */
  tags?: {
    [key: string]: number | string | boolean | null | undefined
  }

  /**
   * 任意の追加データ
   *
   * ログに付与する任意のメタデータ。
   * Sentryでは例外の'extra'パラメータまたはブレッドクラムの'data'パラメータとして渡される。
   *
   * Go言語との対応:
   * - インデックスシグネチャ（map[string]interface{}に相当）
   */
  [key: string]: Serializable | Error | unknown
}

/**
 * シリアライズ可能な型
 *
 * JSON変換可能な型の定義。
 * ログメタデータとして安全に送信できる型を保証。
 *
 * Go言語との対応:
 * - encoding/jsonでMarshal可能な型
 * - interface{}の制約版
 *
 * 許可される型:
 * - プリミティブ型（string, number, boolean, null, undefined）
 * - Serializable配列
 * - Serializableフィールドを持つオブジェクト
 */
export type Serializable =
  | string // 文字列
  | number // 数値
  | boolean // 真偽値
  | null // null
  | undefined // undefined
  | Serializable[] // シリアライズ可能な配列
  | {
      // シリアライズ可能なオブジェクト（再帰的定義）
      [key: string]: Serializable
    }
