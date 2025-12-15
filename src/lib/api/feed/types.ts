/**
 * フィードAPI型定義モジュール
 *
 * 【概要】
 * Blueskyのフィード（タイムライン）取得APIの共通インターフェース定義。
 * 様々なフィードタイプ（ホーム、フォロー中、カスタムフィードなど）に
 * 統一的なインターフェースを提供する。
 *
 * 【Goユーザー向け補足】
 * - interfaceはGoのinterfaceに相当（メソッドシグネチャの定義）
 * - async/awaitはGoのgoroutineとは異なり、非同期I/O処理用の構文
 * - Promiseはfuture/completionに相当（非同期処理の結果を表現）
 *
 * 【使用例】
 * ```typescript
 * const api: FeedAPI = new FollowingFeedAPI({agent})
 * const response = await api.fetch({cursor: undefined, limit: 30})
 * // responseにはフィード投稿とカーソル（次ページ用）が含まれる
 * ```
 */

// AT Protocol APIのフィード型定義をインポート
import {AppBskyFeedDefs} from '@atproto/api'

/**
 * フィードAPIレスポンス
 *
 * フィード取得APIの共通レスポンス型（Goのstructに相当）
 */
export interface FeedAPIResponse {
  cursor?: string // 次ページ取得用のカーソル（ページネーション）
  feed: AppBskyFeedDefs.FeedViewPost[] // 投稿配列
}

/**
 * フィードAPI
 *
 * 【概要】
 * 全てのフィードAPIが実装すべきインターフェース。
 * （Goのinterfaceに相当）
 *
 * 【メソッド】
 * - peekLatest: 最新投稿を1件だけ取得（新着チェック用）
 * - fetch: フィードを取得（ページネーション対応）
 *
 * 【Goユーザー向け補足】
 * - async/awaitは非同期I/O処理を扱う構文
 * - Promiseはチャネルに送信される将来の値のようなもの
 * - HTTPリクエストはawaitで待機し、完了まで処理をブロックしない
 */
export interface FeedAPI {
  /**
   * 最新投稿を1件取得
   *
   * フィードの最新投稿をプレビュー取得する。
   * 新着通知やフィードの更新検出に使用。
   *
   * @returns 最新の投稿1件
   */
  peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost>

  /**
   * フィードを取得
   *
   * 【引数】
   * - cursor: ページネーション用のカーソル（undefined = 最初のページ）
   * - limit: 取得件数（通常30件）
   *
   * 【Goユーザー向け補足】
   * - オブジェクト引数は、Goの関数オプションパターンに相当
   * - 例: fetch({cursor: "abc", limit: 30})
   *
   * @returns フィード投稿配列とカーソル
   */
  fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse>
}

/**
 * フィードソース理由
 *
 * 【概要】
 * カスタムフィードから取得された投稿に付与される理由情報。
 * どのフィードから来たかを追跡するために使用。
 *
 * 【フィールド】
 * - $type: 型識別子（AT Protocolの型システム）
 * - uri: フィードのURI（at://...）
 * - href: フィードへのリンクURL
 */
export interface ReasonFeedSource {
  $type: 'reasonFeedSource' // 型識別子（AT Protocolの慣例）
  uri: string // フィードURI
  href: string // フィードへのリンク
}

/**
 * フィードソース理由の型ガード
 *
 * 【概要】
 * TypeScriptの型ガード関数。値がReasonFeedSource型かを判定。
 *
 * 【Goユーザー向け補足】
 * - TypeScriptでは実行時に型情報が失われるため、型ガード関数が必要
 * - Goの型アサーション: v, ok := value.(Type) に相当
 * - 戻り値の型アノテーション `v is Type` は特殊な型述語
 *
 * @param v 判定対象の値
 * @returns ReasonFeedSource型の場合true
 */
export function isReasonFeedSource(v: unknown): v is ReasonFeedSource {
  return (
    !!v && // nullチェック
    typeof v === 'object' && // オブジェクトか確認
    '$type' in v && // $typeフィールドが存在するか
    v.$type === 'reasonFeedSource' // $typeの値が正しいか
  )
}
