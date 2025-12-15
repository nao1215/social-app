/**
 * @fileoverview 投稿スレッド管理モジュール / Post thread management module
 *
 * 【概要】
 * 投稿の詳細表示とスレッド（返信ツリー）の取得・管理・ソート処理を行います。
 * リプライの階層構造を再帰的に処理し、表示用のツリーデータを構築します。
 *
 * 【主な機能】
 * - usePostThreadQuery: 投稿スレッドの取得（親投稿と返信ツリー）
 * - sortThread: 返信のソート（新着順・いいね順・ホットネス順・ランダムなど）
 * - fillThreadModerationCache: スレッド全体のモデレーション判定キャッシュ構築
 * - findAllPostsInQueryData: 全クエリキャッシュから投稿を横断検索
 *
 * 【Go言語ユーザー向け補足】
 * - useQuery: サーバーからのデータ取得フック（Goのhttp.Clientに相当、キャッシュ機能付き）
 * - QueryClient: TanStack Queryのクライアント（Goのsync.Mapに相当するキャッシュストア）
 * - Generator関数: Goのchannelやイテレータに相当（function*とyield構文）
 * - WeakMap: キーがオブジェクトの弱参照マップ（Goのmap[interface{}]に類似、GC考慮）
 * - 再帰的データ構造: ThreadNodeが親子関係を持つ木構造（Goの再帰的struct定義と同様）
 *
 * 【スレッドソートアルゴリズム】
 * 1. 自分が今投稿した返信（画面上で投稿直後）
 * 2. OP（スレッド作成者）の返信
 * 3. 自分の返信
 * 4. 隠された返信
 * 5. モデレーションでぼかし対象の返信
 * 6. ピン留め返信（📌）
 * 7. フォローユーザーの返信（設定で優先表示）
 * 8. ユーザー設定のソート順（ホットネス・新着・古い順・いいね順・ランダム）
 */

// AT Protocol API型定義とモデレーション / AT Protocol API types and moderation
import {
  type AppBskyActorDefs, // アクター（ユーザー）定義型 / Actor (user) definition types
  type AppBskyEmbedRecord, // 埋め込みレコード型 / Embed record types
  AppBskyFeedDefs, // フィード定義型 / Feed definition types
  type AppBskyFeedGetPostThread, // スレッド取得API型 / Thread fetch API types
  AppBskyFeedPost, // 投稿型 / Post types
  AtUri, // AT URIパーサー / AT URI parser
  moderatePost, // 投稿モデレーション関数 / Post moderation function
  type ModerationDecision, // モデレーション判定結果型 / Moderation decision type
  type ModerationOpts, // モデレーション設定型 / Moderation options type
} from '@atproto/api'
// TanStack Query（データ取得・キャッシュライブラリ） / TanStack Query (data fetching & caching library)
import {type QueryClient, useQuery, useQueryClient} from '@tanstack/react-query'

import {
  findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData,
  findAllProfilesInQueryData as findAllProfilesInExploreFeedPreviewsQueryData,
} from '#/state/queries/explore-feed-previews'
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '#/state/queries/post-quotes'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {
  findAllPostsInQueryData as findAllPostsInSearchQueryData,
  findAllProfilesInQueryData as findAllProfilesInSearchQueryData,
} from '#/state/queries/search-posts'
import {useAgent} from '#/state/session'
import * as bsky from '#/types/bsky'
import {
  findAllPostsInQueryData as findAllPostsInNotifsQueryData,
  findAllProfilesInQueryData as findAllProfilesInNotifsQueryData,
} from './notifications/feed'
import {
  findAllPostsInQueryData as findAllPostsInFeedQueryData,
  findAllProfilesInQueryData as findAllProfilesInFeedQueryData,
} from './post-feed'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from './util'

/**
 * リプライツリーの最大深度 / Maximum depth of reply tree
 * 10階層までの返信を取得（これ以上深い返信は「さらに表示」として処理）
 * Fetches up to 10 levels of replies (deeper replies shown as "load more")
 */
const REPLY_TREE_DEPTH = 10

