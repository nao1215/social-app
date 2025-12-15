/**
 * いいねフィードAPIモジュール
 *
 * 【概要】
 * 特定ユーザーが「いいね」した投稿の一覧を取得するAPIクラス。
 * ユーザープロフィール画面の「いいね」タブで使用される。
 *
 * 【主要機能】
 * - ユーザーのいいね履歴取得
 * - ページネーション対応
 * - 空ページのカーソルバグ修正
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - async/awaitはHTTPリクエストを扱う非同期処理構文
 */

// AT Protocol API型定義をインポート
import {
  AppBskyFeedDefs, // フィード関連の型定義
  AppBskyFeedGetActorLikes as GetActorLikes, // いいね取得API型
  BskyAgent, // Bluesky APIクライアント
} from '@atproto/api'

// フィードAPI共通インターフェースをインポート
import {FeedAPI, FeedAPIResponse} from './types'

/**
 * いいねフィードAPIクラス
 *
 * 【概要】
 * FeedAPIインターフェースを実装し、ユーザーのいいね履歴を提供。
 * （Goのinterface実装に相当）
 *
 * 【使用例】
 * ```typescript
 * const api = new LikesFeedAPI({
 *   agent,
 *   feedParams: {actor: 'did:plc:xxx...'}
 * })
 * const response = await api.fetch({cursor: undefined, limit: 30})
 * // response.feedにいいねした投稿が含まれる
 * ```
 *
 * 【Goユーザー向け補足】
 * - implements FeedAPIはGoのinterface実装に相当
 * - BskyAgentはHTTPクライアント（http.Clientのようなもの）
 */
export class LikesFeedAPI implements FeedAPI {
  agent: BskyAgent // Bluesky APIクライアント
  params: GetActorLikes.QueryParams // クエリパラメータ（actor DID）

  /**
   * コンストラクタ
   *
   * 【Goユーザー向け補足】
   * Goのfunc NewLikesFeedAPI(agent BskyAgent, feedParams GetActorLikes.QueryParams) *LikesFeedAPIに相当
   *
   * @param agent Bluesky APIクライアント
   * @param feedParams いいね取得パラメータ（actor: ユーザーDID）
   */
  constructor({
    agent,
    feedParams,
  }: {
    agent: BskyAgent
    feedParams: GetActorLikes.QueryParams
  }) {
    this.agent = agent
    this.params = feedParams
  }

  /**
   * 最新のいいね投稿を1件取得
   *
   * 【用途】
   * - いいね履歴の更新検出
   * - プレビュー表示
   *
   * 【HTTPリクエスト】
   * GET /xrpc/app.bsky.feed.getActorLikes?actor=...&limit=1
   *
   * 【Goユーザー向け補足】
   * - async/awaitは非同期I/O処理を扱う構文
   * - awaitはHTTPレスポンスを待機（Goのgoroutineとは異なる）
   * - Promiseはfuture/completionパターンに相当
   *
   * @returns 最新のいいね投稿1件
   */
  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    // AT Protocol API呼び出し: getActorLikes（いいね取得）
    const res = await this.agent.getActorLikes({
      ...this.params,
      limit: 1, // 1件のみ取得
    })
    return res.data.feed[0]
  }

  /**
   * いいねフィードを取得
   *
   * 【機能】
   * ユーザーがいいねした投稿を時系列で取得。
   * ページネーション対応で、カーソルを使って次ページを取得可能。
   *
   * 【バグ修正】
   * APIが空ページでもカーソルを返すバグがあるため、
   * 投稿が0件の場合はカーソルをundefinedにする。
   *
   * 【HTTPリクエスト】
   * GET /xrpc/app.bsky.feed.getActorLikes
   *
   * 【Goユーザー向け補足】
   * - オブジェクト引数: Goの関数オプションパターンに相当
   * - 例: func Fetch(opts FetchOptions) (FeedAPIResponse, error)
   * - res.successはGoのerr == nilに相当
   *
   * @param cursor ページネーションカーソル（undefined = 最初のページ）
   * @param limit 取得件数（通常30件）
   * @returns いいね投稿配列とカーソル
   */
  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    // AT Protocol API呼び出し
    const res = await this.agent.getActorLikes({
      ...this.params,
      cursor, // ページネーションカーソル
      limit, // 取得件数
    })

    // リクエスト成功時
    if (res.success) {
      // HACKFIX: APIが空ページでもカーソルを返すバグへの対処
      // APIは投稿が0件でもcursorを返してしまうため、明示的にチェックする
      const isEmptyPage = res.data.feed.length === 0

      return {
        // 空ページの場合はカーソルをundefinedに上書き
        cursor: isEmptyPage ? undefined : res.data.cursor,
        feed: res.data.feed, // いいね投稿配列
      }
    }

    // エラー時は空配列を返す
    return {
      feed: [],
    }
  }
}
