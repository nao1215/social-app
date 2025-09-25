import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'
import {
  ChatBskyConvoDefs,
  type ChatBskyConvoListConvos,
  moderateProfile,
  type ModerationOpts,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import throttle from 'lodash.throttle'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {useMessagesEventBus} from '#/state/messages/events'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAgent, useSession} from '#/state/session'
import {useLeftConvos} from './leave-conversation'

export const RQKEY_ROOT = 'convo-list'
export const RQKEY = (
  status: 'accepted' | 'request' | 'all',
  readState: 'all' | 'unread' = 'all',
) => [RQKEY_ROOT, status, readState]
type RQPageParam = string | undefined

/**
 * useListConvosQuery
 *
 * 【主な機能】
 * - メッセージ会話リストの無限スクロール取得とキャッシュ管理
 * - 会話状態（承認済み/リクエスト）と読取状態によるフィルタリング
 * - DMサービスAPIとの通信とページネーション管理
 * - 20件ずつの効率的なバッチ処理
 *
 * 【状態管理パターン】
 * - TanStack Query の useInfiniteQuery による無限スクロール実装
 * - 会話状態と読取状態での複合クエリキー管理
 * - enabledフラグによる条件付きクエリ実行
 *
 * 【外部連携】
 * - BskyAgent の chat.bsky.convo.listConvos API 呼び出し
 * - DM_SERVICE_HEADERS での適切なヘッダー設定
 * - AT Protocol Chat API との統合
 *
 * @param enabled - クエリの有効/無効設定
 * @param status - 会話状態フィルター（'request', 'accepted', または全部）
 * @param readState - 読取状態フィルター（'all', 'unread'）
 * @returns TanStack Queryの無限クエリ結果（会話リストページネーション）
 */
