/**
 * カスタムフィードAPIモジュール
 *
 * 【概要】
 * Blueskyのカスタムフィード（フィードジェネレータ）を取得するAPIクラス。
 * ユーザーが作成したアルゴリズム駆動のフィードに対応。
 *
 * 【カスタムフィードとは】
 * - 第三者が作成できるフィードアルゴリズム
 * - 「whats-hot」「discover」などの公式フィード
 * - ユーザーが好みに応じて購読可能
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - async/awaitはHTTPリクエストを扱う非同期処理構文
 */

/**
 * AT Protocol API型定義
 * AppBskyFeedDefs: フィード関連の型定義
 * GetCustomFeed: カスタムフィード取得APIの型
 * BskyAgent: APIクライアント
 * jsonStringToLex: JSON文字列をLexicon型に変換
 */
import {
  AppBskyFeedDefs,
  AppBskyFeedGetFeed as GetCustomFeed,
  BskyAgent,
  jsonStringToLex,
} from '@atproto/api'

/**
 * 言語設定取得関数
 * getAppLanguageAsContentLanguage: アプリ言語をコンテンツ言語として取得
 * getContentLanguages: ユーザー設定のコンテンツ言語一覧を取得
 */
import {
  getAppLanguageAsContentLanguage,
  getContentLanguages,
} from '#/state/preferences/languages'

/**
 * フィードAPI共通インターフェース
 */
import {FeedAPI, FeedAPIResponse} from './types'

/**
 * Bluesky公式フィード関連ユーティリティ
 * createBskyTopicsHeader: ユーザー興味に基づくヘッダー生成
 * isBlueskyOwnedFeed: Bluesky公式フィードかどうかを判定
 */
import {createBskyTopicsHeader, isBlueskyOwnedFeed} from './utils'

/**
 * カスタムフィードAPIクラス
 *
 * 【概要】
 * フィードジェネレータ（カスタムアルゴリズム）を使ったフィードを取得。
 * FeedAPIインターフェースを実装（Goのinterface実装に相当）。
 *
 * 【フィードジェネレータとは】
 * AT Protocolでは、第三者がフィードアルゴリズムを作成・公開できる。
 * 例: トレンド、特定トピック、フォロー以外のおすすめなど
 *
 * 【Goユーザー向け補足】
 * - implements FeedAPIはGoのinterface実装に相当
 * - agent.did は認証状態の確認に使用（ログイン済みかどうか）
 */
export class CustomFeedAPI implements FeedAPI {
  agent: BskyAgent               // Bluesky APIクライアント
  params: GetCustomFeed.QueryParams  // フィードURI等のパラメータ
  userInterests?: string         // ユーザーの興味（パーソナライズ用）

  /**
   * コンストラクタ
   *
   * @param agent Bluesky APIクライアント
   * @param feedParams フィード取得パラメータ（feed: フィードURI）
   * @param userInterests ユーザーの興味（オプション）
   */
  constructor({
    agent,
    feedParams,
    userInterests,
  }: {
    agent: BskyAgent
    feedParams: GetCustomFeed.QueryParams
    userInterests?: string
  }) {
    this.agent = agent
    this.params = feedParams
    this.userInterests = userInterests
  }

