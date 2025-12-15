/**
 * モデレーション - サニタイズされた表示名生成モジュール
 * Moderation - Sanitized Display Name Generation Module
 *
 * このモジュールは、ユーザープロフィールから安全な表示名を生成します。
 * This module generates safe display names from user profiles.
 *
 * サニタイゼーション処理により、悪意のある文字列やXSS攻撃を防ぎます。
 * Sanitization processing prevents malicious strings and XSS attacks.
 *
 * 【Goユーザー向け補足】
 * - サニタイゼーション: ユーザー入力から危険な文字を除去・エスケープする処理
 * - displayName: ユーザーが設定した任意の表示名（Goのstring型に相当）
 * - handle: Blueskyの一意な識別子（@user.bsky.social形式）
 *
 * For Go Users:
 * - Sanitization: Process to remove/escape dangerous characters from user input
 * - displayName: User-defined display name (equivalent to Go string type)
 * - handle: Unique Bluesky identifier (@user.bsky.social format)
 */

// 表示名のサニタイゼーション関数をインポート
// Import display name sanitization function
import {sanitizeDisplayName} from '#/lib/strings/display-names'
// ハンドルのサニタイゼーション関数をインポート
// Import handle sanitization function
import {sanitizeHandle} from '#/lib/strings/handles'
// Blueskyのプロフィール型定義をインポート（Goのstructに相当）
// Import Bluesky profile type definitions (equivalent to Go structs)
import type * as bsky from '#/types/bsky'

/**
 * プロフィールから安全な表示名を生成
 * Generate a safe display name from a profile
 *
 * 優先順位：
 * Priority:
 * 1. displayNameが存在する場合 → サニタイズして返す
 *    If displayName exists → Sanitize and return
 * 2. displayNameが空の場合 → ハンドルをサニタイズして返す
 *    If displayName is empty → Sanitize and return handle
 *
 * @param profile - ユーザープロフィール（Goのstruct引数に相当）
 * @param profile - User profile (equivalent to Go struct parameter)
 * @param noAt - ハンドルから@プレフィックスを除外するか（デフォルト: false）
 * @param noAt - Whether to exclude @ prefix from handle (default: false)
 * @returns サニタイズされた表示名 / Sanitized display name
 *
 * @example
 * // displayNameが存在する場合
 * const profile = { displayName: 'Alice <script>', handle: 'alice.bsky.social' }
 * createSanitizedDisplayName(profile) // 'Alice' (スクリプトタグは除去)
 *
 * // displayNameが空の場合
 * const profile = { displayName: '', handle: 'bob.bsky.social' }
 * createSanitizedDisplayName(profile) // '@bob.bsky.social'
 * createSanitizedDisplayName(profile, true) // 'bob.bsky.social' (@なし)
 */
export function createSanitizedDisplayName(
  profile: bsky.profile.AnyProfileView,
  noAt = false,
) {
  // displayNameが設定されている場合は、それをサニタイズして使用
  // If displayName is set, sanitize and use it
  if (profile.displayName != null && profile.displayName !== '') {
    return sanitizeDisplayName(profile.displayName)
  } else {
    // displayNameが空の場合は、ハンドルをフォールバックとして使用
    // If displayName is empty, use handle as fallback
    // noAtがtrueの場合は@プレフィックスなし、falseの場合は@付き
    // If noAt is true, no @ prefix; if false, include @
    return sanitizeHandle(profile.handle, noAt ? '' : '@')
  }
}
