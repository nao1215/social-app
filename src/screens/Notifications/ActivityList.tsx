/**
 * 通知アクティビティリスト画面モジュール
 *
 * 【概要】
 * - 通知に関連する投稿の一覧を表示する画面
 * - 特定の通知グループに含まれる投稿をまとめて表示
 * - 「いいね」や「リポスト」などの通知から遷移して使用
 *
 * 【主な機能】
 * - 投稿URI一覧から投稿フィードを生成
 * - 空状態の表示（投稿がない場合）
 * - バックナビゲーション対応
 *
 * 【データフロー】
 * - ルートパラメータから投稿URIリストを受け取る
 * - URIデコードして投稿フィードコンポーネントに渡す
 * - PostFeedコンポーネントが実際の投稿データを取得・表示
 *
 * 【Go開発者向け補足】
 * - type Props: Goのstructに相当、画面プロパティの型定義
 * - decodeURIComponent: URL エンコードされた文字列のデコード
 * - renderEmptyState: レンダー関数、Goのfuncに類似だがJSX返却
 */

// 国際化 - メッセージとトランスコンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// ナビゲーション型定義 - 画面プロパティの型安全性
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

// ルート型定義 - 全ナビゲーターのパラメータ
import {type AllNavigatorParams} from '#/lib/routes/types'
// 投稿フィードコンポーネント - 投稿一覧表示
import {PostFeed} from '#/view/com/posts/PostFeed'
// 空状態コンポーネント - データがない時の表示
import {EmptyState} from '#/view/com/util/EmptyState'
// レイアウトコンポーネント - 画面構造とヘッダー
import * as Layout from '#/components/Layout'
// リストフッター - フィード末尾の表示
import {ListFooter} from '#/components/Lists'

/**
 * プロパティ型定義（Goのstructに相当）
 *
 * 【パラメータ】
 * - posts: URLエンコードされた投稿URIのリスト
 */
type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'NotificationsActivityList'
>

/**
 * 通知アクティビティリスト画面コンポーネント
 *
 * 【機能】
 * - 通知グループに関連する投稿の一覧表示
 * - ヘッダーとバックボタンの表示
 * - 空状態のハンドリング
 *
 * 【データ処理】
 * - ルートパラメータから投稿URIリストを取得
 * - decodeURIComponentでデコード（URLエンコーディングを解除）
 * - PostFeedコンポーネントに `posts|{uris}` 形式で渡す
 *
 * 【Go開発者向け補足】
 * - Destructuring: route.params.postsを直接取り出し、Goの多値返却に類似
 * - PostFeed: 再利用可能なコンポーネント、投稿一覧のロジックをカプセル化
 *
 * @param route.params.posts - URLエンコードされた投稿URIリスト
 * @returns JSX要素 - 通知アクティビティ一覧画面
 */
export function NotificationsActivityListScreen({
  route: {
    params: {posts},
  },
}: Props) {
  // URLデコード - エンコードされたURIリストを元に戻す
  const uris = decodeURIComponent(posts)
  // 国際化フック - UI文字列の翻訳取得
  const {_} = useLingui()

  return (
    <Layout.Screen testID="NotificationsActivityListScreen">
      {/* ヘッダー部分 - バックボタンとタイトル */}
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Notifications</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {/* 投稿フィード - posts|{uris}形式でフィードを生成 */}
      <PostFeed
        feed={`posts|${uris}`}
        disablePoll // ポーリング無効化（手動更新のみ）
        // 空状態レンダリング - 投稿がない場合の表示
        renderEmptyState={() => (
          <EmptyState icon="growth" message={_(msg`No posts here`)} />
        )}
        // フィード末尾レンダリング - 全投稿表示後のフッター
        renderEndOfFeed={() => <ListFooter />}
      />
    </Layout.Screen>
  )
}
