/**
 * ロガーユーティリティモジュール
 *
 * ロガーシステムで使用するヘルパー関数を提供。
 * ログレベルのフィルタリングとメタデータの前処理を担当。
 *
 * 主な機能:
 * - enabledLogLevels: 各ログレベルで有効なレベルのマッピング
 * - prepareMetadata: メタデータのシリアライズ可能形式への変換
 *
 * Go言語との対応:
 * - ユーティリティパッケージ（util/helpers）に相当
 */

// ログ型定義のインポート
import {LogLevel, Metadata, Serializable} from '#/logger/types'

/**
 * 有効なログレベルマッピング
 *
 * 各ログレベルで出力される全てのレベルを定義。
 * 例: levelがInfoの場合、Info以上（Info, Log, Warn, Error）が出力される。
 *
 * ログレベルのフィルタリングロジック:
 * - Debug: 全レベル出力（最も詳細）
 * - Info: Info以上のみ出力
 * - Log: Log以上のみ出力
 * - Warn: Warn以上のみ出力
 * - Error: Errorのみ出力（最も制限的）
 *
 * Go言語との対応:
 * - map[LogLevel][]LogLevel に相当
 * - slog.LevelVar の条件分岐ロジックに相当
 *
 * @example
 * enabledLogLevels[LogLevel.Info] // [LogLevel.Info, LogLevel.Log, LogLevel.Warn, LogLevel.Error]
 * enabledLogLevels[LogLevel.Error] // [LogLevel.Error]
 */
export const enabledLogLevels: {
  [key in LogLevel]: LogLevel[]
} = {
  // Debugレベル: 全てのログレベルを出力（開発環境用）
  [LogLevel.Debug]: [
    LogLevel.Debug,
    LogLevel.Info,
    LogLevel.Log,
    LogLevel.Warn,
    LogLevel.Error,
  ],
  // Infoレベル: Info以上を出力（一般的な設定）
  [LogLevel.Info]: [LogLevel.Info, LogLevel.Log, LogLevel.Warn, LogLevel.Error],
  // Logレベル: Log以上を出力
  [LogLevel.Log]: [LogLevel.Log, LogLevel.Warn, LogLevel.Error],
  // Warnレベル: 警告とエラーのみ出力
  [LogLevel.Warn]: [LogLevel.Warn, LogLevel.Error],
  // Errorレベル: エラーのみ出力（本番環境推奨）
  [LogLevel.Error]: [LogLevel.Error],
}

/**
 * メタデータを前処理してシリアライズ可能形式に変換
 *
 * ログメタデータ内のErrorオブジェクトを文字列に変換。
 * Errorオブジェクトはそのままではシリアライズできないため、
 * toString()で文字列表現に変換する。
 *
 * 処理内容:
 * 1. メタデータの全キーを走査
 * 2. 値がErrorインスタンスの場合、toString()で文字列化
 * 3. その他の値はそのまま維持
 * 4. 新しいオブジェクトとして返却
 *
 * Go言語との対応:
 * - map[string]interface{} の前処理関数
 * - error型のError()メソッド呼び出しに相当
 *
 * @param metadata - 前処理対象のメタデータオブジェクト
 * @returns シリアライズ可能な形式に変換されたメタデータ
 *
 * @example
 * const meta = {
 *   message: "エラー発生",
 *   error: new Error("Network timeout"),
 *   code: 500
 * }
 * const prepared = prepareMetadata(meta)
 * // {
 * //   message: "エラー発生",
 * //   error: "Error: Network timeout",
 * //   code: 500
 * // }
 */
export function prepareMetadata(
  metadata: Metadata,
): Record<string, Serializable> {
  // Object.keys().reduce()でメタデータを変換
  // Go言語のfor k, v := range mapに相当
  return Object.keys(metadata).reduce((acc, key) => {
    let value = metadata[key]

    // ErrorインスタンスをチェックしてtoString()で変換
    if (value instanceof Error) {
      value = value.toString() // "Error: message" 形式の文字列に変換
    }

    // 変換された値を新しいオブジェクトに追加
    return {...acc, [key]: value}
  }, {})
}
