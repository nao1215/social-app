/**
 * @file Deactivated.tsx
 * @description アカウント無効化画面コンポーネント
 *
 * ユーザーが自身のアカウントを無効化した後に表示される画面。
 * アカウントの再アクティベーション機能を提供し、他のアカウントへの切り替えや
 * 新規サインインも可能にする。
 *
 * 主な機能:
 * - アカウントの再アクティベーション
 * - アカウント切り替え
 * - ログアウト機能
 * - 新規アカウント追加
 *
 * Go開発者向け補足:
 * - React.useState: Goのローカル変数に相当するが、値の変更時にUIが自動的に再描画される
 * - React.useCallback: 関数のメモ化。依存配列の値が変わらない限り同じ関数インスタンスを返す
 * - React.useMemo: 計算結果のメモ化。パフォーマンス最適化に使用
 * - useFocusEffect: コンポーネントがフォーカスされた時に実行される副作用（Goの defer に似ているがタイミングが異なる）
 */

// React関連のインポート - Reactフレームワークとネイティブコンポーネント
import React from 'react'
import {View} from 'react-native'
// セーフエリア - デバイスのノッチやホームインジケータを避けるための情報
import {useSafeAreaInsets} from 'react-native-safe-area-context'
// 国際化関連 - メッセージ、翻訳コンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// ナビゲーション関連 - 画面フォーカス時の効果フック
import {useFocusEffect} from '@react-navigation/native'
// データキャッシュ - TanStack Queryのキャッシュ管理
import {useQueryClient} from '@tanstack/react-query'

// アカウント切り替え - マルチアカウント機能のフック
import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
// ロギング - アプリケーションログ出力
import {logger} from '#/logger'
// プラットフォーム検出 - Web環境の判定
import {isWeb} from '#/platform/detection'
// セッション管理 - アカウント型定義、エージェント、セッション状態、セッションAPI
// Go開発者向け: これらはGoのstructとメソッドレシーバーに相当
import {
  type SessionAccount,
  useAgent,
  useSession,
  useSessionApi,
} from '#/state/session'
// UI状態管理 - 最小シェルモード設定（ヘッダー/フッターの表示制御）
import {useSetMinimalShellMode} from '#/state/shell'
// ログアウトビュー - ログアウト状態のUI制御
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
// ロゴコンポーネント - アプリケーションロゴ
import {Logo} from '#/view/icons/Logo'
// スタイリングシステム - CSSアトムとテーマ
import {atoms as a, useTheme} from '#/alf'
// アカウントリスト - マルチアカウント選択UI
import {AccountList} from '#/components/AccountList'
// ボタンコンポーネント - 基本ボタン、アイコン、テキスト
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// 区切り線 - セクション区切りのUI要素
import {Divider} from '#/components/Divider'
// 情報アイコン - サークル形の情報アイコン
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
// レイアウトコンポーネント - 画面レイアウト構造
import * as Layout from '#/components/Layout'
// ローダー - 読み込み中インジケーター
import {Loader} from '#/components/Loader'
// タイポグラフィ - テキストコンポーネント
import {Text} from '#/components/Typography'

// レイアウト定数 - コンテンツの最大幅（ピクセル単位）
const COL_WIDTH = 400

/**
 * アカウント無効化画面コンポーネント
 *
 * 無効化されたアカウントの再アクティベーション、または他のアカウントへの
 * 切り替え機能を提供する画面。
 *
 * 画面構成:
 * 1. ロゴとウェルカムメッセージ
 * 2. アクティベーションボタンとキャンセルボタン
 * 3. エラー表示エリア
 * 4. アカウント切り替えリスト または 新規サインインボタン
 *
 * Go開発者向け:
 * - この関数はGoの関数と同じだが、JSXを返すことでUIを描画する
 * - React.useState()は状態変数を作成し、変更時にUIが自動再描画される
 */
