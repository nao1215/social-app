/**
 * リマインダー管理モジュール
 * メール確認などのユーザーリマインダーの表示制御とスヌーズ機能を提供する
 * 永続化ストレージを使用してリマインダーの状態を管理し、
 * ユーザー体験を損なわないタイミングで通知を表示する
 *
 * Reminder management module
 * Provides display control and snooze functionality for user reminders such as email confirmation
 * Manages reminder state using persistent storage and displays notifications
 * at times that don't degrade user experience
 *
 * Goユーザー向け補足 / Note for Go developers:
 * - このモジュールは永続化ストレージ（localStorage相当）を使用します
 * - export functionはGoのパッケージレベル関数に相当します
 */

// 日付比較ユーティリティをインポート / Import date comparison utility
import {simpleAreDatesEqual} from '#/lib/strings/time'
// ロガー機能をインポート / Import logger functionality
import {logger} from '#/logger'
// 永続化ストレージ機能をインポート / Import persistent storage functionality
import * as persisted from '#/state/persisted'
// セッションアカウント型をインポート / Import session account type
import {SessionAccount} from '../session'
// オンボーディング状態確認機能をインポート / Import onboarding state check functionality
import {isOnboardingActive} from './onboarding'

/**
 * メール確認リマインダーを表示すべきかどうかを判定する関数
 * アカウント状態、オンボーディング状況、過去のスヌーズ状態を考慮する
 * 
 * Function to determine if email confirmation reminder should be displayed
 * Considers account state, onboarding status, and past snooze state
 * 
 * @param account - セッションアカウント情報 / Session account information
 * @returns リマインダーを表示すべきかどうか / Whether reminder should be displayed
 */
export function shouldRequestEmailConfirmation(account: SessionAccount) {
  // ログアウト状態の場合は無視 / Ignore if logged out
  if (!account) return false
  // 確認済みアカウントの場合は無視（これがリマインダーの成功状態） / Ignore confirmed accounts, this is the success state of this reminder
  if (account.emailConfirmed) return false
  // オンボーディング完了まで待機 / Wait for onboarding to complete
  if (isOnboardingActive()) return false

  const snoozedAt = persisted.get('reminders').lastEmailConfirm
  // 現在の日付を取得 / Get current date
  const today = new Date()

  // デバッグログ出力 / Debug log output
  logger.debug('Checking email confirmation reminder', {
    today,
    snoozedAt,
  })

  // スヌーズされたことがない場合（新規アカウント）、リマインダーを表示
  // If never been snoozed (new account), show reminder
  if (!snoozedAt) {
    return true
  }

  // 既に今日スヌーズ済みの場合、リマインダーを表示しない
  // If already snoozed today, don't show reminder
  if (simpleAreDatesEqual(new Date(Date.parse(snoozedAt)), new Date())) {
    return false
  }

  // スヌーズ期限が過ぎた場合、リマインダーを表示
  // If snooze period has expired, show reminder
  return true
}

/**
 * メール確認プロンプトをスヌーズする関数
 * 現在の日時をスヌーズ時刻として永続化ストレージに保存
 *
 * Function to snooze email confirmation prompt
 * Saves current date/time as snooze time to persistent storage
 */
export function snoozeEmailConfirmationPrompt() {
  // 現在の日時をISO形式で取得 / Get current date/time in ISO format
  const lastEmailConfirm = new Date().toISOString()
  // デバッグログ出力 / Debug log output
  logger.debug('Snoozing email confirmation reminder', {
    snoozedAt: lastEmailConfirm,
  })
  // スヌーズ時刻を永続化ストレージに保存 / Save snooze time to persistent storage
  persisted.write('reminders', {
    ...persisted.get('reminders'),
    lastEmailConfirm,
  })
}
