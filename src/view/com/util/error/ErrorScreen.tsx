/**
 * エラースクリーンコンポーネント
 * Error Screen Component
 *
 * 【概要】
 * 重大なエラー発生時に表示するフルスクリーンエラー画面。
 * タイトル、メッセージ、詳細情報、リトライボタンを含む。
 *
 * 【使用場面】
 * - ページ読み込み失敗
 * - 認証エラー
 * - 重大なAPIエラー
 * - ネットワーク接続不可
 *
 * 【レイアウト】
 * ┌─────────────────────┐
 * │ [ヘッダー（オプション）]  │
 * │                     │
 * │       (!)           │
 * │      タイトル        │
 * │     メッセージ       │
 * │    ┌──詳細情報──┐   │
 * │    │  エラー詳細  │   │
 * │    └───────────┘   │
 * │   [再試行ボタン]     │
 * └─────────────────────┘
 *
 * 【Goユーザー向け補足】
 * - Trans: コンパイル時に翻訳処理されるコンポーネント（Goのi18nパッケージに相当）
 * - Layout.Center: 中央揃えレイアウト
 * - Layout.Header.*: Compound Componentパターンによるヘッダー構築
 */

// React Nativeの基本コンポーネント
// React Native basic component
import {View} from 'react-native'

// FontAwesomeアイコンコンポーネント
// FontAwesome icon component
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

// 国際化マクロとコンポーネント
// Internationalization macro and component
import {msg, Trans} from '@lingui/macro'

// 国際化フック
// Internationalization hook
import {useLingui} from '@lingui/react'

// テーマカラー取得フック
// Theme color hook
import {usePalette} from '#/lib/hooks/usePalette'

// デザインシステム
// Design system
import {atoms as a, useTheme} from '#/alf'

// ボタンコンポーネント
// Button components
import {Button, ButtonIcon, ButtonText} from '#/components/Button'

// リトライアイコン
// Retry icon
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon} from '#/components/icons/ArrowRotateCounterClockwise'

// レイアウトコンポーネント
// Layout components
import * as Layout from '#/components/Layout'

// テキストコンポーネント
// Text component
import {Text} from '#/components/Typography'

/**
 * エラースクリーンコンポーネント
 * Error Screen Component
 *
 * @param title エラータイトル / Error title
 * @param message エラーメッセージ / Error message
 * @param details 詳細情報（オプション） / Detail information (optional)
 * @param onPressTryAgain リトライコールバック / Retry callback
 * @param testID テストID / Test ID
 * @param showHeader ヘッダー表示フラグ / Show header flag
 */
export function ErrorScreen({
  title,
  message,
  details,
  onPressTryAgain,
  testID,
  showHeader,
}: {
  title: string
  message: string
  details?: string
  onPressTryAgain?: () => void
  testID?: string
  showHeader?: boolean
}) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()

  return (
    <Layout.Center testID={testID}>
      {showHeader && (
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Error</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
      )}
      <View style={[a.px_xl, a.py_2xl]}>
        <View style={[a.mb_md, a.align_center]}>
          <View
            style={[
              a.rounded_full,
              {width: 50, height: 50},
              a.align_center,
              a.justify_center,
              {backgroundColor: t.palette.contrast_950},
            ]}>
            <FontAwesomeIcon
              icon="exclamation"
              style={pal.textInverted as FontAwesomeIconStyle}
              size={24}
            />
          </View>
        </View>
        <Text style={[a.text_center, a.font_heavy, a.text_2xl, a.mb_md]}>
          {title}
        </Text>
        <Text style={[a.text_center, a.text_md, a.mb_xl]}>{message}</Text>
        {details && (
          <View
            style={[
              a.w_full,
              a.border,
              t.atoms.border_contrast_medium,
              t.atoms.bg_contrast_25,
              a.mb_xl,
              a.py_sm,
              a.px_lg,
              a.rounded_xs,
              a.overflow_hidden,
            ]}>
            <Text
              testID={`${testID}-details`}
              style={[a.text_center, a.text_md, t.atoms.text_contrast_high]}>
              {details}
            </Text>
          </View>
        )}
        {onPressTryAgain && (
          <View style={[a.align_center]}>
            <Button
              testID="errorScreenTryAgainButton"
              onPress={onPressTryAgain}
              variant="solid"
              color="secondary_inverted"
              size="small"
              label={_(msg`Retry`)}
              accessibilityHint={_(
                msg`Retries the last action, which errored out`,
              )}>
              <ButtonIcon icon={ArrowRotateCounterClockwiseIcon} />
              <ButtonText>
                <Trans context="action">Try again</Trans>
              </ButtonText>
            </Button>
          </View>
        )}
      </View>
    </Layout.Center>
  )
}
