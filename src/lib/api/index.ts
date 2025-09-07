// AT Protocol APIの型定義とユーティリティをインポート
// Import AT Protocol API type definitions and utilities
import {
  type $Typed, // 型付きオブジェクト / Typed object
  type AppBskyEmbedExternal, // 外部リンク埋め込みの型 / External link embed type
  type AppBskyEmbedImages, // 画像埋め込みの型 / Image embed type
  type AppBskyEmbedRecord, // レコード埋め込みの型 / Record embed type
  type AppBskyEmbedRecordWithMedia, // メディア付きレコード埋め込みの型 / Record with media embed type
  type AppBskyEmbedVideo, // 動画埋め込みの型 / Video embed type
  type AppBskyFeedPost, // 投稿レコードの型 / Post record type
  AtUri, // AT Protocol URIクラス / AT Protocol URI class
  BlobRef, // Blob参照クラス / Blob reference class
  type BskyAgent, // Bluesky APIエージェントの型 / Bluesky API agent type
  type ComAtprotoLabelDefs, // ラベル定義の型 / Label definitions type
  type ComAtprotoRepoApplyWrites, // リポジトリ書き込みの型 / Repository write operations type
  type ComAtprotoRepoStrongRef, // 強い参照の型 / Strong reference type
  RichText, // リッチテキストクラス / RichText class
} from '@atproto/api'
// 時間ベースのIDジェネレータをインポート
// Import time-based ID generator
import {TID} from '@atproto/common-web'
// DAG-CBORエンコーディングライブラリをインポート
// Import DAG-CBOR encoding library
import * as dcbor from '@ipld/dag-cbor'
// 国際化ライブラリのマクロをインポート
// Import internationalization library macro
import {t} from '@lingui/macro'
// React Queryのクエリクライアント型をインポート
// Import React Query client type
import {type QueryClient} from '@tanstack/react-query'
// SHA-256ハッシュライブラリをインポート
// Import SHA-256 hash library
import {sha256} from 'js-sha256'
// IPFS CIDライブラリをインポート
// Import IPFS CID library
import {CID} from 'multiformats/cid'
// ハッシュ機能をインポート
// Import hash functionality
import * as Hasher from 'multiformats/hashes/hasher'

// ネットワークエラー検出ユーティリティをインポート
// Import network error detection utility
import {isNetworkError} from '#/lib/strings/errors'
// リッチテキスト操作ユーティリティをインポート
// Import rich text manipulation utilities
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
// ロガーをインポート
// Import logger
import {logger} from '#/logger'
// 画像圧縮機能をインポート
// Import image compression functionality
import {compressImage} from '#/state/gallery'
// リンク解決クエリ関数をインポート
// Import link resolution query functions
import {
  fetchResolveGifQuery, // GIF解決クエリ / GIF resolution query
  fetchResolveLinkQuery, // リンク解決クエリ / Link resolution query
} from '#/state/queries/resolve-link'
// スレッドゲート関連機能をインポート
// Import thread gate related functionality
import {
  createThreadgateRecord, // スレッドゲートレコード作成 / Create thread gate record
  threadgateAllowUISettingToAllowRecordValue, // UI設定をレコード値に変換 / Convert UI setting to record value
} from '#/state/queries/threadgate'
// コンポーザーの状態型定義をインポート
// Import composer state type definitions
import {
  type EmbedDraft, // 埋め込み下書きの型 / Embed draft type
  type PostDraft, // 投稿下書きの型 / Post draft type
  type ThreadDraft, // スレッド下書きの型 / Thread draft type
} from '#/view/com/composer/state/composer'
// GIF代替テキスト作成機能をインポート
// Import GIF alternative text creation functionality
import {createGIFDescription} from '../gif-alt-text'
// Blobアップロード機能をインポート
// Import blob upload functionality
import {uploadBlob} from './upload-blob'

// Blobアップロード機能を再エクスポート
// Re-export blob upload functionality
export {uploadBlob}

// 投稿オプションのインターフェース
// Interface for post options
interface PostOpts {
  thread: ThreadDraft // 投稿するスレッドの下書き / Thread draft to post
  replyTo?: string // 返信先のURI（オプション） / Reply target URI (optional)
  onStateChange?: (state: string) => void // 状態変更コールバック / State change callback
  langs?: string[] // 投稿の言語コード配列 / Array of language codes for the post
}

