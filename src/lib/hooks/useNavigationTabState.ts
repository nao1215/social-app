/**
 * ナビゲーションタブ状態フック
 *
 * 【概要】
 * 現在どのタブがアクティブかを追跡するフック。
 * ボトムナビゲーションのアイコンハイライトや条件付きレンダリングに使用。
 *
 * 【追跡するタブ】
 * - Home: ホームタイムライン
 * - Search: 検索画面
 * - Feeds: フィード一覧
 * - Bookmarks: ブックマーク
 * - Notifications: 通知画面
 * - MyProfile: 自分のプロフィール
 * - Messages: DM画面
 *
 * 【ハック対応】
 * ハイドレーション前の状態で全てfalseになる問題への対策として、
 * 全falseの場合はisAtHome=trueを強制設定。
 *
 * 【Goユーザー向け補足】
 * - useNavigationState: ナビゲーション状態へのセレクターアクセス
 *   Goのチャネル受信でフィルタリングするパターンに類似
 * - ハイドレーション: サーバー/クライアント間の状態同期
 */
import {useNavigationState} from '@react-navigation/native'

import {getTabState, TabState} from '#/lib/routes/helpers'

/**
 * 各タブのアクティブ状態を取得するフック
 *
 * @returns 各タブがアクティブかどうかのフラグオブジェクト
 */
export function useNavigationTabState() {
  return useNavigationState(state => {
    const res = {
      isAtHome: getTabState(state, 'Home') !== TabState.Outside,
      isAtSearch: getTabState(state, 'Search') !== TabState.Outside,
      // FeedsTab no longer exists, but this check works for `Feeds` screen as well
      isAtFeeds: getTabState(state, 'Feeds') !== TabState.Outside,
      isAtBookmarks: getTabState(state, 'Bookmarks') !== TabState.Outside,
      isAtNotifications:
        getTabState(state, 'Notifications') !== TabState.Outside,
      isAtMyProfile: getTabState(state, 'MyProfile') !== TabState.Outside,
      isAtMessages: getTabState(state, 'Messages') !== TabState.Outside,
    }

    if (
      !res.isAtHome &&
      !res.isAtSearch &&
      !res.isAtFeeds &&
      !res.isAtNotifications &&
      !res.isAtMyProfile &&
      !res.isAtMessages
    ) {
      // HACK for some reason useNavigationState will give us pre-hydration results
      //      and not update after, so we force isAtHome if all came back false
      //      -prf
      res.isAtHome = true
    }
    return res
  })
}
