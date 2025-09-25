import {type ChatBskyConvoDefs} from '@atproto/api'
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {STALE} from '#/state/queries'
import {useOnMarkAsRead} from '#/state/queries/messages/list-conversations'
import {useAgent} from '#/state/session'
import {
  type ConvoListQueryData,
  getConvoFromQueryData,
  RQKEY_ROOT as LIST_CONVOS_KEY,
} from './list-conversations'

const RQKEY_ROOT = 'convo'
export const RQKEY = (convoId: string) => [RQKEY_ROOT, convoId]

/**
 * useConvoQuery
 *
 * 【主な機能】
 * - 指定した会話IDの詳細情報を取得してキャッシュ管理
 * - 初期データとして会話ビューを使用して即座表示
 * - DMサービスAPIとの通信で最新会話状態を同期
 * - 無限キャッシュでパフォーマンス最適化
 *
 * 【状態管理パターン】
 * - TanStack Query の useQuery による宣言的データ取得
 * - initialData でのプレースホルダーデータ活用
 * - staleTime: INFINITY での長期キャッシュ保持
 *
 * 【外部連携】
 * - BskyAgent の chat.bsky.convo.getConvo API 呼び出し
 * - DM_SERVICE_HEADERS での適切なヘッダー設定
 * - ChatBskyConvoDefs.ConvoView 型との統合
 *
 * @param convo - 初期データとして使用する会話ビュー情報
 * @returns TanStack Query結果オブジェクト（会話詳細情報）
 */
export function useConvoQuery(convo: ChatBskyConvoDefs.ConvoView) {
  const agent = useAgent()

  return useQuery({
    queryKey: RQKEY(convo.id),
    queryFn: async () => {
      const {data} = await agent.chat.bsky.convo.getConvo(
        {convoId: convo.id},
        {headers: DM_SERVICE_HEADERS},
      )
      return data.convo
    },
    initialData: convo,
    staleTime: STALE.INFINITY,
  })
}

/**
 * precacheConvoQuery
 *
 * 【主な機能】
 * - 会話データをQueryClientキャッシュに事前セット
 * - 会話表示前のデータプリロードでUX向上
 * - API呼び出しをスキップして即座データ表示
 * - キャッシュミス防止とローディング時間短縮
 *
 * 【状態管理パターン】
 * - TanStack Query の setQueryData による直接キャッシュ操作
 * - クエリキーとデータの組み合わせでのキャッシュエントリ作成
 * - プリロードシナリオでのパフォーマンス最適化
 *
 * 【外部連携】
 * - RQKEY 関数での一貫したクエリキー生成
 * - useConvoQuery とのキャッシュ統合
 * - ChatBskyConvoDefs.ConvoView データ構造との連携
 *
 * @param queryClient - TanStack Queryクライアントインスタンス
 * @param convo - プリキャッシュする会話データ
 */
export function precacheConvoQuery(
  queryClient: QueryClient,
  convo: ChatBskyConvoDefs.ConvoView,
) {
  queryClient.setQueryData(RQKEY(convo.id), convo)
}

/**
 * useMarkAsReadMutation
 *
 * 【主な機能】
 * - 指定した会話を既読状態に更新するミューテーション
 * - 楽観的更新でUIに即座既読状態を反映
 * - API実行後の会話リストキャッシュ同期更新
 * - メッセージID指定による部分既読機能サポート
 *
 * 【状態管理パターン】
 * - TanStack Query の useMutation による楽観的更新
 * - onMutate での即座UI更新とonSuccessでのキャッシュ同期
 * - useOnMarkAsRead フックとの連携でリスト状態管理
 *
 * 【外部連携】
 * - BskyAgent の chat.bsky.convo.updateRead API 実行
 * - LIST_CONVOS_KEY クエリの一括更新でリスト同期
 * - getConvoFromQueryData での会話存在確認
 *
 * @returns 既読マークミューテーションオブジェクト
 */
export function useMarkAsReadMutation() {
  const optimisticUpdate = useOnMarkAsRead()
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({
      convoId,
      messageId,
    }: {
      convoId?: string
      messageId?: string
    }) => {
      if (!convoId) throw new Error('No convoId provided')

      await agent.api.chat.bsky.convo.updateRead(
        {
          convoId,
          messageId,
        },
        {
          encoding: 'application/json',
          headers: DM_SERVICE_HEADERS,
        },
      )
    },
    onMutate({convoId}) {
      if (!convoId) throw new Error('No convoId provided')
      optimisticUpdate(convoId)
    },
    onSuccess(_, {convoId}) {
      if (!convoId) return

      queryClient.setQueriesData(
        {queryKey: [LIST_CONVOS_KEY]},
        (old?: ConvoListQueryData) => {
          if (!old) return old

          const existingConvo = getConvoFromQueryData(convoId, old)

          if (existingConvo) {
            return {
              ...old,
              pages: old.pages.map(page => {
                return {
                  ...page,
                  convos: page.convos.map(convo => {
                    if (convo.id === convoId) {
                      return {
                        ...convo,
                        unreadCount: 0,
                      }
                    }
                    return convo
                  }),
                }
              }),
            }
          } else {
            // If we somehow marked a convo as read that doesn't exist in the
            // list, then we don't need to do anything.
          }
        },
      )
    },
  })
}
