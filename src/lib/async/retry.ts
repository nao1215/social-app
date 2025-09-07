// タイムアウトユーティリティをインポート
// Import timeout utility
import {timeout} from '#/lib/async/timeout'
// ネットワークエラー検出ユーティリティをインポート
// Import network error detection utility
import {isNetworkError} from '#/lib/strings/errors'

/**
 * 指定された回数まで処理をリトライする汎用的な関数
 * Generic function to retry processing up to a specified number of times
 * @param retries リトライ回数 / Number of retry attempts
 * @param shouldRetry リトライするかどうかを判定する関数 / Function to determine whether to retry
 * @param action 実行する処理 / Action to execute
 * @param delay リトライ間の遅延時間（ミリ秒） / Delay between retries in milliseconds
 * @returns 処理結果 / Processing result
 */
export async function retry<P>(
  retries: number,
  shouldRetry: (err: any) => boolean,
  action: () => Promise<P>,
  delay?: number,
): Promise<P> {
  // 最後のエラーを保持
  // Hold the last error
  let lastErr
  
  // リトライ回数が残っている間繰り返し
  // Repeat while retry attempts remain
  while (retries > 0) {
    try {
      // 処理を実行し、成功したら結果を返す
      // Execute action and return result if successful
      return await action()
    } catch (e: any) {
      // エラーを記録
      // Record the error
      lastErr = e
      
      // リトライすべきエラーかどうかをチェック
      // Check if this error should be retried
      if (shouldRetry(e)) {
        // 遅延が指定されている場合は待機
        // Wait if delay is specified
        if (delay) {
          await timeout(delay)
        }
        // リトライ回数を減らして続行
        // Decrease retry count and continue
        retries--
        continue
      }
      // リトライすべきでないエラーの場合はそのまま抛出
      // Throw error immediately if it shouldn't be retried
      throw e
    }
  }
  // すべてのリトライが失敗した場合は最後のエラーを抛出
  // Throw the last error if all retries failed
  throw lastErr
}

/**
 * ネットワークエラーに対して特化したリトライ関数
 * Specialized retry function for network errors
 * ネットワーク関連のエラーのみをリトライ対象とする
 * Only retries network-related errors
 * @param retries リトライ回数 / Number of retry attempts
 * @param fn 実行する処理 / Function to execute
 * @returns 処理結果 / Processing result
 */
export async function networkRetry<P>(
  retries: number,
  fn: () => Promise<P>,
): Promise<P> {
  // ネットワークエラー判定関数を使用してリトライを実行
  // Execute retry using network error detection function
  return retry(retries, isNetworkError, fn)
}
