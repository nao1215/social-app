/**
 * リンク解決モジュール
 *
 * 【概要】
 * BlueskyのURLやリンクを解析し、適切な埋め込み形式に変換するモジュール。
 * 投稿作成時のリンクプレビュー生成に使用される。
 *
 * 【主な機能】
 * - Bluesky内部リンクの解決（投稿、フィード、リスト、スターターパック）
 * - 外部リンクのメタデータ取得（OGP情報、サムネイル）
 * - GIFリンクの解決（Tenor等のGIFサービス）
 * - 短縮URLの展開
 *
 * 【Goユーザー向け補足】
 * - type定義はGoのtype aliasに相当
 * - classはGoのstructにメソッドを追加したもの
 * - async/awaitはGoのgoroutineとchannelに相当する非同期処理
 */

/**
 * AT Protocol API型定義のインポート
 * AppBskyFeedDefs: フィード関連の型（投稿ビュー等）
 * AppBskyGraphDefs: ソーシャルグラフ関連の型（リスト、スターターパック等）
 * ComAtprotoRepoStrongRef: レコードへの強い参照（URI + CID）
 */
import {
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type ComAtprotoRepoStrongRef,
} from '@atproto/api'

/**
 * AtUri: AT Protocol URI パーサー
 * at://did:plc:xxx/app.bsky.feed.post/rkey 形式のURIを解析
 */
import {AtUri} from '@atproto/api'

/**
 * BskyAgent: Bluesky APIとの通信を行うエージェント
 * HTTPリクエストの送信、認証管理などを担当
 */
import {type BskyAgent} from '@atproto/api'

/**
 * POST_IMG_MAX: 投稿画像の最大サイズ制限
 * { width, height, size } の形式で定義
 */
import {POST_IMG_MAX} from '#/lib/constants'

/**
 * getLinkMeta: URLからOGPメタデータを取得する関数
 * タイトル、説明、サムネイル画像URLを抽出
 */
import {getLinkMeta} from '#/lib/link-meta/link-meta'

/**
 * resolveShortLink: 短縮URL（bsky.appの短縮リンク等）を展開
 */
import {resolveShortLink} from '#/lib/link-meta/resolve-short-link'

/**
 * downloadAndResize: 画像をダウンロードしてリサイズ
 * サムネイル生成に使用
 */
import {downloadAndResize} from '#/lib/media/manip'

/**
 * スターターパックURI操作ユーティリティ
 * createStarterPackUri: DIDとrkeyからスターターパックURIを生成
 * parseStarterPackUri: スターターパックURLをパース
 */
import {
  createStarterPackUri,
  parseStarterPackUri,
} from '#/lib/strings/starter-pack'

/**
 * URL判定ヘルパー関数群
 * 各種Bluesky URLの種類を判定する
 */
import {
  isBskyCustomFeedUrl,    // カスタムフィードURLか判定
  isBskyListUrl,          // リストURLか判定
  isBskyPostUrl,          // 投稿URLか判定
  isBskyStarterPackUrl,   // スターターパックURLか判定
  isBskyStartUrl,         // 旧形式スタートURLか判定
  isShortLink,            // 短縮リンクか判定
} from '#/lib/strings/url-helpers'

/**
 * ComposerImage: 投稿作成時の画像データ型
 * createComposerImage: 画像データからComposerImageを生成
 */
import {type ComposerImage} from '#/state/gallery'
import {createComposerImage} from '#/state/gallery'

/**
 * Gif: Tenor GIFサービスのGIFデータ型
 */
import {type Gif} from '#/state/queries/tenor'

/**
 * createGIFDescription: GIF用の代替テキストを生成
 */
import {createGIFDescription} from '../gif-alt-text'

/**
 * URL変換ユーティリティ
 * convertBskyAppUrlIfNeeded: bsky.app URLを正規化
 * makeRecordUri: AT Protocol URI を構築
 */
import {convertBskyAppUrlIfNeeded, makeRecordUri} from '../strings/url-helpers'

/**
 * 解決済み外部リンク
 *
 * 【概要】
 * Bluesky外のWebページリンクの解決結果を表す型。
 * OGPメタデータ（Open Graph Protocol）を含む。
 *
 * 【Goユーザー向け補足】
 * TypeScriptのtype定義はGoのstruct定義に相当
 */