export function useListConvosQuery({
  enabled,
  status,
  readState = 'all',
}: {
  enabled?: boolean
  status?: 'request' | 'accepted'
  readState?: 'all' | 'unread'
} = {}) {
  const agent = useAgent()

  return useInfiniteQuery({
    enabled,
    queryKey: RQKEY(status ?? 'all', readState),
    queryFn: async ({pageParam}) => {
      const {data} = await agent.chat.bsky.convo.listConvos(
        {
          limit: 20,
          cursor: pageParam,
          readState: readState === 'unread' ? 'unread' : undefined,
          status,
        },
        {headers: DM_SERVICE_HEADERS},
      )
      return data
    },
    initialPageParam: undefined as RQPageParam,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

const ListConvosContext = createContext<{
  accepted: ChatBskyConvoDefs.ConvoView[]
  request: ChatBskyConvoDefs.ConvoView[]
} | null>(null)
ListConvosContext.displayName = 'ListConvosContext'

/**
 * useListConvos
 *
 * 【主な機能】
 * - ListConvosContext から会話リストデータを取得
 * - 承認済み会話とリクエスト会話の分類済みデータを提供
 * - Contextが未設定の場合のエラーハンドリング
 * - リアルタイム更新された最新の会話状態を反映
 *
 * 【状態管理パターン】
 * - React Context による会話データの一元管理
 * - TypeScript 型ガードによる安全なデータアクセス
 * - 会話状態別の構造化されたデータ提供
 *
 * 【外部連携】
 * - ListConvosProvider で提供される Context データとの連携
 * - ChatBskyConvoDefs.ConvoView 型の会話データ利用
 * - メッセージシステム全体での一貫した会話管理
 *
 * @returns 承認済み会話とリクエスト会話の分類済みオブジェクト
 * @throws Error - ListConvosProvider の外で使用された場合
 */
export function useListConvos() {
  const ctx = useContext(ListConvosContext)
  if (!ctx) {
    throw new Error('useListConvos must be used within a ListConvosProvider')
  }
  return ctx
}

const empty = {accepted: [], request: []}
/**
 * ListConvosProvider
 *
 * 【主な機能】
 * - メッセージ会話リストの Context 提供とセッション管理
 * - ログイン状態による条件付き Provider 切り替え
 * - 未ログイン時の空の会話リスト提供
 * - ログイン済み時の実際のデータ提供への委謗
 *
 * 【状態管理パターン】
 * - React Context パターンによる状態提供
 * - セッション状態に基づくコンディショナルレンダリング
 * - パフォーマンス最適化のための分層構造
 *
 * 【外部連携】
 * - useSession でのユーザー認証状態確認
 * - ListConvosProviderInner への実際の処理委謗
 * - ListConvosContext での状態提供
 *
 * @param children - Contextを使用する子コンポーネント
 * @returns Context Provider でラップされた子コンポーネント
 */
export function ListConvosProvider({children}: {children: React.ReactNode}) {
  const {hasSession} = useSession()

  if (!hasSession) {
    return (
      <ListConvosContext.Provider value={empty}>
        {children}
      </ListConvosContext.Provider>
    )
  }

  return <ListConvosProviderInner>{children}</ListConvosProviderInner>
}

export function ListConvosProviderInner({
  children,
}: {
  children: React.ReactNode
}) {
  const {refetch, data} = useListConvosQuery({readState: 'unread'})
  const messagesBus = useMessagesEventBus()
  const queryClient = useQueryClient()
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()
  const leftConvos = useLeftConvos()

  const debouncedRefetch = useMemo(() => {
    const refetchAndInvalidate = () => {
      refetch()
      queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})
    }
    return throttle(refetchAndInvalidate, 500, {
      leading: true,
      trailing: true,
    })
  }, [refetch, queryClient])

  useEffect(() => {
    const unsub = messagesBus.on(
      events => {
        if (events.type !== 'logs') return

        for (const log of events.logs) {
          if (ChatBskyConvoDefs.isLogBeginConvo(log)) {
            debouncedRefetch()
          } else if (ChatBskyConvoDefs.isLogLeaveConvo(log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) => optimisticDelete(log.convoId, old),
            )
          } else if (ChatBskyConvoDefs.isLogDeleteMessage(log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(log.convoId, old, convo => {
                  if (
                    (ChatBskyConvoDefs.isDeletedMessageView(log.message) ||
                      ChatBskyConvoDefs.isMessageView(log.message)) &&
                    (ChatBskyConvoDefs.isDeletedMessageView(
                      convo.lastMessage,
                    ) ||
                      ChatBskyConvoDefs.isMessageView(convo.lastMessage))
                  ) {
                    return log.message.id === convo.lastMessage.id
                      ? {
                          ...convo,
                          rev: log.rev,
                          lastMessage: log.message,
                        }
                      : convo
                  } else {
                    return convo
                  }
                }),
            )
          } else if (ChatBskyConvoDefs.isLogCreateMessage(log)) {
            // Store in a new var to avoid TS errors due to closures.
            const logRef: ChatBskyConvoDefs.LogCreateMessage = log

            // Get all matching queries
            const queries = queryClient.getQueriesData<ConvoListQueryData>({
              queryKey: [RQKEY_ROOT],
            })

            // Check if convo exists in any query
            let foundConvo: ChatBskyConvoDefs.ConvoView | null = null
            for (const [_key, query] of queries) {
              if (!query) continue
              const convo = getConvoFromQueryData(logRef.convoId, query)
              if (convo) {
                foundConvo = convo
                break
              }
            }

            if (!foundConvo) {
              // Convo not found, trigger refetch
              debouncedRefetch()
              return
            }

            // Update the convo
            const updatedConvo = {
              ...foundConvo,
              rev: logRef.rev,
              lastMessage: logRef.message,
              unreadCount:
                foundConvo.id !== currentConvoId
                  ? (ChatBskyConvoDefs.isMessageView(logRef.message) ||
                      ChatBskyConvoDefs.isDeletedMessageView(logRef.message)) &&
                    logRef.message.sender.did !== currentAccount?.did
                    ? foundConvo.unreadCount + 1
                    : foundConvo.unreadCount
                  : 0,
            }

            function filterConvoFromPage(convo: ChatBskyConvoDefs.ConvoView[]) {
              return convo.filter(c => c.id !== logRef.convoId)
            }

            // Update all matching queries
            function updateFn(old?: ConvoListQueryData) {
              if (!old) return old
              return {
                ...old,
                pages: old.pages.map((page, i) => {
                  if (i === 0) {
                    return {
                      ...page,
                      convos: [
                        updatedConvo,
                        ...filterConvoFromPage(page.convos),
                      ],
                    }
                  }
                  return {
                    ...page,
                    convos: filterConvoFromPage(page.convos),
                  }
                }),
              }
            }
            // always update the unread one
            queryClient.setQueriesData(
              {queryKey: RQKEY('all', 'unread')},
              (old?: ConvoListQueryData) =>
                old
                  ? updateFn(old)
                  : ({
                      pageParams: [undefined],
                      pages: [{convos: [updatedConvo], cursor: undefined}],
                    } satisfies ConvoListQueryData),
            )
            // update the other ones based on status of the incoming message
            if (updatedConvo.status === 'accepted') {
              queryClient.setQueriesData(
                {queryKey: RQKEY('accepted')},
                updateFn,
              )
            } else if (updatedConvo.status === 'request') {
              queryClient.setQueriesData({queryKey: RQKEY('request')}, updateFn)
            }
          } else if (ChatBskyConvoDefs.isLogReadMessage(log)) {
            const logRef: ChatBskyConvoDefs.LogReadMessage = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => ({
                  ...convo,
                  unreadCount: 0,
                  rev: logRef.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogAcceptConvo(log)) {
            const logRef: ChatBskyConvoDefs.LogAcceptConvo = log
            const requests = queryClient.getQueryData<ConvoListQueryData>(
              RQKEY('request'),
            )
            if (!requests) {
              debouncedRefetch()
              return
            }
            const acceptedConvo = getConvoFromQueryData(log.convoId, requests)
            if (!acceptedConvo) {
              debouncedRefetch()
              return
            }
            queryClient.setQueryData(
              RQKEY('request'),
              (old?: ConvoListQueryData) =>
                optimisticDelete(logRef.convoId, old),
            )
            queryClient.setQueriesData(
              {queryKey: RQKEY('accepted')},
              (old?: ConvoListQueryData) => {
                if (!old) {
                  debouncedRefetch()
                  return old
                }
                return {
                  ...old,
                  pages: old.pages.map((page, i) => {
                    if (i === 0) {
                      return {
                        ...page,
                        convos: [
                          {...acceptedConvo, status: 'accepted'},
                          ...page.convos,
                        ],
                      }
                    }
                    return page
                  }),
                }
              },
            )
          } else if (ChatBskyConvoDefs.isLogMuteConvo(log)) {
            const logRef: ChatBskyConvoDefs.LogMuteConvo = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => ({
                  ...convo,
                  muted: true,
                  rev: logRef.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogUnmuteConvo(log)) {
            const logRef: ChatBskyConvoDefs.LogUnmuteConvo = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => ({
                  ...convo,
                  muted: false,
                  rev: logRef.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogAddReaction(log)) {
            const logRef: ChatBskyConvoDefs.LogAddReaction = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => ({
                  ...convo,
                  lastReaction: {
                    $type: 'chat.bsky.convo.defs#messageAndReactionView',
                    reaction: logRef.reaction,
                    message: logRef.message,
                  },
                  rev: logRef.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogRemoveReaction(log)) {
            const logRef: ChatBskyConvoDefs.LogRemoveReaction = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => {
                  if (
                    // if the convo is the same
                    logRef.convoId === convo.id &&
                    ChatBskyConvoDefs.isMessageAndReactionView(
                      convo.lastReaction,
                    ) &&
                    ChatBskyConvoDefs.isMessageView(logRef.message) &&
                    // ...and the message is the same
                    convo.lastReaction.message.id === logRef.message.id &&
                    // ...and the reaction is the same
                    convo.lastReaction.reaction.sender.did ===
                      logRef.reaction.sender.did &&
                    convo.lastReaction.reaction.value === logRef.reaction.value
                  ) {
                    return {
                      ...convo,
                      // ...remove the reaction. hopefully they didn't react twice in a row!
                      lastReaction: undefined,
                      rev: logRef.rev,
                    }
                  } else {
                    return convo
                  }
                }),
            )
          }
        }
      },
      {
        // get events for all chats
        convoId: undefined,
      },
    )

    return () => unsub()
  }, [
    messagesBus,
    currentConvoId,
    queryClient,
    currentAccount?.did,
    debouncedRefetch,
  ])

  const ctx = useMemo(() => {
    const convos =
      data?.pages
        .flatMap(page => page.convos)
        .filter(convo => !leftConvos.includes(convo.id)) ?? []
    return {
      accepted: convos.filter(conv => conv.status === 'accepted'),
      request: convos.filter(conv => conv.status === 'request'),
    }
  }, [data, leftConvos])

  return (
    <ListConvosContext.Provider value={ctx}>
      {children}
    </ListConvosContext.Provider>
  )
}

/**
 * useUnreadMessageCount
 *
 * 【主な機能】
 * - 未読メッセージ数と新着通知状態の計算
 * - 会話状態（承認済み/リクエスト）別の未読数管理
 * - 現在開いている会話の除外とモデレーション適用
 * - UI表示用のフォーマット済み数値とバッジ表示判定
 *
 * 【状態管理パターン】
 * - useMemo による計算結果のメモ化とパフォーマンス最適化
 * - 複数の依存状態に基づく再計算ロジック
 * - モデレーション設定を含む包括的なフィルタリング
 *
 * 【外部連携】
 * - useListConvos からの会話データ取得
 * - useCurrentConvoId での現在会話状態連携
 * - useModerationOpts でのモデレーション設定適用
 * - calculateCount 関数での実際の数値計算
 *
 * @returns 未読数情報オブジェクト（count, numUnread, hasNew）
 */
export function useUnreadMessageCount() {
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()
  const {accepted, request} = useListConvos()
  const moderationOpts = useModerationOpts()

  return useMemo<{
    count: number
    numUnread?: string
    hasNew: boolean
  }>(() => {
    const acceptedCount = calculateCount(
      accepted,
      currentAccount?.did,
      currentConvoId,
      moderationOpts,
    )
    const requestCount = calculateCount(
      request,
      currentAccount?.did,
      currentConvoId,
      moderationOpts,
    )
    if (acceptedCount > 0) {
      const total = acceptedCount + Math.min(requestCount, 1)
      return {
        count: total,
        numUnread: total > 10 ? '10+' : String(total),
        // only needed when numUnread is undefined
        hasNew: false,
      }
    } else if (requestCount > 0) {
      return {
        count: 1,
        numUnread: undefined,
        hasNew: true,
      }
    } else {
      return {
        count: 0,
        numUnread: undefined,
        hasNew: false,
      }
    }
  }, [accepted, request, currentAccount?.did, currentConvoId, moderationOpts])
}

function calculateCount(
  convos: ChatBskyConvoDefs.ConvoView[],
  currentAccountDid: string | undefined,
  currentConvoId: string | undefined,
  moderationOpts: ModerationOpts | undefined,
) {
  return (
    convos
      .filter(convo => convo.id !== currentConvoId)
      .reduce((acc, convo) => {
        const otherMember = convo.members.find(
          member => member.did !== currentAccountDid,
        )

        if (!otherMember || !moderationOpts) return acc

        const moderation = moderateProfile(otherMember, moderationOpts)
        const shouldIgnore =
          convo.muted ||
          moderation.blocked ||
          otherMember.handle === 'missing.invalid'
        const unreadCount = !shouldIgnore && convo.unreadCount > 0 ? 1 : 0

        return acc + unreadCount
      }, 0) ?? 0
  )
}

export type ConvoListQueryData = {
  pageParams: Array<string | undefined>
  pages: Array<ChatBskyConvoListConvos.OutputSchema>
}

/**
 * useOnMarkAsRead
 *
 * 【主な機能】
 * - 指定した会話を既読状態に更新する関数を提供
 * - クエリキャッシュへの楽観的更新適用
 * - 全ての会話リストクエリに対する一括更新
 * - unreadCount を 0 にリセットしてUIに即座反映
 *
 * 【状態管理パターン】
 * - useCallback による関数メモ化とパフォーマンス最適化
 * - TanStack Query の setQueriesData による楽観的更新
 * - optimisticUpdate ヘルパー関数での安全な状態更新
 *
 * 【外部連携】
 * - QueryClient の setQueriesData でのキャッシュ操作
 * - RQKEY_ROOT ベースの全クエリへの一括適用
 * - 会話IDマッチングによる特定会話の状態更新
 *
 * @returns 会話IDを受け取り既読状態に更新する関数
 */
export function useOnMarkAsRead() {
  const queryClient = useQueryClient()

  return useCallback(
    (chatId: string) => {
      queryClient.setQueriesData(
        {queryKey: [RQKEY_ROOT]},
        (old?: ConvoListQueryData) => {
          if (!old) return old
          return optimisticUpdate(chatId, old, convo => ({
            ...convo,
            unreadCount: 0,
          }))
        },
      )
    },
    [queryClient],
  )
}

function optimisticUpdate(
  chatId: string,
  old?: ConvoListQueryData,
  updateFn?: (
    convo: ChatBskyConvoDefs.ConvoView,
  ) => ChatBskyConvoDefs.ConvoView,
) {
  if (!old || !updateFn) return old

  return {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      convos: page.convos.map(convo =>
        chatId === convo.id ? updateFn(convo) : convo,
      ),
    })),
  }
}

function optimisticDelete(chatId: string, old?: ConvoListQueryData) {
  if (!old) return old

  return {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      convos: page.convos.filter(convo => chatId !== convo.id),
    })),
  }
}

