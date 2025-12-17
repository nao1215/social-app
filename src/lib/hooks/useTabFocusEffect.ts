/**
 * タブフォーカスエフェクトフック
 *
 * 【概要】
 * 特定のタブがアクティブ（フォーカス）になったかどうかを監視。
 * タブ切り替え時のデータ再取得やアニメーション開始に使用。
 *
 * 【動作原理】
 * 1. ルートナビゲーターの状態を取得
 * 2. 指定タブが「内部」か「外部」かを判定
 * 3. 状態変化時にコールバックを発火
 *
 * 【使用例】
 * useTabFocusEffect('HomeTab', (isInside) => {
 *   if (isInside) refetch()  // タブがアクティブになったらリフェッチ
 * })
 *
 * 【Goユーザー向け補足】
 * - while (nav.getParent()): ツリー構造を上方向に辿る
 *   Goでfor node.Parent != nilに相当
 * - useEffect: 副作用の実行（Goのgoroutineでの監視に相当）
 */
import {useEffect, useState} from 'react'
import {useNavigation} from '@react-navigation/native'

import {getTabState, TabState} from '#/lib/routes/helpers'

/**
 * タブフォーカス状態を監視するフック
 *
 * @param tabName 監視対象のタブ名（例: 'HomeTab', 'SearchTab'）
 * @param cb 状態変化時のコールバック（isInside: タブ内にいるか）
 */
export function useTabFocusEffect(
  tabName: string,
  cb: (isInside: boolean) => void,
) {
  const [isInside, setIsInside] = useState(false)

  // get root navigator state
  let nav = useNavigation()
  while (nav.getParent()) {
    nav = nav.getParent()
  }
  const state = nav.getState()

  useEffect(() => {
    // check if inside
    let v = getTabState(state, tabName) !== TabState.Outside
    if (v !== isInside) {
      // fire
      setIsInside(v)
      cb(v)
    }
  }, [state, isInside, setIsInside, tabName, cb])
}
