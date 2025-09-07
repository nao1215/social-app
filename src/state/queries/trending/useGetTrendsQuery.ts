// React フック / React hooks
import React from 'react'
// AT Protocol API の型と関数 / AT Protocol API types and functions
import {type AppBskyUnspeccedGetTrends, hasMutedWord} from '@atproto/api'
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
export const DEFAULT_LIMIT = 5

/**
 * トレンドクエリのキーを作成
 * Creates query key for trends
 */
export const createGetTrendsQueryKey = () => ['trends']

/**
 * トレンドを取得するクエリフック
 * Query hook for retrieving trends
 * 
 * @returns TanStack Query の結果とミュートされた単語フィルタリング / TanStack Query result with muted word filtering
 */
export function useGetTrendsQuery() {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery() // ユーザー設定を取得 / Get user preferences
  // ミュートされた単語のリストをメモ化 / Memoize muted words list
  const mutedWords = React.useMemo(() => {
    return preferences?.moderationPrefs?.mutedWords || []
  }, [preferences?.moderationPrefs])

  return useQuery({
    enabled: !!preferences, // 設定が読み込まれた場合のみクエリ実行 / Execute query only when preferences loaded
    staleTime: STALE.MINUTES.THREE, // 3分間キャッシュを有効とする / Keep cache valid for 3 minutes
    queryKey: createGetTrendsQueryKey(),
    queryFn: async () => {
      // コンテンツ言語をカンマ区切りで取得 / Get content languages as comma-separated string
      const contentLangs = getContentLanguages().join(',')
      // トレンドを API から取得 / Fetch trends from API
      const {data} = await agent.app.bsky.unspecced.getTrends(
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
      return data // 取得したデータを返す / Return fetched data
    },
    // ミュートされた単語をフィルタリングしてデータを変換 / Transform data by filtering muted words
    select: React.useCallback(
      (data: AppBskyUnspeccedGetTrends.OutputSchema) => {
        return {
          // ミュートされた単語が含まれないトレンドのみを返す / Return only trends that don't contain muted words
          trends: (data.trends ?? []).filter(t => {
            return !hasMutedWord({
              mutedWords,
              // トピック、表示名、カテゴリを結合してチェック / Check combined topic, display name, and category
              text: t.topic + ' ' + t.displayName + ' ' + t.category,
            })
          }),
        }
      },
      [mutedWords], // ミュート単語が変更されたら再計算 / Recalculate when muted words change
    )
  })
}
