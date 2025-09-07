// AT Protocol API の型定義とクラス / AT Protocol API types and classes
import {
  type $Typed,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  type AppBskyFeedPostgate,
  AtUri,
} from '@atproto/api'

// 投稿ゲートコレクションの定数 / Postgate collection constant
export const POSTGATE_COLLECTION = 'app.bsky.feed.postgate'

/**
 * 投稿ゲートレコードを作成する
 * Creates a postgate record
 * 
 * @param postgate - 部分的な投稿ゲートレコード / Partial postgate record
 * @returns 完全な投稿ゲートレコード / Complete postgate record
 */
export function createPostgateRecord(
  postgate: Partial<AppBskyFeedPostgate.Record> & {
    post: AppBskyFeedPostgate.Record['post']
  },
): AppBskyFeedPostgate.Record {
  return {
    $type: POSTGATE_COLLECTION, // コレクションタイプ / Collection type
    createdAt: new Date().toISOString(), // 作成日時 / Creation date
    post: postgate.post, // 対象投稿 / Target post
    detachedEmbeddingUris: postgate.detachedEmbeddingUris || [], // 切り離しされた埋め込み URI / Detached embedding URIs
    embeddingRules: postgate.embeddingRules || [], // 埋め込みルール / Embedding rules
  }
}

/**
 * 投稿ゲートレコードをマージする
 * Merges postgate records
 * 
 * @param prev - 既存のレコード / Previous record
 * @param next - マージする部分的レコード / Partial record to merge
 * @returns マージされたレコード / Merged record
 */
export function mergePostgateRecords(
  prev: AppBskyFeedPostgate.Record,
  next: Partial<AppBskyFeedPostgate.Record>,
) {
  // 切り離し埋め込みURIを結合（重複を除去） / Combine detached embedding URIs (remove duplicates)
  const detachedEmbeddingUris = Array.from(
    new Set([
      ...(prev.detachedEmbeddingUris || []),
      ...(next.detachedEmbeddingUris || []),
    ]),
  )
  // 埋め込みルールを結合（同じタイプの重複を除去） / Combine embedding rules (remove duplicates of same type)
  const embeddingRules = [
    ...(prev.embeddingRules || []),
    ...(next.embeddingRules || []),
  ].filter(
    (rule, i, all) => all.findIndex(_rule => _rule.$type === rule.$type) === i,
  )
  // マージされたレコードを作成 / Create merged record
  return createPostgateRecord({
    post: prev.post,
    detachedEmbeddingUris,
    embeddingRules,
  })
}

/**
 * 切り離しされた埋め込みレコードビューを作成する
 * Creates a detached embed record view
 * 
 * @param uri - 切り離しされたレコードのURI / URI of the detached record
 * @returns 切り離し埋め込みビュー / Detached embed view
 */
export function createEmbedViewDetachedRecord({
  uri,
}: {
  uri: string
}): $Typed<AppBskyEmbedRecord.View> {
  // 切り離しビューレコードを作成 / Create detached view record
  const record: $Typed<AppBskyEmbedRecord.ViewDetached> = {
    $type: 'app.bsky.embed.record#viewDetached',
    uri,
    detached: true,
  }
  return {
    $type: 'app.bsky.embed.record#view',
    record,
  }
}

/**
 * 切り離し状態に応じた引用埋め込みを作成する
 * Creates a quote embed based on detachment state
 */
export function createMaybeDetachedQuoteEmbed({
  post,
  quote,
  quoteUri,
  detached,
}:
  | {
      post: AppBskyFeedDefs.PostView
      quote: AppBskyFeedDefs.PostView
      quoteUri: undefined
      detached: false
    }
  | {
      post: AppBskyFeedDefs.PostView
      quote: undefined
      quoteUri: string
      detached: true
    }): AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined {
  // 単純なレコード埋め込みの場合 / For simple record embed
  if (AppBskyEmbedRecord.isView(post.embed)) {
    if (detached) {
      // 切り離しビューを作成 / Create detached view
      return createEmbedViewDetachedRecord({uri: quoteUri})
    } else {
      // 通常のレコードビューを作成 / Create normal record view
      return createEmbedRecordView({post: quote})
    }
  } else if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
    // メディア付きレコード埋め込みの場合 / For record with media embed
    if (detached) {
      // メディア部分は維持し、レコード部分を切り離し / Keep media, detach record part
      return {
        ...post.embed,
        record: createEmbedViewDetachedRecord({uri: quoteUri}),
      }
    } else {
      // メディア付きレコードビューを作成 / Create record with media view
      return createEmbedRecordWithMediaView({post, quote})
    }
  }
}

