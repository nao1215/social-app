/**
 * @file スターターパック共有ダイアログコンポーネント
 * @description スターターパックを他のユーザーと共有するためのダイアログUI。
 *              リンク共有、QRコード共有、画像保存などの機能を提供します。
 */

// React Nativeのビューコンポーネント
import {View} from 'react-native'
// Expo Imageコンポーネント（画像表示用）
import {Image} from 'expo-image'
// AT Protocol APIのグラフ定義型（Goのstructに相当）
import {type AppBskyGraphDefs} from '@atproto/api'
// Lingui国際化ライブラリ（多言語対応）
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// Webメディアクエリフック（レスポンシブデザイン用）
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
// メディアライブラリへの画像保存フック
import {useSaveImageToMediaLibrary} from '#/lib/media/save-image'
// プラットフォーム固有のURL共有機能
import {shareUrl} from '#/lib/sharing'
// Statsigイベントロギング（分析用）
import {logEvent} from '#/lib/statsig/statsig'
// スターターパックのOGカード画像URL生成
import {getStarterPackOgCard} from '#/lib/strings/starter-pack'
// プラットフォーム検出（ネイティブ/Web判定）
import {isNative, isWeb} from '#/platform/detection'
// アトミックスタイルとテーマフック
import {atoms as a, useTheme} from '#/alf'
// ボタンコンポーネント
import {Button, ButtonText} from '#/components/Button'
// ダイアログ制御プロパティ型（Goのstructに相当）
import {type DialogControlProps} from '#/components/Dialog'
import * as Dialog from '#/components/Dialog'
// ローダーコンポーネント（読み込み中表示）
import {Loader} from '#/components/Loader'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * @interface Props
 * @description ShareDialogコンポーネントのプロパティ型定義
 *
 * Go開発者向け補足: interfaceはGoのstructに相当する型定義です
 */
interface Props {
  starterPack: AppBskyGraphDefs.StarterPackView // スターターパック情報
  link?: string // 共有用リンク（オプショナル）
  imageLoaded?: boolean // 画像読み込み完了フラグ
  qrDialogControl: DialogControlProps // QRコードダイアログ制御
  control: DialogControlProps // このダイアログの制御
}

/**
 * @component ShareDialog
 * @description スターターパック共有ダイアログのアウターラッパー。
 *              ダイアログの基本構造を提供します。
 *
 * @param {Props} props - コンポーネントのプロパティ
 * @returns {JSX.Element} 共有ダイアログのJSX要素
 */
export function ShareDialog(props: Props) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />
      <ShareDialogInner {...props} />
    </Dialog.Outer>
  )
}

/**
 * @component ShareDialogInner
 * @description スターターパック共有ダイアログの内部実装。
 *              リンク共有、QRコード共有、画像保存の機能を提供します。
 *
 * @param {Props} props - コンポーネントのプロパティ
 * @returns {JSX.Element} 共有ダイアログ内部のJSX要素
 *
 * Go開発者向け補足:
 * - useLinguiは国際化フックで、翻訳関数_()を提供します
 * - useThemeはダークモード対応などのテーマ情報を取得します
 */
function ShareDialogInner({
  starterPack,
  link,
  imageLoaded,
  qrDialogControl,
  control,
}: Props) {
  // 国際化フック（翻訳関数を提供）
  const {_} = useLingui()
  // テーマ情報取得
  const t = useTheme()
  // レスポンシブデザイン判定
  const {isTabletOrDesktop} = useWebMediaQueries()

  // OGカード画像URLを生成
  const imageUrl = getStarterPackOgCard(starterPack)

  /**
   * @function onShareLink
   * @description リンクを共有する関数。
   *              プラットフォーム固有のシェア機能を使用してリンクを共有します。
   */
  const onShareLink = async () => {
    if (!link) return
    shareUrl(link) // プラットフォーム固有の共有機能を呼び出し
    // 分析イベントを記録
    logEvent('starterPack:share', {
      starterPack: starterPack.uri,
      shareType: 'link',
    })
    control.close() // ダイアログを閉じる
  }

  // メディアライブラリへの保存フック
  const saveImageToAlbum = useSaveImageToMediaLibrary()

  /**
   * @function onSave
   * @description 画像をデバイスのメディアライブラリに保存する関数。
   */
  const onSave = async () => {
    await saveImageToAlbum(imageUrl)
  }

  return (
    <>
      <Dialog.ScrollableInner label={_(msg`Share link dialog`)}>
        {/* 画像またはリンクが未読み込みの場合はローダーを表示 */}
        {!imageLoaded || !link ? (
          <View style={[a.p_xl, a.align_center]}>
            <Loader size="xl" />
          </View>
        ) : (
          <View style={[!isTabletOrDesktop && a.gap_lg]}>
            {/* タイトルと説明文 */}
            <View style={[a.gap_sm, isTabletOrDesktop && a.pb_lg]}>
              <Text style={[a.font_bold, a.text_2xl]}>
                <Trans>Invite people to this starter pack!</Trans>
              </Text>
              <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                <Trans>
                  Share this starter pack and help people join your community on
                  Bluesky.
                </Trans>
              </Text>
            </View>

            {/* OGカード画像のプレビュー */}
            <Image
              source={{uri: imageUrl}}
              style={[
                a.rounded_sm,
                {
                  aspectRatio: 1200 / 630, // OGカードの標準アスペクト比
                  transform: [{scale: isTabletOrDesktop ? 0.85 : 1}],
                  marginTop: isTabletOrDesktop ? -20 : 0,
                },
              ]}
              accessibilityIgnoresInvertColors={true}
            />

            {/* アクションボタン群 */}
            <View
              style={[
                a.gap_md,
                // Webでは横並びでボタンを配置
                isWeb && [a.gap_sm, a.flex_row_reverse, {marginLeft: 'auto'}],
              ]}>
              {/* リンク共有ボタン */}
              <Button
                label={isWeb ? _(msg`Copy link`) : _(msg`Share link`)}
                variant="solid"
                color="secondary"
                size="small"
                style={[isWeb && a.self_center]}
                onPress={onShareLink}>
                <ButtonText>
                  {isWeb ? <Trans>Copy Link</Trans> : <Trans>Share link</Trans>}
                </ButtonText>
              </Button>

              {/* QRコード共有ボタン */}
              <Button
                label={_(msg`Share QR code`)}
                variant="solid"
                color="secondary"
                size="small"
                style={[isWeb && a.self_center]}
                onPress={() => {
                  // 現在のダイアログを閉じてからQRコードダイアログを開く
                  control.close(() => {
                    qrDialogControl.open()
                  })
                }}>
                <ButtonText>
                  <Trans>Share QR code</Trans>
                </ButtonText>
              </Button>

              {/* 画像保存ボタン（ネイティブのみ） */}
              {isNative && (
                <Button
                  label={_(msg`Save image`)}
                  variant="ghost"
                  color="secondary"
                  size="small"
                  style={[isWeb && a.self_center]}
                  onPress={onSave}>
                  <ButtonText>
                    <Trans>Save image</Trans>
                  </ButtonText>
                </Button>
              )}
            </View>
          </View>
        )}
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </>
  )
}
