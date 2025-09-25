import React, {useCallback, useEffect, useRef} from 'react'
import {AppState} from 'react-native'
import {
  type AppBskyActorDefs,
  AppBskyFeedDefs,
  type AppBskyFeedPost,
  AtUri,
  type BskyAgent,
  moderatePost,
  type ModerationDecision,
  type ModerationPrefs,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {AuthorFeedAPI} from '#/lib/api/feed/author'
import {CustomFeedAPI} from '#/lib/api/feed/custom'
import {DemoFeedAPI} from '#/lib/api/feed/demo'
import {FollowingFeedAPI} from '#/lib/api/feed/following'
import {HomeFeedAPI} from '#/lib/api/feed/home'
import {LikesFeedAPI} from '#/lib/api/feed/likes'
import {ListFeedAPI} from '#/lib/api/feed/list'
import {MergeFeedAPI} from '#/lib/api/feed/merge'
import {PostListFeedAPI} from '#/lib/api/feed/posts'
import {type FeedAPI, type ReasonFeedSource} from '#/lib/api/feed/types'
import {aggregateUserInterests} from '#/lib/api/feed/utils'
import {FeedTuner, type FeedTunerFn} from '#/lib/api/feed-manip'
import {DISCOVER_FEED_URI} from '#/lib/constants'
import {BSKY_FEED_OWNER_DIDS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {STALE} from '#/state/queries'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {useAgent} from '#/state/session'
import * as userActionHistory from '#/state/userActionHistory'
import {KnownError} from '#/view/com/posts/PostFeedErrorMessage'
import {useFeedTuners} from '../preferences/feed-tuners'
import {useModerationOpts} from '../preferences/moderation-opts'
import {usePreferencesQuery} from './preferences'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from './util'

type ActorDid = string
export type AuthorFilter =
  | 'posts_with_replies'
  | 'posts_no_replies'
  | 'posts_and_author_threads'
  | 'posts_with_media'
  | 'posts_with_video'
type FeedUri = string
type ListUri = string
type PostsUriList = string

export type FeedDescriptor =
  | 'following'
  | `author|${ActorDid}|${AuthorFilter}`
  | `feedgen|${FeedUri}`
  | `likes|${ActorDid}`
  | `list|${ListUri}`
  | `posts|${PostsUriList}`
  | 'demo'
export interface FeedParams {
  mergeFeedEnabled?: boolean
  mergeFeedSources?: string[]
  feedCacheKey?: 'discover' | 'explore' | undefined
}

type RQPageParam = {cursor: string | undefined; api: FeedAPI} | undefined

export const RQKEY_ROOT = 'post-feed'
export function RQKEY(feedDesc: FeedDescriptor, params?: FeedParams) {
  return [RQKEY_ROOT, feedDesc, params || {}]
}

export interface FeedPostSliceItem {
  _reactKey: string
  uri: string
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  moderation: ModerationDecision
  parentAuthor?: AppBskyActorDefs.ProfileViewBasic
  isParentBlocked?: boolean
  isParentNotFound?: boolean
}

export interface FeedPostSlice {
  _isFeedPostSlice: boolean
  _reactKey: string
  items: FeedPostSliceItem[]
  isIncompleteThread: boolean
  isFallbackMarker: boolean
  feedContext: string | undefined
  reqId: string | undefined
  feedPostUri: string
  reason?:
    | AppBskyFeedDefs.ReasonRepost
    | AppBskyFeedDefs.ReasonPin
    | ReasonFeedSource
    | {[k: string]: unknown; $type: string}
}

export interface FeedPageUnselected {
  api: FeedAPI
  cursor: string | undefined
  feed: AppBskyFeedDefs.FeedViewPost[]
  fetchedAt: number
}

export interface FeedPage {
  api: FeedAPI
  tuner: FeedTuner
  cursor: string | undefined
  slices: FeedPostSlice[]
  fetchedAt: number
}

/**
 * The minimum number of posts we want in a single "page" of results. Since we
 * filter out unwanted content, we may fetch more than this number to ensure
 * that we get _at least_ this number.
 */
const MIN_POSTS = 30

/**
 * usePostFeedQuery
 *
 * 【主な機能】
 * - 投稿フィードデータの無限スクロール取得とキャッシング
 * - フィード種別（タイムライン、カスタムフィード、プロフィール等）に応じた適切なAPI呼び出し
 * - モデレーション設定とフィルタリングの適用
 * - フィードチューニング機能による投稿の並び替えとグループ化
 *
 * 【状態管理パターン】
 * - TanStack Query の useInfiniteQuery によるページネーション管理
 * - セレクター関数でデータ変換とメモ化を実装
 * - 自動ページング機能で最小投稿数を保証
 *
 * 【外部連携】
 * - BskyAgent を通じた AT Protocol API 通信
 * - フィード API（Home、Custom、Author 等）との連携
 * - ユーザー行動履歴とディスカバー機能との統合
 *
 * @param feedDesc - フィード識別子（'following', 'author|did|filter', 'feedgen|uri' 等）
 * @param params - フィード取得パラメータ（マージフィード設定、キャッシュキー等）
 * @param opts - 追加オプション（有効/無効、フィルター除外対象等）
 * @returns TanStack Query の無限クエリ結果（投稿スライスのページネーション）
 */
export function usePostFeedQuery(
  feedDesc: FeedDescriptor,
  params?: FeedParams,
  opts?: {enabled?: boolean; ignoreFilterFor?: string},
) {
  const feedTuners = useFeedTuners(feedDesc)
  const moderationOpts = useModerationOpts()
  const {data: preferences} = usePreferencesQuery()
  /**
   * Load bearing: we need to await AA state or risk FOUC. This marginally
   * delays feeds, but AA state is fetched immediately on load and is then
   * available for the remainder of the session, so this delay only affects cold
   * loads. -esb
   */
  const {isReady: isAgeAssuranceReady} = useAgeAssuranceContext()
  const enabled =
    opts?.enabled !== false &&
    Boolean(moderationOpts) &&
    Boolean(preferences) &&
    isAgeAssuranceReady
  const userInterests = aggregateUserInterests(preferences)
  const followingPinnedIndex =
    preferences?.savedFeeds?.findIndex(
      f => f.pinned && f.value === 'following',
    ) ?? -1
  const enableFollowingToDiscoverFallback = followingPinnedIndex === 0
  const agent = useAgent()
  const lastRun = useRef<{
    data: InfiniteData<FeedPageUnselected>
    args: typeof selectArgs
    result: InfiniteData<FeedPage>
  } | null>(null)
  const isDiscover = feedDesc.includes(DISCOVER_FEED_URI)

  /**
   * The number of posts to fetch in a single request. Because we filter
   * unwanted content, we may over-fetch here to try and fill pages by
   * `MIN_POSTS`. But if you're doing this, ask @why if it's ok first.
   */
  const fetchLimit = MIN_POSTS

  // Make sure this doesn't invalidate unless really needed.
  const selectArgs = React.useMemo(
    () => ({
      feedTuners,
      moderationOpts,
      ignoreFilterFor: opts?.ignoreFilterFor,
      isDiscover,
    }),
    [feedTuners, moderationOpts, opts?.ignoreFilterFor, isDiscover],
  )

  const query = useInfiniteQuery<
    FeedPageUnselected,
    Error,
    InfiniteData<FeedPage>,
    QueryKey,
    RQPageParam
  >({
    enabled,
    staleTime: STALE.INFINITY,
    queryKey: RQKEY(feedDesc, params),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      logger.debug('usePostFeedQuery', {feedDesc, cursor: pageParam?.cursor})
      const {api, cursor} = pageParam
        ? pageParam
        : {
            api: createApi({
              feedDesc,
              feedParams: params || {},
              feedTuners,
              agent,
              // Not in the query key because they don't change:
              userInterests,
              // Not in the query key. Reacting to it switching isn't important:
              enableFollowingToDiscoverFallback,
            }),
            cursor: undefined,
          }

      try {
        const res = await api.fetch({cursor, limit: fetchLimit})

        /*
         * If this is a public view, we need to check if posts fail moderation.
         * If all fail, we throw an error. If only some fail, we continue and let
         * moderations happen later, which results in some posts being shown and
         * some not.
         */
        if (!agent.session) {
          assertSomePostsPassModeration(
            res.feed,
            preferences?.moderationPrefs ||
              DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
          )
        }

        return {
          api,
          cursor: res.cursor,
          feed: res.feed,
          fetchedAt: Date.now(),
        }
      } catch (e) {
        const feedDescParts = feedDesc.split('|')
        const feedOwnerDid = new AtUri(feedDescParts[1]).hostname

        if (
          feedDescParts[0] === 'feedgen' &&
          BSKY_FEED_OWNER_DIDS.includes(feedOwnerDid)
        ) {
          logger.error(`Bluesky feed may be offline: ${feedOwnerDid}`, {
            feedDesc,
            jsError: e,
          })
        }

        throw e
      }
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage =>
      lastPage.cursor
        ? {
            api: lastPage.api,
            cursor: lastPage.cursor,
          }
        : undefined,
    select: useCallback(
      (data: InfiniteData<FeedPageUnselected, RQPageParam>) => {
        // If the selection depends on some data, that data should
        // be included in the selectArgs object and read here.
        const {feedTuners, moderationOpts, ignoreFilterFor, isDiscover} =
          selectArgs

        const tuner = new FeedTuner(feedTuners)

        // Keep track of the last run and whether we can reuse
        // some already selected pages from there.
        let reusedPages = []
        if (lastRun.current) {
          const {
            data: lastData,
            args: lastArgs,
            result: lastResult,
          } = lastRun.current
          let canReuse = true
          for (let key in selectArgs) {
            if (selectArgs.hasOwnProperty(key)) {
              if ((selectArgs as any)[key] !== (lastArgs as any)[key]) {
                // Can't do reuse anything if any input has changed.
                canReuse = false
                break
              }
            }
          }
          if (canReuse) {
            for (let i = 0; i < data.pages.length; i++) {
              if (data.pages[i] && lastData.pages[i] === data.pages[i]) {
                reusedPages.push(lastResult.pages[i])
                // Keep the tuner in sync so that the end result is deterministic.
                tuner.tune(lastData.pages[i].feed)
                continue
              }
              // Stop as soon as pages stop matching up.
              break
            }
          }
        }

        const result = {
          pageParams: data.pageParams,
          pages: [
            ...reusedPages,
            ...data.pages.slice(reusedPages.length).map(page => ({
              api: page.api,
              tuner,
              cursor: page.cursor,
              fetchedAt: page.fetchedAt,
              slices: tuner
                .tune(page.feed)
                .map(slice => {
                  const moderations = slice.items.map(item =>
                    moderatePost(item.post, moderationOpts!),
                  )

                  // apply moderation filter
                  for (let i = 0; i < slice.items.length; i++) {
                    const ignoreFilter =
                      slice.items[i].post.author.did === ignoreFilterFor
                    if (ignoreFilter) {
                      // remove mutes to avoid confused UIs
                      moderations[i].causes = moderations[i].causes.filter(
                        cause => cause.type !== 'muted',
                      )
                    }
                    if (
                      !ignoreFilter &&
                      moderations[i]?.ui('contentList').filter
                    ) {
                      return undefined
                    }
                  }

                  if (isDiscover) {
                    userActionHistory.seen(
                      slice.items.map(item => ({
                        feedContext: slice.feedContext,
                        reqId: slice.reqId,
                        likeCount: item.post.likeCount ?? 0,
                        repostCount: item.post.repostCount ?? 0,
                        replyCount: item.post.replyCount ?? 0,
                        isFollowedBy: Boolean(
                          item.post.author.viewer?.followedBy,
                        ),
                        uri: item.post.uri,
                      })),
                    )
                  }

                  const feedPostSlice: FeedPostSlice = {
                    _reactKey: slice._reactKey,
                    _isFeedPostSlice: true,
                    isIncompleteThread: slice.isIncompleteThread,
                    isFallbackMarker: slice.isFallbackMarker,
                    feedContext: slice.feedContext,
                    reqId: slice.reqId,
                    reason: slice.reason,
                    feedPostUri: slice.feedPostUri,
                    items: slice.items.map((item, i) => {
                      const feedPostSliceItem: FeedPostSliceItem = {
                        _reactKey: `${slice._reactKey}-${i}-${item.post.uri}`,
                        uri: item.post.uri,
                        post: item.post,
                        record: item.record,
                        moderation: moderations[i],
                        parentAuthor: item.parentAuthor,
                        isParentBlocked: item.isParentBlocked,
                        isParentNotFound: item.isParentNotFound,
                      }
                      return feedPostSliceItem
                    }),
                  }
                  return feedPostSlice
                })
                .filter(n => !!n),
            })),
          ],
        }
        // Save for memoization.
        lastRun.current = {data, result, args: selectArgs}
        return result
      },
      [selectArgs /* Don't change. Everything needs to go into selectArgs. */],
    ),
  })

  // The server may end up returning an empty page, a page with too few items,
  // or a page with items that end up getting filtered out. When we fetch pages,
  // we'll keep track of how many items we actually hope to see. If the server
  // doesn't return enough items, we're going to continue asking for more items.
  const lastItemCount = useRef(0)
  const wantedItemCount = useRef(0)
  const autoPaginationAttemptCount = useRef(0)
  useEffect(() => {
    const {data, isLoading, isRefetching, isFetchingNextPage, hasNextPage} =
      query
    // Count the items that we already have.
    let itemCount = 0
    for (const page of data?.pages || []) {
      for (const slice of page.slices) {
        itemCount += slice.items.length
      }
    }

    // If items got truncated, reset the state we're tracking below.
    if (itemCount !== lastItemCount.current) {
      if (itemCount < lastItemCount.current) {
        wantedItemCount.current = itemCount
      }
      lastItemCount.current = itemCount
    }

    // Now track how many items we really want, and fetch more if needed.
    if (isLoading || isRefetching) {
      // During the initial fetch, we want to get an entire page's worth of items.
      wantedItemCount.current = MIN_POSTS
    } else if (isFetchingNextPage) {
      if (itemCount > wantedItemCount.current) {
        // We have more items than wantedItemCount, so wantedItemCount must be out of date.
        // Some other code must have called fetchNextPage(), for example, from onEndReached.
        // Adjust the wantedItemCount to reflect that we want one more full page of items.
        wantedItemCount.current = itemCount + MIN_POSTS
      }
    } else if (hasNextPage) {
      // At this point we're not fetching anymore, so it's time to make a decision.
      // If we didn't receive enough items from the server, paginate again until we do.
      if (itemCount < wantedItemCount.current) {
        autoPaginationAttemptCount.current++
        if (autoPaginationAttemptCount.current < 50 /* failsafe */) {
          query.fetchNextPage()
        }
      } else {
        autoPaginationAttemptCount.current = 0
      }
    }
  }, [query])

  return query
}

/**
 * pollLatest
 *
 * 【主な機能】
 * - フィードの最新投稿をポーリング取得して新着確認
 * - アプリがアクティブ状態でのみポーリング実行
 * - ドライラン機能で実際の更新前に新着投稿を検証
 *
 * 【状態管理パターン】
 * - 非同期処理によるリアルタイム更新チェック
 * - FeedTuner による新着投稿の適格性判定
 *
 * 【外部連携】
 * - FeedAPI の peekLatest() による最新投稿取得
 * - React Native AppState でのアプリ状態監視
 *
 * @param page - 対象のフィードページデータ
 * @returns 新着投稿が存在する場合は true、存在しない場合は false
 */
export async function pollLatest(page: FeedPage | undefined) {
  if (!page) {
    return false
  }
  if (AppState.currentState !== 'active') {
    return
  }

  logger.debug('usePostFeedQuery: pollLatest')
  const post = await page.api.peekLatest()
  if (post) {
    const slices = page.tuner.tune([post], {
      dryRun: true,
    })
    if (slices[0]) {
      return true
    }
  }

  return false
}

/**
 * createApi
 *
 * 【主な機能】
 * - フィード記述子に基づく適切なフィードAPI実装の生成
 * - 各種フィードタイプ（Following、Author、Custom等）に対応するAPIファクトリ
 * - マージフィードとフォールバック機能の統合管理
 *
 * 【状態管理パターン】
 * - ファクトリーパターンによる API 実装の動的生成
 * - フィードパラメータの型安全な処理
 *
 * 【外部連携】
 * - 各種 FeedAPI 実装クラス（HomeFeedAPI、CustomFeedAPI等）の初期化
 * - BskyAgent とユーザー興味データの連携
 *
 * @param feedDesc - フィード記述子
 * @param feedParams - フィード固有のパラメータ
 * @param feedTuners - フィードチューニング関数群
 * @param userInterests - ユーザー興味データ（アルゴリズム用）
 * @param agent - Bsky API エージェント
 * @param enableFollowingToDiscoverFallback - フォローフィードからディスカバーへのフォールバック有効化
 * @returns 指定されたフィードタイプに対応する FeedAPI インスタンス
 */
function createApi({
  feedDesc,
  feedParams,
  feedTuners,
  userInterests,
  agent,
  enableFollowingToDiscoverFallback,
}: {
  feedDesc: FeedDescriptor
  feedParams: FeedParams
  feedTuners: FeedTunerFn[]
  userInterests?: string
  agent: BskyAgent
  enableFollowingToDiscoverFallback: boolean
}) {
  if (feedDesc === 'following') {
    if (feedParams.mergeFeedEnabled) {
      return new MergeFeedAPI({
        agent,
        feedParams,
        feedTuners,
        userInterests,
      })
    } else {
      if (enableFollowingToDiscoverFallback) {
        return new HomeFeedAPI({agent, userInterests})
      } else {
        return new FollowingFeedAPI({agent})
      }
    }
  } else if (feedDesc.startsWith('author')) {
    const [_, actor, filter] = feedDesc.split('|')
    return new AuthorFeedAPI({agent, feedParams: {actor, filter}})
  } else if (feedDesc.startsWith('likes')) {
    const [_, actor] = feedDesc.split('|')
    return new LikesFeedAPI({agent, feedParams: {actor}})
  } else if (feedDesc.startsWith('feedgen')) {
    const [_, feed] = feedDesc.split('|')
    return new CustomFeedAPI({
      agent,
      feedParams: {feed},
      userInterests,
    })
  } else if (feedDesc.startsWith('list')) {
    const [_, list] = feedDesc.split('|')
    return new ListFeedAPI({agent, feedParams: {list}})
  } else if (feedDesc.startsWith('posts')) {
    const [_, uriList] = feedDesc.split('|')
    return new PostListFeedAPI({agent, feedParams: {uris: uriList.split(',')}})
  } else if (feedDesc === 'demo') {
    return new DemoFeedAPI({agent})
  } else {
    // shouldnt happen
    return new FollowingFeedAPI({agent})
  }
}

/**
 * findAllPostsInQueryData
 *
 * 【主な機能】
 * - QueryClient 内の全フィードキャッシュから指定 URI の投稿を検索
 * - 引用投稿、リプライ投稿（親・ルート）も含む包括的な検索
 * - ジェネレーター関数による効率的なメモリ使用とイテレーション
 *
 * 【状態管理パターン】
 * - TanStack Query キャッシュデータの横断検索
 * - Generator 関数による遅延評価とメモリ効率化
 *
 * 【外部連携】
 * - QueryClient の getQueriesData() によるキャッシュアクセス
 * - AT Protocol URI マッチング機能との連携
 *
 * @param queryClient - TanStack Query クライアントインスタンス
 * @param uri - 検索対象の投稿 URI
 * @returns 一致する PostView のジェネレーター
 */
export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
  const atUri = new AtUri(uri)

  const queryDatas = queryClient.getQueriesData<
    InfiniteData<FeedPageUnselected>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const item of page.feed) {
        if (didOrHandleUriMatches(atUri, item.post)) {
          yield item.post
        }

        const quotedPost = getEmbeddedPost(item.post.embed)
        if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
          yield embedViewRecordToPostView(quotedPost)
        }

        if (AppBskyFeedDefs.isPostView(item.reply?.parent)) {
          if (didOrHandleUriMatches(atUri, item.reply.parent)) {
            yield item.reply.parent
          }

          const parentQuotedPost = getEmbeddedPost(item.reply.parent.embed)
          if (
            parentQuotedPost &&
            didOrHandleUriMatches(atUri, parentQuotedPost)
          ) {
            yield embedViewRecordToPostView(parentQuotedPost)
          }
        }

        if (AppBskyFeedDefs.isPostView(item.reply?.root)) {
          if (didOrHandleUriMatches(atUri, item.reply.root)) {
            yield item.reply.root
          }

          const rootQuotedPost = getEmbeddedPost(item.reply.root.embed)
          if (rootQuotedPost && didOrHandleUriMatches(atUri, rootQuotedPost)) {
            yield embedViewRecordToPostView(rootQuotedPost)
          }
        }
      }
    }
  }
}

