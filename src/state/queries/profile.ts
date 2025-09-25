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
/**
 * useProfileQuery
 *
 * 【主な機能】
 * - 指定されたDIDのユーザープロフィール詳細データの取得とキャッシュ管理
 * - 不安定キャッシュからのプレースホルダーデータ提供
 * - ウィンドウフォーカス時の自動データ再取得
 * - staleTime設定による適切なキャッシュライフサイクル管理
 *
 * 【状態管理パターン】
 * - TanStack Query の useQuery による宣言的データ取得
 * - プレースホルダーデータとしての不安定キャッシュ活用
 * - DID有効性チェックによる条件付きクエリ実行
 *
 * 【外部連携】
 * - BskyAgent を通じた AT Protocol API 通信
 * - 不安定プロフィールキャッシュとの統合
 * - プロフィール詳細データの型安全な取得
 *
 * @param did - 取得対象のユーザーDID（未定義の場合はクエリ無効化）
 * @param staleTime - キャッシュ有効期限（デフォルト15秒、UI無限ループ防止のため必須）
 * @returns TanStack Query結果オブジェクト（ProfileViewDetailed型）
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
/**
 * useProfilesQuery
 *
 * 【主な機能】
 * - 複数のユーザープロフィールを一括取得してネットワーク効率を向上
 * - ハンドル配列に基づく複数アカウント情報の同時取得
 * - keepPreviousData による過去データの保持オプション
 * - 5分間のキャッシュによるパフォーマンス最適化
 *
 * 【状態管理パターン】
 * - TanStack Query の useQuery による複数データの一括管理
 * - ハンドルベースのクエリキー設計
 * - オプショナルなデータ保持によるUX向上
 *
 * 【外部連携】
 * - BskyAgent の getProfiles API による一括取得
 * - AT Protocol の効率的なバッチ処理活用
 * - 複数プロフィールデータの型安全な管理
 *
 * @param handles - 取得対象のユーザーハンドル配列
 * @param maintainData - 前のデータを保持するかの設定（keepPreviousData使用）
 * @returns TanStack Query結果オブジェクト（複数プロフィールデータ）
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
/**
 * usePrefetchProfileQuery
 *
 * 【主な機能】
 * - プロフィール表示前のデータ事前取得によるUX向上
 * - 非同期プリフェッチ関数の生成と提供
 * - 30秒間のキャッシュによる効率的な事前取得
 * - ユーザー操作に先立つ予測的データロード
 *
 * 【状態管理パターン】
 * - TanStack Query の prefetchQuery による事前キャッシュ構築
 * - useCallback による関数メモ化とパフォーマンス最適化
 * - QueryClient を通じた手動キャッシュ管理
 *
 * 【外部連携】
 * - BskyAgent による AT Protocol API の事前実行
 * - プロフィールクエリキーとの整合性保証
 * - メインクエリとの seamless な連携
 *
 * @returns プリフェッチ実行関数（DIDを受け取りプロフィールを事前取得）
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
/**
 * useProfileUpdateMutation
 *
 * 【主な機能】
 * - ユーザープロフィール情報の包括的更新処理
 * - アバター・バナー画像のアップロードと設定
 * - 表示名・説明文・固定投稿などのテキスト情報更新
 * - 更新完了確認とキャッシュ無効化の自動実行
 *
 * 【状態管理パターン】
 * - TanStack Query の useMutation による楽観的更新
 * - 非同期画像アップロードとプロフィール更新の並行処理
 * - whenAppViewReady による更新完了の確実な待機
 *
 * 【外部連携】
 * - BskyAgent の upsertProfile API による AT Protocol 更新
 * - uploadBlob による画像ファイルのバイナリアップロード
 * - プロフィール認証キャッシュとの自動同期
 *
 * @returns プロフィール更新ミューテーションオブジェクト
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

/**
 * useProfileFollowMutationQueue
 *
 * 【主な機能】
 * - ユーザーフォロー/アンフォロー操作の楽観的更新とキューイング
 * - 連続操作時のリクエスト重複防止と最終状態の保証
 * - フォロー状態の即座UI反映と後続API実行
 * - フォロー完了時の関連ユーザー推奨機能との連携
 *
 * 【状態管理パターン】
 * - useToggleMutationQueue による操作キューイング管理
 * - Shadow キャッシュによる楽観的UI更新
 * - ユーザー行動履歴への操作記録
 *
 * 【外部連携】
 * - BskyAgent のフォローAPI実行
 * - Statsig ログイベントによる操作追跡
 * - 進捗ガイドシステムとの統合
 * - フォロー推奨アルゴリズムへのデータ提供
 *
 * @param profile - フォロー対象のプロフィール情報（Shadow型）
 * @param logContext - ログイベント用のコンテキスト情報
 * @returns [queueFollow, queueUnfollow] フォロー/アンフォロー実行関数のタプル
 */
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