/**
 * Blueskyに投稿を送信するメイン関数
 * Main function to send posts to Bluesky
 * @param agent Bluesky APIエージェント / Bluesky API agent
 * @param queryClient React Queryクライアント / React Query client
 * @param opts 投稿オプション / Post options
 * @returns 投稿されたポストのURI配列 / Array of posted post URIs
 */
export async function post(
  agent: BskyAgent,
  queryClient: QueryClient,
  opts: PostOpts,
) {
  const thread = opts.thread // 投稿するスレッド / Thread to post
  // 処理開始を通知
  // Notify processing start
  opts.onStateChange?.(t`Processing...`)

  // 返信情報を非同期で解決（ウォーターフォールを避けるため）
  // Resolve reply information asynchronously (to avoid waterfall)
  let replyPromise:
    | Promise<AppBskyFeedPost.Record['reply']>
    | AppBskyFeedPost.Record['reply']
    | undefined
  if (opts.replyTo) {
    // awaitしないことでウォーターフォールを避ける
    // Not awaited to avoid waterfalls.
    replyPromise = resolveReply(agent, opts.replyTo)
  }

  // 言語が指定されている場合、ユーザーの設定から上位3言語を追加
  // add top 3 languages from user preferences if langs is provided
  let langs = opts.langs
  if (opts.langs) {
    // 最大3言語までに制限
    // Limit to top 3 languages
    langs = opts.langs.slice(0, 3)
  }

  const did = agent.assertDid
  const writes: $Typed<ComAtprotoRepoApplyWrites.Create>[] = []
  const uris: string[] = []

  let now = new Date()
  let tid: TID | undefined

  for (let i = 0; i < thread.posts.length; i++) {
    const draft = thread.posts[i]

    // Not awaited to avoid waterfalls.
    const rtPromise = resolveRT(agent, draft.richtext)
    const embedPromise = resolveEmbed(
      agent,
      queryClient,
      draft,
      opts.onStateChange,
    )
    let labels: $Typed<ComAtprotoLabelDefs.SelfLabels> | undefined
    if (draft.labels.length) {
      labels = {
        $type: 'com.atproto.label.defs#selfLabels',
        values: draft.labels.map(val => ({val})),
      }
    }

    // The sorting behavior for multiple posts sharing the same createdAt time is
    // undefined, so what we'll do here is increment the time by 1 for every post
    now.setMilliseconds(now.getMilliseconds() + 1)
    tid = TID.next(tid)
    const rkey = tid.toString()
    const uri = `at://${did}/app.bsky.feed.post/${rkey}`
    uris.push(uri)

    const rt = await rtPromise
    const embed = await embedPromise
    const reply = await replyPromise
    const record: AppBskyFeedPost.Record = {
      // IMPORTANT: $type has to exist, CID is calculated with the `$type` field
      // present and will produce the wrong CID if you omit it.
      $type: 'app.bsky.feed.post',
      createdAt: now.toISOString(),
      text: rt.text,
      facets: rt.facets,
      reply,
      embed,
      langs,
      labels,
    }
    writes.push({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: 'app.bsky.feed.post',
      rkey: rkey,
      value: record,
    })

    if (i === 0 && thread.threadgate.some(tg => tg.type !== 'everybody')) {
      writes.push({
        $type: 'com.atproto.repo.applyWrites#create',
        collection: 'app.bsky.feed.threadgate',
        rkey: rkey,
        value: createThreadgateRecord({
          createdAt: now.toISOString(),
          post: uri,
          allow: threadgateAllowUISettingToAllowRecordValue(thread.threadgate),
        }),
      })
    }

    if (
      thread.postgate.embeddingRules?.length ||
      thread.postgate.detachedEmbeddingUris?.length
    ) {
      writes.push({
        $type: 'com.atproto.repo.applyWrites#create',
        collection: 'app.bsky.feed.postgate',
        rkey: rkey,
        value: {
          ...thread.postgate,
          $type: 'app.bsky.feed.postgate',
          createdAt: now.toISOString(),
          post: uri,
        },
      })
    }

    // Prepare a ref to the current post for the next post in the thread.
    const ref = {
      cid: await computeCid(record),
      uri,
    }
    replyPromise = {
      root: reply?.root ?? ref,
      parent: ref,
    }
  }

  try {
    await agent.com.atproto.repo.applyWrites({
      repo: agent.assertDid,
      writes: writes,
      validate: true,
    })
  } catch (e: any) {
    logger.error(`Failed to create post`, {
      safeMessage: e.message,
    })
    if (isNetworkError(e)) {
      throw new Error(
        t`Post failed to upload. Please check your Internet connection and try again.`,
      )
    } else {
      throw e
    }
  }

  return {uris}
}

