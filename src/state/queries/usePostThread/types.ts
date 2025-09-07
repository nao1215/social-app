// AT Protocol APIの型定義をインポート
// Import type definitions from AT Protocol API
import {
  type AppBskyFeedDefs, // フィード関連の型定義 (Feed-related type definitions)
  type AppBskyFeedPost, // 投稿の型定義 (Post type definitions)
  type AppBskyFeedThreadgate, // スレッドゲートの型定義 (Threadgate type definitions)
  type AppBskyUnspeccedDefs, // 未仕様化定義の型 (Unspecified definitions types)
  type AppBskyUnspeccedGetPostThreadOtherV2, // 他のスレッド取得APIの型 (Other thread retrieval API types)
  type AppBskyUnspeccedGetPostThreadV2, // スレッド取得API v2の型 (Thread retrieval API v2 types)
  type ModerationDecision, // モデレーション判定の型 (Moderation decision types)
} from '@atproto/api'

/**
 * APIから返されるスレッドアイテムのユニオン型
 * Union type for thread items returned from API
 */
export type ApiThreadItem =
  | AppBskyUnspeccedGetPostThreadV2.ThreadItem
  | AppBskyUnspeccedGetPostThreadOtherV2.ThreadItem

// スレッドクエリのルートキーを定義
// Define root key for thread queries
export const postThreadQueryKeyRoot = 'post-thread-v2' as const

/**
 * 投稿スレッドクエリのキーを生成
 * Generate query key for post thread query
 */
export const createPostThreadQueryKey = (props: PostThreadParams) =>
  [postThreadQueryKeyRoot, props] as const

/**
 * 他のスレッドクエリのキーを生成
 * Generate query key for other thread query
 */
export const createPostThreadOtherQueryKey = (
  props: Omit<AppBskyUnspeccedGetPostThreadOtherV2.QueryParams, 'anchor'> & {
    anchor?: string // アンカー投稿のURI (URI of anchor post)
  },
) => [postThreadQueryKeyRoot, 'other', props] as const

/**
 * 投稿スレッドクエリのパラメータ型
 * Parameters type for post thread query
 */
export type PostThreadParams = Pick<
  AppBskyUnspeccedGetPostThreadV2.QueryParams,
  'sort' | 'prioritizeFollowedUsers' // ソート方法とフォローユーザー優先表示 (Sort method and followed users priority)
> & {
  anchor?: string // アンカー投稿のURI (URI of anchor post)
  view: 'tree' | 'linear' // 表示モード：ツリーまたはリニア (View mode: tree or linear)
}

/**
 * 投稿スレッドクエリの結果型
 * Result type for post thread query
 */
export type UsePostThreadQueryResult = {
  hasOtherReplies: boolean // 他の返信が存在するか (Whether other replies exist)
  thread: AppBskyUnspeccedGetPostThreadV2.ThreadItem[] // スレッドアイテムの配列 (Array of thread items)
  threadgate?: Omit<AppBskyFeedDefs.ThreadgateView, 'record'> & {
    record: AppBskyFeedThreadgate.Record // スレッドゲート設定 (Threadgate settings)
  }
}

/**
 * スレッドアイテムのユニオン型 - UI表示用のメタデータを含む
 * Union type for thread items with UI metadata for display
 */