export function getConvoFromQueryData(chatId: string, old: ConvoListQueryData) {
  for (const page of old.pages) {
    for (const convo of page.convos) {
      if (convo.id === chatId) {
        return convo
      }
    }
  }
  return null
}

/**
 * findAllProfilesInQueryData
 *
 * 【主な機能】
 * - QueryClient 内の全会話リストキャッシュから指定DIDのプロフィールを検索
 * - 会話メンバー情報からのプロフィールデータ抽出
 * - Generator 関数による効率的なメモリ使用とイテレーション
 * - 全ページと全会話メンバーを横断する包括的検索
 *
 * 【状態管理パターン】
 * - TanStack Query キャッシュの横断検索
 * - Generator 関数による遅延評価とメモリ効率化
 * - 複数ページと複数会話間でのネストしたイテレーション
 *
 * 【外部連携】
 * - QueryClient の getQueriesData() による全キャッシュアクセス
 * - ChatBskyConvoListConvos データ構造との連携
 * - 会話メンバーのDIDマッチング機能
 *
 * @param queryClient - TanStack Query クライアントインスタンス
 * @param did - 検索対象のユーザーDID
 * @returns 一致する会話メンバープロフィールのGenerator
 */
export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<ChatBskyConvoListConvos.OutputSchema>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }

    for (const page of queryData.pages) {
      for (const convo of page.convos) {
        for (const member of convo.members) {
          if (member.did === did) {
            yield member
          }
        }
      }
    }
  }
}
