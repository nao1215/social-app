/**
 * ナビゲーションタブ状態フック（Web版）
 *
 * 【概要】
 * Web環境向けのタブ状態追跡フック。
 * ネイティブ版と異なり、ルート名で直接判定するシンプルな実装。
 *
 * 【ネイティブ版との違い】
 * - ネイティブ: TabStateを使用した複雑な判定
 * - Web: getCurrentRouteでルート名を取得して直接比較
 *
 * 【Web版で簡略化できる理由】
 * - Webではタブナビゲーターが存在しない
 * - 単一のスタックナビゲーターでルーティング
 * - ネストした状態の考慮が不要
 *
 * 【Goユーザー向け補足】
 * - プラットフォーム固有ファイル: .web.tsはWeb環境でのみ読み込まれる
 *   Goのビルドタグ（// +build web）に相当
 */
import {useNavigationState} from '@react-navigation/native'

import {getCurrentRoute} from '#/lib/routes/helpers'

/**
 * 各タブのアクティブ状態を取得するフック（Web版）
 *
 * @returns 各タブがアクティブかどうかのフラグオブジェクト
 */
export function useNavigationTabState() {
  return useNavigationState(state => {
    let currentRoute = state ? getCurrentRoute(state).name : 'Home'
    return {
      isAtHome: currentRoute === 'Home',
      isAtSearch: currentRoute === 'Search',
      isAtNotifications: currentRoute === 'Notifications',
      isAtMyProfile: currentRoute === 'MyProfile',
      isAtMessages: currentRoute === 'Messages',
    }
  })
}
