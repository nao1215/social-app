/**
 * 重複実行防止フックモジュール
 *
 * 【概要】
 * 連続したイベント発火（ダブルクリックなど）を防止するフック。
 * 指定時間内の再実行をブロックし、UIの誤操作を防ぐ。
 *
 * 【使用場面】
 * - ボタンのダブルクリック防止
 * - フォーム送信の重複防止
 * - ナビゲーション遷移の重複防止
 *
 * 【Goユーザー向け補足】
 * - useRef: ミュータブルな値の保持（Goのポインタ変数に相当）
 * - useCallback: 関数のメモ化（Goには直接対応なし）
 * - setTimeout: 遅延実行（Goのtime.AfterFuncに相当）
 */
import React from 'react'

/**
 * 重複実行防止フック
 *
 * 【動作】
 * 1. 関数実行を許可
 * 2. タイムアウト期間中は再実行をブロック
 * 3. タイムアウト後に再び実行可能に
 *
 * 【使用例】
 * const dedupe = useDedupe(500)
 * const handlePress = () => {
 *   dedupe(() => navigation.navigate('Details'))
 * }
 *
 * @param timeout ブロック期間（ミリ秒、デフォルト: 250ms）
 * @returns 重複防止でラップされた関数実行器
 */
export const useDedupe = (timeout = 250) => {
  // 実行可能かどうかのフラグ
  const canDo = React.useRef(true)

  return React.useCallback(
    (cb: () => unknown) => {
      if (canDo.current) {
        // 実行をブロック状態に
        canDo.current = false
        // タイムアウト後に再び実行可能に
        setTimeout(() => {
          canDo.current = true
        }, timeout)
        // コールバックを実行
        cb()
        return true  // 実行成功
      }
      return false  // ブロック中のため実行されず
    },
    [timeout],
  )
}
