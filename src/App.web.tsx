/**
 * =============================================================================
 * Bluesky React Native Webアプリケーション メインエントリーポイント
 * =============================================================================
 *
 * このファイルは、BlueskyのWebアプリケーション版の起動と初期化を担当する最重要ファイルです。
 * App.native.tsx と同様の構造を持ちますが、Web専用の機能（ActiveVideoProvider等）が追加されています。
 *
 * 📋 主な役割：
 * 1. 外部サービス初期化 (Sentry、アイコン、CSSスタイル)
 * 2. プロバイダー階層の構築 (13層のProvider構造)
 * 3. アプリケーション起動フロー管理
 * 4. Web固有設定 (動画自動再生、スクロール復元等)
 * 5. 状態管理システム初期化
 *
 * 🏗️ アーキテクチャパターン：
 * - Provider パターン: React Context による依存性注入
 * - 階層構造: 上位から下位への状態伝播
 * - エラー境界: Sentry による全エラーキャッチ
 * - 遅延初期化: 必要に応じた段階的な機能読み込み
 *
 * 💡 Go開発者向け補足：
 * - このファイルはGoでいうmain関数に相当します
 * - Provider構造は依存性注入パターンの実装です
 * - useEffect は副作用を実行するためのフック（Goには直接的な対応物なし）
 */

// ログ設定とアイコンの初期化（最上部に配置必須）
import '#/logger/sentry/setup'  // Sentryエラートラッキング設定（Web版）
import '#/view/icons'            // FontAwesome等のアイコン設定
import './style.css'             // グローバルCSSスタイル（Web専用）

// React基本機能
import React, {useEffect, useState} from 'react'
// React Native基本コンポーネント（Web向けに最適化済み）
import {RootSiblingParent} from 'react-native-root-siblings'  // ルートレベルコンポーネント管理
import {SafeAreaProvider} from 'react-native-safe-area-context' // セーフエリア管理（Webでは主にモバイルブラウザ用）
// 国際化（i18n）機能
import {msg} from '@lingui/macro'      // 国際化メッセージマクロ（コンパイル時に処理）
import {useLingui} from '@lingui/react' // 国際化フック（実行時の言語切り替え等）
// エラートラッキング
import * as Sentry from '@sentry/react-native' // エラートラッキング（Web版でも同じパッケージを使用）

// ライブラリ・ユーティリティ
import {QueryProvider} from '#/lib/react-query'                    // React Query設定（サーバー状態管理）
import {Provider as StatsigProvider} from '#/lib/statsig/statsig'  // 機能フラグ管理（A/Bテスト等）
import {ThemeProvider} from '#/lib/ThemeContext'                   // テーマ管理（ダーク/ライトモード等）
import I18nProvider from '#/locale/i18nProvider'                   // 国際化プロバイダー
import {logger} from '#/logger'                                     // アプリケーションロガー

// 状態管理プロバイダー（Goのstructに相当するStateを管理）
import {Provider as A11yProvider} from '#/state/a11y'                         // アクセシビリティ状態
import {Provider as AgeAssuranceProvider} from '#/state/ageAssurance'         // 年齢確認状態
import {Provider as MutedThreadsProvider} from '#/state/cache/thread-mutes'   // ミュートしたスレッド
import {Provider as DialogStateProvider} from '#/state/dialogs'               // ダイアログ状態
import {Provider as EmailVerificationProvider} from '#/state/email-verification' // メール認証状態
import {listenSessionDropped} from '#/state/events'                           // セッション切断イベント監視

// 位置情報プロバイダー（地理的制限・年齢確認用）
import {
  beginResolveGeolocationConfig,
  ensureGeolocationConfigIsResolved,
  Provider as GeolocationProvider,
} from '#/state/geolocation'

// その他の状態管理プロバイダー
import {Provider as HomeBadgeProvider} from '#/state/home-badge'                      // ホームバッジ状態
import {Provider as InvitesStateProvider} from '#/state/invites'                      // 招待状態
import {Provider as LightboxStateProvider} from '#/state/lightbox'                    // ライトボックス状態
import {MessagesProvider} from '#/state/messages'                                     // メッセージ状態
import {Provider as ModalStateProvider} from '#/state/modals'                         // モーダル状態
import {init as initPersistedState} from '#/state/persisted'                         // 永続化状態初期化
import {Provider as PrefsStateProvider} from '#/state/preferences'                    // 設定状態
import {Provider as LabelDefsProvider} from '#/state/preferences/label-defs'          // ラベル定義
import {Provider as ModerationOptsProvider} from '#/state/preferences/moderation-opts' // モデレーション設定
import {Provider as UnreadNotifsProvider} from '#/state/queries/notifications/unread' // 未読通知
import {Provider as ServiceConfigProvider} from '#/state/service-config'              // サービス設定

