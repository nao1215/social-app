// Reactフック関連 / React hooks related
import {useCallback} from 'react'
// AT Protocol API型定義とクライアント / AT Protocol API types and client
import {
  type AppBskyActorDefs, // アクター（ユーザー）定義型 / Actor (user) definition types
  type AppBskyActorGetProfile, // プロフィール取得API型 / Profile fetch API types
  type AppBskyActorGetProfiles, // 複数プロフィール取得API型 / Multiple profiles fetch API types
  type AppBskyActorProfile, // プロフィールレコード型 / Profile record type
  AtUri, // AT URI パーサー / AT URI parser
  type BskyAgent, // Blueskyエージェント型 / Bluesky agent type
  type ComAtprotoRepoUploadBlob, // ファイルアップロード型 / File upload types
  type Un$Typed, // 型なしオブジェクト / Untyped object
} from '@atproto/api'
// TanStack Query（データ取得・キャッシュライブラリ） / TanStack Query (data fetching & caching library)
import {
  keepPreviousData, // 前のデータを保持する関数 / Function to keep previous data
  type QueryClient, // クエリクライアント型 / Query client type
  useMutation, // データ更新フック / Data mutation hook
  useQuery, // データ取得フック / Data fetching hook
  useQueryClient, // クエリクライアント取得フック / Query client access hook
} from '@tanstack/react-query'

// API 関数とユーティリティ / API functions and utilities
import {uploadBlob} from '#/lib/api' // ファイルアップロード関数 / File upload function
import {until} from '#/lib/async/until' // 非同期処理ユーティリティ / Async processing utility
import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue' // トグル操作キューフック / Toggle operation queue hook
import {logEvent, type LogEvents, toClout} from '#/lib/statsig/statsig' // ログ収集と影響力計算 / Logging and influence calculation
import {updateProfileShadow} from '#/state/cache/profile-shadow' // プロフィールキャッシュ更新 / Profile cache update
import {type Shadow} from '#/state/cache/types' // シャドウキャッシュ型定義 / Shadow cache type definitions
import {type ImageMeta} from '#/state/gallery' // 画像メタデータ型 / Image metadata type
import {STALE} from '#/state/queries' // キャッシュ有効期限定数 / Cache stale time constants
import {resetProfilePostsQueries} from '#/state/queries/post-feed' // プロフィール投稿クエリリセット / Profile posts query reset
import {
  unstableCacheProfileView, // 不安定プロフィールキャッシュ / Unstable profile cache
  useUnstableProfileViewCache, // 不安定プロフィールキャッシュフック / Unstable profile cache hook
} from '#/state/queries/unstable-profile-cache'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache' // プロフィール証明キャッシュ更新 / Profile verification cache update
import {useAgent, useSession} from '#/state/session' // エージェントとセッション管理 / Agent and session management
import * as userActionHistory from '#/state/userActionHistory' // ユーザー行動履歴 / User action history
import type * as bsky from '#/types/bsky' // Bluesky型定義 / Bluesky type definitions
import {
  ProgressGuideAction, // 進捗ガイドアクション / Progress guide actions
  useProgressGuideControls, // 進捗ガイドコントロール / Progress guide controls
} from '../shell/progress-guide'
// 関連クエリキー / Related query keys
import {RQKEY_ROOT as RQKEY_LIST_CONVOS} from './messages/list-conversations' // 会話リストクエリキー / Conversations list query key
import {RQKEY as RQKEY_MY_BLOCKED} from './my-blocked-accounts' // ブロックアカウントクエリキー / Blocked accounts query key
import {RQKEY as RQKEY_MY_MUTED} from './my-muted-accounts' // ミュートアカウントクエリキー / Muted accounts query key

// 不安定プロフィールキャッシュの再エクスポート / Re-export unstable profile cache
export * from '#/state/queries/unstable-profile-cache'
/**
 * @deprecated use {@link unstableCacheProfileView} instead
 * @deprecated 代わりに {@link unstableCacheProfileView} を使用してください
 */
export const precacheProfile = unstableCacheProfileView

