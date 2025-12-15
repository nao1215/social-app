/**
 * フィード操作モジュール
 *
 * 【概要】
 * Blueskyのフィード（タイムライン）を操作・フィルタリングするためのユーティリティクラス群。
 * 投稿のスレッド構造解析、重複排除、フィルタリング、言語フィルタリングなどを実行する。
 *
 * 【主要機能】
 * - FeedViewPostsSlice: 単一のフィード項目（投稿+返信コンテキスト）を表現
 * - FeedTuner: フィードの調整・フィルタリングを実行するエンジン
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructに相当し、メソッドを持つことができる
 * - 型定義（type）はGoのtype aliasに相当
 * - Setはmap[string]struct{}に相当する重複排除用のデータ構造
 */

// AT Protocol API型定義（Goのstructに相当する型システム）
import {
  type AppBskyActorDefs, // プロフィール情報の型
  AppBskyEmbedRecord, // レコード埋め込みの型
  AppBskyEmbedRecordWithMedia, // メディア付きレコード埋め込みの型
  AppBskyFeedDefs, // フィード関連の型定義
  AppBskyFeedPost, // 投稿レコードの型
} from '@atproto/api'

// Bluesky型バリデーション（実行時の型チェック）
import * as bsky from '#/types/bsky'
// 言語判定ヘルパー関数
import {isPostInLanguage} from '../../locale/helpers'
// フォールバックマーカー（フィードの途切れを示す特殊投稿）
import {FALLBACK_MARKER_POST} from './feed/home'
// フィードソース理由型（カスタムフィードからの投稿を示す）
import {type ReasonFeedSource} from './feed/types'

// フィード投稿ビューの型エイリアス（Goのtype定義に相当）
type FeedViewPost = AppBskyFeedDefs.FeedViewPost

/**
 * フィードチューナー関数型
 *
 * フィード内容を加工・フィルタリングする関数の型定義
 * （Goの関数型に相当: type FeedTunerFn func(tuner *FeedTuner, slices []FeedViewPostsSlice, dryRun bool) []FeedViewPostsSlice）
 *
 * @param tuner フィードチューナーインスタンス（状態管理用）
 * @param slices 処理対象のフィードスライス配列
 * @param dryRun テスト実行フラグ（trueの場合、状態を変更しない）
 * @returns フィルタリング済みのスライス配列
 */
export type FeedTunerFn = (
  tuner: FeedTuner,
  slices: FeedViewPostsSlice[],
  dryRun: boolean,
) => FeedViewPostsSlice[]

/**
 * フィードスライス項目
 *
 * スレッド内の単一投稿を表現する型（Goのstructに相当）
 */
type FeedSliceItem = {
  post: AppBskyFeedDefs.PostView // 投稿ビュー
  record: AppBskyFeedPost.Record // 投稿レコード（本文・埋め込みなど）
  parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined // 親投稿の著者
  isParentBlocked: boolean // 親投稿がブロックされているか
  isParentNotFound: boolean // 親投稿が見つからないか
}

/**
 * 著者コンテキスト
 *
 * スレッド内の各レベルの著者情報を保持（Goのstructに相当）
 */
type AuthorContext = {
  author: AppBskyActorDefs.ProfileViewBasic // 投稿者
  parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined // 親投稿の著者
  grandparentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined // 祖父投稿の著者
  rootAuthor: AppBskyActorDefs.ProfileViewBasic | undefined // ルート投稿の著者
}

/**
 * フィードビュー投稿スライス
 *
 * 【概要】
 * フィード内の単一項目（投稿+返信コンテキスト）を表現するクラス。
 * スレッド構造を解析し、ルート・親・子投稿の関係を構築する。
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - constructorはGoのNewXxx関数に相当（初期化処理）
 * - プライベートフィールド（_で始まる）は内部実装用
 *
 * 【スレッド構造】
 * - items[0]: ルート投稿（スレッドの最初の投稿）
 * - items[1]: 親投稿（直接の親）
 * - items[2]: 現在の投稿
 */
export class FeedViewPostsSlice {
  _reactKey: string // React内部で使用する一意キー
  _feedPost: FeedViewPost // 元のフィード投稿データ
  items: FeedSliceItem[] // スレッド内の投稿配列（ルート→親→現在）
  isIncompleteThread: boolean // スレッドが不完全か（中間投稿が欠けている）
  isFallbackMarker: boolean // フォールバックマーカーか（フィードの途切れを示す）
  isOrphan: boolean // 孤立投稿か（親投稿が取得できない）
  isThreadMuted: boolean // スレッドがミュートされているか
  rootUri: string // ルート投稿のURI
  feedPostUri: string // この投稿のURI

