/**
 * @file 認証設定画面
 *
 * Blueskyの認証バッジ表示/非表示を制御する設定画面。
 * Blueskyの認証システムは他のプラットフォームと異なる仕組みを持つため、
 * 説明ページへのリンクも提供する。
 *
 * Go開発者への補足:
 * - コンポーネントは関数として定義され、状態管理フックを使用
 * - 内部コンポーネント（Inner）は外部コンポーネント（Screen）の中で定義されることがある
 */

// React Nativeのビューコンポーネント
import {View} from 'react-native'
// Linguiの国際化マクロ
import {msg, Trans} from '@lingui/macro'
// Lingui React統合
import {useLingui} from '@lingui/react'

// 定数URL（Blueskyのウェブサイトリンク）
import {urls} from '#/lib/constants'
// ロガーユーティリティ
import {logger} from '#/logger'
// プリファレンスクエリフックと型定義
import {
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
// 認証設定を更新するミューテーションフック
import {useSetVerificationPrefsMutation} from '#/state/queries/preferences'
// 設定リストコンポーネント群（名前空間インポート）
import * as SettingsList from '#/screens/Settings/components/SettingsList'
// デザインシステムのアトムとガターユーティリティ
import {atoms as a, useGutters} from '#/alf'
// 注意書きコンポーネント（ヒント、警告などの表示）
import {Admonition} from '#/components/Admonition'
// トグルフォームコンポーネント群
import * as Toggle from '#/components/forms/Toggle'
// チェックマーク入り円形アイコン
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheck} from '#/components/icons/CircleCheck'
// レイアウトコンポーネント群（画面、ヘッダー、コンテンツ）
import * as Layout from '#/components/Layout'
// インラインリンクテキストコンポーネント
import {InlineLinkText} from '#/components/Link'
// ローディングスピナー
import {Loader} from '#/components/Loader'

export function Screen() {
  const {_} = useLingui()
  const gutters = useGutters(['base'])
  const {data: preferences} = usePreferencesQuery()

  return (
    <Layout.Screen testID="ModerationVerificationSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Verification Settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <Admonition type="tip" style={[a.flex_1]}>
              <Trans>
                Verifications on Bluesky work differently than on other
                platforms.{' '}
                <InlineLinkText
                  overridePresentation
                  to={urls.website.blog.initialVerificationAnnouncement}
                  label={_(
                    msg({
                      message: `Learn more`,
                      context: `english-only-resource`,
                    }),
                  )}
                  onPress={() => {
                    logger.metric(
                      'verification:learn-more',
                      {
                        location: 'verificationSettings',
                      },
                      {statsig: true},
                    )
                  }}>
                  Learn more here.
                </InlineLinkText>
              </Trans>
            </Admonition>
          </SettingsList.Item>
          {preferences ? (
            <Inner preferences={preferences} />
          ) : (
            <View style={[gutters, a.justify_center, a.align_center]}>
              <Loader size="xl" />
            </View>
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function Inner({preferences}: {preferences: UsePreferencesQueryResponse}) {
  const {_} = useLingui()
  const {hideBadges} = preferences.verificationPrefs
  const {mutate: setVerificationPrefs, isPending} =
    useSetVerificationPrefsMutation()

  return (
    <Toggle.Item
      type="checkbox"
      name="hideBadges"
      label={_(msg`Hide verification badges`)}
      value={hideBadges}
      disabled={isPending}
      onChange={value => {
        setVerificationPrefs({hideBadges: value})
      }}>
      <SettingsList.Item>
        <SettingsList.ItemIcon icon={CircleCheck} />
        <SettingsList.ItemText>
          <Trans>Hide verification badges</Trans>
        </SettingsList.ItemText>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}