export function Deactivated() {
  // 国際化フック - UI文字列の翻訳（Go開発者向け: i18nライブラリに相当）
  const {_} = useLingui()
  // テーマフック - カラーとスタイルの管理
  const t = useTheme()
  // セーフエリア - デバイスのノッチやホームインジケータの情報
  const insets = useSafeAreaInsets()
  // セッション情報 - 現在のアカウントと全アカウントリスト
  const {currentAccount, accounts} = useSession()
  // アカウント切り替え - マルチアカウント機能のハンドラー
  const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
  // ログアウトビュー制御 - ログイン画面の表示制御
  const {setShowLoggedOut} = useLoggedOutViewControls()
  // 他のアカウントの有無判定 - UIの分岐に使用
  const hasOtherAccounts = accounts.length > 1
  // 最小シェルモード設定 - ヘッダー/フッターの表示制御
  const setMinimalShellMode = useSetMinimalShellMode()
  // セッションAPI - ログアウト機能
  const {logoutCurrentAccount} = useSessionApi()
  // エージェント - AT Protocol APIクライアント（Go開発者向け: HTTPクライアントに相当）
  const agent = useAgent()
  // 処理中状態 - アクティベート処理の実行状態（Go開発者向け: boolのポインタに似ているが、UIと連動）
  const [pending, setPending] = React.useState(false)
  // エラー状態 - エラーメッセージの保持（Go開発者向け: error型に相当）
  const [error, setError] = React.useState<string | undefined>()
  // クエリクライアント - TanStack Queryのキャッシュ管理
  const queryClient = useQueryClient()

  /**
   * 画面フォーカス時の効果
   * 画面が表示される度に最小シェルモードを有効化
   *
   * Go開発者向け:
   * - useFocusEffectは画面がフォーカスされた時とフォーカスが外れた時に実行される
   * - React.useCallbackは関数をメモ化し、依存配列が変わらない限り同じ関数を返す
   */
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(true)
    }, [setMinimalShellMode]),
  )

  /**
   * アカウント選択時のコールバック
   * 別のアカウントを選択した場合にアカウント切り替えを実行
   *
   * @param account - 選択されたアカウント情報
   *
   * Go開発者向け:
   * - React.useCallbackは不要な再レンダリングを防ぐためのメモ化
   * - 依存配列[currentAccount, onPressSwitchAccount]の値が変わらない限り同じ関数インスタンスを返す
   */
  const onSelectAccount = React.useCallback(
    (account: SessionAccount) => {
      // 現在のアカウントと異なる場合のみ切り替え実行
      if (account.did !== currentAccount?.did) {
        onPressSwitchAccount(account, 'SwitchAccount')
      }
    },
    [currentAccount, onPressSwitchAccount],
  )

  /**
   * アカウント追加ボタン押下時のコールバック
   * ログイン画面を表示してアカウント追加フローを開始
   */
  const onPressAddAccount = React.useCallback(() => {
    setShowLoggedOut(true)
  }, [setShowLoggedOut])

  /**
   * ログアウトボタン押下時のコールバック
   * 現在のアカウントからサインアウトし、Web版では履歴をリセット
   *
   * Go開発者向け:
   * - Web版とモバイル版で挙動が異なる条件分岐
   * - Web版ではブラウザ履歴を手動で操作
   */
  const onPressLogout = React.useCallback(() => {
    if (isWeb) {
      // Web版の場合: アカウント切り替えでアプリ全体が再マウントされる
      // モバイルでは自動的にホーム画面に戻るが、Web版ではURLもリセットする必要がある
      // navigate()呼び出しでは間に合わないため（ナビゲーター自体がアンマウントされる）、
      // 手動でURLを変更。ナビゲーターは再マウント時にこれを検出する
      history.pushState(null, '', '/')
    }
    logoutCurrentAccount('Deactivated')
  }, [logoutCurrentAccount])

  /**
   * アカウントアクティベート処理
   * 無効化されたアカウントを再度有効化し、セッションを再開
   *
   * 処理フロー:
   * 1. API呼び出しでアカウントをアクティベート
   * 2. クエリキャッシュをリセット（古いデータを破棄）
   * 3. セッションを再開
   *
   * エラーハンドリング:
   * - "Bad token scope": アプリパスワードでサインインしている場合のエラー
   * - その他: 一般的なエラー
   *
   * Go開発者向け:
   * - async/awaitはGoのgoroutineとは異なり、非同期処理を順序通りに書ける構文糖衣
   * - try/catch/finallyはGoのdefer + errorチェックに相当
   */
  const handleActivate = React.useCallback(async () => {
    try {
      setPending(true) // ローディング状態開始
      // AT Protocolのアクティベートエンドポイントを呼び出し
      await agent.com.atproto.server.activateAccount()
      // 全クエリキャッシュをリセット（古いデータを破棄）
      await queryClient.resetQueries()
      // セッションを再開（新しいトークンで認証）
      await agent.resumeSession(agent.session!)
    } catch (e: any) {
      // エラーメッセージに応じて適切なエラーテキストを設定
      switch (e.message) {
        case 'Bad token scope':
          // アプリパスワードエラー - メインパスワードが必要
          setError(
            _(
              msg`You're signed in with an App Password. Please sign in with your main password to continue deactivating your account.`,
            ),
          )
          break
        default:
          // 一般的なエラー
          setError(_(msg`Something went wrong, please try again`))
          break
      }

      // エラーログを記録（デバッグ用）
      logger.error(e, {
        message: 'Failed to activate account',
      })
    } finally {
      // 成功・失敗に関わらずローディング状態を終了
      setPending(false)
    }
  }, [_, agent, setPending, setError, queryClient])

  return (
    <View style={[a.util_screen_outer, a.flex_1]}>
      <Layout.Content
        ignoreTabletLayoutOffset
        contentContainerStyle={[
          a.px_2xl,
          {
            paddingTop: isWeb ? 64 : insets.top + 16,
            paddingBottom: isWeb ? 64 : insets.bottom,
          },
        ]}>
        <View
          style={[a.w_full, {marginHorizontal: 'auto', maxWidth: COL_WIDTH}]}>
          <View style={[a.w_full, a.justify_center, a.align_center, a.pb_5xl]}>
            <Logo width={40} />
          </View>

          <View style={[a.gap_xs, a.pb_3xl]}>
            <Text style={[a.text_xl, a.font_bold, a.leading_snug]}>
              <Trans>Welcome back!</Trans>
            </Text>
            <Text style={[a.text_sm, a.leading_snug]}>
              <Trans>
                You previously deactivated @{currentAccount?.handle}.
              </Trans>
            </Text>
            <Text style={[a.text_sm, a.leading_snug, a.pb_md]}>
              <Trans>
                You can reactivate your account to continue logging in. Your
                profile and posts will be visible to other users.
              </Trans>
            </Text>

            <View style={[a.gap_sm]}>
              <Button
                label={_(msg`Reactivate your account`)}
                size="large"
                variant="solid"
                color="primary"
                onPress={handleActivate}>
                <ButtonText>
                  <Trans>Yes, reactivate my account</Trans>
                </ButtonText>
                {pending && <ButtonIcon icon={Loader} position="right" />}
              </Button>
              <Button
                label={_(msg`Cancel reactivation and sign out`)}
                size="large"
                variant="solid"
                color="secondary"
                onPress={onPressLogout}>
                <ButtonText>
                  <Trans>Cancel</Trans>
                </ButtonText>
              </Button>
            </View>

            {error && (
              <View
                style={[
                  a.flex_row,
                  a.gap_sm,
                  a.mt_md,
                  a.p_md,
                  a.rounded_sm,
                  t.atoms.bg_contrast_25,
                ]}>
                <CircleInfo size="md" fill={t.palette.negative_400} />
                <Text style={[a.flex_1, a.leading_snug]}>{error}</Text>
              </View>
            )}
          </View>

          <View style={[a.pb_3xl]}>
            <Divider />
          </View>

          {hasOtherAccounts ? (
            <>
              <Text
                style={[t.atoms.text_contrast_medium, a.pb_md, a.leading_snug]}>
                <Trans>Or, sign in to one of your other accounts.</Trans>
              </Text>
              <AccountList
                onSelectAccount={onSelectAccount}
                onSelectOther={onPressAddAccount}
                otherLabel={_(msg`Add account`)}
                pendingDid={pendingDid}
              />
            </>
          ) : (
            <>
              <Text
                style={[t.atoms.text_contrast_medium, a.pb_md, a.leading_snug]}>
                <Trans>Or, continue with another account.</Trans>
              </Text>
              <Button
                label={_(msg`Sign in or create an account`)}
                size="large"
                variant="solid"
                color="secondary"
                onPress={() => setShowLoggedOut(true)}>
                <ButtonText>
                  <Trans>Sign in or create an account</Trans>
                </ButtonText>
              </Button>
            </>
          )}
        </View>
      </Layout.Content>
    </View>
  )
}
