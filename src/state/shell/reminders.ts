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
  const today = new Date()

  logger.debug('Checking email confirmation reminder', {
    today,
    snoozedAt,
  })

  // never been snoozed, new account
  if (!snoozedAt) {
    return true
  }

  // already snoozed today
  if (simpleAreDatesEqual(new Date(Date.parse(snoozedAt)), new Date())) {
    return false
  }

  return true
}

export function snoozeEmailConfirmationPrompt() {
  const lastEmailConfirm = new Date().toISOString()
  logger.debug('Snoozing email confirmation reminder', {
    snoozedAt: lastEmailConfirm,
  })
  persisted.write('reminders', {
    ...persisted.get('reminders'),
    lastEmailConfirm,
  })
}