// クエリキーの定義 / Query key definitions
const RQKEY_ROOT = 'profile' // プロフィールクエリのルートキー / Profile query root key
/**
 * 個別プロフィール用クエリキー生成関数 / Individual profile query key generator
 * @param did ユーザーDID / User DID
 */
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

// 複数プロフィールクエリキー / Multiple profiles query keys
export const profilesQueryKeyRoot = 'profiles' // プロフィール一括取得のルートキー / Profiles batch fetch root key
/**
 * ハンドルに基づく複数プロフィールクエリキー / Multiple profiles query key based on handles
 * @param handles ユーザーハンドルの配列 / Array of user handles
 */
export const profilesQueryKey = (handles: string[]) => [
  profilesQueryKeyRoot,
  handles,
]

/**
 * プロフィール情報を取得するフック / Hook for fetching profile information
 * @param did ユーザーDID / User DID
 * @param staleTime キャッシュ有効期限（デフォルト: 15秒） / Cache stale time (default: 15 seconds)
 */
export function useProfileQuery({
  did,
  staleTime = STALE.SECONDS.FIFTEEN,
}: {
  did: string | undefined
  staleTime?: number
}) {
  const agent = useAgent() // Bluesky APIエージェント取得 / Get Bluesky API agent
  const {getUnstableProfile} = useUnstableProfileViewCache() // 不安定キャッシュからのプロフィール取得 / Get profile from unstable cache
  return useQuery<AppBskyActorDefs.ProfileViewDetailed>({
    // 警告: このstaleTimeは重要
    // これを削除するUIが無限ループする
    // WARNING: this staleTime is load-bearing
    // if you remove it, the UI infinite-loops
    // -prf
    staleTime,
    refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得 / Refetch on window focus
    queryKey: RQKEY(did ?? ''), // クエリキー / Query key
    queryFn: async () => {
      // APIからプロフィールデータを取得 / Fetch profile data from API
      const res = await agent.getProfile({actor: did ?? ''})
      return res.data
    },
    placeholderData: () => {
      // プレースホルダーデータとして不安定キャッシュを使用 / Use unstable cache as placeholder data
      if (!did) return
      return getUnstableProfile(did) as AppBskyActorDefs.ProfileViewDetailed
    },
    enabled: !!did, // DIDがある場合のみ有効 / Only enabled when DID is available
  })
}

/**
 * 複数のプロフィールを一括取得するフック / Hook for fetching multiple profiles at once
 * @param handles ユーザーハンドルの配列 / Array of user handles
 * @param maintainData 前のデータを保持するか / Whether to maintain previous data
 */
export function useProfilesQuery({
  handles,
  maintainData,
}: {
  handles: string[]
  maintainData?: boolean
}) {
  const agent = useAgent() // Bluesky APIエージェント取得 / Get Bluesky API agent
  return useQuery({
    staleTime: STALE.MINUTES.FIVE, // 5分間キャッシュを保持 / Keep cache for 5 minutes
    queryKey: profilesQueryKey(handles), // ハンドルベースのクエリキー / Handle-based query key
    queryFn: async () => {
      // 複数のプロフィールを一括取得 / Batch fetch multiple profiles
      const res = await agent.getProfiles({actors: handles})
      return res.data
    },
    placeholderData: maintainData ? keepPreviousData : undefined, // データ保持設定 / Data persistence setting
  })
}

/**
 * プロフィールを事前取得する関数を返すフック / Hook that returns a function to prefetch profiles
 * ユーザーがプロフィールを表示する前にデータをプリロードしてUXを向上 / Preload data before user views profile to improve UX
 */
export function usePrefetchProfileQuery() {
  const agent = useAgent() // Bluesky APIエージェント取得 / Get Bluesky API agent
  const queryClient = useQueryClient() // クエリクライアント取得 / Get query client
  const prefetchProfileQuery = useCallback(
    async (did: string) => {
      // 指定DIDのプロフィールを事前取得 / Prefetch profile for specified DID
      await queryClient.prefetchQuery({
        staleTime: STALE.SECONDS.THIRTY, // 30秒間キャッシュを保持 / Keep cache for 30 seconds
        queryKey: RQKEY(did), // プロフィールクエリキー / Profile query key
        queryFn: async () => {
          const res = await agent.getProfile({actor: did || ''})
          return res.data
        },
      })
    },
    [queryClient, agent],
  )
  return prefetchProfileQuery
}

