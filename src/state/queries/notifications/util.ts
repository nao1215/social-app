// AT Protocol API の型と関数 / AT Protocol API types and functions
import {
  type AppBskyFeedDefs,
  AppBskyFeedLike,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  type AppBskyGraphDefs,
  AppBskyGraphStarterpack,
  type AppBskyNotificationListNotifications,
  type BskyAgent,
  hasMutedWord,
  moderateNotification,
  type ModerationOpts,
} from '@atproto/api'
// TanStack Query クライアント / TanStack Query client
import {type QueryClient} from '@tanstack/react-query'
// 配列をチャンクに分割するユーティリティ / Utility to chunk arrays
import chunk from 'lodash.chunk'

// モデレーション関連のユーティリティ / Moderation utility
import {labelIsHideableOffense} from '#/lib/moderation'
// Bluesky 型ユーティリティ / Bluesky type utilities
import * as bsky from '#/types/bsky'
// プロフィールのプリキャッシュ機能 / Profile precaching functionality
import {precacheProfile} from '../profile'
// 通知関連の型定義 / Notification related type definitions
import {
  type FeedNotification,
  type FeedPage,
  type NotificationType,
} from './types'

// グループ化可能な通知理由 / Groupable notification reasons
const GROUPABLE_REASONS = [
  'like',              // いいね / Like
  'repost',            // リポスト / Repost
  'follow',            // フォロー / Follow
  'like-via-repost',   // リポスト経由のいいね / Like via repost
  'repost-via-repost', // リポスト経由のリポスト / Repost via repost
  'subscribed-post',   // 購読投稿 / Subscribed post
]
// 時間定数 / Time constants
const MS_1HR = 1e3 * 60 * 60    // 1時間 / 1 hour
const MS_2DAY = MS_1HR * 48     // 2日 / 2 days

// 公開 API / Exported API
// =

/**
 * 通知フィードのページを取得する
 * Fetches a page of notification feed
 * 
 * @param agent - Bluesky エージェント / Bluesky agent
 * @param cursor - ページネーション用カーソル / Pagination cursor
 * @param limit - 取得件数 / Number of items to fetch
 * @param queryClient - TanStack Query クライアント / TanStack Query client
 * @param moderationOpts - モデレーションオプション / Moderation options
 * @param fetchAdditionalData - 追加データを取得するか / Whether to fetch additional data
 * @param reasons - フィルタリング用の通知理由 / Notification reasons for filtering
 * @returns フィードページとインデックス日時 / Feed page and indexed date
 */
