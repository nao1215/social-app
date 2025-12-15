/**
 * リストフィードAPIモジュール
 *
 * 【概要】
 * ユーザーが作成した「リスト」に含まれるユーザーの投稿を取得するAPIクラス。
 * Twitterのリスト機能と同様のコンセプト。
 *
 * 【リストとは】
 * - ユーザーが作成できるアカウントのグループ
 * - 特定のトピックや関心に基づいてユーザーをまとめる
 * - リストのメンバーの投稿だけを表示するフィード
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - implements FeedAPIはGoのinterface実装に相当
 */

/**
 * AT Protocol API型定義
 * Agent: APIクライアント（BskyAgentの基底型）
 * AppBskyFeedDefs: フィード関連の型定義
 * GetListFeed: リストフィード取得APIの型
 */
import {
  type Agent,
  type AppBskyFeedDefs,
  type AppBskyFeedGetListFeed as GetListFeed,
} from '@atproto/api'

/**
 * フィードAPI共通インターフェース
 */
import {type FeedAPI, type FeedAPIResponse} from './types'

/**
 * リストフィードAPIクラス
 *
 * 【概要】
 * 特定のリストに含まれるユーザーの投稿を取得する。
 * FeedAPIインターフェースを実装（Goのinterface実装に相当）。
 *
 * 【使用例】
 * ```typescript
 * const api = new ListFeedAPI({
 *   agent,
 *   feedParams: {list: 'at://did:plc:xxx/app.bsky.graph.list/yyy'}
 * })
 * const response = await api.fetch({cursor: undefined, limit: 30})
 * // response.feedにリストメンバーの投稿が含まれる
 * ```
 *
 * 【Goユーザー向け補足】
 * - params.list はリストのAT Protocol URI
 * - 例: at://did:plc:xxx/app.bsky.graph.list/3abc...
 */
export class ListFeedAPI implements FeedAPI {
  agent: Agent                    // APIクライアント
  params: GetListFeed.QueryParams // クエリパラメータ（リストURI）

  /**
   * コンストラクタ
   *
   * @param agent APIクライアント
   * @param feedParams フィード取得パラメータ（list: リストURI）
   */
  constructor({
    agent,
    feedParams,
  }: {
    agent: Agent
    feedParams: GetListFeed.QueryParams
  }) {
    this.agent = agent
    this.params = feedParams
  }

  /**
   * 最新投稿を1件取得
   *
   * 【用途】
   * - リストフィードの新着チェック
   * - プレビュー表示
   *
   * 【HTTPリクエスト】
   * GET /xrpc/app.bsky.feed.getListFeed?list=...&limit=1
   *
   * @returns 最新の投稿1件
   */
  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.agent.app.bsky.feed.getListFeed({
      ...this.params,
      limit: 1, // 1件のみ取得
    })
    return res.data.feed[0]
  }

  /**
   * リストフィードを取得
   *
   * 【機能】
   * リストに含まれるユーザーの投稿を時系列で取得。
   * ページネーション対応。
   *
   * 【HTTPリクエスト】
   * GET /xrpc/app.bsky.feed.getListFeed
   *
   * @param cursor ページネーションカーソル（undefined = 最初のページ）
   * @param limit 取得件数
   * @returns フィード投稿配列とカーソル
   */
  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const res = await this.agent.app.bsky.feed.getListFeed({
      ...this.params,
      cursor, // ページネーションカーソル
      limit,  // 取得件数
    })

    // リクエスト成功時
    if (res.success) {
      return {
        cursor: res.data.cursor, // 次ページ用のカーソル
        feed: res.data.feed,     // 投稿配列
      }
    }

    // エラー時は空配列を返す
    return {
      feed: [],
    }
  }
}
