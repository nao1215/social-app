// AT Protocolのモデレーション設定の型定義をインポート
// Import moderation preferences type from AT Protocol
import {type ModerationPrefs} from '@atproto/api'

// ログアウト状態のデフォルトラベル設定をインポート
// Import default label preferences for logged-out users
import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'

/**
 * 年齢制限が適用されるユーザー向けのモデレーション設定を作成する
 * アダルトコンテンツを無効化し、ログアウト状態のラベル設定を適用することで
 * 未成年者や年齢認証が未完了のユーザーを保護する
 * 
 * Creates moderation preferences for age-restricted users.
 * Disables adult content and applies logged-out label preferences to protect
 * minors and users who haven't completed age verification.
 * 
 * @param prefs 既存のモデレーション設定 / Existing moderation preferences
 * @returns 年齢制限が適用されたモデレーション設定 / Age-restricted moderation preferences
 */
export const makeAgeRestrictedModerationPrefs = (
  prefs: ModerationPrefs,
): ModerationPrefs => ({
  ...prefs,
  adultContentEnabled: false, // アダルトコンテンツを無効化 / Disable adult content
  labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES, // ログアウト状態のラベル設定を適用 / Apply logged-out label preferences
})
