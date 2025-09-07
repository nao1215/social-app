/**
 * 指定された遅延時間を待ってから処理を実行する関数
 * Function to execute processing after waiting for a specified delay time
 * @param delay 遅延時間（ミリ秒） / Delay time in milliseconds
 * @param fn 実行する処理 / Processing to execute
 * @returns 処理結果 / Processing result
 */
export async function wait<T>(delay: number, fn: T): Promise<Awaited<T>> {
  // 処理の実行と遅延の両方を並行実行し、両方完了後に処理結果を返す
  // Execute both the processing and delay concurrently, return processing result after both complete
  return await Promise.all([fn, new Promise(y => setTimeout(y, delay))]).then(
    arr => arr[0], // 最初の要素（処理結果）を返す / Return first element (processing result)
  )
}
