// React関連のインポート - メモ化、コールバック、状態管理フック
import {memo, useCallback, useMemo, useState} from 'react'
// React Nativeコンポーネント - アクティビティインジケーターとビュー
import {ActivityIndicator, View} from 'react-native'
// AT Protocolの型定義 - フィードデータ型
import {type AppBskyFeedDefs} from '@atproto/api'
// 国際化関連 - メッセージと翻訳コンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// カラーパレット - テーマカラー管理
import {usePalette} from '#/lib/hooks/usePalette'
// 検索クエリ拡張 - クエリ文字列の拡張処理
import {augmentSearchQuery} from '#/lib/strings/helpers'
// アクター検索 - ユーザー検索クエリフック
import {useActorSearch} from '#/state/queries/actor-search'
// フィード検索 - 人気フィード検索クエリフック
import {usePopularFeedsSearch} from '#/state/queries/feed'
// 投稿検索 - 投稿検索クエリフック
import {useSearchPostsQuery} from '#/state/queries/search-posts'
// セッション管理 - ユーザーセッション情報
import {useSession} from '#/state/session'
// ログアウトビュー - 未ログイン状態の表示制御
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
// UI管理 - アクティブ要素の一括クローズ
import {useCloseAllActiveElements} from '#/state/util'
// ページングコンポーネント - タブ形式のページャー
import {Pager} from '#/view/com/pager/Pager'
// タブバー - ページングのタブナビゲーション
import {TabBar} from '#/view/com/pager/TabBar'
// 投稿コンポーネント - 個別投稿表示
import {Post} from '#/view/com/post/Post'
// プロフィールカード - フォローボタン付きプロフィールカード
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
// リストコンポーネント - 仮想化リスト
import {List} from '#/view/com/util/List'
// スタイリング - CSSアトム、テーマ、ウェブスタイル
import {atoms as a, useTheme, web} from '#/alf'
// フィードカード - フィード表示コンポーネント
import * as FeedCard from '#/components/FeedCard'
// レイアウトコンポーネント - 画面レイアウト構造
import * as Layout from '#/components/Layout'
// インラインリンク - テキスト内リンクコンポーネント
import {InlineLinkText} from '#/components/Link'
// 検索エラー - 検索エラー表示コンポーネント
import {SearchError} from '#/components/SearchError'
// タイポグラフィ - テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * 検索結果コンポーネント
 * クエリに基づいて「トップ」「最新」「ユーザー」「フィード」のタブで結果を表示
 * パラメータ付きクエリの場合は投稿結果のみ、シンプルクエリの場合は全タブを表示
 */
