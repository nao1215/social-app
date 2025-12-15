/**
 * 「戻る」ナビゲーションフック
 *
 * 【概要】
 * アプリ内の「戻る」ボタン処理を統一的に提供。
 * ナビゲーション履歴がない場合はホーム画面へフォールバック。
 *
 * 【処理フロー】
 * 1. オプションのコールバック実行（onGoBack）
 * 2. 履歴がある場合 → navigation.goBack()
 * 3. 履歴がない場合 → ホームタブへナビゲート
 *
 * 【Web対応】
 * Web環境では履歴スタックの状態が異なるため、
 * ルートの存在確認を行ってからナビゲーション実行。
 *
 * 【Goユーザー向け補足】
 * - useNavigation: React Navigationの現在のナビゲーターへのアクセス
 * - StackActions: ナビゲーションスタック操作（push, pop, popToTop）
 */
import {StackActions, useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {router} from '#/routes'

/**
 * 「戻る」機能を提供するフック
 *
 * 【使用例】
 * const goBack = useGoBack(() => console.log('Going back'))
 * <Button onPress={goBack}>戻る</Button>
 *
 * @param onGoBack 戻る前に実行するコールバック（オプション）
 * @returns 戻る処理を実行する関数
 */
export function useGoBack(onGoBack?: () => unknown) {
  const navigation = useNavigation<NavigationProp>()
  return () => {
    // オプションのコールバックを実行（状態保存など）
    onGoBack?.()

    if (navigation.canGoBack()) {
      // 履歴がある場合は通常の「戻る」
      navigation.goBack()
    } else {
      // 履歴がない場合（ディープリンクからの遷移など）はホームへ
      navigation.navigate('HomeTab')

      // Web環境でのエラー回避: ルートの存在確認
      if (navigation.getState()?.routes) {
        navigation.dispatch(StackActions.push(...router.matchPath('/')))
      } else {
        navigation.navigate('HomeTab')
        navigation.dispatch(StackActions.popToTop())
      }
    }
  }
}
