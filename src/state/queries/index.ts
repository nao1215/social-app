// 時間単位の定数定義 / Time unit constants
const SECOND = 1e3 // 1秒（ミリ秒） / 1 second in milliseconds
const MINUTE = SECOND * 60 // 1分（ミリ秒） / 1 minute in milliseconds
const HOUR = MINUTE * 60 // 1時間（ミリ秒） / 1 hour in milliseconds

/**
 * キャッシュの有効期限設定 / Cache stale time settings
 * クエリデータがいつまで新しいとみなされるかを定義します
 * Defines how long query data is considered fresh
 */
export const STALE = {
  SECONDS: {
    FIFTEEN: 15 * SECOND, // 15秒 / 15 seconds
    THIRTY: 30 * SECOND, // 30秒 / 30 seconds
  },
  MINUTES: {
    ONE: MINUTE, // 1分 / 1 minute
    THREE: 3 * MINUTE, // 3分 / 3 minutes
    FIVE: 5 * MINUTE, // 5分 / 5 minutes
    THIRTY: 30 * MINUTE, // 30分 / 30 minutes
  },
  HOURS: {
    ONE: HOUR, // 1時間 / 1 hour
  },
  INFINITY: Infinity, // 無期限（再取得しない） / Infinite (never refetch)
}
