/**
 * 非同期関数バンドリングユーティリティ
 * Async Function Bundling Utility
 *
 * 【概要】
 * 複数回呼び出される非同期関数を、1つの実行中リクエストに束ねるユーティリティ。
 * 同時に複数回呼び出されても、実際のAPI呼び出しは1回のみ実行され、
 * 全ての呼び出し元が同じPromiseを共有する。
 *
 * 【主な機能】
 * - 同時実行される非同期関数の重複排除
 * - 複数の呼び出し元で1つのPromiseを共有
 * - リクエスト完了後は次の呼び出しで新規実行
 *
 * 【使用場面】
 * - ユーザープロフィール取得の重複防止
 * - 設定情報ロードの最適化
 * - 同じAPIエンドポイントへの複数同時リクエスト削減
 *
 * 【Goユーザー向け補足】
 * - type: Goの型エイリアスに相当
 * - Promise: 非同期処理の結果を表す（Goのgoroutine + channelの抽象化）
 * - async/await: Promiseを同期的に見えるコードで扱う構文
 *
 * 【Goでの同等実装例】
 * ```go
 * type BundledFn[Args any, Res any] func(args Args) (Res, error)
 *
 * func BundleAsync[Args any, Res any](fn BundledFn[Args, Res]) BundledFn[Args, Res] {
 *     var mu sync.Mutex
 *     var ch chan Res
 *
 *     return func(args Args) (Res, error) {
 *         mu.Lock()
 *         if ch != nil {
 *             // 既存の実行中リクエストを待つ
 *             mu.Unlock()
 *             return <-ch, nil
 *         }
 *         ch = make(chan Res, 1)
 *         mu.Unlock()
 *
 *         res, err := fn(args)
 *         ch <- res
 *         close(ch)
 *
 *         mu.Lock()
 *         ch = nil
 *         mu.Unlock()
 *
 *         return res, err
 *     }
 * }
 * ```
 */

/**
 * バンドル対象関数の型定義（Goの関数型に相当）
 * Type definition for bundled function (equivalent to Go function type)
 *
 * @template Args 関数の引数型（配列） / Function argument types (array)
 * @template Res 関数の戻り値型 / Function return type
 */
type BundledFn<Args extends readonly unknown[], Res> = (
  ...args: Args
) => Promise<Res>

/**
 * 非同期関数をバンドリング（重複排除）する高階関数
 * Higher-order function to bundle (deduplicate) async functions
 *
 * 【動作原理】
 * 1. 初回呼び出し: 実際の関数を実行し、Promiseを保持
 * 2. 実行中の呼び出し: 保持されたPromiseを返す（新規実行しない）
 * 3. 完了後: Promiseをクリアし、次回は新規実行
 *
 * 【使用例】
 * ```typescript
 * const fetchUser = bundleAsync(async (id: string) => {
 *   return await api.getUser(id)
 * })
 *
 * // 以下3つは同時に呼ばれても、API呼び出しは1回のみ
 * const promise1 = fetchUser('user123')
 * const promise2 = fetchUser('user123')
 * const promise3 = fetchUser('user123')
 * // promise1, promise2, promise3 は全て同じPromiseインスタンス
 * ```
 *
 * 【注意点】
 * - 引数が異なっても同じPromiseを共有する（引数は無視される）
 * - エラー時も全ての呼び出し元が同じエラーを受け取る
 * - 完了後は次の呼び出しで新規実行される
 *
 * @template Args 関数の引数型（配列） / Function argument types (array)
 * @template Res 関数の戻り値型 / Function return type
 * @param fn バンドリング対象の非同期関数 / Async function to bundle
 * @returns バンドリングされた関数（重複排除機能付き） / Bundled function (with deduplication)
 */
export function bundleAsync<Args extends readonly unknown[], Res>(
  fn: BundledFn<Args, Res>,
): BundledFn<Args, Res> {
  // 現在実行中のPromiseを保持（実行中でない場合はundefined）
  // Holds the currently executing Promise (undefined if not executing)
  let promise: Promise<Res> | undefined

  // バンドリングされた関数を返す
  // Return the bundled function
  return async (...args) => {
    // 既に実行中のPromiseがあれば、それを返す（新規実行しない）
    // If a Promise is already executing, return it (don't start new execution)
    if (promise) {
      return promise
    }

    // 新規にPromiseを作成・保持
    // Create and hold new Promise
    promise = fn(...args)

    try {
      // Promiseの完了を待って結果を返す
      // Wait for Promise completion and return result
      return await promise
    } finally {
      // 完了後はPromiseをクリア（次回は新規実行）
      // Clear Promise after completion (next call will start new execution)
      // finally: try/catchに関わらず必ず実行される（Goのdeferに似る）
      promise = undefined
    }
  }
}
