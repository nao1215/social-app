// アプリケーションのロガーユーティリティをインポート
// Import application logger utility
import {Logger} from '#/logger'

/**
 * 年齢認証関連のログを出力するためのロガーインスタンス
 * 年齢認証の処理過程やエラーを追跡するためのデバッグ情報を提供する
 * 
 * Logger instance for outputting age assurance related logs.
 * Provides debugging information to track age assurance processes and errors.
 */
export const logger = Logger.create(Logger.Context.AgeAssurance)
