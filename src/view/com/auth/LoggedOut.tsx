/**
 * ログアウト画面モジュール
 *
 * このモジュールは、ユーザーがログアウトした状態での画面遷移を管理します。
 * ログイン、新規アカウント作成、スターターパックランディングページの表示を制御します。
 *
 * @module LoggedOut
 */

// React - UIコンポーネントを構築するための基本ライブラリ（Go開発者向け: JSXと呼ばれる構文でUIを記述）
import React from 'react'
// React Native - ネイティブUIコンポーネント（Viewはレイアウトコンテナ）
import {View} from 'react-native'
// React Native Safe Area Context - デバイスのノッチやステータスバーを考慮した安全領域を取得
import {useSafeAreaInsets} from 'react-native-safe-area-context'
// Lingui - 国際化ライブラリのマクロ（msg: 翻訳可能な文字列をマーク）
import {msg} from '@lingui/macro'
// Lingui - 国際化フック（useLingui: 翻訳関数を取得）
import {useLingui} from '@lingui/react'

// PressableScale - タップ時にスケールアニメーションを実行するカスタムコンポーネント
import {PressableScale} from '#/lib/custom-animations/PressableScale'
// statsig - A/Bテストと分析イベントのロギング
import {logEvent} from '#/lib/statsig/statsig'
// ログアウト画面の状態管理フック（useLoggedOutView: 現在の状態を取得、useLoggedOutViewControls: 状態を変更）
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
// ミニマルシェルモード設定フック（ナビゲーションバーなどを非表示にする）
import {useSetMinimalShellMode} from '#/state/shell/minimal-mode'
// エラーバウンダリ - Reactエラーをキャッチして表示するコンポーネント
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
// ログイン画面コンポーネント
import {Login} from '#/screens/Login'
// 新規アカウント作成画面コンポーネント
import {Signup} from '#/screens/Signup'
// スターターパックランディング画面コンポーネント
import {LandingScreen} from '#/screens/StarterPack/StarterPackLandingScreen'
// デザインシステム（atoms: スタイルユーティリティ、native: ネイティブプラットフォーム用ヘルパー、tokens: デザイントークン、useTheme: テーマフック）
import {atoms as a, native, tokens, useTheme} from '#/alf'
// ボタンコンポーネントとアイコン付きボタン
import {Button, ButtonIcon} from '#/components/Button'
// 閉じるアイコン（X印）
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
// スプラッシュスクリーン（初回表示画面）
import {SplashScreen} from './SplashScreen'

/**
 * 画面状態の列挙型
 *
 * Go開発者向け: TypeScriptのenumはGoのiotaに似た定数定義です
 * 各画面の状態を表す定数を定義しています
 */
enum ScreenState {
  S_LoginOrCreateAccount,  // ログインまたはアカウント作成選択画面
  S_Login,                 // ログイン画面
  S_CreateAccount,         // アカウント作成画面
  S_StarterPack,          // スターターパック画面
}
export {ScreenState as LoggedOutScreenState}

/**
 * ログアウト画面コンポーネント
 *
 * ユーザーがログアウトしている場合に表示される画面。
 * ログイン、新規アカウント作成、スターターパックランディングページを表示します。
 *
 * Go開発者向け:
 * - この関数はReactコンポーネントです（HTMLのようなJSXを返す関数）
 * - onDismiss?: () => void は、オプショナルなコールバック関数（Goの func() に相当）
 *
 * @param props - コンポーネントのプロパティ（Goのstructフィールドに相当）
 * @param props.onDismiss - 画面を閉じる際のコールバック関数（オプション）
 */
