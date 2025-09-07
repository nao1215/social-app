// React関連のインポート - Reactフレームワークとネイティブコンポーネント
import React from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
// AT Protocolの型定義 - フィードデータ型
import {type AppBskyFeedDefs} from '@atproto/api'
// 国際化関連 - メッセージとロケール処理
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// ナビゲーション関連 - フォーカス効果とスタック画面の型
import {useFocusEffect} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

// UI定数 - ヒットスロープ設定
import {HITSLOP_10} from '#/lib/constants'
// リスト最適化 - 初期表示アイテム数取得フック
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
// ルーティング型定義 - 共通ナビゲーターパラメータ
import {type CommonNavigatorParams} from '#/lib/routes/types'
// 共有機能 - URL共有ユーティリティ
import {shareUrl} from '#/lib/sharing'
// エラー処理 - エラーメッセージクリーンアップ
import {cleanError} from '#/lib/strings/errors'
// 文字列処理 - 長さ制限の強制
import {enforceLen} from '#/lib/strings/helpers'
// データクエリ - 投稿検索クエリフック
import {useSearchPostsQuery} from '#/state/queries/search-posts'
// UI状態管理 - 最小シェルモード設定
import {useSetMinimalShellMode} from '#/state/shell'
// ページングコンポーネント - タブ形式のページャー
import {Pager} from '#/view/com/pager/Pager'
// タブバー - ページングのタブナビゲーション
import {TabBar} from '#/view/com/pager/TabBar'
// 投稿コンポーネント - 個別投稿表示
import {Post} from '#/view/com/post/Post'
// リストコンポーネント - 仮想化リスト
import {List} from '#/view/com/util/List'
// スタイリング - CSSアトムとウェブスタイル
import {atoms as a, web} from '#/alf'
// ボタンコンポーネント - 基本ボタンとアイコンボタン
import {Button, ButtonIcon} from '#/components/Button'
// 共有アイコン - 矢印アウトオブボックスアイコン
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
// レイアウトコンポーネント - 画面レイアウト構造
import * as Layout from '#/components/Layout'
// リスト関連 - フッターとプレースホルダー
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'

// リストアイテム描画関数 - 投稿データを投稿コンポーネントでレンダリング
const renderItem = ({item}: ListRenderItemInfo<AppBskyFeedDefs.PostView>) => {
  return <Post post={item} />
}

// キー抽出関数 - リストアイテムの一意キー生成（URI + インデックス）
const keyExtractor = (item: AppBskyFeedDefs.PostView, index: number) => {
  return `${item.uri}-${index}`
}

/**
 * トピック画面コンポーネント
 * 指定されたトピックに関連する投稿を「トップ」と「最新」タブで表示
 * ハッシュタグと異なり、トピックベースでのコンテンツ検索機能を提供
 */
