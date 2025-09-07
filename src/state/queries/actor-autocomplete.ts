// Reactライブラリ / React library
import React from 'react'
// AT Protocol API型とモデレーション / AT Protocol API types and moderation
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api' // アクター型、プロフィールモデレーション、モデレーション設定型 / Actor types, profile moderation, moderation options type
// TanStack Query（データ取得・キャッシュライブラリ） / TanStack Query (data fetching & caching library)
import {keepPreviousData, useQuery, useQueryClient} from '@tanstack/react-query'

// モデレーションユーティリティ / Moderation utilities
import {isJustAMute, moduiContainsHideableOffense} from '#/lib/moderation' // ミュート判定、非表示対象判定 / Mute detection, hideable offense detection
import {logger} from '#/logger' // ロガー / Logger
// クエリ関連 / Query related
import {STALE} from '#/state/queries' // キャッシュ有効期限定数 / Cache stale time constants
import {useAgent} from '#/state/session' // エージェント管理 / Agent management
// ユーザー設定 / User preferences
import {useModerationOpts} from '../preferences/moderation-opts' // モデレーション設定 / Moderation settings
import {DEFAULT_LOGGED_OUT_PREFERENCES} from './preferences' // ログアウト時のデフォルト設定 / Default logged out preferences

// ログアウト時のデフォルトモデレーション設定 / Default moderation options for logged out users
const DEFAULT_MOD_OPTS = {
  userDid: undefined, // ユーザーDIDなし / No user DID
  prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs, // ログアウト時のモデレーション設定 / Logged out moderation preferences
}

// クエリキーの定義 / Query key definitions
const RQKEY_ROOT = 'actor-autocomplete' // アクター自動補完クエリのルートキー / Actor autocomplete query root key
/**
 * アクター自動補完クエリキー生成関数 / Actor autocomplete query key generator
 * @param prefix 検索プレフィックス / Search prefix
 */
export const RQKEY = (prefix: string) => [RQKEY_ROOT, prefix]

/**
 * アクター（ユーザー）の自動補完結果を取得するフック / Hook to fetch actor (user) autocomplete results
 * ユーザー名やハンドルの入力時に候補を提示 / Provides suggestions when typing usernames or handles
 * @param prefix 検索プレフィックス / Search prefix
 * @param maintainData 前のデータを保持するか / Whether to maintain previous data
 * @param limit 結果の最大数 / Maximum number of results
 */
export function useActorAutocompleteQuery(
  prefix: string,
  maintainData?: boolean,
  limit?: number,
) {
  const moderationOpts = useModerationOpts() // モデレーション設定取得 / Get moderation settings
  const agent = useAgent() // Bluesky APIエージェント取得 / Get Bluesky API agent

  // 検索プレフィックスの正規化 / Normalize search prefix
  prefix = prefix.toLowerCase().trim()
  if (prefix.endsWith('.')) {
    // "foo" から "foo." に変更してもマッチをクリアしない / Going from "foo" to "foo." should not clear matches
    prefix = prefix.slice(0, -1)
  }

  return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(prefix || ''),
    async queryFn() {
      const res = prefix
        ? await agent.searchActorsTypeahead({
            q: prefix,
            limit: limit || 8,
          })
        : undefined
      return res?.data.actors || []
    },
    select: React.useCallback(
      (data: AppBskyActorDefs.ProfileViewBasic[]) => {
        return computeSuggestions({
          q: prefix,
          searched: data,
          moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
        })
      },
      [prefix, moderationOpts],
    ),
    placeholderData: maintainData ? keepPreviousData : undefined,
  })
}

export type ActorAutocompleteFn = ReturnType<typeof useActorAutocompleteFn>
/**
 * アクター自動補完関数を返すフック / Hook that returns an actor autocomplete function
 * プログラムから呼び出す場合に使用 / Used when calling programmatically
 */
export function useActorAutocompleteFn() {
  const queryClient = useQueryClient() // クエリクライアント取得 / Get query client
  const moderationOpts = useModerationOpts() // モデレーション設定取得 / Get moderation settings
  const agent = useAgent() // Bluesky APIエージェント取得 / Get Bluesky API agent

  return React.useCallback(
    async ({query, limit = 8}: {query: string; limit?: number}) => {
      query = query.toLowerCase() // クエリを小文字に変換 / Convert query to lowercase
      let res
      if (query) {
        try {
          // キャッシュから取得し、なければAPIから取得 / Fetch from cache, or from API if not cached
          res = await queryClient.fetchQuery({
            staleTime: STALE.MINUTES.ONE, // 1分間キャッシュを保持 / Keep cache for 1 minute
            queryKey: RQKEY(query || ''), // クエリキー / Query key
            queryFn: () =>
              agent.searchActorsTypeahead({ // タイプアヘッド検索API / Typeahead search API
                q: query,
                limit,
              }),
          })
        } catch (e) {
          logger.error('useActorSearch: searchActorsTypeahead failed', {
            message: e,
          })
        }
      }

      // 検索結果をモデレーションでフィルタリング / Filter search results with moderation
      return computeSuggestions({
        q: query,
        searched: res?.data.actors,
        moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
      })
    },
    [queryClient, moderationOpts, agent],
  )
}

/**
 * 検索結果からモデレーションフィルタリングした候補を計算 / Compute moderation-filtered suggestions from search results
 * @param q 検索クエリ / Search query
 * @param searched 検索結果 / Search results
 * @param moderationOpts モデレーション設定 / Moderation options
 */
function computeSuggestions({
  q,
  searched = [],
  moderationOpts,
}: {
  q?: string
  searched?: AppBskyActorDefs.ProfileViewBasic[]
  moderationOpts: ModerationOpts
}) {
  // 重複を除去 / Remove duplicates
  let items: AppBskyActorDefs.ProfileViewBasic[] = []
  for (const item of searched) {
    if (!items.find(item2 => item2.handle === item.handle)) {
      items.push(item)
    }
  }
  // モデレーションフィルターを適用 / Apply moderation filter
  return items.filter(profile => {
    const modui = moderateProfile(profile, moderationOpts).ui('profileList') // プロフィールリスト用モデレーションUI / Moderation UI for profile list
    const isExactMatch = q && profile.handle.toLowerCase() === q // 完全一致か / Exact match check
    return (
      (isExactMatch && !moduiContainsHideableOffense(modui)) || // 完全一致かつ非表示対象でない / Exact match and not hideable offense
      !modui.filter || // フィルターなし / No filter
      isJustAMute(modui) // ただのミュート / Just a mute
    )
  })
}
