/**
 * 投稿リストフィードAPIモジュール
 *
 * 【概要】
 * 指定されたURI配列の投稿を取得するAPIクラス。
 * 特定の投稿を直接取得する場合に使用（通知、ブックマーク等）。
 *
 * 【主要機能】
 * - 複数の投稿URIを一括取得（最大25件）
 * - ページネーション非対応（1回の取得のみ）
 * - 投稿の存在確認とプレビュー
 *
 * 【使用例】
 * - 通知から投稿を取得
 * - ブックマークした投稿の一覧表示
 * - 特定の投稿セットの表示
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - Agent型はBskyAgentのベース型（インターフェース）
 */

// AT Protocol API型定義をインポート
import {
  type Agent, // Bluesky APIクライアントのベースインターフェース
  type AppBskyFeedDefs, // フィード関連の型定義
  type AppBskyFeedGetPosts, // 投稿取得API型
} from '@atproto/api'

// ロガーをインポート（警告・エラーログ出力用）
import {logger} from '#/logger'
// フィードAPI共通インターフェースをインポート
import {type FeedAPI, type FeedAPIResponse} from './types'

/**
 * 投稿リストフィードAPIクラス
 *
 * 【概要】
 * FeedAPIインターフェースを実装し、指定URIの投稿を取得。
 * （Goのinterface実装に相当）
 *
 * 【制限事項】
 * - 最大25件までのURI指定が可能
 * - ページネーション非対応（カーソルは使用しない）
 * - 取得は1回のみ
 *
 * 【Goユーザー向け補足】
 * - implements FeedAPIはGoのinterface実装に相当
 * - Agent型はinterface（BskyAgentが実装している）
 */
export class PostListFeedAPI implements FeedAPI {
  agent: Agent // Bluesky APIクライアント
  params: AppBskyFeedGetPosts.QueryParams // クエリパラメータ（URI配列）
  peek: AppBskyFeedDefs.FeedViewPost | null = null // キャッシュされた最初の投稿

  /**
   * コンストラクタ
   *
   * 【機能】
   * - URIリストを検証（25件制限チェック）
   * - パラメータを初期化
   *
   * 【Goユーザー向け補足】
   * Goのfunc NewPostListFeedAPI(agent Agent, feedParams GetPosts.QueryParams) *PostListFeedAPIに相当
   *
   * @param agent Bluesky APIクライアント
   * @param feedParams 投稿取得パラメータ（uris配列）
   */
  constructor({
    agent,
    feedParams,
  }: {
    agent: Agent
    feedParams: AppBskyFeedGetPosts.QueryParams
  }) {
    this.agent = agent

    // URIが25件を超える場合は警告を出力
    if (feedParams.uris.length > 25) {
      logger.warn(
        `Too many URIs provided - expected 25, got ${feedParams.uris.length}`,
      )
    }

    // 最大25件までに制限
    this.params = {
      uris: feedParams.uris.slice(0, 25),
    }
  }

  /**
   * 最新投稿を1件取得
   *
   * 【挙動】
   * - 既にfetch()を実行済みの場合、キャッシュから返す
   * - 未実行の場合はエラーをスロー
   *
   * 【Goユーザー向け補足】
   * - peekはキャッシュされた値を返す（副作用なし）
   * - Goでは: func (p *PostListFeedAPI) PeekLatest() (FeedViewPost, error)
   *
   * @returns キャッシュされた最初の投稿
   * @throws まだfetch()を実行していない場合エラー
   */
  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    if (this.peek) return this.peek
    throw new Error('Has not fetched yet')
  }

  /**
   * フィードを取得
   *
   * 【機能】
   * 指定されたURIの投稿を一括取得。
   * ページネーション非対応（1回の取得のみ）。
   *
   * 【HTTPリクエスト】
   * GET /xrpc/app.bsky.feed.getPosts?uris[]=...&uris[]=...
   *
   * 【Goユーザー向け補足】
   * - 引数のオブジェクトは空（ページネーション非対応）
   * - Goでは: func Fetch() (FeedAPIResponse, error)
   * - res.successはerr == nilに相当
   *
   * @returns フィード投稿配列（カーソルなし）
   */
  async fetch({}: {}): Promise<FeedAPIResponse> {
    // AT Protocol API呼び出し: getPosts（投稿取得）
    const res = await this.agent.app.bsky.feed.getPosts({
      ...this.params,
    })

    // リクエスト成功時
    if (res.success) {
      // 最初の投稿をキャッシュ（peekLatest用）
      this.peek = {post: res.data.posts[0]}

      return {
        // FeedViewPost形式に変換（postフィールドでラップ）
        feed: res.data.posts.map(post => ({post})),
      }
    }

    // エラー時は空配列を返す
    return {
      feed: [],
    }
  }
}
