// AT Protocol APIの型定義とURIクラスをインポート
// Import AT Protocol API type definitions and URI class
import {type AppBskyGraphDefs, AtUri} from '@atproto/api'

// ハンドルの有効性をチェックするユーティリティをインポート
// Import utility to check handle validity
import {isInvalidHandle} from '#/lib/strings/handles'

/**
 * プロフィールページへのリンクを生成する関数
 * Function to generate link to profile page
 * @param info ユーザー情報（DIDとハンドル） / User information (DID and handle)
 * @param segments 追加のURLセグメント / Additional URL segments
 * @returns プロフィールリンク / Profile link
 */
export function makeProfileLink(
  info: {
    did: string // ユーザーDID / User DID
    handle: string // ユーザーハンドル / User handle
  },
  ...segments: string[] // 追加URLセグメント / Additional URL segments
) {
  // デフォルトではDIDを使用
  // Use DID by default
  let handleSegment = info.did
  // ハンドルがあり、有効である場合はハンドルを使用
  // Use handle if available and valid
  if (info.handle && !isInvalidHandle(info.handle)) {
    handleSegment = info.handle
  }
  // URLパスを組み立てて返す
  // Build and return URL path
  return [`/profile`, handleSegment, ...segments].join('/')
}

/**
 * カスタムフィードへのリンクを生成する関数
 * Function to generate link to custom feed
 * @param did フィード作成者のDID / Feed creator's DID
 * @param rkey フィードのレコードキー / Feed record key
 * @param segment 追加セグメント / Additional segment
 * @param feedCacheKey フィードキャッシュキー / Feed cache key
 * @returns カスタムフィードリンク / Custom feed link
 */
export function makeCustomFeedLink(
  did: string,
  rkey: string,
  segment?: string | undefined,
  feedCacheKey?: 'discover' | 'explore' | undefined,
) {
  // フィードURLのパス部分を構築
  // Build feed URL path part
  const path = [`/profile`, did, 'feed', rkey, ...(segment ? [segment] : [])].join('/')
  
  // キャッシュキーがある場合はクエリパラメータとして追加
  // Add cache key as query parameter if present
  const query = feedCacheKey ? `?feedCacheKey=${encodeURIComponent(feedCacheKey)}` : ''
  
  return path + query
}

/**
 * リストページへのリンクを生成する関数
 * Function to generate link to list page
 * @param did リスト作成者のDID / List creator's DID
 * @param rkey リストのレコードキー / List record key
 * @param segments 追加URLセグメント / Additional URL segments
 * @returns リストリンク / List link
 */
export function makeListLink(did: string, rkey: string, ...segments: string[]) {
  // リストURLパスを構築して返す
  // Build and return list URL path
  return [`/profile`, did, 'lists', rkey, ...segments].join('/')
}

/**
 * タグ検索リンクを生成する関数
 * Function to generate tag search link
 * @param did 検索するDID / DID to search
 * @returns タグ検索リンク / Tag search link
 */
export function makeTagLink(did: string) {
  // DIDをクエリパラメータとして検索URLを生成
  // Generate search URL with DID as query parameter
  return `/search?q=${encodeURIComponent(did)}`
}

/**
 * 検索リンクを生成する関数
 * Function to generate search link
 * @param props 検索パラメータ / Search parameters
 * @returns 検索リンク / Search link
 */
export function makeSearchLink(props: {query: string; from?: 'me' | string}) {
  // ベースクエリを構築
  // Build base query
  let fullQuery = props.query
  
  // fromパラメータがある場合はクエリに追加
  // Add from parameter to query if present
  if (props.from) {
    fullQuery += ` from:${props.from}`
  }
  
  // URLエンコードして検索URLを生成
  // URL encode and generate search URL
  return `/search?q=${encodeURIComponent(fullQuery)}`
}

/**
 * スターターパックへのリンクを生成する関数
 * Function to generate starter pack link
 * @param starterPackOrName スターターパックオブジェクトまたは名前 / Starter pack object or name
 * @param rkey レコードキー（文字列指定時のみ） / Record key (only when string is specified)
 * @returns スターターパックリンク / Starter pack link
 */
export function makeStarterPackLink(
  starterPackOrName:
    | AppBskyGraphDefs.StarterPackViewBasic // 基本ビュー型 / Basic view type
    | AppBskyGraphDefs.StarterPackView // 詳細ビュー型 / Detailed view type
    | string, // 文字列指定 / String specification
  rkey?: string,
) {
  if (typeof starterPackOrName === 'string') {
    // 文字列指定の場合：名前とrkeyでURLを構築
    // For string specification: build URL with name and rkey
    return `https://bsky.app/start/${starterPackOrName}/${rkey}`
  } else {
    // オブジェクト指定の場合：URIからrkeyを抽出し、作成者ハンドルでURLを構築
    // For object specification: extract rkey from URI and build URL with creator handle
    const uriRkey = new AtUri(starterPackOrName.uri).rkey
    return `https://bsky.app/start/${starterPackOrName.creator.handle}/${uriRkey}`
  }
}
