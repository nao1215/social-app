import {useEffect, useReducer, useState} from 'react'
import {AppState, type AppStateStatus, View} from 'react-native'
import ReactNativeDeviceAttest from 'react-native-device-attest'
import Animated, {FadeIn, LayoutAnimationConfig} from 'react-native-reanimated'
import {AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FEEDBACK_FORM_URL} from '#/lib/constants'
import {logger} from '#/logger'
import {isAndroid} from '#/platform/detection'
import {useServiceQuery} from '#/state/queries/service'
import {useStarterPackQuery} from '#/state/queries/starter-packs'
import {useActiveStarterPack} from '#/state/shell/starter-pack'
import {LoggedOutLayout} from '#/view/com/util/layouts/LoggedOutLayout'
import {
  initialState,
  reducer,
  SignupContext,
  SignupStep,
  useSubmitSignup,
} from '#/screens/Signup/state'
import {StepCaptcha} from '#/screens/Signup/StepCaptcha'
import {StepHandle} from '#/screens/Signup/StepHandle'
import {StepInfo} from '#/screens/Signup/StepInfo'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {Divider} from '#/components/Divider'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {GCP_PROJECT_ID} from '#/env'
import * as bsky from '#/types/bsky'

/**
 * 🚀 サインアップ画面のメインコンポーネント - React Native学習の総合事例
 *
 * 【📱 主な機能】
 * - メールアドレス・パスワード・ハンドル名の入力と検証
 * - サービス（PDS: Personal Data Server）の選択と接続確認
 * - スターターパック経由のサインアップサポート
 * - デバイス認証（iOS App Attest / Android Play Integrity）
 * - マルチステップフォーム管理（Info → Captcha → Handle）
 *
 * 【🔄 状態管理パターン（React学習ポイント）】
 * - useReducer: 複雑なフォーム状態の一元管理
 *   * 単純なuseStateでは管理困難な相互依存状態
 *   * アクション型による型安全な状態更新
 *   * ステップ遷移、バリデーション、エラー処理の統合管理
 * - TanStack Query: サーバー状態の効率的キャッシュ管理
 *   * useServiceQuery: PDSサーバー情報の取得・キャッシュ
 *   * useStarterPackQuery: スターターパックデータの管理
 *   * 楽観的更新、背景更新、エラーハンドリングの自動化
 * - Context API: 階層を超えた状態共有
 *   * SignupContextで子コンポーネント間の状態共有
 *   * プロップドリリング回避の実践例
 *
 * 【🌐 外部連携アーキテクチャ】
 * - AT Protocol: 分散型SNSプロトコルの実装
 *   * レキシコン（Lexicon）ベースのAPI通信
 *   * 複数PDSサーバー対応の柔軟な設計
 *   * 型安全性を保証するランタイム検証
 * - スターターパック: ソーシャルオンボーディング機能
 *   * 推奨ユーザー・フィードの一括フォロー
 *   * 新規ユーザーの初期体験最適化
 * - デバイスアテステーション: 不正アカウント作成防止
 *   * ハードウェアレベルでの端末正当性確認
 *   * スパム・ボット対策の多層防御システム
 *
 * 【🎨 UI/UXデザインパターン】
 * - Atomic Design System: 再利用可能なコンポーネント設計
 * - レスポンシブ対応: useBreakpointsによる画面サイズ最適化
 * - アニメーション: React Native Reanimatedによるスムーズな画面遷移
 * - 国際化（i18n）: 50+言語対応のLinguiシステム
 * - アクセシビリティ: testID、ラベル、コントラスト最適化
 *
 * 【🔧 React Native実装テクニック】
 * - プラットフォーム固有処理: iOS/Android/Webの差異吸収
 * - パフォーマンス最適化: メモ化、遅延レンダリング、バンドル最適化
 * - セキュリティ対策: 入力検証、XSS防止、機密情報保護
 * - エラーハンドリング: 段階的フォールバック、ユーザーフレンドリーなメッセージ
 *
 * 【📚 学習価値】
 * このコンポーネントは以下のReact Native開発スキルを包括的に学べる教材：
 * 1. 複雑な状態管理（useReducer + Context + Query）
 * 2. モダンな非同期処理パターン
 * 3. 型安全なTypeScript活用法
 * 4. プラットフォーム横断開発手法
 * 5. 大規模アプリケーションのアーキテクチャ設計
 * 6. セキュリティ・アクセシビリティ・国際化の実践
 *
 * @param onPressBack 戻るボタン押下時のコールバック関数
 * @returns サインアップ画面のJSX要素（多段階フォーム + バリデーション + アニメーション）
 */
