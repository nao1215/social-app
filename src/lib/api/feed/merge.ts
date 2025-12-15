/**
 * マージフィードAPIモジュール
 *
 * 【概要】
 * 複数のフィードソース（フォロー中 + カスタムフィード）を
 * 統合して1つのフィードとして表示するためのAPIクラス群。
 *
 * 【主な機能】
 * - フォロー中フィードとカスタムフィードの統合
 * - 複数フィードのサンプリングとインターリーブ（織り交ぜ）
 * - フィードのプリフェッチとキューイング
 *
 * 【アルゴリズム】
 * 1. フォロー中フィードを常に優先
 * 2. 一定間隔（4件目、5件目等）でカスタムフィードを織り交ぜる
 * 3. フォロー中の投稿が尽きたらカスタムフィードのみ表示
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - shuffleはfisher-yatesシャッフルアルゴリズム
 * - Promise.all()は複数goroutineの完了待ち（sync.WaitGroup相当）
 */

/**
 * AT Protocol API型定義
 * AppBskyFeedDefs: フィード関連の型定義
 * AppBskyFeedGetTimeline: タイムライン取得APIの型
 * BskyAgent: APIクライアント
 */
import {AppBskyFeedDefs, AppBskyFeedGetTimeline, BskyAgent} from '@atproto/api'

/**
 * lodash.shuffle: 配列をランダムシャッフルする関数
 * フィードソースの順序をランダム化して偏りを防ぐ
 */
import shuffle from 'lodash.shuffle'

/**
 * bundleAsync: 複数の同時呼び出しを1つにまとめるユーティリティ
 * 同じ処理が複数回呼ばれても1回だけ実行される
 */
import {bundleAsync} from '#/lib/async/bundle'

/**
 * timeout: タイムアウト付きPromiseを作成
 * 遅いフィードジェネレータに足を引っ張られないようにする
 */
import {timeout} from '#/lib/async/timeout'

/**
 * feedUriToHref: フィードURIをURL形式に変換
 * at://... → https://bsky.app/profile/.../feed/...
 */
import {feedUriToHref} from '#/lib/strings/url-helpers'

/**
 * getContentLanguages: ユーザーのコンテンツ言語設定を取得
 */
import {getContentLanguages} from '#/state/preferences/languages'

/**
 * FeedParams: フィード取得パラメータの型
 */
import {FeedParams} from '#/state/queries/post-feed'

/**
 * FeedTuner, FeedTunerFn: フィードフィルタリング・調整ユーティリティ
 */
import {FeedTuner} from '../feed-manip'
import {FeedTunerFn} from '../feed-manip'

/**
 * フィードAPI関連型
 */
import {FeedAPI, FeedAPIResponse, ReasonFeedSource} from './types'

/**
 * Bluesky公式フィード判定・ヘッダー生成ユーティリティ
 */
import {createBskyTopicsHeader, isBlueskyOwnedFeed} from './utils'

/**
 * リクエスト待機時間（ミリ秒）
 * 遅いフィードジェネレータを待つ最大時間
 */
const REQUEST_WAIT_MS = 500 // 500ms

/**
 * 投稿の鮮度カットオフ（ミリ秒）
 * この時間より古い投稿はカスタムフィードから除外
 * 60e3 = 60000ms = 1分、× 60 × 24 = 24時間
 */
const POST_AGE_CUTOFF = 60e3 * 60 * 24 // 24hours

/**
 * マージフィードAPIクラス
 *
 * 【概要】
 * 複数のフィードソースを統合するメインクラス。
 * FeedAPIインターフェースを実装（Goのinterface実装に相当）。
 *
 * 【アーキテクチャ】
 * - following: フォロー中フィードソース（優先度高）
 * - customFeeds: カスタムフィードソース配列（ランダム順）
 *
 * 【サンプリングロジック】
 * - 最初の15件はフォロー中のみ
 * - その後は4件目、5件目ごとにカスタムフィードをインターリーブ
 * - フォロー中が尽きたらカスタムフィードのみ
 *
 * 【Goユーザー向け補足】
 * - implements FeedAPIはGoのinterface実装に相当
 * - 複数のカーソルで状態を管理（feedCursor, itemCursor, sampleCursor）
 */
