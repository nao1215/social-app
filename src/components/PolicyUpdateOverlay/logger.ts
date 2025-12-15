/**
 * @file ポリシー更新モジュール専用ロガー
 * @description ポリシー更新に関するログ出力を管理
 *
 * このモジュールは、ポリシー更新機能専用のロガーインスタンスを提供します。
 * すべてのポリシー更新関連のログは、このロガーを通じて記録されます。
 */

// ロガーシステム（Console, Sentry, Bitdriftへのログ出力を統一管理）
import {Logger} from '#/logger'

/**
 * ポリシー更新専用ロガーインスタンス
 *
 * @description
 * ポリシー更新に関するすべてのログ記録に使用されます。
 * Logger.Context.PolicyUpdate コンテキストでログが分類され、
 * デバッグ時にポリシー更新関連のログのみをフィルタリングできます。
 *
 * @constant
 * @type {Logger}
 *
 * @example
 * ```typescript
 * logger.debug('state', { completed: true })
 * logger.info('user completed policy update')
 * logger.error('failed to save policy update', error)
 * ```
 */
export const logger = Logger.create(Logger.Context.PolicyUpdate)
