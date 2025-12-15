/**
 * モデレーション（コンテンツ管理）- ブロック・ミュート状態チェックモジュール
 * Moderation - Block and Mute Status Check Module
 *
 * このモジュールはBlueskyのモデレーション機能の一部で、ユーザー間のブロック・ミュート関係を判定します。
 * This module is part of Bluesky's moderation functionality, determining block/mute relationships between users.
 *
 * 【Goユーザー向け補足】
 * - モデレーション: SNSにおけるコンテンツやユーザーの管理・制御機能のこと
 * - ブロック: 特定ユーザーとの相互作用を完全に遮断する機能
 * - ミュート: 特定ユーザーの投稿を非表示にするが、相手には通知されない機能
 *
 * For Go Users:
 * - Moderation: Content and user management/control functionality in SNS
 * - Block: Completely prevent interactions with specific users
 * - Mute: Hide posts from specific users without notifying them
 */

// Blueskyのプロフィール型定義をインポート（Goのstructに相当）
// Import Bluesky profile type definitions (equivalent to Go structs)
import * as bsky from '#/types/bsky'

/**
 * プロフィールがブロック状態にあるかを判定
 * Determine if a profile is in a blocked state
 *
 * 以下のいずれかの条件を満たす場合にtrueを返します：
 * Returns true if either condition is met:
 * - blockedBy: 相手からブロックされている
 * - blocking: 自分が相手をブロックしている
 *
 * @param profile - チェック対象のプロフィール（Goのstruct引数に相当）
 * @param profile - Profile to check (equivalent to Go struct parameter)
 * @returns ブロック状態の場合true / true if blocked
 *
 * @example
 * const profile = await getProfile('user.bsky.social')
 * if (isBlockedOrBlocking(profile)) {
 *   // ブロック状態のため、コンテンツ表示を制限
 *   showBlockedMessage()
 * }
 */
export function isBlockedOrBlocking(profile: bsky.profile.AnyProfileView) {
  // viewer.blockedBy: 相手が自分をブロックしている / User blocked by the other user
  // viewer.blocking: 自分が相手をブロックしている / You are blocking the user
  return profile.viewer?.blockedBy || profile.viewer?.blocking
}

/**
 * プロフィールがミュート状態にあるかを判定
 * Determine if a profile is in a muted state
 *
 * 以下のいずれかの条件を満たす場合にtrueを返します：
 * Returns true if either condition is met:
 * - muted: 個別にミュートしている
 * - mutedByList: リスト経由でミュートしている（リストベースのモデレーション）
 *
 * @param profile - チェック対象のプロフィール（Goのstruct引数に相当）
 * @param profile - Profile to check (equivalent to Go struct parameter)
 * @returns ミュート状態の場合true / true if muted
 *
 * @example
 * const profile = await getProfile('user.bsky.social')
 * if (isMuted(profile)) {
 *   // ミュート済みユーザーの投稿をフィルタリング
 *   filterOutMutedContent()
 * }
 */
export function isMuted(profile: bsky.profile.AnyProfileView) {
  // viewer.muted: 個別ミュート設定 / Individual mute setting
  // viewer.mutedByList: リスト経由のミュート / Muted via list
  return profile.viewer?.muted || profile.viewer?.mutedByList
}
