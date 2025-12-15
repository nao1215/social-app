/**
 * リトライユーティリティ
 * Retry Utility
 *
 * 【概要】
 * 失敗した処理を指定回数まで自動的に再試行するユーティリティ。
 * ネットワークエラーなど一時的な失敗に対して、自動的にリトライを行う。
 *
 * 【主な機能】
 * - カスタム条件によるリトライ制御
 * - リトライ間隔の設定
 * - ネットワークエラー専用のリトライ関数
 *
 * 【使用場面】
 * - ネットワーク不安定時のAPI呼び出し
 * - 一時的なサーバーエラーのリカバリー
 * - レート制限後の再試行
 *
 * 【Goユーザー向け補足】
 * - async/await: 非同期処理の同期的記述（Goの goroutine + channel に似る）
 * - Promise: 非同期処理の結果（Goのchannelに似る）
 * - throw: Goのpanic/errorに似たエラー伝播機構
 */

// タイムアウトユーティリティをインポート
// Import timeout utility
import {timeout} from '#/lib/async/timeout'

// ネットワークエラー検出ユーティリティをインポート
// Import network error detection utility
import {isNetworkError} from '#/lib/strings/errors'

/**
 * 指定された回数まで処理をリトライする汎用的な関数
 * Generic function to retry processing up to a specified number of times
 *
 * 【動作フロー】
 * 1. 処理を実行
 * 2. 成功: 結果を返して終了
 * 3. 失敗: shouldRetry関数でリトライ判定
 * 4. リトライする: 遅延後に再実行
 * 5. リトライしない: エラーをそのまま投げる
 * 6. リトライ回数到達: 最後のエラーを投げる
 *
 * 【Goでの同等実装】
 * ```go
 * func Retry[P any](
 *     retries int,
 *     shouldRetry func(err error) bool,
 *     action func() (P, error),
 *     delay *time.Duration,
 * ) (P, error) {
 *     var lastErr error
 *     for retries > 0 {
 *         result, err := action()
 *         if err == nil {
 *             return result, nil
 *         }
 *         lastErr = err
 *         if shouldRetry(err) {
 *             if delay != nil {
 *                 time.Sleep(*delay)
 *             }
 *             retries--
 *             continue
 *         }
 *         return *new(P), err
 *     }
 *     return *new(P), lastErr
 * }
 * ```
 *
 * 【使用例】
 * ```typescript
 * const data = await retry(
 *   3,                                    // 最大3回リトライ
 *   (err) => err.status === 503,         // 503エラーのみリトライ
 *   async () => await api.fetchData(),   // 実行する処理
 *   1000                                 // 1秒待機
 * )
 * ```
 *
 * @template P 処理結果の型 / Processing result type
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
      // リトライすべきでないエラーの場合はそのまま投げる
      // Throw error immediately if it shouldn't be retried
      throw e
    }
  }
  // すべてのリトライが失敗した場合は最後のエラーを投げる
  // Throw the last error if all retries failed
  throw lastErr
}

/**
 * ネットワークエラーに対して特化したリトライ関数
 * Specialized retry function for network errors
 *
 * 【概要】
 * ネットワーク関連のエラーのみをリトライ対象とする。
 * タイムアウト、接続エラー、DNS解決失敗などを自動的に判定してリトライ。
 *
 * 【動作】
 * - isNetworkError関数でエラーの種類を判定
 * - ネットワークエラーの場合のみリトライ実行
 * - その他のエラー（404、500など）はリトライしない
 *
 * 【Goでの同等実装】
 * ```go
 * func NetworkRetry[P any](retries int, fn func() (P, error)) (P, error) {
 *     return Retry(retries, isNetworkError, fn, nil)
 * }
 * ```
 *
 * 【使用例】
 * ```typescript
 * // ネットワークエラーのみ最大3回リトライ
 * const user = await networkRetry(3, async () => {
 *   return await api.getUser('user123')
 * })
 * ```
 *
 * @template P 処理結果の型 / Processing result type
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
