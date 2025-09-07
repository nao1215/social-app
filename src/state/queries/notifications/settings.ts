// AT Protocol API の型定義 / AT Protocol API type definitions
import {type AppBskyNotificationDefs} from '@atproto/api'
// 国際化用のテキストマクロ / Internationalization text macro
import {t} from '@lingui/macro'
// TanStack Query の型と関数 / TanStack Query types and functions
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

// ログシステム / Logging system
import {logger} from '#/logger'
// セッション管理 / Session management
import {useAgent} from '#/state/session'
// トースト通知用ユーティリティ / Toast notification utility
import * as Toast from '#/view/com/util/Toast'

// 通知設定クエリのルートキー / Root key for notification settings queries
const RQKEY_ROOT = 'notification-settings'
// 通知設定クエリキー / Notification settings query key
const RQKEY = [RQKEY_ROOT]

/**
 * 通知設定を取得するクエリフック
 * Query hook for retrieving notification settings
 * 
 * @param enabled - クエリが有効かどうか / Whether the query is enabled
 * @returns TanStack Query の結果 / TanStack Query result
 */
export function useNotificationSettingsQuery({
  enabled,
}: {enabled?: boolean} = {}) {
  const agent = useAgent()

  return useQuery({
    queryKey: RQKEY,
    queryFn: async () => {
      // 通知設定を取得 / Get notification preferences
      const response = await agent.app.bsky.notification.getPreferences()
      return response.data.preferences
    },
    enabled,
  })
}
/**
 * 通知設定を更新するミューテーションフック
 * Mutation hook for updating notification settings
 */
export function useNotificationSettingsUpdateMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      update: Partial<AppBskyNotificationDefs.Preferences>,
    ) => {
      // 通知設定を更新 / Update notification preferences
      const response =
        await agent.app.bsky.notification.putPreferencesV2(update)
      return response.data.preferences
    },
    onMutate: update => {
      // 楽観的更新でUIを即座に反映 / Optimistically update UI immediately
      optimisticUpdateNotificationSettings(queryClient, update)
    },
    onError: e => {
      // エラー時の処理 / Handle errors
      logger.error('Could not update notification settings', {message: e})
      queryClient.invalidateQueries({queryKey: RQKEY}) // キャッシュを無効化 / Invalidate cache
      Toast.show(t`Could not update notification settings`, 'xmark') // エラートーストを表示 / Show error toast
    },
  })
}

/**
 * 通知設定を楽観的に更新する
 * Optimistically updates notification settings
 * 
 * @param queryClient - TanStack Query クライアント / TanStack Query client
 * @param update - 更新する設定の部分オブジェクト / Partial settings object to update
 */
function optimisticUpdateNotificationSettings(
  queryClient: QueryClient,
  update: Partial<AppBskyNotificationDefs.Preferences>,
) {
  queryClient.setQueryData(
    RQKEY,
    (old?: AppBskyNotificationDefs.Preferences) => {
      if (!old) return old // 既存データがない場合はそのまま返す / Return as-is if no existing data
      return {...old, ...update} // 既存データと更新内容をマージ / Merge existing data with update
    },
  )
}