export async function fetchPage({
  agent,
  cursor,
  limit,
  queryClient,
  moderationOpts,
  fetchAdditionalData,
  reasons,
}: {
  agent: BskyAgent
  cursor: string | undefined
  limit: number
  queryClient: QueryClient
  moderationOpts: ModerationOpts | undefined
  fetchAdditionalData: boolean
  reasons: string[]
}): Promise<{
  page: FeedPage
  indexedAt: string | undefined
}> {
  // 通知一覧を取得 / Fetch notifications list
  const res = await agent.listNotifications({
    limit,
    cursor,
    reasons,
  })

  // 最初の通知のインデックス日時を取得 / Get indexed date of first notification
  const indexedAt = res.data.notifications[0]?.indexedAt

  // モデレーションルールによって通知をフィルタリング / Filter out notifications by moderation rules
  const notifs = res.data.notifications.filter(
    notif => !shouldFilterNotif(notif, moderationOpts),
  )

  // 本質的に同じ通知をグループ化（フォロー、投稿へのいいねなど） / Group notifications which are essentially similar
  let notifsGrouped = groupNotifications(notifs)

  // UIでのレイアウト再計算を避けるため、遅延読み込みではなく今通知の対象（通常は投稿）を取得
  // Fetch subjects of notifications (usually posts) now instead of lazily in the UI to avoid relayouts
  if (fetchAdditionalData) {
    const subjects = await fetchSubjects(agent, notifsGrouped)
    for (const notif of notifsGrouped) {
      if (notif.subjectUri) {
        if (
          notif.type === 'starterpack-joined' &&
          notif.notification.reasonSubject
        ) {
          // スターターパック参加通知の場合 / For starter pack joined notifications
          notif.subject = subjects.starterPacks.get(
            notif.notification.reasonSubject,
          )
        } else {
          // 通常の投稿関連通知の場合 / For regular post-related notifications
          notif.subject = subjects.posts.get(notif.subjectUri)
          if (notif.subject) {
            // 投稿者のプロフィールをプリキャッシュ / Precache author's profile
            precacheProfile(queryClient, notif.subject.author)
          }
        }
      }
    }
  }

  // 既読日時を設定（無効な日付の場合は現在時刻を使用） / Set seen date (use current time if invalid date)
  let seenAt = res.data.seenAt ? new Date(res.data.seenAt) : new Date()
  if (Number.isNaN(seenAt.getTime())) {
    seenAt = new Date()
  }

  return {
    page: {
      cursor: res.data.cursor, // 次のページのカーソル / Cursor for next page
      seenAt, // 既読日時 / Seen date
      items: notifsGrouped, // グループ化された通知アイテム / Grouped notification items
      priority: res.data.priority ?? false, // 優先度フラグ / Priority flag
    },
    indexedAt, // インデックス日時 / Index date
  }
}

// 内部メソッド / Internal methods
// =

/**
 * 通知をフィルタリングすべきか判定する
 * Determines if a notification should be filtered
 * 
 * @param notif - 通知データ / Notification data
 * @param moderationOpts - モデレーションオプション / Moderation options
 * @returns フィルタリングすべき場合はtrue / true if should be filtered
 */
export function shouldFilterNotif(
  notif: AppBskyNotificationListNotifications.Notification,
  moderationOpts: ModerationOpts | undefined,
): boolean {
  // 非表示対象のラベルが含まれているかチェック / Check if contains hideable offense labels
  const containsImperative = !!notif.author.labels?.some(labelIsHideableOffense)
  if (containsImperative) {
    return true // 非表示対象ラベルがある場合はフィルタリング / Filter if hideable offense label exists
  }
  if (!moderationOpts) {
    return false // モデレーションオプションがない場合はフィルタリングしない / Don't filter if no moderation options
  }
  // 購読投稿でミュートされた単語が含まれているかチェック / Check for muted words in subscribed posts
  if (
    notif.reason === 'subscribed-post' &&
    bsky.dangerousIsType<AppBskyFeedPost.Record>(
      notif.record,
      AppBskyFeedPost.isRecord,
    ) &&
    hasMutedWord({
      mutedWords: moderationOpts.prefs.mutedWords,
      text: notif.record.text,
      facets: notif.record.facets,
      outlineTags: notif.record.tags,
      languages: notif.record.langs,
      actor: notif.author,
    })
  ) {
    return true // ミュートされた単語が含まれている場合はフィルタリング / Filter if contains muted words
  }
  if (notif.author.viewer?.following) {
    return false // フォロー中のユーザーはフィルタリングしない / Don't filter if following the author
  }
  // モデレーションルールに基づく最終判定 / Final judgment based on moderation rules
  return moderateNotification(notif, moderationOpts).ui('contentList').filter
}

/**
 * 通知をグループ化する
 * Groups notifications together
 * 
 * @param notifs - 通知の配列 / Array of notifications
 * @returns グループ化されたフィード通知 / Grouped feed notifications
 */