/**
 * プロフィール更新パラメーターインターフェース / Profile update parameters interface
 */
interface ProfileUpdateParams {
  profile: AppBskyActorDefs.ProfileViewDetailed // 現在のプロフィールデータ / Current profile data
  updates: // 更新データ（オブジェクトまたは関数） / Update data (object or function)
    | Un$Typed<AppBskyActorProfile.Record>
    | ((
        existing: Un$Typed<AppBskyActorProfile.Record>,
      ) => Un$Typed<AppBskyActorProfile.Record>)
  newUserAvatar?: ImageMeta | undefined | null // 新しいアバター画像 / New avatar image
  newUserBanner?: ImageMeta | undefined | null // 新しいバナー画像 / New banner image
  checkCommitted?: (res: AppBskyActorGetProfile.Response) => boolean // 更新確認関数 / Update confirmation function
}
/**
 * プロフィール情報を更新するミューテーションフック / Hook for updating profile information
 * アバター、バナー、表示名、説明等の更新を行う / Handles updates for avatar, banner, display name, description, etc.
 */
export function useProfileUpdateMutation() {
  const queryClient = useQueryClient() // クエリクライアント取得 / Get query client
  const agent = useAgent() // Bluesky APIエージェント取得 / Get Bluesky API agent
  const updateProfileVerificationCache = useUpdateProfileVerificationCache() // 認証キャッシュ更新 / Update verification cache
  return useMutation<void, Error, ProfileUpdateParams>({
    mutationFn: async ({
      profile,
      updates,
      newUserAvatar,
      newUserBanner,
      checkCommitted,
    }) => {
      let newUserAvatarPromise:
        | Promise<ComAtprotoRepoUploadBlob.Response>
        | undefined
      if (newUserAvatar) {
        newUserAvatarPromise = uploadBlob(
          agent,
          newUserAvatar.path,
          newUserAvatar.mime,
        )
      }
      let newUserBannerPromise:
        | Promise<ComAtprotoRepoUploadBlob.Response>
        | undefined
      if (newUserBanner) {
        newUserBannerPromise = uploadBlob(
          agent,
          newUserBanner.path,
          newUserBanner.mime,
        )
      }
      await agent.upsertProfile(async existing => {
        let next: Un$Typed<AppBskyActorProfile.Record> = existing || {}
        if (typeof updates === 'function') {
          next = updates(next)
        } else {
          next.displayName = updates.displayName
          next.description = updates.description
          if ('pinnedPost' in updates) {
            next.pinnedPost = updates.pinnedPost
          }
        }
        if (newUserAvatarPromise) {
          const res = await newUserAvatarPromise
          next.avatar = res.data.blob
        } else if (newUserAvatar === null) {
          next.avatar = undefined
        }
        if (newUserBannerPromise) {
          const res = await newUserBannerPromise
          next.banner = res.data.blob
        } else if (newUserBanner === null) {
          next.banner = undefined
        }
        return next
      })
      await whenAppViewReady(
        agent,
        profile.did,
        checkCommitted ||
          (res => {
            if (typeof newUserAvatar !== 'undefined') {
              if (newUserAvatar === null && res.data.avatar) {
                // url hasnt cleared yet
                return false
              } else if (res.data.avatar === profile.avatar) {
                // url hasnt changed yet
                return false
              }
            }
            if (typeof newUserBanner !== 'undefined') {
              if (newUserBanner === null && res.data.banner) {
                // url hasnt cleared yet
                return false
              } else if (res.data.banner === profile.banner) {
                // url hasnt changed yet
                return false
              }
            }
            if (typeof updates === 'function') {
              return true
            }
            return (
              res.data.displayName === updates.displayName &&
              res.data.description === updates.description
            )
          }),
      )
    },
    async onSuccess(_, variables) {
      // invalidate cache
      queryClient.invalidateQueries({
        queryKey: RQKEY(variables.profile.did),
      })
      queryClient.invalidateQueries({
        queryKey: [profilesQueryKeyRoot, [variables.profile.did]],
      })
      await updateProfileVerificationCache({profile: variables.profile})
    },
  })
}