/**
 * 投稿から埋め込みビューレコードを作成する
 * Creates an embed view record from a post
 */
export function createEmbedViewRecordFromPost(
  post: AppBskyFeedDefs.PostView,
): $Typed<AppBskyEmbedRecord.ViewRecord> {
  return {
    $type: 'app.bsky.embed.record#viewRecord', // ビューレコードタイプ / View record type
    uri: post.uri, // 投稿URI / Post URI
    cid: post.cid, // コンテントID / Content ID
    author: post.author, // 投稿者 / Author
    value: post.record, // 投稿データ / Post data
    labels: post.labels, // ラベル / Labels
    replyCount: post.replyCount, // 返信数 / Reply count
    repostCount: post.repostCount, // リポスト数 / Repost count
    likeCount: post.likeCount, // いいね数 / Like count
    quoteCount: post.quoteCount, // 引用数 / Quote count
    indexedAt: post.indexedAt, // インデックス日時 / Indexed date
    embeds: post.embed ? [post.embed] : [], // 埋め込み / Embeds
  }
}

/**
 * レコード埋め込みビューを作成する
 * Creates a record embed view
 */
export function createEmbedRecordView({
  post,
}: {
  post: AppBskyFeedDefs.PostView
}): AppBskyEmbedRecord.View {
  return {
    $type: 'app.bsky.embed.record#view',
    record: createEmbedViewRecordFromPost(post),
  }
}

/**
 * メディア付きレコード埋め込みビューを作成する
 * Creates a record with media embed view
 */
export function createEmbedRecordWithMediaView({
  post,
  quote,
}: {
  post: AppBskyFeedDefs.PostView
  quote: AppBskyFeedDefs.PostView
}): AppBskyEmbedRecordWithMedia.View | undefined {
  // メディア付きレコードビューでない場合は終了 / Exit if not a record with media view
  if (!AppBskyEmbedRecordWithMedia.isView(post.embed)) return
  return {
    ...(post.embed || {}), // 既存のメディア情報を保持 / Keep existing media info
    record: {
      record: createEmbedViewRecordFromPost(quote), // 引用投稿をレコードとして設定 / Set quote post as record
    },
  }
}

/**
 * 切り離し可能な引用埋め込み情報を取得する
 * Gets information about potentially detached quote embeds
 * 
 * @param viewerDid - 閲覧者のDID / Viewer's DID
 * @param post - 投稿データ / Post data
 * @returns 引用情報またはundefined / Quote info or undefined
 */
export function getMaybeDetachedQuoteEmbed({
  viewerDid,
  post,
}: {
  viewerDid: string
  post: AppBskyFeedDefs.PostView
}) {
  // 単純なレコード埋め込みの場合 / For simple record embed
  if (AppBskyEmbedRecord.isView(post.embed)) {
    // 切り離しされたレコード / Detached record
    if (AppBskyEmbedRecord.isViewDetached(post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid, // 閲覧者が所有者か / Is owned by viewer
        isDetached: true, // 切り離しされている / Is detached
      }
    }

    // 通常の投稿レコード / Normal post record
    if (AppBskyEmbedRecord.isViewRecord(post.embed.record)) {
      const urip = new AtUri(post.embed.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid, // 閲覧者が所有者か / Is owned by viewer
        isDetached: false, // 接続されている / Is attached
      }
    }
  } else if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
    // メディア付きレコード埋め込みの場合 / For record with media embed
    // 切り離しされたレコード / Detached record
    if (AppBskyEmbedRecord.isViewDetached(post.embed.record.record)) {
      const urip = new AtUri(post.embed.record.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid, // 閲覧者が所有者か / Is owned by viewer
        isDetached: true, // 切り離しされている / Is detached
      }
    }

    // 通常の投稿レコード / Normal post record
    if (AppBskyEmbedRecord.isViewRecord(post.embed.record.record)) {
      const urip = new AtUri(post.embed.record.record.uri)
      return {
        embed: post.embed,
        uri: urip.toString(),
        isOwnedByViewer: urip.host === viewerDid, // 閲覧者が所有者か / Is owned by viewer
        isDetached: false, // 接続されている / Is attached
      }
    }
  }
}

/**
 * 埋め込みルールの定義
 * Embedding rules definitions
 */
export const embeddingRules = {
  disableRule: {$type: 'app.bsky.feed.postgate#disableRule'}, // 無効化ルール / Disable rule
}
