// React Hooksのインポート - 状態管理とエフェクト処理
import {useEffect, useMemo, useState} from 'react'
// AT Protocol APIの型定義 - Blueskyの投稿とエンベッド機能
import {
  AppBskyEmbedRecord,        // レコードエンベッドタイプ
  AppBskyEmbedRecordWithMedia, // メディア付きレコードエンベッドタイプ
  type AppBskyFeedDefs,      // フィード定義の型
} from '@atproto/api'
// TanStack React Queryのクライアント型 - キャッシュクライアント
import {type QueryClient} from '@tanstack/react-query'
// イベントエミッター - 投稿の変更を通知するために使用
import EventEmitter from 'eventemitter3'

// バッチ更新ユーティリティ - パフォーマンス最適化のための一括更新
import {batchedUpdates} from '#/lib/batchedUpdates'
// 各種クエリデータから投稿を検索するためのユーティリティ関数群
import {findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData} from '#/state/queries/explore-feed-previews' // 探索フィードプレビューから投稿検索
import {findAllPostsInQueryData as findAllPostsInNotifsQueryData} from '#/state/queries/notifications/feed'             // 通知フィードから投稿検索
import {findAllPostsInQueryData as findAllPostsInFeedQueryData} from '#/state/queries/post-feed'                        // 投稿フィードから投稿検索
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '#/state/queries/post-quotes'                     // 引用投稿から投稿検索
import {findAllPostsInQueryData as findAllPostsInThreadQueryData} from '#/state/queries/post-thread'                   // スレッドから投稿検索
import {findAllPostsInQueryData as findAllPostsInSearchQueryData} from '#/state/queries/search-posts'                  // 検索結果から投稿検索
import {findAllPostsInQueryData as findAllPostsInThreadV2QueryData} from '#/state/queries/usePostThread/queryCache'    // スレッドV2から投稿検索
// シャドウ型とキャスト関数のインポート - キャッシュシステムの型安全性確保
import {castAsShadow, type Shadow} from './types'
export type {Shadow} from './types'

/**
 * 投稿シャドウデータの型定義
 * サーバーから受信した投稿データに対するクライアント側の一時的な状態変更を表現
 * UI上の即座な反応のため、サーバー反映前に楽観的更新として使用
 */
export interface PostShadow {
  likeUri: string | undefined              // いいねのURI（いいね済みの場合）
  repostUri: string | undefined            // リポストのURI（リポスト済みの場合）
  isDeleted: boolean                       // 削除フラグ（削除済みの場合true）
  embed: AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined // エンベッドコンテンツ
  pinned: boolean                          // ピン留めフラグ
  optimisticReplyCount: number | undefined // 楽観的リプライ数（実際の数値が反映される前の一時的な数値）
  bookmarked: boolean | undefined          // ブックマークフラグ
}

// 削除された投稿を表すトゥームストーンシンボル
export const POST_TOMBSTONE = Symbol('PostTombstone')

// 投稿の変更を通知するためのグローバルイベントエミッター
const emitter = new EventEmitter()

// 投稿とそのシャドウデータのマッピング（WeakMapで自動ガベージコレクション対応）
const shadows: WeakMap<
  AppBskyFeedDefs.PostView, // 元の投稿データ
  Partial<PostShadow>       // 部分的なシャドウデータ
> = new WeakMap()

/**
 * 危険な操作：投稿の生のシャドウデータを取得
 * 注意して使用してください！この関数は投稿の生のシャドウデータを返します。
 * 通常は `usePostShadow` を使用することを推奨します。
 * Use with caution! This function returns the raw shadow data for a post.
 * Prefer using `usePostShadow`.
 * @param post 対象の投稿データ
 * @returns 投稿に関連付けられたシャドウデータ（存在しない場合はundefined）
 */
export function dangerousGetPostShadow(post: AppBskyFeedDefs.PostView) {
  return shadows.get(post)
}

/**
 * 投稿シャドウフック - 投稿データとそのシャドウ状態を統合
 * サーバーデータとクライアント側の一時的な変更を組み合わせて表示用データを作成
 * @param post 元の投稿データ
 * @returns シャドウ状態が統合された投稿データ、または削除された投稿のトゥームストーン
 */