// セッション管理（認証・アカウント管理）
import {
  Provider as SessionProvider,
  type SessionAccount,
  useSession,
  useSessionApi,
} from '#/state/session'
import {readLastActiveAccount} from '#/state/session/util'  // 最後のアクティブアカウント取得

// シェル状態管理（UI全体の状態）
import {Provider as ShellStateProvider} from '#/state/shell'                         // シェル状態
import {Provider as ComposerProvider} from '#/state/shell/composer'                  // 投稿作成状態
import {Provider as LoggedOutViewProvider} from '#/state/shell/logged-out'           // ログアウト画面状態
import {Provider as ProgressGuideProvider} from '#/state/shell/progress-guide'       // 進捗ガイド状態
import {Provider as SelectedFeedProvider} from '#/state/shell/selected-feed'         // 選択フィード状態
import {Provider as StarterPackProvider} from '#/state/shell/starter-pack'           // スターターパック状態
import {Provider as HiddenRepliesProvider} from '#/state/threadgate-hidden-replies'  // 非表示リプライ状態

// UIコンポーネント
import * as Toast from '#/view/com/util/Toast'                // トースト通知ユーティリティ
import {Shell} from '#/view/shell/index'                      // メインシェルコンポーネント（Web版）
import {ThemeProvider as Alf} from '#/alf'                    // ALFテーマプロバイダー
import {useColorModeTheme} from '#/alf/util/useColorModeTheme' // カラーモードテーマフック
import {Provider as ContextMenuProvider} from '#/components/ContextMenu' // コンテキストメニュープロバイダー
import {NuxDialogs} from '#/components/dialogs/nuxs'          // 新規ユーザー体験ダイアログ
import {useStarterPackEntry} from '#/components/hooks/useStarterPackEntry' // スターターパック参照フック
import {Provider as IntentDialogProvider} from '#/components/intents/IntentDialogs' // インテントダイアログプロバイダー
import {Provider as PolicyUpdateOverlayProvider} from '#/components/PolicyUpdateOverlay' // ポリシー更新オーバーレイ
import {Provider as PortalProvider} from '#/components/Portal' // ポータルコンポーネントプロバイダー
// Web専用：動画再生制御プロバイダー
import {Provider as ActiveVideoProvider} from '#/components/Post/Embed/VideoEmbed/ActiveVideoWebContext'
import {Provider as VideoVolumeProvider} from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext'
import {ToastOutlet} from '#/components/Toast'                // トースト通知出力先

// ネイティブモジュール（Webでも共通のインターフェースを提供）
import {BackgroundNotificationPreferencesProvider} from '../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'
import {Provider as HideBottomBarBorderProvider} from './lib/hooks/useHideBottomBarBorder'

/**
 * 位置情報の設定を可能な限り早期に開始
 * アプリの起動と並行して位置情報の許可状況などを確認
 * （Webでは主にIPアドレスベースの地理的位置推定を使用）
 */
beginResolveGeolocationConfig()

/**
 * =============================================================================
 * InnerApp - アプリケーション内部コンポーネント
 * =============================================================================
 *
 * このコンポーネントは、Providerツリーの内側で実行される実際のアプリケーションロジックです。
 *
 * 🎯 主要機能：
 * 1. アプリケーション初期化フロー管理
 * 2. セッション復旧処理（ローカルストレージからのトークン復元）
 * 3. エラーハンドリングとログ出力
 * 4. Web固有の設定適用
 *
 * 🔄 初期化シーケンス：
 * 1. 永続化された最終アカウント情報取得（localStorage/MMKV）
 * 2. セッション復旧試行（JWTトークンの検証とリフレッシュ）
 * 3. エラーハンドリング
 * 4. UI準備完了フラグ設定
 * 5. メインUI表示
 *
 * 💡 Go開発者向け補足：
 * - useStateは状態変数を管理するフック（Goの変数宣言に相当）
 * - useEffectは副作用を実行するフック（Goでいうinitmメソッドやgoroutineでのセットアップ処理に相当）
 * - async/awaitは非同期処理（Goのgoroutineとchannelの組み合わせに相当）
 */
