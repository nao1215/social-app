// AT Protocol API型定義 / AT Protocol API type definitions
import {
  AppBskyActorDefs, // アクター定義型 / Actor definition types
  AppBskyEmbedRecord, // 埋め込みレコード型 / Embed record types
  AppBskyEmbedRecordWithMedia, // メディア付き埋め込みレコード型 / Embed record with media types
  AppBskyFeedDefs, // フィード定義型 / Feed definition types
  AppBskyFeedPost, // 投稿型 / Post types
  AtUri, // AT URIパーサー / AT URI parser
} from '@atproto/api'
// TanStack Query型定義 / TanStack Query type definitions
import {InfiniteData, QueryClient, QueryKey} from '@tanstack/react-query'

// アプリ内Bluesky型定義 / App-internal Bluesky type definitions
import * as bsky from '#/types/bsky'

/**
 * 無限スクロールデータを最初のページに切り詰めて無効化する関数 / Function to truncate infinite scroll data to first page and invalidate
 * フィードやリストの更新時に使用 / Used when refreshing feeds or lists
 * @param queryClient クエリクライアント / Query client
 * @param queryKey 対象クエリキー / Target query key
 */
export async function truncateAndInvalidate<T = any>(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  // ページを最初の1ページのみに切り詰め / Truncate to only the first page
  queryClient.setQueriesData<InfiniteData<T>>({queryKey}, data => {
    if (data) {
      return {
        pageParams: data.pageParams.slice(0, 1), // 最初のページパラメーターのみ / Only first page parameter
        pages: data.pages.slice(0, 1), // 最初のページのみ / Only first page
      }
    }
    return data
  })
  // クエリを無効化して再取得を促す / Invalidate query to trigger refetch
  return queryClient.invalidateQueries({queryKey})
}

/**
 * AtUriがDIDまたはハンドルをホストとして使用しているかに関係なくマッチするかをチェックする関数
 * Function to check if AtUri matches regardless of whether it uses DID or handle as host
 * 
 * AtUriは検索対象のURI、recordはチェック対象のレコード
 * AtUri should be the URI being searched for, record is the record being checked
 * 
 * @param atUri 検索対象のAT URI / AT URI being searched for
 * @param record チェック対象のレコード / Record being checked
 */
export function didOrHandleUriMatches(
  atUri: AtUri,
  record: {uri: string; author: AppBskyActorDefs.ProfileViewBasic},
) {
  if (atUri.host.startsWith('did:')) {
    // DIDを使用している場合は完全一致でチェック / For DID usage, check exact match
    return atUri.href === record.uri
  }

  // ハンドルを使用している場合はハンドルとrkeyでチェック / For handle usage, check handle and rkey
  return atUri.host === record.author.handle && record.uri.endsWith(atUri.rkey)
}

export function getEmbeddedPost(
  v: unknown,
): AppBskyEmbedRecord.ViewRecord | undefined {
  if (
    bsky.dangerousIsType<AppBskyEmbedRecord.View>(v, AppBskyEmbedRecord.isView)
  ) {
    if (
      AppBskyEmbedRecord.isViewRecord(v.record) &&
      AppBskyFeedPost.isRecord(v.record.value)
    ) {
      return v.record
    }
  }
  if (
    bsky.dangerousIsType<AppBskyEmbedRecordWithMedia.View>(
      v,
      AppBskyEmbedRecordWithMedia.isView,
    )
  ) {
    if (
      AppBskyEmbedRecord.isViewRecord(v.record.record) &&
      AppBskyFeedPost.isRecord(v.record.record.value)
    ) {
      return v.record.record
    }
  }
}

export function embedViewRecordToPostView(
  v: AppBskyEmbedRecord.ViewRecord,
): AppBskyFeedDefs.PostView {
  return {
    uri: v.uri,
    cid: v.cid,
    author: v.author,
    record: v.value,
    indexedAt: v.indexedAt,
    labels: v.labels,
    embed: v.embeds?.[0],
    likeCount: v.likeCount,
    quoteCount: v.quoteCount,
    replyCount: v.replyCount,
    repostCount: v.repostCount,
  }
}
