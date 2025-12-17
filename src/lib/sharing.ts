/**
 * 共有ユーティリティモジュール
 *
 * 【概要】
 * URLやテキストをネイティブ共有機能またはクリップボードで共有。
 * プラットフォーム間の差異を吸収した統一的なAPIを提供。
 *
 * 【プラットフォーム別動作】
 * - iOS: Share.share({url}) - URLとして共有
 * - Android: Share.share({message}) - メッセージとして共有
 * - Web: クリップボードにコピー + トースト表示
 *
 * 【iOS/Androidの違い】
 * - iOSはurlプロパティでリッチなプレビューが表示される
 * - Androidはmessageプロパティのみサポート
 *
 * 【Goユーザー向け補足】
 * - async/await: Goのgoroutineとチャネルに相当
 * - expo-clipboard: システムクリップボードへのアクセス
 * - Toast: Goのlog.Printfに相当するユーザー通知
 */
import {Share} from 'react-native'
// import * as Sharing from 'expo-sharing'
import {setStringAsync} from 'expo-clipboard'
// TODO: replace global i18n instance with one returned from useLingui -sfn
import {t} from '@lingui/macro'

import {isAndroid, isIOS} from '#/platform/detection'
import * as Toast from '#/view/com/util/Toast'

/**
 * URLを共有またはクリップボードにコピー
 *
 * 【プラットフォーム別】
 * - iOS: ネイティブ共有シート（URLプレビュー付き）
 * - Android: ネイティブ共有シート（メッセージとして）
 * - Web: クリップボードにコピー
 *
 * @param url 共有するURL
 */
export async function shareUrl(url: string) {
  if (isAndroid) {
    await Share.share({message: url})
  } else if (isIOS) {
    await Share.share({url})
  } else {
    // React Native Share is not supported by web. Web Share API
    // has increasing but not full support, so default to clipboard
    setStringAsync(url)
    Toast.show(t`Copied to clipboard`, 'clipboard-check')
  }
}

/**
 * テキストを共有またはクリップボードにコピー
 *
 * 【プラットフォーム別】
 * - iOS/Android: ネイティブ共有シート
 * - Web: クリップボードにコピー
 *
 * @param text 共有するテキスト
 */
export async function shareText(text: string) {
  if (isAndroid || isIOS) {
    await Share.share({message: text})
  } else {
    await setStringAsync(text)
    Toast.show(t`Copied to clipboard`, 'clipboard-check')
  }
}
