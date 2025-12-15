/**
 * URLヘルパーモジュール
 *
 * 【概要】
 * Bluesky/AT ProtocolのURL処理に関するユーティリティ関数群。
 * URLの検証、変換、解析などを行う。
 *
 * 【主な機能】
 * - BlueskyアプリURL（bsky.app）の判定・変換
 * - AT Protocol URI（at://...）とHTTP URLの相互変換
 * - 信頼できるドメインの判定
 * - リンク警告の判定（フィッシング対策）
 * - 短縮URL（go.bsky.app）の処理
 *
 * 【Goユーザー向け補足】
 * - 各関数はGoの単純な関数に相当
 * - 正規表現パターンはGoのregexpパッケージと同様
 * - try/catchはGoのerror戻り値に相当
 */

/**
 * AtUri: AT Protocol URI パーサー
 * at://did:plc:xxx/collection/rkey 形式のURIを解析
 */
import {AtUri} from '@atproto/api'

/**
 * psl: Public Suffix List ライブラリ
 * ドメインの解析（サブドメイン、apex domain）に使用
 */
import psl from 'psl'

/**
 * TLDs: トップレベルドメイン一覧
 * 有効なドメインか判定するために使用
 */
import TLDs from 'tlds'

import {BSKY_SERVICE} from '#/lib/constants'
import {isInvalidHandle} from '#/lib/strings/handles'
import {startUriToStarterPackUri} from '#/lib/strings/starter-pack'
import {logger} from '#/logger'

/**
 * Blueskyアプリのホスト名
 * 本番環境のWebアプリURL
 */
export const BSKY_APP_HOST = 'https://bsky.app'

/**
 * 信頼できるホスト一覧
 * これらのドメインへのリンクは警告なしで許可される
 * 正規表現エスケープ済み（.をリテラルドットとして扱う）
 */
const BSKY_TRUSTED_HOSTS = [
  'bsky\\.app',           // メインのWebアプリ
  'bsky\\.social',        // PDSサービス
  'blueskyweb\\.xyz',     // 公式サイト
  'blueskyweb\\.zendesk\\.com', // サポートサイト
  ...(__DEV__ ? ['localhost:19006', 'localhost:8100'] : []), // 開発環境
]

/**
 * 信頼できるURLの正規表現パターン
 *
 * 【マッチするパターン】
 * - BSKY_TRUSTED_HOSTSのドメイン（サブドメイン付きも可）
 * - 相対パス（/profile など）
 * - ハッシュリンク（#）
 *
 * 【Goユーザー向け補足】
 * - new RegExp()はregexp.MustCompile()に相当
 * - バックスラッシュの二重エスケープに注意
 */
const TRUSTED_REGEX = new RegExp(
  `^(http(s)?://(([\\w-]+\\.)?${BSKY_TRUSTED_HOSTS.join(
    '|([\\w-]+\\.)?',
  )})|/|#)`,
)

/**
 * 有効なドメインか判定
 *
 * 【判定ロジック】
 * TLD一覧と照合し、文字列が有効なTLDで終わるかチェック。
 * 例: "example.com" → true（.comがTLD一覧にある）
 *
 * @param str 判定する文字列
 * @returns 有効なドメインの場合true
 */
export function isValidDomain(str: string): boolean {
  return !!TLDs.find(tld => {
    let i = str.lastIndexOf(tld)
    if (i === -1) {
      return false
    }
    // TLDの前に.があり、TLDが文字列の末尾であることを確認
    return str.charAt(i - 1) === '.' && i === str.length - tld.length
  })
}

/**
 * AT Protocol レコードURIを生成
 *
 * 【生成形式】
 * at://did:plc:xxx/collection/rkey
 *
 * 【使用例】
 * makeRecordUri('did:plc:xxx', 'app.bsky.feed.post', '3abc123')
 * → 'at://did:plc:xxx/app.bsky.feed.post/3abc123'
 *
 * @param didOrName ユーザーDIDまたはハンドル
 * @param collection コレクション名（app.bsky.feed.postなど）
 * @param rkey レコードキー
 * @returns AT Protocol URI
 */
export function makeRecordUri(
  didOrName: string,
  collection: string,
  rkey: string,
) {
  const urip = new AtUri('at://host/')
  urip.host = didOrName
  urip.collection = collection
  urip.rkey = rkey
  return urip.toString()
}

/**
 * URLをユーザーフレンドリーなドメイン名に変換
 *
 * 【動作】
 * - Blueskyサービス → 'Bluesky Social'
 * - その他 → ホスト名のみ返す
 *
 * @param url 変換するURL
 * @returns 表示用ドメイン名
 */
