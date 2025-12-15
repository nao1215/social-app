/**
 * @file ProfileFeedLikedBy.tsx - カスタムフィード「いいね」ユーザー一覧画面
 * @description カスタムフィードに「いいね」したユーザーの一覧を表示する画面
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: UIを返す関数（Goのハンドラー関数に相当）
 * - URI構築: AT Protocol のレコードURI（at://did/collection/rkey）を生成
 * - 再利用コンポーネント: PostLikedBy コンポーネントを再利用（投稿もフィードも同じ構造）
 *
 * ## 主な機能
 * - カスタムフィードの「いいね」ユーザーリストの表示
 * - ユーザープロフィールへの遷移
 *
 * ## アーキテクチャ
 * - シンプルなラッパーコンポーネント: PostLikedBy コンポーネントに URI を渡すだけ
 * - URI解決: name（handle または DID）と rkey から AT Protocol URI を構築
 * - レイアウト: CenteredView で中央寄せ、サイドボーダー付き
 *
 * @module view/screens/ProfileFeedLikedBy
 */

// Reactコアライブラリ
import React from 'react'
// 国際化ライブラリ（翻訳）
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// React Navigation（画面フォーカス時の処理）
import {useFocusEffect} from '@react-navigation/native'

// ナビゲーション型定義
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
// AT Protocol レコードURI生成ユーティリティ
import {makeRecordUri} from '#/lib/strings/url-helpers'
// シェルモード制御（ヘッダー/フッター表示状態）
import {useSetMinimalShellMode} from '#/state/shell'
// 「いいね」したユーザー一覧コンポーネント（投稿とフィードで共通利用）
import {PostLikedBy as PostLikedByComponent} from '#/view/com/post-thread/PostLikedBy'
// ビューヘッダー
import {ViewHeader} from '#/view/com/util/ViewHeader'
// 中央寄せビュー
import {CenteredView} from '#/view/com/util/Views'
// レイアウトコンポーネント
import * as Layout from '#/components/Layout'

// 画面プロパティ型定義（React Navigation のルートパラメータ）
type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFeedLikedBy'>

/**
 * ProfileFeedLikedByScreen - カスタムフィード「いいね」ユーザー一覧画面
 *
 * Goでの例:
 * func FeedLikedByHandler(w http.ResponseWriter, r *http.Request) {
 *   name := chi.URLParam(r, "name")
 *   rkey := chi.URLParam(r, "rkey")
 *   uri := makeRecordURI(name, "app.bsky.feed.generator", rkey)
 *   users := feedService.GetLikedByUsers(ctx, uri)
 *   render(w, "liked_by.html", users)
 * }
 */
export const ProfileFeedLikedByScreen = ({route}: Props) => {
  const setMinimalShellMode = useSetMinimalShellMode()
  // ルートパラメータから name（handle または DID）と rkey（レコードキー）を取得
  const {name, rkey} = route.params
  // AT Protocol URI を構築: at://name/app.bsky.feed.generator/rkey
  // 例: at://alice.bsky.social/app.bsky.feed.generator/3jzfcijpj2z2a
  const uri = makeRecordUri(name, 'app.bsky.feed.generator', rkey)
  const {_} = useLingui() // 国際化関数

  /**
   * 画面フォーカス時の副作用: フルスクリーンモードを解除
   *
   * Goでの例: middleware.OnEnter(func() { showHeader() })
   */
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen testID="postLikedByScreen">
      <CenteredView sideBorders={true}>
        {/* ヘッダー: "Liked By" タイトル表示 */}
        <ViewHeader title={_(msg`Liked By`)} />
        {/* メインコンテンツ: 「いいね」ユーザー一覧（PostLikedBy を再利用） */}
        <PostLikedByComponent uri={uri} />
      </CenteredView>
    </Layout.Screen>
  )
}
