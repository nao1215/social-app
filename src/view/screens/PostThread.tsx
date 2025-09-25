import {useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostThread} from '#/screens/PostThread'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>

/**
 * PostThreadScreen - 投稿スレッド画面コンポーネント
 *
 * 【主な機能】
 * - 特定の投稿とそのスレッド（返信）表示
 * - 投稿URIの生成とスレッドコンポーネントへの委譲
 * - ミニマルシェルモードの無効化
 * - 投稿詳細ページへのナビゲーション処理
 *
 * 【レガシー情報】
 * - 旧viewシステムの投稿詳細画面実装
 * - 新しいscreens/PostThreadへの橋渡し役
 *
 * 【アーキテクチャ】
 * - ルートパラメータからAT Protocol URI生成
 * - 実際の表示は新しいPostThreadコンポーネントに委譲
 * - フォーカス時のシェル状態制御
 *
 * @param props - name（ユーザー名）とrkey（レコードキー）を含むルートパラメータ
 * @returns JSX要素 - 投稿スレッド画面
 */
export function PostThreadScreen({route}: Props) {
  const setMinimalShellMode = useSetMinimalShellMode()

  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen testID="postThreadScreen">
      <PostThread uri={uri} />
    </Layout.Screen>
  )
}
