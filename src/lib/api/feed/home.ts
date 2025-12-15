/**
 * ホームフィードAPIモジュール
 *
 * 【概要】
 * Blueskyのホーム画面で表示されるフィードを提供するAPIクラス。
 * フォロー中フィードと探索（Discover）フィードを組み合わせて、
 * 常にコンテンツを表示できるようにする。
 *
 * 【動作原理】
 * 1. まずフォロー中フィードを表示
 * 2. フォロー中の投稿が尽きたら探索フィードにフォールバック
 * 3. フォールバック時はマーカー投稿を挿入（UI表示用）
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - implements FeedAPIはGoのinterface実装に相当
 */

/**
 * AT Protocol API型定義
 * AppBskyFeedDefs: フィード関連の型定義
 * BskyAgent: APIクライアント
 */
import {type AppBskyFeedDefs, type BskyAgent} from '@atproto/api'

/**
 * PROD_DEFAULT_FEED: 本番環境のデフォルトフィードURI生成関数
 */
import {PROD_DEFAULT_FEED} from '#/lib/constants'

/**
 * CustomFeedAPI: カスタムフィード（フィードジェネレータ）API
 */
import {CustomFeedAPI} from './custom'

/**
 * FollowingFeedAPI: フォロー中ユーザーのフィードAPI
 */
import {FollowingFeedAPI} from './following'

/**
 * FeedAPI: フィードAPIの共通インターフェース
 * FeedAPIResponse: フィード取得結果の型
 */
import {type FeedAPI, type FeedAPIResponse} from './types'

/**
 * フォールバックマーカー投稿
 *
 * 【概要】
 * フォロー中フィードから探索フィードへ切り替わるタイミングを
 * UIに通知するためのダミー投稿。
 *
 * 【なぜ必要か】
 * フィードAPIは投稿以外のデータを返す仕組みがないため、
 * 「ここから探索フィードです」というメッセージを
 * ダミー投稿として挿入する（ハック的手法）。
 *
 * 【使用箇所】
 * Feed.tsx でこのマーカーを検出し、
 * 「フォロー中の投稿が終わりました」的なUIを表示。
 *
 * 【Goユーザー向け補足】
 * - export const は Go の var で外部公開する変数に相当
 * - オブジェクトリテラルは Go の struct 初期化に相当
 */
// HACK
// the feed API does not include any facilities for passing down
// non-post elements. adding that is a bit of a heavy lift, and we
// have just one temporary usecase for it: flagging when the home feed
// falls back to discover.
// we use this fallback marker post to drive this instead. see Feed.tsx
// for the usage.
// -prf
export const FALLBACK_MARKER_POST: AppBskyFeedDefs.FeedViewPost = {
  post: {
    uri: 'fallback-marker-post',  // ダミーURI（識別用）
    cid: 'fake',                  // ダミーCID
    record: {},                   // 空のレコード
    author: {
      did: 'did:fake',           // ダミーDID
      handle: 'fake.com',        // ダミーハンドル
    },
    indexedAt: new Date().toISOString(),  // 現在時刻
  },
}

/**
 * ホームフィードAPIクラス
 *
 * 【概要】
 * ホーム画面のフィードを管理するクラス。
 * フォロー中フィードと探索フィードを組み合わせて、
 * ユーザーに常にコンテンツを提供する。
 *
 * 【アーキテクチャ】
 * - FollowingFeedAPI: プライマリフィード（フォロー中）
 * - CustomFeedAPI: フォールバック用（探索/whats-hot）
 *
 * 【状態管理】
 * - usingDiscover: 現在探索フィードを使用中か
 * - itemCursor: 内部カーソル位置
 *
 * 【Goユーザー向け補足】
 * - implements FeedAPIはGoのinterface実装に相当
 * - classのフィールドはGoのstruct fieldに相当
 */