/**
 * リッチテキストを解決して投稿用に整形する関数
 * Function to resolve and format rich text for posting
 * @param agent Bluesky APIエージェント / Bluesky API agent
 * @param richtext 解決するリッチテキスト / Rich text to resolve
 * @returns 解決されたリッチテキスト / Resolved rich text
 */
async function resolveRT(agent: BskyAgent, richtext: RichText) {
  // テキストの整形（先頭の空行と末尾の空白を除去）
  // Format text (remove leading empty lines and trailing whitespace)
  const trimmedText = richtext.text
    // 先頭の空白のみの行を削除（ただしASCIIアートは壊さない）
    // Trim leading whitespace-only lines (but don't break ASCII art).
    .replace(/^(\s*\n)+/, '')
    // 末尾の空白を削除
    // Trim any trailing whitespace.
    .trimEnd()
  
  // 新しいリッチテキストオブジェクトを作成
  // Create new RichText object
  let rt = new RichText({text: trimmedText}, {cleanNewlines: true})
  // ファセット（メンション、リンクなど）を検出
  // Detect facets (mentions, links, etc.)
  await rt.detectFacets(agent)

  // リンクを短縮し、無効なメンションを除去
  // Shorten links and remove invalid mentions
  rt = shortenLinks(rt)
  rt = stripInvalidMentions(rt)
  return rt
}

/**
 * 返信情報を解決する関数
 * Function to resolve reply information
 * @param agent Bluesky APIエージェント / Bluesky API agent
 * @param replyTo 返信先のURI / Reply target URI
 * @returns 返信情報（ルートと親投稿） / Reply information (root and parent)
 */
async function resolveReply(agent: BskyAgent, replyTo: string) {
  // URIをパースしてリポジトリとレコードキーを取得
  // Parse URI to get repository and record key
  const replyToUrip = new AtUri(replyTo)
  // 返信先の投稿を取得
  // Get the post to reply to
  const parentPost = await agent.getPost({
    repo: replyToUrip.host, // リポジトリ（ユーザーDID） / Repository (user DID)
    rkey: replyToUrip.rkey, // レコードキー / Record key
  })
  if (parentPost) {
    // 親投稿の参照情報を作成
    // Create parent post reference information
    const parentRef = {
      uri: parentPost.uri, // 投稿のURI / Post URI
      cid: parentPost.cid, // 投稿のCID / Post CID
    }
    return {
      root: parentPost.value.reply?.root || parentRef, // スレッドのルート / Thread root
      parent: parentRef, // 直接の親投稿 / Direct parent post
    }
  }
}

async function resolveEmbed(
  agent: BskyAgent,
  queryClient: QueryClient,
  draft: PostDraft,
  onStateChange: ((state: string) => void) | undefined,
): Promise<
  | $Typed<AppBskyEmbedImages.Main>
  | $Typed<AppBskyEmbedVideo.Main>
  | $Typed<AppBskyEmbedExternal.Main>
  | $Typed<AppBskyEmbedRecord.Main>
  | $Typed<AppBskyEmbedRecordWithMedia.Main>
  | undefined
