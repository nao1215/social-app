// AT Protocol API の型定義 / AT Protocol API type definitions
import {
  type AppBskyActorDefs,
  type AppBskyUnspeccedGetSuggestedUsers,
} from '@atproto/api'
// TanStack Query の型と関数 / TanStack Query types and functions
import {type QueryClient, useQuery} from '@tanstack/react-query'

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

/**
 * 推奨ユーザークエリのプロパティ
 * Props for suggested users query
 */
export type QueryProps = {
  category?: string | null // カテゴリフィルタ / Category filter
  limit?: number // 取得件数制限 / Fetch limit
  enabled?: boolean // クエリ有効フラグ / Query enabled flag
  overrideInterests?: string[] // 興味の上書き / Interest override
}

// 推奨ユーザークエリのルートキー / Root key for suggested users query
export const getSuggestedUsersQueryKeyRoot = 'unspecced-suggested-users'
/**
 * 推奨ユーザークエリのキーを作成
 * Creates query key for suggested users
 */
export const createGetSuggestedUsersQueryKey = (props: QueryProps) => [
  getSuggestedUsersQueryKeyRoot,
  props.category, // カテゴリ / Category
  props.limit, // 件数制限 / Limit
  props.overrideInterests?.join(','), // 上書き興味を文字列結合 / Override interests as string
]

/**
 * 推奨ユーザーを取得するクエリフック
 * Query hook for retrieving suggested users
 * 
 * @param props - クエリのプロパティ / Query properties
 * @returns TanStack Query の結果 / TanStack Query result
 */
export function useGetSuggestedUsersQuery(props: QueryProps) {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery() // ユーザー設定を取得 / Get user preferences

  return useQuery({
    enabled: !!preferences && props.enabled !== false, // 設定が読み込まれ、有効な場合のみクエリ実行 / Execute query only when preferences loaded and enabled
    staleTime: STALE.MINUTES.THREE, // 3分間キャッシュを有効とする / Keep cache valid for 3 minutes
    queryKey: createGetSuggestedUsersQueryKey(props),
    queryFn: async () => {
      // コンテンツ言語をカンマ区切りで取得 / Get content languages as comma-separated string
      const contentLangs = getContentLanguages().join(',')
      // ユーザーの興味を集約 / Aggregate user interests
      const interests = aggregateUserInterests(preferences)
      // 推奨ユーザーを API から取得 / Fetch suggested users from API
      const {data} = await agent.app.bsky.unspecced.getSuggestedUsers(
        {
          category: props.category ?? undefined, // カテゴリフィルタ / Category filter
          limit: props.limit || 10, // 取得件数制限（デフォルト10件） / Fetch limit (default 10)
        },
        {
          headers: {
            // 上書き興味があればそれを、なければユーザー興味を使用 / Use override interests if available, otherwise user interests
            ...createBskyTopicsHeader(
              props.overrideInterests && props.overrideInterests.length > 0
                ? props.overrideInterests.join(',')
                : interests,
            ),
            'Accept-Language': contentLangs, // 言語設定ヘッダー / Language preference header
          },
        },
      )

      return data // 取得したデータを返す / Return fetched data
    },
  })
}

/**
 * クエリデータ内で指定されたDIDに一致する全てのプロフィールを検索する
 * Finds all profiles in query data that match the specified DID
 * 
 * @param queryClient - TanStack Query クライアント / TanStack Query client
 * @param did - 検索対象のDID / DID to search for
 * @yields 一致するプロフィールビュー / Matching profile views
 */
export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  // 推奨ユーザーの全クエリデータを取得 / Get all suggested users query data
  const responses =
    queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedUsers.OutputSchema>({
      queryKey: [getSuggestedUsersQueryKeyRoot],
    })
  for (const [_, response] of responses) {
    if (!response) {
      continue // レスポンスがない場合はスキップ / Skip if no response
    }

    // 各アクターの DID をチェック / Check each actor's DID
    for (const actor of response.actors) {
      if (actor.did === did) {
        yield actor // 一致するアクターを返す / Yield matching actor
      }
    }
  }
}