export class HomeFeedAPI implements FeedAPI {
  agent: BskyAgent               // Bluesky APIクライアント
  following: FollowingFeedAPI    // フォロー中フィードAPI
  discover: CustomFeedAPI        // 探索フィードAPI（フォールバック用）
  usingDiscover = false          // 探索フィード使用中フラグ
  itemCursor = 0                 // 内部カーソル位置
  userInterests?: string         // ユーザーの興味（パーソナライズ用）

  /**
   * コンストラクタ
   *
   * 【初期化処理】
   * 1. フォロー中フィードAPIを初期化
   * 2. 探索フィードAPI（whats-hot）を初期化
   *
   * @param userInterests ユーザーの興味（オプション）
   * @param agent Bluesky APIクライアント
   */
  constructor({
    userInterests,
    agent,
  }: {
    userInterests?: string
    agent: BskyAgent
  }) {
    this.agent = agent
    this.following = new FollowingFeedAPI({agent})
    // whats-hot フィードをフォールバックとして設定
    this.discover = new CustomFeedAPI({
      agent,
      feedParams: {feed: PROD_DEFAULT_FEED('whats-hot')},
    })
    this.userInterests = userInterests
  }

  /**
   * 状態をリセット
   *
   * 【用途】
   * - ページの最初に戻る時
   * - リフレッシュ時
   *
   * 【処理内容】
   * 1. フォロー中フィードAPIを再作成
   * 2. 探索フィードAPIを再作成
   * 3. フラグとカーソルをリセット
   */
  reset() {
    this.following = new FollowingFeedAPI({agent: this.agent})
    this.discover = new CustomFeedAPI({
      agent: this.agent,
      feedParams: {feed: PROD_DEFAULT_FEED('whats-hot')},
      userInterests: this.userInterests,
    })
    this.usingDiscover = false
    this.itemCursor = 0
  }

  /**
   * 最新投稿を1件取得
   *
   * 【動作】
   * 現在使用中のフィード（following or discover）から
   * 最新の投稿を1件取得する。
   *
   * @returns 最新の投稿1件
   */
  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    if (this.usingDiscover) {
      return this.discover.peekLatest()
    }
    return this.following.peekLatest()
  }

  /**
   * フィードを取得
   *
   * 【動作フロー】
   * 1. カーソルがない場合は状態をリセット
   * 2. フォロー中フィードから取得を試みる
   * 3. フォロー中の投稿が尽きたら（cursor=undefined）:
   *    - フォールバックマーカーを挿入
   *    - 探索フィードに切り替え
   * 4. 探索フィードから追加で取得
   *
   * 【__DEV__について】
   * 開発モードでは探索フィードを使用しない
   * （デバッグ時にノイズを減らすため）
   *
   * @param cursor ページネーションカーソル
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
    // 最初のページ（カーソルなし）の場合は状態をリセット
    if (!cursor) {
      this.reset()
    }

    let returnCursor
    let posts: AppBskyFeedDefs.FeedViewPost[] = []

    // フォロー中フィードから取得
    if (!this.usingDiscover) {
      const res = await this.following.fetch({cursor, limit})
      returnCursor = res.cursor
      posts = posts.concat(res.feed)

      // フォロー中の投稿が尽きた場合（cursorがundefined）
      if (!returnCursor) {
        cursor = ''
        // マーカー投稿を挿入（UIで「ここから探索フィードです」と表示）
        posts.push(FALLBACK_MARKER_POST)
        // 探索フィードに切り替え
        this.usingDiscover = true
      }
    }

    // 探索フィードから取得（本番環境のみ）
    // __DEV__: 開発モードフラグ（Metro bundlerが設定）
    if (this.usingDiscover && !__DEV__) {
      const res = await this.discover.fetch({cursor, limit})
      returnCursor = res.cursor
      posts = posts.concat(res.feed)
    }

    return {
      cursor: returnCursor,
      feed: posts,
    }
  }
}