  /**
   * コンストラクタ
   *
   * フィード投稿からスライスを構築し、スレッド構造を解析する。
   * （Goのfunc NewFeedViewPostsSlice(feedPost FeedViewPost) *FeedViewPostsSliceに相当）
   *
   * @param feedPost AT ProtocolのFeedViewPost（投稿+返信情報）
   */
  constructor(feedPost: FeedViewPost) {
    const {post, reply, reason} = feedPost
    this.items = []
    this.isIncompleteThread = false
    this.isFallbackMarker = false
    this.isOrphan = false
    this.isThreadMuted = post.viewer?.threadMuted ?? false
    this.feedPostUri = post.uri
    if (AppBskyFeedDefs.isPostView(reply?.root)) {
      this.rootUri = reply.root.uri
    } else {
      this.rootUri = post.uri
    }
    this._feedPost = feedPost
    this._reactKey = `slice-${post.uri}-${
      feedPost.reason && 'indexedAt' in feedPost.reason
        ? feedPost.reason.indexedAt
        : post.indexedAt
    }`
    if (feedPost.post.uri === FALLBACK_MARKER_POST.post.uri) {
      this.isFallbackMarker = true
      return
    }
    if (
      !AppBskyFeedPost.isRecord(post.record) ||
      !bsky.validate(post.record, AppBskyFeedPost.validateRecord)
    ) {
      return
    }
    const parent = reply?.parent
    const isParentBlocked = AppBskyFeedDefs.isBlockedPost(parent)
    const isParentNotFound = AppBskyFeedDefs.isNotFoundPost(parent)
    let parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
    if (AppBskyFeedDefs.isPostView(parent)) {
      parentAuthor = parent.author
    }
    this.items.push({
      post,
      record: post.record,
      parentAuthor,
      isParentBlocked,
      isParentNotFound,
    })
    if (!reply) {
      if (post.record.reply) {
        // This reply wasn't properly hydrated by the AppView.
        this.isOrphan = true
        this.items[0].isParentNotFound = true
      }
      return
    }
    if (reason) {
      return
    }
    if (
      !AppBskyFeedDefs.isPostView(parent) ||
      !AppBskyFeedPost.isRecord(parent.record) ||
      !bsky.validate(parent.record, AppBskyFeedPost.validateRecord)
    ) {
      this.isOrphan = true
      return
    }
    const root = reply.root
    const rootIsView =
      AppBskyFeedDefs.isPostView(root) ||
      AppBskyFeedDefs.isBlockedPost(root) ||
      AppBskyFeedDefs.isNotFoundPost(root)
    /*
     * If the parent is also the root, we just so happen to have the data we
     * need to compute if the parent's parent (grandparent) is blocked. This
     * doesn't always happen, of course, but we can take advantage of it when
     * it does.
     */
    const grandparent =
      rootIsView && parent.record.reply?.parent.uri === root.uri
        ? root
        : undefined
    const grandparentAuthor = reply.grandparentAuthor
    const isGrandparentBlocked = Boolean(
      grandparent && AppBskyFeedDefs.isBlockedPost(grandparent),
    )
    const isGrandparentNotFound = Boolean(
      grandparent && AppBskyFeedDefs.isNotFoundPost(grandparent),
    )
    this.items.unshift({
      post: parent,
      record: parent.record,
      parentAuthor: grandparentAuthor,
      isParentBlocked: isGrandparentBlocked,
      isParentNotFound: isGrandparentNotFound,
    })
    if (isGrandparentBlocked) {
      this.isOrphan = true
      // Keep going, it might still have a root, and we need this for thread
      // de-deduping
    }
    if (
      !AppBskyFeedDefs.isPostView(root) ||
      !AppBskyFeedPost.isRecord(root.record) ||
      !bsky.validate(root.record, AppBskyFeedPost.validateRecord)
    ) {
      this.isOrphan = true
      return
    }
    if (root.uri === parent.uri) {
      return
    }
    this.items.unshift({
      post: root,
      record: root.record,
      isParentBlocked: false,
      isParentNotFound: false,
      parentAuthor: undefined,
    })
    if (parent.record.reply?.parent.uri !== root.uri) {
      this.isIncompleteThread = true
    }
  }

  get isQuotePost() {
    const embed = this._feedPost.post.embed
    return (
      AppBskyEmbedRecord.isView(embed) ||
      AppBskyEmbedRecordWithMedia.isView(embed)
    )
  }

  get isReply() {
    return (
      AppBskyFeedPost.isRecord(this._feedPost.post.record) &&
      !!this._feedPost.post.record.reply
    )
  }

  get reason() {
    return '__source' in this._feedPost
      ? (this._feedPost.__source as ReasonFeedSource)
      : this._feedPost.reason
  }

  get feedContext() {
    return this._feedPost.feedContext
  }

