// アクティブ状態でのポーリング間隔（4秒） - ユーザーが会話画面を開いている時の新着メッセージチェック頻度
// Active polling interval (4 seconds) - frequency of checking for new messages when user has conversation screen open
export const ACTIVE_POLL_INTERVAL = 4e3

// メッセージ画面でのポーリング間隔（30秒） - メッセージ一覧画面での更新頻度
// Message screen polling interval (30 seconds) - update frequency on message list screen
export const MESSAGE_SCREEN_POLL_INTERVAL = 30e3

// バックグラウンド状態でのポーリング間隔（60秒） - アプリが非アクティブ時の更新頻度
// Background polling interval (60 seconds) - update frequency when app is inactive
export const BACKGROUND_POLL_INTERVAL = 60e3

// 非アクティブタイムアウト（5分） - この時間を超えるとバックグラウンド状態とみなす
// Inactive timeout (5 minutes) - time after which the conversation is considered inactive
export const INACTIVE_TIMEOUT = 60e3 * 5

// ネットワーク障害として扱うHTTPステータスコード - これらのエラーは再試行可能と判断
// HTTP status codes treated as network failures - these errors are considered retryable
// 1: 一般的な接続エラー / Generic connection error
// 408: リクエストタイムアウト / Request timeout  
// 425: Too Early
// 429: レート制限 / Rate limit exceeded
// 500-504: サーバーエラー / Server errors
// 522, 524: Cloudflareタイムアウト / Cloudflare timeout errors
export const NETWORK_FAILURE_STATUSES = [
  1, 408, 425, 429, 500, 502, 503, 504, 522, 524,
]
