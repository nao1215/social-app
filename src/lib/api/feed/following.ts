/**
 * フォロー中フィードAPIモジュール
 *
 * 【概要】
 * ユーザーがフォローしているアカウントの投稿を時系列で取得するAPIクラス。
 * いわゆる「フォロー中タイムライン」を実装する。
 *
 * 【主要機能】
 * - フォロー中ユーザーの投稿を時系列で取得
 * - ページネーション対応
 * - 新着投稿のプレビュー取得
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - async/awaitはHTTPリクエストを扱う非同期処理構文
 * - Promiseはチャネルに送られる将来の値のようなもの
 */

// AT Protocol API型定義をインポート
import {AppBskyFeedDefs, BskyAgent} from '@atproto/api'

// フィードAPI共通インターフェースをインポート
import {FeedAPI, FeedAPIResponse} from './types'

/**
 * フォロー中フィードAPIクラス
 *
 * 【概要】
 * FeedAPIインターフェースを実装し、フォロー中タイムラインを提供。
 * （Goのinterface実装に相当）
 *
 * 【使用例】
 * ```typescript
 * const api = new FollowingFeedAPI({agent})
 * const response = await api.fetch({cursor: undefined, limit: 30})
 * // response.feedにフォロー中ユーザーの投稿が含まれる
 * ```
 *
 * 【Goユーザー向け補足】
 * - implements FeedAPIはGoのinterface実装に相当
 * - BskyAgentはhttp.Clientのようなもの（HTTPクライアント）
 */
export class FollowingFeedAPI implements FeedAPI {
  agent: BskyAgent // Bluesky APIクライアント

  /**
   * コンストラクタ
   *
   * 【Goユーザー向け補足】
   * Goのfunc NewFollowingFeedAPI(agent BskyAgent) *FollowingFeedAPIに相当
   *
   * @param agent Bluesky APIクライアント
   */
  constructor({agent}: {agent: BskyAgent}) {
    this.agent = agent
  }

  /**
   * 最新投稿を1件取得
   *
   * 【用途】
   * - 新着通知の表示
   * - フィードの更新検出
   * - プレビュー表示
   *
   * 【HTTPリクエスト】
   * GET /xrpc/app.bsky.feed.getTimeline?limit=1
   *
   * 【Goユーザー向け補足】
   * - async/awaitは非同期I/O処理を扱う構文
   * - awaitはHTTPレスポンスを待機（Goのgoroutineとは異なる）
   * - Promiseはfuture/completionパターンに相当
   *
   * @returns 最新の投稿1件
   */
  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    // AT Protocol API呼び出し: getTimeline（タイムライン取得）
    const res = await this.agent.getTimeline({
      limit: 1, // 1件のみ取得
    })
    return res.data.feed[0]
  }

  /**
   * フィードを取得
   *
   * 【機能】
   * フォロー中ユーザーの投稿を時系列で取得。
   * ページネーション対応で、カーソルを使って次ページを取得可能。
   *
   * 【HTTPリクエスト】
   * GET /xrpc/app.bsky.feed.getTimeline
   *
   * 【ページネーション】
   * - cursor: undefined → 最初のページ
   * - cursor: "abc..." → 次のページ
   * - response.cursor: undefined → 最後のページ
   *
   * 【Goユーザー向け補足】
   * - オブジェクト引数: Goの関数オプションパターンに相当
   * - 例: func Fetch(opts FetchOptions) (FeedAPIResponse, error)
   * - res.successはGoのerr == nilに相当
   *
   * @param cursor ページネーションカーソル（undefined = 最初のページ）
   * @param limit 取得件数（通常30件）
   * @returns フィード投稿配列とカーソル
   */
  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    // AT Protocol API呼び出し
    const res = await this.agent.getTimeline({
      cursor, // ページネーションカーソル
      limit, // 取得件数
    })

    // リクエスト成功時
    if (res.success) {
      return {
        cursor: res.data.cursor, // 次ページ用のカーソル（最後のページの場合undefined）
        feed: res.data.feed, // 投稿配列
      }
    }

    // エラー時は空配列を返す
    return {
      feed: [],
    }
  }
}