/**
 * クエリキーのルートキー / Query key root key
 * TanStack Queryでのキャッシュ識別に使用 / Used for cache identification in TanStack Query
 */
export const RQKEY_ROOT = 'post-thread'

/**
 * 投稿スレッド用クエリキー生成関数 / Post thread query key generator
 * @param uri 投稿URI / Post URI
 * @returns クエリキー配列 / Query key array
 */
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri]

/**
 * APIレスポンスのスレッドノード型 / Thread node type from API response
 * API から返されるスレッドビューの型エイリアス / Type alias for thread view from API
 */
type ThreadViewNode = AppBskyFeedGetPostThread.OutputSchema['thread']

/**
 * スレッドコンテキスト情報インターフェース / Thread context information interface
 * 各投稿ノードの表示状態や階層情報を保持 / Holds display state and hierarchy info for each post node
 *
 * 【Go言語ユーザー向け補足】
 * - interface: Goのstructに相当（TypeScriptではstructとinterfaceが統合されている）
 * - ?: Optional型フィールド（Goのポインタ型フィールドに相当、nilを許容）
 */
export interface ThreadCtx {
  depth: number // ツリー内の深度（0が選択された投稿） / Depth in tree (0 is selected post)
  isHighlightedPost?: boolean // ハイライト表示する投稿か / Whether this is the highlighted post
  hasMore?: boolean // さらに返信があるか / Whether there are more replies
  isParentLoading?: boolean // 親投稿をロード中か / Whether parent post is loading
  isChildLoading?: boolean // 子返信をロード中か / Whether child replies are loading
  isSelfThread?: boolean // セルフスレッド（同一作者の連続投稿）か / Whether this is a self-thread
  hasMoreSelfThread?: boolean // セルフスレッドがさらに続くか / Whether self-thread continues
}

/**
 * スレッド内の投稿ノード型 / Post node in thread
 * スレッドツリーの実際の投稿を表すノード / Node representing actual post in thread tree
 *
 * 【Go言語ユーザー向け補足】
 * - type: Tagged Union型（Goのtype switchに相当する判別可能なユニオン型）
 * - _reactKey: Reactの一覧表示用の一意キー（Go言語には相当概念なし）
 */
export type ThreadPost = {
  type: 'post' // ノードタイプ識別子 / Node type discriminator
  _reactKey: string // React一覧表示用キー / React list rendering key
  uri: string // 投稿URI / Post URI
  post: AppBskyFeedDefs.PostView // 投稿ビューデータ / Post view data
  record: AppBskyFeedPost.Record // 投稿レコードデータ / Post record data
  parent: ThreadNode | undefined // 親投稿（返信先） / Parent post (reply target)
  replies: ThreadNode[] | undefined // 子返信の配列 / Array of child replies
  hasOPLike: boolean | undefined // OPがいいねしているか / Whether OP liked this
  ctx: ThreadCtx // コンテキスト情報 / Context information
}

/**
 * 見つからなかった投稿ノード型 / Not found post node
 * 削除された、または存在しない投稿を表すノード / Node representing deleted or non-existent post
 */
export type ThreadNotFound = {
  type: 'not-found' // ノードタイプ識別子 / Node type discriminator
  _reactKey: string // React一覧表示用キー / React list rendering key
  uri: string // 投稿URI / Post URI
  ctx: ThreadCtx // コンテキスト情報 / Context information
}

/**
 * ブロックされた投稿ノード型 / Blocked post node
 * ブロックされたユーザーの投稿を表すノード / Node representing post from blocked user
 */
export type ThreadBlocked = {
  type: 'blocked' // ノードタイプ識別子 / Node type discriminator
  _reactKey: string // React一覧表示用キー / React list rendering key
  uri: string // 投稿URI / Post URI
  ctx: ThreadCtx // コンテキスト情報 / Context information
}

/**
 * 不明な投稿ノード型 / Unknown post node
 * 処理できなかった投稿を表すフォールバックノード / Fallback node for posts that couldn't be processed
 */
