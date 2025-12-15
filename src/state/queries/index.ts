/**
 * @fileoverview クエリ設定定数モジュール / Query configuration constants module
 *
 * 【概要】
 * TanStack Query で使用するキャッシュ有効期限（staleTime）の定数定義を提供します。
 * staleTime はデータが「新鮮（fresh）」とみなされる期間を設定し、その期間内は
 * 再取得を行わずキャッシュデータを使用します。
 *
 * 【Go言語ユーザー向け補足】
 * - TanStack Query: Goのcontext.Contextやsingleflightに相当するデータ取得・キャッシュライブラリ
 * - staleTime: データの有効期限設定（Goのキャッシュライブラリの TTL に相当）
 * - const: Goのconstキーワードと同様の定数宣言（実行時変更不可）
 * - export: Goのパッケージ公開機能に相当（大文字開始の識別子と同等）
 *
 * 【使用例】
 * ```typescript
 * useQuery({
 *   queryKey: ['user', userId],
 *   queryFn: fetchUser,
 *   staleTime: STALE.MINUTES.FIVE, // 5分間はキャッシュを使用
 * })
 * ```
 */

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
