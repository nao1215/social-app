// React関連のインポート - Reactフレームワーク
import React from 'react'
// 国際化関連 - 複数形処理マクロ
import {Plural} from '@lingui/macro'
// ナビゲーション関連 - フォーカス効果フック
import {useFocusEffect} from '@react-navigation/native'

// ルーティング型定義 - 共通ナビゲーターパラメータとスタック画面プロパティ
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
// 文字列処理 - 表示名のサニタイズ
import {sanitizeDisplayName} from '#/lib/strings/display-names'
// プロフィールクエリ - ユーザープロフィール情報取得
import {useProfileQuery} from '#/state/queries/profile'
// DID解決クエリ - ユーザー名からDIDへの解決
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
// UI状態管理 - 最小シェルモード設定
import {useSetMinimalShellMode} from '#/state/shell'
// プロフィールフォローコンポーネント - フォロー中一覧表示
import {ProfileFollows as ProfileFollowsComponent} from '#/view/com/profile/ProfileFollows'
// レイアウトコンポーネント - 画面レイアウト構造
import * as Layout from '#/components/Layout'

// プロパティ型定義 - プロフィールフォロー画面のプロパティ
type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollows'>

/**
 * プロフィールフォロー画面コンポーネント
 * 指定されたユーザーがフォロー中のユーザー一覧を表示
 * フォロー数と合わせてユーザー情報もヘッダーに表示
 */
export const ProfileFollowsScreen = ({route}: Props) => {
  // ルートパラメータからユーザー名を取得
  const {name} = route.params
  // 最小シェルモード設定 - UIの表示モード制御
  const setMinimalShellMode = useSetMinimalShellMode()

  // DID解決 - ユーザー名から分散識別子へを解決
  const {data: resolvedDid} = useResolveDidQuery(name)
  // プロフィール情報 - 解決されたDIDを使ってプロフィールを取得
  const {data: profile} = useProfileQuery({
    did: resolvedDid,
  })

  // 画面フォーカス時の効果 - 最小シェルモードを無効化してフルUIを表示
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  // 画面レンダリング - ヘッダーとフォロー中コンポーネントを含むレイアウト
  return (
    <Layout.Screen testID="profileFollowsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          {profile && (
            <>
              {/* ユーザー名表示 - サニタイズ済みの表示名またはハンドル */}
              <Layout.Header.TitleText>
                {sanitizeDisplayName(profile.displayName || profile.handle)}
              </Layout.Header.TitleText>
              {/* フォロー数表示 - フォロー中のユーザー数（単数形/複数形同じ） */}
              <Layout.Header.SubtitleText>
                <Plural
                  value={profile.followsCount ?? 0}
                  one="# following"
                  other="# following"
                />
              </Layout.Header.SubtitleText>
            </>
          )}
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {/* フォロー中一覧コンポーネント - 実際のフォロー中リストを表示 */}
      <ProfileFollowsComponent name={name} />
    </Layout.Screen>
  )
}