function InnerApp() {
  // 🔧 状態変数の初期化（Goの変数宣言に相当）
  const [isReady, setIsReady] = React.useState(false)    // アプリ準備完了フラグ
  const {currentAccount} = useSession()                  // 現在のアカウント情報取得
  const {resumeSession} = useSessionApi()                // セッション復旧API
  const theme = useColorModeTheme()                     // カラーモードテーマ取得
  const {_} = useLingui()                               // 国際化文字列取得関数
  const hasCheckedReferrer = useStarterPackEntry()      // リファラーチェック完了フラグ

  /**
   * アプリ初期化処理
   *
   * 💡 Go開発者向け補足：
   * - useEffectはコンポーネントのマウント時や依存配列の値が変更された時に実行されます
   * - 第2引数の依存配列([resumeSession])が変更された時のみ再実行されます
   * - Goでいうinit関数やgoroutineでのセットアップ処理に相当します
   */
  useEffect(() => {
    /**
     * アプリ起動時の非同期初期化処理
     *
     * この関数は以下の順序で実行されます：
     * 1. 永続化されたアカウント情報の取得（localStorage/MMKV）
     * 2. セッション復旧の試行（JWTトークンの検証）
     * 3. エラーハンドリングとログ出力
     * 4. UI準備完了の通知
     *
     * 💡 Go開発者向け補足：
     * - async/awaitは非同期処理の構文糖衣（Goのgoroutineに相当）
     * - try/catch/finallyはエラーハンドリング（Goのdefer、recover、panicに相当）
     *
     * @param account - 復旧対象のアカウント情報（オプション）
     */
    async function onLaunch(account?: SessionAccount) {
      try {
        if (account) {
          // 🔐 セッション復旧フロー
          // 保存されたJWTトークンの有効性確認とリフレッシュを試行
          await resumeSession(account)
        }
      } catch (e) {
        // 🚨 セッション復旧失敗時のエラーハンドリング
        // ネットワークエラー、トークン期限切れ、サーバーエラー等を記録
        logger.error(`session: resumeSession failed`, {message: e})
      } finally {
        // ✅ 初期化処理完了をマーク
        // 成功・失敗に関わらずUI表示を開始
        setIsReady(true)
      }
    }

    // 💾 最後にアクティブだったアカウント情報を取得して起動処理実行
    // localStorage（Web）またはMMKV（ネイティブ）から永続化されたセッション情報を復元
    const account = readLastActiveAccount()
    onLaunch(account)
  }, [resumeSession])

  /**
   * セッション切断の監視設定
   *
   * 💡 Go開発者向け補足：
   * - useEffectの戻り値は cleanup 関数（Goのdeferに相当）
   * - コンポーネントがアンマウントされる時に実行されます
   */
  useEffect(() => {
    /**
     * 🔐 セッション切断監視システム
     *
     * サーバーからの401応答、JWTトークンの期限切れ、
     * ネットワーク切断などを検出してユーザーに通知します。
     */
    return listenSessionDropped(() => {
      // セッションが切断された場合にトースト通知を表示
      Toast.show(
        _(msg`Sorry! Your session expired. Please sign in again.`),
        'info',
      )
    })
  }, [_])

  /**
   * アプリとリファラーチェックの両方が完了するまで何も表示しない
   * （スプラッシュスクリーンはネイティブ版でのみ使用されるため、Webでは単純にnullを返す）
   */
  if (!isReady || !hasCheckedReferrer) return null

  /**
   * プロバイダーの入れ子構造でアプリ全体の状態管理を構築
   *
   * 💡 Go開発者向け補足：
   * - この階層構造はProviderパターンの実装です
   * - 各Providerは特定の状態や機能をReact Contextを通じて子コンポーネントに提供します
   * - Goでいう依存性注入（Dependency Injection）パターンに相当します
   * - 上位のProviderで提供された値は下位の全てのコンポーネントから利用可能です
   */
  return (
    <Alf theme={theme}>
      <ThemeProvider theme={theme}>
        <ContextMenuProvider>
          <RootSiblingParent>
            <VideoVolumeProvider>
              {/* Web専用：複数の動画が同時に再生されないように制御 */}
              <ActiveVideoProvider>
                {/*
                  currentAccount.didが変更されるとコンポーネントツリー全体をリセット
                  これによりアカウント切り替え時に状態をクリーンアップ
                  💡 Go開発者向け補足：
                  - keyプロパティは、Reactがコンポーネントを識別するための一意な値です
                  - keyが変更されると、Reactは古いコンポーネントを破棄し、新しいコンポーネントを作成します
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
                                💡 Go開発者向け補足：この順序依存性はGoでの初期化順序と同様の概念です
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
                                                <SafeAreaProvider>
                                                  <ProgressGuideProvider>
                                                    <ServiceConfigProvider>
                                                      <EmailVerificationProvider>
                                                        <HideBottomBarBorderProvider>
                                                          <IntentDialogProvider>
                                                            <Shell />         {/* メインアプリUI */}
                                                            <NuxDialogs />    {/* 新規ユーザー体験ダイアログ */}
                                                            <ToastOutlet />   {/* トースト通知表示エリア */}
                                                          </IntentDialogProvider>
                                                        </HideBottomBarBorderProvider>
                                                      </EmailVerificationProvider>
                                                    </ServiceConfigProvider>
                                                  </ProgressGuideProvider>
                                                </SafeAreaProvider>
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
              </ActiveVideoProvider>
            </VideoVolumeProvider>
          </RootSiblingParent>
        </ContextMenuProvider>
      </ThemeProvider>
    </Alf>
  )
}