export type ThreadUnknown = {
  type: 'unknown' // ノードタイプ識別子 / Node type discriminator
  uri: string // 投稿URI / Post URI
}

/**
 * スレッドノード型（ユニオン型） / Thread node type (union type)
 * すべての可能なノードタイプの合成型 / Union of all possible node types
 *
 * 【Go言語ユーザー向け補足】
 * - ユニオン型: Goのinterfaceと型スイッチの組み合わせに相当
 * - TypeScriptでは | 演算子で複数の型を合成可能
 */
export type ThreadNode =
  | ThreadPost
  | ThreadNotFound
  | ThreadBlocked
  | ThreadUnknown

/**
 * スレッドモデレーションキャッシュ型 / Thread moderation cache type
 * 各ノードのモデレーション判定結果をキャッシュするWeakMap / WeakMap caching moderation decisions for each node
 *
 * 【Go言語ユーザー向け補足】
 * - WeakMap: キーが弱参照のマップ（Goのmap[interface{}]に類似だがGC考慮）
 * - キーオブジェクトが不要になると自動的にエントリが削除される
 */
export type ThreadModerationCache = WeakMap<ThreadNode, ModerationDecision>

/**
 * 投稿スレッドクエリデータ型 / Post thread query data type
 * usePostThreadQuery が返すデータの型 / Type of data returned by usePostThreadQuery
 *
 * 【Go言語ユーザー向け補足】
 * - threadgate: 返信制限設定（誰が返信できるかの制御）
 */
export type PostThreadQueryData = {
  thread: ThreadNode // スレッドのルートノード / Root node of thread
  threadgate?: AppBskyFeedDefs.ThreadgateView // スレッドゲート設定 / Threadgate settings
}

/**
 * usePostThreadQuery
 *
 * 【主な機能】
 * - 指定URIの投稿スレッド（親投稿+返信ツリー）を取得
 * - 10階層までの返信を再帰的に取得
 * - セルフスレッド（同一作者の連続投稿）の自動識別
 * - プレースホルダーデータとして既存キャッシュから投稿を検索
 *
 * 【状態管理パターン】
 * - TanStack Query の useQuery による宣言的データ取得
 * - gcTime: 0 でガベージコレクション即時実行（常に最新データ取得）
 * - プレースホルダーデータによる即座のUI表示
 *
 * 【外部連携】
 * - BskyAgent の getPostThread API で AT Protocol から取得
 * - 全クエリキャッシュを横断検索してプレースホルダー生成
 * - セルフスレッド解析とスレッドゲート設定の付加
 *
 * 【Go言語ユーザー向け補足】
 * - useQuery: Reactフック（関数コンポーネント内で状態管理、Goには直接の相当概念なし）
 * - async/await: Goのgoroutineとchannelに相当（Promiseベースの非同期処理）
 * - !: TypeScriptのnon-null assertion（値が必ずnon-nullであることを保証）
 *
 * @param uri - 取得対象の投稿URI（undefinedの場合はクエリ無効化）
 * @returns TanStack Query結果オブジェクト（PostThreadQueryData型）
 */
export function usePostThreadQuery(uri: string | undefined) {
  const queryClient = useQueryClient() // クエリクライアント取得 / Get query client
  const agent = useAgent() // Bluesky APIエージェント取得 / Get Bluesky API agent
  return useQuery<PostThreadQueryData, Error>({
    gcTime: 0, // ガベージコレクション時間（0=即時） / Garbage collection time (0=immediate)
    queryKey: RQKEY(uri || ''), // クエリキー / Query key
    async queryFn() {
      // APIからスレッドデータを取得 / Fetch thread data from API
      const res = await agent.getPostThread({
        uri: uri!, // 投稿URI / Post URI
        depth: REPLY_TREE_DEPTH, // 返信ツリーの深さ / Reply tree depth
      })
      if (res.success) {
        // レスポンスをスレッドノードに変換 / Convert response to thread nodes
        const thread = responseToThreadNodes(res.data.thread)
        // セルフスレッドの注釈を追加 / Annotate self-threads
        annotateSelfThread(thread)
        return {
          thread,
          threadgate: res.data.threadgate as
            | AppBskyFeedDefs.ThreadgateView
            | undefined,
        }
      }
      return {thread: {type: 'unknown', uri: uri!}}
    },
    enabled: !!uri, // URIがある場合のみ有効 / Only enabled when URI is available
    placeholderData: () => {
      // プレースホルダーデータとして既存キャッシュから検索 / Search existing cache for placeholder data
      if (!uri) return
      const post = findPostInQueryData(queryClient, uri)
      if (post) {
        return {thread: post}
      }
      return undefined
    },
  })
}

