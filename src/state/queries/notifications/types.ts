// AT Protocol API の型定義 / AT Protocol API type definitions
import {
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type AppBskyNotificationListNotifications,
} from '@atproto/api'

/**
 * 通知のタイプ定義
 * Notification type definition
 */
export type NotificationType =
  | StarterPackNotificationType
  | OtherNotificationType

/**
 * フィード通知のデータ型
 * Feed notification data type
 */
export type FeedNotification =
  | (FeedNotificationBase & {
      type: StarterPackNotificationType // スターターパック関連通知 / Starter pack related notification
      subject?: AppBskyGraphDefs.StarterPackViewBasic
    })
  | (FeedNotificationBase & {
      type: OtherNotificationType // その他の通知タイプ / Other notification types
      subject?: AppBskyFeedDefs.PostView
    })

/**
 * フィードページのデータ構造
 * Feed page data structure
 */
export interface FeedPage {
  cursor: string | undefined // 次のページのカーソル / Cursor for next page
  seenAt: Date // 既読日時 / Last seen date
  items: FeedNotification[] // 通知アイテム一覧 / List of notification items
  priority: boolean // 優先度フラグ / Priority flag
}

/**
 * キャッシュされたフィードページのデータ構造
 * Cached feed page data structure
 */
export interface CachedFeedPage {
  /**
   * trueの場合、キャッシュページは十分に新しく、レスポンスとして使用可能
   * if true, the cached page is recent enough to use as the response
   */
  usableInFeed: boolean
  syncedAt: Date // 同期日時 / Sync date
  data: FeedPage | undefined // フィードページデータ / Feed page data
  unreadCount: number // 未読数 / Unread count
}

// スターターパック関連の通知タイプ / Starter pack related notification type
type StarterPackNotificationType = 'starterpack-joined'
// その他の通知タイプ / Other notification types
type OtherNotificationType =
  | 'post-like'         // 投稿へのいいね / Post like
  | 'repost'           // リポスト / Repost
  | 'mention'          // メンション / Mention
  | 'reply'            // 返信 / Reply
  | 'quote'            // 引用 / Quote
  | 'follow'           // フォロー / Follow
  | 'feedgen-like'     // フィードジェネレーターへのいいね / Feed generator like
  | 'verified'         // 認証済み / Verified
  | 'unverified'       // 認証解除 / Unverified
  | 'like-via-repost'  // リポスト経由のいいね / Like via repost
  | 'repost-via-repost' // リポスト経由のリポスト / Repost via repost
  | 'subscribed-post'  // 購読投稿 / Subscribed post
  | 'unknown'          // 不明 / Unknown

/**
 * フィード通知の基底データ型
 * Base feed notification data type
 */
type FeedNotificationBase = {
  _reactKey: string // Reactリスト用のユニークキー / Unique key for React lists
  notification: AppBskyNotificationListNotifications.Notification // メインの通知データ / Main notification data
  additional?: AppBskyNotificationListNotifications.Notification[] // グループ化された追加通知 / Additional grouped notifications
  subjectUri?: string // 対象のURI / Subject URI
  subject?: AppBskyFeedDefs.PostView | AppBskyGraphDefs.StarterPackViewBasic // 対象データ / Subject data
}