export function Signup({onPressBack}: {onPressBack: () => void}) {
  /*
   * 🌍 国際化（Internationalization）システム
   * useLingui(): Linguiライブラリの翻訳関数取得Hook
   *
   * 【学習ポイント】
   * - _() : メッセージID→翻訳済みテキスト変換関数
   * - msg`テキスト` : テンプレートリテラルでメッセージ定義
   * - Trans コンポーネント: JSX内での翻訳テキスト表示
   * - 実行時言語切り替え、複数形対応、コンテキスト翻訳をサポート
   */
  const {_} = useLingui()

  /*
   * 🎨 テーマシステム（ダークモード対応）
   * useTheme(): Alfデザインシステムのテーマ取得Hook
   *
   * 【学習ポイント】
   * - t.atoms : アトミックデザインのスタイルトークン
   * - 動的テーマ切り替え（ライト/ダーク/システム設定連動）
   * - カラーパレット、タイポグラフィ、間隔の一元管理
   * - アクセシビリティ（コントラスト比、文字サイズ）対応
   */
  const t = useTheme()

  /*
   * 🔄 複雑状態管理パターン: useReducer
   *
   * 【なぜuseStateではなくuseReducer？】
   * - 相互依存する複数状態（email, password, handle, step, errors等）
   * - 複雑な状態遷移ロジック（バリデーション→エラー表示→ステップ進行）
   * - 予測可能な状態更新（Reduxパターンによる型安全性）
   *
   * 【reducer実装パターン】
   * - アクション型による厳密な状態更新制御
   * - 不変性（Immutability）の保証
   * - タイムトラベルデバッグ対応
   */
  const [state, dispatch] = useReducer(reducer, initialState)

  /*
   * 📱 レスポンシブデザイン実装
   * useBreakpoints(): 画面サイズ判定によるUI適応Hook
   *
   * 【学習ポイント】
   * - gtMobile : モバイルサイズより大きい画面判定
   * - CSS-in-JSでの条件付きスタイリング
   * - React NativeのDimensions APIをReactパターンでラップ
   * - パフォーマンス: リサイズイベントの効率的なハンドリング
   */
  const {gtMobile} = useBreakpoints()

  /*
   * 🚀 カスタムHookによるビジネスロジック分離
   * useSubmitSignup(): サインアップ送信処理の抽象化
   *
   * 【設計パターン】
   * - 複雑な非同期処理をコンポーネントから分離
   * - 再利用可能なロジックの抽出
   * - テスト容易性の向上
   * - 関心の分離（UI vs ビジネスロジック）
   */
  const submit = useSubmitSignup()

  /*
   * 🎯 スターターパック機能: ソーシャルオンボーディング
   *
   * 【機能概要】
   * 新規ユーザーに推奨ユーザー・フィードを自動提案する仕組み
   * 招待リンクから自動的に適切なコミュニティに参加可能
   *
   * 【技術実装】
   * - useActiveStarterPack(): Context経由での現在のスターターパック取得
   * - URI指定による動的なスターターパックデータフェッチ
   * - エラーハンドリングとローディング状態の管理
   */
  // アクティブなスターターパックの監視
  const activeStarterPack = useActiveStarterPack()

  /*
   * 📊 TanStack Query: サーバー状態管理の現代的手法
   *
   * 【なぜuseEffectとuseStateではダメ？】
   * - キャッシュ戦略: 同じデータの重複取得防止
   * - バックグラウンド更新: 画面復帰時の自動再取得
   * - 楽観的更新: UIの即座な反映とロールバック機能
   * - エラー境界: ネットワークエラーの段階的ハンドリング
   *
   * 【useStarterPackQuery実装詳細】
   * - enabled: uri存在時のみクエリ実行（条件付きフェッチ）
   * - staleTime: キャッシュ有効期限の制御
   * - refetchOnWindowFocus: ウィンドウフォーカス時の再取得
   */
  const {
    data: starterPack,                    // 取得したスターターパックデータ
    isFetching: isFetchingStarterPack,    // 取得中フラグ（ローディングUI制御）
    isError: isErrorStarterPack,          // エラー状態（フォールバック表示）
  } = useStarterPackQuery({
    uri: activeStarterPack?.uri,          // Optional Chaining: 安全なプロパティアクセス
  })

  /*
   * ⚡ パフォーマンス最適化: 初期レンダリング時アニメーション制御
   *
   * 【問題】
   * データが既にマウント時に存在する場合、フェードインアニメーションは不要
   *
   * 【解決策】
   * useState()の遅延初期化でマウント時のデータ存在状況を記録
   * アニメーション実行判定に使用してUXを向上
   */
  const [isFetchedAtMount] = useState(starterPack != null)

  /*
   * 🔍 条件付きレンダリング制御: 複合論理演算子の活用
   *
   * 【条件分析】
   * 1. activeStarterPack?.uri : スターターパックURIが存在
   * 2. !isFetchingStarterPack : 取得処理が完了している
   * 3. starterPack : 実際のデータが存在
   *
   * 全て真の場合のみカード表示（短絡評価による効率的判定）
   */
  const showStarterPackCard =
    activeStarterPack?.uri && !isFetchingStarterPack && starterPack

  /*
   * 🌐 AT Protocol PDS（Personal Data Server）通信
   *
   * 【分散型アーキテクチャ】
   * - ユーザーが任意のPDSサーバーを選択可能
   * - サーバー間通信によるフェデレーション実現
   * - 各PDSの機能・制限情報をリアルタイム取得
   *
   * 【実装パターン】
   * - state.serviceUrl : ユーザー選択済みPDSのURL
   * - 自動的な接続テストとサービス情報取得
   * - エラー時の再試行（refetch）機能
   */
  const {
    data: serviceInfo,    // PDSサーバーの詳細情報（制限・機能・ポリシー）
    isFetching,          // 接続テスト中フラグ
    isError,             // 接続エラー状態
    refetch,             // 手動再接続関数
  } = useServiceQuery(state.serviceUrl)

  /**
   * サービス情報取得中のローディング状態管理
   * isFetchingの変化を監視し、ローディングUIの表示/非表示を制御
   */
  useEffect(() => {
    if (isFetching) {
      dispatch({type: 'setIsLoading', value: true})
    } else if (!isFetching) {
      dispatch({type: 'setIsLoading', value: false})
    }
  }, [isFetching])

  /**
   * サービス接続エラー処理とサービス情報の更新
   * - エラー時: エラーメッセージを表示し、サービス情報をクリア
   * - 成功時: 取得したサービス情報をstateに保存
   */
  useEffect(() => {
    if (isError) {
      dispatch({type: 'setServiceDescription', value: undefined})
      dispatch({
        type: 'setError',
        value: _(
          msg`Unable to contact your service. Please check your Internet connection.`,
        ),
      })
    } else if (serviceInfo) {
      dispatch({type: 'setServiceDescription', value: serviceInfo})
      dispatch({type: 'setError', value: ''})
    }
  }, [_, serviceInfo, isError])

  /**
   * サインアップ送信の非同期処理
   * pendingSubmitがセットされたら、一度だけsubmit関数を実行
   * mutableProcessedフラグで重複実行を防ぐ
   */
  useEffect(() => {
    if (state.pendingSubmit) {
      if (!state.pendingSubmit.mutableProcessed) {
        state.pendingSubmit.mutableProcessed = true
        submit(state, dispatch)
      }
    }
  }, [state, dispatch, submit])

  /**
   * アプリバックグラウンド移行のトラッキング
   * iOS/Androidでアプリがバックグラウンドに移った回数をカウント
   * 不正行為防止のための監視機能
   */
  // Track app backgrounding during signup
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background') {
          dispatch({type: 'incrementBackgroundCount'})
        }
      },
    )

    return () => subscription.remove()
  }, [])

  /**
   * Android向けPlay Integrity APIのウォームアップ
   * サインアップ画面でAPIを事前準備し、認証画面での遅延を防ぐ
   */
  // On Android, warmup the Play Integrity API on the signup screen so it is ready by the time we get to the gate screen.
  useEffect(() => {
    if (!isAndroid) {
      return
    }
    ReactNativeDeviceAttest.warmupIntegrity(GCP_PROJECT_ID).catch(err =>
      logger.error(err),
    )
  }, [])

  return (
    /*
     * SignupContext.Providerでstateとdispatchを子コンポーネントに提供
     * - reducer管理の状態を各ステップコンポーネント（StepInfo、StepCaptcha、StepHandle）で共有
     * - Context経由で状態変更を各コンポーネントから実行可能にする
     */
    <SignupContext.Provider value={{state, dispatch}}>
      {/*
       * LoggedOutLayoutは未ログイン状態専用のレイアウトコンポーネント
       * - ヘッダー、タイトル、説明文、スクロール可能エリアを提供
       * - leadin=""で上部余白なし、scrollableで縦スクロール有効
       */}
      <LoggedOutLayout
        leadin=""
        title={_(msg`Create Account`)}
        description={_(msg`We're so excited to have you join us!`)}
        scrollable>
        <View testID="createAccount" style={a.flex_1}>
          {/*
           * スターターパック情報の条件付き表示
           * - showStarterPackCard: activeStarterPack存在 && 取得完了 && データ有効
           * - bsky.dangerousIsType: AT Protocolの型安全性チェック（ランタイム検証）
           * - フェードインアニメーション: マウント時に既にデータがある場合はアニメーション無効化
           */}
          {showStarterPackCard &&
          bsky.dangerousIsType<AppBskyGraphStarterpack.Record>(
            starterPack.record,
            AppBskyGraphStarterpack.isRecord,
          ) ? (
            <Animated.View entering={!isFetchedAtMount ? FadeIn : undefined}>
              {/*
               * LinearGradientBackground: グラデーション背景付きのスターターパック紹介カード
               * - mx_lg: 左右マージン、p_lg: 内部パディング、gap_sm: 要素間隔
               * - rounded_sm: 角丸、白文字でコントラスト確保
               */}
              <LinearGradientBackground
                style={[a.mx_lg, a.p_lg, a.gap_sm, a.rounded_sm]}>
                <Text style={[a.font_bold, a.text_xl, {color: 'white'}]}>
                  {starterPack.record.name}
                </Text>
                {/*
                 * 条件分岐でフィード付きスターターパックの説明文を切り替え
                 * - feeds?.length: フィード情報が存在する場合の説明
                 * - フィードなし: ユーザーフォローのみの説明
                 */}
                <Text style={[{color: 'white'}]}>
                  {starterPack.feeds?.length ? (
                    <Trans>
                      You'll follow the suggested users and feeds once you
                      finish creating your account!
                    </Trans>
                  ) : (
                    <Trans>
                      You'll follow the suggested users once you finish creating
                      your account!
                    </Trans>
                  )}
                </Text>
              </LinearGradientBackground>
            </Animated.View>
          ) : null}
          {/*
           * メインフォームコンテナ
           * - flex_1: 利用可能な縦スペースを全て使用
           * - px_xl: 左右の余白（デザインシステムのXLサイズ）
           * - pt_2xl: 上部余白（2XLサイズ）
           * - !gtMobile: モバイル画面時のみ下部余白100px追加（キーボード対応）
           */}
          <View
            style={[
              a.flex_1,
              a.px_xl,
              a.pt_2xl,
              !gtMobile && {paddingBottom: 100},
            ]}>
            {/*
             * ステップインジケーター表示部分
             * - gap_sm: 要素間の小さな間隔
             * - pb_sm: 下部に小さなパディング
             */}
            <View style={[a.gap_sm, a.pb_sm]}>
              {/*
               * 動的ステップカウンター
               * - activeStep + 1: 0ベースインデックスを1ベースに変換
               * - serviceDescription?.phoneVerificationRequired:
               *   電話認証必須サービスの場合は3ステップ、そうでなければ2ステップ
               * - text_contrast_medium: 中程度のコントラストカラー
               */}
              <Text
                style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
                <Trans>
                  Step {state.activeStep + 1} of{' '}
                  {state.serviceDescription &&
                  !state.serviceDescription.phoneVerificationRequired
                    ? '2'
                    : '3'}
                </Trans>
              </Text>
              {/*
               * ステップ別タイトル表示の条件分岐
               * - SignupStep.INFO: アカウント情報入力段階
               * - SignupStep.HANDLE: ハンドル名（ユーザー名）選択段階
               * - その他（CAPTCHA等）: チャレンジ完了段階
               * - text_3xl: 大きなフォントサイズ、font_heavy: 太字ウェイト
               */}
              <Text style={[a.text_3xl, a.font_heavy]}>
                {state.activeStep === SignupStep.INFO ? (
                  <Trans>Your account</Trans>
                ) : state.activeStep === SignupStep.HANDLE ? (
                  <Trans>Choose your username</Trans>
                ) : (
                  <Trans>Complete the challenge</Trans>
                )}
              </Text>
            </View>

            {/*
             * React Native Reanimatedのレイアウトアニメーション設定
             * - skipEntering/skipExiting: 入場・退場アニメーションを無効化
             * - ステップ切り替え時のちらつきを防ぎ、スムーズな表示を実現
             */}
            <LayoutAnimationConfig skipEntering skipExiting>
              {/*
               * StepInfoコンポーネント（アカウント情報入力ステップ）
               * - onPressBack: 戻るボタン押下時のコールバック
               * - isLoadingStarterPack: スターターパック取得中フラグ
               * - isServerError: サーバーエラー状態フラグ
               * - refetchServer: サーバー再接続関数
               */}
              {state.activeStep === SignupStep.INFO ? (
                <StepInfo
                  onPressBack={onPressBack}
                  isLoadingStarterPack={
                    isFetchingStarterPack && !isErrorStarterPack
                  }
                  isServerError={isError}
                  refetchServer={refetch}
                />
              ) : state.activeStep === SignupStep.HANDLE ? (
                /*
                 * StepHandleコンポーネント（ハンドル名選択ステップ）
                 * 【機能詳細】
                 * - ユーザー名の可用性チェック（リアルタイム検証）
                 * - AT Protocolハンドル形式の検証（@user.bsky.social形式）
                 * - DNS検証機能（カスタムドメインハンドル対応）
                 * - 予約語・禁止語フィルタリング機能
                 *
                 * 【学習ポイント】
                 * - デバウンス処理によるAPI呼び出し最適化
                 * - 非同期バリデーションの実装パターン
                 * - ユーザーフレンドリーなエラーメッセージ表示
                 */
                <StepHandle />
              ) : (
                /*
                 * StepCaptchaコンポーネント（人間性検証ステップ）
                 * 【機能詳細】
                 * - iOS App Attest: ハードウェアベースのデバイス認証
                 * - Android Play Integrity: Google Playの完全性確認
                 * - reCAPTCHA v3: 人間性スコア判定による無停止認証
                 * - Turnstile: Cloudflareの軽量CAPTCHA代替
                 *
                 * 【学習ポイント】
                 * - プラットフォーム固有の認証API統合方法
                 * - 段階的認証（フォールバック機能）の実装
                 * - セキュリティと利便性のバランス設計
                 * - 不正検知アルゴリズムとの連携
                 */
                <StepCaptcha />
              )}
            </LayoutAnimationConfig>

            {/*
             * セクション区切り線
             * - フォーム部分とフッター部分の視覚的分離
             */}
            <Divider />

            {/*
             * フッター部分（言語設定＋サポートリンク）
             * - w_full: 全幅使用
             * - py_lg: 上下パディング（Lサイズ）
             * - flex_row: 横並びレイアウト
             * - gap_md: 要素間隔（Mサイズ）
             * - align_center: 垂直方向の中央揃え
             */}
            <View
              style={[a.w_full, a.py_lg, a.flex_row, a.gap_md, a.align_center]}>
              {/*
               * AppLanguageDropdown: アプリ言語切り替えドロップダウン
               * - 50+言語対応のi18n機能
               * - ユーザーの地域設定に基づく自動選択
               * - リアルタイム言語切り替え機能
               */}
              <AppLanguageDropdown />
              {/*
               * サポートリンク付きヘルプテキスト
               * - flex_1: 残り幅を全て使用
               * - text_contrast_medium: 中程度のコントラスト
               * - !gtMobile && a.text_md: モバイル時はMサイズフォント
               */}
              <Text
                style={[
                  a.flex_1,
                  t.atoms.text_contrast_medium,
                  !gtMobile && a.text_md,
                ]}>
                <Trans>Having trouble?</Trans>{' '}
                {/*
                 * InlineLinkText: インライン表示のリンクコンポーネント
                 * - FEEDBACK_FORM_URL: サポートフォームURL生成関数
                 * - state.emailを自動入力してユーザビリティ向上
                 * - label: アクセシビリティ用のラベル
                 */}
                <InlineLinkText
                  label={_(msg`Contact support`)}
                  to={FEEDBACK_FORM_URL({email: state.email})}
                  style={[!gtMobile && a.text_md]}>
                  <Trans>Contact support</Trans>
                </InlineLinkText>
              </Text>
            </View>
          </View>
        </View>
      </LoggedOutLayout>
    </SignupContext.Provider>
  )
}
