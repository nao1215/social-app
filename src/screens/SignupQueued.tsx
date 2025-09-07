// React関連のインポート - Reactフレームワークとネイティブコンポーネント
import React from 'react'
import {Modal, ScrollView, View} from 'react-native'
// システムUI関連 - ステータスバーとセーフエリア
import {SystemBars} from 'react-native-edge-to-edge'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
// 国際化関連 - メッセージ、複数形、翻訳コンポーネント
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// ロギング - アプリケーションログ出力
import {logger} from '#/logger'
// プラットフォーム検出 - iOS/Web環境の判定
import {isIOS, isWeb} from '#/platform/detection'
// セッション管理 - サインアップキューの状態とエージェント
import {isSignupQueued, useAgent, useSessionApi} from '#/state/session'
// オンボーディング - 初回利用時の導線制御
import {useOnboardingDispatch} from '#/state/shell'
// ロゴコンポーネント - アプリケーションロゴ
import {Logo} from '#/view/icons/Logo'
// スタイリングシステム - CSSアトム、ブレークポイント、テーマ
import {atoms as a, native, useBreakpoints, useTheme, web} from '#/alf'
// ボタンコンポーネント - 基本ボタン、アイコン、テキスト
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// ローダー - 読み込み中インジケーター
import {Loader} from '#/components/Loader'
// タイポグラフィ - 段落とテキストコンポーネント
import {P, Text} from '#/components/Typography'

// レイアウト定数 - カラム幅の設定
const COL_WIDTH = 400

/**
 * サインアップ待機画面コンポーネント
 * 新規ユーザー登録時の待機列状態を表示し、定期的にステータスをチェック
 * アカウントアクティベート待ちのユーザー体験を管理
 */
