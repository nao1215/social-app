/**
 * キーボード表示状態監視フック
 *
 * 【概要】
 * ソフトウェアキーボードの表示/非表示状態をリアクティブに追跡。
 * キーボード表示時のレイアウト調整やボタンの位置変更に使用。
 *
 * 【iOS固有のイベント】
 * - keyboardWillShow/Hide: キーボード表示開始前に発火（アニメーション対応に有用）
 * - keyboardDidShow/Hide: キーボード表示完了後に発火
 * Androidはwillイベント非対応のためdidのみ使用。
 *
 * 【使用例】
 * const [isKeyboardVisible] = useIsKeyboardVisible()
 * // キーボード表示時にボタンを隠す
 * {!isKeyboardVisible && <SubmitButton />}
 *
 * 【Goユーザー向け補足】
 * - Keyboard.addListener: イベントリスナー登録（Goのchan受信に相当）
 * - listener.remove(): クリーンアップ（Goのclose(chan)に相当）
 * - useState: 状態管理（Goの変数 + sync.Mutexに相当）
 */
import {useEffect, useState} from 'react'
import {Keyboard} from 'react-native'

import {isIOS} from '#/platform/detection'

/**
 * キーボード表示状態を追跡するフック
 *
 * @param iosUseWillEvents trueの場合、iOSでwillイベントを使用（アニメーション同期用）
 * @returns [isKeyboardVisible] キーボードが表示中かどうか
 */
export function useIsKeyboardVisible({
  iosUseWillEvents,
}: {
  iosUseWillEvents?: boolean
} = {}) {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  // NOTE
  // only iOS supports the "will" events
  // -prf
  const showEvent =
    isIOS && iosUseWillEvents ? 'keyboardWillShow' : 'keyboardDidShow'
  const hideEvent =
    isIOS && iosUseWillEvents ? 'keyboardWillHide' : 'keyboardDidHide'

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    )
    const keyboardHideListener = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    )

    return () => {
      keyboardHideListener.remove()
      keyboardShowListener.remove()
    }
  }, [showEvent, hideEvent])

  return [isKeyboardVisible]
}
