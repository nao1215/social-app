/**
 * アラートダイアログ（Web版）
 * Alert Dialog (Web Version)
 *
 * 【概要】
 * Web版のアラートダイアログ実装。
 * ブラウザネイティブのalert/confirmを使用。
 *
 * 【動作】
 * - ボタンなし → window.alert()
 * - ボタンあり → window.confirm()
 *   - OK → style !== 'cancel'のボタンのonPress呼び出し
 *   - キャンセル → style === 'cancel'のボタンのonPress呼び出し
 *
 * 【Goユーザー向け補足】
 * - window.alert/confirm: ブラウザのネイティブダイアログ
 * - AlertStatic: React Nativeのアラートインターフェース
 * - Pick<T, K>: TypeScriptの部分型取得
 */

// React NativeのAlert関連型
// React Native Alert related types
import {AlertButton, AlertStatic} from 'react-native'

/**
 * Web用アラートクラス
 * Web Alert Class
 *
 * React NativeのAlertインターフェースをWeb用に実装
 */
class WebAlert implements Pick<AlertStatic, 'alert'> {
  /**
   * アラートを表示
   * Show alert
   *
   * @param title アラートタイトル / Alert title
   * @param message アラートメッセージ / Alert message
   * @param buttons ボタン配列 / Button array
   */
  public alert(title: string, message?: string, buttons?: AlertButton[]): void {
    // ボタンがない場合は単純なalert
    // Simple alert if no buttons
    if (buttons === undefined || buttons.length === 0) {
      // eslint-disable-next-line no-alert
      window.alert([title, message].filter(Boolean).join('\n'))
      return
    }

    // ボタンがある場合はconfirm
    // Use confirm if buttons exist
    // eslint-disable-next-line no-alert
    const result = window.confirm([title, message].filter(Boolean).join('\n'))

    // OKが押された場合
    // If OK was pressed
    if (result === true) {
      const confirm = buttons.find(({style}) => style !== 'cancel')
      confirm?.onPress?.()
      return
    }

    // キャンセルが押された場合
    // If Cancel was pressed
    const cancel = buttons.find(({style}) => style === 'cancel')
    cancel?.onPress?.()
  }
}

/**
 * Web用Alertインスタンス
 * Web Alert instance
 */
export const Alert = new WebAlert()
