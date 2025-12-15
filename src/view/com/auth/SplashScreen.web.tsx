/**
 * スプラッシュスクリーンモジュール（Web版）
 *
 * Web版のスプラッシュスクリーン。ネイティブ版に加えて以下の機能があります：
 * - 閉じるボタン（オプション）
 * - App Clipオーバーレイ対応
 * - かわいいモード（巨大ロゴ）
 * - フッターリンク（Business, Blog, Jobs）
 *
 * @module SplashScreen.web
 */

// React - フック
import React from 'react'
// React Native - ネイティブUIコンポーネント
import {Pressable, View} from 'react-native'
// FontAwesome - アイコンライブラリ
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
// Lingui - 国際化
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// Webメディアクエリフック（レスポンシブ判定）
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
// かわいいモード設定フック（巨大ロゴ表示）
import {useKawaiiMode} from '#/state/preferences/kawaii'
// エラーバウンダリ
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
// Blueskyロゴアイコン
import {Logo} from '#/view/icons/Logo'
// Blueskyロゴタイプ（テキストロゴ）
import {Logotype} from '#/view/icons/Logotype'
// App Clipオーバーレイ（iOSのApp Clip機能）
import {
  AppClipOverlay,
  postAppClipMessage,
} from '#/screens/StarterPack/StarterPackLandingScreen'
// デザインシステム
import {atoms as a, useTheme} from '#/alf'
// 言語選択ドロップダウン
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
// ボタンコンポーネント
import {Button, ButtonText} from '#/components/Button'
// レイアウトコンポーネント
import * as Layout from '#/components/Layout'
// インラインリンクテキスト
import {InlineLinkText} from '#/components/Link'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * スプラッシュスクリーンコンポーネント（Web版）
 *
 * @param props - コンポーネントのプロパティ
 * @param props.onDismiss - 閉じるボタン押下時のコールバック（オプション）
 * @param props.onPressSignin - ログインボタン押下時のコールバック
 * @param props.onPressCreateAccount - アカウント作成ボタン押下時のコールバック
 */
export const SplashScreen = ({
  onDismiss,
  onPressSignin,
  onPressCreateAccount,
}: {
  onDismiss?: () => void
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const {_} = useLingui()
  const t = useTheme()
  const {isTabletOrMobile: isMobileWeb} = useWebMediaQueries()
  const [showClipOverlay, setShowClipOverlay] = React.useState(false)

  /**
   * Go開発者向け: useEffect は副作用フック
   * コンポーネントマウント時にURLパラメータをチェックし、
   * App Clipモードかどうかを判定します
   */
  React.useEffect(() => {
    const getParams = new URLSearchParams(window.location.search)
    const clip = getParams.get('clip')
    if (clip === 'true') {
      setShowClipOverlay(true)
      // App Clipにメッセージを送信
      postAppClipMessage({
        action: 'present',
      })
    }
  }, [])

  // かわいいモードが有効かどうか（巨大ロゴを表示）
  const kawaii = useKawaiiMode()

  return (
    <>
      {/* 閉じるボタン（onDismissが提供されている場合のみ表示） */}
      {onDismiss && (
        <Pressable
          accessibilityRole="button"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: 20,
            zIndex: 100,
          }}
          onPress={onDismiss}>
          <FontAwesomeIcon
            icon="x"
            size={24}
            style={{
              color: String(t.atoms.text.color),
            }}
          />
        </Pressable>
      )}

      <Layout.Center style={[a.h_full, a.flex_1]} ignoreTabletLayoutOffset>
        <View
          testID="noSessionView"
          style={[
            a.h_full,
            a.justify_center,
            // @ts-expect-error web only - Web専用スタイル（ビューポート単位）
            {paddingBottom: '20vh'},
            isMobileWeb && a.pb_5xl,
            t.atoms.border_contrast_medium,
            a.align_center,
            a.gap_5xl,
            a.flex_1,
          ]}>
          <ErrorBoundary>
            {/* ロゴとキャッチフレーズ */}
            <View style={[a.justify_center, a.align_center]}>
              {/* かわいいモードでは巨大ロゴ（300px）、通常は92px */}
              <Logo width={kawaii ? 300 : 92} fill="sky" />

              {/* かわいいモードではロゴタイプを非表示 */}
              {!kawaii && (
                <View style={[a.pb_sm, a.pt_5xl]}>
                  <Logotype width={161} fill={t.atoms.text.color} />
                </View>
              )}

              <Text
                style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
                <Trans>What's up?</Trans>
              </Text>
            </View>

            {/* アカウント作成とログインボタン */}
            <View
              testID="signinOrCreateAccount"
              style={[a.w_full, a.px_xl, a.gap_md, a.pb_2xl, {maxWidth: 320}]}>
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
          </ErrorBoundary>
        </View>
        {/* フッター（Business, Blog, Jobs リンクと言語選択） */}
        <Footer />
      </Layout.Center>
      {/* App Clipオーバーレイ（iOSのApp Clip機能用） */}
      <AppClipOverlay
        visible={showClipOverlay}
        setIsVisible={setShowClipOverlay}
      />
    </>
  )
}

/**
 * フッターコンポーネント
 *
 * Business、Blog、Jobsへのリンクと言語選択ドロップダウンを表示します。
 */
function Footer() {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <View
      style={[
        a.absolute,
        a.inset_0,
        {top: 'auto'}, // 下部に固定
        a.px_xl,
        a.py_lg,
        a.border_t,
        a.flex_row,
        a.align_center,
        a.flex_wrap,
        a.gap_xl,
        a.flex_1,
        t.atoms.border_contrast_medium,
      ]}>
      {/* Blueskyビジネスページへのリンク */}
      <InlineLinkText
        label={_(msg`Learn more about Bluesky`)}
        to="https://bsky.social">
        <Trans>Business</Trans>
      </InlineLinkText>
      {/* Blueskyブログへのリンク */}
      <InlineLinkText
        label={_(msg`Read the Bluesky blog`)}
        to="https://bsky.social/about/blog">
        <Trans>Blog</Trans>
      </InlineLinkText>
      {/* Bluesky採用情報へのリンク */}
      <InlineLinkText
        label={_(msg`See jobs at Bluesky`)}
        to="https://bsky.social/about/join">
        <Trans comment="Link to a page with job openings at Bluesky">
          Jobs
        </Trans>
      </InlineLinkText>

      {/* フレックススペーサー（右側に言語選択を配置するため） */}
      <View style={a.flex_1} />

      {/* 言語選択ドロップダウン */}
      <AppLanguageDropdown />
    </View>
  )
}
