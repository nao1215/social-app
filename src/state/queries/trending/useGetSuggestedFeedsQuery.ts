// TanStack Query フック / TanStack Query hook
import {useQuery} from '@tanstack/react-query'

// フィード API ユーティリティ / Feed API utilities
import {
  aggregateUserInterests, // ユーザー興味の集約 / User interest aggregation
  createBskyTopicsHeader, // Bluesky トピックヘッダー作成 / Bluesky topics header creation
} from '#/lib/api/feed/utils'
// コンテンツ言語取得 / Content language retrieval
import {getContentLanguages} from '#/state/preferences/languages'
// クエリキャッシュ設定 / Query cache settings
import {STALE} from '#/state/queries'
// 設定クエリフック / Preferences query hook
import {usePreferencesQuery} from '#/state/queries/preferences'
// セッション管理 / Session management
import {useAgent} from '#/state/session'

// デフォルトの取得件数 / Default fetch limit
export const DEFAULT_LIMIT = 15

/**
 * 推奨フィードクエリのキーを作成
 * Creates query key for suggested feeds
 */
export const createGetSuggestedFeedsQueryKey = () => ['suggested-feeds']

/**
 * 推奨フィードを取得するクエリフック
 * Query hook for retrieving suggested feeds
 * 
 * @param enabled - クエリが有効かどうか / Whether the query is enabled
 * @returns TanStack Query の結果 / TanStack Query result
 */
export function useGetSuggestedFeedsQuery({enabled}: {enabled?: boolean}) {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery() // ユーザー設定を取得 / Get user preferences
  const savedFeeds = preferences?.savedFeeds // 保存済みフィード一覧 / List of saved feeds

  return useQuery({
    enabled: !!preferences && enabled !== false, // 設定が読み込まれ、有効な場合のみクエリ実行 / Execute query only when preferences loaded and enabled
    staleTime: STALE.MINUTES.THREE, // 3分間キャッシュを有効とする / Keep cache valid for 3 minutes
    queryKey: createGetSuggestedFeedsQueryKey(),
    queryFn: async () => {
      // コンテンツ言語をカンマ区切りで取得 / Get content languages as comma-separated string
      const contentLangs = getContentLanguages().join(',')
      // 推奨フィードを API から取得 / Fetch suggested feeds from API
      const {data} = await agent.app.bsky.unspecced.getSuggestedFeeds(
        {
          limit: DEFAULT_LIMIT, // 取得件数制限 / Fetch limit
        },
        {
          headers: {
            // ユーザーの興味に基づいたトピックヘッダーを追加 / Add topic header based on user interests
            ...createBskyTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs, // 言語設定ヘッダー / Language preference header
          },
        },
      )

      return {
        // 既に保存済みのフィードを除外 / Exclude already saved feeds
        feeds: data.feeds.filter(feed => {
          const isSaved = !!savedFeeds?.find(s => s.value === feed.uri)
          return !isSaved // 保存済みでないもののみを返す / Return only non-saved feeds
        }),
      }
    },
  })
}