export function toNiceDomain(url: string): string {
  try {
    const urlp = new URL(url)
    if (`https://${urlp.host}` === BSKY_SERVICE) {
      return 'Bluesky Social'
    }
    return urlp.host ? urlp.host : url
  } catch (e) {
    return url
  }
}

/**
 * URLを短縮表示形式に変換
 *
 * 【動作】
 * パスが15文字を超える場合は省略記号（...）で切り詰める。
 * 例: "example.com/very/long/path" → "example.com/very/long/..."
 *
 * @param url 変換するURL
 * @returns 短縮されたURL文字列
 */
export function toShortUrl(url: string): string {
  try {
    const urlp = new URL(url)
    // HTTPプロトコル以外はそのまま返す
    if (urlp.protocol !== 'http:' && urlp.protocol !== 'https:') {
      return url
    }
    // パス + クエリ + ハッシュを結合
    const path =
      (urlp.pathname === '/' ? '' : urlp.pathname) + urlp.search + urlp.hash
    // 15文字を超える場合は切り詰め
    if (path.length > 15) {
      return urlp.host + path.slice(0, 13) + '...'
    }
    return urlp.host + path
  } catch (e) {
    return url
  }
}

/**
 * 共有用URLに変換
 *
 * 【動作】
 * 相対パスをbsky.appの絶対URLに変換。
 * 既にhttpsで始まる場合はそのまま返す。
 *
 * @param url 変換するURL（相対パスまたは絶対URL）
 * @returns 共有用の絶対URL
 */
export function toShareUrl(url: string): string {
  if (!url.startsWith('https')) {
    const urlp = new URL('https://bsky.app')
    urlp.pathname = url
    url = urlp.toString()
  }
  return url
}

/**
 * Blueskyアプリの絶対URLに変換
 *
 * @param url 変換するパスまたはURL
 * @returns bsky.appの絶対URL
 */
export function toBskyAppUrl(url: string): string {
  return new URL(url, BSKY_APP_HOST).toString()
}

/**
 * BlueskyアプリURLか判定
 *
 * @param url 判定するURL
 * @returns https://bsky.app/で始まる場合true
 */
export function isBskyAppUrl(url: string): boolean {
  return url.startsWith('https://bsky.app/')
}

/**
 * 相対URLか判定
 *
 * 【判定ロジック】
 * /で始まり、//で始まらないURL（プロトコル相対URLを除外）
 *
 * @param url 判定するURL
 * @returns 相対URLの場合true
 */
export function isRelativeUrl(url: string): boolean {
  return /^\/[^/]/.test(url)
}

/**
 * Bluesky RSSフィードURLか判定
 *
 * @param url 判定するURL
 * @returns RSSフィードURLの場合true
 */
export function isBskyRSSUrl(url: string): boolean {
  return (
    (url.startsWith('https://bsky.app/') || isRelativeUrl(url)) &&
    /\/rss\/?$/.test(url)
  )
}

/**
 * 外部URLか判定
 *
 * 【外部URLの定義】
 * - bsky.app以外のHTTP(S)リンク
 * - RSSフィードURL（外部ブラウザで開く必要があるため）
 *
 * @param url 判定するURL
 * @returns 外部URLの場合true
 */
export function isExternalUrl(url: string): boolean {
  const external = !isBskyAppUrl(url) && url.startsWith('http')
  const rss = isBskyRSSUrl(url)
  return external || rss
}

/**
 * 信頼できるURLか判定
 *
 * 【用途】
 * リンクを警告なしで開けるかの判定に使用。
 * BSKY_TRUSTED_HOSTSに含まれるドメインはtrue。
 *
 * @param url 判定するURL
 * @returns 信頼できるURLの場合true
 */
export function isTrustedUrl(url: string): boolean {
  return TRUSTED_REGEX.test(url)
}

/**
 * Bluesky投稿URLか判定
 *
 * 【URL形式】
 * https://bsky.app/profile/{handle}/post/{rkey}
 *
 * @param url 判定するURL
 * @returns 投稿URLの場合true
 */
export function isBskyPostUrl(url: string): boolean {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return /profile\/(?<name>[^/]+)\/post\/(?<rkey>[^/]+)/i.test(
        urlp.pathname,
      )
    } catch {}
  }
  return false
}

/**
 * Blueskyカスタムフィード URLか判定
 *
 * 【URL形式】
 * https://bsky.app/profile/{handle}/feed/{rkey}
 *
 * @param url 判定するURL
 * @returns カスタムフィードURLの場合true
 */
