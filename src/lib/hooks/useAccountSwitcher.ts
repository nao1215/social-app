/**
 * アカウント切り替えフックモジュール
 *
 * 【概要】
 * マルチアカウント機能でのアカウント切り替え処理を提供。
 * セッションの復元、再ログイン、UI更新を統合管理。
 *
 * 【処理フロー】
 * 1. ユーザーがアカウント切り替えをリクエスト
 * 2. アクセストークンがある場合 → セッション復元
 * 3. アクセストークンがない場合 → 再ログイン画面へ
 * 4. Webの場合 → URLをホームにリセット
 *
 * 【Goユーザー向け補足】
 * - useCallback: 関数のメモ化（Goには直接対応なし）
 * - useState: Reactの状態管理（Goのチャネルとは異なる概念）
 * - async/await: 非同期処理（Goのgoroutine/channelに相当）
 */

import {useCallback, useState} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {SessionAccount, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import * as Toast from '#/view/com/util/Toast'
import {logEvent} from '../statsig/statsig'
import {LogEvents} from '../statsig/statsig'

/**
 * アカウント切り替えフック
 *
 * 【戻り値】
 * - onPressSwitchAccount: アカウント切り替え実行関数
 * - pendingDid: 切り替え中のアカウントDID（競合防止用）
 *
 * 【使用例】
 * const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
 * await onPressSwitchAccount(account, 'Settings')
 */
export function useAccountSwitcher() {
  const [pendingDid, setPendingDid] = useState<string | null>(null)
  const {_} = useLingui()
  const {resumeSession} = useSessionApi()
  const {requestSwitchToAccount} = useLoggedOutViewControls()

  /**
   * アカウント切り替えハンドラー
   *
   * 【処理内容】
   * 1. 競合チェック（既に切り替え中なら無視）
   * 2. アクセストークン確認
   *    - あり: セッション復元して切り替え完了
   *    - なし: ログイン画面へリダイレクト
   * 3. Web環境では履歴をホームにリセット
   *
   * @param account 切り替え先のアカウント
   * @param logContext ログ記録用のコンテキスト
   */
  const onPressSwitchAccount = useCallback(
    async (
      account: SessionAccount,
      logContext: LogEvents['account:loggedIn']['logContext'],
    ) => {
      // セッションAPIは競合に弱いため、切り替え中は無視
      if (pendingDid) {
        return
      }
      try {
        setPendingDid(account.did)
        if (account.accessJwt) {
          if (isWeb) {
            // Web環境でのアカウント切り替え時、アプリ全体が再マウントされる。
            // モバイルではホーム画面に戻るが、Webではナビゲーターが
            // アンマウント前にpushState()を呼ぶため、手動でURLをリセットする必要がある。
            history.pushState(null, '', '/')
          }
          // セッション復元（JWTを使用した自動ログイン）
          await resumeSession(account)
          logEvent('account:loggedIn', {logContext, withPassword: false})
          Toast.show(_(msg`Signed in as @${account.handle}`))
        } else {
          // アクセストークンがない場合は再ログインを要求
          requestSwitchToAccount({requestedAccount: account.did})
          Toast.show(
            _(msg`Please sign in as @${account.handle}`),
            'circle-exclamation',
          )
        }
      } catch (e: any) {
        // セッション復元に失敗した場合も再ログインへ
        logger.error(`switch account: selectAccount failed`, {
          message: e.message,
        })
        requestSwitchToAccount({requestedAccount: account.did})
        Toast.show(
          _(msg`Please sign in as @${account.handle}`),
          'circle-exclamation',
        )
      } finally {
        setPendingDid(null) // 処理完了、次の切り替えを許可
      }
    },
    [_, resumeSession, requestSwitchToAccount, pendingDid],
  )

  return {onPressSwitchAccount, pendingDid}
}
