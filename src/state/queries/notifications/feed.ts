/**
 * 通知フィード管理の注意事項
 * NOTE - Notification Feed Management
 * 
 * ./unread.ts API について:
 * The ./unread.ts API:
 *
 * - サーバーと同期するための `checkUnread()` 関数を提供
 * - Provides a `checkUnread()` function to sync with the server,
 * - 定期的に `checkUnread()` を呼び出し
 * - Periodically calls `checkUnread()`, and
 * - 通知の最初のページをキャッシュ
 * - Caches the first page of notifications.
 *
 * 重要: このクエリは ./unread.ts のキャッシュを最初のページとして使用
 * IMPORTANT: This query uses ./unread.ts's cache as its first page,
 * 重要: つまり、このクエリのキャッシュの新鮮さは未読API によって駆動される
 * IMPORTANT: which means the cache-freshness of this query is driven by the unread API.
 *
 * 以下のルールに従ってください:
 * Follow these rules:
 *
 * 1. バックグラウンドで最新を取得したい場合は `checkUnread()` を呼び出す
 * 1. Call `checkUnread()` if you want to fetch latest in the background.
 * 2. 最新をこのクエリの結果に即座に同期したい場合は `checkUnread({invalidate: true})` を呼び出す
 * 2. Call `checkUnread({invalidate: true})` if you want latest to sync into this query's results immediately.
 * 3. 最新を同期しようとする場合はこのクエリの `refetch()` を呼び出さず、代わりに `checkUnread()` を使用
 * 3. Don't call this query's `refetch()` if you're trying to sync latest; call `checkUnread()` instead.
 */

// React フック / React hooks
import {useCallback, useEffect, useMemo, useRef} from 'react'
// AT Protocol API の型定義と関数 / AT Protocol API types and functions
import {
  type AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  moderatePost,
} from '@atproto/api'
// TanStack Query の型と関数 / TanStack Query types and functions
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

// モデレーション設定フック / Moderation settings hook
import {useModerationOpts} from '#/state/preferences/moderation-opts'
// クエリキャッシュ設定 / Query cache settings
import {STALE} from '#/state/queries'
// セッション管理 / Session management
import {useAgent} from '#/state/session'
// スレッドゲートによる非表示返信URI管理 / Thread gate hidden reply URIs management
import {useThreadgateHiddenReplyUris} from '#/state/threadgate-hidden-replies'
// ユーティリティ関数 / Utility functions
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from '../util'
// 通知フィードの型定義 / Notification feed types
import {type FeedPage} from './types'
// 未読通知API / Unread notifications API
import {useUnreadNotificationsApi} from './unread'
// ページ取得ユーティリティ / Page fetching utility
import {fetchPage} from './util'

export type {FeedNotification, FeedPage, NotificationType} from './types'

// 1ページあたりのアイテム数 / Items per page
const PAGE_SIZE = 30

type RQPageParam = string | undefined

// 通知フィードクエリのルートキー / Root key for notification feed queries
const RQKEY_ROOT = 'notification-feed'
/**
 * 通知フィードクエリキーを生成する関数
 * Function to generate notification feed query key
 */
export function RQKEY(filter: 'all' | 'mentions') {
  return [RQKEY_ROOT, filter]
}

/**
 * 通知フィードを取得するクエリフック
 * Query hook for retrieving notification feed
 * 
 * @param opts.enabled - クエリが有効かどうか / Whether the query is enabled
 * @param opts.filter - フィルタータイプ（全て または メンション） / Filter type (all or mentions)
 * @returns 無限クエリの結果 / Infinite query result
 */