/**
 * useProfileMuteMutationQueue
 *
 * 【主な機能】
 * - ユーザーミュート/ミュート解除操作の楽観的更新とキューイング
 * - 連続ミュート操作時のリクエスト重複防止
 * - ミュート状態の即座UI反映と後続API実行
 * - ミュートアカウントリストキャッシュの自動無効化
 *
 * 【状態管理パターン】
 * - useToggleMutationQueue による操作キューイング管理
 * - Shadow キャッシュによる楽観的UI更新
 * - ミュート状態のブール値管理
 *
 * 【外部連携】
 * - BskyAgent のミュートAPI実行
 * - マイミュートアカウントクエリとの連携
 * - プロフィールキャッシュの即座更新
 *
 * @param profile - ミュート対象のプロフィール情報（Shadow型）
 * @returns [queueMute, queueUnmute] ミュート/ミュート解除実行関数のタプル
 */
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

/**
 * useProfileBlockMutationQueue
 *
 * 【主な機能】
 * - ユーザーブロック/ブロック解除操作の楽観的更新とキューイング
 * - 連続ブロック操作時のリクエスト重複防止
 * - ブロック状態の即座UI反映と後続API実行
 * - 関連する投稿フィードとメッセージキャッシュの無効化
 *
 * 【状態管理パターン】
 * - useToggleMutationQueue による操作キューイング管理
 * - Shadow キャッシュによる楽観的UI更新
 * - ブロックURI の管理と追跡
 *
 * 【外部連携】
 * - AT Protocol のブロックレコード作成/削除API
 * - プロフィール投稿クエリの遅延リセット
 * - メッセージ会話リストとの自動同期
 *
 * @param profile - ブロック対象のプロフィール情報（Shadow型）
 * @returns [queueBlock, queueUnblock] ブロック/ブロック解除実行関数のタプル
 */
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

/**
 * findAllProfilesInQueryData
 *
 * 【主な機能】
 * - QueryClient 内の全プロフィールキャッシュから指定DIDのプロフィールを検索
 * - 単一プロフィールクエリと複数プロフィールクエリの両方を横断検索
 * - Generator 関数による効率的なメモリ使用とイテレーション
 * - キャッシュされた全てのプロフィールバリエーションの包括的取得
 *
 * 【状態管理パターン】
 * - TanStack Query キャッシュの横断検索
 * - Generator 関数による遅延評価とメモリ効率化
 * - 複数クエリタイプ間でのデータ統合
 *
 * 【外部連携】
 * - QueryClient の getQueriesData() による全キャッシュアクセス
 * - プロフィールクエリキーとプロフィール群クエリキーの両方を検索
 * - AT Protocol DID マッチングによる正確な識別
 *
 * @param queryClient - TanStack Query クライアントインスタンス
 * @param did - 検索対象のユーザーDID
 * @returns 一致する ProfileViewDetailed の Generator
 */
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

/**
 * findProfileQueryData
 *
 * 【主な機能】
 * - QueryClient から指定DIDの単一プロフィールデータを直接取得
 * - キャッシュされたプロフィール情報の即座アクセス
 * - 存在しない場合の適切な undefined 戻り値
 * - 型安全なプロフィールデータアクセス
 *
 * 【状態管理パターン】
 * - TanStack Query の getQueryData() による同期的キャッシュアクセス
 * - DID ベースのクエリキー使用
 * - Optional 型による安全なデータ取得
 *
 * 【外部連携】
 * - プロフィールクエリキーとの整合性保証
 * - ProfileViewDetailed 型との型整合性
 * - 他のプロフィール関連機能との連携基盤
 *
 * @param queryClient - TanStack Query クライアントインスタンス
 * @param did - 検索対象のユーザーDID
 * @returns キャッシュされた ProfileViewDetailed または undefined
 */
export function findProfileQueryData(
  queryClient: QueryClient,
  did: string,
): AppBskyActorDefs.ProfileViewDetailed | undefined {
  return queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(
    RQKEY(did),
  )
}
