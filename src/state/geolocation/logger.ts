// アプリケーション共通のロガーライブラリをインポート
import {Logger} from '#/logger'

/**
 * 位置情報専用のロガーインスタンス
 * Geolocationコンテキストでログを出力するように設定済み
 * デバッグ情報、エラー情報などを適切にフィルタリング・記録する
 */
export const logger = Logger.create(Logger.Context.Geolocation)