/**
 * =============================================================================
 * App - メインエントリーコンポーネント
 * =============================================================================
 *
 * セッション状態に依存しない基本的なプロバイダーを設定します。
 *
 * 💡 Go開発者向け補足：
 * - このコンポーネントはGoでいうmain関数に相当します
 * - export defaultは他のファイルからこのコンポーネントをインポートできるようにします
 * - Sentry.wrap()はエラートラッキングのためにコンポーネントをラップします
 */
function App() {
  const [isReady, setReady] = useState(false)  // アプリの基本準備完了フラグ

  /**
   * 基本的な初期化処理
   *
   * 💡 Go開発者向け補足：
   * - React.useEffectは空の依存配列([])を指定するとマウント時に1回だけ実行されます
   * - これはGoのinit関数に相当します
   */
  React.useEffect(() => {
    // 基本的な初期化処理を並行実行
    // 💡 Go開発者向け補足：Promise.allはGoのsync.WaitGroupに相当します
    Promise.all([
      initPersistedState(),              // 永続化された状態の初期化（localStorage/MMKV）
      ensureGeolocationConfigIsResolved(), // 位置情報設定の解決完了まで待機
    ]).then(() => setReady(true))
  }, [])

  // 基本初期化が完了していない場合は何も表示しない
  if (!isReady) {
    return null
  }

  /**
   * 注意：ここにはセッション状態や他のデータに依存するものは配置できません
   * それらはInnerAppコンポーネント内で設定されます
   *
   * 💡 Go開発者向け補足：
   * - この階層構造は依存性の初期化順序を制御しています
   * - GeolocationProvider等の基本的なプロバイダーが先に初期化され、
   *   その後SessionProviderやInnerAppが初期化されます
   */
  return (
    <GeolocationProvider>       {/* 位置情報プロバイダー */}
      <A11yProvider>            {/* アクセシビリティプロバイダー */}
        <SessionProvider>       {/* セッション管理プロバイダー */}
          <PrefsStateProvider>  {/* 設定状態プロバイダー */}
            <I18nProvider>      {/* 国際化プロバイダー */}
              <ShellStateProvider>    {/* シェル状態プロバイダー */}
                <InvitesStateProvider>  {/* 招待状態プロバイダー */}
                  <ModalStateProvider>  {/* モーダル状態プロバイダー */}
                    <DialogStateProvider>  {/* ダイアログ状態プロバイダー */}
                      <LightboxStateProvider>  {/* ライトボックス状態プロバイダー */}
                        <PortalProvider>       {/* ポータルプロバイダー */}
                          <StarterPackProvider>  {/* スターターパックプロバイダー */}
                            <InnerApp />  {/* セッション依存のUIコンポーネント */}
                          </StarterPackProvider>
                        </PortalProvider>
                      </LightboxStateProvider>
                    </DialogStateProvider>
                  </ModalStateProvider>
                </InvitesStateProvider>
              </ShellStateProvider>
            </I18nProvider>
          </PrefsStateProvider>
        </SessionProvider>
      </A11yProvider>
    </GeolocationProvider>
  )
}

/**
 * SentryでAppコンポーネントをラップしてエラートラッキングを有効化
 *
 * 💡 Go開発者向け補足：
 * - Sentry.wrap()は高階関数（Higher-Order Function）の一例です
 * - Goでいうミドルウェアパターンに相当します
 * - 全てのエラーをキャッチしてSentryに送信します
 */
export default Sentry.wrap(App)