> {
  if (draft.embed.quote) {
    const [resolvedMedia, resolvedQuote] = await Promise.all([
      resolveMedia(agent, queryClient, draft.embed, onStateChange),
      resolveRecord(agent, queryClient, draft.embed.quote.uri),
    ])
    if (resolvedMedia) {
      return {
        $type: 'app.bsky.embed.recordWithMedia',
        record: {
          $type: 'app.bsky.embed.record',
          record: resolvedQuote,
        },
        media: resolvedMedia,
      }
    }
    return {
      $type: 'app.bsky.embed.record',
      record: resolvedQuote,
    }
  }
  const resolvedMedia = await resolveMedia(
    agent,
    queryClient,
    draft.embed,
    onStateChange,
  )
  if (resolvedMedia) {
    return resolvedMedia
  }
  if (draft.embed.link) {
    const resolvedLink = await fetchResolveLinkQuery(
      queryClient,
      agent,
      draft.embed.link.uri,
    )
    if (resolvedLink.type === 'record') {
      return {
        $type: 'app.bsky.embed.record',
        record: resolvedLink.record,
      }
    }
  }
  return undefined
}

async function resolveMedia(
  agent: BskyAgent,
  queryClient: QueryClient,
  embedDraft: EmbedDraft,
  onStateChange: ((state: string) => void) | undefined,
): Promise<
  | $Typed<AppBskyEmbedExternal.Main>
  | $Typed<AppBskyEmbedImages.Main>
  | $Typed<AppBskyEmbedVideo.Main>
  | undefined
> {
  if (embedDraft.media?.type === 'images') {
    const imagesDraft = embedDraft.media.images
    logger.debug(`Uploading images`, {
      count: imagesDraft.length,
    })
    onStateChange?.(t`Uploading images...`)
    const images: AppBskyEmbedImages.Image[] = await Promise.all(
      imagesDraft.map(async (image, i) => {
        logger.debug(`Compressing image #${i}`)
        const {path, width, height, mime} = await compressImage(image)
        logger.debug(`Uploading image #${i}`)
        const res = await uploadBlob(agent, path, mime)
        return {
          image: res.data.blob,
          alt: image.alt,
          aspectRatio: {width, height},
        }
      }),
    )
    return {
      $type: 'app.bsky.embed.images',
      images,
    }
  }
  if (
    embedDraft.media?.type === 'video' &&
    embedDraft.media.video.status === 'done'
  ) {
    const videoDraft = embedDraft.media.video
    const captions = await Promise.all(
      videoDraft.captions
        .filter(caption => caption.lang !== '')
        .map(async caption => {
          const {data} = await agent.uploadBlob(caption.file, {
            encoding: 'text/vtt',
          })
          return {lang: caption.lang, file: data.blob}
        }),
    )

    // lexicon numbers must be floats
    const width = Math.round(videoDraft.asset.width)
    const height = Math.round(videoDraft.asset.height)

    // aspect ratio values must be >0 - better to leave as unset otherwise
    // posting will fail if aspect ratio is set to 0
    const aspectRatio = width > 0 && height > 0 ? {width, height} : undefined

    if (!aspectRatio) {
      logger.error(
        `Invalid aspect ratio - got { width: ${videoDraft.asset.width}, height: ${videoDraft.asset.height} }`,
      )
    }

    return {
      $type: 'app.bsky.embed.video',
      video: videoDraft.pendingPublish.blobRef,
      alt: videoDraft.altText || undefined,
      captions: captions.length === 0 ? undefined : captions,
      aspectRatio,
    }
  }
  if (embedDraft.media?.type === 'gif') {
    const gifDraft = embedDraft.media
    const resolvedGif = await fetchResolveGifQuery(
      queryClient,
      agent,
      gifDraft.gif,
    )
    let blob: BlobRef | undefined
    if (resolvedGif.thumb) {
      onStateChange?.(t`Uploading link thumbnail...`)
      const {path, mime} = resolvedGif.thumb.source
      const response = await uploadBlob(agent, path, mime)
      blob = response.data.blob
    }
    return {
      $type: 'app.bsky.embed.external',
      external: {
        uri: resolvedGif.uri,
        title: resolvedGif.title,
        description: createGIFDescription(resolvedGif.title, gifDraft.alt),
        thumb: blob,
      },
    }
  }
  if (embedDraft.link) {
    const resolvedLink = await fetchResolveLinkQuery(
      queryClient,
      agent,
      embedDraft.link.uri,
    )
    if (resolvedLink.type === 'external') {
      let blob: BlobRef | undefined
      if (resolvedLink.thumb) {
        onStateChange?.(t`Uploading link thumbnail...`)
        const {path, mime} = resolvedLink.thumb.source
        const response = await uploadBlob(agent, path, mime)
        blob = response.data.blob
      }
      return {
        $type: 'app.bsky.embed.external',
        external: {
          uri: resolvedLink.uri,
          title: resolvedLink.title,
          description: resolvedLink.description,
          thumb: blob,
        },
      }
    }
  }
  return undefined
}

