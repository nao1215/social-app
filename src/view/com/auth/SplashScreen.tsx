/**
 * スプラッシュスクリーンモジュール（ネイティブ版）
 *
 * アプリ起動時やログアウト時に表示される初期画面。
 * ログインまたは新規アカウント作成を選択できます。
 *
 * @module SplashScreen
 */

// React Native - ネイティブUIコンポーネント
import {View} from 'react-native'
// React Native Safe Area Context - 安全領域取得
import {useSafeAreaInsets} from 'react-native-safe-area-context'
// Lingui - 国際化
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// エラーバウンダリ
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
// Blueskyロゴアイコン
import {Logo} from '#/view/icons/Logo'
// Blueskyロゴタイプ（テキストロゴ）
import {Logotype} from '#/view/icons/Logotype'
// デザインシステム
import {atoms as a, useTheme} from '#/alf'
// 言語選択ドロップダウン
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
// ボタンコンポーネント
import {Button, ButtonText} from '#/components/Button'
// テキストコンポーネント
import {Text} from '#/components/Typography'
// 中央揃えビュー
import {CenteredView} from '../util/Views'

/**
 * スプラッシュスクリーンコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @param props.onPressSignin - ログインボタン押下時のコールバック
 * @param props.onPressCreateAccount - アカウント作成ボタン押下時のコールバック
 */
export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const t = useTheme()
  const {_} = useLingui()
  // デバイスの安全領域（ノッチなど）のインセット値を取得
  const insets = useSafeAreaInsets()

  return (
    <CenteredView style={[a.h_full, a.flex_1]}>
      <ErrorBoundary>
        {/* ロゴとキャッチフレーズを中央に配置 */}
        <View style={[{flex: 1}, a.justify_center, a.align_center]}>
          <Logo width={92} fill="sky" />

          <View style={[a.pb_sm, a.pt_5xl]}>
            <Logotype width={161} fill={t.atoms.text.color} />
          </View>

          <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
            <Trans>What's up?</Trans>
          </Text>
        </View>
        {/* アカウント作成とログインボタン */}
        <View
          testID="signinOrCreateAccount"
          style={[a.px_xl, a.gap_md, a.pb_2xl]}>
          <Button
            testID="createAccountButton"
            onPress={onPressCreateAccount}
            label={_(msg`Create new account`)}
            accessibilityHint={_(
              msg`Opens flow to create a new Bluesky account`,
            )}
            size="large"
            variant="solid"
            color="primary">
            <ButtonText>
              <Trans>Create account</Trans>
            </ButtonText>
          </Button>
          <Button
            testID="signInButton"
            onPress={onPressSignin}
            label={_(msg`Sign in`)}
            accessibilityHint={_(
              msg`Opens flow to sign in to your existing Bluesky account`,
            )}
            size="large"
            variant="solid"
            color="secondary">
            <ButtonText>
              <Trans>Sign in</Trans>
            </ButtonText>
          </Button>
        </View>
        {/* 言語選択ドロップダウン */}
        <View
          style={[
            a.px_lg,
            a.pt_md,
            a.pb_2xl,
            a.justify_center,
            a.align_center,
          ]}>
          <View>
            <AppLanguageDropdown />
          </View>
        </View>
        {/* 安全領域の下部スペース */}
        <View style={{height: insets.bottom}} />
      </ErrorBoundary>
    </CenteredView>
  )
}