export default function TopicScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'Topic'>) {
  // ルートパラメータからトピックを取得
  const {topic} = route.params
  // 国際化フック - UI文字列の翻訳
  const {_} = useLingui()

  // ヘッダータイトル用の短縮トピック名 - 24文字制限で中央省略
  const headerTitle = React.useMemo(() => {
    return enforceLen(decodeURIComponent(topic), 24, true, 'middle')
  }, [topic])

  // 共有機能のコールバック - トピックページのURL生成
  const onShare = React.useCallback(() => {
    const url = new URL('https://bsky.app')
    url.pathname = `/topic/${topic}`
    shareUrl(url.toString())
  }, [topic])

  // アクティブタブの状態管理 - 「トップ」（0）と「最新」（1）を切り替え
  const [activeTab, setActiveTab] = React.useState(0)
  // 最小シェルモード設定 - UIの表示モード制御
  const setMinimalShellMode = useSetMinimalShellMode()

  // 画面フォーカス時の効果 - 最小シェルモードを無効化してフルUIを表示
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  // ページ選択時のコールバック - タブ切り替え時にUIモードを更新
  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setActiveTab(index)
    },
    [setMinimalShellMode],
  )

  // タブセクションの設定 - 「トップ」と「最新」の2つのタブを定義
  const sections = React.useMemo(() => {
    return [
      {
        title: _(msg`Top`), // 人気投稿を表示するタブ
        component: (
          <TopicScreenTab topic={topic} sort="top" active={activeTab === 0} />
        ),
      },
      {
        title: _(msg`Latest`), // 最新投稿を表示するタブ
        component: (
          <TopicScreenTab
            topic={topic}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
    ]
  }, [_, topic, activeTab])

  // 画面レンダリング - ページャーとタブバーを含むレイアウト
  return (
    <Layout.Screen>
      <Pager
        onPageSelected={onPageSelected}
        renderTabBar={props => (
          <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
            <Layout.Header.Outer noBottomBorder>
              <Layout.Header.BackButton />
              <Layout.Header.Content>
                <Layout.Header.TitleText>{headerTitle}</Layout.Header.TitleText>
              </Layout.Header.Content>
              <Layout.Header.Slot>
                {/* 共有ボタン - トピックページのURL共有機能 */}
                <Button
                  label={_(msg`Share`)}
                  size="small"
                  variant="ghost"
                  color="primary"
                  shape="round"
                  onPress={onShare}
                  hitSlop={HITSLOP_10}
                  style={[{right: -3}]}>
                  <ButtonIcon icon={Share} size="md" />
                </Button>
              </Layout.Header.Slot>
            </Layout.Header.Outer>
            {/* タブバー - 「トップ」と「最新」の切り替えタブ */}
            <TabBar items={sections.map(section => section.title)} {...props} />
          </Layout.Center>
        )}
        initialPage={0}>
        {/* タブコンテンツ - 各セクションのコンポーネントを表示 */}
        {sections.map((section, i) => (
          <View key={i}>{section.component}</View>
        ))}
      </Pager>
    </Layout.Screen>
  )
}

/**
 * トピック画面のタブコンポーネント
 * 特定のソート順（トップ/最新）でトピック関連投稿を表示
 * 無限スクロールとプルトゥリフレッシュをサポート
 */
function TopicScreenTab({
  topic,
  sort,
  active,
}: {
  topic: string // トピック文字列（URLエンコードされている）
  sort: 'top' | 'latest' // ソート順：人気順または最新順
  active: boolean // タブがアクティブかどうか
}) {
  // 国際化フック
  const {_} = useLingui()
  // 初期表示アイテム数の最適化
  const initialNumToRender = useInitialNumToRender()
  // プルトゥリフレッシュの状態管理
  const [isPTR, setIsPTR] = React.useState(false)

  // 投稿検索クエリ - アクティブな場合のみデータを取得
  const {
    data,
    isFetched,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSearchPostsQuery({
    query: decodeURIComponent(topic), // URLデコードしてクエリとして使用
    sort,
    enabled: active,
  })

  // ページネーションされた投稿データの平坦化
  const posts = React.useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || []
  }, [data])

  // プルトゥリフレッシュのコールバック - データの再取得
  const onRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [refetch])

  // 無限スクロールのコールバック - 次ページの取得
  const onEndReached = React.useCallback(() => {
    if (isFetchingNextPage || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  // タブコンテンツのレンダリング - 投稿リストまたは空状態の表示
  return (
    <>
      {posts.length < 1 ? (
        // 空状態 - ローディング、エラー、または結果なしを表示
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched}
          isError={isError}
          onRetry={refetch}
          emptyType="results"
          emptyMessage={_(msg`We couldn't find any results for that topic.`)}
        />
      ) : (
        // 投稿リスト - 仮想化リストで投稿を表示
        <List
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTR}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={4} // スクロール末尾の4アイテム前で次ページ取得
          // @ts-ignore web only -prf
          desktopFixedHeight
          ListFooterComponent={
            // フッター - 次ページ読み込み状態とエラー表示
            <ListFooter
              isFetchingNextPage={isFetchingNextPage}
              error={cleanError(error)}
              onRetry={fetchNextPage}
            />
          }
          initialNumToRender={initialNumToRender} // パフォーマンス最適化
          windowSize={11} // 仮想化ウィンドウサイズ
        />
      )}
    </>
  )
}