export function isBskyCustomFeedUrl(url: string): boolean {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return /profile\/(?<name>[^/]+)\/feed\/(?<rkey>[^/]+)/i.test(
        urlp.pathname,
      )
    } catch {}
  }
  return false
}

/**
 * BlueskyリストURLか判定
 *
 * 【URL形式】
 * https://bsky.app/profile/{handle}/lists/{rkey}
 *
 * @param url 判定するURL
 * @returns リストURLの場合true
 */
export function isBskyListUrl(url: string): boolean {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return /profile\/(?<name>[^/]+)\/lists\/(?<rkey>[^/]+)/i.test(
        urlp.pathname,
      )
    } catch {
      console.error('Unexpected error in isBskyListUrl()', url)
    }
  }
  return false
}

/**
 * Blueskyスタート（旧形式）URLか判定
 *
 * 【URL形式】
 * https://bsky.app/start/{name}/{rkey}
 * （スターターパックの旧URL形式）
 *
 * @param url 判定するURL
 * @returns スタートURLの場合true
 */
export function isBskyStartUrl(url: string): boolean {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return /start\/(?<name>[^/]+)\/(?<rkey>[^/]+)/i.test(urlp.pathname)
    } catch {
      console.error('Unexpected error in isBskyStartUrl()', url)
    }
  }
  return false
}

/**
 * BlueskyスターターパックURLか判定
 *
 * 【URL形式】
 * https://bsky.app/starter-pack/{handle}/{rkey}
 *
 * 【スターターパックとは】
 * 新規ユーザーが特定のトピックに関するアカウントを
 * まとめてフォローできるキュレーションセット。
 *
 * @param url 判定するURL
 * @returns スターターパックURLの場合true
 */
export function isBskyStarterPackUrl(url: string): boolean {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return /starter-pack\/(?<name>[^/]+)\/(?<rkey>[^/]+)/i.test(urlp.pathname)
    } catch {
      console.error('Unexpected error in isBskyStartUrl()', url)
    }
  }
  return false
}

/**
 * BlueskyダウンロードURLか判定
 *
 * 【URL形式】
 * /download または /download?...
 * アプリのダウンロードページへのリンク。
 *
 * @param url 判定するURL
 * @returns ダウンロードURLの場合true
 */
export function isBskyDownloadUrl(url: string): boolean {
  if (isExternalUrl(url)) {
    return false
  }
  return url === '/download' || url.startsWith('/download?')
}

/**
 * Bluesky URLをアプリ内パスに変換
 *
 * 【動作】
 * - bsky.appの絶対URL → 相対パスに変換
 * - 短縮リンク → スターターパックパスに変換
 * - その他 → そのまま返す
 *
 * 【使用例】
 * 'https://bsky.app/profile/user.bsky.social' → '/profile/user.bsky.social'
 *
 * @param url 変換するURL
 * @returns アプリ内パス
 */
export function convertBskyAppUrlIfNeeded(url: string): string {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)

      if (isBskyStartUrl(url)) {
        return startUriToStarterPackUri(urlp.pathname)
      }

      // special-case search links
      if (urlp.pathname === '/search') {
        return `/search?q=${urlp.searchParams.get('q')}`
      }

      return urlp.pathname
    } catch (e) {
      console.error('Unexpected error in convertBskyAppUrlIfNeeded()', e)
    }
  } else if (isShortLink(url)) {
    // We only want to do this on native, web handles the 301 for us
    return shortLinkToHref(url)
  }
  return url
}

/**
 * リストURIをアプリ内パスに変換
 *
 * 【変換】
 * at://did:plc:xxx/app.bsky.graph.list/rkey
 * → /profile/did:plc:xxx/lists/rkey
 *
 * @param url AT Protocol リストURI
 * @returns アプリ内パス（変換失敗時は空文字）
 */
export function listUriToHref(url: string): string {
  try {
    const {hostname, rkey} = new AtUri(url)
    return `/profile/${hostname}/lists/${rkey}`
  } catch {
    return ''
  }
}

/**
 * フィードURIをアプリ内パスに変換
 *
 * 【変換】
 * at://did:plc:xxx/app.bsky.feed.generator/rkey
 * → /profile/did:plc:xxx/feed/rkey
 *
 * @param url AT Protocol フィードURI
 * @returns アプリ内パス（変換失敗時は空文字）
 */
export function feedUriToHref(url: string): string {
  try {
    const {hostname, rkey} = new AtUri(url)
    return `/profile/${hostname}/feed/${rkey}`
  } catch {
    return ''
  }
}

