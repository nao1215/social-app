import {useCallback} from 'react'
import {Linking} from 'react-native'
import * as WebBrowser from 'expo-web-browser'

import {logEvent} from '#/lib/statsig/statsig'
import {
  createBskyAppAbsoluteUrl,
  createProxiedUrl,
  isBskyAppUrl,
  isBskyRSSUrl,
  isRelativeUrl,
  toNiceDomain,
} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {useInAppBrowser} from '#/state/preferences/in-app-browser'
import {useTheme} from '#/alf'
import {useDialogContext} from '#/components/Dialog'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'

/**
 * リンクオープン管理フック
 *
 * 【主な機能】
 * - 内部ブラウザまたは外部ブラウザでリンクを開く機能
 * - Blueskyアプリ内URLとRSSフィードURLの特別な処理
 * - ユーザーの設定に基づくブラウザ選択とアクセス許可管理
 * - プロキシ経由でのURL配信とクリック統計の記録
 *
 * 【使用場面】
 * - 投稿やプロフィール内のリンククリック処理
 * - ブラウザ設定に基づく適切なブラウザの選択
 * - 初回アクセス時のブラウザ選択同意ダイアログ表示
 *
 * 【技術的詳細】
 * - Expo WebBrowserを使用した内部ブラウザ統合
 * - React Native Linkingとのフォールバック機能
 * - ダイアログ状態管理とネストしたダイアログの回避
 * - iOS Page Sheetスタイルとテーマカラー連携
 *
 * @returns リンクを開くための非同期関数
 */
export function useOpenLink() {
  const enabled = useInAppBrowser()
  const t = useTheme()
  const sheetWrapper = useSheetWrapper()
  const dialogContext = useDialogContext()
  const {inAppBrowserConsentControl} = useGlobalDialogsControlContext()

  // リンクを開くメイン関数（設定と条件に基づく分岐処理）
  const openLink = useCallback(
    async (url: string, override?: boolean, shouldProxy?: boolean) => {
      if (isBskyRSSUrl(url) && isRelativeUrl(url)) {
        url = createBskyAppAbsoluteUrl(url)
      }

      if (!isBskyAppUrl(url)) {
        logEvent('link:clicked', {
          domain: toNiceDomain(url),
          url,
        })

        if (shouldProxy) {
          url = createProxiedUrl(url)
        }
      }

      if (isNative && !url.startsWith('mailto:')) {
        if (override === undefined && enabled === undefined) {
          // consent dialog is a global dialog, and while it's possible to nest dialogs,
          // the actual components need to be nested. sibling dialogs on iOS are not supported.
          // thus, check if we're in a dialog, and if so, close the existing dialog before opening the
          // consent dialog -sfn
          if (dialogContext.isWithinDialog) {
            dialogContext.close(() => {
              inAppBrowserConsentControl.open(url)
            })
          } else {
            inAppBrowserConsentControl.open(url)
          }
          return
        } else if (override ?? enabled) {
          await sheetWrapper(
            WebBrowser.openBrowserAsync(url, {
              presentationStyle:
                WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
              toolbarColor: t.atoms.bg.backgroundColor,
              controlsColor: t.palette.primary_500,
              createTask: false,
            }).catch(err => {
              if (__DEV__)
                logger.error('Could not open web browser', {message: err})
              Linking.openURL(url)
            }),
          )
          return
        }
      }
      // デフォルト: システムのデフォルトブラウザで開く
      Linking.openURL(url)
    },
    [enabled, inAppBrowserConsentControl, t, sheetWrapper, dialogContext],
  )

  return openLink
}
