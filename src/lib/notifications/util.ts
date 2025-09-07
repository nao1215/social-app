// アプリケーションのロガークラスをインポート
// Import application logger class
import {Logger} from '#/logger'

// 通知機能専用のロガーインスタンスを作成
// Create logger instance dedicated to notification functionality
export const logger = Logger.create(Logger.Context.Notifications)
