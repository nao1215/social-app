/**
 * 遅延実行ユーティリティ
 * Delayed Execution Utility
 *
 * 【概要】
 * 指定された遅延時間を待ってから処理結果を返すユーティリティ。
 * 処理自体は即座に開始されるが、結果は最低でも指定時間後に返される。
 *
 * 【主な機能】
 * - 処理と遅延の並行実行
 * - 最小実行時間の保証
 * - UX改善のための意図的な遅延
 *
 * 【使用場面】
 * - ローディングUIを最低限表示するため
 * - 画面遷移のスムーズさ向上
 * - API呼び出しレート制限の回避
 *
 * 【Goユーザー向け補足】
 * - async/await: 非同期処理の同期的記述（Goの goroutine + channel に似る）
 * - Promise: 非同期処理の結果（Goのchannelに似る）
 * - Promise.all: 複数のPromiseを並行実行（Goのsync.WaitGroupに似る）
 */

/**
 * 指定された遅延時間を待ってから処理を実行する関数
 * Function to execute processing after waiting for a specified delay time
 *
 * 【動作原理】
 * 1. 処理と遅延タイマーを並行開始
 * 2. 両方の完了を待つ（Promise.all）
 * 3. 処理結果を返す
 *
 * 【実行パターン】
 * - 処理が遅延より速い場合: 遅延時間まで待機してから結果を返す
 * - 処理が遅延より遅い場合: 処理完了時に即座に結果を返す
 *
 * 【Goでの同等実装】
 * ```go
 * func Wait[T any](delay time.Duration, fn T) T {
 *     resultCh := make(chan T, 1)
 *     timerCh := time.After(delay)
 *
 *     // 結果を取得（すでに評価されている場合）
 *     var result T
 *     switch v := any(fn).(type) {
 *     case T:
 *         result = v
 *     default:
 *         // 非同期の場合はgoroutineで実行
 *         go func() {
 *             // 実際の処理実行
 *             resultCh <- result
 *         }()
 *         result = <-resultCh
 *     }
 *
 *     // 遅延時間まで待機
 *     <-timerCh
 *
 *     return result
 * }
 * ```
 *
 * 【使用例】
 * ```typescript
 * // ローディングUIを最低1秒表示
 * setLoading(true)
 * const data = await wait(1000, api.fetchData())
 * setLoading(false)
 *
 * // 処理が0.5秒で完了しても、1秒後にdataが返る
 * // 処理が2秒かかる場合は、2秒後にdataが返る
 * ```
 *
 * @template T 処理結果の型 / Processing result type
 * @param delay 遅延時間（ミリ秒） / Delay time in milliseconds
 * @param fn 実行する処理（Promiseまたは値） / Processing to execute (Promise or value)
 * @returns 処理結果（遅延後） / Processing result (after delay)
 */
export async function wait<T>(delay: number, fn: T): Promise<Awaited<T>> {
  // 処理の実行と遅延の両方を並行実行し、両方完了後に処理結果を返す
  // Execute both the processing and delay concurrently, return processing result after both complete
  // Goでいう:
  // - Promise.all: sync.WaitGroup のような並行処理待機
  // - new Promise(y => setTimeout(y, delay)): time.After(delay) に相当
  // - .then(arr => arr[0]): チャネルから最初の値を取得
  return await Promise.all([fn, new Promise(y => setTimeout(y, delay))]).then(
    arr => arr[0], // 最初の要素（処理結果）を返す / Return first element (processing result)
  )
}
