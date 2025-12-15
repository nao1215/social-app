/**
 * キャンセル可能非同期処理ユーティリティ
 * Cancelable Async Processing Utility
 *
 * 【概要】
 * AbortSignalを使用して非同期処理をキャンセル可能にするユーティリティ。
 * 実行中の処理を外部から中断できるようにするラッパー関数とエラークラスを提供。
 *
 * 【主な機能】
 * - AbortSignalによる非同期処理のキャンセル
 * - キャンセル時の専用エラー（AbortError）発生
 * - 既存の非同期関数をキャンセル可能にする高階関数
 *
 * 【使用場面】
 * - 長時間実行APIリクエストの中断
 * - ユーザーナビゲーション時の未完了処理キャンセル
 * - タイムアウト処理の実装
 *
 * 【Goユーザー向け補足】
 * - AbortSignal: Goのcontext.Contextに似たキャンセル機構
 * - Promise: 非同期処理の結果（Goのgoroutine + channelの抽象化）
 * - new Promise: 手動でPromiseを作成（Goでchannelを作成するのに似る）
 *
 * 【Goでの同等実装例】
 * ```go
 * func Cancelable[A any, T any](f func(A) (T, error), ctx context.Context) func(A) (T, error) {
 *     return func(args A) (T, error) {
 *         resultCh := make(chan struct {
 *             result T
 *             err    error
 *         }, 1)
 *
 *         go func() {
 *             result, err := f(args)
 *             resultCh <- struct {
 *                 result T
 *                 err    error
 *             }{result, err}
 *         }()
 *
 *         select {
 *         case <-ctx.Done():
 *             return *new(T), AbortError{} // context canceled
 *         case res := <-resultCh:
 *             return res.result, res.err
 *         }
 *     }
 * }
 * ```
 */

/**
 * 非同期関数をキャンセル可能にする高階関数
 * Higher-order function to make async function cancelable
 *
 * 【動作原理】
 * 1. AbortSignalのabortイベントを監視
 * 2. abort発火時: AbortErrorでPromiseをreject
 * 3. 関数完了時: 結果またはエラーでPromiseをresolve/reject
 * 4. どちらか先に発生した方が勝つ（race condition）
 *
 * 【使用例】
 * ```typescript
 * const controller = new AbortController()
 * const fetchData = cancelable(async (id: string) => {
 *   return await api.fetchData(id)
 * }, controller.signal)
 *
 * // 処理を開始
 * const promise = fetchData('data123')
 *
 * // 必要に応じてキャンセル
 * controller.abort()
 *
 * try {
 *   await promise
 * } catch (err) {
 *   if (err instanceof AbortError) {
 *     console.log('処理がキャンセルされました')
 *   }
 * }
 * ```
 *
 * @template A 関数の引数型 / Function argument type
 * @template T 関数の戻り値型 / Function return type
 * @param f キャンセル可能にする非同期関数 / Async function to make cancelable
 * @param signal キャンセルシグナル（abort()でキャンセル） / Abort signal (cancel with abort())
 * @returns キャンセル可能な関数 / Cancelable function
 */
export function cancelable<A, T>(
  f: (args: A) => Promise<T>,
  signal: AbortSignal,
) {
  return (args: A) => {
    // 新しいPromiseを作成（resolve/rejectを手動制御）
    // Create new Promise (manually control resolve/reject)
    // Goでいう: resultCh := make(chan T, 1)
    return new Promise<T>((resolve, reject) => {
      // abortイベントリスナーを登録
      // Register abort event listener
      // キャンセル時: AbortErrorでreject
      // On cancel: reject with AbortError
      signal.addEventListener('abort', () => {
        reject(new AbortError())
      })

      // 元の関数を実行し、結果を処理
      // Execute original function and handle result
      // 成功時: resolveで結果を返す
      // On success: return result with resolve
      // エラー時: rejectでエラーを返す
      // On error: return error with reject
      f(args).then(resolve, reject)
    })
  }
}

/**
 * 処理中断エラークラス
 * Abort Error Class
 *
 * 【概要】
 * キャンセルされた非同期処理で発生する専用エラー。
 * AbortErrorかどうかを判定することで、通常のエラーとキャンセルを区別できる。
 *
 * 【Goユーザー向け補足】
 * - class: Goのstructに似た型定義（メソッドを持てる）
 * - extends Error: Goのエラーインターフェース実装に相当
 * - constructor: Goのコンストラクタ関数（NewXXX）に相当
 *
 * 【Goでの同等実装】
 * ```go
 * type AbortError struct {
 *     message string
 * }
 *
 * func (e AbortError) Error() string {
 *     return e.message
 * }
 *
 * func NewAbortError() AbortError {
 *     return AbortError{message: "Aborted"}
 * }
 * ```
 *
 * 【使用例】
 * ```typescript
 * try {
 *   await cancelableOperation()
 * } catch (err) {
 *   if (err instanceof AbortError) {
 *     // キャンセル時の処理
 *     console.log('ユーザーによってキャンセルされました')
 *   } else {
 *     // その他のエラー処理
 *     console.error('エラーが発生しました:', err)
 *   }
 * }
 * ```
 */
export class AbortError extends Error {
  /**
   * AbortErrorを生成
   * Create AbortError
   */
  constructor() {
    // 親クラス（Error）のコンストラクタを呼び出し
    // Call parent class (Error) constructor
    super('Aborted')

    // エラー名を設定（スタックトレースに表示される）
    // Set error name (displayed in stack trace)
    this.name = 'AbortError'
  }
}