type ResolvedExternalLink = {
  type: 'external'        // リンク種別識別子
  uri: string             // リンクURL
  title: string           // ページタイトル（OGPから取得）
  description: string     // ページ説明（OGPから取得）
  thumb: ComposerImage | undefined  // サムネイル画像（あれば）
}

/**
 * 解決済み投稿レコード
 *
 * Bluesky投稿への引用リンクの解決結果
 */
type ResolvedPostRecord = {
  type: 'record'          // レコード種別
  record: ComAtprotoRepoStrongRef.Main  // 投稿への参照（URI + CID）
  kind: 'post'            // 投稿を示す識別子
  view: AppBskyFeedDefs.PostView  // 投稿のビューデータ
}

/**
 * 解決済みフィードレコード
 *
 * カスタムフィード（フィードジェネレータ）への引用リンクの解決結果
 */
type ResolvedFeedRecord = {
  type: 'record'
  record: ComAtprotoRepoStrongRef.Main
  kind: 'feed'            // カスタムフィードを示す識別子
  view: AppBskyFeedDefs.GeneratorView  // フィードのビューデータ
}

/**
 * 解決済みリストレコード
 *
 * ユーザーリストへの引用リンクの解決結果
 */
type ResolvedListRecord = {
  type: 'record'
  record: ComAtprotoRepoStrongRef.Main
  kind: 'list'            // リストを示す識別子
  view: AppBskyGraphDefs.ListView  // リストのビューデータ
}

/**
 * 解決済みスターターパックレコード
 *
 * スターターパック（おすすめユーザーセット）への引用リンクの解決結果
 */
type ResolvedStarterPackRecord = {
  type: 'record'
  record: ComAtprotoRepoStrongRef.Main
  kind: 'starter-pack'    // スターターパックを示す識別子
  view: AppBskyGraphDefs.StarterPackView  // スターターパックのビューデータ
}

/**
 * 解決済みリンク共用体型
 *
 * 【Union Type（共用体型）について】
 * TypeScriptでは | 演算子で複数の型を「どれか一つ」として定義できる。
 * Goでは interface{} や any で表現するが、TypeScriptは型安全性を保持。
 *
 * 使用例:
 * ```typescript
 * const link: ResolvedLink = await resolveLink(agent, url)
 * if (link.type === 'external') {
 *   // link.thumb などにアクセス可能（型が絞り込まれる）
 * } else if (link.type === 'record') {
 *   // link.kind で post/feed/list/starter-pack を判別
 * }
 * ```
 */
export type ResolvedLink =
  | ResolvedExternalLink
  | ResolvedPostRecord
  | ResolvedFeedRecord
  | ResolvedListRecord
  | ResolvedStarterPackRecord

/**
 * 埋め込み無効エラー
 *
 * 【概要】
 * 投稿者が埋め込みを無効にしている投稿を引用しようとした時に発生するエラー。
 *
 * 【カスタムエラークラスについて】
 * JavaScriptではErrorクラスを継承してカスタムエラーを定義できる。
 * Goの errors.New() や fmt.Errorf() に相当するが、
 * 型として識別できる点が異なる。
 *
 * 使用例:
 * ```typescript
 * try {
 *   await resolveLink(agent, postUrl)
 * } catch (e) {
 *   if (e instanceof EmbeddingDisabledError) {
 *     // 埋め込み無効のエラーハンドリング
 *   }
 * }
 * ```
 */
export class EmbeddingDisabledError extends Error {
  constructor() {
    super('Embedding is disabled for this record')
  }
}

/**
 * リンクを解決して埋め込み用データを取得するメイン関数
 *
 * 【概要】
 * 与えられたURLの種類を判定し、適切な方法で解決して埋め込み用データを返す。
 * Bluesky内部リンク（投稿、フィード、リスト等）と外部リンクを区別して処理。
 *
 * 【処理フロー】
 * 1. 短縮リンクを展開（必要な場合）
 * 2. URLの種類を判定
 * 3. 種類に応じたAPI呼び出しでデータ取得
 * 4. 統一された形式（ResolvedLink）で返却
 *
 * 【Goユーザー向け補足】
 * async function は Go の func name() (result, error) に相当。
 * await は Go の <-channel や .Wait() に相当する同期待ち。
 *
 * @param agent Bluesky APIエージェント
 * @param uri 解決するURL
 * @returns 解決済みリンクデータ
 * @throws EmbeddingDisabledError 埋め込みが無効な投稿の場合
 */
