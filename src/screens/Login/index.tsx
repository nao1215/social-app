import React, {useRef} from 'react'
import {KeyboardAvoidingView} from 'react-native'
import {LayoutAnimationConfig} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DEFAULT_SERVICE} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {useServiceQuery} from '#/state/queries/service'
import {type SessionAccount, useSession} from '#/state/session'
import {useLoggedOutView} from '#/state/shell/logged-out'
import {LoggedOutLayout} from '#/view/com/util/layouts/LoggedOutLayout'
import {ForgotPasswordForm} from '#/screens/Login/ForgotPasswordForm'
import {LoginForm} from '#/screens/Login/LoginForm'
import {PasswordUpdatedForm} from '#/screens/Login/PasswordUpdatedForm'
import {SetNewPasswordForm} from '#/screens/Login/SetNewPasswordForm'
import {atoms as a} from '#/alf'
import {ChooseAccountForm} from './ChooseAccountForm'
import {ScreenTransition} from './ScreenTransition'

enum Forms {
  Login,
  ChooseAccount,
  ForgotPassword,
  SetNewPassword,
  PasswordUpdated,
}

/**
 * ログイン画面メインコンポーネント
 *
 * 【主な機能】
 * - 複数のログインフォーム（ログイン、アカウント選択、パスワード再設定等）の管理
 * - フォーム間のナビゲーション制御
 * - サービスプロバイダーとの通信エラーハンドリング
 * - ログイン分析データの収集
 *
 * 【状態管理】
 * - currentForm: 現在表示中のフォーム種別
 * - serviceUrl: 使用するATプロトコルサービスURL
 * - error: エラーメッセージ表示用状態
 * - useSession: セッション管理（既存アカウント一覧）
 * - useServiceQuery: サービス情報取得クエリ
 *
 * 【外部連携】
 * - ATプロトコルサービスとの通信
 * - Statsigによるイベント分析
 * - セッション管理との連携
 *
 * @param props.onPressBack - 戻るボタン押下時のコールバック
 * @returns JSX要素 - ログイン画面のUI
 */
export const Login = ({onPressBack}: {onPressBack: () => void}) => {
  const {_} = useLingui()
  const failedAttemptCountRef = useRef(0)
  const startTimeRef = useRef(Date.now())

  const {accounts} = useSession()
  const {requestedAccountSwitchTo} = useLoggedOutView()
  const requestedAccount = accounts.find(
    acc => acc.did === requestedAccountSwitchTo,
  )

  const [error, setError] = React.useState<string>('')
  const [serviceUrl, setServiceUrl] = React.useState<string>(
    requestedAccount?.service || DEFAULT_SERVICE,
  )
  const [initialHandle, setInitialHandle] = React.useState<string>(
    requestedAccount?.handle || '',
  )
  const [currentForm, setCurrentForm] = React.useState<Forms>(
    requestedAccount
      ? Forms.Login
      : accounts.length
        ? Forms.ChooseAccount
        : Forms.Login,
  )

  const {
    data: serviceDescription,
    error: serviceError,
    refetch: refetchService,
  } = useServiceQuery(serviceUrl)

  const onSelectAccount = (account?: SessionAccount) => {
    if (account?.service) {
      setServiceUrl(account.service)
    }
    setInitialHandle(account?.handle || '')
    setCurrentForm(Forms.Login)
  }

  const gotoForm = (form: Forms) => {
    setError('')
    setCurrentForm(form)
  }

  /**
   * サービス接続エラーの監視とエラー表示制御
   * - サービスプロバイダーとの通信失敗時にユーザーフレンドリーなエラーメッセージを表示
   * - ログとStatsigイベントを送信してエラー分析データを収集
   * - 正常接続時はエラー状態をクリア
   */
  React.useEffect(() => {
    if (serviceError) {
      setError(
        _(
          msg`Unable to contact your service. Please check your Internet connection.`,
        ),
      )
      logger.warn(`Failed to fetch service description for ${serviceUrl}`, {
        error: String(serviceError),
      })
      logEvent('signin:hostingProviderFailedResolution', {})
    } else {
      setError('')
    }
  }, [serviceError, serviceUrl, _])

  const onPressForgotPassword = () => {
    setCurrentForm(Forms.ForgotPassword)
    logEvent('signin:forgotPasswordPressed', {})
  }

  const handlePressBack = () => {
    onPressBack()
    logEvent('signin:backPressed', {
      failedAttemptsCount: failedAttemptCountRef.current,
    })
  }

  /**
   * ログイン成功時の処理
   * - 成功イベントをStatsigに送信（カスタムプロバイダー使用有無、所要時間、失敗回数を記録）
   * - フォーム状態をLogin画面にリセット
   */
  const onAttemptSuccess = () => {
    logEvent('signin:success', {
      isUsingCustomProvider: serviceUrl !== DEFAULT_SERVICE,
      timeTakenSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      failedAttemptsCount: failedAttemptCountRef.current,
    })
    setCurrentForm(Forms.Login)
  }

  /**
   * ログイン失敗時の処理
   * - 失敗回数カウンターをインクリメント（分析データ用）
   */
  const onAttemptFailed = () => {
    failedAttemptCountRef.current += 1
  }

  let content = null
  let title = ''
  let description = ''

  switch (currentForm) {
    case Forms.Login:
      title = _(msg`Sign in`)
      description = _(msg`Enter your username and password`)
      content = (
        <LoginForm
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          initialHandle={initialHandle}
          setError={setError}
          onAttemptFailed={onAttemptFailed}
          onAttemptSuccess={onAttemptSuccess}
          setServiceUrl={setServiceUrl}
          onPressBack={() =>
            accounts.length ? gotoForm(Forms.ChooseAccount) : handlePressBack()
          }
          onPressForgotPassword={onPressForgotPassword}
          onPressRetryConnect={refetchService}
        />
      )
      break
    case Forms.ChooseAccount:
      title = _(msg`Sign in`)
      description = _(msg`Select from an existing account`)
      content = (
        <ChooseAccountForm
          onSelectAccount={onSelectAccount}
          onPressBack={handlePressBack}
        />
      )
      break
    case Forms.ForgotPassword:
      title = _(msg`Forgot Password`)
      description = _(msg`Let's get your password reset!`)
      content = (
        <ForgotPasswordForm
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressBack={() => gotoForm(Forms.Login)}
          onEmailSent={() => gotoForm(Forms.SetNewPassword)}
        />
      )
      break
    case Forms.SetNewPassword:
      title = _(msg`Forgot Password`)
      description = _(msg`Let's get your password reset!`)
      content = (
        <SetNewPasswordForm
          error={error}
          serviceUrl={serviceUrl}
          setError={setError}
          onPressBack={() => gotoForm(Forms.ForgotPassword)}
          onPasswordSet={() => gotoForm(Forms.PasswordUpdated)}
        />
      )
      break
    case Forms.PasswordUpdated:
      title = _(msg`Password updated`)
      description = _(msg`You can now sign in with your new password.`)
      content = (
        <PasswordUpdatedForm onPressNext={() => gotoForm(Forms.Login)} />
      )
      break
  }

  return (
    <KeyboardAvoidingView testID="signIn" behavior="padding" style={a.flex_1}>
      <LoggedOutLayout
        leadin=""
        title={title}
        description={description}
        scrollable>
        <LayoutAnimationConfig skipEntering skipExiting>
          <ScreenTransition key={currentForm}>{content}</ScreenTransition>
        </LayoutAnimationConfig>
      </LoggedOutLayout>
    </KeyboardAvoidingView>
  )
}
