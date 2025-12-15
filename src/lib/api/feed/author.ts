/**
 * 著者フィードAPIモジュール
 *
 * 【概要】
 * 特定ユーザー（著者）の投稿フィードを取得するAPIクラス。
 * ユーザープロフィール画面で使用される。
 *
 * 【主要機能】
 * - ユーザーの投稿一覧取得（フィルタリング対応）
 * - ピン留め投稿の取得
 * - 著者スレッドのフィルタリング（本人の連続返信のみ表示）
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - async/awaitは非同期HTTP通信を扱う構文
 * - BskyAgentはHTTPクライアントに相当（http.Clientのようなもの）
 */

// AT Protocol API型定義をインポート
import {
  AppBskyFeedDefs, // フィード関連の型
  type AppBskyFeedGetAuthorFeed as GetAuthorFeed, // 著者フィード取得API型
  type BskyAgent, // Bluesky APIクライアント
} from '@atproto/api'

// フィードAPI共通インターフェースをインポート
import {type FeedAPI, type FeedAPIResponse} from './types'

/**
 * 著者フィードAPIクラス
 *
 * 【概要】
 * 特定ユーザーの投稿フィードを取得するAPIクラス。
 * FeedAPIインターフェースを実装（Goのinterface実装に相当）
 *
 * 【フィルタリングモード】
 * - posts_and_author_threads: 投稿と著者スレッド（本人の連続返信）
 * - posts_with_replies: 全ての投稿（返信含む）
 * - posts_no_replies: 投稿のみ（返信除外）
 * - posts_with_media: メディア付き投稿のみ
 *
 * 【Goユーザー向け補足】
 * - implements FeedAPIはGoのinterface実装に相当
 * - Getterメソッド（get params()）はGoではシンプルな関数として実装
 */
export class AuthorFeedAPI implements FeedAPI {
  agent: BskyAgent // Bluesky APIクライアント（HTTPクライアント）
  _params: GetAuthorFeed.QueryParams // クエリパラメータ（内部用）

  /**
   * コンストラクタ
   *
   * 【Goユーザー向け補足】
   * Goのfunc NewAuthorFeedAPI(agent BskyAgent, feedParams GetAuthorFeed.QueryParams) *AuthorFeedAPIに相当
   *
   * @param agent Bluesky APIクライアント
   * @param feedParams フィード取得パラメータ（actor, filterなど）
   */
  constructor({
    agent,
    feedParams,
  }: {
    agent: BskyAgent
    feedParams: GetAuthorFeed.QueryParams
  }) {
    this.agent = agent
    this._params = feedParams
  }

  /**
   * パラメータのゲッター
   *
   * 【機能】
   * - フィルタモードに応じてピン留め投稿の取得フラグを設定
   * - posts_and_author_threadsモードの場合のみピン留めを取得
   *
   * 【Goユーザー向け補足】
   * Goでは通常の関数として実装: func (a *AuthorFeedAPI) Params() GetAuthorFeed.QueryParams
   */
  get params() {
    const params = {...this._params} // パラメータをコピー（元を変更しない）
    // posts_and_author_threadsフィルタの場合、ピン留め投稿を含める
    params.includePins = params.filter === 'posts_and_author_threads'
    return params
  }