/**
 * 投稿URIをアプリ内相対パスに変換
 *
 * 【変換】
 * at://did:plc:xxx/app.bsky.feed.post/rkey
 * → /profile/{handle or did}/post/rkey
 *
 * @param uri AT Protocol 投稿URI
 * @param options.handle ハンドル名（DIDの代わりに使用可能）
 * @returns アプリ内パス（変換失敗時はundefined）
 */
export function postUriToRelativePath(
  uri: string,
  options?: {handle?: string},
): string | undefined {
  try {
    const {hostname, rkey} = new AtUri(uri)
    const handleOrDid =
      options?.handle && !isInvalidHandle(options.handle)
        ? options.handle
        : hostname
    return `/profile/${handleOrDid}/post/${rkey}`
  } catch {
    return undefined
  }
}

/**
 * リンクに警告が必要か判定（フィッシング対策）
 *
 * 【概要】
 * 投稿テキスト内のリンクラベルとリンク先URLが一致するかチェック。
 * 不一致の場合はユーザーに警告を表示する。
 *
 * 【フィッシング例】
 * テキスト: "Click here: google.com"
 * リンク先: "https://evil-site.com"
 * → 警告が必要（ラベルとリンク先が不一致）
 *
 * 【RFC 3986準拠】
 * ホスト名は大文字小文字を区別しないため、小文字で比較。
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-3.2.2
 *
 * @param uri リンク先URL
 * @param label 表示されるリンクテキスト
 * @returns 警告が必要な場合true
 */
export function linkRequiresWarning(uri: string, label: string) {
  const labelDomain = labelToDomain(label)

  // We should trust any relative URL or a # since we know it links to internal content
  if (isRelativeUrl(uri) || uri === '#') {
    return false
  }

  let urip
  try {
    urip = new URL(uri)
  } catch {
    return true
  }

  const host = urip.hostname.toLowerCase()
  if (isTrustedUrl(uri)) {
    // if this is a link to internal content, warn if it represents itself as a URL to another app
    return !!labelDomain && labelDomain !== host && isPossiblyAUrl(labelDomain)
  } else {
    // if this is a link to external content, warn if the label doesnt match the target
    if (!labelDomain) {
      return true
    }
    return labelDomain !== host
  }
}

/**
 * ラベル文字列からドメイン名を抽出
 *
 * 【動作】
 * 1. スペースが含まれる → URLではないと判断 → undefined
 * 2. そのままURLとしてパース可能 → ホスト名を返す
 * 3. https://を付けてパース可能 → ホスト名を返す
 * 4. 上記いずれでもない → undefined
 *
 * 【RFC 3986準拠】
 * ホスト名は大文字小文字を区別しないため、小文字で返す。
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-3.2.2
 *
 * @param label 判定するラベル文字列
 * @returns ドメイン名（小文字）またはundefined
 */
export function labelToDomain(label: string): string | undefined {
  // any spaces just immediately consider the label a non-url
  if (/\s/.test(label)) {
    return undefined
  }
  try {
    return new URL(label).hostname.toLowerCase()
  } catch {}
  try {
    return new URL('https://' + label).hostname.toLowerCase()
  } catch {}
  return undefined
}

/**
 * 文字列がURLの可能性があるか判定
 *
 * 【判定ロジック】
 * - http:// または https:// で始まる → true
 * - 最初の単語が有効なドメイン → true
 *
 * @param str 判定する文字列
 * @returns URLの可能性がある場合true
 */
export function isPossiblyAUrl(str: string): boolean {
  str = str.trim()
  if (str.startsWith('http://')) {
    return true
  }
  if (str.startsWith('https://')) {
    return true
  }
  // スペースまたは/で区切った最初の部分が有効なドメインか
  const [firstWord] = str.split(/[\s\/]/)
  return isValidDomain(firstWord)
}

/**
 * ドメイン名をサブドメインとapexドメインに分割
 *
 * 【Public Suffix List】
 * pslライブラリを使用して正確に分割。
 * 例: "www.example.co.uk" → ["www.", "example.co.uk"]
 *
 * @param hostname ホスト名
 * @returns [サブドメイン部分, apexドメイン]
 */
export function splitApexDomain(hostname: string): [string, string] {
  const hostnamep = psl.parse(hostname)
  if (hostnamep.error || !hostnamep.listed || !hostnamep.domain) {
    return ['', hostname]
  }
  return [
    hostnamep.subdomain ? `${hostnamep.subdomain}.` : '',
    hostnamep.domain,
  ]
}