export function useNotificationFeedQuery(opts: {
  enabled?: boolean
  filter: 'all' | 'mentions'
}) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const moderationOpts = useModerationOpts() // モデレーション設定を取得 / Get moderation settings
  const unreads = useUnreadNotificationsApi() // 未読通知API / Unread notifications API
  const enabled = opts.enabled !== false
  const filter = opts.filter
  const {uris: hiddenReplyUris} = useThreadgateHiddenReplyUris() // 非表示にされた返信URI / Hidden reply URIs

  // select関数で使用する引数をメモ化 / Memoize arguments used in select function
  const selectArgs = useMemo(() => {
    return {
      moderationOpts,
      hiddenReplyUris,
    }
  }, [moderationOpts, hiddenReplyUris])
  // 前回の実行結果をキャッシュしてパフォーマンス向上 / Cache previous run results for performance
  const lastRun = useRef<{
    data: InfiniteData<FeedPage>
    args: typeof selectArgs
    result: InfiniteData<FeedPage>
  } | null>(null)

  const query = useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.INFINITY, // キャッシュを無限に保持 / Keep cache infinitely
    queryKey: RQKEY(filter),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      let page
      if (filter === 'all' && !pageParam) {
        // 最初のページでは、未読チェッカーが保持するキャッシュページを最初に確認 / For the first page, check cached page held by unread-checker first
        page = unreads.getCachedUnreadPage()
      }
      if (!page) {
        let reasons: string[] = []
        if (filter === 'mentions') {
          // 投稿に関するもの全て / Anything that's a post
          reasons = [
            'mention', // メンション / Mention
            'reply',   // 返信 / Reply
            'quote',   // 引用 / Quote
          ]
        }
        // ページを取得 / Fetch page
        const {page: fetchedPage} = await fetchPage({
          agent,
          limit: PAGE_SIZE,
          cursor: pageParam,
          queryClient,
          moderationOpts,
          fetchAdditionalData: true, // 追加データも取得 / Also fetch additional data
          reasons,
        })
        page = fetchedPage
      }

      if (filter === 'all' && !pageParam) {
        // 最初のページに未読がある場合、全てを既読にマーク / If first page has unread, mark all as read
        unreads.markAllRead()
      }

      return page
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
    select: useCallback(
      (data: InfiniteData<FeedPage>) => {
        const {moderationOpts, hiddenReplyUris} = selectArgs

        // 前回の実行を追跡し、既に選択済みのページを再利用できるかを確認
        // Keep track of the last run and whether we can reuse some already selected pages from there.
        let reusedPages = []
        if (lastRun.current) {
          const {
            data: lastData,
            args: lastArgs,
            result: lastResult,
          } = lastRun.current
          let canReuse = true
          // 引数が変更されていないかチェック / Check if arguments haven't changed
          for (let key in selectArgs) {
            if (selectArgs.hasOwnProperty(key)) {
              if ((selectArgs as any)[key] !== (lastArgs as any)[key]) {
                // 何か入力が変更された場合は再利用不可 / Can't reuse anything if any input has changed
                canReuse = false
                break
              }
            }
          }
          if (canReuse) {
            // ページが一致する限り再利用 / Reuse pages as long as they match
            for (let i = 0; i < data.pages.length; i++) {
              if (data.pages[i] && lastData.pages[i] === data.pages[i]) {
                reusedPages.push(lastResult.pages[i])
                continue
              }
              // ページが一致しなくなったら停止 / Stop as soon as pages stop matching up
              break
            }
          }
        }

        // 最初のページから返されたseenAtを使用してisReadを上書き
        // override 'isRead' using the first page's returned seenAt
        // 上記のmarkAllRead()呼び出しが後続ページを早期に既読マークするため
        // we do this because the `markAllRead()` call above will mark subsequent pages as read prematurely
        const seenAt = data.pages[0]?.seenAt || new Date()
        for (const page of data.pages) {
          for (const item of page.items) {
            item.notification.isRead =
              seenAt > new Date(item.notification.indexedAt)
          }
        }

        const result = {
          ...data,
          pages: [
            ...reusedPages,
            ...data.pages.slice(reusedPages.length).map(page => {
              return {
                ...page,
                items: page.items
                  .filter(item => {
                    // スレッドゲートで非表示にされた返信をフィルタリング / Filter out replies hidden by threadgate
                    const isHiddenReply =
                      item.type === 'reply' &&
                      item.subjectUri &&
                      hiddenReplyUris.has(item.subjectUri)
                    return !isHiddenReply
                  })
                  .filter(item => {
                    // モデレーションルールに基づくフィルタリング / Filter based on moderation rules
                    if (
                      item.type === 'reply' ||
                      item.type === 'mention' ||
                      item.type === 'quote'
                    ) {
                      /*
                       * `isPostView`チェックはここでは失敗する。`subject`に`$type`フィールドがないため。
                       * The `isPostView` check will fail here bc we don't have a `$type` field on the `subject`.
                       * しかし、ネストした`record`が投稿であれば、それは投稿ビューだと分かる。
                       * But if the nested `record` is a post, we know it's a post view.
                       */
                      if (AppBskyFeedPost.isRecord(item.subject?.record)) {
                        const mod = moderatePost(item.subject, moderationOpts!)
                        if (mod.ui('contentList').filter) {
                          return false // フィルタリング対象 / Subject to filtering
                        }
                      }
                    }
                    return true
                  }),
              }
            }),
          ],
        }

        // 次回の比較用に現在の実行結果を保存 / Save current run results for next comparison
        lastRun.current = {data, result, args: selectArgs}

        return result
      },
      [selectArgs],
    ),
  })

  // サーバーは空のページ、アイテムが少ないページ、またはフィルタリングされてしまうアイテムを含むページを返すことがある
  // The server may end up returning an empty page, a page with too few items, or a page with items that end up getting filtered out.
  // ページを取得する際、実際に見たいアイテム数を追跡する
  // When we fetch pages, we'll keep track of how many items we actually hope to see.
  // サーバーが十分なアイテムを返さない場合、さらにアイテムを要求し続ける
  // If the server doesn't return enough items, we're going to continue asking for more items.
  const lastItemCount = useRef(0) // 前回のアイテム数 / Last item count
  const wantedItemCount = useRef(0) // 望ましいアイテム数 / Wanted item count
  const autoPaginationAttemptCount = useRef(0) // 自動ページネーション試行回数 / Auto-pagination attempt count
  useEffect(() => {
    const {data, isLoading, isRefetching, isFetchingNextPage, hasNextPage} =
      query
    // 既に持っているアイテムをカウント / Count the items that we already have
    let itemCount = 0
    for (const page of data?.pages || []) {
      itemCount += page.items.length
    }

    // アイテムが切り捨てられた場合、追跡している状態をリセット / If items got truncated, reset the state we're tracking
    if (itemCount !== lastItemCount.current) {
      if (itemCount < lastItemCount.current) {
        wantedItemCount.current = itemCount
      }
      lastItemCount.current = itemCount
    }

    // 実際に欲しいアイテム数を追跡し、必要に応じてさらに取得 / Track how many items we really want, and fetch more if needed
    if (isLoading || isRefetching) {
      // 初期取得時は、1ページ分のアイテムを取得したい / During initial fetch, we want to get an entire page's worth of items
      wantedItemCount.current = PAGE_SIZE
    } else if (isFetchingNextPage) {
      if (itemCount > wantedItemCount.current) {
        // wantedItemCountより多くのアイテムがある場合、wantedItemCountが古い
        // We have more items than wantedItemCount, so wantedItemCount must be out of date
        // 他のコードがfetchNextPage()を呼び出した可能性がある（例：onEndReachedから）
        // Some other code must have called fetchNextPage(), for example, from onEndReached
        // さらに1ページ分のアイテムが欲しいことを反映してwantedItemCountを調整
        // Adjust the wantedItemCount to reflect that we want one more full page of items
        wantedItemCount.current = itemCount + PAGE_SIZE
      }
    } else if (hasNextPage) {
      // この時点ではもう取得していないため、決断する時 / At this point we're not fetching anymore, so it's time to make a decision
      // サーバーから十分なアイテムを受信していない場合、受信するまで再度ページネート / If we didn't receive enough items from the server, paginate again until we do
      if (itemCount < wantedItemCount.current) {
        autoPaginationAttemptCount.current++
        if (autoPaginationAttemptCount.current < 50 /* フェイルセーフ / failsafe */) {
          query.fetchNextPage()
        }
      } else {
        autoPaginationAttemptCount.current = 0 // カウンターをリセット / Reset counter
      }
    }
  }, [query])

  return query
}