/**
 * findAllProfilesInQueryData
 *
 * 【主な機能】
 * - QueryClient 内の全フィードキャッシュから指定 DID のプロフィール情報を検索
 * - 投稿作者、引用投稿作者、リプライ作者を含む包括的な検索
 * - プロフィール情報の重複排除と効率的な取得
 *
 * 【状態管理パターン】
 * - TanStack Query キャッシュからのプロフィールデータ抽出
 * - Generator 関数による遅延評価とメモリ効率化
 *
 * 【外部連携】
 * - QueryClient の getQueriesData() によるキャッシュアクセス
 * - AT Protocol DID マッチング機能との連携
 *
 * @param queryClient - TanStack Query クライアントインスタンス
 * @param did - 検索対象のユーザー DID
 * @returns 一致する ProfileViewBasic のジェネレーター
 */
export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileViewBasic, undefined> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<FeedPageUnselected>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const item of page.feed) {
        if (item.post.author.did === did) {
          yield item.post.author
        }
        const quotedPost = getEmbeddedPost(item.post.embed)
        if (quotedPost?.author.did === did) {
          yield quotedPost.author
        }
        if (
          AppBskyFeedDefs.isPostView(item.reply?.parent) &&
          item.reply?.parent?.author.did === did
        ) {
          yield item.reply.parent.author
        }
        if (
          AppBskyFeedDefs.isPostView(item.reply?.root) &&
          item.reply?.root?.author.did === did
        ) {
          yield item.reply.root.author
        }
      }
    }
  }
}

