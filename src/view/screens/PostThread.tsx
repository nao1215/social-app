/**
 * @file PostThread.tsx - 投稿スレッド画面
 * @description 特定の投稿とその返信スレッドを表示するレガシービューコンポーネント
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: UIを返す関数（Goのhttp.HandlerFuncに相当）
 * - useFocusEffect: 画面フォーカス時の副作用処理（Goのmiddlewareに類似）
 * - AT Protocol URI: at://did/collection/rkey 形式の分散識別子
 * - レガシーラッパー: 新しいPostThreadコンポーネントへの橋渡し
 *
 * ## 主な機能
 * - 投稿とその返信スレッドの表示
 * - ルートパラメータからAT Protocol URIを生成
 * - 新しいPostThreadコンポーネントへのプロパティ転送
 * - シェルモード制御（フルUI表示）
 *
 * ## アーキテクチャ
 * - シンプルなラッパー: URLパラメータを解析しURIを構築
 * - コンポーネント委譲: 実際の表示ロジックは screens/PostThread に委譲
 * - レイアウト統合: Layout.Screen でラップして統一的なUI構造を提供
 *
 * ## レガシー情報
 * - /view/screens は旧構造のスクリーンコンポーネント
 * - 新しいスクリーン実装は /screens 配下に移行中
 * - このファイルは互換性のために維持
 *
 * @module view/screens/PostThread
 */

// Reactフック（コールバックのメモ化）
import {useCallback} from 'react'
// React Navigationフック（画面フォーカス時の副作用処理）
import {useFocusEffect} from '@react-navigation/native'

// ナビゲーション型定義
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
// AT Protocol レコードURI生成ユーティリティ
import {makeRecordUri} from '#/lib/strings/url-helpers'
// シェルモード設定フック（ヘッダー/フッター表示制御）
import {useSetMinimalShellMode} from '#/state/shell'
// 新しいPostThreadコンポーネント（実際の表示ロジック）
import {PostThread} from '#/screens/PostThread'
// レイアウトコンポーネント群
import * as Layout from '#/components/Layout'

// 画面プロパティ型定義（React Navigation のルートパラメータ）
type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>

/**
 * PostThreadScreen - 投稿スレッド画面コンポーネント
 *
 * Goでの例:
 * func PostThreadHandler(w http.ResponseWriter, r *http.Request) {
 *   name := chi.URLParam(r, "name")
 *   rkey := chi.URLParam(r, "rkey")
 *   uri := makeRecordURI(name, "app.bsky.feed.post", rkey)
 *   thread := postService.GetThread(ctx, uri)
 *   render(w, "post_thread.html", thread)
 * }
 *
 * 処理フロー:
 * 1. ルートパラメータから name と rkey を取得
 * 2. makeRecordUri で AT Protocol URI を構築
 * 3. 新しい PostThread コンポーネントに URI を渡す
 * 4. フォーカス時にミニマルシェルモードを無効化
 *
 * @param props - name（ユーザー名/DID）とrkey（レコードキー）を含むルートパラメータ
 * @returns JSX要素 - 投稿スレッド画面
 */
export function PostThreadScreen({route}: Props) {
  // シェルモード設定関数を取得
  const setMinimalShellMode = useSetMinimalShellMode()

  // ルートパラメータからユーザー名/DIDとレコードキーを取得
  const {name, rkey} = route.params
  // AT Protocol URI を構築: at://name/app.bsky.feed.post/rkey
  // 例: at://alice.bsky.social/app.bsky.feed.post/3jzfcijpj2z2a
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  /**
   * 画面フォーカス時の副作用処理
   * ミニマルシェルモードを無効化してフルUIを表示
   *
   * Goでの例: middleware.OnEnter(func() { showFullUI() })
   */
  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen testID="postThreadScreen">
      {/* 新しいPostThreadコンポーネントに処理を委譲 */}
      <PostThread uri={uri} />
    </Layout.Screen>
  )
}