export class MergeFeedAPI implements FeedAPI {
  userInterests?: string           // ユーザーの興味（パーソナライズ用）
  agent: BskyAgent                 // APIクライアント
  params: FeedParams               // フィードパラメータ
  feedTuners: FeedTunerFn[]        // フィードフィルタリング関数群
  following: MergeFeedSource_Following  // フォロー中フィードソース
  customFeeds: MergeFeedSource_Custom[] = []  // カスタムフィードソース配列
  feedCursor = 0                   // 次に使用するカスタムフィードのインデックス
  itemCursor = 0                   // 出力済みアイテム数（サンプリング間隔計算用）
  sampleCursor = 0                 // カスタムフィードサンプリング用インデックス

  /**
   * コンストラクタ
   *
   * @param agent APIクライアント
   * @param feedParams フィードパラメータ（mergeFeedSources等）
   * @param feedTuners フィードフィルタリング関数群
   * @param userInterests ユーザーの興味（オプション）
   */
  constructor({
    agent,
    feedParams,
    feedTuners,
    userInterests,
  }: {
    agent: BskyAgent
    feedParams: FeedParams
    feedTuners: FeedTunerFn[]
    userInterests?: string
  }) {
    this.agent = agent
    this.params = feedParams
    this.feedTuners = feedTuners
    this.userInterests = userInterests
    // フォロー中フィードソースを初期化
    this.following = new MergeFeedSource_Following({
      agent: this.agent,
      feedTuners: this.feedTuners,
    })
  }

  reset() {
    this.following = new MergeFeedSource_Following({
      agent: this.agent,
      feedTuners: this.feedTuners,
    })
    this.customFeeds = []
    this.feedCursor = 0
    this.itemCursor = 0
    this.sampleCursor = 0
    if (this.params.mergeFeedSources) {
      this.customFeeds = shuffle(
        this.params.mergeFeedSources.map(
          feedUri =>
            new MergeFeedSource_Custom({
              agent: this.agent,
              feedUri,
              feedTuners: this.feedTuners,
              userInterests: this.userInterests,
            }),
        ),
      )
    } else {
      this.customFeeds = []
    }
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.agent.getTimeline({
      limit: 1,
    })
    return res.data.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    if (!cursor) {
      this.reset()
    }

    const promises = []

    // always keep following topped up
    if (this.following.numReady < limit) {
      await this.following.fetchNext(60)
    }

    // pick the next feeds to sample from
    const feeds = this.customFeeds.slice(this.feedCursor, this.feedCursor + 3)
    this.feedCursor += 3
    if (this.feedCursor > this.customFeeds.length) {
      this.feedCursor = 0
    }

    // top up the feeds
    const outOfFollows =
      !this.following.hasMore && this.following.numReady < limit
    if (this.params.mergeFeedEnabled || outOfFollows) {
      for (const feed of feeds) {
        if (feed.numReady < 5) {
          promises.push(feed.fetchNext(10))
        }
      }
    }

    // wait for requests (all capped at a fixed timeout)
    await Promise.all(promises)

    // assemble a response by sampling from feeds with content
    const posts: AppBskyFeedDefs.FeedViewPost[] = []
    while (posts.length < limit) {
      let slice = this.sampleItem()
      if (slice[0]) {
        posts.push(slice[0])
      } else {
        break
      }
    }

    return {
      cursor: String(this.itemCursor),
      feed: posts,
    }
  }

  sampleItem() {
    const i = this.itemCursor++
    const candidateFeeds = this.customFeeds.filter(f => f.numReady > 0)
    const canSample = candidateFeeds.length > 0
    const hasFollows = this.following.hasMore
    const hasFollowsReady = this.following.numReady > 0

    // this condition establishes the frequency that custom feeds are woven into follows
    const shouldSample =
      this.params.mergeFeedEnabled &&
      i >= 15 &&
      candidateFeeds.length >= 2 &&
      (i % 4 === 0 || i % 5 === 0)

    if (!canSample && !hasFollows) {
      // no data available
      return []
    }
    if (shouldSample || !hasFollows) {
      // time to sample, or the user isnt following anybody
      return candidateFeeds[this.sampleCursor++ % candidateFeeds.length].take(1)
    }
    if (!hasFollowsReady) {
      // stop here so more follows can be fetched
      return []
    }
    // provide follow
    return this.following.take(1)
  }
}