export function LoggedOut({onDismiss}: {onDismiss?: () => void}) {
  // 国際化（i18n）の翻訳関数を取得
  const {_} = useLingui()
  // 現在のテーマ（ダーク/ライトモード）を取得
  const t = useTheme()
  // デバイスの安全領域（ノッチなど）のインセット値を取得
  const insets = useSafeAreaInsets()
  // ミニマルシェルモードの設定関数を取得
  const setMinimalShellMode = useSetMinimalShellMode()
  // リクエストされたアカウント切り替え情報を取得
  const {requestedAccountSwitchTo} = useLoggedOutView()

  /**
   * Go開発者向け: useState は Reactの状態管理フック
   * - 第一戻り値: 現在の状態値（screenState）
   * - 第二戻り値: 状態を更新する関数（setScreenState）
   * - 引数: 初期値または初期値を返す関数
   *
   * 画面の状態を管理（リクエストされたアカウント切り替えに基づいて初期化）
   */
  const [screenState, setScreenState] = React.useState<ScreenState>(() => {
    // 新規アカウント作成がリクエストされている場合
    if (requestedAccountSwitchTo === 'new') {
      return ScreenState.S_CreateAccount
    }
    // スターターパックがリクエストされている場合
    else if (requestedAccountSwitchTo === 'starterpack') {
      return ScreenState.S_StarterPack
    }
    // 既存アカウントへの切り替えがリクエストされている場合
    else if (requestedAccountSwitchTo != null) {
      return ScreenState.S_Login
    }
    // 何もリクエストされていない場合はデフォルトの選択画面
    else {
      return ScreenState.S_LoginOrCreateAccount
    }
  })

  // リクエストされたアカウントをクリアする関数を取得
  const {clearRequestedAccount} = useLoggedOutViewControls()

  /**
   * Go開発者向け: useEffect は副作用を実行するReactフック
   * - 第一引数: 実行する関数（副作用）
   * - 第二引数: 依存配列（配列内の値が変更された時のみ再実行）
   *
   * コンポーネントのマウント時にミニマルシェルモードを有効化
   */
  React.useEffect(() => {
    setMinimalShellMode(true)
  }, [setMinimalShellMode])

  /**
   * Go開発者向け: useCallback はメモ化されたコールバック関数を作成するReactフック
   * - 依存配列内の値が変更されない限り、同じ関数インスタンスを返す
   * - パフォーマンス最適化のために使用
   *
   * 閉じるボタンを押した時のハンドラー
   */
  const onPressDismiss = React.useCallback(() => {
    // 閉じるコールバックが提供されている場合は実行
    if (onDismiss) {
      onDismiss()
    }
    // リクエストされたアカウント情報をクリア
    clearRequestedAccount()
  }, [clearRequestedAccount, onDismiss])

  /**
   * Go開発者向け: return文の後にあるのはJSX（JavaScript XML）です
   * - HTMLのような構文でUIを記述
   * - {} 内にJavaScript式を埋め込める
   * - Goのテンプレートに似ていますが、より型安全
   */
  return (
    <View
      testID="noSessionView"
      style={[
        a.util_screen_outer,
        t.atoms.bg,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <ErrorBoundary>
        {/* ログイン/アカウント作成選択画面で、かつonDismissが提供されている場合は閉じるボタンを表示 */}
        {onDismiss && screenState === ScreenState.S_LoginOrCreateAccount ? (
          <Button
            label={_(msg`Go back`)}
            variant="solid"
            color="secondary_inverted"
            size="small"
            shape="round"
            PressableComponent={native(PressableScale)}
            style={[
              a.absolute,
              {
                top: insets.top + tokens.space.xl,
                right: tokens.space.xl,
                zIndex: 100,
              },
            ]}
            onPress={onPressDismiss}>
            <ButtonIcon icon={XIcon} />
          </Button>
        ) : null}

        {/* スターターパック画面を表示 */}
        {screenState === ScreenState.S_StarterPack ? (
          <LandingScreen setScreenState={setScreenState} />
        ) : screenState === ScreenState.S_LoginOrCreateAccount ? (
          // ログイン/アカウント作成選択画面を表示
          <SplashScreen
            onPressSignin={() => {
              setScreenState(ScreenState.S_Login)
              // ログインボタン押下イベントをログ
              logEvent('splash:signInPressed', {})
            }}
            onPressCreateAccount={() => {
              setScreenState(ScreenState.S_CreateAccount)
              // アカウント作成ボタン押下イベントをログ
              logEvent('splash:createAccountPressed', {})
            }}
          />
        ) : undefined}
        {/* ログイン画面を表示 */}
        {screenState === ScreenState.S_Login ? (
          <Login
            onPressBack={() => {
              setScreenState(ScreenState.S_LoginOrCreateAccount)
              clearRequestedAccount()
            }}
          />
        ) : undefined}
        {/* アカウント作成画面を表示 */}
        {screenState === ScreenState.S_CreateAccount ? (
          <Signup
            onPressBack={() =>
              setScreenState(ScreenState.S_LoginOrCreateAccount)
            }
          />
        ) : undefined}
      </ErrorBoundary>
    </View>
  )
}