export function fillThreadModerationCache(
  cache: ThreadModerationCache,
  node: ThreadNode,
  moderationOpts: ModerationOpts,
) {
  if (node.type === 'post') {
    cache.set(node, moderatePost(node.post, moderationOpts))
    if (node.parent) {
      fillThreadModerationCache(cache, node.parent, moderationOpts)
    }
    if (node.replies) {
      for (const reply of node.replies) {
        fillThreadModerationCache(cache, reply, moderationOpts)
      }
    }
  }
}

export function sortThread(
  node: ThreadNode,
  opts: UsePreferencesQueryResponse['threadViewPrefs'],
  modCache: ThreadModerationCache,
  currentDid: string | undefined,
  justPostedUris: Set<string>,
  threadgateRecordHiddenReplies: Set<string>,
  fetchedAtCache: Map<string, number>,
  fetchedAt: number,
  randomCache: Map<string, number>,
): ThreadNode {
  if (node.type !== 'post') {
    return node
  }
  if (node.replies) {
    node.replies.sort((a: ThreadNode, b: ThreadNode) => {
      if (a.type !== 'post') {
        return 1
      }
      if (b.type !== 'post') {
        return -1
      }

      if (node.ctx.isHighlightedPost || opts.lab_treeViewEnabled) {
        const aIsJustPosted =
          a.post.author.did === currentDid && justPostedUris.has(a.post.uri)
        const bIsJustPosted =
          b.post.author.did === currentDid && justPostedUris.has(b.post.uri)
        if (aIsJustPosted && bIsJustPosted) {
          return a.post.indexedAt.localeCompare(b.post.indexedAt) // oldest
        } else if (aIsJustPosted) {
          return -1 // reply while onscreen
        } else if (bIsJustPosted) {
          return 1 // reply while onscreen
        }
      }

      const aIsByOp = a.post.author.did === node.post?.author.did
      const bIsByOp = b.post.author.did === node.post?.author.did
      if (aIsByOp && bIsByOp) {
        return a.post.indexedAt.localeCompare(b.post.indexedAt) // oldest
      } else if (aIsByOp) {
        return -1 // op's own reply
      } else if (bIsByOp) {
        return 1 // op's own reply
      }

      const aIsBySelf = a.post.author.did === currentDid
      const bIsBySelf = b.post.author.did === currentDid
      if (aIsBySelf && bIsBySelf) {
        return a.post.indexedAt.localeCompare(b.post.indexedAt) // oldest
      } else if (aIsBySelf) {
        return -1 // current account's reply
      } else if (bIsBySelf) {
        return 1 // current account's reply
      }

      const aHidden = threadgateRecordHiddenReplies.has(a.uri)
      const bHidden = threadgateRecordHiddenReplies.has(b.uri)
      if (aHidden && !aIsBySelf && !bHidden) {
        return 1
      } else if (bHidden && !bIsBySelf && !aHidden) {
        return -1
      }

      const aBlur = Boolean(modCache.get(a)?.ui('contentList').blur)
      const bBlur = Boolean(modCache.get(b)?.ui('contentList').blur)
      if (aBlur !== bBlur) {
        if (aBlur) {
          return 1
        }
        if (bBlur) {
          return -1
        }
      }

      const aPin = Boolean(a.record.text.trim() === '📌')
      const bPin = Boolean(b.record.text.trim() === '📌')
      if (aPin !== bPin) {
        if (aPin) {
          return 1
        }
        if (bPin) {
          return -1
        }
      }

      if (opts.prioritizeFollowedUsers) {
        const af = a.post.author.viewer?.following
        const bf = b.post.author.viewer?.following
        if (af && !bf) {
          return -1
        } else if (!af && bf) {
          return 1
        }
      }

      // Split items from different fetches into separate generations.
      let aFetchedAt = fetchedAtCache.get(a.uri)
      if (aFetchedAt === undefined) {
        fetchedAtCache.set(a.uri, fetchedAt)
        aFetchedAt = fetchedAt
      }
      let bFetchedAt = fetchedAtCache.get(b.uri)
      if (bFetchedAt === undefined) {
        fetchedAtCache.set(b.uri, fetchedAt)
        bFetchedAt = fetchedAt
      }

      if (aFetchedAt !== bFetchedAt) {
        return aFetchedAt - bFetchedAt // older fetches first
      } else if (opts.sort === 'hotness') {
        const aHotness = getHotness(a, aFetchedAt)
        const bHotness = getHotness(b, bFetchedAt /* same as aFetchedAt */)
        return bHotness - aHotness
      } else if (opts.sort === 'oldest') {
        return a.post.indexedAt.localeCompare(b.post.indexedAt)
      } else if (opts.sort === 'newest') {
        return b.post.indexedAt.localeCompare(a.post.indexedAt)
      } else if (opts.sort === 'most-likes') {
        if (a.post.likeCount === b.post.likeCount) {
          return b.post.indexedAt.localeCompare(a.post.indexedAt) // newest
        } else {
          return (b.post.likeCount || 0) - (a.post.likeCount || 0) // most likes
        }
      } else if (opts.sort === 'random') {
        let aRandomScore = randomCache.get(a.uri)
        if (aRandomScore === undefined) {
          aRandomScore = Math.random()
          randomCache.set(a.uri, aRandomScore)
        }
        let bRandomScore = randomCache.get(b.uri)
        if (bRandomScore === undefined) {
          bRandomScore = Math.random()
          randomCache.set(b.uri, bRandomScore)
        }
        // this is vaguely criminal but we can get away with it
        return aRandomScore - bRandomScore
      } else {
        return b.post.indexedAt.localeCompare(a.post.indexedAt)
      }
    })
    node.replies.forEach(reply =>
      sortThread(
        reply,
        opts,
        modCache,
        currentDid,
        justPostedUris,
        threadgateRecordHiddenReplies,
        fetchedAtCache,
        fetchedAt,
        randomCache,
      ),
    )
  }
  return node
}