  get reqId() {
    return this._feedPost.reqId
  }

  get isRepost() {
    const reason = this._feedPost.reason
    return AppBskyFeedDefs.isReasonRepost(reason)
  }

  get likeCount() {
    return this._feedPost.post.likeCount ?? 0
  }

  containsUri(uri: string) {
    return !!this.items.find(item => item.post.uri === uri)
  }

  getAuthors(): AuthorContext {
    const feedPost = this._feedPost
    let author: AppBskyActorDefs.ProfileViewBasic = feedPost.post.author
    let parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
    let grandparentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
    let rootAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
    if (feedPost.reply) {
      if (AppBskyFeedDefs.isPostView(feedPost.reply.parent)) {
        parentAuthor = feedPost.reply.parent.author
      }
      if (feedPost.reply.grandparentAuthor) {
        grandparentAuthor = feedPost.reply.grandparentAuthor
      }
      if (AppBskyFeedDefs.isPostView(feedPost.reply.root)) {
        rootAuthor = feedPost.reply.root.author
      }
    }
    return {
      author,
      parentAuthor,
      grandparentAuthor,
      rootAuthor,
    }
  }
}

export class FeedTuner {
  seenKeys: Set<string> = new Set()
  seenUris: Set<string> = new Set()
  seenRootUris: Set<string> = new Set()

  constructor(public tunerFns: FeedTunerFn[]) {}

  tune(
    feed: FeedViewPost[],
    {dryRun}: {dryRun: boolean} = {
      dryRun: false,
    },
  ): FeedViewPostsSlice[] {
    let slices: FeedViewPostsSlice[] = feed
      .map(item => new FeedViewPostsSlice(item))
      .filter(s => s.items.length > 0 || s.isFallbackMarker)

    // run the custom tuners
    for (const tunerFn of this.tunerFns) {
      slices = tunerFn(this, slices.slice(), dryRun)
    }

    slices = slices.filter(slice => {
      if (this.seenKeys.has(slice._reactKey)) {
        return false
      }
      // Some feeds, like Following, dedupe by thread, so you only see the most recent reply.
      // However, we don't want per-thread dedupe for author feeds (where we need to show every post)
      // or for feedgens (where we want to let the feed serve multiple replies if it chooses to).
      // To avoid showing the same context (root and/or parent) more than once, we do last resort
      // per-post deduplication. It hides already seen posts as long as this doesn't break the thread.
      for (let i = 0; i < slice.items.length; i++) {
        const item = slice.items[i]
        if (this.seenUris.has(item.post.uri)) {
          if (i === 0) {
            // Omit contiguous seen leading items.
            // For example, [A -> B -> C], [A -> D -> E], [A -> D -> F]
            // would turn into [A -> B -> C], [D -> E], [F].
            slice.items.splice(0, 1)
            i--
          }
          if (i === slice.items.length - 1) {
            // If the last item in the slice was already seen, omit the whole slice.
            // This means we'd miss its parents, but the user can "show more" to see them.
            // For example, [A ... E -> F], [A ... D -> E], [A ... C -> D], [A -> B -> C]
            // would get collapsed into [A ... E -> F], with B/C/D considered seen.
            return false
          }
        } else {
          if (!dryRun) {
            // Reposting a reply elevates it to top-level, so its parent/root won't be displayed.
            // Disable in-thread dedupe for this case since we don't want to miss them later.
            const disableDedupe = slice.isReply && slice.isRepost
            if (!disableDedupe) {
              this.seenUris.add(item.post.uri)
            }
          }
        }
      }
      if (!dryRun) {
        this.seenKeys.add(slice._reactKey)
      }
      return true
    })

    return slices
  }

