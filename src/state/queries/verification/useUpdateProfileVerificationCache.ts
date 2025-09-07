// ReactフックとTanStack Queryのユーティリティをインポート
// Import React hooks and TanStack Query utilities
import {useCallback} from 'react'
import {useQueryClient} from '@tanstack/react-query'

// ログ、キャッシュ更新、エージェント関連のユーティリティをインポート
// Import logging, cache update, and agent-related utilities
import {logger} from '#/logger' // ログ出力用 (For logging)
import {updateProfileShadow} from '#/state/cache/profile-shadow' // プロフィールキャッシュ更新 (Profile cache update)
import {useAgent} from '#/state/session' // AT Protocolエージェント (AT Protocol agent)
import type * as bsky from '#/types/bsky' // Blueskyの型定義 (Bluesky type definitions)

/**
 * アプリビューから最新の認証状態を取得し、プロフィールキャッシュを更新する。
 * この状態はサーバー上で様々な要因を使用して計算されるため、
 * サーバーからこのデータを取得する必要がある。
 *
 * Fetches a fresh verification state from the app view and updates our profile
 * cache. This state is computed using a variety of factors on the server, so
 * we need to get this data from the server.
 */
export function useUpdateProfileVerificationCache() {
  const qc = useQueryClient() // React Queryクライアント (React Query client)
  const agent = useAgent() // AT Protocolエージェント (AT Protocol agent)

  return useCallback(
    async ({profile}: {profile: bsky.profile.AnyProfileView}) => {
      try {
        // サーバーから最新のプロフィール情報を取得 (Fetch latest profile info from server)
        const {data: updated} = await agent.getProfile({
          actor: profile.did ?? '', // ユーザーDID (User DID)
        })
        // キャッシュ内の認証状態を更新 (Update verification state in cache)
        updateProfileShadow(qc, profile.did, {
          verification: updated.verification,
        })
      } catch (e) {
        // エラーをログ出力 (Log error)
        logger.error(`useUpdateProfileVerificationCache failed`, {
          safeMessage: e,
        })
      }
    },
    [agent, qc],
  )
}