export function SignupQueued() {
  // 国際化フック - UI文字列の翻訳
  const {_} = useLingui()
  // テーマフック - カラーとスタイルの管理
  const t = useTheme()
  // セーフエリア - デバイスのセーフエリア取得
  const insets = useSafeAreaInsets()
  // ブレークポイント - レスポンシブレイアウト制御
  const {gtMobile} = useBreakpoints()
  // オンボーディング制御 - 初回利用フロー管理
  const onboardingDispatch = useOnboardingDispatch()
  // セッション管理 - ログアウト機能
  const {logoutCurrentAccount} = useSessionApi()
  // エージェント - API通信クライアント
  const agent = useAgent()

  // 処理中状態 - ステータスチェック実行中かどうか
  const [isProcessing, setProcessing] = React.useState(false)
  // 推定待機時間 - アクティベートまでの予想時間
  const [estimatedTime, setEstimatedTime] = React.useState<string | undefined>(
    undefined,
  )
  // 待機列での順番 - キューでの位置
  const [placeInQueue, setPlaceInQueue] = React.useState<number | undefined>(
    undefined,
  )

  // サインアップキューのステータスチェック - アカウントアクティベート状態を確認
  const checkStatus = React.useCallback(async () => {
    setProcessing(true)
    try {
      const res = await agent.com.atproto.temp.checkSignupQueue()
      if (res.data.activated) {
        // アクティベート完了 - セッション更新してオンボーディング開始
        await agent.sessionManager.refreshSession()
        if (!isSignupQueued(agent.session?.accessJwt)) {
          onboardingDispatch({type: 'start'})
        }
      } else {
        // 未アクティベート - UI状態を更新
        setEstimatedTime(msToString(res.data.estimatedTimeMs))
        if (typeof res.data.placeInQueue !== 'undefined') {
          setPlaceInQueue(Math.max(res.data.placeInQueue, 1))
        }
      }
    } catch (e: any) {
      logger.error('Failed to check signup queue', {err: e.toString()})
    } finally {
      setProcessing(false)
    }
  }, [
    setProcessing,
    setEstimatedTime,
    setPlaceInQueue,
    onboardingDispatch,
    agent,
  ])

  // 定期的なステータスチェック - マウント時と60秒間隔でチェック実行
  React.useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 60e3)
    return () => clearInterval(interval)
  }, [checkStatus])

  // ステータスチェックボタン - 手動でアクティベート状態を確認
  const checkBtn = (
    <Button
      variant="solid"
      color="primary"
      size="large"
      label={_(msg`Check my status`)}
      onPress={checkStatus}
      disabled={isProcessing}>
      <ButtonText>
        <Trans>Check my status</Trans>
      </ButtonText>
      {isProcessing && <ButtonIcon icon={Loader} />}
    </Button>
  )

  // ログアウトボタン - 待機をキャンセルしてサインアウト
  const logoutBtn = (
    <Button
      variant="ghost"
      size="large"
      color="primary"
      label={_(msg`Sign out`)}
      onPress={() => logoutCurrentAccount('SignupQueued')}>
      <ButtonText>
        <Trans>Sign out</Trans>
      </ButtonText>
    </Button>
  )

  // レイアウト判定 - Web版かつモバイル以上の画面サイズ
  const webLayout = isWeb && gtMobile

  // 待機画面のレンダリング - モーダル形式で待機状況を表示
  return (
    <Modal
      visible
      animationType={native('slide')}
      presentationStyle="formSheet"
      style={[web(a.util_screen_outer)]}>
      {isIOS && <SystemBars style={{statusBar: 'light'}} />}
      <ScrollView
        style={[a.flex_1, t.atoms.bg]}
        contentContainerStyle={{borderWidth: 0}}
        bounces={false}>
        <View
          style={[
            a.flex_row,
            a.justify_center,
            gtMobile ? a.pt_4xl : [a.px_xl, a.pt_xl],
          ]}>
          <View style={[a.flex_1, {maxWidth: COL_WIDTH}]}>
            {/* ロゴセクション - アプリケーションブランディング */}
            <View
              style={[a.w_full, a.justify_center, a.align_center, a.my_4xl]}>
              <Logo width={120} />
            </View>

            {/* メインタイトル - 待機状態を明確に伝達 */}
            <Text style={[a.text_4xl, a.font_heavy, a.pb_sm]}>
              <Trans>You're in line</Trans>
            </Text>
            {/* 説明文 - 待機理由とプロセスの説明 */}
            <P style={[t.atoms.text_contrast_medium]}>
              <Trans>
                There's been a rush of new users to Bluesky! We'll activate your
                account as soon as we can.
              </Trans>
            </P>

            {/* ステータスカード - 待機列の位置と推定時間を表示 */}
            <View
              style={[
                a.rounded_sm,
                a.px_2xl,
                a.py_4xl,
                a.mt_2xl,
                a.mb_md,
                a.border,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_medium,
              ]}>
              {/* キューポジション - 待機列での順番を大きく表示 */}
              {typeof placeInQueue === 'number' && (
                <Text
                  style={[a.text_5xl, a.text_center, a.font_heavy, a.mb_2xl]}>
                  {placeInQueue}
                </Text>
              )}
              {/* 待機情報 - 残り人数と推定時間の詳細 */}
              <P style={[a.text_center]}>
                {typeof placeInQueue === 'number' ? (
                  <Trans>left to go.</Trans>
                ) : (
                  <Trans>You are in line.</Trans>
                )}{' '}
                {estimatedTime ? (
                  <Trans>
                    We estimate {estimatedTime} until your account is ready.
                  </Trans>
                ) : (
                  <Trans>
                    We will let you know when your account is ready.
                  </Trans>
                )}
              </P>
            </View>

            {webLayout && (
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.justify_between,
                  a.pt_5xl,
                  {paddingBottom: 200},
                ]}>
                {logoutBtn}
                {checkBtn}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {!webLayout && (
        <View
          style={[
            a.align_center,
            t.atoms.bg,
            gtMobile ? a.px_5xl : a.px_xl,
            {paddingBottom: Math.max(insets.bottom, a.pb_5xl.paddingBottom)},
          ]}>
          <View style={[a.w_full, a.gap_sm, {maxWidth: COL_WIDTH}]}>
            {checkBtn}
            {logoutBtn}
          </View>
        </View>
      )}
    </Modal>
  )
}

/**
 * ミリ秒を人間が読みやすい時間文字列に変換
 * 6時間を超える場合は表示しない（長すぎるため）
 * 分単位と時間単位で適切に表示し、複数形も対応
 */
function msToString(ms: number | undefined): string | undefined {
  if (ms && ms > 0) {
    const estimatedTimeMins = Math.ceil(ms / 60e3)
    if (estimatedTimeMins > 59) {
      const estimatedTimeHrs = Math.round(estimatedTimeMins / 60)
      if (estimatedTimeHrs > 6) {
        // 6時間超は表示しない - あまりに長いため
        return undefined
      }
      // 時間単位で表示 - 複数形対応
      return `${estimatedTimeHrs} ${plural(estimatedTimeHrs, {
        one: 'hour',
        other: 'hours',
      })}`
    }
    // 分単位で表示 - 複数形対応
    return `${estimatedTimeMins} ${plural(estimatedTimeMins, {
      one: 'minute',
      other: 'minutes',
    })}`
  }
  return undefined
}
