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
// プロフィールフォロワーコンポーネント - フォロワー一覧表示
import {ProfileFollowers as ProfileFollowersComponent} from '#/view/com/profile/ProfileFollowers'
// レイアウトコンポーネント - 画面レイアウト構造
import * as Layout from '#/components/Layout'

// プロパティ型定義 - プロフィールフォロワー画面のプロパティ
type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollowers'>

/**
 * プロフィールフォロワー画面コンポーネント
 * 指定されたユーザーのフォロワー一覧を表示
 * フォロワー数と合わせてユーザー情報もヘッダーに表示
 */
export const ProfileFollowersScreen = ({route}: Props) => {
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

  // 画面レンダリング - ヘッダーとフォロワーコンポーネントを含むレイアウト
  return (
    <Layout.Screen testID="profileFollowersScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          {profile && (
            <>
              {/* ユーザー名表示 - サニタイズ済みの表示名またはハンドル */}
              <Layout.Header.TitleText>
                {sanitizeDisplayName(profile.displayName || profile.handle)}
              </Layout.Header.TitleText>
              {/* フォロワー数表示 - 単数形/複数形を適切に切り替え */}
              <Layout.Header.SubtitleText>
                <Plural
                  value={profile.followersCount ?? 0}
                  one="# follower"
                  other="# followers"
                />
              </Layout.Header.SubtitleText>
            </>
          )}
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {/* フォロワー一覧コンポーネント - 実際のフォロワーリストを表示 */}
      <ProfileFollowersComponent name={name} />
    </Layout.Screen>
  )
}
