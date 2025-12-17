/**
 * 画面タイトル設定フック
 *
 * 【概要】
 * 画面のタイトルを動的に設定するフック。
 * 未読通知数をタイトルに含めてブラウザタブに表示。
 *
 * 【タイトル形式】
 * - 未読あり: "(3) ホーム | Bluesky"
 * - 未読なし: "ホーム | Bluesky"
 *
 * 【使用例】
 * useSetTitle('プロフィール')
 * // → ブラウザタブに "(5) プロフィール | Bluesky" と表示
 *
 * 【動的更新】
 * - title変更時に自動更新
 * - numUnread変更時に自動更新（通知受信時など）
 *
 * 【Goユーザー向け補足】
 * - navigation.setOptions: ナビゲーターのオプション更新
 *   Goのhttp.ResponseHeaderの設定に類似
 * - useEffect: 副作用の実行（Goのdeferとは異なり、依存値変更時に再実行）
 */
import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {bskyTitle} from '#/lib/strings/headings'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'

/**
 * 画面タイトルを設定するフック
 *
 * @param title 設定するタイトル（省略時は何もしない）
 */
export function useSetTitle(title?: string) {
  const navigation = useNavigation<NavigationProp>()
  const numUnread = useUnreadNotifications()
  useEffect(() => {
    if (title) {
      navigation.setOptions({title: bskyTitle(title, numUnread)})
    }
  }, [title, navigation, numUnread])
}