/**
 * クエリデータ内で指定されたURIに一致する全ての投稿を検索する
 * Finds all posts in query data that match the specified URI
 * 
 * @param queryClient - TanStackのQueryClient / TanStack QueryClient
 * @param uri - 検索対象のURI / URI to search for
 * @yields 一致する投稿ビュー / Matching post views
 */
export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
  const atUri = new AtUri(uri)

  // 通知フィードの全クエリデータを取得 / Get all notification feed query data
  const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPage>>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue // ページがない場合はスキップ / Skip if no pages
    }

    for (const page of queryData?.pages) {
      for (const item of page.items) {
        // スターターパック参加以外の通知をチェック / Check notifications other than starter pack joined
        if (item.type !== 'starterpack-joined') {
          if (item.subject && didOrHandleUriMatches(atUri, item.subject)) {
            yield item.subject // 一致する投稿を返す / Yield matching post
          }
        }

        // 投稿ビューの場合、埋め込まれた引用投稿もチェック / For post views, also check embedded quote posts
        if (AppBskyFeedDefs.isPostView(item.subject)) {
          const quotedPost = getEmbeddedPost(item.subject?.embed)
          if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
            yield embedViewRecordToPostView(quotedPost!) // 埋め込み投稿をPostViewに変換して返す / Convert embedded post to PostView and yield
          }
        }
      }
    }
  }
}

/**
 * クエリデータ内で指定されたDIDに一致する全てのプロフィールを検索する
 * Finds all profiles in query data that match the specified DID
 * 
 * @param queryClient - TanStackのQueryClient / TanStack QueryClient
 * @param did - 検索対象のDID / DID to search for
 * @yields 一致するプロフィールビュー / Matching profile views
 */
export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileViewBasic, void> {
  // 通知フィードの全クエリデータを取得 / Get all notification feed query data
  const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPage>>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue // ページがない場合はスキップ / Skip if no pages
    }
    for (const page of queryData?.pages) {
      for (const item of page.items) {
        // スターターパック参加以外で、投稿者のDIDが一致する場合 / For non-starter pack notifications with matching author DID
        if (
          item.type !== 'starterpack-joined' &&
          item.subject?.author.did === did
        ) {
          yield item.subject.author // 投稿者のプロフィールを返す / Yield author's profile
        }
        // 投稿ビューの場合、埋め込まれた引用投稿の作者もチェック / For post views, also check embedded quote post authors
        if (AppBskyFeedDefs.isPostView(item.subject)) {
          const quotedPost = getEmbeddedPost(item.subject?.embed)
          if (quotedPost?.author.did === did) {
            yield quotedPost.author // 引用投稿の作者を返す / Yield quote post author
          }
        }
      }
    }
  }
}