  /**
   * 最新投稿を1件取得
   *
   * 【動作】
   * フィードジェネレータから最新の投稿を1件取得。
   * 言語設定をAccept-Languageヘッダーで送信。
   *
   * @returns 最新の投稿1件
   */
  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    // ユーザー設定のコンテンツ言語をカンマ区切りで取得（例: "ja,en"）
    const contentLangs = getContentLanguages().join(',')
    const res = await this.agent.app.bsky.feed.getFeed(
      {
        ...this.params,
        limit: 1,
      },
      // Accept-Languageヘッダーで言語フィルタリングを要求
      {headers: {'Accept-Language': contentLangs}},
    )
    return res.data.feed[0]
  }

  /**
   * フィードを取得
   *
   * 【動作フロー】
   * 1. ログイン状態を確認（agent.did）
   * 2. ログイン済み: 通常のAPI呼び出し
   * 3. 未ログイン: loggedOutFetch（特別なフォールバック処理）
   *
   * 【Bluesky公式フィードの場合】
   * ユーザーの興味に基づくパーソナライズヘッダーを追加。
   *
   * 【ページネーション制限のバグ対策】
   * 一部のフィードジェネレータはlimit制限を守らないため、
   * クライアント側で手動でトリミングする。
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
    const contentLangs = getContentLanguages().join(',')
    const agent = this.agent
    // Bluesky公式フィードかどうかを判定（パーソナライズ用）
    const isBlueskyOwned = isBlueskyOwnedFeed(this.params.feed)

    // ログイン状態に応じて異なる取得方法を使用
    // agent.did が存在する = ログイン済み
    const res = agent.did
      ? await this.agent.app.bsky.feed.getFeed(
          {
            ...this.params,
            cursor,
            limit,
          },
          {
            headers: {
              // Bluesky公式フィードの場合、ユーザー興味ヘッダーを追加
              ...(isBlueskyOwned
                ? createBskyTopicsHeader(this.userInterests)
                : {}),
              'Accept-Language': contentLangs,
            },
          },
        )
      // 未ログイン時は特別なフェッチ処理（キャッシュ対策含む）
      : await loggedOutFetch({...this.params, cursor, limit})

    if (res.success) {
      // NOTE: 一部のフィードジェネレータはページネーション制限を
      // 守らないため、クライアント側で手動トリミング
      if (res.data.feed.length > limit) {
        res.data.feed = res.data.feed.slice(0, limit)
      }
      return {
        // 投稿がない場合はカーソルをundefinedに
        cursor: res.data.feed.length ? res.data.cursor : undefined,
        feed: res.data.feed,
      }
    }
    return {
      feed: [],
    }
  }
}

/**
 * 未ログインユーザー用のフィード取得関数
 *
 * 【概要】
 * 未ログイン状態でカスタムフィードを取得するためのワークアラウンド。
 * 公式APIクライアントを使わず、直接fetch()でAPIを呼び出す。
 *
 * 【なぜ必要か】
 * 1. 未ログインユーザーにも言語別コンテンツを即座に提供したい
 * 2. 公開キャッシュ層がAccept-Languageヘッダーでキャッシュ無効化できないバグ
 * 3. 全ての言語にコンテンツがあるわけではない
 *
 * 【フォールバック戦略】
 * 1. まず言語設定でフェッチ
 * 2. コンテンツがなければ言語設定なしでリトライ
 *
 * 【Goユーザー向け補足】
 * - fetch() はブラウザ/React Native標準のHTTPクライアント
 * - Go の http.Get() に相当
 * - jsonStringToLex() は JSON → Lexicon型変換（型安全なデシリアライズ）
 *
 * @param feed フィードURI
 * @param limit 取得件数
 * @param cursor ページネーションカーソル（オプション）
 * @returns 成功/失敗フラグとフィードデータ
 */
// HACK
// we want feeds to give language-specific results immediately when a
// logged-out user changes their language. this comes with two problems:
// 1. not all languages have content, and
// 2. our public caching layer isnt correctly busting against the accept-language header
// for now we handle both of these with a manual workaround
// -prf
async function loggedOutFetch({
  feed,
  limit,
  cursor,
}: {
  feed: string
  limit: number
  cursor?: string
}) {
  // アプリ言語設定をコンテンツ言語として取得
  let contentLangs = getAppLanguageAsContentLanguage()

  /**
   * ラベラーヘッダー
   *
   * 【ラベラーとは】
   * AT Protocolのコンテンツモデレーションシステム。
   * スパム、NSFW等のラベルを投稿に付与し、クライアントでフィルタリング。
   *
   * 【ヘッダー形式】
   * "atproto-accept-labelers: did:plc:xxx;redact, did:plc:yyy;redact"
   * - did:plc:xxx = ラベラーサービスのDID
   * - redact = ラベル付き投稿を隠す指示
   *
   * Copied from our root `Agent` class
   * @see https://github.com/bluesky-social/atproto/blob/60df3fc652b00cdff71dd9235d98a7a4bb828f05/packages/api/src/agent.ts#L120
   */
  const labelersHeader = {
    'atproto-accept-labelers': BskyAgent.appLabelers
      .map(l => `${l};redact`)
      .join(', '),
  }

  // 言語パラメータをURLに含めてキャッシュを無効化
  // （通常のAccept-Languageヘッダーだけでは公開キャッシュをバストできない）
  // manually construct fetch call so we can add the `lang` cache-busting param
  let res = await fetch(
    `https://api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=${feed}${
      cursor ? `&cursor=${cursor}` : ''
    }&limit=${limit}&lang=${contentLangs}`,
    {
      method: 'GET',
      headers: {'Accept-Language': contentLangs, ...labelersHeader},
    },
  )

  // レスポンスをLexicon型に変換
  let data = res.ok
    ? (jsonStringToLex(await res.text()) as GetCustomFeed.OutputSchema)
    : null

  // コンテンツがあれば成功
  if (data?.feed?.length) {
    return {
      success: true,
      data,
    }
  }

  // フォールバック: 言語設定なしでリトライ
  // （日本語コンテンツが少ない場合など、全言語から取得）
  // no data, try again with language headers removed
  res = await fetch(
    `https://api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=${feed}${
      cursor ? `&cursor=${cursor}` : ''
    }&limit=${limit}`,
    {method: 'GET', headers: {'Accept-Language': '', ...labelersHeader}},
  )
  data = res.ok
    ? (jsonStringToLex(await res.text()) as GetCustomFeed.OutputSchema)
    : null

  if (data?.feed?.length) {
    return {
      success: true,
      data,
    }
  }

  // 両方失敗した場合は空配列を返す
  return {
    success: false,
    data: {feed: []},
  }
}
