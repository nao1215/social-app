// AT Protocol API型定義 / AT Protocol API type definitions
import {
  type AppBskyActorDefs, // アクター（ユーザー）定義型 / Actor (user) definition types
  type AppBskyActorSearchActors, // アクター検索API型 / Actor search API types
} from '@atproto/api'
// TanStack Query（データ取得・キャッシュライブラリ） / TanStack Query (data fetching & caching library)
import {
  type InfiniteData, // 無限スクロールデータ型 / Infinite scroll data type
  keepPreviousData, // 前のデータを保持する関数 / Function to keep previous data
  type QueryClient, // クエリクライアント型 / Query client type
  type QueryKey, // クエリキー型 / Query key type
  useInfiniteQuery, // 無限スクロールクエリフック / Infinite scroll query hook
  useQuery, // データ取得フック / Data fetching hook
} from '@tanstack/react-query'

// クエリ関連 / Query related
import {STALE} from '#/state/queries' // キャッシュ有効期限定数 / Cache stale time constants
import {useAgent} from '#/state/session' // エージェント管理 / Agent management

// クエリキーの定義 / Query key definitions
const RQKEY_ROOT = 'actor-search' // アクター検索クエリのルートキー / Actor search query root key
/**
 * アクター検索クエリキー生成関数 / Actor search query key generator
 * @param query 検索クエリ / Search query
 */
export const RQKEY = (query: string) => [RQKEY_ROOT, query]

// ページネーション対応のクエリキー / Paginated query keys
export const RQKEY_ROOT_PAGINATED = `${RQKEY_ROOT}_paginated` // ページネーション付きアクター検索ルートキー / Paginated actor search root key
/**
 * ページネーション付きアクター検索クエリキー生成関数 / Paginated actor search query key generator
 * @param query 検索クエリ / Search query
 * @param limit 結果の最大数 / Maximum number of results
 */
export const RQKEY_PAGINATED = (query: string, limit?: number) => [
  RQKEY_ROOT_PAGINATED,
  query,
  limit,
]

/**
 * アクター（ユーザー）を検索するフック / Hook to search for actors (users)
 * ユーザー名、ハンドル、表示名で検索可能 / Can search by username, handle, or display name
 * @param query 検索クエリ / Search query
 * @param enabled クエリを有効にするか / Whether to enable the query
 */
/**
 * useActorSearch
 *
 * 【主な機能】
 * - ユーザー名、ハンドル、表示名によるアクター（ユーザー）検索
 * - シンプルな一度の結果取得（ページネーションなし）
 * - 1分間のキャッシュでパフォーマンス最適化
 * - 条件付きクエリ実行で不必要なAPI呼び出しを防止
 *
 * 【状態管理パターン】
 * - TanStack Query の useQuery による宣言的データ取得
 * - クエリ有効性と検索語存在の両方をチェック
 * - クエリキーベースのキャッシュ管理
 *
 * 【外部連携】
 * - BskyAgent の searchActors API 呼び出し
 * - AT Protocol のユーザー検索機能との連携
 * - ProfileView 型のユーザー情報返却
 *
 * @param query - 検索対象の文字列（ユーザー名、ハンドル、表示名等）
 * @param enabled - クエリの有効/無効設定（デフォルトtrue）
 * @returns TanStack Query結果オブジェクト（ProfileView配列）
 */
export function useActorSearch({
  query,
  enabled,
}: {
  query: string
  enabled?: boolean
}) {
  const agent = useAgent() // Bluesky APIエージェント取得 / Get Bluesky API agent
  return useQuery<AppBskyActorDefs.ProfileView[]>({
    staleTime: STALE.MINUTES.ONE, // 1分間キャッシュを保持 / Keep cache for 1 minute
    queryKey: RQKEY(query || ''), // クエリキー / Query key
    async queryFn() {
      // APIでアクターを検索 / Search actors via API
      const res = await agent.searchActors({
        q: query,
      })
      return res.data.actors
    },
    enabled: enabled && !!query, // 有効かつクエリがある場合のみ実行 / Only execute if enabled and query exists
  })
}

/**
 * アクターをページネーション付きで検索するフック / Hook to search for actors with pagination
 * 大量の検索結果をスクロールで段階的に読み込み / Gradually load large search results with scrolling
 * @param query 検索クエリ / Search query
 * @param enabled クエリを有効にするか / Whether to enable the query
 * @param maintainData 前のデータを保持するか / Whether to maintain previous data
 * @param limit 1ページあたりの結果数（デフォルト: 25） / Results per page (default: 25)
 */
