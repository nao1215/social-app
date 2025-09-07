// ログ設定とアイコンの初期化
import '#/logger/sentry/setup'       // Sentryエラートラッキング設定
import '#/logger/bitdrift/setup'     // bitdriftログ設定
import '#/view/icons'                // FontAwesome等のアイコン設定

import React, {useEffect, useState} from 'react'
import {GestureHandlerRootView} from 'react-native-gesture-handler'  // ジェスチャーハンドリング
import {RootSiblingParent} from 'react-native-root-siblings'         // ルートレベルコンポーネント管理
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context'                              // セーフエリア管理
import * as ScreenOrientation from 'expo-screen-orientation'         // 画面向き制御
import * as SplashScreen from 'expo-splash-screen'                  // スプラッシュスクリーン制御
import * as SystemUI from 'expo-system-ui'                          // システムUI制御
import {msg} from '@lingui/macro'                                   // 国際化文字列定義
import {useLingui} from '@lingui/react'                             // 国際化フック
import * as Sentry from '@sentry/react-native'                     // エラートラッキング

// フック・プロバイダー・ユーティリティ
import {KeyboardControllerProvider} from '#/lib/hooks/useEnableKeyboardController'     // キーボード制御
import {Provider as HideBottomBarBorderProvider} from '#/lib/hooks/useHideBottomBarBorder' // 下部バー境界線非表示
import {QueryProvider} from '#/lib/react-query'                                        // React Query設定
import {Provider as StatsigProvider, tryFetchGates} from '#/lib/statsig/statsig'       // 機能フラグ管理
import {s} from '#/lib/styles'                                                         // スタイル定義
import {ThemeProvider} from '#/lib/ThemeContext'                                       // テーマ管理
import I18nProvider from '#/locale/i18nProvider'                                       // 国際化プロバイダー
import {logger} from '#/logger'                                                        // ログ出力
import {isAndroid, isIOS} from '#/platform/detection'                                 // プラットフォーム判定

// 状態管理プロバイダー
import {Provider as A11yProvider} from '#/state/a11y'                                 // アクセシビリティ
import {Provider as AgeAssuranceProvider} from '#/state/ageAssurance'                 // 年齢確認
import {Provider as MutedThreadsProvider} from '#/state/cache/thread-mutes'           // ミュートしたスレッド
import {Provider as DialogStateProvider} from '#/state/dialogs'                       // ダイアログ状態
import {Provider as EmailVerificationProvider} from '#/state/email-verification'     // メール認証
import {listenSessionDropped} from '#/state/events'                                   // セッション切断監視
import {
  beginResolveGeolocationConfig,
  ensureGeolocationConfigIsResolved,
  Provider as GeolocationProvider,
} from '#/state/geolocation'                                                           // 位置情報設定
import {GlobalGestureEventsProvider} from '#/state/global-gesture-events'             // グローバルジェスチャー
import {Provider as HomeBadgeProvider} from '#/state/home-badge'                      // ホームバッジ
import {Provider as InvitesStateProvider} from '#/state/invites'                      // 招待状態
import {Provider as LightboxStateProvider} from '#/state/lightbox'                    // ライトボックス
import {MessagesProvider} from '#/state/messages'                                     // メッセージ
import {Provider as ModalStateProvider} from '#/state/modals'                         // モーダル状態
import {init as initPersistedState} from '#/state/persisted'                         // 永続化状態初期化
import {Provider as PrefsStateProvider} from '#/state/preferences'                    // 設定
import {Provider as LabelDefsProvider} from '#/state/preferences/label-defs'          // ラベル定義
import {Provider as ModerationOptsProvider} from '#/state/preferences/moderation-opts' // モデレーション設定
import {Provider as UnreadNotifsProvider} from '#/state/queries/notifications/unread' // 未読通知
import {Provider as ServiceAccountManager} from '#/state/service-config'              // サービス設定管理

// セッション管理
import {
  Provider as SessionProvider,
  type SessionAccount,
  useSession,
  useSessionApi,
} from '#/state/session'                                                              // セッション管理
import {readLastActiveAccount} from '#/state/session/util'                           // 最後のアクティブアカウント取得

// シェル状態管理
import {Provider as ShellStateProvider} from '#/state/shell'                         // シェル状態
import {Provider as ComposerProvider} from '#/state/shell/composer'                  // 投稿作成
import {Provider as LoggedOutViewProvider} from '#/state/shell/logged-out'           // ログアウト画面
import {Provider as ProgressGuideProvider} from '#/state/shell/progress-guide'       // 進捗ガイド
import {Provider as SelectedFeedProvider} from '#/state/shell/selected-feed'         // 選択フィード
import {Provider as StarterPackProvider} from '#/state/shell/starter-pack'           // スターターパック
import {Provider as HiddenRepliesProvider} from '#/state/threadgate-hidden-replies'  // 非表示リプライ

