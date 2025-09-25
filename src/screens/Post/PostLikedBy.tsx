import React from 'react'
import {Plural, Trans} from '@lingui/macro'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {usePostThreadQuery} from '#/state/queries/post-thread'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostLikedBy as PostLikedByComponent} from '#/view/com/post-thread/PostLikedBy'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostLikedBy'>
/**
 * 投稿のいいね一覧画面コンポーネント
 *
 * 【主な機能】
 * - 特定の投稿にいいねしたユーザー一覧の表示
 * - いいね数の表示（複数形対応）
 * - ユーザープロフィールへのナビゲーション
 * - フォロー/アンフォロー機能
 *
 * 【状態管理】
 * - usePostThreadQuery: 投稿データといいね情報の取得
 * - setMinimalShellMode: 通常のシェル表示モード設定
 * - route.params: 投稿識別情報（name, rkey）
 *
 * 【外部連携】
 * - ATプロトコルのいいね情報取得API
 * - 投稿URIの構築と管理
 * - ユーザープロフィール画面との連携
 *
 * @param props.route - ナビゲーションルート（投稿識別パラメータ含む）
 * @returns JSX要素 - いいね一覧画面のUI
 */
export const PostLikedByScreen = ({route}: Props) => {
  const setMinimalShellMode = useSetMinimalShellMode()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const {data: post} = usePostThreadQuery(uri)

  let likeCount
  if (post?.thread.type === 'post') {
    likeCount = post.thread.post.likeCount
  }

  /**
   * 画面フォーカス時のシェルモード設定
   * - ミニマルシェルモードを無効化（通常のナビゲーション表示）
   * - ヘッダーとフッターを表示して操作性を確保
   */
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          {post && (
            <>
              <Layout.Header.TitleText>
                <Trans>Liked By</Trans>
              </Layout.Header.TitleText>
              <Layout.Header.SubtitleText>
                <Plural value={likeCount ?? 0} one="# like" other="# likes" />
              </Layout.Header.SubtitleText>
            </>
          )}
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <PostLikedByComponent uri={uri} />
    </Layout.Screen>
  )
}