/**
 * assertSomePostsPassModeration
 *
 * 【主な機能】
 * - フィード内の投稿がモデレーション設定を通過するかを検証
 * - 全投稿がフィルタリングされた場合のエラー処理
 * - 未認証ユーザー向けの安全なコンテンツ表示保証
 *
 * 【状態管理パターン】
 * - 投稿配列の同期的なモデレーション検証
 * - エラーハンドリングによる不適切なフィード状態の防止
 *
 * 【外部連携】
 * - AT Protocol のモデレーション機能との連携
 * - ユーザーのモデレーション設定適用
 *
 * @param feed - 検証対象のフィード投稿配列
 * @param moderationPrefs - 適用するモデレーション設定
 * @throws Error - 表示可能な投稿が存在しない場合に KnownError.FeedSignedInOnly をスロー
 */
function assertSomePostsPassModeration(
  feed: AppBskyFeedDefs.FeedViewPost[],
  moderationPrefs: ModerationPrefs,
) {
  // no posts in this feed
  if (feed.length === 0) return true

  // assume false
  let somePostsPassModeration = false

  for (const item of feed) {
    const moderation = moderatePost(item.post, {
      userDid: undefined,
      prefs: moderationPrefs,
    })

    if (!moderation.ui('contentList').filter) {
      // we have a sfw post
      somePostsPassModeration = true
    }
  }

  if (!somePostsPassModeration) {
    throw new Error(KnownError.FeedSignedInOnly)
  }
}

