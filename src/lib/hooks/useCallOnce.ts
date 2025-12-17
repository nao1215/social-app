/**
 * 一度だけ実行フック
 *
 * 【概要】
 * アプリのライフサイクル中に一度だけコールバックを実行する仕組み。
 * 初期化処理やワンタイムイベントの発火に使用。
 *
 * 【動作原理】
 * - モジュールスコープの`called`オブジェクトで呼び出し状態を管理
 * - 一度実行されたキーは再度実行されない
 * - Reactの状態とは独立（アンマウントしても状態維持）
 *
 * 【使用例】
 * const callOnce = useCallOnce(OnceKey.PreferencesThread)
 * callOnce(() => trackFirstView())  // 初回のみ実行
 *
 * 【Goユーザー向け補足】
 * - モジュールスコープ変数: Goのパッケージレベル変数に相当
 * - sync.Once: Goの一度だけ実行パターン
 * - enum: Goのconst iota定義に相当
 */
import {useCallback} from 'react'

/**
 * 一度だけ実行する処理のキー
 * 新しい処理を追加する場合はここに追加
 */
export enum OnceKey {
  PreferencesThread = 'preferences:thread',  // スレッド設定の初期表示
}

/**
 * 各キーの呼び出し状態を保持
 * trueの場合は既に実行済み
 */
const called: Record<OnceKey, boolean> = {
  [OnceKey.PreferencesThread]: false,
}

/**
 * 指定キーの処理を一度だけ実行するフック
 *
 * @param key 実行制御用のキー
 * @returns コールバックを受け取り、未実行なら実行する関数
 */
export function useCallOnce(key: OnceKey) {
  return useCallback(
    (cb: () => void) => {
      if (called[key] === true) return
      called[key] = true
      cb()
    },
    [key],
  )
}