// internal methods
// =

// Inspired by https://join-lemmy.org/docs/contributors/07-ranking-algo.html
// We want to give recent comments a real chance (and not bury them deep below the fold)
// while also surfacing well-liked comments from the past. In the future, we can explore
// something more sophisticated, but we don't have much data on the client right now.
function getHotness(threadPost: ThreadPost, fetchedAt: number) {
  const {post, hasOPLike} = threadPost
  const hoursAgo = Math.max(
    0,
    (new Date(fetchedAt).getTime() - new Date(post.indexedAt).getTime()) /
      (1000 * 60 * 60),
  )
  const likeCount = post.likeCount ?? 0
  const likeOrder = Math.log(3 + likeCount) * (hasOPLike ? 1.45 : 1.0)
  const timePenaltyExponent = 1.5 + 1.5 / (1 + Math.log(1 + likeCount))
  const opLikeBoost = hasOPLike ? 0.8 : 1.0
  const timePenalty = Math.pow(hoursAgo + 2, timePenaltyExponent * opLikeBoost)
  return likeOrder / timePenalty
}

function responseToThreadNodes(
  node: ThreadViewNode,
  depth = 0,
  direction: 'up' | 'down' | 'start' = 'start',
): ThreadNode {
  if (
    AppBskyFeedDefs.isThreadViewPost(node) &&
    bsky.dangerousIsType<AppBskyFeedPost.Record>(
      node.post.record,
      AppBskyFeedPost.isRecord,
    )
  ) {
    const post = node.post
    // These should normally be present. They're missing only for
    // posts that were *just* created. Ideally, the backend would
    // know to return zeros. Fill them in manually to compensate.
    post.replyCount ??= 0
    post.likeCount ??= 0
    post.repostCount ??= 0
    return {
      type: 'post',
      _reactKey: node.post.uri,
      uri: node.post.uri,
      post: post,
      record: node.post.record,
      parent:
        node.parent && direction !== 'down'
          ? responseToThreadNodes(node.parent, depth - 1, 'up')
          : undefined,
      replies:
        node.replies?.length && direction !== 'up'
          ? node.replies
              .map(reply => responseToThreadNodes(reply, depth + 1, 'down'))
              // do not show blocked posts in replies
              .filter(node => node.type !== 'blocked')
          : undefined,
      hasOPLike: Boolean(node?.threadContext?.rootAuthorLike),
      ctx: {
        depth,
        isHighlightedPost: depth === 0,
        hasMore:
          direction === 'down' && !node.replies?.length && !!post.replyCount,
        isSelfThread: false, // populated `annotateSelfThread`
        hasMoreSelfThread: false, // populated in `annotateSelfThread`
      },
    }
  } else if (AppBskyFeedDefs.isBlockedPost(node)) {
    return {type: 'blocked', _reactKey: node.uri, uri: node.uri, ctx: {depth}}
  } else if (AppBskyFeedDefs.isNotFoundPost(node)) {
    return {type: 'not-found', _reactKey: node.uri, uri: node.uri, ctx: {depth}}
  } else {
    return {type: 'unknown', uri: ''}
  }
}

