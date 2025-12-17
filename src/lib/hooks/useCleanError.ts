/**
 * エラーメッセージクリーニングフック
 *
 * 【概要】
 * 技術的なエラーメッセージをユーザーフレンドリーな表現に変換。
 * ネットワークエラー、サーバーエラー、認証エラーなどを検出して適切なメッセージを返す。
 *
 * 【変換例】
 * - "Network request failed" → "インターネット接続を確認してください"
 * - "Upstream Failure" → "サーバーに問題が発生しています"
 * - "Rate Limit Exceeded" → "リクエスト制限に達しました"
 * - "Bad token scope" → "アプリパスワードでは利用できません"
 *
 * 【戻り値の構造】
 * - raw: 元のエラーメッセージ（デバッグ用）
 * - clean: ユーザー向けのクリーンなメッセージ（該当なしならundefined）
 *
 * 【Goユーザー向け補足】
 * - useCallback: 関数のメモ化（Goには直接対応なし）
 * - error.toString(): Goのerror.Error()に相当
 * - String.includes(): Goのstrings.Contains()に相当
 */
import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

/**
 * クリーニング済みエラーの型
 * rawは元のメッセージ、cleanはユーザー向けメッセージ
 */
type CleanedError = {
  raw: string | undefined
  clean: string | undefined
}

/**
 * エラーメッセージをユーザーフレンドリーに変換するフック
 *
 * 【使用例】
 * const cleanError = useCleanError()
 * const {raw, clean} = cleanError(error)
 * if (clean) showToast(clean)
 *
 * @returns エラー変換関数
 */
export function useCleanError() {
  const {_} = useLingui()

  return useCallback<(error?: any) => CleanedError>(
    error => {
      if (!error)
        return {
          raw: undefined,
          clean: undefined,
        }

      let raw = error.toString()

      if (isNetworkError(raw)) {
        return {
          raw,
          clean: _(
            msg`Unable to connect. Please check your internet connection and try again.`,
          ),
        }
      }

      if (
        raw.includes('Upstream Failure') ||
        raw.includes('NotEnoughResources') ||
        raw.includes('pipethrough network error')
      ) {
        return {
          raw,
          clean: _(
            msg`The server appears to be experiencing issues. Please try again in a few moments.`,
          ),
        }
      }

      if (raw.includes('Bad token scope') || raw.includes('Bad token method')) {
        return {
          raw,
          clean: _(
            msg`This feature is not available while using an app password. Please sign in with your main password.`,
          ),
        }
      }

      if (raw.includes('Rate Limit Exceeded')) {
        return {
          raw,
          clean: _(
            msg`You've reached the maximum number of requests allowed. Please try again later.`,
          ),
        }
      }

      if (raw.startsWith('Error: ')) {
        raw = raw.slice('Error: '.length)
      }

      return {
        raw,
        clean: undefined,
      }
    },
    [_],
  )
}

/**
 * ネットワークエラーを示す文字列パターン
 * これらが含まれる場合、接続問題と判定
 */
const NETWORK_ERRORS = [
  'Abort',             // リクエスト中断
  'Network request failed',  // React Native標準のネットワークエラー
  'Failed to fetch',   // fetch API標準のエラー
  'Load failed',       // 読み込み失敗
]

/**
 * ネットワークエラーかどうかを判定
 *
 * 【使用例】
 * if (isNetworkError(error)) {
 *   showOfflineMessage()
 * }
 *
 * @param e 判定対象のエラー
 * @returns ネットワークエラーならtrue
 */
export function isNetworkError(e: unknown) {
  const str = String(e)
  for (const err of NETWORK_ERRORS) {
    if (str.includes(err)) {
      return true
    }
  }
  return false
}