/**
 * resetPostsFeedQueries
 *
 * 【主な機能】
 * - 全投稿フィードクエリのキャッシュリセット
 * - タイムアウト指定による遅延リセット実行
 * - フィード更新時の一括キャッシュクリア
 *
 * 【状態管理パターン】
 * - TanStack Query キャッシュの条件付きリセット
 * - 非同期タイムアウトによる遅延実行
 *
 * 【外部連携】
 * - QueryClient の resetQueries() による一括キャッシュ操作
 * - クエリキー述語による対象フィルタリング
 *
 * @param queryClient - TanStack Query クライアントインスタンス
 * @param timeout - リセット実行までの遅延時間（ミリ秒、デフォルト 0）
 */
export function resetPostsFeedQueries(queryClient: QueryClient, timeout = 0) {
  setTimeout(() => {
    queryClient.resetQueries({
      predicate: query => query.queryKey[0] === RQKEY_ROOT,
    })
  }, timeout)
}

/**
 * resetProfilePostsQueries
 *
 * 【主な機能】
 * - 特定ユーザーの投稿に関連するフィードクエリのキャッシュリセット
 * - DID 指定による対象フィードの絞り込みリセット
 * - プロフィール更新時の関連キャッシュクリア
 *
 * 【状態管理パターン】
 * - TanStack Query キャッシュの条件付きリセット
 * - DID ベースのクエリフィルタリング
 *
 * 【外部連携】
 * - QueryClient の resetQueries() による選択的キャッシュ操作
 * - クエリキー述語による DID マッチング
 *
 * @param queryClient - TanStack Query クライアントインスタンス
 * @param did - 対象ユーザーの DID
 * @param timeout - リセット実行までの遅延時間（ミリ秒、デフォルト 0）
 */
export function resetProfilePostsQueries(
  queryClient: QueryClient,
  did: string,
  timeout = 0,
) {
  setTimeout(() => {
    queryClient.resetQueries({
      predicate: query =>
        !!(
          query.queryKey[0] === RQKEY_ROOT &&
          (query.queryKey[1] as string)?.includes(did)
        ),
    })
  }, timeout)
}

/**
 * isFeedPostSlice
 *
 * 【主な機能】
 * - 任意の値がフィード投稿スライス型であるかの型ガード関数
 * - TypeScript 型安全性の保証とランタイム検証
 * - フィードデータの型判定による安全な型キャスト
 *
 * 【状態管理パターン】
 * - TypeScript 型ガード関数による型安全性の確保
 * - ランタイム型チェックによるデータ検証
 *
 * 【外部連携】
 * - FeedPostSlice インターフェースとの型整合性チェック
 * - フィードレンダリング時の安全な型判定
 *
 * @param v - 型チェック対象の任意の値
 * @returns v が FeedPostSlice 型である場合 true、そうでなければ false
 */
export function isFeedPostSlice(v: any): v is FeedPostSlice {
  return (
    v && typeof v === 'object' && '_isFeedPostSlice' in v && v._isFeedPostSlice
  )
}
