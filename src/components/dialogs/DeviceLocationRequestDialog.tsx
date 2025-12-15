/**
 * デバイス位置情報要求ダイアログコンポーネント
 *
 * このモジュールは、ユーザーのGPS位置情報へのアクセス許可を求めるダイアログを提供します。
 * 取得した位置情報は、年齢制限やコンテンツフィルタリングの判定に使用されます。
 *
 * 【主な機能】
 * - デバイスの位置情報（GPS）へのアクセス要求
 * - 位置情報から国コードを取得し、地域制限を判定
 * - エラーハンドリング（権限拒否、位置情報取得失敗など）
 * - 最小1秒の待機時間でUX改善（即座に閉じない）
 *
 * 【Goユーザー向け補足】
 * - useState: 状態管理フック（コンポーネントのローカル状態）
 * - View: React NativeのコンテナUI要素（HTMLのdivに相当）
 * - async/await: 非同期処理（PromiseベースのAPI）
 */

// Reactの状態管理フックをインポート
import {useState} from 'react'
// React NativeのViewコンポーネント（コンテナ要素）
import {View} from 'react-native'
// 国際化ライブラリLingui: msgは翻訳キー、Transは翻訳テキスト表示
import {msg, Trans} from '@lingui/macro'
// useLingui: 翻訳関数を取得するフック
import {useLingui} from '@lingui/react'

// 指定時間待機するユーティリティ関数（UX改善のための遅延）
import {wait} from '#/lib/async/wait'
// ネットワークエラー判定とエラークリーンアップのフック
import {isNetworkError, useCleanError} from '#/lib/hooks/useCleanError'
// ロギングユーティリティ
import {logger} from '#/logger'
// Webプラットフォーム判定
import {isWeb} from '#/platform/detection'
// 地理的位置情報の状態計算と設定取得
import {
  computeGeolocationStatus,
  type GeolocationStatus,
  useGeolocationConfig,
} from '#/state/geolocation'
// デバイスの位置情報を要求するフック
import {useRequestDeviceLocation} from '#/state/geolocation/useRequestDeviceLocation'
// スタイルシステムとテーマ
import {atoms as a, useTheme, web} from '#/alf'
// 警告・情報メッセージ表示コンポーネント
import {Admonition} from '#/components/Admonition'
// ボタンコンポーネント群
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// ダイアログコンポーネント群
import * as Dialog from '#/components/Dialog'
// 位置情報アイコン（ピンアイコン）
import {PinLocation_Stroke2_Corner0_Rounded as LocationIcon} from '#/components/icons/PinLocation'
// ローディングスピナー
import {Loader} from '#/components/Loader'
// テキスト表示コンポーネント
import {Text} from '#/components/Typography'

/**
 * デバイス位置情報要求ダイアログのProps型定義
 *
 * 【Goユーザー向け補足】
 * - export type: 型定義のエクスポート（Goのtype宣言に相当）
 * - ?: オプショナルプロパティ（値が存在しない可能性）
 * - (props: {...}) => void: 関数型（引数と戻り値の型定義）
 */
export type Props = {
  // 位置情報取得成功時のコールバック関数（オプショナル）
  onLocationAcquired?: (props: {
    geolocationStatus: GeolocationStatus // 計算された地理的位置状態
    setDialogError: (error: string) => void // ダイアログエラー設定関数
    disableDialogAction: () => void // ダイアログアクション無効化関数
    closeDialog: (callback?: () => void) => void // ダイアログを閉じる関数
  }) => void
}

/**
 * デバイス位置情報要求ダイアログの外枠コンポーネント
 *
 * ダイアログの構造（Outer, Handle, ScrollableInner）を定義します。
 * 実際のコンテンツはDeviceLocationRequestDialogInnerで実装されています。
 *
 * @param {Props & {control: Dialog.DialogOuterProps['control']}} props - プロパティ
 * @param {Dialog.DialogOuterProps['control']} props.control - ダイアログ制御オブジェクト
 * @param {Props['onLocationAcquired']} props.onLocationAcquired - 位置情報取得時のコールバック
 *
 * 【Goユーザー向け補足】
 * - Props & {...}: 型の交差（intersection）。両方の型のプロパティを持つ
 * - Dialog.DialogOuterProps['control']: インデックスアクセス型。構造体のフィールド型取得に似ている
 */
