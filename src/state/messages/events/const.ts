// メッセージイベントバスのポーリング間隔定数
// Message event bus polling interval constants

// デフォルトポーリング間隔（60秒） - 通常状態でのメッセージログチェック頻度
// Default polling interval (60 seconds) - frequency of message log checks in normal state
export const DEFAULT_POLL_INTERVAL = 60e3

// バックグラウンドポーリング間隔（5分） - アプリバックグラウンド時のバッテリー節約用長い間隔
// Background polling interval (5 minutes) - longer interval for battery saving when app is in background
export const BACKGROUND_POLL_INTERVAL = 60e3 * 5
