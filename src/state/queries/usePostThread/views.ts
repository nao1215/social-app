// AT Protocol APIの型定義と関数をインポート
// Import type definitions and functions from AT Protocol API
import {
  type $Typed, // 型安全性のためのタイプユーティリティ (Type utility for type safety)
  type AppBskyFeedDefs, // フィード関連の型定義 (Feed-related type definitions)
  type AppBskyFeedPost, // 投稿の型定義 (Post type definitions)
  type AppBskyUnspeccedDefs, // 未仕様化定義の型 (Unspecified definitions types)
  type AppBskyUnspeccedGetPostThreadV2, // スレッド取得API v2の型 (Thread retrieval API v2 types)
  AtUri, // AT URIパーサー (AT URI parser)
  moderatePost, // 投稿モデレーション関数 (Post moderation function)
  type ModerationOpts, // モデレーションオプションの型 (Moderation options type)
} from '@atproto/api'

// プロフィールリンク生成ユーティリティをインポート
// Import profile link generation utility
import {makeProfileLink} from '#/lib/routes/links'
// スレッド関連の型定義をインポート
// Import thread-related type definitions
import {
  type ApiThreadItem, // APIのスレッドアイテム型 (API thread item type)
  type ThreadItem, // UI用スレッドアイテム型 (UI thread item type)
  type TraversalMetadata, // トラバーサルメタデータ型 (Traversal metadata type)
} from '#/state/queries/usePostThread/types'

/**
 * 未認証ユーザー向けのスレッド投稿ビューを作成
 * Create thread post view for unauthenticated users
 */
export function threadPostNoUnauthenticated({
  uri, // 投稿のURI (Post URI)
  depth, // スレッドの深さ (Thread depth)
  value, // 投稿データ (Post data)
}: ApiThreadItem): Extract<ThreadItem, {type: 'threadPostNoUnauthenticated'}> {
  return {
    type: 'threadPostNoUnauthenticated',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedDefs.ThreadItemNoUnauthenticated,
    // @ts-ignore populated by the traversal
    ui: {},
  }
}

/**
 * 見つからない投稿のスレッドビューを作成
 * Create thread view for not found post
 */
export function threadPostNotFound({
  uri, // 投稿のURI (Post URI)
  depth, // スレッドの深さ (Thread depth)
  value, // 投稿データ (Post data)
}: ApiThreadItem): Extract<ThreadItem, {type: 'threadPostNotFound'}> {
  return {
    type: 'threadPostNotFound',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedDefs.ThreadItemNotFound,
  }
}

/**
 * ブロックされた投稿のスレッドビューを作成
 * Create thread view for blocked post
 */
export function threadPostBlocked({
  uri, // 投稿のURI (Post URI)
  depth, // スレッドの深さ (Thread depth)
  value, // 投稿データ (Post data)
}: ApiThreadItem): Extract<ThreadItem, {type: 'threadPostBlocked'}> {
  return {
    type: 'threadPostBlocked',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedDefs.ThreadItemBlocked,
  }
}

/**
 * 通常のスレッド投稿ビューを作成（モデレーションとスレッドゲートを適用）
 * Create regular thread post view with moderation and threadgate applied
 */
export function threadPost({
  uri, // 投稿のURI (Post URI)
  depth, // スレッドの深さ (Thread depth)
  value, // 投稿データ (Post data)
  moderationOpts, // モデレーションオプション (Moderation options)
  threadgateHiddenReplies, // スレッドゲートで非表示の返信 (Threadgate hidden replies)
}: {
  uri: string
  depth: number
  value: $Typed<AppBskyUnspeccedDefs.ThreadItemPost>
  moderationOpts: ModerationOpts
  threadgateHiddenReplies: Set<string>
}): Extract<ThreadItem, {type: 'threadPost'}> {
  // 投稿のモデレーション処理を実行 (Perform post moderation processing)
  const moderation = moderatePost(value.post, moderationOpts)
  const modui = moderation.ui('contentList')
  const blurred = modui.blur || modui.filter // ブラーまたはフィルター適用 (Blur or filter applied)
  const muted = (modui.blurs[0] || modui.filters[0])?.type === 'muted' // ミュート適用 (Muted)
  const hiddenByThreadgate = threadgateHiddenReplies.has(uri) // スレッドゲートで非表示 (Hidden by threadgate)
  const isOwnPost = value.post.author.did === moderationOpts.userDid // 自分の投稿か (Is own post)
  const isBlurred = (hiddenByThreadgate || blurred || muted) && !isOwnPost // ブラーすべきか判定 (Should be blurred)
  return {
    type: 'threadPost',
    key: uri,
    uri,
    depth,
    value: {
      ...value,
      /*
       * ここでは何も展開しない。投稿シャドウの厳密等価性参照チェックに重要。
       * Do not spread anything here, load bearing for post shadow strict
       * equality reference checks.
       */
      post: value.post as Omit<AppBskyFeedDefs.PostView, 'record'> & {
        record: AppBskyFeedPost.Record
      },
    },
    isBlurred,
    moderation,
    // @ts-ignore populated by the traversal
    ui: {},
  }
}

/**
 * 下方向の「続きを読む」リンクアイテムを作成
 * Create downward "read more" link item
 */
export function readMore({
  depth, // スレッドの深さ (Thread depth)
  repliesUnhydrated, // 未取得の返信数 (Number of unhydrated replies)
  skippedIndentIndices, // スキップされたインデント (Skipped indents)
  postData, // 投稿データ (Post data)
}: TraversalMetadata): Extract<ThreadItem, {type: 'readMore'}> {
  const urip = new AtUri(postData.uri)
  const href = makeProfileLink(
    {
      did: urip.host,
      handle: postData.authorHandle,
    },
    'post',
    urip.rkey,
  )
  return {
    type: 'readMore' as const,
    key: `readMore:${postData.uri}`,
    href,
    moreReplies: repliesUnhydrated,
    depth,
    skippedIndentIndices,
  }
}

export function readMoreUp({
  postData,
}: TraversalMetadata): Extract<ThreadItem, {type: 'readMoreUp'}> {
  const urip = new AtUri(postData.uri)
  const href = makeProfileLink(
    {
      did: urip.host,
      handle: postData.authorHandle,
    },
    'post',
    urip.rkey,
  )
  return {
    type: 'readMoreUp' as const,
    key: `readMoreUp:${postData.uri}`,
    href,
  }
}

export function skeleton({
  key,
  item,
}: Omit<Extract<ThreadItem, {type: 'skeleton'}>, 'type'>): Extract<
  ThreadItem,
  {type: 'skeleton'}
> {
  return {
    type: 'skeleton',
    key,
    item,
  }
}

export function postViewToThreadPlaceholder(
  post: AppBskyFeedDefs.PostView,
): $Typed<
  Omit<AppBskyUnspeccedGetPostThreadV2.ThreadItem, 'value'> & {
    value: $Typed<AppBskyUnspeccedDefs.ThreadItemPost>
  }
> {
  return {
    $type: 'app.bsky.unspecced.getPostThreadV2#threadItem',
    uri: post.uri,
    depth: 0, // reset to 0 for highlighted post
    value: {
      $type: 'app.bsky.unspecced.defs#threadItemPost',
      post,
      opThread: false,
      moreParents: false,
      moreReplies: 0,
      hiddenByThreadgate: false,
      mutedByViewer: false,
    },
  }
}