function annotateSelfThread(thread: ThreadNode) {
  if (thread.type !== 'post') {
    return
  }
  const selfThreadNodes: ThreadPost[] = [thread]

  let parent: ThreadNode | undefined = thread.parent
  while (parent) {
    if (
      parent.type !== 'post' ||
      parent.post.author.did !== thread.post.author.did
    ) {
      // not a self-thread
      return
    }
    selfThreadNodes.unshift(parent)
    parent = parent.parent
  }

  let node = thread
  for (let i = 0; i < 10; i++) {
    const reply = node.replies?.find(
      r => r.type === 'post' && r.post.author.did === thread.post.author.did,
    )
    if (reply?.type !== 'post') {
      break
    }
    selfThreadNodes.push(reply)
    node = reply
  }

  if (selfThreadNodes.length > 1) {
    for (const selfThreadNode of selfThreadNodes) {
      selfThreadNode.ctx.isSelfThread = true
    }
    const last = selfThreadNodes[selfThreadNodes.length - 1]
    if (
      last &&
      last.ctx.depth === REPLY_TREE_DEPTH && // at the edge of the tree depth
      last.post.replyCount && // has replies
      !last.replies?.length // replies were not hydrated
    ) {
      last.ctx.hasMoreSelfThread = true
    }
  }
}