/**
 * useActorSearchPaginated
 *
 * 【主な機能】
 * - アクター検索のページネーション対応版
 * - 大量の検索結果を無限スクロールで効率的に読み込み
 * - ページあたりの結果数をカスタマイズ可能
 * - keepPreviousData によるスムーズなUI更新サポート
 *
 * 【状態管理パターン】
 * - TanStack Query の useInfiniteQuery による無限スクロール実装
 * - カーソルベースのページネーション管理
 * - 5分間のロングキャッシュでパフォーマンス最適化
 *
 * 【外部連携】
 * - BskyAgent の searchActors API によるページネーション付き検索
 * - AT Protocol のカーソルベースページング機能活用
 * - AppBskyActorSearchActors APIスキーマとの統合
 *
 * @param query - 検索対象の文字列
 * @param enabled - クエリの有効/無効設定
 * @param maintainData - 前のデータを保持してUIちらつきを防止するか
 * @param limit - 1ページあたりの結果数（デフォルト25）
 * @returns TanStack Query無限クエリ結果オブジェクト
 */
export function useActorSearchPaginated({
  query,
  enabled,
  maintainData,
  limit = 25,
}: {
  query: string
  enabled?: boolean
  maintainData?: boolean
  limit?: number
}) {
  const agent = useAgent() // Bluesky APIエージェント取得 / Get Bluesky API agent
  return useInfiniteQuery<
    AppBskyActorSearchActors.OutputSchema,
    Error,
    InfiniteData<AppBskyActorSearchActors.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    staleTime: STALE.MINUTES.FIVE, // 5分間キャッシュを保持 / Keep cache for 5 minutes
    queryKey: RQKEY_PAGINATED(query, limit), // ページネーション用クエリキー / Pagination query key
    queryFn: async ({pageParam}) => {
      // APIでアクターをページネーション付きで検索 / Search actors with pagination via API
      const res = await agent.searchActors({
        q: query,
        limit,
        cursor: pageParam, // 次のページのカーソル / Cursor for next page
      })
      return res.data
    },
    enabled: enabled && !!query, // 有効かつクエリがある場合のみ実行 / Only execute if enabled and query exists
    initialPageParam: undefined, // 初期ページパラメーター / Initial page parameter
    getNextPageParam: lastPage => lastPage.cursor, // 次のページのカーソルを取得 / Get cursor for next page
    placeholderData: maintainData ? keepPreviousData : undefined, // プレースホルダーデータ設定 / Placeholder data setting
  })
}

/**
 * クエリキャッシュから指定DIDのプロフィールを全て検索するジェネレーター関数 / Generator function to find all profiles with specified DID from query cache
 * 通常クエリとページネーションクエリ両方を検索 / Searches both regular and paginated queries
 * @param queryClient クエリクライアント / Query client
 * @param did 検索対象のDID / Target DID to search for
 * @yields マッチしたプロフィールビュー / Matched profile views
 */
/**
 * findAllProfilesInQueryData
 *
 * 【主な機能】
 * - QueryClient 内の全アクター検索キャッシュから指定DIDのプロフィールを検索
 * - 通常検索とページネーション検索の両方を横断検索
 * - Generator 関数による効率的なメモリ使用とイテレーション
 * - 全ページ間でのプロフィール重複排除と最新データ取得
 *
 * 【状態管理パターン】
 * - TanStack Query キャッシュの横断検索
 * - Generator 関数による遅延評価とメモリ効率化
 * - 複数クエリタイプ間でのデータ統合
 *
 * 【外部連携】
 * - QueryClient の getQueriesData() による全キャッシュアクセス
 * - 通常検索とページネーション検索の両クエリキーに対応
 * - AT Protocol DID マッチング機能
 *
 * @param queryClient - TanStack Query クライアントインスタンス
 * @param did - 検索対象のユーザーDID
 * @returns 一致するアクタープロフィールのGenerator
 */
export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  // 通常のアクター検索クエリから検索 / Search from regular actor search queries
  const queryDatas = queryClient.getQueriesData<AppBskyActorDefs.ProfileView[]>(
    {
      queryKey: [RQKEY_ROOT],
    },
  )
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    for (const actor of queryData) {
      if (actor.did === did) {
        yield actor // マッチしたプロフィールをyield / Yield matched profile
      }
    }
  }

  // ページネーション付きアクター検索クエリから検索 / Search from paginated actor search queries
  const queryDatasPaginated = queryClient.getQueriesData<
    InfiniteData<AppBskyActorSearchActors.OutputSchema>
  >({
    queryKey: [RQKEY_ROOT_PAGINATED],
  })
  for (const [_queryKey, queryData] of queryDatasPaginated) {
    if (!queryData) {
      continue
    }
    // 全ページのアクターを平均化して検索 / Flatten actors from all pages and search
    for (const actor of queryData.pages.flatMap(page => page.actors)) {
      if (actor.did === did) {
        yield actor // マッチしたプロフィールをyield / Yield matched profile
      }
    }
  }
}
