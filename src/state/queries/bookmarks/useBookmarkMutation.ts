// AT Protocol API の型定義 / AT Protocol API type definitions
import {type AppBskyFeedDefs} from '@atproto/api'
// TanStack Query のフック / TanStack Query hooks
import {useMutation, useQueryClient} from '@tanstack/react-query'

// ネットワークエラー判定ユーティリティ / Network error detection utility
import {isNetworkError} from '#/lib/strings/errors'
// ログシステム / Logging system
import {logger} from '#/logger'
// 投稿シャドウ更新機能 / Post shadow update functionality
import {updatePostShadow} from '#/state/cache/post-shadow'
// ブックマークの楽観的更新機能 / Bookmark optimistic update functions
import {
  optimisticallyDeleteBookmark, // 楽観的ブックマーク削除 / Optimistic bookmark deletion
  optimisticallySaveBookmark,   // 楽観的ブックマーク保存 / Optimistic bookmark saving
} from '#/state/queries/bookmarks/useBookmarksQuery'
// セッション管理 / Session management
import {useAgent} from '#/state/session'

/**
 * ブックマークミューテーションの引数型
 * Bookmark mutation arguments type
 */
type MutationArgs =
  | {action: 'create'; post: AppBskyFeedDefs.PostView} // ブックマーク作成 / Bookmark creation
  | {
      action: 'delete'
      /**
       * 削除の場合、URIのみが必要。投稿が作者によって削除された場合なURIしか分からないケースもある。
       * For deletions, we only need the URI. Plus, in some cases we only know the
       * URI, such as when a post was deleted by the author.
       */
      uri: string // 削除対象のURI / URI to delete
    }

/**
 * ブックマークの作成・削除を行うミューテーションフック
 * Mutation hook for creating and deleting bookmarks
 * 
 * @returns TanStack Query のミューテーション結果 / TanStack Query mutation result
 */
export function useBookmarkMutation() {
  const qc = useQueryClient() // クエリクライアント / Query client
  const agent = useAgent() // Bluesky エージェント / Bluesky agent

  return useMutation({
    async mutationFn(args: MutationArgs) {
      if (args.action === 'create') {
        // UIを即座に更新（楽観的更新） / Update UI immediately (optimistic update)
        updatePostShadow(qc, args.post.uri, {bookmarked: true})
        // APIでブックマークを作成 / Create bookmark via API
        await agent.app.bsky.bookmark.createBookmark({
          uri: args.post.uri,
          cid: args.post.cid,
        })
      } else if (args.action === 'delete') {
        // UIを即座に更新（楽観的更新） / Update UI immediately (optimistic update)
        updatePostShadow(qc, args.uri, {bookmarked: false})
        // APIでブックマークを削除 / Delete bookmark via API
        await agent.app.bsky.bookmark.deleteBookmark({
          uri: args.uri,
        })
      }
    },
    onSuccess(_, args) {
      // API呼び出し成功時の処理 / Handle successful API call
      if (args.action === 'create') {
        // ブックマーク一覧に楽観的に追加 / Optimistically add to bookmark list
        optimisticallySaveBookmark(qc, args.post)
      } else if (args.action === 'delete') {
        // ブックマーク一覧から楽観的に削除 / Optimistically remove from bookmark list
        optimisticallyDeleteBookmark(qc, {uri: args.uri})
      }
    },
    onError(e, args) {
      // API呼び出し失敗時のロールバック処理 / Rollback on API call failure
      if (args.action === 'create') {
        // 作成失敗時はブックマーク状態を元に戻す / Revert bookmark state on creation failure
        updatePostShadow(qc, args.post.uri, {bookmarked: false})
      } else if (args.action === 'delete') {
        // 削除失敗時はブックマーク状態を元に戻す / Revert bookmark state on deletion failure
        updatePostShadow(qc, args.uri, {bookmarked: true})
      }

      // ネットワークエラー以外の場合はログ出力 / Log non-network errors
      if (!isNetworkError(e)) {
        logger.error('bookmark mutation failed', {
          bookmarkAction: args.action,
          safeMessage: e,
        })
      }
    }
  })
}