  /**
   * 最新投稿を1件取得
   *
   * 【用途】
   * フィードの新着チェックやプレビュー表示に使用。
   *
   * 【Goユーザー向け補足】
   * - asyncはGoのgoroutineとは異なり、非同期I/O用の構文
   * - awaitでHTTPレスポンスを待機（Goのresp, err := http.Get()に相当）
   *
   * @returns 最新の投稿1件
   */
  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    // AT Protocol API呼び出し: getAuthorFeed（著者フィード取得）
    // 【HTTPリクエスト】GET /xrpc/app.bsky.feed.getAuthorFeed
    const res = await this.agent.getAuthorFeed({
      ...this.params,
      limit: 1, // 1件のみ取得
    })
    return res.data.feed[0]
  }

  /**
   * フィードを取得
   *
   * 【機能】
   * - ページネーション対応のフィード取得
   * - フィルタモードに応じた投稿フィルタリング
   *
   * 【Goユーザー向け補足】
   * - オブジェクト引数はGoの関数オプションパターンに相当
   * - 例: func Fetch(cursor *string, limit int) (FeedAPIResponse, error)
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
    // AT Protocol API呼び出し
    const res = await this.agent.getAuthorFeed({
      ...this.params,
      cursor,
      limit,
    })
    if (res.success) {
      return {
        cursor: res.data.cursor, // 次ページ用のカーソル
        feed: this._filter(res.data.feed), // フィルタリング適用
      }
    }
    // エラー時は空配列を返す
    return {
      feed: [],
    }
  }

  /**
   * フィードをフィルタリング
   *
   * 【機能】
   * posts_and_author_threadsモードの場合、著者自身のスレッド投稿のみを表示。
   * 他人への返信は除外される。
   *
   * 【フィルタリングロジック】
   * 1. 返信でない投稿 → 常に表示
   * 2. リポストまたはピン留め投稿 → 常に表示
   * 3. 返信投稿 → 著者スレッド判定関数でチェック
   *
   * @param feed フィルタリング前の投稿配列
   * @returns フィルタリング済みの投稿配列
   */
  _filter(feed: AppBskyFeedDefs.FeedViewPost[]) {
    if (this.params.filter === 'posts_and_author_threads') {
      return feed.filter(post => {
        const isReply = post.reply // 返信投稿か
        const isRepost = AppBskyFeedDefs.isReasonRepost(post.reason) // リポストか
        const isPin = AppBskyFeedDefs.isReasonPin(post.reason) // ピン留めか
        if (!isReply) return true // 返信でなければ表示
        if (isRepost || isPin) return true // リポストまたはピン留めなら表示
        // 著者スレッド判定（本人の連続返信チェーン）
        return isReply && isAuthorReplyChain(this.params.actor, post, feed)
      })
    }

    // その他のフィルタモードはそのまま返す
    return feed
  }
}

/**
 * 著者返信チェーン判定
 *
 * 【概要】
 * 投稿が著者自身の連続返信チェーンか判定する。
 * 他人への返信は除外される。
 *
 * 【判定ロジック】
 * 1. 現在の投稿が対象ユーザーでない → false
 * 2. 親投稿が他人 → false
 * 3. 親投稿が存在しない or 著者本人 → 再帰的に親をチェック
 *
 * 【Goユーザー向け補足】
 * - 再帰関数（Goでも同様に実装可能）
 * - func isAuthorReplyChain(actor string, post FeedViewPost, posts []FeedViewPost) bool
 *
 * @param actor 対象ユーザーのDID
 * @param post チェック対象の投稿
 * @param posts フィード内の全投稿（親投稿検索用）
 * @returns 著者スレッドの場合true
 */
function isAuthorReplyChain(
  actor: string,
  post: AppBskyFeedDefs.FeedViewPost,
  posts: AppBskyFeedDefs.FeedViewPost[],
): boolean {
  // 現在の投稿が対象ユーザーでない場合は除外（起こり得ないはずだが安全のため）
  if (post.post.author.did !== actor) return false

  const replyParent = post.reply?.parent // 親投稿

  if (AppBskyFeedDefs.isPostView(replyParent)) {
    // 親投稿が他人の場合は除外
    if (replyParent.author.did !== actor) return false

    // フィード内でトップレベルの親投稿を検索
    const parentPost = posts.find(p => p.post.uri === replyParent.uri)

    /*
     * 親投稿がトップレベルで見つからない場合：
     * - まだフェッチしていない、または
     * - feedItem.reply.parentにのみ存在（既にチェック済み）
     * → 著者スレッドと判定
     */
    if (!parentPost) return true

    // 親投稿に対して再帰的にチェック
    return isAuthorReplyChain(actor, parentPost, posts)
  }

  // デフォルトは表示（安全側に倒す）
  return true
}