// UI コンポーネント
import {TestCtrls} from '#/view/com/testing/TestCtrls'                               // テスト制御
import * as Toast from '#/view/com/util/Toast'                                      // トースト通知
import {Shell} from '#/view/shell'                                                   // メインシェル
import {ThemeProvider as Alf} from '#/alf'                                          // ALFテーマプロバイダー
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'                      // カラーモードテーマ
import {Provider as ContextMenuProvider} from '#/components/ContextMenu'             // コンテキストメニュー
import {NuxDialogs} from '#/components/dialogs/nuxs'                                // 新規ユーザー体験ダイアログ
import {useStarterPackEntry} from '#/components/hooks/useStarterPackEntry'           // スターターパック参照
import {Provider as IntentDialogProvider} from '#/components/intents/IntentDialogs'  // インテントダイアログ
import {Provider as PolicyUpdateOverlayProvider} from '#/components/PolicyUpdateOverlay' // ポリシー更新オーバーレイ
import {Provider as PortalProvider} from '#/components/Portal'                       // ポータルコンポーネント
import {Provider as VideoVolumeProvider} from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext' // 動画音量
import {ToastOutlet} from '#/components/Toast'                                       // トースト出力先
import {Splash} from '#/Splash'                                                      // スプラッシュスクリーン

// ネイティブモジュール
import {BottomSheetProvider} from '../modules/bottom-sheet'                          // ボトムシート
import {BackgroundNotificationPreferencesProvider} from '../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider' // バックグラウンド通知設定

// アプリ起動時の初期設定
SplashScreen.preventAutoHideAsync()  // スプラッシュスクリーンを自動で非表示にしない
if (isIOS) {
  SystemUI.setBackgroundColorAsync('black')  // iOSでシステムUIの背景色を黒に設定
}
if (isAndroid) {
  // iOSはconfig pluginで処理される
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)  // Androidで縦向き固定
}

/**
 * 位置情報の設定を可能な限り早期に開始
 * アプリの起動と並行して位置情報の許可状況などを確認
 */
beginResolveGeolocationConfig()

/**
 * アプリケーションの内部コンポーネント
 * セッション状態に依存するすべてのUIがここに含まれる
 */
function InnerApp() {
  const [isReady, setIsReady] = React.useState(false)          // アプリ準備完了フラグ
  const {currentAccount} = useSession()                        // 現在のアカウント情報
  const {resumeSession} = useSessionApi()                      // セッション復旧API
  const theme = useColorModeTheme()                           // カラーモードテーマ取得
  const {_} = useLingui()                                     // 国際化文字列取得関数
  const hasCheckedReferrer = useStarterPackEntry()            // リファラーチェック完了フラグ

  // アプリ初期化処理
  useEffect(() => {
    /**
     * アプリ起動時の処理
     * @param account - 復旧するアカウント情報（オプション）
     */
    async function onLaunch(account?: SessionAccount) {
      try {
        if (account) {
          // 保存されたアカウントでセッション復旧を試行
          await resumeSession(account)
        } else {
          // アカウントがない場合は機能フラグのみ取得
          await tryFetchGates(undefined, 'prefer-fresh-gates')
        }
      } catch (e) {
        // セッション復旧に失敗した場合はエラーログを出力
        logger.error(`session: resume failed`, {message: e})
      } finally {
        // 初期化処理完了をマーク
        setIsReady(true)
      }
    }
    
    // 最後にアクティブだったアカウント情報を取得して起動処理実行
    const account = readLastActiveAccount()
    onLaunch(account)
  }, [resumeSession])

  // セッション切断の監視設定
  useEffect(() => {
    return listenSessionDropped(() => {
      // セッションが切断された場合にトースト通知を表示
      Toast.show(
        _(msg`Sorry! Your session expired. Please sign in again.`),
        'info',
      )
    })
  }, [_])

  // プロバイダーの入れ子構造でアプリ全体の状態管理を構築
  return (
    <Alf theme={theme}>
      <ThemeProvider theme={theme}>
        <ContextMenuProvider>
          {/* スプラッシュスクリーン：アプリとリファラーチェックの両方が完了まで表示 */}
          <Splash isReady={isReady && hasCheckedReferrer}>
            <RootSiblingParent>
              <VideoVolumeProvider>
                {/* 
                  currentAccount.didが変更されるとコンポーネントツリー全体をリセット
                  これによりアカウント切り替え時に状態をクリーンアップ
                */}
                <React.Fragment key={currentAccount?.did}>
                  <QueryProvider currentDid={currentAccount?.did}>
                    <PolicyUpdateOverlayProvider>
                      <StatsigProvider>
                        <AgeAssuranceProvider>
                          <ComposerProvider>
                            <MessagesProvider>
                              {/* 
                                重要：LabelDefsProviderはModerationOptsProviderより前に配置必須
                                ラベル定義がモデレーション設定で参照されるため 
                              */}
                              <LabelDefsProvider>
                                <ModerationOptsProvider>
                                  <LoggedOutViewProvider>
                                    <SelectedFeedProvider>
                                      <HiddenRepliesProvider>
                                        <HomeBadgeProvider>
                                          <UnreadNotifsProvider>
                                            <BackgroundNotificationPreferencesProvider>
                                              <MutedThreadsProvider>
                                                <ProgressGuideProvider>
                                                  <ServiceAccountManager>
                                                    <EmailVerificationProvider>
                                                      <HideBottomBarBorderProvider>
                                                        {/* ジェスチャーハンドリングのルートコンテナ */}
                                                        <GestureHandlerRootView style={s.h100pct}>
                                                          <GlobalGestureEventsProvider>
                                                            <IntentDialogProvider>
                                                              <TestCtrls />       {/* テスト用制御UI */}
                                                              <Shell />           {/* メインアプリUI */}
                                                              <NuxDialogs />      {/* 新規ユーザー体験ダイアログ */}
                                                              <ToastOutlet />     {/* トースト通知表示エリア */}
                                                            </IntentDialogProvider>
                                                          </GlobalGestureEventsProvider>
                                                        </GestureHandlerRootView>
                                                      </HideBottomBarBorderProvider>
                                                    </EmailVerificationProvider>
                                                  </ServiceAccountManager>
                                                </ProgressGuideProvider>
                                              </MutedThreadsProvider>
                                            </BackgroundNotificationPreferencesProvider>
                                          </UnreadNotifsProvider>
                                        </HomeBadgeProvider>
                                      </HiddenRepliesProvider>
                                    </SelectedFeedProvider>
                                  </LoggedOutViewProvider>
                                </ModerationOptsProvider>
                              </LabelDefsProvider>
                            </MessagesProvider>
                          </ComposerProvider>
                        </AgeAssuranceProvider>
                      </StatsigProvider>
                    </PolicyUpdateOverlayProvider>
                  </QueryProvider>
                </React.Fragment>
              </VideoVolumeProvider>
            </RootSiblingParent>
          </Splash>
        </ContextMenuProvider>
      </ThemeProvider>
    </Alf>
  )
}