export function usePostShadow(
  post: AppBskyFeedDefs.PostView,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  // 投稿のシャドウデータの状態管理
  const [shadow, setShadow] = useState(() => shadows.get(post))
  // 前回の投稿参照を追跡（投稿が変更された際の処理のため）
  const [prevPost, setPrevPost] = useState(post)
  
  // 投稿が変更された場合のシャドウデータ更新
  if (post !== prevPost) {
    setPrevPost(post)
    setShadow(shadows.get(post)) // 新しい投稿のシャドウデータを取得
  }

  // 投稿の変更通知を監視するエフェクト
  useEffect(() => {
    function onUpdate() {
      // 投稿のシャドウデータが更新されたときの処理
      setShadow(shadows.get(post))
    }
    // 該当投稿のURIでイベントリスナーを登録
    emitter.addListener(post.uri, onUpdate)
    return () => {
      // クリーンアップ：イベントリスナーを削除
      emitter.removeListener(post.uri, onUpdate)
    }
  }, [post, setShadow])

  // 元の投稿データとシャドウデータを統合して返却
  return useMemo(() => {
    if (shadow) {
      // シャドウデータがある場合は統合
      return mergeShadow(post, shadow)
    } else {
      // シャドウデータがない場合は元データをシャドウ型にキャスト
      return castAsShadow(post)
    }
  }, [post, shadow])
}

function mergeShadow(
  post: AppBskyFeedDefs.PostView,
  shadow: Partial<PostShadow>,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  if (shadow.isDeleted) {
    return POST_TOMBSTONE
  }

  let likeCount = post.likeCount ?? 0
  if ('likeUri' in shadow) {
    const wasLiked = !!post.viewer?.like
    const isLiked = !!shadow.likeUri
    if (wasLiked && !isLiked) {
      likeCount--
    } else if (!wasLiked && isLiked) {
      likeCount++
    }
    likeCount = Math.max(0, likeCount)
  }

  let bookmarkCount = post.bookmarkCount ?? 0
  if ('bookmarked' in shadow) {
    const wasBookmarked = !!post.viewer?.bookmarked
    const isBookmarked = !!shadow.bookmarked
    if (wasBookmarked && !isBookmarked) {
      bookmarkCount--
    } else if (!wasBookmarked && isBookmarked) {
      bookmarkCount++
    }
    bookmarkCount = Math.max(0, bookmarkCount)
  }

  let repostCount = post.repostCount ?? 0
  if ('repostUri' in shadow) {
    const wasReposted = !!post.viewer?.repost
    const isReposted = !!shadow.repostUri
    if (wasReposted && !isReposted) {
      repostCount--
    } else if (!wasReposted && isReposted) {
      repostCount++
    }
    repostCount = Math.max(0, repostCount)
  }

  let replyCount = post.replyCount ?? 0
  if ('optimisticReplyCount' in shadow) {
    replyCount = shadow.optimisticReplyCount ?? replyCount
  }

  let embed: typeof post.embed
  if ('embed' in shadow) {
    if (
      (AppBskyEmbedRecord.isView(post.embed) &&
        AppBskyEmbedRecord.isView(shadow.embed)) ||
      (AppBskyEmbedRecordWithMedia.isView(post.embed) &&
        AppBskyEmbedRecordWithMedia.isView(shadow.embed))
    ) {
      embed = shadow.embed
    }
  }

  return castAsShadow({
    ...post,
    embed: embed || post.embed,
    likeCount: likeCount,
    repostCount: repostCount,
    replyCount: replyCount,
    bookmarkCount: bookmarkCount,
    viewer: {
      ...(post.viewer || {}),
      like: 'likeUri' in shadow ? shadow.likeUri : post.viewer?.like,
      repost: 'repostUri' in shadow ? shadow.repostUri : post.viewer?.repost,
      pinned: 'pinned' in shadow ? shadow.pinned : post.viewer?.pinned,
      bookmarked:
        'bookmarked' in shadow ? shadow.bookmarked : post.viewer?.bookmarked,
    },
  })
}

export function updatePostShadow(
  queryClient: QueryClient,
  uri: string,
  value: Partial<PostShadow>,
) {
  const cachedPosts = findPostsInCache(queryClient, uri)
  for (let post of cachedPosts) {
    shadows.set(post, {...shadows.get(post), ...value})
  }
  batchedUpdates(() => {
    emitter.emit(uri)
  })
}

function* findPostsInCache(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
  for (let post of findAllPostsInFeedQueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInNotifsQueryData(queryClient, uri)) {
    yield post
  }
  for (let node of findAllPostsInThreadQueryData(queryClient, uri)) {
    if (node.type === 'post') {
      yield node.post
    }
  }
  for (let post of findAllPostsInThreadV2QueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInQuoteQueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInExploreFeedPreviewsQueryData(
    queryClient,
    uri,
  )) {
    yield post
  }
}