export async function resolveLink(
  agent: BskyAgent,
  uri: string,
): Promise<ResolvedLink> {
  // 短縮リンク（bsky.app/short/xxx）を展開
  if (isShortLink(uri)) {
    uri = await resolveShortLink(uri)
  }
  // Bluesky投稿URLの場合
  if (isBskyPostUrl(uri)) {
    uri = convertBskyAppUrlIfNeeded(uri)
    const [_0, user, _1, rkey] = uri.split('/').filter(Boolean)
    const recordUri = makeRecordUri(user, 'app.bsky.feed.post', rkey)
    const post = await getPost({uri: recordUri})
    if (post.viewer?.embeddingDisabled) {
      throw new EmbeddingDisabledError()
    }
    return {
      type: 'record',
      record: {
        cid: post.cid,
        uri: post.uri,
      },
      kind: 'post',
      view: post,
    }
  }
  if (isBskyCustomFeedUrl(uri)) {
    uri = convertBskyAppUrlIfNeeded(uri)
    const [_0, handleOrDid, _1, rkey] = uri.split('/').filter(Boolean)
    const did = await fetchDid(handleOrDid)
    const feed = makeRecordUri(did, 'app.bsky.feed.generator', rkey)
    const res = await agent.app.bsky.feed.getFeedGenerator({feed})
    return {
      type: 'record',
      record: {
        uri: res.data.view.uri,
        cid: res.data.view.cid,
      },
      kind: 'feed',
      view: res.data.view,
    }
  }
  if (isBskyListUrl(uri)) {
    uri = convertBskyAppUrlIfNeeded(uri)
    const [_0, handleOrDid, _1, rkey] = uri.split('/').filter(Boolean)
    const did = await fetchDid(handleOrDid)
    const list = makeRecordUri(did, 'app.bsky.graph.list', rkey)
    const res = await agent.app.bsky.graph.getList({list})
    return {
      type: 'record',
      record: {
        uri: res.data.list.uri,
        cid: res.data.list.cid,
      },
      kind: 'list',
      view: res.data.list,
    }
  }
  if (isBskyStartUrl(uri) || isBskyStarterPackUrl(uri)) {
    const parsed = parseStarterPackUri(uri)
    if (!parsed) {
      throw new Error(
        'Unexpectedly called getStarterPackAsEmbed with a non-starterpack url',
      )
    }
    const did = await fetchDid(parsed.name)
    const starterPack = createStarterPackUri({did, rkey: parsed.rkey})
    const res = await agent.app.bsky.graph.getStarterPack({starterPack})
    return {
      type: 'record',
      record: {
        uri: res.data.starterPack.uri,
        cid: res.data.starterPack.cid,
      },
      kind: 'starter-pack',
      view: res.data.starterPack,
    }
  }
  // 上記のいずれにも該当しない場合は外部リンクとして処理
  return resolveExternal(agent, uri)

  /**
   * 投稿を取得する内部ヘルパー関数
   *
   * 【クロージャについて】
   * この関数はresolveLink内で定義されているため、外側のagent変数にアクセスできる。
   * これを「クロージャ」と呼ぶ。Goでも同様のパターンが使える。
   *
   * 【ネストされた関数定義について】
   * TypeScriptでは関数内に関数を定義できる。
   * これにより、その関数からしか使わないヘルパーをスコープ内に閉じ込められる。
   *
   * @param uri AT Protocol URI（at://did:xxx/collection/rkey）
   * @returns 投稿のビューデータ
   * @throws Error 投稿が見つからない場合
   */
  // Forked from useGetPost. TODO: move into RQ.
  async function getPost({uri}: {uri: string}) {
    const urip = new AtUri(uri)
    if (!urip.host.startsWith('did:')) {
      const res = await agent.resolveHandle({
        handle: urip.host,
      })
      urip.host = res.data.did
    }
    const res = await agent.getPosts({
      uris: [urip.toString()],
    })
    if (res.success && res.data.posts[0]) {
      return res.data.posts[0]
    }
    throw new Error('getPost: post not found')
  }

  /**
   * ハンドルまたはDIDからDIDを取得する内部ヘルパー関数
   *
   * 【DIDとハンドルについて】
   * - DID (Decentralized Identifier): 分散型識別子、例: did:plc:xxxxx
   * - ハンドル: 人間が読みやすい名前、例: alice.bsky.social
   *
   * DIDは変更されない永続的な識別子だが、ハンドルは変更可能。
   * API呼び出しには通常DIDが必要なため、ハンドルをDIDに解決する。
   *
   * @param handleOrDid ハンドルまたはDID
   * @returns DID
   */
  // Forked from useFetchDid. TODO: move into RQ.
  async function fetchDid(handleOrDid: string) {
    let identifier = handleOrDid
    // did: で始まらない場合はハンドルなのでDIDに解決
    if (!identifier.startsWith('did:')) {
      const res = await agent.resolveHandle({handle: identifier})
      identifier = res.data.did
    }
    return identifier
  }
}