async function resolveRecord(
  agent: BskyAgent,
  queryClient: QueryClient,
  uri: string,
): Promise<ComAtprotoRepoStrongRef.Main> {
  const resolvedLink = await fetchResolveLinkQuery(queryClient, agent, uri)
  if (resolvedLink.type !== 'record') {
    throw Error(t`Expected uri to resolve to a record`)
  }
  return resolvedLink.record
}

// multiformatsの組み込みハッシュ関数（`multiformats/hashes/sha2`）は
Node.js用なので、これはクロスプラットフォーム対応版である
// The built-in hashing functions from multiformats (`multiformats/hashes/sha2`)
// are meant for Node.js, this is the cross-platform equivalent.
// クロスプラットフォーム対応のSHA-256ハッシュ関数
// Cross-platform SHA-256 hash function
const mf_sha256 = Hasher.from({
  name: 'sha2-256', // ハッシュアルゴリズム名 / Hash algorithm name
  code: 0x12, // Multihashコード / Multihash code
  encode: input => {
    // 入力データをSHA-256でハッシュ化
    // Hash input data with SHA-256
    const digest = sha256.arrayBuffer(input)
    return new Uint8Array(digest)
  },
})

/**
 * 投稿レコードのCID（Content Identifier）を計算する関数
 * Function to compute CID (Content Identifier) for a post record
 * @param record 投稿レコード / Post record
 * @returns CID文字列 / CID string
 */
async function computeCid(record: AppBskyFeedPost.Record): Promise<string> {
  // 重要：`prepareForHashing`はレコードをハッシュ化用に準備し、
  // undefined値のフィールドを除去し、BlobRefインスタンスを正しいIPLD表現に変換する
  // IMPORTANT: `prepareObject` prepares the record to be hashed by removing
  // fields with undefined value, and converting BlobRef instances to the
  // right IPLD representation.
  const prepared = prepareForHashing(record)
  
  // 1. レコードをDAG-CBOR形式にエンコード
  // 1. Encode the record into DAG-CBOR format
  const encoded = dcbor.encode(prepared)
  
  // 2. レコードをSHA-256でハッシュ化（コード 0x12）
  // 2. Hash the record in SHA-256 (code 0x12)
  const digest = await mf_sha256.digest(encoded)
  
  // 3. DAG-CBORをコンテンツとして指定してCIDv1を作成（コード 0x71）
  // 3. Create a CIDv1, specifying DAG-CBOR as content (code 0x71)
  const cid = CID.createV1(0x71, digest)
  
  // 4. CIDのBase32表現を取得（`b`プレフィクス）
  // 4. Get the Base32 representation of the CID (`b` prefix)
  return cid.toString()
}

// Returns a transformed version of the object for use in DAG-CBOR.
function prepareForHashing(v: any): any {
  // IMPORTANT: BlobRef#ipld() returns the correct object we need for hashing,
  // the API client will convert this for you but we're hashing in the client,
  // so we need it *now*.
  if (v instanceof BlobRef) {
    return v.ipld()
  }

  // Walk through arrays
  if (Array.isArray(v)) {
    let pure = true
    const mapped = v.map(value => {
      if (value !== (value = prepareForHashing(value))) {
        pure = false
      }
      return value
    })
    return pure ? v : mapped
  }

  // Walk through plain objects
  if (isPlainObject(v)) {
    const obj: any = {}
    let pure = true
    for (const key in v) {
      let value = v[key]
      // `value` is undefined
      if (value === undefined) {
        pure = false
        continue
      }
      // `prepareObject` returned a value that's different from what we had before
      if (value !== (value = prepareForHashing(value))) {
        pure = false
      }
      obj[key] = value
    }
    // Return as is if we haven't needed to tamper with anything
    return pure ? v : obj
  }
  return v
}

function isPlainObject(v: any): boolean {
  if (typeof v !== 'object' || v === null) {
    return false
  }
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}
