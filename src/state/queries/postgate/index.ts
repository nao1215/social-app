// React フック用のインポート / Import for React hooks
import React from 'react'
// AT Protocol API の型定義とクラス / AT Protocol API types and classes
import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  AppBskyFeedPostgate,
  AtUri,
  type BskyAgent,
} from '@atproto/api'
// TanStack Query フック / TanStack Query hooks
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

// 非同期処理のリトライ機能 / Async retry functionality
import {networkRetry, retry} from '#/lib/async/retry'
// ロギング機能 / Logging functionality
import {logger} from '#/logger'
// 投稿のシャドウ更新機能 / Post shadow update functionality
import {updatePostShadow} from '#/state/cache/post-shadow'
// クエリのキャッシュ設定 / Query cache configuration
import {STALE} from '#/state/queries'
// 投稿取得フック / Post retrieval hook
import {useGetPosts} from '#/state/queries/post'
// 投稿ゲート関連のユーティリティ / Postgate utility functions
import {
  createMaybeDetachedQuoteEmbed,
  createPostgateRecord,
  mergePostgateRecords,
  POSTGATE_COLLECTION,
} from '#/state/queries/postgate/util'
// セッション管理 / Session management
import {useAgent} from '#/state/session'
// Bluesky 型定義 / Bluesky type definitions
import * as bsky from '#/types/bsky'

/**
 * 指定された投稿の投稿ゲートレコードを取得する
 * Retrieves the postgate record for a specified post
 * 
 * @param agent - Bluesky エージェント / Bluesky agent
 * @param postUri - 投稿のURI / URI of the post
 * @returns 投稿ゲートレコードまたはundefined / Postgate record or undefined
 */
export async function getPostgateRecord({
  agent,
  postUri,
}: {
  agent: BskyAgent
  postUri: string
}): Promise<AppBskyFeedPostgate.Record | undefined> {
  // URIを解析 / Parse the URI
  const urip = new AtUri(postUri)

  // ホストがDIDでない場合はハンドルをDIDに解決 / If host is not a DID, resolve handle to DID
  if (!urip.host.startsWith('did:')) {
    const res = await agent.resolveHandle({
      handle: urip.host,
    })
    urip.host = res.data.did
  }

  try {
    const {data} = await retry(
      2,
      e => {
        /*
         * If the record doesn't exist, we want to return null instead of
         * throwing an error. NB: This will also catch reference errors, such as
         * a typo in the URI.
         */
        if (e.message.includes(`Could not locate record:`)) {
          return false
        }
        return true
      },
      () =>
        agent.api.com.atproto.repo.getRecord({
          repo: urip.host,
          collection: POSTGATE_COLLECTION,
          rkey: urip.rkey,
        }),
    )

    if (
      data.value &&
      bsky.validate(data.value, AppBskyFeedPostgate.validateRecord)
    ) {
      return data.value
    } else {
      return undefined
    }
  } catch (e: any) {
    /*
     * If the record doesn't exist, we want to return null instead of
     * throwing an error. NB: This will also catch reference errors, such as
     * a typo in the URI.
     */
    if (e.message.includes(`Could not locate record:`)) {
      return undefined
    } else {
      throw e
    }
  }
}

/**
 * 投稿ゲートレコードを書き込む
 * Writes a postgate record
 * 
 * @param agent - Bluesky エージェント / Bluesky agent
 * @param postUri - 投稿のURI / URI of the post
 * @param postgate - 投稿ゲートレコード / Postgate record
 */
export async function writePostgateRecord({
  agent,
  postUri,
  postgate,
}: {
  agent: BskyAgent
  postUri: string
  postgate: AppBskyFeedPostgate.Record
}) {
  // 投稿URIを解析してrkeyを取得 / Parse post URI to get rkey
  const postUrip = new AtUri(postUri)

  // リトライ機能付きでレコードを書き込み / Write record with retry functionality
  await networkRetry(2, () =>
    agent.api.com.atproto.repo.putRecord({
      repo: agent.session!.did,
      collection: POSTGATE_COLLECTION,
      rkey: postUrip.rkey,
      record: postgate,
    }),
  )
}

/**
 * 投稿ゲートレコードを挿入または更新する
 * Inserts or updates a postgate record
 * 
 * @param agent - Bluesky エージェント / Bluesky agent
 * @param postUri - 投稿のURI / URI of the post
 * @param callback - レコードを変換するコールバック / Callback to transform the record
 */
export async function upsertPostgate(
  {
    agent,
    postUri,
  }: {
    agent: BskyAgent
    postUri: string
  },
  callback: (
    postgate: AppBskyFeedPostgate.Record | undefined,
  ) => Promise<AppBskyFeedPostgate.Record | undefined>,
) {
  // 既存のレコードを取得 / Get existing record
  const prev = await getPostgateRecord({
    agent,
    postUri,
  })
  // コールバックで新しいレコードを生成 / Generate new record with callback
  const next = await callback(prev)
  // 新しいレコードがなければ処理を終了 / Exit if no new record
  if (!next) return
  // 新しいレコードを書き込み / Write new record
  await writePostgateRecord({
    agent,
    postUri,
    postgate: next,
  })
}

/**
 * 投稿ゲートクエリのキーを作成
 * Creates a query key for postgate queries
 */
export const createPostgateQueryKey = (postUri: string) => [
  'postgate-record',
  postUri,
]
/**
 * 投稿ゲートレコードを取得するクエリフック
 * Query hook for retrieving postgate records
 * 
 * @param postUri - 投稿のURI / URI of the post
 * @returns TanStack Query の結果 / TanStack Query result
 */