class MergeFeedSource {
  agent: BskyAgent
  feedTuners: FeedTunerFn[]
  sourceInfo: ReasonFeedSource | undefined
  cursor: string | undefined = undefined
  queue: AppBskyFeedDefs.FeedViewPost[] = []
  hasMore = true

  constructor({
    agent,
    feedTuners,
  }: {
    agent: BskyAgent
    feedTuners: FeedTunerFn[]
  }) {
    this.agent = agent
    this.feedTuners = feedTuners
  }

  get numReady() {
    return this.queue.length
  }

  get needsFetch() {
    return this.hasMore && this.queue.length === 0
  }

  take(n: number): AppBskyFeedDefs.FeedViewPost[] {
    return this.queue.splice(0, n)
  }

  async fetchNext(n: number) {
    await Promise.race([this._fetchNextInner(n), timeout(REQUEST_WAIT_MS)])
  }

  _fetchNextInner = bundleAsync(async (n: number) => {
    const res = await this._getFeed(this.cursor, n)
    if (res.success) {
      this.cursor = res.data.cursor
      if (res.data.feed.length) {
        this.queue = this.queue.concat(res.data.feed)
      } else {
        this.hasMore = false
      }
    } else {
      this.hasMore = false
    }
  })

  protected _getFeed(
    _cursor: string | undefined,
    _limit: number,
  ): Promise<AppBskyFeedGetTimeline.Response> {
    throw new Error('Must be overridden')
  }
}

class MergeFeedSource_Following extends MergeFeedSource {
  tuner = new FeedTuner(this.feedTuners)

  async fetchNext(n: number) {
    return this._fetchNextInner(n)
  }

  protected async _getFeed(
    cursor: string | undefined,
    limit: number,
  ): Promise<AppBskyFeedGetTimeline.Response> {
    const res = await this.agent.getTimeline({cursor, limit})
    // run the tuner pre-emptively to ensure better mixing
    const slices = this.tuner.tune(res.data.feed, {
      dryRun: false,
    })
    res.data.feed = slices.map(slice => slice._feedPost)
    return res
  }
}

class MergeFeedSource_Custom extends MergeFeedSource {
  agent: BskyAgent
  minDate: Date
  feedUri: string
  userInterests?: string

  constructor({
    agent,
    feedUri,
    feedTuners,
    userInterests,
  }: {
    agent: BskyAgent
    feedUri: string
    feedTuners: FeedTunerFn[]
    userInterests?: string
  }) {
    super({
      agent,
      feedTuners,
    })
    this.agent = agent
    this.feedUri = feedUri
    this.userInterests = userInterests
    this.sourceInfo = {
      $type: 'reasonFeedSource',
      uri: feedUri,
      href: feedUriToHref(feedUri),
    }
    this.minDate = new Date(Date.now() - POST_AGE_CUTOFF)
  }

  protected async _getFeed(
    cursor: string | undefined,
    limit: number,
  ): Promise<AppBskyFeedGetTimeline.Response> {
    try {
      const contentLangs = getContentLanguages().join(',')
      const isBlueskyOwned = isBlueskyOwnedFeed(this.feedUri)
      const res = await this.agent.app.bsky.feed.getFeed(
        {
          cursor,
          limit,
          feed: this.feedUri,
        },
        {
          headers: {
            ...(isBlueskyOwned
              ? createBskyTopicsHeader(this.userInterests)
              : {}),
            'Accept-Language': contentLangs,
          },
        },
      )
      // NOTE
      // some custom feeds fail to enforce the pagination limit
      // so we manually truncate here
      // -prf
      if (limit && res.data.feed.length > limit) {
        res.data.feed = res.data.feed.slice(0, limit)
      }
      // filter out older posts
      res.data.feed = res.data.feed.filter(
        post => new Date(post.post.indexedAt) > this.minDate,
      )
      // attach source info
      for (const post of res.data.feed) {
        // @ts-ignore
        post.__source = this.sourceInfo
      }
      return res
    } catch {
      // dont bubble custom-feed errors
      return {success: false, headers: {}, data: {feed: []}}
    }
  }
}