export function groupNotifications(
  notifs: AppBskyNotificationListNotifications.Notification[],
): FeedNotification[] {
  const groupedNotifs: FeedNotification[] = []
  for (const notif of notifs) {
    const ts = +new Date(notif.indexedAt) // 通知のタイムスタンプ / Notification timestamp
    let grouped = false
    // グループ化可能な理由かチェック / Check if reason is groupable
    if (GROUPABLE_REASONS.includes(notif.reason)) {
      for (const groupedNotif of groupedNotifs) {
        const ts2 = +new Date(groupedNotif.notification.indexedAt)
        // グループ化条件をチェック / Check grouping conditions
        if (
          Math.abs(ts2 - ts) < MS_2DAY && // 2日以内 / Within 2 days
          notif.reason === groupedNotif.notification.reason && // 同じ理由 / Same reason
          notif.reasonSubject === groupedNotif.notification.reasonSubject && // 同じ対象 / Same subject
          (notif.author.did !== groupedNotif.notification.author.did || // 異なる作者、または購読投稿 / Different author or subscribed post
            notif.reason === 'subscribed-post')
        ) {
          // 相互フォローの判定 / Determine mutual follow
          const nextIsFollowBack =
            notif.reason === 'follow' && notif.author.viewer?.following
          const prevIsFollowBack =
            groupedNotif.notification.reason === 'follow' &&
            groupedNotif.notification.author.viewer?.following
          const shouldUngroup = nextIsFollowBack || prevIsFollowBack
          if (!shouldUngroup) {
            // グループに追加 / Add to group
            groupedNotif.additional = groupedNotif.additional || []
            groupedNotif.additional.push(notif)
            grouped = true
            break
          }
        }
      }
    }
    if (!grouped) {
      // グループ化されなかった場合、新しいエントリとして追加 / If not grouped, add as new entry
      const type = toKnownType(notif)
      if (type !== 'starterpack-joined') {
        groupedNotifs.push({
          _reactKey: `notif-${notif.uri}-${notif.reason}`,
          type,
          notification: notif,
          subjectUri: getSubjectUri(type, notif), // 対象URIを取得 / Get subject URI
        })
      } else {
        // スターターパック参加通知の特別処理 / Special handling for starter pack joined notifications
        groupedNotifs.push({
          _reactKey: `notif-${notif.uri}-${notif.reason}`,
          type: 'starterpack-joined',
          notification: notif,
          subjectUri: notif.uri, // 通知自体のURIを使用 / Use notification's own URI
        })
      }
    }
  }
  return groupedNotifs
}

/**
 * 通知の対象（投稿やスターターパック）を取得する
 * Fetches subjects (posts or starter packs) of notifications
 * 
 * @param agent - Bluesky エージェント / Bluesky agent
 * @param groupedNotifs - グループ化された通知 / Grouped notifications
 * @returns 投稿とスターターパックのMap / Maps of posts and starter packs
 */
async function fetchSubjects(
  agent: BskyAgent,
  groupedNotifs: FeedNotification[],
): Promise<{
  posts: Map<string, AppBskyFeedDefs.PostView>
  starterPacks: Map<string, AppBskyGraphDefs.StarterPackViewBasic>
}> {
  const postUris = new Set<string>() // 投稿URIのセット / Set of post URIs
  const packUris = new Set<string>() // スターターパックURIのセット / Set of starter pack URIs
  // 各通知からURIを収集 / Collect URIs from each notification
  for (const notif of groupedNotifs) {
    if (notif.subjectUri?.includes('app.bsky.feed.post')) {
      postUris.add(notif.subjectUri) // 投稿URIを追加 / Add post URI
    } else if (
      notif.notification.reasonSubject?.includes('app.bsky.graph.starterpack')
    ) {
      packUris.add(notif.notification.reasonSubject) // スターターパックURIを追加 / Add starter pack URI
    }
  }
  // URIをチャンクに分割（API制限のため） / Split URIs into chunks (for API limits)
  const postUriChunks = chunk(Array.from(postUris), 25)
  const packUriChunks = chunk(Array.from(packUris), 25)
  // 投稿を並列取得 / Fetch posts in parallel
  const postsChunks = await Promise.all(
    postUriChunks.map(uris =>
      agent.app.bsky.feed.getPosts({uris}).then(res => res.data.posts),
    ),
  )
  // スターターパックを並列取得 / Fetch starter packs in parallel
  const packsChunks = await Promise.all(
    packUriChunks.map(uris =>
      agent.app.bsky.graph
        .getStarterPacks({uris})
        .then(res => res.data.starterPacks),
    ),
  )
  // URIとデータのMapを作成 / Create maps of URIs to data
  const postsMap = new Map<string, AppBskyFeedDefs.PostView>()
  const packsMap = new Map<string, AppBskyGraphDefs.StarterPackViewBasic>()
  // 投稿データをMapに追加 / Add post data to map
  for (const post of postsChunks.flat()) {
    if (AppBskyFeedPost.isRecord(post.record)) {
      postsMap.set(post.uri, post)
    }
  }
  // スターターパックデータをMapに追加 / Add starter pack data to map
  for (const pack of packsChunks.flat()) {
    if (AppBskyGraphStarterpack.isRecord(pack.record)) {
      packsMap.set(pack.uri, pack)
    }
  }
  return {
    posts: postsMap,
    starterPacks: packsMap,
  }
}

