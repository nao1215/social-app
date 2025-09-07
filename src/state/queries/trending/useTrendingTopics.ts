// React フック / React hooks
import React from 'react'
// AT Protocol API の型と関数 / AT Protocol API types and functions
import {type AppBskyUnspeccedDefs, hasMutedWord} from '@atproto/api'
// TanStack Query フック / TanStack Query hook
import {useQuery} from '@tanstack/react-query'

// クエリキャッシュ設定 / Query cache settings
import {STALE} from '#/state/queries'
// 設定クエリフック / Preferences query hook
import {usePreferencesQuery} from '#/state/queries/preferences'
// セッション管理 / Session management
import {useAgent} from '#/state/session'

/**
 * トレンドトピックの型定義
 * Trending topic type definition
 */
export type TrendingTopic = AppBskyUnspeccedDefs.TrendingTopic

/**
 * トレンドトピック API のレスポンス型
 * Trending topics API response type
 */
type Response = {
  topics: TrendingTopic[] // トレンドトピック一覧 / List of trending topics
  suggested: TrendingTopic[] // 推奨トピック一覧 / List of suggested topics
}

// デフォルトの取得件数 / Default fetch limit
export const DEFAULT_LIMIT = 14

// トレンドトピッククエリのキー / Trending topics query key
export const trendingTopicsQueryKey = ['trending-topics']

/**
 * トレンドトピックを取得するクエリフック
 * Query hook for retrieving trending topics
 * 
 * @returns トレンドトピックと推奨トピック（ミュートされた単語でフィルタリング済み） / Trending and suggested topics (filtered by muted words)
 */
export function useTrendingTopics() {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery() // ユーザー設定を取得 / Get user preferences
  // ミュートされた単語のリストをメモ化 / Memoize muted words list
  const mutedWords = React.useMemo(() => {
    return preferences?.moderationPrefs?.mutedWords || []
  }, [preferences?.moderationPrefs])

  return useQuery<Response>({
    refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得 / Refetch when window gains focus
    staleTime: STALE.MINUTES.THREE, // 3分間キャッシュを有効とする / Keep cache valid for 3 minutes
    queryKey: trendingTopicsQueryKey,
    async queryFn() {
      // トレンドトピックを API から取得 / Fetch trending topics from API
      const {data} = await agent.api.app.bsky.unspecced.getTrendingTopics({
        limit: DEFAULT_LIMIT, // 取得件数制限 / Fetch limit
      })
      return {
        topics: data.topics ?? [], // トレンドトピック（空配列でフォールバック） / Trending topics (fallback to empty array)
        suggested: data.suggested ?? [], // 推奨トピック（空配列でフォールバック） / Suggested topics (fallback to empty array)
      }
    },
    // ミュートされた単語をフィルタリングしてデータを変換 / Transform data by filtering muted words
    select: React.useCallback(
      (data: Response) => {
        return {
          // ミュートされた単語が含まれないトレンドトピックのみを返す / Return only trending topics that don't contain muted words
          topics: data.topics.filter(t => {
            return !hasMutedWord({
              mutedWords,
              // トピック、表示名、説明を結合してチェック / Check combined topic, display name, and description
              text: t.topic + ' ' + t.displayName + ' ' + t.description,
            })
          }),
          // ミュートされた単語が含まれない推奨トピックのみを返す / Return only suggested topics that don't contain muted words
          suggested: data.suggested.filter(t => {
            return !hasMutedWord({
              mutedWords,
              // トピック、表示名、説明を結合してチェック / Check combined topic, display name, and description
              text: t.topic + ' ' + t.displayName + ' ' + t.description,
            })
          }),
        }
      },
      [mutedWords], // ミュート単語が変更されたら再計算 / Recalculate when muted words change
    )
  })
}