export function useProfileFollowMutationQueue(
  profile: Shadow<bsky.profile.AnyProfileView>,
  logContext: LogEvents['profile:follow']['logContext'] &
    LogEvents['profile:follow']['logContext'],
) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const did = profile.did
  const initialFollowingUri = profile.viewer?.following
  const followMutation = useProfileFollowMutation(logContext, profile)
  const unfollowMutation = useProfileUnfollowMutation(logContext)

  const queueToggle = useToggleMutationQueue({
    initialState: initialFollowingUri,
    runMutation: async (prevFollowingUri, shouldFollow) => {
      if (shouldFollow) {
        const {uri} = await followMutation.mutateAsync({
          did,
        })
        userActionHistory.follow([did])
        return uri
      } else {
        if (prevFollowingUri) {
          await unfollowMutation.mutateAsync({
            did,
            followUri: prevFollowingUri,
          })
          userActionHistory.unfollow([did])
        }
        return undefined
      }
    },
    onSuccess(finalFollowingUri) {
      // finalize
      updateProfileShadow(queryClient, did, {
        followingUri: finalFollowingUri,
      })

      if (finalFollowingUri) {
        agent.app.bsky.graph
          .getSuggestedFollowsByActor({
            actor: did,
          })
          .then(res => {
            const dids = res.data.suggestions
              .filter(a => !a.viewer?.following)
              .map(a => a.did)
              .slice(0, 8)
            userActionHistory.followSuggestion(dids)
          })
      }
    },
  })

  const queueFollow = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      followingUri: 'pending',
    })
    return queueToggle(true)
  }, [queryClient, did, queueToggle])

  const queueUnfollow = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      followingUri: undefined,
    })
    return queueToggle(false)
  }, [queryClient, did, queueToggle])

  return [queueFollow, queueUnfollow]
}

function useProfileFollowMutation(
  logContext: LogEvents['profile:follow']['logContext'],
  profile: Shadow<bsky.profile.AnyProfileView>,
) {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {captureAction} = useProgressGuideControls()

  return useMutation<{uri: string; cid: string}, Error, {did: string}>({
    mutationFn: async ({did}) => {
      let ownProfile: AppBskyActorDefs.ProfileViewDetailed | undefined
      if (currentAccount) {
        ownProfile = findProfileQueryData(queryClient, currentAccount.did)
      }
      captureAction(ProgressGuideAction.Follow)
      logEvent('profile:follow', {
        logContext,
        didBecomeMutual: profile.viewer
          ? Boolean(profile.viewer.followedBy)
          : undefined,
        followeeClout:
          'followersCount' in profile
            ? toClout(profile.followersCount)
            : undefined,
        followerClout: toClout(ownProfile?.followersCount),
      })
      return await agent.follow(did)
    },
  })
}

function useProfileUnfollowMutation(
  logContext: LogEvents['profile:unfollow']['logContext'],
) {
  const agent = useAgent()
  return useMutation<void, Error, {did: string; followUri: string}>({
    mutationFn: async ({followUri}) => {
      logEvent('profile:unfollow', {logContext})
      return await agent.deleteFollow(followUri)
    },
  })
}

export function useProfileMuteMutationQueue(
  profile: Shadow<bsky.profile.AnyProfileView>,
) {
  const queryClient = useQueryClient()
  const did = profile.did
  const initialMuted = profile.viewer?.muted
  const muteMutation = useProfileMuteMutation()
  const unmuteMutation = useProfileUnmuteMutation()

  const queueToggle = useToggleMutationQueue({
    initialState: initialMuted,
    runMutation: async (_prevMuted, shouldMute) => {
      if (shouldMute) {
        await muteMutation.mutateAsync({
          did,
        })
        return true
      } else {
        await unmuteMutation.mutateAsync({
          did,
        })
        return false
      }
    },
    onSuccess(finalMuted) {
      // finalize
      updateProfileShadow(queryClient, did, {muted: finalMuted})
    },
  })

  const queueMute = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      muted: true,
    })
    return queueToggle(true)
  }, [queryClient, did, queueToggle])

  const queueUnmute = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      muted: false,
    })
    return queueToggle(false)
  }, [queryClient, did, queueToggle])

  return [queueMute, queueUnmute]
}

function useProfileMuteMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await agent.mute(did)
    },
    onSuccess() {
      queryClient.invalidateQueries({queryKey: RQKEY_MY_MUTED()})
    },
  })
}

function useProfileUnmuteMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await agent.unmute(did)
    },
    onSuccess() {
      queryClient.invalidateQueries({queryKey: RQKEY_MY_MUTED()})
    },
  })
}

export function useProfileBlockMutationQueue(
  profile: Shadow<bsky.profile.AnyProfileView>,
) {
  const queryClient = useQueryClient()
  const did = profile.did
  const initialBlockingUri = profile.viewer?.blocking
  const blockMutation = useProfileBlockMutation()
  const unblockMutation = useProfileUnblockMutation()

  const queueToggle = useToggleMutationQueue({
    initialState: initialBlockingUri,
    runMutation: async (prevBlockUri, shouldFollow) => {
      if (shouldFollow) {
        const {uri} = await blockMutation.mutateAsync({
          did,
        })
        return uri
      } else {
        if (prevBlockUri) {
          await unblockMutation.mutateAsync({
            did,
            blockUri: prevBlockUri,
          })
        }
        return undefined
      }
    },
    onSuccess(finalBlockingUri) {
      // finalize
      updateProfileShadow(queryClient, did, {
        blockingUri: finalBlockingUri,
      })
      queryClient.invalidateQueries({queryKey: [RQKEY_LIST_CONVOS]})
    },
  })

  const queueBlock = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      blockingUri: 'pending',
    })
    return queueToggle(true)
  }, [queryClient, did, queueToggle])

  const queueUnblock = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      blockingUri: undefined,
    })
    return queueToggle(false)
  }, [queryClient, did, queueToggle])

  return [queueBlock, queueUnblock]
}

function useProfileBlockMutation() {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation<{uri: string; cid: string}, Error, {did: string}>({
    mutationFn: async ({did}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      return await agent.app.bsky.graph.block.create(
        {repo: currentAccount.did},
        {subject: did, createdAt: new Date().toISOString()},
      )
    },
    onSuccess(_, {did}) {
      queryClient.invalidateQueries({queryKey: RQKEY_MY_BLOCKED()})
      resetProfilePostsQueries(queryClient, did, 1000)
    },
  })
}

function useProfileUnblockMutation() {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {did: string; blockUri: string}>({
    mutationFn: async ({blockUri}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      const {rkey} = new AtUri(blockUri)
      await agent.app.bsky.graph.block.delete({
        repo: currentAccount.did,
        rkey,
      })
    },
    onSuccess(_, {did}) {
      resetProfilePostsQueries(queryClient, did, 1000)
    },
  })
}

async function whenAppViewReady(
  agent: BskyAgent,
  actor: string,
  fn: (res: AppBskyActorGetProfile.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () => agent.app.bsky.actor.getProfile({actor}),
  )
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileViewDetailed, void> {
  const profileQueryDatas =
    queryClient.getQueriesData<AppBskyActorDefs.ProfileViewDetailed>({
      queryKey: [RQKEY_ROOT],
    })
  for (const [_queryKey, queryData] of profileQueryDatas) {
    if (!queryData) {
      continue
    }
    if (queryData.did === did) {
      yield queryData
    }
  }
  const profilesQueryDatas =
    queryClient.getQueriesData<AppBskyActorGetProfiles.OutputSchema>({
      queryKey: [profilesQueryKeyRoot],
    })
  for (const [_queryKey, queryData] of profilesQueryDatas) {
    if (!queryData) {
      continue
    }
    for (let profile of queryData.profiles) {
      if (profile.did === did) {
        yield profile
      }
    }
  }
}

export function findProfileQueryData(
  queryClient: QueryClient,
  did: string,
): AppBskyActorDefs.ProfileViewDetailed | undefined {
  return queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(
    RQKEY(did),
  )
}