/**
 * 通知の理由を既知のタイプに変換する
 * Converts notification reason to known type
 * 
 * @param notif - 通知データ / Notification data
 * @returns 既知の通知タイプ / Known notification type
 */
function toKnownType(
  notif: AppBskyNotificationListNotifications.Notification,
): NotificationType {
  if (notif.reason === 'like') {
    if (notif.reasonSubject?.includes('feed.generator')) {
      return 'feedgen-like' // フィードジェネレーターへのいいね / Feed generator like
    }
    return 'post-like' // 投稿へのいいね / Post like
  }
  // 既知の理由かチェック / Check if known reason
  if (
    notif.reason === 'repost' ||
    notif.reason === 'mention' ||
    notif.reason === 'reply' ||
    notif.reason === 'quote' ||
    notif.reason === 'follow' ||
    notif.reason === 'starterpack-joined' ||
    notif.reason === 'verified' ||
    notif.reason === 'unverified' ||
    notif.reason === 'like-via-repost' ||
    notif.reason === 'repost-via-repost' ||
    notif.reason === 'subscribed-post'
  ) {
    return notif.reason as NotificationType
  }
  return 'unknown' // 不明なタイプ / Unknown type
}

/**
 * 通知タイプと通知データから対象URIを取得する
 * Gets subject URI from notification type and notification data
 * 
 * @param type - 通知タイプ / Notification type
 * @param notif - 通知データ / Notification data
 * @returns 対象URIまたはundefined / Subject URI or undefined
 */
function getSubjectUri(
  type: NotificationType,
  notif: AppBskyNotificationListNotifications.Notification,
): string | undefined {
  // 投稿関連の通知は通知自体のURIを使用 / For post-related notifications, use notification's own URI
  if (
    type === 'reply' ||
    type === 'quote' ||
    type === 'mention' ||
    type === 'subscribed-post'
  ) {
    return notif.uri
  } else if (
    // アクション系の通知はレコードから対象URIを取得 / For action-based notifications, get subject URI from record
    type === 'post-like' ||
    type === 'repost' ||
    type === 'like-via-repost' ||
    type === 'repost-via-repost'
  ) {
    if (
      bsky.dangerousIsType<AppBskyFeedRepost.Record>(
        notif.record,
        AppBskyFeedRepost.isRecord,
      ) ||
      bsky.dangerousIsType<AppBskyFeedLike.Record>(
        notif.record,
        AppBskyFeedLike.isRecord,
      )
    ) {
      return typeof notif.record.subject?.uri === 'string'
        ? notif.record.subject?.uri
        : undefined
    }
  } else if (type === 'feedgen-like') {
    // フィードジェネレーターへのいいねは理由対象を使用 / For feed generator likes, use reason subject
    return notif.reasonSubject
  }
}
