/**
 * プロフィールフォロワー画面コンポーネント
 *
 * 【Go開発者向け説明】
 * このモジュールは、特定ユーザーのフォロワー一覧を表示する画面を提供します。
 * React Navigationの画面コンポーネントとして機能します。
 *
 * 【モジュールの役割】
 * - ユーザーのフォロワー一覧表示
 * - フォロワー数の表示（複数形対応）
 * - DID解決とプロフィール情報取得
 * - 画面フォーカス時のUI状態管理
 *
 * 【技術スタック】
 * - React Navigation: 画面遷移とフォーカス管理
 * - TanStack Query: データフェッチング
 * - Lingui: 国際化（複数形処理）
 * - ATプロトコル: 分散型識別子（DID）解決
 */

// React本体（UIコンポーネントの基盤）
import React from 'react'
// Lingui複数形処理コンポーネント（1 follower / 2 followers の切り替え）
import {Plural} from '@lingui/macro'
// React Navigation画面フォーカスフック（画面表示時の副作用処理）
// 【Go開発者向け】Goのミドルウェアに似た、画面表示時の処理を定義
import {useFocusEffect} from '@react-navigation/native'

// ルーティング型定義（型安全なナビゲーション）
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
// 文字列サニタイズ（XSS対策とユーザー入力の正規化）
import {sanitizeDisplayName} from '#/lib/strings/display-names'
// プロフィール情報取得クエリ（TanStack Query）
import {useProfileQuery} from '#/state/queries/profile'
// DID解決クエリ（ユーザー名 → 分散型識別子への変換）
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
// UI状態管理（シェルの最小表示モード制御）
import {useSetMinimalShellMode} from '#/state/shell'
// フォロワー一覧コンポーネント（実際のリスト表示ロジック）
import {ProfileFollowers as ProfileFollowersComponent} from '#/view/com/profile/ProfileFollowers'
// レイアウトコンポーネント（画面構造の定義）
import * as Layout from '#/components/Layout'

/**
 * プロフィールフォロワー画面のプロパティ型
 *
 * 【Go開発者向け説明】
 * - NativeStackScreenPropsはReact Navigationの型ヘルパー
 * - Goのhttp.Request構造体に似た役割
 * - ルートパラメータ（name: ユーザー名）を含む
 */
type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollowers'>

/**
 * プロフィールフォロワー画面コンポーネント
 *
 * 【Go開発者向け説明】
 * - React Navigationの画面コンポーネント
 * - routeパラメータからユーザー名を受け取る（GoのURLパラメータに相当）
 * - 画面表示時にDID解決とプロフィール取得を自動実行
 *
 * 【主な機能】
 * 1. URLパラメータからユーザー名を取得
 * 2. DIDを解決してプロフィール情報を取得
 * 3. フォロワー数を複数形対応で表示
 * 4. フォロワー一覧をレンダリング
 * 5. 画面フォーカス時にUI状態を更新
 *
 * @param props - コンポーネントのプロパティ
 * @param props.route - React Navigationのルート情報
 * @returns JSX要素 - フォロワー一覧画面UI
 */
export const ProfileFollowersScreen = ({route}: Props) => {
  // ルートパラメータからユーザー名を取得（Goのr.PathValue()に相当）
  const {name} = route.params

  // 最小シェルモード設定フック（UIの表示モード制御）
  // 【Go開発者向け】グローバル状態の更新関数（Goのコンテキスト変数に似ている）
  const setMinimalShellMode = useSetMinimalShellMode()

  // 【Go開発者向け説明 - TanStack Query】
  // useResolveDidQuery, useProfileQueryは非同期データフェッチングフック
  // - 自動でキャッシュ、再試行、エラーハンドリングを行う
  // - Goのhttp.Clientでのリクエストより高機能
  // - データ取得中はdataがundefined、取得後に値が入る

  // DID解決（ユーザー名 → 分散型識別子への変換）
  // 【Go開発者向け】ATプロトコルではユーザー名（@handle）とDIDが分離している
  const {data: resolvedDid} = useResolveDidQuery(name)

  // プロフィール情報取得（解決したDIDを使用）
  const {data: profile} = useProfileQuery({
    did: resolvedDid, // DID解決後の値を使用
  })

  // 【Go開発者向け説明 - useFocusEffect】
  // React Navigationの画面フォーカス時に実行される副作用フック
  // - 画面が表示される（フォーカスされる）たびに実行される
  // - Goのミドルウェアやbefore/afterフックに似た動作
  // - useCallbackでメモ化してパフォーマンス最適化
  //
  // 【この実装の意図】
  // 画面フォーカス時に最小シェルモードを無効化し、フルUIを表示
  // これによりヘッダーやナビゲーションバーが正常に表示される
  useFocusEffect(
    React.useCallback(() => {
      // 最小シェルモードを無効化（false）してフルUIを表示
      setMinimalShellMode(false)
    }, [setMinimalShellMode]), // 依存配列
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