export function usePostgateQuery({postUri}: {postUri: string}) {
  const agent = useAgent()
  return useQuery({
    staleTime: STALE.SECONDS.THIRTY, // 30秒間はキャッシュが有効 / Cache valid for 30 seconds
    queryKey: createPostgateQueryKey(postUri),
    async queryFn() {
      // 投稿ゲートレコードを取得し、undefinedの場合はnullを返す / Get postgate record, return null if undefined
      return await getPostgateRecord({agent, postUri}).then(res => res ?? null)
    },
  })
}

/**
 * 投稿ゲートレコードを書き込むミューテーションフック
 * Mutation hook for writing postgate records
 */
export function useWritePostgateMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      postUri,
      postgate,
    }: {
      postUri: string
      postgate: AppBskyFeedPostgate.Record
    }) => {
      // 投稿ゲートレコードを書き込み / Write postgate record
      return writePostgateRecord({
        agent,
        postUri,
        postgate,
      })
    },
    onSuccess(_, {postUri}) {
      // 成功時に関連するクエリを無効化してキャッシュを更新 / Invalidate related queries to update cache on success
      queryClient.invalidateQueries({
        queryKey: createPostgateQueryKey(postUri),
      })
    },
  })
}

/**
 * 引用の切り離し/再接続をトグルするミューテーションフック
 * Mutation hook for toggling quote detachment/reattachment
 */
export function useToggleQuoteDetachmentMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const getPosts = useGetPosts()
  // エラー時のロールバック用に前の埋め込みを保存 / Store previous embed for rollback on error
  const prevEmbed = React.useRef<AppBskyFeedDefs.PostView['embed']>()

  return useMutation({
    mutationFn: async ({
      post,
      quoteUri,
      action,
    }: {
      post: AppBskyFeedDefs.PostView
      quoteUri: string
      action: 'detach' | 'reattach'
    }) => {
      // 投稿シャドウが元のオブジェクトを変更するため、ここでキャッシュ / Cache here since post shadow mutates original object
      prevEmbed.current = post.embed

      // 切り離しアクションの場合、UI を即座に更新 / For detach action, update UI immediately
      if (action === 'detach') {
        updatePostShadow(queryClient, post.uri, {
          embed: createMaybeDetachedQuoteEmbed({
            post,
            quote: undefined,
            quoteUri,
            detached: true,
          }),
        })
      }

      // 投稿ゲートレコードを更新 / Update postgate record
      await upsertPostgate({agent, postUri: quoteUri}, async prev => {
        if (prev) {
          // 既存のレコードがある場合 / If existing record exists
          if (action === 'detach') {
            // 切り離されたURIを追加 / Add detached URI
            return mergePostgateRecords(prev, {
              detachedEmbeddingUris: [post.uri],
            })
          } else if (action === 'reattach') {
            // 切り離されたURIを削除 / Remove detached URI
            return {
              ...prev,
              detachedEmbeddingUris:
                prev.detachedEmbeddingUris?.filter(uri => uri !== post.uri) ||
                [],
            }
          }
        } else {
          // 新しいレコードを作成（切り離しの場合のみ） / Create new record (detach only)
          if (action === 'detach') {
            return createPostgateRecord({
              post: quoteUri,
              detachedEmbeddingUris: [post.uri],
            })
          }
        }
      })
    },
    async onSuccess(_data, {post, quoteUri, action}) {
      // 再接続の場合は引用投稿を取得してUIを更新 / For reattach, get quote post and update UI
      if (action === 'reattach') {
        try {
          const [quote] = await getPosts({uris: [quoteUri]})
          updatePostShadow(queryClient, post.uri, {
            embed: createMaybeDetachedQuoteEmbed({
              post,
              quote,
              quoteUri: undefined,
              detached: false,
            }),
          })
        } catch (e: any) {
          // 失敗してもOK、これは楽観的UIのため / OK if this fails, it's just optimistic UI
          logger.error(`Postgate: failed to get quote post for re-attachment`, {
            safeMessage: e.message,
          })
        }
      }
    },
    onError(_, {post, action}) {
      // 切り離しが失敗した場合、埋め込みを元に戻す / If detach fails, restore the embed
      if (action === 'detach' && prevEmbed.current) {
        if (
          AppBskyEmbedRecord.isView(prevEmbed.current) ||
          AppBskyEmbedRecordWithMedia.isView(prevEmbed.current)
        ) {
          updatePostShadow(queryClient, post.uri, {
            embed: prevEmbed.current,
          })
        }
      }
    },
    onSettled() {
      // 処理完了後、前の埋め込みをクリア / Clear previous embed after processing
      prevEmbed.current = undefined
    },
  })
}

/**
 * 引用投稿の有効/無効をトグルするミューテーションフック
 * Mutation hook for toggling quote post enabled/disabled
 */
export function useToggleQuotepostEnabledMutation() {
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({
      postUri,
      action,
    }: {
      postUri: string
      action: 'enable' | 'disable'
    }) => {
      // 投稿ゲートレコードを更新して埋め込みルールを設定 / Update postgate record to set embedding rules
      await upsertPostgate({agent, postUri: postUri}, async prev => {
        if (prev) {
          // 既存のレコードがある場合 / If existing record exists
          if (action === 'disable') {
            // 無効化ルールを追加 / Add disable rule
            return mergePostgateRecords(prev, {
              embeddingRules: [{$type: 'app.bsky.feed.postgate#disableRule'}],
            })
          } else if (action === 'enable') {
            // 埋め込みルールをクリア / Clear embedding rules
            return {
              ...prev,
              embeddingRules: [],
            }
          }
        } else {
          // 新しいレコードを作成（無効化の場合のみ） / Create new record (disable only)
          if (action === 'disable') {
            return createPostgateRecord({
              post: postUri,
              embeddingRules: [{$type: 'app.bsky.feed.postgate#disableRule'}],
            })
          }
        }
      })
    },
  })
}