  static removeReplies(
    tuner: FeedTuner,
    slices: FeedViewPostsSlice[],
    _dryRun: boolean,
  ) {
    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i]
      if (
        slice.isReply &&
        !slice.isRepost &&
        // This is not perfect but it's close as we can get to
        // detecting threads without having to peek ahead.
        !areSameAuthor(slice.getAuthors())
      ) {
        slices.splice(i, 1)
        i--
      }
    }
    return slices
  }

  static removeReposts(
    tuner: FeedTuner,
    slices: FeedViewPostsSlice[],
    _dryRun: boolean,
  ) {
    for (let i = 0; i < slices.length; i++) {
      if (slices[i].isRepost) {
        slices.splice(i, 1)
        i--
      }
    }
    return slices
  }

  static removeQuotePosts(
    tuner: FeedTuner,
    slices: FeedViewPostsSlice[],
    _dryRun: boolean,
  ) {
    for (let i = 0; i < slices.length; i++) {
      if (slices[i].isQuotePost) {
        slices.splice(i, 1)
        i--
      }
    }
    return slices
  }

  static removeOrphans(
    tuner: FeedTuner,
    slices: FeedViewPostsSlice[],
    _dryRun: boolean,
  ) {
    for (let i = 0; i < slices.length; i++) {
      if (slices[i].isOrphan) {
        slices.splice(i, 1)
        i--
      }
    }
    return slices
  }

  static removeMutedThreads(
    tuner: FeedTuner,
    slices: FeedViewPostsSlice[],
    _dryRun: boolean,
  ) {
    for (let i = 0; i < slices.length; i++) {
      if (slices[i].isThreadMuted) {
        slices.splice(i, 1)
        i--
      }
    }
    return slices
  }

  static dedupThreads(
    tuner: FeedTuner,
    slices: FeedViewPostsSlice[],
    dryRun: boolean,
  ): FeedViewPostsSlice[] {
    for (let i = 0; i < slices.length; i++) {
      const rootUri = slices[i].rootUri
      if (!slices[i].isRepost && tuner.seenRootUris.has(rootUri)) {
        slices.splice(i, 1)
        i--
      } else {
        if (!dryRun) {
          tuner.seenRootUris.add(rootUri)
        }
      }
    }
    return slices
  }

  static followedRepliesOnly({userDid}: {userDid: string}) {
    return (
      tuner: FeedTuner,
      slices: FeedViewPostsSlice[],
      _dryRun: boolean,
    ): FeedViewPostsSlice[] => {
      for (let i = 0; i < slices.length; i++) {
        const slice = slices[i]
        if (
          slice.isReply &&
          !slice.isRepost &&
          !shouldDisplayReplyInFollowing(slice.getAuthors(), userDid)
        ) {
          slices.splice(i, 1)
          i--
        }
      }
      return slices
    }
  }

  /**
   * This function filters a list of FeedViewPostsSlice items based on whether they contain text in a
   * preferred language.
   * @param {string[]} preferredLangsCode2 - An array of preferred language codes in ISO 639-1 or ISO 639-2 format.
   * @returns A function that takes in a `FeedTuner` and an array of `FeedViewPostsSlice` objects and
   * returns an array of `FeedViewPostsSlice` objects.
   */
  static preferredLangOnly(preferredLangsCode2: string[]) {
    return (
      tuner: FeedTuner,
      slices: FeedViewPostsSlice[],
      _dryRun: boolean,
    ): FeedViewPostsSlice[] => {
      // early return if no languages have been specified
      if (!preferredLangsCode2.length || preferredLangsCode2.length === 0) {
        return slices
      }

      const candidateSlices = slices.filter(slice => {
        for (const item of slice.items) {
          if (isPostInLanguage(item.post, preferredLangsCode2)) {
            return true
          }
        }
        // if item does not fit preferred language, remove it
        return false
      })

      // if the language filter cleared out the entire page, return the original set
      // so that something always shows
      if (candidateSlices.length === 0) {
        return slices
      }

      return candidateSlices
    }
  }
}

function areSameAuthor(authors: AuthorContext): boolean {
  const {author, parentAuthor, grandparentAuthor, rootAuthor} = authors
  const authorDid = author.did
  if (parentAuthor && parentAuthor.did !== authorDid) {
    return false
  }
  if (grandparentAuthor && grandparentAuthor.did !== authorDid) {
    return false
  }
  if (rootAuthor && rootAuthor.did !== authorDid) {
    return false
  }
  return true
}

function shouldDisplayReplyInFollowing(
  authors: AuthorContext,
  userDid: string,
): boolean {
  const {author, parentAuthor, grandparentAuthor, rootAuthor} = authors
  if (!isSelfOrFollowing(author, userDid)) {
    // Only show replies from self or people you follow.
    return false
  }
  if (
    (!parentAuthor || parentAuthor.did === author.did) &&
    (!rootAuthor || rootAuthor.did === author.did) &&
    (!grandparentAuthor || grandparentAuthor.did === author.did)
  ) {
    // Always show self-threads.
    return true
  }
  // From this point on we need at least one more reason to show it.
  if (
    parentAuthor &&
    parentAuthor.did !== author.did &&
    isSelfOrFollowing(parentAuthor, userDid)
  ) {
    return true
  }
  if (
    grandparentAuthor &&
    grandparentAuthor.did !== author.did &&
    isSelfOrFollowing(grandparentAuthor, userDid)
  ) {
    return true
  }
  if (
    rootAuthor &&
    rootAuthor.did !== author.did &&
    isSelfOrFollowing(rootAuthor, userDid)
  ) {
    return true
  }
  return false
}

function isSelfOrFollowing(
  profile: AppBskyActorDefs.ProfileViewBasic,
  userDid: string,
) {
  return Boolean(profile.did === userDid || profile.viewer?.following)
}
