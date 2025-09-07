// AT Protocol APIユーティリティ / AT Protocol API utilities
import {AtUri} from '@atproto/api' // AT URIパーサー / AT URI parser
// TanStack Query型とフック / TanStack Query types and hooks
import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query'

// アプリ内モジュール / App internal modules
import {STALE} from '#/state/queries' // キャッシュ有効期限定数 / Cache stale time constants
import {useAgent} from '#/state/session' // エージェント管理 / Agent management
import {useUnstableProfileViewCache} from './profile' // 不安定プロフィールキャッシュ / Unstable profile cache

// クエリキーの定義 / Query key definitions
const RQKEY_ROOT = 'resolved-did' // DID解決クエリのルートキー / DID resolution query root key
/**
 * DID解決クエリキー生成関数 / DID resolution query key generator
 * @param didOrHandle DIDまたはハンドル / DID or handle
 */
export const RQKEY = (didOrHandle: string) => [RQKEY_ROOT, didOrHandle]

// URI解決クエリの結果型 / URI resolution query result type
type UriUseQueryResult = UseQueryResult<{did: string; uri: string}, Error>

/**
 * URIを解決してDIDと正規化されたURIを取得するフック / Hook to resolve URI and get DID and normalized URI
 * ハンドルを含むURIをDIDベースのURIに変換 / Convert URI containing handle to DID-based URI
 * @param uri 解決対象のURI / URI to resolve
 */
export function useResolveUriQuery(uri: string | undefined): UriUseQueryResult {
  const urip = new AtUri(uri || '') // URIをパース / Parse URI
  const res = useResolveDidQuery(urip.host) // ホスト部分をDIDに解決 / Resolve host part to DID
  if (res.data) {
    urip.host = res.data // ホストを解決されたDIDに更新 / Update host with resolved DID
    return {
      ...res,
      data: {did: urip.host, uri: urip.toString()}, // DIDと正規化URIを返す / Return DID and normalized URI
    } as UriUseQueryResult
  }
  return res as UriUseQueryResult
}

export function useResolveDidQuery(didOrHandle: string | undefined) {
  const agent = useAgent()
  const {getUnstableProfile} = useUnstableProfileViewCache()

  return useQuery<string, Error>({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY(didOrHandle ?? ''),
    queryFn: async () => {
      if (!didOrHandle) return ''
      // Just return the did if it's already one
      if (didOrHandle.startsWith('did:')) return didOrHandle

      const res = await agent.resolveHandle({handle: didOrHandle})
      return res.data.did
    },
    initialData: () => {
      // Return undefined if no did or handle
      if (!didOrHandle) return
      const profile = getUnstableProfile(didOrHandle)
      return profile?.did
    },
    enabled: !!didOrHandle,
  })
}

export function precacheResolvedUri(
  queryClient: QueryClient,
  handle: string,
  did: string,
) {
  queryClient.setQueryData<string>(RQKEY(handle), did)
}
