/**
 * ページネーション蓄積ユーティリティ
 * Pagination Accumulation Utility
 *
 * 【概要】
 * カーソルベースのページネーションAPIから全データを蓄積・取得するためのユーティリティ。
 * 複数ページにわたるデータを自動的に取得し、単一の配列として返す。
 *
 * 【主な機能】
 * - カーソルベースのページネーション自動処理
 * - 複数ページのデータを単一配列に蓄積
 * - ページ制限による無限ループ防止
 *
 * 【使用場面】
 * - フィードの全投稿取得
 * - フォロワー/フォロイー一覧の完全取得
 * - 検索結果の全件取得
 *
 * 【Goユーザー向け補足】
 * - interface: Goのstructに相当する型定義
 * - Promise: Goのgoroutine + channelに似た非同期処理の抽象化
 * - async/await: Promiseの結果を同期的に見えるコードで扱う構文糖衣
 *   （Goの `result := <-channel` に似た動作）
 */

/**
 * ページネーション応答の型定義（Goのstructに相当）
 * Type definition for pagination response (equivalent to Go struct)
 *
 * @template T 取得するアイテムの型 / Type of items to fetch
 */
export interface AccumulateResponse<T> {
  /** 次ページを取得するためのカーソル（存在しない場合は終了） */
  /** Cursor for fetching next page (end if not exists) */
  cursor?: string
  /** 現在のページのアイテム一覧 */
  /** List of items in current page */
  items: T[]
}

/**
 * ページネーション取得関数の型定義
 * Type definition for pagination fetch function
 *
 * 【Goユーザー向け補足】
 * この型は以下のGo関数シグネチャに相当：
 * type AccumulateFetchFn[T any] func(cursor *string) (AccumulateResponse[T], error)
 *
 * @template T 取得するアイテムの型 / Type of items to fetch
 * @param cursor 現在のページカーソル（undefinedは初回ページ） / Current page cursor (undefined for first page)
 * @returns ページネーション応答のPromise / Promise of pagination response
 */
export type AccumulateFetchFn<T> = (
  cursor: string | undefined,
) => Promise<AccumulateResponse<T>>

/**
 * カーソルベースのページネーションデータを全て蓄積して取得
 * Accumulate and fetch all cursor-based pagination data
 *
 * 【動作フロー】
 * 1. カーソルundefinedで初回ページ取得
 * 2. 取得したアイテムを配列に追加
 * 3. 次ページのカーソルが存在すれば継続
 * 4. カーソルがなくなるか上限到達で終了
 *
 * 【Goユーザー向け補足】
 * - async: この関数が非同期であることを示す（Goのgoroutineで実行される関数に似る）
 * - await: Promiseの完了を待つ（Goの `<-channel` に似る）
 * - for...of: Goのfor rangeループに相当
 *
 * 例：Goでの同等実装
 * ```go
 * func Accumulate[T any](fn AccumulateFetchFn[T], pageLimit int) ([]T, error) {
 *     var cursor *string
 *     var acc []T
 *     for i := 0; i < pageLimit; i++ {
 *         res, err := fn(cursor)
 *         if err != nil {
 *             return nil, err
 *         }
 *         cursor = res.Cursor
 *         acc = append(acc, res.Items...)
 *         if cursor == nil {
 *             break
 *         }
 *     }
 *     return acc, nil
 * }
 * ```
 *
 * @template T 取得するアイテムの型 / Type of items to fetch
 * @param fn ページ取得関数（カーソルを受け取り、次のページを返す） / Page fetch function (receives cursor, returns next page)
 * @param pageLimit 取得するページ数の上限（無限ループ防止、デフォルト100） / Maximum number of pages to fetch (prevent infinite loop, default 100)
 * @returns 全ページのアイテムを結合した配列 / Array combining items from all pages
 */
export async function accumulate<T>(
  fn: AccumulateFetchFn<T>,
  pageLimit = 100,
): Promise<T[]> {
  // 現在のページカーソル（undefinedは初回ページ）
  // Current page cursor (undefined is first page)
  let cursor: string | undefined

  // 蓄積した全アイテムの配列
  // Array of all accumulated items
  let acc: T[] = []

  // ページ上限まで繰り返し取得
  // Repeatedly fetch up to page limit
  for (let i = 0; i < pageLimit; i++) {
    // 現在のカーソルでページを取得（await: Promiseの完了を待つ）
    // Fetch page with current cursor (await: wait for Promise completion)
    const res = await fn(cursor)

    // 次ページのカーソルを更新
    // Update cursor for next page
    cursor = res.cursor

    // 取得したアイテムを配列に追加
    // Add fetched items to array
    acc = acc.concat(res.items)

    // カーソルがない場合は全ページ取得完了
    // If no cursor, all pages have been fetched
    if (!cursor) {
      break
    }
  }

  // 蓄積した全アイテムを返す
  // Return all accumulated items
  return acc
}