export type ThreadItem =
  | {
      type: 'threadPost' // 通常のスレッド投稿 (Regular thread post)
      key: string // 一意識別キー (Unique identifier key)
      uri: string // 投稿のURI (Post URI)
      depth: number // スレッドの深さ (Thread depth)
      value: Omit<AppBskyUnspeccedDefs.ThreadItemPost, 'post'> & {
        post: Omit<AppBskyFeedDefs.PostView, 'record'> & {
          record: AppBskyFeedPost.Record // 投稿レコード (Post record)
        }
      }
      isBlurred: boolean // ブラーされているか (Whether post is blurred)
      moderation: ModerationDecision // モデレーション判定 (Moderation decision)
      ui: {
        isAnchor: boolean // アンカー投稿か (Whether this is anchor post)
        showParentReplyLine: boolean // 親返信ラインを表示するか (Show parent reply line)
        showChildReplyLine: boolean // 子返信ラインを表示するか (Show child reply line)
        indent: number // インデントレベル (Indent level)
        isLastChild: boolean // 最後の子要素か (Whether this is last child)
        skippedIndentIndices: Set<number> // スキップされたインデントインデックス (Skipped indent indices)
        precedesChildReadMore: boolean // 子の「続きを読む」の前か (Precedes child read more)
      }
    }
  | {
      type: 'threadPostNoUnauthenticated' // 未認証ユーザー向け投稿 (Post for unauthenticated users)
      key: string // 一意識別キー (Unique identifier key)
      uri: string // 投稿のURI (Post URI)
      depth: number // スレッドの深さ (Thread depth)
      value: AppBskyUnspeccedDefs.ThreadItemNoUnauthenticated
      ui: {
        showParentReplyLine: boolean // 親返信ラインを表示するか (Show parent reply line)
        showChildReplyLine: boolean // 子返信ラインを表示するか (Show child reply line)
      }
    }
  | {
      type: 'threadPostNotFound' // 見つからない投稿 (Post not found)
      key: string // 一意識別キー (Unique identifier key)
      uri: string // 投稿のURI (Post URI)
      depth: number // スレッドの深さ (Thread depth)
      value: AppBskyUnspeccedDefs.ThreadItemNotFound
    }
  | {
      type: 'threadPostBlocked' // ブロックされた投稿 (Blocked post)
      key: string // 一意識別キー (Unique identifier key)
      uri: string // 投稿のURI (Post URI)
      depth: number // スレッドの深さ (Thread depth)
      value: AppBskyUnspeccedDefs.ThreadItemBlocked
    }
  | {
      type: 'replyComposer' // 返信作成フォーム (Reply composer form)
      key: string // 一意識別キー (Unique identifier key)
    }
  | {
      type: 'showOtherReplies' // 他の返信を表示するボタン (Show other replies button)
      key: string // 一意識別キー (Unique identifier key)
      onPress: () => void // ボタン押下時のハンドラ (Handler for button press)
    }
  | {
      /*
       * スレッドで下方向にもっと返信を読む
       * Read more replies, downwards in the thread.
       */
      type: 'readMore' // 続きを読む（下方向） (Read more downwards)
      key: string // 一意識別キー (Unique identifier key)
      depth: number // スレッドの深さ (Thread depth)
      href: string // リンクURL (Link URL)
      moreReplies: number // さらにある返信数 (Number of additional replies)
      skippedIndentIndices: Set<number> // スキップされたインデントインデックス (Skipped indent indices)
    }
  | {
      /*
       * スレッドで上方向にもっと親投稿を読む
       * Read more parents, upwards in the thread.
       */
      type: 'readMoreUp' // 続きを読む（上方向） (Read more upwards)
      key: string // 一意識別キー (Unique identifier key)
      href: string // リンクURL (Link URL)
    }
  | {
      type: 'skeleton' // スケルトンローディング (Skeleton loading)
      key: string // 一意識別キー (Unique identifier key)
      item: 'anchor' | 'reply' | 'replyComposer' // スケルトンタイプ (Skeleton type)
    }

/**
 * Metadata collected while traversing the raw data from the thread response.
 * Some values here can be computed immediately, while others need to be
 * computed during a second pass over the thread after we know things like
 * total number of replies, the reply index, etc.
 *
 * The idea here is that these values should be objectively true in all cases,
 * such that we can use them later — either individually on in composite — to
 * drive rendering behaviors.
 */
export type TraversalMetadata = {
  /**
   * The depth of the post in the reply tree, where 0 is the root post. This is
   * calculated on the server.
   */
  depth: number
  /**
   * Indicates if this item is a "read more" link preceding this post that
   * continues the thread upwards.
   */
  followsReadMoreUp: boolean
  /**
   * Indicates if the post is the last reply beneath its parent post.
   */
  isLastSibling: boolean
  /**
   * Indicates the post is the end-of-the-line for a given branch of replies.
   */
  isLastChild: boolean
  /**
   * Indicates if the post is the left-most AND lower-most branch of the reply
   * tree. Value corresponds to the depth at which this branch started.
   */
  isPartOfLastBranchFromDepth?: number
  /**
   * The depth of the slice immediately following this one, if it exists.
   */
  nextItemDepth?: number
  /**
   * This is a live reference to the parent metadata object. Mutations to this
   * are available for later use in children.
   */
  parentMetadata?: TraversalMetadata
  /**
   * Populated during the final traversal of the thread. Denotes whether
   * there is a "Read more" link for this item immediately following
   * this item.
   */
  precedesChildReadMore: boolean
  /**
   * The depth of the slice immediately preceding this one, if it exists.
   */
  prevItemDepth?: number
  /**
   * Any data needed to be passed along to the "read more" items. Keep this
   * trim for better memory usage.
   */
  postData: {
    uri: string
    authorHandle: string
  }
  /**
   * The total number of replies to this post, including those not hydrated
   * and returned by the response.
   */
  repliesCount: number
  /**
   * The number of replies to this post not hydrated and returned by the
   * response.
   */
  repliesUnhydrated: number
  /**
   * The number of replies that have been seen so far in the traversal.
   * Excludes replies that are moderated in some way, since those are not
   * "seen" on first load. Use `repliesIndexCounter` for the total number of
   * replies that were hydrated in the response.
   *
   * After traversal, we can use this to calculate if we actually got all the
   * replies we expected, or if some were blocked, etc.
   */
  repliesSeenCounter: number
  /**
   * The total number of replies to this post hydrated in this response. Used
   * for populating the `replyIndex` of the post by referencing this value on
   * the parent.
   */
  repliesIndexCounter: number
  /**
   * The index-0-based index of this reply in the parent post's replies.
   */
  replyIndex: number
  /**
   * Each slice is responsible for rendering reply lines based on its depth.
   * This value corresponds to any line indices that can be skipped e.g.
   * because there are no further replies below this sub-tree to render.
   */
  skippedIndentIndices: Set<number>
  /**
   * Indicates and stores parent data IF that parent has additional unhydrated
   * replies. This value is passed down to children along the left/lower-most
   * branch of the tree. When the end is reached, a "read more" is inserted.
   */
  upcomingParentReadMore?: TraversalMetadata
}