/**
 * bsky.appの絶対URLを生成
 *
 * 【動作】
 * パスからホスト部分と先頭スラッシュを除去し、
 * 正規化された絶対URLを生成。
 *
 * @param path 変換するパス
 * @returns https://bsky.app/{path} 形式のURL
 */
export function createBskyAppAbsoluteUrl(path: string): string {
  const sanitizedPath = path.replace(BSKY_APP_HOST, '').replace(/^\/+/, '')
  return `${BSKY_APP_HOST.replace(/\/$/, '')}/${sanitizedPath}`
}

/**
 * プロキシURLを生成
 *
 * 【概要】
 * 外部URLをBlueskyのリダイレクトプロキシ経由に変換。
 * トラッキング防止やセキュリティ向上のため。
 *
 * 【生成形式】
 * https://go.bsky.app/redirect?u={encodedUrl}
 *
 * @param url プロキシ化するURL
 * @returns プロキシURL
 */
export function createProxiedUrl(url: string): string {
  let u
  try {
    u = new URL(url)
  } catch {
    return url
  }

  if (u?.protocol !== 'http:' && u?.protocol !== 'https:') {
    return url
  }

  return `https://go.bsky.app/redirect?u=${encodeURIComponent(url)}`
}

/**
 * 短縮リンク（go.bsky.app）か判定
 *
 * @param url 判定するURL
 * @returns 短縮リンクの場合true
 */
export function isShortLink(url: string): boolean {
  return url.startsWith('https://go.bsky.app/')
}

/**
 * 短縮リンクをアプリ内パスに変換
 *
 * 【動作】
 * go.bsky.app/{code} 形式の短縮リンクを
 * /starter-pack-short/{code} に変換。
 *
 * 【現在の対応】
 * スターターパックの短縮リンクのみ対応。
 * 将来的に他の種類も追加予定。
 *
 * @param url 短縮リンクURL
 * @returns アプリ内パス
 */
export function shortLinkToHref(url: string): string {
  try {
    const urlp = new URL(url)

    // 現在はスターターパックのみ対応。将来的に他のパスも追加予定
    const parts = urlp.pathname.split('/').filter(Boolean)
    if (parts.length === 1) {
      return `/starter-pack-short/${parts[0]}`
    }
    return url
  } catch (e) {
    logger.error('Failed to parse possible short link', {safeMessage: e})
    return url
  }
}

/**
 * URLからホスト名を抽出
 *
 * @param url 抽出元のURL
 * @returns ホスト名（パース失敗時はnull）
 */
export function getHostnameFromUrl(url: string | URL): string | null {
  let urlp
  try {
    urlp = new URL(url)
  } catch (e) {
    return null
  }
  return urlp.hostname
}

/**
 * URLからサービス認証用のオーディエンス（did:web）を取得
 *
 * 【概要】
 * AT Protocolのサービス認証で使用するDID。
 * ホスト名をdid:web形式に変換。
 *
 * 【変換例】
 * "https://bsky.social/xrpc/..." → "did:web:bsky.social"
 *
 * @param url サービスURL
 * @returns did:web:{hostname}形式のDID（失敗時はnull）
 */
export function getServiceAuthAudFromUrl(url: string | URL): string | null {
  const hostname = getHostnameFromUrl(url)
  if (!hostname) {
    return null
  }
  return `did:web:${hostname}`
}

/**
 * 確実にURLかどうかを判定
 *
 * 【判定基準】
 * 1. URL.parseでパース可能
 * 2. TLDが2文字以上のアルファベット
 * 3. 末尾が.で終わらない
 *
 * 【プロトコル補完】
 * プロトコルがない場合は https:// を自動補完。
 *
 * @param maybeUrl 判定する文字列
 * @returns 有効なURL文字列（無効な場合はnull）
 */
export function definitelyUrl(maybeUrl: string) {
  try {
    if (maybeUrl.endsWith('.')) return null

    // Prepend 'https://' if the input doesn't start with a protocol
    if (!maybeUrl.startsWith('https://') && !maybeUrl.startsWith('http://')) {
      maybeUrl = 'https://' + maybeUrl
    }

    const url = new URL(maybeUrl)

    // Extract the hostname and split it into labels
    const hostname = url.hostname
    const labels = hostname.split('.')

    // Ensure there are at least two labels (e.g., 'example' and 'com')
    if (labels.length < 2) return null

    const tld = labels[labels.length - 1]

    // Check that the TLD is at least two characters long and contains only letters
    if (!/^[a-z]{2,}$/i.test(tld)) return null

    return url.toString()
  } catch {
    return null
  }
}
