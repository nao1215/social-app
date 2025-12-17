/**
 * サポートリンク生成フック
 *
 * 【概要】
 * Zendeskサポートチケット作成用のURLを生成。
 * ユーザー情報を事前入力したフォームURLを返す。
 *
 * 【URL構造】
 * https://blueskyweb.zendesk.com/hc/requests/new?
 *   tf_anonymous_requester_email=user@example.com
 *   tf_description=[Code: XX] — メッセージ
 *   tf_17205412673421=handle (DID)
 *
 * 【サポートコード】
 * - AA_DID: 年齢確認関連のサポートリクエスト
 *
 * 【Goユーザー向け補足】
 * - URLSearchParams: Goのurl.Valuesに相当
 * - enum: Goのconst iota定義に相当
 * - useCallback: 関数のメモ化（Goには直接対応なし）
 */
import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'

/**
 * Zendeskサポートフォームの基本URL
 */
export const ZENDESK_SUPPORT_URL =
  'https://blueskyweb.zendesk.com/hc/requests/new'

/**
 * サポートリクエストの種別コード
 * チケット管理とルーティングに使用
 */
export enum SupportCode {
  AA_DID = 'AA_DID',  // 年齢確認（Age Assurance）関連
}

/**
 * 事前入力されたサポートリンクを生成するフック
 *
 * 【使用例】
 * const createLink = useCreateSupportLink()
 * const url = createLink({code: SupportCode.AA_DID})
 * Linking.openURL(url)
 *
 * @see https://support.zendesk.com/hc/en-us/articles/4408839114522-Creating-pre-filled-ticket-forms
 * @returns サポートURL生成関数
 */
export function useCreateSupportLink() {
  const {_} = useLingui()
  const {currentAccount} = useSession()

  return useCallback(
    ({code, email}: {code: SupportCode; email?: string}) => {
      const url = new URL(ZENDESK_SUPPORT_URL)
      if (currentAccount) {
        url.search = new URLSearchParams({
          tf_anonymous_requester_email: email || currentAccount.email || '', // email will be defined
          tf_description:
            `[Code: ${code}] — ` + _(msg`Please write your message below:`),
          /**
           * Custom field specific to {@link ZENDESK_SUPPORT_URL} form
           */
          tf_17205412673421: currentAccount.handle + ` (${currentAccount.did})`,
        }).toString()
      }
      return url.toString()
    },
    [_, currentAccount],
  )
}
