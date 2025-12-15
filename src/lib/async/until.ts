/**
 * 条件満足待機ユーティリティ
 * Conditional Wait Utility
 *
 * 【概要】
 * 指定された条件が満たされるまで、繰り返し処理を実行するポーリングユーティリティ。
 * 一定間隔で処理を実行し、条件が真になるまで待機する。
 *
 * 【主な機能】
 * - 条件が満たされるまでの定期的なポーリング
 * - リトライ回数と遅延時間の制御
 * - 成功/エラー両方に対する条件判定
 *
 * 【使用場面】
 * - APIの状態が特定の値になるまで待機
 * - 非同期処理の完了確認（ポーリング方式）
 * - テストでの状態変化待機
 *
 * 【Goユーザー向け補足】
 * - async/await: 非同期処理の同期的記述（Goの goroutine + channel に似る）
 * - Promise: 非同期処理の結果（Goのchannelに似る）
 * - timeout: 指定時間待機（Goの time.Sleep に相当）
 */

// タイムアウトユーティリティをインポート（指定時間待機）
// Import timeout utility (wait for specified time)
import {timeout} from './timeout'

/**
 * 条件が満たされるまで処理を繰り返し実行
 * Repeatedly execute process until condition is met
 *
 * 【動作フロー】
 * 1. 指定された関数を実行
 * 2. 結果（または発生したエラー）を条件関数で評価
 * 3. 条件が真: trueを返して終了
 * 4. 条件が偽: 遅延後に再実行
 * 5. リトライ回数到達: falseを返して終了
 *
 * 【Goでの同等実装】
 * ```go
 * func Until[T any](
 *     retries int,
 *     delay time.Duration,
 *     cond func(v T, err error) bool,
 *     fn func() (T, error),
 * ) bool {
 *     for retries > 0 {
 *         v, err := fn()
 *         if cond(v, err) {
 *             return true
 *         }
 *         time.Sleep(delay)
 *         retries--
 *     }
 *     return false
 * }
 * ```
 *
 * 【使用例】
 * ```typescript
 * // APIが準備完了するまで待機
 * const isReady = await until(
 *   10,           // 最大10回リトライ
 *   1000,         // 1秒間隔
 *   (status) => status === 'ready',  // 条件: statusが'ready'
 *   async () => {
 *     const res = await api.getStatus()
 *     return res.status
 *   }
 * )
 * if (isReady) {
 *   console.log('APIが準備完了しました')
 * } else {
 *   console.log('タイムアウト: APIが準備できませんでした')
 * }
 * ```
 *
 * @template T 関数の戻り値型 / Function return type
 * @param retries リトライ回数の上限 / Maximum retry attempts
 * @param delay リトライ間の遅延時間（ミリ秒） / Delay between retries (milliseconds)
 * @param cond 条件判定関数（値とエラーを受け取り、真偽値を返す） / Condition function (receives value and error, returns boolean)
 * @param fn 繰り返し実行する非同期関数 / Async function to execute repeatedly
 * @returns 条件が満たされた場合true、リトライ上限到達でfalse / true if condition met, false if retry limit reached
 */
export async function until<T>(
  retries: number,
  delay: number,
  cond: (v: T, err: any) => boolean,
  fn: () => Promise<T>,
): Promise<boolean> {
  // リトライ回数が残っている間繰り返す
  // Repeat while retry attempts remain
  while (retries > 0) {
    try {
      // 処理を実行（awaitで完了を待つ）
      // Execute process (await for completion)
      const v = await fn()

      // 成功時の条件判定（エラーはundefined）
      // Condition check on success (error is undefined)
      if (cond(v, undefined)) {
        // 条件が満たされた場合は成功
        // If condition is met, return success
        return true
      }
    } catch (e: any) {
      // TODO: change the type signature of cond to accept undefined
      // however this breaks every existing usage of until -sfn
      // TODO: 条件関数の型シグネチャをundefinedを受け入れるように変更
      // ただし、これは既存のuntil使用箇所を全て壊す -sfn

      // エラー発生時の条件判定
      // Condition check on error
      // 型システムの制約上、undefinedをT型にキャスト
      // Due to type system constraints, cast undefined to type T
      if (cond(undefined as unknown as T, e)) {
        // エラーでも条件が満たされる場合（例: 特定のエラーを待つ）
        // If condition is met even on error (e.g., waiting for specific error)
        return true
      }
    }

    // 次のリトライまで待機（Goの time.Sleep に相当）
    // Wait until next retry (equivalent to Go's time.Sleep)
    await timeout(delay)

    // リトライ回数を減らす
    // Decrease retry count
    retries--
  }

  // すべてのリトライを使い切った場合は失敗
  // If all retries exhausted, return failure
  return false
}
