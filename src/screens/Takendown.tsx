/**
 * @file Takendown.tsx
 * @description アカウント停止画面コンポーネント
 *
 * 利用規約違反などによりアカウントが停止された際に表示される画面。
 * 停止理由の確認と、異議申し立て（アピール）機能を提供する。
 *
 * 主な機能:
 * - 停止理由の説明表示
 * - 異議申し立てフォーム
 * - 申し立て内容の文字数カウント（書記素単位）
 * - サインアウト機能
 *
 * Go開発者向け補足:
 * - useState: コンポーネント内のローカル状態。値が変わるとUIが再描画される
 * - useMemo: 計算結果のメモ化。依存値が変わらない限り再計算しない
 * - useMutation: TanStack Queryのミューテーションフック。非同期の書き込み操作を管理
 * - Graphemer: Unicode書記素（絵文字など）を正確にカウントするライブラリ
 */

// React関連のインポート - Reactフックとネイティブコンポーネント
import {useMemo, useState} from 'react'
import {Modal, View} from 'react-native'
// システムUI関連 - ステータスバー制御
import {SystemBars} from 'react-native-edge-to-edge'
// キーボード対応 - キーボード表示時のスクロール調整
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
// セーフエリア - デバイスのセーフエリア取得
import {useSafeAreaInsets} from 'react-native-safe-area-context'
// AT Protocol型定義 - モデレーション関連の型
import {type ComAtprotoAdminDefs, ComAtprotoModerationDefs} from '@atproto/api'
// 国際化関連 - メッセージと翻訳コンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// データミューテーション - TanStack Queryのミューテーションフック
import {useMutation} from '@tanstack/react-query'
// Unicode書記素カウンター - 絵文字などを正確にカウント（Go開発者向け: rune countに相当）
import Graphemer from 'graphemer'

// UI定数 - レポート理由の最大文字数
import {MAX_REPORT_REASON_GRAPHEME_LENGTH} from '#/lib/constants'
// キーボード制御 - キーボードコントローラーの有効化
import {useEnableKeyboardController} from '#/lib/hooks/useEnableKeyboardController'
// エラー処理 - エラーメッセージのクリーンアップ
import {cleanError} from '#/lib/strings/errors'
// プラットフォーム検出 - iOS/Web環境の判定
import {isIOS, isWeb} from '#/platform/detection'
// セッション管理 - エージェント、セッション状態、セッションAPI
import {useAgent, useSession, useSessionApi} from '#/state/session'
// 文字数表示 - 入力フィールドの文字数進捗インジケーター
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
// ロゴコンポーネント - アプリケーションロゴ
import {Logo} from '#/view/icons/Logo'
// スタイリングシステム - CSSアトム、ネイティブ/Web用ヘルパー、ブレークポイント、テーマ
import {atoms as a, native, useBreakpoints, useTheme, web} from '#/alf'
// ボタンコンポーネント - 基本ボタン、アイコン、テキスト
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// フォームフィールド - テキスト入力フィールドコンポーネント
import * as TextField from '#/components/forms/TextField'
// リンクコンポーネント - インラインリンクテキスト
import {InlineLinkText} from '#/components/Link'
// ローダー - 読み込み中インジケーター
import {Loader} from '#/components/Loader'
// タイポグラフィ - 段落とテキストコンポーネント
import {P, Text} from '#/components/Typography'

// レイアウト定数 - コンテンツの最大幅（ピクセル単位）
const COL_WIDTH = 400

/**
 * アカウント停止画面コンポーネント
 *
 * 利用規約違反により停止されたアカウントの情報を表示し、
 * ユーザーが異議申し立てを行えるようにする。
 *
 * 画面モード:
 * 1. 通常モード: 停止理由と説明を表示
 * 2. アピールモード: 異議申し立てフォームを表示
 * 3. 成功モード: 申し立て送信完了メッセージを表示
 *
 * Go開発者向け:
 * - この関数はGoの関数と同様だが、JSXを返すことでUIを描画する
 * - React.useStateは状態管理、値の変更でUIが自動再描画される
 */