function findPostInQueryData(
  queryClient: QueryClient,
  uri: string,
): ThreadNode | void {
  let partial
  for (let item of findAllPostsInQueryData(queryClient, uri)) {
    if (item.type === 'post') {
      // Currently, the backend doesn't send full post info in some cases
      // (for example, for quoted posts). We use missing `likeCount`
      // as a way to detect that. In the future, we should fix this on
      // the backend, which will let us always stop on the first result.
      const hasAllInfo = item.post.likeCount != null
      if (hasAllInfo) {
        return item
      } else {
        partial = item
        // Keep searching, we might still find a full post in the cache.
      }
    }
  }
  return partial
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<ThreadNode, void> {
  const atUri = new AtUri(uri)

  const queryDatas = queryClient.getQueriesData<PostThreadQueryData>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    const {thread} = queryData
    for (const item of traverseThread(thread)) {
      if (item.type === 'post' && didOrHandleUriMatches(atUri, item.post)) {
        const placeholder = threadNodeToPlaceholderThread(item)
        if (placeholder) {
          yield placeholder
        }
      }
      const quotedPost =
        item.type === 'post' ? getEmbeddedPost(item.post.embed) : undefined
      if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
        yield embedViewRecordToPlaceholderThread(quotedPost)
      }
    }
  }
  for (let post of findAllPostsInNotifsQueryData(queryClient, uri)) {
    // Check notifications first. If you have a post in notifications,
    // it's often due to a like or a repost, and we want to prioritize
    // a post object with >0 likes/reposts over a stale version with no
    // metrics in order to avoid a notification->post scroll jump.
    yield postViewToPlaceholderThread(post)
  }
  for (let post of findAllPostsInFeedQueryData(queryClient, uri)) {
    yield postViewToPlaceholderThread(post)
  }
  for (let post of findAllPostsInQuoteQueryData(queryClient, uri)) {
    yield postViewToPlaceholderThread(post)
  }
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield postViewToPlaceholderThread(post)
  }
  for (let post of findAllPostsInExploreFeedPreviewsQueryData(
    queryClient,
    uri,
  )) {
    yield postViewToPlaceholderThread(post)
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileViewBasic, void> {
  const queryDatas = queryClient.getQueriesData<PostThreadQueryData>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    const {thread} = queryData
    for (const item of traverseThread(thread)) {
      if (item.type === 'post' && item.post.author.did === did) {
        yield item.post.author
      }
      const quotedPost =
        item.type === 'post' ? getEmbeddedPost(item.post.embed) : undefined
      if (quotedPost?.author.did === did) {
        yield quotedPost?.author
      }
    }
  }
  for (let profile of findAllProfilesInFeedQueryData(queryClient, did)) {
    yield profile
  }
  for (let profile of findAllProfilesInNotifsQueryData(queryClient, did)) {
    yield profile
  }
  for (let profile of findAllProfilesInSearchQueryData(queryClient, did)) {
    yield profile
  }
  for (let profile of findAllProfilesInExploreFeedPreviewsQueryData(
    queryClient,
    did,
  )) {
    yield profile
  }
}

function* traverseThread(node: ThreadNode): Generator<ThreadNode, void> {
  if (node.type === 'post') {
    if (node.parent) {
      yield* traverseThread(node.parent)
    }
    yield node
    if (node.replies?.length) {
      for (const reply of node.replies) {
        yield* traverseThread(reply)
      }
    }
  }
}

function threadNodeToPlaceholderThread(
  node: ThreadNode,
): ThreadNode | undefined {
  if (node.type !== 'post') {
    return undefined
  }
  return {
    type: node.type,
    _reactKey: node._reactKey,
    uri: node.uri,
    post: node.post,
    record: node.record,
    parent: undefined,
    replies: undefined,
    hasOPLike: undefined,
    ctx: {
      depth: 0,
      isHighlightedPost: true,
      hasMore: false,
      isParentLoading: !!node.record.reply,
      isChildLoading: !!node.post.replyCount,
    },
  }
}

function postViewToPlaceholderThread(
  post: AppBskyFeedDefs.PostView,
): ThreadNode {
  return {
    type: 'post',
    _reactKey: post.uri,
    uri: post.uri,
    post: post,
    record: post.record as AppBskyFeedPost.Record, // validated in notifs
    parent: undefined,
    replies: undefined,
    hasOPLike: undefined,
    ctx: {
      depth: 0,
      isHighlightedPost: true,
      hasMore: false,
      isParentLoading: !!(post.record as AppBskyFeedPost.Record).reply,
      isChildLoading: true, // assume yes (show the spinner) just in case
    },
  }
}

function embedViewRecordToPlaceholderThread(
  record: AppBskyEmbedRecord.ViewRecord,
): ThreadNode {
  return {
    type: 'post',
    _reactKey: record.uri,
    uri: record.uri,
    post: embedViewRecordToPostView(record),
    record: record.value as AppBskyFeedPost.Record, // validated in getEmbeddedPost
    parent: undefined,
    replies: undefined,
    hasOPLike: undefined,
    ctx: {
      depth: 0,
      isHighlightedPost: true,
      hasMore: false,
      isParentLoading: !!(record.value as AppBskyFeedPost.Record).reply,
      isChildLoading: true, // not available, so assume yes (to show the spinner)
    },
  }
}
