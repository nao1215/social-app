/**
 * @fileoverview クエリユーティリティモジュール / Query utilities module
 *
 * 【概要】
 * TanStack Query のクエリ操作に関する共通ユーティリティ関数を提供します。
 * 無限スクロールデータの管理、URI マッチング、埋め込み投稿の抽出などを行います。
 *
 * 【主な機能】
 * - truncateAndInvalidate: 無限スクロールデータを最初のページに切り詰めて再取得
 * - didOrHandleUriMatches: DID/ハンドルに関係なくURIマッチング
 * - getEmbeddedPost: 引用投稿から埋め込み投稿を抽出
 * - embedViewRecordToPostView: 埋め込みレコードを投稿ビューに変換
 *
 * 【Go言語ユーザー向け補足】
 * - async/await: Goのgoroutineとchannelに相当する非同期処理（Promiseベース）
 * - Generator関数: Goのchannelやイテレータに相当する遅延評価機能
 * - QueryClient: データキャッシュ管理のための中心的なクライアント（Goのsync.Mapに相当）
 * - QueryKey: キャッシュキーの型安全な配列（Goの[]interface{}に相当）
 */

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

/**
 * 埋め込まれた投稿を取得する関数 / Function to get embedded post
 * 引用リツイートやリプライ内の埋め込み投稿を抽出する / Extracts embedded posts from quote reposts or replies
 *
 * 【Go言語ユーザー向け補足】
 * - unknown型: Goのinterface{}に相当する型なしオブジェクト
 * - ?: Optional型を示す記号（Goのポインタ型やnil許容に相当）
 * - 型ガードによる安全な型変換を実施
 *
 * @param v 埋め込みデータ（型不明） / Embed data (unknown type)
 * @returns 埋め込み投稿レコード、または undefined / Embedded post record, or undefined
 */
export function getEmbeddedPost(
  v: unknown,
): AppBskyEmbedRecord.ViewRecord | undefined {
  // 単純な埋め込みレコードの場合 / Case of simple embed record
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
  // メディア付き埋め込みレコードの場合 / Case of embed record with media
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

/**
 * 埋め込みビューレコードを投稿ビューに変換する関数 / Function to convert embed view record to post view
 * 引用投稿の埋め込みデータを通常の投稿表示形式に変換 / Converts quote post embed data to normal post display format
 *
 * 【Go言語ユーザー向け補足】
 * - オブジェクトリテラル: Goの構造体リテラルに相当
 * - ?.[0]: Optional chaining演算子（安全なプロパティアクセス、Goのnilチェックに相当）
 *
 * @param v 埋め込みビューレコード / Embed view record
 * @returns 投稿ビューオブジェクト / Post view object
 */
export function embedViewRecordToPostView(
  v: AppBskyEmbedRecord.ViewRecord,
): AppBskyFeedDefs.PostView {
  return {
    uri: v.uri, // 投稿URI / Post URI
    cid: v.cid, // コンテンツID / Content ID
    author: v.author, // 作成者情報 / Author information
    record: v.value, // 投稿レコード / Post record
    indexedAt: v.indexedAt, // インデックス日時 / Indexed timestamp
    labels: v.labels, // ラベル情報 / Label information
    embed: v.embeds?.[0], // 埋め込みデータ（最初の要素） / Embed data (first element)
    likeCount: v.likeCount, // いいね数 / Like count
    quoteCount: v.quoteCount, // 引用数 / Quote count
    replyCount: v.replyCount, // 返信数 / Reply count
    repostCount: v.repostCount, // リポスト数 / Repost count
  }
}