export function Takendown() {
  // 国際化フック - UI文字列の翻訳
  const {_} = useLingui()
  // テーマフック - カラーとスタイルの管理
  const t = useTheme()
  // セーフエリア - デバイスのノッチやホームインジケータの情報
  const insets = useSafeAreaInsets()
  // ブレークポイント - レスポンシブレイアウト制御
  const {gtMobile} = useBreakpoints()
  // セッション情報 - 現在のアカウント
  const {currentAccount} = useSession()
  // セッションAPI - ログアウト機能
  const {logoutCurrentAccount} = useSessionApi()
  // エージェント - AT Protocol APIクライアント
  const agent = useAgent()
  // アピール状態 - 異議申し立てモードかどうか（Go開発者向け: bool型のstate）
  const [isAppealling, setIsAppealling] = useState(false)
  // 理由テキスト - アピール理由の入力内容（Go開発者向け: string型のstate）
  const [reason, setReason] = useState('')
  // 書記素カウンター - Unicode書記素を正確にカウント（絵文字対応）
  // Go開発者向け: useMemoは計算結果をキャッシュし、依存値が変わらない限り再計算しない
  const graphemer = useMemo(() => new Graphemer(), [])

  /**
   * 理由テキストの書記素数を計算
   * Unicode書記素単位でカウント（絵文字を1文字として扱う）
   *
   * Go開発者向け:
   * - useMemoは依存配列の値が変わらない限り前回の計算結果を返す
   * - Goのrune countに似ているが、より正確（絵文字の結合文字も1つとカウント）
   */
  const reasonGraphemeLength = useMemo(() => {
    return graphemer.countGraphemes(reason)
  }, [graphemer, reason])

  /**
   * 異議申し立て送信のミューテーション
   *
   * Go開発者向け:
   * - useMutationは非同期の書き込み操作を管理するフック
   * - mutationFnはGoのHTTPリクエスト処理関数に相当
   * - isPending, isSuccess, errorは状態を自動管理
   */
  const {
    mutate: submitAppeal,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    /**
     * ミューテーション関数 - AT Protocolのモデレーションレポートを作成
     *
     * @param appealText - 異議申し立ての理由テキスト
     * @throws {Error} セッションが存在しない場合
     *
     * Go開発者向け:
     * - async/awaitは非同期処理を同期的に書ける構文糖衣
     * - GoのHTTPクライアント処理に相当
     */
    mutationFn: async (appealText: string) => {
      if (!currentAccount) throw new Error('No session')
      // アピールレポートを作成
      await agent.com.atproto.moderation.createReport({
        reasonType: ComAtprotoModerationDefs.REASONAPPEAL, // レポート種別: アピール
        subject: {
          $type: 'com.atproto.admin.defs#repoRef',
          did: currentAccount.did, // 対象アカウントのDID
        } satisfies ComAtprotoAdminDefs.RepoRef,
        reason: appealText, // アピール理由
      })
    },
    // 成功時のコールバック - 理由テキストをクリア
    onSuccess: () => setReason(''),
  })

  const primaryBtn =
    isAppealling && !isSuccess ? (
      <Button
        variant="solid"
        color="primary"
        size="large"
        label={_(msg`Submit appeal`)}
        onPress={() => submitAppeal(reason)}
        disabled={
          isPending || reasonGraphemeLength > MAX_REPORT_REASON_GRAPHEME_LENGTH
        }>
        <ButtonText>
          <Trans>Submit Appeal</Trans>
        </ButtonText>
        {isPending && <ButtonIcon icon={Loader} />}
      </Button>
    ) : (
      <Button
        variant="solid"
        size="large"
        color="secondary_inverted"
        label={_(msg`Sign out`)}
        onPress={() => logoutCurrentAccount('Takendown')}>
        <ButtonText>
          <Trans>Sign Out</Trans>
        </ButtonText>
      </Button>
    )

  const secondaryBtn = isAppealling ? (
    !isSuccess && (
      <Button
        variant="ghost"
        size="large"
        color="secondary"
        label={_(msg`Cancel`)}
        onPress={() => setIsAppealling(false)}>
        <ButtonText>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
    )
  ) : (
    <Button
      variant="ghost"
      size="large"
      color="secondary"
      label={_(msg`Appeal suspension`)}
      onPress={() => setIsAppealling(true)}>
      <ButtonText>
        <Trans>Appeal Suspension</Trans>
      </ButtonText>
    </Button>
  )

  const webLayout = isWeb && gtMobile

  useEnableKeyboardController(true)

  return (
    <Modal
      visible
      animationType={native('slide')}
      presentationStyle="formSheet"
      style={[web(a.util_screen_outer)]}>
      {isIOS && <SystemBars style={{statusBar: 'light'}} />}
      <KeyboardAwareScrollView style={[a.flex_1, t.atoms.bg]} centerContent>
        <View
          style={[
            a.flex_row,
            a.justify_center,
            gtMobile ? a.pt_4xl : [a.px_xl, a.pt_4xl],
          ]}>
          <View style={[a.flex_1, {maxWidth: COL_WIDTH, minHeight: COL_WIDTH}]}>
            <View style={[a.pb_xl]}>
              <Logo width={64} />
            </View>

            <Text style={[a.text_4xl, a.font_heavy, a.pb_md]}>
              {isAppealling ? (
                <Trans>Appeal suspension</Trans>
              ) : (
                <Trans>Your account has been suspended</Trans>
              )}
            </Text>

            {isAppealling ? (
              <View style={[a.relative, a.w_full, a.mt_xl]}>
                {isSuccess ? (
                  <P style={[t.atoms.text_contrast_medium, a.text_center]}>
                    <Trans>
                      Your appeal has been submitted. If your appeal succeeds,
                      you will receive an email.
                    </Trans>
                  </P>
                ) : (
                  <>
                    <TextField.LabelText>
                      <Trans>Reason for appeal</Trans>
                    </TextField.LabelText>
                    <TextField.Root
                      isInvalid={
                        reasonGraphemeLength >
                          MAX_REPORT_REASON_GRAPHEME_LENGTH || !!error
                      }>
                      <TextField.Input
                        label={_(msg`Reason for appeal`)}
                        defaultValue={reason}
                        onChangeText={setReason}
                        placeholder={_(msg`Why are you appealing?`)}
                        multiline
                        numberOfLines={5}
                        autoFocus
                        style={{paddingBottom: 40, minHeight: 150}}
                        maxLength={MAX_REPORT_REASON_GRAPHEME_LENGTH * 10}
                      />
                    </TextField.Root>
                    <View
                      style={[
                        a.absolute,
                        a.flex_row,
                        a.align_center,
                        a.pr_md,
                        a.pb_sm,
                        {
                          bottom: 0,
                          right: 0,
                        },
                      ]}>
                      <CharProgress
                        count={reasonGraphemeLength}
                        max={MAX_REPORT_REASON_GRAPHEME_LENGTH}
                      />
                    </View>
                  </>
                )}
                {error && (
                  <Text
                    style={[
                      a.text_md,
                      a.leading_normal,
                      {color: t.palette.negative_500},
                      a.mt_lg,
                    ]}>
                    {cleanError(error)}
                  </Text>
                )}
              </View>
            ) : (
              <P style={[t.atoms.text_contrast_medium]}>
                <Trans>
                  Your account was found to be in violation of the{' '}
                  <InlineLinkText
                    label={_(msg`Bluesky Social Terms of Service`)}
                    to="https://bsky.social/about/support/tos"
                    style={[a.text_md, a.leading_normal]}
                    overridePresentation>
                    Bluesky Social Terms of Service
                  </InlineLinkText>
                  . You have been sent an email outlining the specific violation
                  and suspension period, if applicable. You can appeal this
                  decision if you believe it was made in error.
                </Trans>
              </P>
            )}

            {webLayout && (
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.justify_between,
                  a.pt_5xl,
                  {paddingBottom: 200},
                ]}>
                {secondaryBtn}
                {primaryBtn}
              </View>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {!webLayout && (
        <View
          style={[
            a.align_center,
            t.atoms.bg,
            gtMobile ? a.px_5xl : a.px_xl,
            {paddingBottom: Math.max(insets.bottom, a.pb_5xl.paddingBottom)},
          ]}>
          <View style={[a.w_full, a.gap_sm, {maxWidth: COL_WIDTH}]}>
            {primaryBtn}
            {secondaryBtn}
          </View>
        </View>
      )}
    </Modal>
  )
}