let SearchResults = ({
  query,
  queryWithParams,
  activeTab,
  onPageSelected,
  headerHeight,
}: {
  query: string // 元のクエリ文字列
  queryWithParams: string // パラメータ付きのクエリ文字列
  activeTab: number // アクティブなタブインデックス
  onPageSelected: (page: number) => void // ページ選択時のコールバック
  headerHeight: number // ヘッダーの高さ（スティッキー配置用）
}): React.ReactNode => {
  // 国際化フック - UI文字列の翻訳
  const {_} = useLingui()

  // タブセクションの設定 - クエリタイプによって表示するタブを変更
  const sections = useMemo(() => {
    if (!queryWithParams) return []
    // パラメータなしのシンプルクエリかどうかを判定
    const noParams = queryWithParams === query
    return [
      {
        title: _(msg`Top`), // 人気投稿タブ
        component: (
          <SearchScreenPostResults
            query={queryWithParams}
            sort="top"
            active={activeTab === 0}
          />
        ),
      },
      {
        title: _(msg`Latest`), // 最新投稿タブ
        component: (
          <SearchScreenPostResults
            query={queryWithParams}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
      // パラメータなしの場合のみユーザータブを表示
      noParams && {
        title: _(msg`People`), // ユーザー検索タブ
        component: (
          <SearchScreenUserResults query={query} active={activeTab === 2} />
        ),
      },
      // パラメータなしの場合のみフィードタブを表示
      noParams && {
        title: _(msg`Feeds`), // フィード検索タブ
        component: (
          <SearchScreenFeedsResults query={query} active={activeTab === 3} />
        ),
      },
    ].filter(Boolean) as {
      title: string
      component: React.ReactNode
    }[]
  }, [_, query, queryWithParams, activeTab])

  // 検索結果ページャーのレンダリング - タブバーとコンテンツを表示
  return (
    <Pager
      onPageSelected={onPageSelected}
      renderTabBar={props => (
        // スティッキータブバー - ヘッダーの下に固定表示
        <Layout.Center style={[a.z_10, web([a.sticky, {top: headerHeight}])]}>
          <TabBar items={sections.map(section => section.title)} {...props} />
        </Layout.Center>
      )}
      initialPage={0}>
      {/* タブコンテンツ - 各セクションのコンポーネントを表示 */}
      {sections.map((section, i) => (
        <View key={i}>{section.component}</View>
      ))}
    </Pager>
  )
}
// メモ化してパフォーマンスを最適化
SearchResults = memo(SearchResults)
export {SearchResults}

/**
 * ローディングコンポーネント
 * 検索結果の読み込み中を示すスピナーを表示
 */
function Loader() {
  return (
    <Layout.Content>
      <View style={[a.py_xl]}>
        <ActivityIndicator />
      </View>
    </Layout.Content>
  )
}

/**
 * 空状態コンポーネント
 * 検索結果が空、またはエラーが発生した場合のメッセージ表示
 * メインメッセージ、オプションのエラー詳細、追加コンテンツを表示
 */
function EmptyState({
  message,
  error,
  children,
}: {
  message: string // メインメッセージ
  error?: string // オプションのエラー情報
  children?: React.ReactNode // 追加コンテンツ
}) {
  const t = useTheme()

  return (
    <Layout.Content>
      <View style={[a.p_xl]}>
        <View style={[t.atoms.bg_contrast_25, a.rounded_sm, a.p_lg]}>
          {/* メインメッセージ */}
          <Text style={[a.text_md]}>{message}</Text>

          {/* エラー情報がある場合の追加表示 */}
          {error && (
            <>
              {/* 区切り線 */}
              <View
                style={[
                  {
                    marginVertical: 12,
                    height: 1,
                    width: '100%',
                    backgroundColor: t.atoms.text.color,
                    opacity: 0.2,
                  },
                ]}
              />

              {/* エラーメッセージ */}
              <Text style={[t.atoms.text_contrast_medium]}>
                <Trans>Error: {error}</Trans>
              </Text>
            </>
          )}

          {/* 追加コンテンツ */}
          {children}
        </View>
      </View>
    </Layout.Content>
  )
}

type SearchResultSlice =
  | {
      type: 'post'
      key: string
      post: AppBskyFeedDefs.PostView
    }
  | {
      type: 'loadingMore'
      key: string
    }

let SearchScreenPostResults = ({
  query,
  sort,
  active,
}: {
  query: string
  sort?: 'top' | 'latest'
  active: boolean
}): React.ReactNode => {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [isPTR, setIsPTR] = useState(false)
  const isLoggedin = Boolean(currentAccount?.did)

  const augmentedQuery = useMemo(() => {
    return augmentSearchQuery(query || '', {did: currentAccount?.did})
  }, [query, currentAccount])

  const {
    isFetched,
    data: results,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useSearchPostsQuery({query: augmentedQuery, sort, enabled: active})

  const pal = usePalette('default')
  const t = useTheme()
  const onPullToRefresh = useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [setIsPTR, refetch])
  const onEndReached = useCallback(() => {
    if (isFetching || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetching, error, hasNextPage, fetchNextPage])

  const posts = useMemo(() => {
    return results?.pages.flatMap(page => page.posts) || []
  }, [results])
  const items = useMemo(() => {
    let temp: SearchResultSlice[] = []

    const seenUris = new Set()
    for (const post of posts) {
      if (seenUris.has(post.uri)) {
        continue
      }
      temp.push({
        type: 'post',
        key: post.uri,
        post,
      })
      seenUris.add(post.uri)
    }

    if (isFetchingNextPage) {
      temp.push({
        type: 'loadingMore',
        key: 'loadingMore',
      })
    }

    return temp
  }, [posts, isFetchingNextPage])

  const closeAllActiveElements = useCloseAllActiveElements()
  const {requestSwitchToAccount} = useLoggedOutViewControls()

  const showSignIn = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }

  const showCreateAccount = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
  }

  if (!isLoggedin) {
    return (
      <SearchError
        title={_(msg`Search is currently unavailable when logged out`)}>
        <Text style={[a.text_md, a.text_center, a.leading_snug]}>
          <Trans>
            <InlineLinkText
              style={[pal.link]}
              label={_(msg`Sign in`)}
              to={'#'}
              onPress={showSignIn}>
              Sign in
            </InlineLinkText>
            <Text style={t.atoms.text_contrast_medium}> or </Text>
            <InlineLinkText
              style={[pal.link]}
              label={_(msg`Create an account`)}
              to={'#'}
              onPress={showCreateAccount}>
              create an account
            </InlineLinkText>
            <Text> </Text>
            <Text style={t.atoms.text_contrast_medium}>
              to search for news, sports, politics, and everything else
              happening on Bluesky.
            </Text>
          </Trans>
        </Text>
      </SearchError>
    )
  }

  return error ? (
    <EmptyState
      message={_(
        msg`We're sorry, but your search could not be completed. Please try again in a few minutes.`,
      )}
      error={error.toString()}
    />
  ) : (
    <>
      {isFetched ? (
        <>
          {posts.length ? (
            <List
              data={items}
              renderItem={({item}) => {
                if (item.type === 'post') {
                  return <Post post={item.post} />
                } else {
                  return null
                }
              }}
              keyExtractor={item => item.key}
              refreshing={isPTR}
              onRefresh={onPullToRefresh}
              onEndReached={onEndReached}
              desktopFixedHeight
              contentContainerStyle={{paddingBottom: 100}}
            />
          ) : (
            <EmptyState message={_(msg`No results found for ${query}`)} />
          )}
        </>
      ) : (
        <Loader />
      )}
    </>
  )
}
SearchScreenPostResults = memo(SearchScreenPostResults)

let SearchScreenUserResults = ({
  query,
  active,
}: {
  query: string
  active: boolean
}): React.ReactNode => {
  const {_} = useLingui()

  const {data: results, isFetched} = useActorSearch({
    query,
    enabled: active,
  })

  return isFetched && results ? (
    <>
      {results.length ? (
        <List
          data={results}
          renderItem={({item}) => <ProfileCardWithFollowBtn profile={item} />}
          keyExtractor={item => item.did}
          desktopFixedHeight
          contentContainerStyle={{paddingBottom: 100}}
        />
      ) : (
        <EmptyState message={_(msg`No results found for ${query}`)} />
      )}
    </>
  ) : (
    <Loader />
  )
}
SearchScreenUserResults = memo(SearchScreenUserResults)

let SearchScreenFeedsResults = ({
  query,
  active,
}: {
  query: string
  active: boolean
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()

  const {data: results, isFetched} = usePopularFeedsSearch({
    query,
    enabled: active,
  })

  return isFetched && results ? (
    <>
      {results.length ? (
        <List
          data={results}
          renderItem={({item}) => (
            <View
              style={[
                a.border_b,
                t.atoms.border_contrast_low,
                a.px_lg,
                a.py_lg,
              ]}>
              <FeedCard.Default view={item} />
            </View>
          )}
          keyExtractor={item => item.uri}
          desktopFixedHeight
          contentContainerStyle={{paddingBottom: 100}}
        />
      ) : (
        <EmptyState message={_(msg`No results found for ${query}`)} />
      )}
    </>
  ) : (
    <Loader />
  )
}
SearchScreenFeedsResults = memo(SearchScreenFeedsResults)
