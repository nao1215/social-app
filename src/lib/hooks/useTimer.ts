// Reactの標準フック類をインポート
// Import standard React hooks
import * as React from 'react'

/**
 * ビューで持続的なタイマーを実行するためのヘルパーフック
 * Helper hook to run persistent timers on views
 * @param time タイマーの遅延時間（ミリ秒） / Timer delay time in milliseconds
 * @param handler タイマー終了時に実行する関数 / Function to execute when timer ends
 * @returns タイマーをリセットする関数とキャンセルする関数 / Functions to reset and cancel the timer
 */
export function useTimer(time: number, handler: () => void) {
  // タイマーIDを保持するためのref
  // Ref to hold the timer ID
  const timer = React.useRef<undefined | NodeJS.Timeout>(undefined)

  // タイマーを再始動する関数
  // function to restart the timer
  const reset = React.useCallback(() => {
    // 既存のタイマーがあればキャンセル
    // Cancel existing timer if it exists
    if (timer.current) {
      clearTimeout(timer.current)
    }
    // 新しいタイマーを設定
    // Set up new timer
    timer.current = setTimeout(handler, time)
  }, [time, timer, handler])

  // タイマーをキャンセルする関数
  // function to cancel the timer
  const cancel = React.useCallback(() => {
    // タイマーが存在する場合はクリアしてリセット
    // Clear and reset timer if it exists
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = undefined
    }
  }, [timer])

  // コンポーネントマウント時にタイマーを即座開始
  // start the timer immediately on component mount
  React.useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // リセットとキャンセル関数を返す
  // Return reset and cancel functions
  return [reset, cancel]
}
