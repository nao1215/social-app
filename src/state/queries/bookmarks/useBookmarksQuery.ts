// AT Protocol API の型定義 / AT Protocol API type definitions
import {
  type $Typed,
  type AppBskyBookmarkGetBookmarks,
  type AppBskyFeedDefs,
} from '@atproto/api'
// TanStack Query の型と関数 / TanStack Query types and functions
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

// セッション管理 / Session management
import {useAgent} from '#/state/session'

// ブックマーククエリのルートキー / Root key for bookmarks query
export const bookmarksQueryKeyRoot = 'bookmarks'
/**
 * ブックマーククエリのキーを作成
 * Creates query key for bookmarks
 */
export const createBookmarksQueryKey = () => [bookmarksQueryKeyRoot]

/**
 * ブックマーク一覧を取得する無限クエリフック
 * Infinite query hook for retrieving bookmarks list
 * 
 * @returns ブックマークの無限クエリ結果 / Infinite query result for bookmarks
 */
export function useBookmarksQuery() {
  const agent = useAgent() // Bluesky エージェント / Bluesky agent

  return useInfiniteQuery<
    AppBskyBookmarkGetBookmarks.OutputSchema,
    Error,
    InfiniteData<AppBskyBookmarkGetBookmarks.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: createBookmarksQueryKey(),
    async queryFn({pageParam}) {
      // ブックマーク一覧をAPIから取得 / Fetch bookmarks from API
      const res = await agent.app.bsky.bookmark.getBookmarks({
        cursor: pageParam, // ページネーション用カーソル / Pagination cursor
      })
      return res.data
    },
    initialPageParam: undefined, // 初期ページパラメータは未定義 / Initial page parameter is undefined
    getNextPageParam: lastPage => lastPage.cursor, // 次のページのカーソルを取得 / Get cursor for next page
  })
}

/**
 * ブックマーククエリデータを最初のページのみに切り詰めて無効化
 * Truncates bookmark query data to first page only and invalidates
 * 
 * @param qc - TanStack Query クライアント / TanStack Query client
 */
export async function truncateAndInvalidate(qc: QueryClient) {
  // ブックマーククエリのデータを最初のページのみに制限 / Limit bookmark query data to first page only
  qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.OutputSchema>>(
    {queryKey: [bookmarksQueryKeyRoot]},
    data => {
      if (data) {
        return {
          pageParams: data.pageParams.slice(0, 1), // 最初のページパラメータのみ保持 / Keep only first page parameter
          pages: data.pages.slice(0, 1), // 最初のページのみ保持 / Keep only first page
        }
      }
      return data
    },
  )
  // クエリを無効化して再取得をトリガー / Invalidate query to trigger refetch
  return qc.invalidateQueries({queryKey: [bookmarksQueryKeyRoot]})
}

/**
 * ブックマークを楽観的に保存（UIの即座更新）
 * Optimistically saves a bookmark (immediate UI update)
 * 
 * @param qc - TanStack Query クライアント / TanStack Query client
 * @param post - ブックマークする投稿 / Post to bookmark
 */
export async function optimisticallySaveBookmark(
  qc: QueryClient,
  post: AppBskyFeedDefs.PostView,
) {
  // ブックマーククエリデータを更新し、新しいブックマークを最初に追加 / Update bookmark query data and add new bookmark at the beginning
  qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.OutputSchema>>(
    {
      queryKey: [bookmarksQueryKeyRoot],
    },
    data => {
      if (!data) return data // データがない場合はそのまま返す / Return as-is if no data
      return {
        ...data,
        pages: data.pages.map((page, index) => {
          if (index === 0) {
            // 最初のページに新しいブックマークを追加 / Add new bookmark to first page
            post.$type = 'app.bsky.feed.defs#postView' // 型情報を設定 / Set type information
            return {
              ...page,
              bookmarks: [
                {
                  createdAt: new Date().toISOString(), // 作成日時 / Creation date
                  subject: {
                    uri: post.uri, // 投稿URI / Post URI
                    cid: post.cid, // コンテンツID / Content ID
                  },
                  item: post as $Typed<AppBskyFeedDefs.PostView>, // 投稿データ / Post data
                },
                ...page.bookmarks, // 既存のブックマークを続ける / Continue with existing bookmarks
              ],
            }
          }
          return page // その他のページはそのまま / Other pages remain unchanged
        }),
      }
    },
  )
}

/**
 * ブックマークを楽観的に削除（UIの即座更新）
 * Optimistically deletes a bookmark (immediate UI update)
 * 
 * @param qc - TanStack Query クライアント / TanStack Query client
 * @param uri - 削除するブックマークのURI / URI of bookmark to delete
 */
export async function optimisticallyDeleteBookmark(
  qc: QueryClient,
  {uri}: {uri: string},
) {
  // ブックマーククエリデータから指定URIのブックマークを削除 / Remove bookmark with specified URI from bookmark query data
  qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.OutputSchema>>(
    {
      queryKey: [bookmarksQueryKeyRoot],
    },
    data => {
      if (!data) return data // データがない場合はそのまま返す / Return as-is if no data
      return {
        ...data,
        pages: data.pages.map(page => {
          return {
            ...page,
            // 指定URI以外のブックマークのみを保持 / Keep only bookmarks that don't match the specified URI
            bookmarks: page.bookmarks.filter(b => b.subject.uri !== uri),
          }
        }),
      }
    },
  )
}