/**
 * メインのAppコンポーネント
 * セッション状態に依存しない基本的なプロバイダーを設定
 */
function App() {
  const [isReady, setReady] = useState(false)  // アプリの基本準備完了フラグ

  React.useEffect(() => {
    // 基本的な初期化処理を並行実行
    Promise.all([
      initPersistedState(),              // 永続化された状態の初期化
      ensureGeolocationConfigIsResolved(), // 位置情報設定の解決完了まで待機
    ]).then(() => setReady(true))
  }, [])

  // 基本初期化が完了していない場合は何も表示しない
  if (!isReady) {
    return null
  }

  /*
   * 注意：ここにはセッション状態や他のデータに依存するものは配置できません
   * それらはInnerAppコンポーネント内で設定されます
   */
  return (
    <GeolocationProvider>             {/* 位置情報プロバイダー */}
      <A11yProvider>                  {/* アクセシビリティプロバイダー */}
        <KeyboardControllerProvider>   {/* キーボード制御プロバイダー */}
          <SessionProvider>            {/* セッション管理プロバイダー */}
            <PrefsStateProvider>       {/* 設定状態プロバイダー */}
              <I18nProvider>           {/* 国際化プロバイダー */}
                <ShellStateProvider>   {/* シェル状態プロバイダー */}
                  <InvitesStateProvider>  {/* 招待状態プロバイダー */}
                    <ModalStateProvider>  {/* モーダル状態プロバイダー */}
                      <DialogStateProvider>  {/* ダイアログ状態プロバイダー */}
                        <LightboxStateProvider>  {/* ライトボックス状態プロバイダー */}
                          <PortalProvider>       {/* ポータルプロバイダー */}
                            <BottomSheetProvider>  {/* ボトムシートプロバイダー */}
                              <StarterPackProvider>  {/* スターターパックプロバイダー */}
                                <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                                  <InnerApp />  {/* セッション依存のUIコンポーネント */}
                                </SafeAreaProvider>
                              </StarterPackProvider>
                            </BottomSheetProvider>
                          </PortalProvider>
                        </LightboxStateProvider>
                      </DialogStateProvider>
                    </ModalStateProvider>
                  </InvitesStateProvider>
                </ShellStateProvider>
              </I18nProvider>
            </PrefsStateProvider>
          </SessionProvider>
        </KeyboardControllerProvider>
      </A11yProvider>
    </GeolocationProvider>
  )
}

// SentryでAppコンポーネントをラップしてエラートラッキングを有効化
export default Sentry.wrap(App)
