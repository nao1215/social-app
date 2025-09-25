import {t} from '@lingui/macro'

/**
 * エラーメッセージクリーニング関数
 *
 * 【主な機能】
 * - 生のエラーメッセージをユーザーフレンドリーな形式に変換
 * - ネットワークエラーの統一的な処理とメッセージ変換
 * - サーバーエラーの種類別メッセージカスタマイズ
 * - 認証エラーの適切な案内メッセージ表示
 *
 * 【使用場面】
 * - API呼び出し失敗時のエラーメッセージ表示
 * - ユーザーに分かりやすいエラー通知
 * - デバッグ情報の除去とセキュリティ配慮
 *
 * 【技術的詳細】
 * - 国際化対応（Lingui）による多言語メッセージ
 * - エラーパターンマッチングによる分類処理
 * - アプリパスワード制限の明確な説明
 *
 * @param str エラーオブジェクトまたは文字列
 * @returns クリーンアップされたエラーメッセージ
 */
export function cleanError(str: any): string {
  if (!str) {
    return ''
  }
  if (typeof str !== 'string') {
    str = str.toString()
  }
  if (isNetworkError(str)) {
    return t`Unable to connect. Please check your internet connection and try again.`
  }
  if (
    str.includes('Upstream Failure') ||
    str.includes('NotEnoughResources') ||
    str.includes('pipethrough network error')
  ) {
    return t`The server appears to be experiencing issues. Please try again in a few moments.`
  }
  if (str.includes('Bad token scope') || str.includes('Bad token method')) {
    return t`This feature is not available while using an App Password. Please sign in with your main password.`
  }
  if (str.startsWith('Error: ')) {
    return str.slice('Error: '.length)
  }
  return str
}

const NETWORK_ERRORS = [
  'Abort',
  'Network request failed',
  'Failed to fetch',
  'Load failed',
]

/**
 * ネットワークエラー判定関数
 *
 * 【主な機能】
 * - エラーがネットワーク接続問題かどうかを判定
 * - 複数のネットワークエラーパターンを統一的に検出
 * - プラットフォーム固有のエラーメッセージ対応
 *
 * 【使用場面】
 * - API呼び出し失敗時の原因分類
 * - ネットワーク再接続の提案判断
 * - オフライン状態の検出補助
 *
 * 【技術的詳細】
 * - 文字列変換による統一的なエラー判定
 * - 各プラットフォーム固有のエラーメッセージ対応
 * - 包含検索による柔軟なパターンマッチング
 *
 * @param e 判定対象のエラー（任意の型）
 * @returns ネットワークエラーの場合true
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