export function DeviceLocationRequestDialog({
  control,
  onLocationAcquired,
}: Props & {
  control: Dialog.DialogOuterProps['control']
}) {
  // 翻訳関数を取得
  const {_} = useLingui()
  return (
    // ダイアログの外枠
    <Dialog.Outer control={control}>
      {/* ダイアログを引っ張るためのハンドル（モバイルUI） */}
      <Dialog.Handle />

      {/* スクロール可能なダイアログ内部（最大幅380px） */}
      <Dialog.ScrollableInner
        label={_(msg`Confirm your location`)}
        style={[web({maxWidth: 380})]}>
        {/* 実際のコンテンツ（位置情報要求UI） */}
        <DeviceLocationRequestDialogInner
          onLocationAcquired={onLocationAcquired}
        />
        {/* 閉じるボタン */}
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

/**
 * デバイス位置情報要求ダイアログの内部コンポーネント
 *
 * 実際の位置情報要求処理とUIロジックを実装します。
 * GPS位置情報の取得、エラーハンドリング、状態管理を担当します。
 *
 * @param {Props} props - プロパティ
 * @param {Props['onLocationAcquired']} props.onLocationAcquired - 位置情報取得成功時のコールバック
 *
 * 【Goユーザー向け補足】
 * - useState: 状態管理フック。[現在値, 更新関数]を返す
 * - async/await: 非同期処理。Promiseベースの非同期API
 * - try-catch-finally: エラーハンドリング（Goのdefer/recoverに似ている）
 */
function DeviceLocationRequestDialogInner({onLocationAcquired}: Props) {
  // テーマ設定を取得
  const t = useTheme()
  // 翻訳関数を取得
  const {_} = useLingui()
  // ダイアログコンテキストから閉じる関数を取得
  const {close} = Dialog.useDialogContext()
  // デバイス位置情報を要求する関数を取得
  const requestDeviceLocation = useRequestDeviceLocation()
  // 地理的位置情報の設定を取得
  const {config} = useGeolocationConfig()
  // エラーメッセージをクリーンアップする関数
  const cleanError = useCleanError()

  // 位置情報要求中かどうかの状態
  const [isRequesting, setIsRequesting] = useState(false)
  // エラーメッセージの状態
  const [error, setError] = useState<string>('')
  // ダイアログのアクションボタンを無効化するかどうかの状態
  const [dialogDisabled, setDialogDisabled] = useState(false)

  /**
   * 位置情報アクセス許可ボタン押下時のハンドラー
   *
   * デバイスの位置情報を要求し、取得結果に応じて処理を分岐します。
   * 最小1秒の待機時間を設けてUXを改善しています。
   *
   * 【Goユーザー向け補足】
   * - async: 非同期関数の宣言。Promiseを返す
   * - await: Promiseの完了を待つ。Goのchannelのブロッキング受信に似ている
   * - 1e3: 1000のこと（指数表記）
   */
  const onPressConfirm = async () => {
    // エラーメッセージをクリア
    setError('')
    // 要求中フラグを立てる
    setIsRequesting(true)

    try {
      // 位置情報を要求（最小1秒待機してからレスポンスを返す）
      // wait()は指定ミリ秒とPromiseの完了のうち遅い方を待つ
      const req = await wait(1e3, requestDeviceLocation())

      if (req.granted) {
        // 位置情報アクセスが許可された場合
        const location = req.location

        if (location && location.countryCode) {
          // 位置情報と国コードが取得できた場合
          // 地理的位置情報の状態を計算
          const geolocationStatus = computeGeolocationStatus(location, config)
          // コールバック関数を呼び出し（オプショナルチェーン演算子 ?. で安全に呼び出し）
          onLocationAcquired?.({
            geolocationStatus,
            setDialogError: setError, // エラー設定関数を渡す
            disableDialogAction: () => setDialogDisabled(true), // アクション無効化関数を渡す
            closeDialog: close, // ダイアログを閉じる関数を渡す
          })
        } else {
          // 位置情報は許可されたが国コードが取得できなかった場合
          setError(_(msg`Failed to resolve location. Please try again.`))
        }
      } else {
        // 位置情報アクセスが拒否された場合
        setError(
          _(
            msg`Unable to access location. You'll need to visit your system settings to enable location services for Bluesky.`,
          ),
        )
      }
    } catch (e: any) {
      // エラーが発生した場合
      // エラーメッセージをクリーンアップ（ユーザーフレンドリーな形式に）
      const {clean, raw} = cleanError(e)
      setError(clean || raw || e.message) // || 演算子で最初の真値を使用
      // ネットワークエラー以外の場合はログに記録
      if (!isNetworkError(e)) {
        logger.error(`blockedGeoOverlay: unexpected error`, {
          safeMessage: e.message,
        })
      }
    } finally {
      // 成功・失敗に関わらず、最後に要求中フラグを下ろす
      setIsRequesting(false)
    }
  }

  return (
    <View style={[a.gap_md]}> {/* 中サイズの縦方向の隙間を持つコンテナ */}
      {/* タイトル */}
      <Text style={[a.text_xl, a.font_heavy]}>
        <Trans>Confirm your location</Trans>
      </Text>
      {/* 説明テキストセクション */}
      <View style={[a.gap_sm, a.pb_xs]}>
        {/* メインの説明文 */}
        <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Tap below to allow Bluesky to access your GPS location. We will then
            use that data to more accurately determine the content and features
            available in your region.
          </Trans>
        </Text>

        {/* プライバシーに関する注記 */}
        <Text
          style={[
            a.text_md,
            a.leading_snug,
            t.atoms.text_contrast_medium,
            a.pb_xs,
          ]}>
          <Trans>
            Your location data is not tracked and does not leave your device.
          </Trans>
        </Text>
      </View>

      {/* エラーメッセージ表示（エラーがある場合のみ） */}
      {/* 【Goユーザー向け】 && 演算子: 左辺が真の場合のみ右辺を評価（条件付きレンダリング） */}
      {error && (
        <View style={[a.pb_xs]}>
          <Admonition type="error">{error}</Admonition>
        </View>
      )}

      {/* アクションボタンセクション */}
      <View style={[a.gap_sm]}>
        {/* 位置情報アクセス許可ボタン（ダイアログが無効化されていない場合のみ表示） */}
        {!dialogDisabled && (
          <Button
            disabled={isRequesting} // 要求中は無効化
            label={_(msg`Allow location access`)}
            onPress={onPressConfirm}
            size={isWeb ? 'small' : 'large'} // 三項演算子でプラットフォーム別サイズ
            color="primary">
            {/* ローディング中はスピナー、それ以外は位置情報アイコン */}
            <ButtonIcon icon={isRequesting ? Loader : LocationIcon} />
            <ButtonText>
              <Trans>Allow location access</Trans>
            </ButtonText>
          </Button>
        )}

        {/* キャンセルボタン（Web以外のプラットフォームのみ表示） */}
        {!isWeb && (
          <Button
            label={_(msg`Cancel`)}
            onPress={() => close()} // アロー関数でダイアログを閉じる
            size={isWeb ? 'small' : 'large'}
            color="secondary">
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    </View>
  )
}