/**
 * GIFを解決して埋め込み用データを取得する関数
 *
 * 【概要】
 * Tenor等のGIFサービスからのGIFデータを
 * Blueskyの外部リンク埋め込み形式に変換する。
 *
 * 【GIF埋め込みの仕組み】
 * Blueskyでは動画GIFはネイティブサポートされていないため、
 * 外部リンク（external embed）として埋め込まれる。
 * サムネイルとして静止画プレビューを使用。
 *
 * @param agent Bluesky APIエージェント
 * @param gif Tenor GIFデータ
 * @returns 解決済み外部リンクデータ
 */
export async function resolveGif(
  agent: BskyAgent,
  gif: Gif,
): Promise<ResolvedExternalLink> {
  // GIF URLにサイズ情報をクエリパラメータとして追加
  // hh=高さ, ww=幅（表示時のレイアウト計算に使用）
  const uri = `${gif.media_formats.gif.url}?hh=${gif.media_formats.gif.dims[1]}&ww=${gif.media_formats.gif.dims[0]}`
  return {
    type: 'external',
    uri,
    title: gif.content_description,  // GIFの説明文（アクセシビリティ用）
    description: createGIFDescription(gif.content_description),
    thumb: await imageToThumb(gif.media_formats.preview.url),  // 静止画プレビュー
  }
}

/**
 * 外部URLを解決してメタデータを取得する内部関数
 *
 * 【OGP (Open Graph Protocol) について】
 * Webページのメタデータを取得する標準規格。
 * <meta property="og:title" content="..." /> 等のタグから情報を抽出。
 * SNSでのリンクプレビュー表示に広く使用されている。
 *
 * @param agent Bluesky APIエージェント
 * @param uri 解決するURL
 * @returns 解決済み外部リンクデータ
 */
async function resolveExternal(
  agent: BskyAgent,
  uri: string,
): Promise<ResolvedExternalLink> {
  // URLからOGPメタデータを取得
  const result = await getLinkMeta(agent, uri)
  return {
    type: 'external',
    uri: result.url,
    title: result.title ?? '',
    description: result.description ?? '',
    // サムネイル画像があればダウンロードしてリサイズ
    thumb: result.image ? await imageToThumb(result.image) : undefined,
  }
}

/**
 * 画像URLからサムネイルを生成する関数
 *
 * 【概要】
 * 外部の画像URLから画像をダウンロードし、
 * Blueskyの投稿サイズ制限に合わせてリサイズする。
 *
 * 【エラーハンドリング】
 * 画像のダウンロードやリサイズに失敗した場合、
 * エラーをスローせずundefinedを返す（サムネイルなしで続行）。
 *
 * 【Goユーザー向け補足】
 * try-catch {} で例外を握りつぶすパターンは
 * Go の if err != nil { return nil } に相当。
 *
 * @param imageUri 画像のURL
 * @returns ComposerImage または undefined
 */
export async function imageToThumb(
  imageUri: string,
): Promise<ComposerImage | undefined> {
  try {
    // 画像をダウンロードしてリサイズ
    const img = await downloadAndResize({
      uri: imageUri,
      width: POST_IMG_MAX.width,     // 最大幅
      height: POST_IMG_MAX.height,   // 最大高さ
      mode: 'contain',               // アスペクト比を維持してフィット
      maxSize: POST_IMG_MAX.size,    // 最大ファイルサイズ（バイト）
      timeout: 15e3,                 // タイムアウト15秒（15e3 = 15000ms）
    })
    if (img) {
      // ComposerImage形式に変換
      return await createComposerImage(img)
    }
  } catch {}
  // 失敗した場合はundefined（サムネイルなし）
}
