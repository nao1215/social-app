/**
 * @file Feeds.tsx - フィード管理画面
 * @description ユーザーが保存したフィードと人気フィードを表示・検索・管理する画面
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: Goのhttp.HandlerFuncに相当するが、複雑な状態管理を持つ
 * - TanStack Query: GoのORMやキャッシュレイヤーに相当。サーバー状態を自動管理
 * - フラットリスト: 仮想スクロールによる大量データの効率的な描画（GoのDBカーソルに似た概念）
 * - デバウンス: 連続した関数呼び出しを遅延実行（GoのRate Limitingに似た機能）
 *
 * ## 主な機能
 * - ユーザーの保存済みフィード一覧表示（ピン留め対応）
 * - 人気フィードの検索・一覧表示（無限スクロール）
 * - フィード検索機能（デバウンス付き）
 * - プルトゥリフレッシュによる再読み込み
 * - 新規投稿作成用FABボタン
 *
 * ## アーキテクチャ
 * - 複雑な状態管理: 複数のTanStack Queryフックによるサーバー状態管理
 * - 仮想化リスト: FlatListSlice型による型安全なアイテム管理
 * - 条件分岐レンダリング: ログイン状態や検索状態に応じた動的UI
 * - パフォーマンス最適化: React.useMemo、React.useCallbackによるメモ化
 *
 * ## データフロー
 * 1. useSavedFeeds: 保存済みフィード取得（TanStack Query）
 * 2. useGetPopularFeedsQuery: 人気フィード取得（無限スクロール対応）
 * 3. useSearchPopularFeedsMutation: フィード検索実行
 * 4. items useMemo: 上記3つの状態を統合してFlatListSliceに変換
 * 5. List（FlatList）: アイテムを仮想スクロール表示
 *
 * @module view/screens/Feeds
 */

// React本体: UIコンポーネントの基盤ライブラリ
import React from 'react'
// React Native基本コンポーネント: ActivityIndicator=ローディングスピナー、StyleSheet=スタイル、View=コンテナ
import {ActivityIndicator, StyleSheet, View} from 'react-native'
// AT Protocol型定義: フィード関連のBsky型定義（Goのprotoファイルに相当）
import {type AppBskyFeedDefs} from '@atproto/api'
// Lingui国際化: msg=翻訳キー、Trans=翻訳可能なテキストコンポーネント
import {msg, Trans} from '@lingui/macro'
// Lingui国際化フック: 現在のロケール情報と翻訳関数を提供
import {useLingui} from '@lingui/react'
// React Navigation: 画面フォーカス時の副作用実行用フック
import {useFocusEffect} from '@react-navigation/native'
// Lodashデバウンス: 連続実行を防ぐ遅延実行関数（GoのRate Limitingパターン）
import debounce from 'lodash.debounce'

// カスタムフック: 投稿作成モーダルを開く関数を提供
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
// カスタムフック: テーマカラーパレットを取得（ダークモード等）
import {usePalette} from '#/lib/hooks/usePalette'
// カスタムフック: レスポンシブデザイン用のメディアクエリ判定
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
// アイコン: 投稿作成ボタン用のアイコン
import {ComposeIcon2} from '#/lib/icons'
// 型定義: 画面コンポーネントのプロパティ型（React NavigationのNavigator設定）
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
// ユーティリティ: エラーメッセージのクリーンアップ処理
import {cleanError} from '#/lib/strings/errors'
// スタイル定数: 共通スタイル定義（padding、margin等のユーティリティ）
import {s} from '#/lib/styles'
// プラットフォーム検出: iOS/Android/Webの実行環境判定
import {isNative, isWeb} from '#/platform/detection'
// TanStack Query: フィード関連のデータ取得・検索フック（GoのORMに相当）
import {
  type SavedFeedItem,
  useGetPopularFeedsQuery,
  useSavedFeeds,
  useSearchPopularFeedsMutation,
} from '#/state/queries/feed'
// セッション管理: ログイン状態の取得
import {useSession} from '#/state/session'
// シェル状態管理: ミニマルモード（ヘッダー表示制御）の設定フック
import {useSetMinimalShellMode} from '#/state/shell'
// エラーメッセージコンポーネント: エラー表示用UI
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
// FAB: Floating Action Button（投稿作成ボタン）
import {FAB} from '#/view/com/util/fab/FAB'
// リストコンポーネント: 仮想スクロール対応のFlatList（Goのページネーションに相当）
import {List, type ListMethods} from '#/view/com/util/List'
// ローディングプレースホルダー: スケルトンスクリーン表示
import {FeedFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
// テキストコンポーネント: スタイル適用可能なテキスト表示
import {Text} from '#/view/com/util/text/Text'
// エンプティステート: Followingフィードが無い場合の表示
import {NoFollowingFeed} from '#/screens/Feeds/NoFollowingFeed'
// エンプティステート: 保存済みフィードが無い場合の表示
import {NoSavedFeedsOfAnyType} from '#/screens/Feeds/NoSavedFeedsOfAnyType'
// デザインシステム: Alfアトミックスタイルとテーマフック
import {atoms as a, useTheme} from '#/alf'
// ボタンアイコンコンポーネント: アイコン付きボタン
import {ButtonIcon} from '#/components/Button'
// 区切り線コンポーネント: 要素間の視覚的な区切り
import {Divider} from '#/components/Divider'
// フィードカードコンポーネント: フィード情報の表示カード
import * as FeedCard from '#/components/FeedCard'
// 検索入力コンポーネント: 検索ボックスUI
import {SearchInput} from '#/components/forms/SearchInput'
// アイコン円形背景: アイコンの装飾用円形背景
import {IconCircle} from '#/components/IconCircle'
// アイコン: 右シェブロン（矢印）
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
// アイコン: タイムラインフィルター
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'
// アイコン: 虫眼鏡付きリスト
import {ListMagnifyingGlass_Stroke2_Corner0_Rounded} from '#/components/icons/ListMagnifyingGlass'
// アイコン: キラキラ付きリスト
import {ListSparkle_Stroke2_Corner0_Rounded} from '#/components/icons/ListSparkle'
// アイコン: 設定歯車
import {SettingsGear2_Stroke2_Corner0_Rounded as Gear} from '#/components/icons/SettingsGear2'
// レイアウトコンポーネント: 画面全体のレイアウト構造
import * as Layout from '#/components/Layout'
// リンクコンポーネント: ナビゲーション用のリンク
import {Link} from '#/components/Link'
// リストカードコンポーネント: リスト情報の表示カード
import * as ListCard from '#/components/ListCard'

// 型定義: React Navigationから渡されるプロパティの型
type Props = NativeStackScreenProps<CommonNavigatorParams, 'Feeds'>

/**
 * FlatListに渡すアイテムの型定義（タグ付きユニオン型）
 *
 * ## Goとの対比
 * - Goのinterface{}やswitch type assertionに似た概念
 * - TypeScriptのDiscriminated Union（判別可能な共用体型）
 * - typeフィールドで型を判別し、各ケースで異なるプロパティを持つ
 *
 * ## アーキテクチャ
 * - FlatListは異なる種類のアイテムを表示できる
 * - エラー、ヘッダー、ローディング、データ等を統一的に扱う
 */
type FlatlistSlice =
  // エラーアイテム: エラーメッセージ表示用
  | {
      type: 'error'
      key: string
      error: string
    }
  // 保存済みフィードセクションのヘッダー
  | {
      type: 'savedFeedsHeader'
      key: string
    }
  // 保存済みフィードのプレースホルダー（スケルトンスクリーン）
  | {
      type: 'savedFeedPlaceholder'
      key: string
    }
  // 保存済みフィードが0件の場合のエンプティステート
  | {
      type: 'savedFeedNoResults'
      key: string
    }
  // 保存済みフィードのデータアイテム
  | {
      type: 'savedFeed'
      key: string
      savedFeed: SavedFeedItem
    }
  // 保存済みフィードの追加読み込みボタン
  | {
      type: 'savedFeedsLoadMore'
      key: string
    }
  // 人気フィードセクションのヘッダー
  | {
      type: 'popularFeedsHeader'
      key: string
    }
  // 人気フィードのローディング表示
  | {
      type: 'popularFeedsLoading'
      key: string
    }
  // 人気フィードが0件の場合のエンプティステート
  | {
      type: 'popularFeedsNoResults'
      key: string
    }
  // 人気フィードのデータアイテム
  | {
      type: 'popularFeed'
      key: string
      feedUri: string
      feed: AppBskyFeedDefs.GeneratorView
    }
  // 人気フィードの追加読み込み中表示（無限スクロール）
  | {
      type: 'popularFeedsLoadingMore'
      key: string
    }
  // Followingフィードが無い場合の警告表示
  | {
      type: 'noFollowingFeed'
      key: string
    }

/**
 * フィード画面のメインコンポーネント
 *
 * ## Goとの対比
 * - Goのhttp.HandlerFunc + ビジネスロジック + テンプレートレンダリングを統合
 * - 複数のTanStack Queryフック = GoのRepository層に相当
 * - React状態管理 = Goのミドルウェアやコンテキストに相当
 *
 * @param _props - ルーティングパラメータ（未使用）
 */
export function FeedsScreen(_props: Props) {
  // テーマパレット取得
  const pal = usePalette('default')
  // 投稿作成モーダルを開く関数
  const {openComposer} = useOpenComposer()
  // レスポンシブ判定: モバイルかデスクトップか
  const {isMobile} = useWebMediaQueries()
  // ローカル状態: 検索クエリ文字列
  const [query, setQuery] = React.useState('')
  // ローカル状態: Pull-to-Refresh中かどうか
  const [isPTR, setIsPTR] = React.useState(false)

  /**
   * TanStack Query: 保存済みフィード取得
   * - data: フィードデータ
   * - isPlaceholderData: プレースホルダーデータ表示中か（初回読み込み時）
   * - error: エラーオブジェクト
   * - refetch: 再取得関数
   */
  const {
    data: savedFeeds,
    isPlaceholderData: isSavedFeedsPlaceholder,
    error: savedFeedsError,
    refetch: refetchSavedFeeds,
  } = useSavedFeeds()

  /**
   * TanStack Query: 人気フィード取得（無限スクロール対応）
   * - data: ページ分割されたフィードデータ（pages配列）
   * - isFetching: 取得中か
   * - error: エラーオブジェクト
   * - refetch: 再取得関数
   * - fetchNextPage: 次ページ取得関数（GoのLIMIT/OFFSET相当）
   * - isFetchingNextPage: 次ページ取得中か
   * - hasNextPage: 次ページが存在するか
   */
  const {
    data: popularFeeds,
    isFetching: isPopularFeedsFetching,
    error: popularFeedsError,
    refetch: refetchPopularFeeds,
    fetchNextPage: fetchNextPopularFeedsPage,
    isFetchingNextPage: isPopularFeedsFetchingNextPage,
    hasNextPage: hasNextPopularFeedsPage,
  } = useGetPopularFeedsQuery()

  // 翻訳関数
  const {_} = useLingui()
  // シェルモード設定関数
  const setMinimalShellMode = useSetMinimalShellMode()

  /**
   * TanStack Query Mutation: フィード検索実行
   * - data: 検索結果データ
   * - mutate: 検索実行関数（GoのPOSTハンドラーに相当）
   * - reset: 検索結果クリア
   * - isPending: 検索実行中か
   * - error: エラーオブジェクト
   */
  const {
    data: searchResults,
    mutate: search,
    reset: resetSearch,
    isPending: isSearchPending,
    error: searchError,
  } = useSearchPopularFeedsMutation()

  // セッション情報: ログイン中かどうか
  const {hasSession} = useSession()
  // リストコンポーネントへの参照（スクロール制御用）
  const listRef = React.useRef<ListMethods>(null)

  /**
   * 検索中かどうかの判定
   * - クエリ文字列が2文字以上なら検索モード
   * - 検索結果が無くても検索中と判定される（ローディング状態の判別用）
   */
  const isUserSearching = query.length > 1

  /**
   * デバウンス付き検索関数の生成
   *
   * ## Goとの対比
   * - GoのRate Limiterに似た概念
   * - 連続した関数呼び出しを500ms遅延させて実行
   * - useMemoで関数を再生成せず、パフォーマンス最適化
   *
   * ## 動作
   * - ユーザーがタイピング中は検索を実行しない
   * - タイピング停止後500msで検索実行
   */
  const debouncedSearch = React.useMemo(
    () => debounce(q => search(q), 500), // 500msのデバウンス
    [search],
  )

  /**
   * 投稿作成ボタン押下時のハンドラ
   * - 投稿作成モーダルを開く
   */
  const onPressCompose = React.useCallback(() => {
    openComposer({})
  }, [openComposer])

  /**
   * 検索クエリ変更時のハンドラ
   *
   * ## 動作フロー
   * 1. クエリ文字列を状態に保存
   * 2. 2文字以上ならデバウンス付き検索実行
   * 3. 2文字未満なら検索リセット + 人気フィード再取得
   *
   * @param text - 検索クエリ文字列
   */
  const onChangeQuery = React.useCallback(
    (text: string) => {
      setQuery(text)
      if (text.length > 1) {
        // 検索実行（デバウンス付き）
        debouncedSearch(text)
      } else {
        // 検索解除時は通常の人気フィードに戻す
        refetchPopularFeeds()
        resetSearch()
      }
    },
    [setQuery, refetchPopularFeeds, debouncedSearch, resetSearch],
  )

  /**
   * 検索キャンセルボタン押下時のハンドラ
   * - クエリをクリアして通常の人気フィード表示に戻す
   */
  const onPressCancelSearch = React.useCallback(() => {
    setQuery('')
    refetchPopularFeeds()
    resetSearch()
  }, [refetchPopularFeeds, setQuery, resetSearch])

  /**
   * 検索フォーム送信時のハンドラ
   * - Enterキー押下時に即座に検索実行（デバウンス経由）
   */
  const onSubmitQuery = React.useCallback(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  /**
   * Pull-to-Refresh実行時のハンドラ
   *
   * ## Goとの対比
   * - Promise.allはGoのerrgroup.Groupに相当
   * - 複数の非同期処理を並列実行し、全て完了を待つ
   *
   * ## 動作
   * 1. PTRフラグをtrueに設定（ローディング表示）
   * 2. 保存済みフィードと人気フィードを並列で再取得
   * 3. エラーは無視（catchで握りつぶす）
   * 4. PTRフラグをfalseに設定（ローディング非表示）
   */
  const onPullToRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await Promise.all([
      refetchSavedFeeds().catch(_e => undefined), // エラー無視
      refetchPopularFeeds().catch(_e => undefined), // エラー無視
    ])
    setIsPTR(false)
  }, [setIsPTR, refetchSavedFeeds, refetchPopularFeeds])

  /**
   * リスト下端到達時のハンドラ（無限スクロール）
   *
   * ## Goとの対比
   * - GoのページネーションLIMIT/OFFSETに相当
   * - TanStack Queryが次ページのカーソルを自動管理
   *
   * ## ガード条件
   * - 取得中の場合は実行しない
   * - 検索中の場合は実行しない（検索結果は無限スクロール非対応）
   * - 次ページが無い場合は実行しない
   * - エラーがある場合は実行しない
   */
  const onEndReached = React.useCallback(() => {
    if (
      isPopularFeedsFetching ||
      isUserSearching ||
      !hasNextPopularFeedsPage ||
      popularFeedsError
    )
      return
    // 次ページ取得
    fetchNextPopularFeedsPage()
  }, [
    isPopularFeedsFetching,
    isUserSearching,
    popularFeedsError,
    hasNextPopularFeedsPage,
    fetchNextPopularFeedsPage,
  ])

  // 画面フォーカス時の副作用: ミニマルモード無効化
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  /**
   * FlatListアイテムの生成（メモ化）
   *
   * ## Goとの対比
   * - Goのテンプレートレンダリングに相当するが、より複雑
   * - 複数のAPI結果を統合してUI用の配列に変換
   * - useMemoで依存配列が変わるまで再計算しない（パフォーマンス最適化）
   *
   * ## データフロー
   * 1. 保存済みフィードセクション生成（ログイン時のみ）
   *    - ヘッダー → エラー or プレースホルダー or データアイテム
   *    - ピン留めフィードを先頭に表示
   * 2. 人気フィードセクション生成（常に表示 or 条件付き）
   *    - ヘッダー + 検索ボックス → エラー or ローディング or データアイテム
   *    - 検索中は検索結果、通常時は人気フィード（無限スクロール）
   *
   * ## 型安全性
   * - FlatlistSlice型でアイテムの種類を型で判別
   * - renderItem関数でtypeによる分岐レンダリング
   *
   * @returns FlatlistSlice[] - FlatListに渡すアイテム配列
   */
  const items = React.useMemo(() => {
    let slices: FlatlistSlice[] = []
    // 実際の保存済みフィード数があるか判定（プレースホルダーでも0件でない場合true）
    const hasActualSavedCount =
      !isSavedFeedsPlaceholder ||
      (isSavedFeedsPlaceholder && (savedFeeds?.count || 0) > 0)
    // 「人気フィード」セクションを表示するか判定
    // - 未ログイン: 常に表示
    // - ログイン済み: 保存済みフィードがある場合のみ表示
    const canShowDiscoverSection =
      !hasSession || (hasSession && hasActualSavedCount)

    if (hasSession) {
      slices.push({
        key: 'savedFeedsHeader',
        type: 'savedFeedsHeader',
      })

      if (savedFeedsError) {
        slices.push({
          key: 'savedFeedsError',
          type: 'error',
          error: cleanError(savedFeedsError.toString()),
        })
      } else {
        if (isSavedFeedsPlaceholder && !savedFeeds?.feeds.length) {
          /*
           * Initial render in placeholder state is 0 on a cold page load,
           * because preferences haven't loaded yet.
           *
           * In practice, `savedFeeds` is always defined, but we check for TS
           * and for safety.
           *
           * In both cases, we show 4 as the the loading state.
           */
          const min = 8
          const count = savedFeeds
            ? savedFeeds.count === 0
              ? min
              : savedFeeds.count
            : min
          Array(count)
            .fill(0)
            .forEach((_, i) => {
              slices.push({
                key: 'savedFeedPlaceholder' + i,
                type: 'savedFeedPlaceholder',
              })
            })
        } else {
          if (savedFeeds?.feeds?.length) {
            const noFollowingFeed = savedFeeds.feeds.every(
              f => f.type !== 'timeline',
            )

            slices = slices.concat(
              savedFeeds.feeds
                .filter(s => {
                  return s.config.pinned
                })
                .map(s => ({
                  key: `savedFeed:${s.view?.uri}:${s.config.id}`,
                  type: 'savedFeed',
                  savedFeed: s,
                })),
            )
            slices = slices.concat(
              savedFeeds.feeds
                .filter(s => {
                  return !s.config.pinned
                })
                .map(s => ({
                  key: `savedFeed:${s.view?.uri}:${s.config.id}`,
                  type: 'savedFeed',
                  savedFeed: s,
                })),
            )

            if (noFollowingFeed) {
              slices.push({
                key: 'noFollowingFeed',
                type: 'noFollowingFeed',
              })
            }
          } else {
            slices.push({
              key: 'savedFeedNoResults',
              type: 'savedFeedNoResults',
            })
          }
        }
      }
    }

    if (!hasSession || (hasSession && canShowDiscoverSection)) {
      slices.push({
        key: 'popularFeedsHeader',
        type: 'popularFeedsHeader',
      })

      if (popularFeedsError || searchError) {
        slices.push({
          key: 'popularFeedsError',
          type: 'error',
          error: cleanError(
            popularFeedsError?.toString() ?? searchError?.toString() ?? '',
          ),
        })
      } else {
        if (isUserSearching) {
          if (isSearchPending || !searchResults) {
            slices.push({
              key: 'popularFeedsLoading',
              type: 'popularFeedsLoading',
            })
          } else {
            if (!searchResults || searchResults?.length === 0) {
              slices.push({
                key: 'popularFeedsNoResults',
                type: 'popularFeedsNoResults',
              })
            } else {
              slices = slices.concat(
                searchResults.map(feed => ({
                  key: `popularFeed:${feed.uri}`,
                  type: 'popularFeed',
                  feedUri: feed.uri,
                  feed,
                })),
              )
            }
          }
        } else {
          if (isPopularFeedsFetching && !popularFeeds?.pages) {
            slices.push({
              key: 'popularFeedsLoading',
              type: 'popularFeedsLoading',
            })
          } else {
            if (!popularFeeds?.pages) {
              slices.push({
                key: 'popularFeedsNoResults',
                type: 'popularFeedsNoResults',
              })
            } else {
              for (const page of popularFeeds.pages || []) {
                slices = slices.concat(
                  page.feeds.map(feed => ({
                    key: `popularFeed:${feed.uri}`,
                    type: 'popularFeed',
                    feedUri: feed.uri,
                    feed,
                  })),
                )
              }

              if (isPopularFeedsFetchingNextPage) {
                slices.push({
                  key: 'popularFeedsLoadingMore',
                  type: 'popularFeedsLoadingMore',
                })
              }
            }
          }
        }
      }
    }

    return slices
  }, [
    hasSession,
    savedFeeds,
    isSavedFeedsPlaceholder,
    savedFeedsError,
    popularFeeds,
    isPopularFeedsFetching,
    popularFeedsError,
    isPopularFeedsFetchingNextPage,
    searchResults,
    isSearchPending,
    searchError,
    isUserSearching,
  ])

  const searchBarIndex = items.findIndex(
    item => item.type === 'popularFeedsHeader',
  )

  const onChangeSearchFocus = React.useCallback(
    (focus: boolean) => {
      if (focus && searchBarIndex > -1) {
        if (isNative) {
          // scrollToIndex scrolls the exact right amount, so use if available
          listRef.current?.scrollToIndex({
            index: searchBarIndex,
            animated: true,
          })
        } else {
          // web implementation only supports scrollToOffset
          // thus, we calculate the offset based on the index
          // pixel values are estimates, I wasn't able to get it pixel perfect :(
          const headerHeight = isMobile ? 43 : 53
          const feedItemHeight = isMobile ? 49 : 58
          listRef.current?.scrollToOffset({
            offset: searchBarIndex * feedItemHeight - headerHeight,
            animated: true,
          })
        }
      }
    },
    [searchBarIndex, isMobile],
  )

  const renderItem = React.useCallback(
    ({item}: {item: FlatlistSlice}) => {
      if (item.type === 'error') {
        return <ErrorMessage message={item.error} />
      } else if (item.type === 'popularFeedsLoadingMore') {
        return (
          <View style={s.p10}>
            <ActivityIndicator size="large" />
          </View>
        )
      } else if (item.type === 'savedFeedsHeader') {
        return <FeedsSavedHeader />
      } else if (item.type === 'savedFeedNoResults') {
        return (
          <View
            style={[
              pal.border,
              {
                borderBottomWidth: 1,
              },
            ]}>
            <NoSavedFeedsOfAnyType />
          </View>
        )
      } else if (item.type === 'savedFeedPlaceholder') {
        return <SavedFeedPlaceholder />
      } else if (item.type === 'savedFeed') {
        return <FeedOrFollowing savedFeed={item.savedFeed} />
      } else if (item.type === 'popularFeedsHeader') {
        return (
          <>
            <FeedsAboutHeader />
            <View style={{paddingHorizontal: 12, paddingBottom: 4}}>
              <SearchInput
                placeholder={_(msg`Search feeds`)}
                value={query}
                onChangeText={onChangeQuery}
                onClearText={onPressCancelSearch}
                onSubmitEditing={onSubmitQuery}
                onFocus={() => onChangeSearchFocus(true)}
                onBlur={() => onChangeSearchFocus(false)}
              />
            </View>
          </>
        )
      } else if (item.type === 'popularFeedsLoading') {
        return <FeedFeedLoadingPlaceholder />
      } else if (item.type === 'popularFeed') {
        return (
          <View style={[a.px_lg, a.pt_lg, a.gap_lg]}>
            <FeedCard.Default view={item.feed} />
            <Divider />
          </View>
        )
      } else if (item.type === 'popularFeedsNoResults') {
        return (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: '150%',
            }}>
            <Text type="lg" style={pal.textLight}>
              <Trans>No results found for "{query}"</Trans>
            </Text>
          </View>
        )
      } else if (item.type === 'noFollowingFeed') {
        return (
          <View
            style={[
              pal.border,
              {
                borderBottomWidth: 1,
              },
            ]}>
            <NoFollowingFeed />
          </View>
        )
      }
      return null
    },
    [
      _,
      pal.border,
      pal.textLight,
      query,
      onChangeQuery,
      onPressCancelSearch,
      onSubmitQuery,
      onChangeSearchFocus,
    ],
  )

  return (
    <Layout.Screen testID="FeedsScreen">
      <Layout.Center>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Feeds</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot>
            <Link
              testID="editFeedsBtn"
              to="/settings/saved-feeds"
              label={_(msg`Edit My Feeds`)}
              size="small"
              variant="ghost"
              color="secondary"
              shape="round"
              style={[a.justify_center, {right: -3}]}>
              <ButtonIcon icon={Gear} size="lg" />
            </Link>
          </Layout.Header.Slot>
        </Layout.Header.Outer>

        <List
          ref={listRef}
          data={items}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.contentContainer}
          renderItem={renderItem}
          refreshing={isPTR}
          onRefresh={isUserSearching ? undefined : onPullToRefresh}
          initialNumToRender={10}
          onEndReached={onEndReached}
          desktopFixedHeight
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          sideBorders={false}
        />
      </Layout.Center>

      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      )}
    </Layout.Screen>
  )
}

function FeedOrFollowing({savedFeed}: {savedFeed: SavedFeedItem}) {
  return savedFeed.type === 'timeline' ? (
    <FollowingFeed />
  ) : (
    <SavedFeed savedFeed={savedFeed} />
  )
}

function FollowingFeed() {
  const t = useTheme()
  const {_} = useLingui()
  return (
    <View
      style={[
        a.flex_1,
        a.px_lg,
        a.py_md,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <FeedCard.Header>
        <View
          style={[
            a.align_center,
            a.justify_center,
            {
              width: 28,
              height: 28,
              borderRadius: 3,
              backgroundColor: t.palette.primary_500,
            },
          ]}>
          <FilterTimeline
            style={[
              {
                width: 18,
                height: 18,
              },
            ]}
            fill={t.palette.white}
          />
        </View>
        <FeedCard.TitleAndByline
          title={_(msg({message: 'Following', context: 'feed-name'}))}
        />
      </FeedCard.Header>
    </View>
  )
}

function SavedFeed({
  savedFeed,
}: {
  savedFeed: SavedFeedItem & {type: 'feed' | 'list'}
}) {
  const t = useTheme()

  const commonStyle = [
    a.w_full,
    a.flex_1,
    a.px_lg,
    a.py_md,
    a.border_b,
    t.atoms.border_contrast_low,
  ]

  return savedFeed.type === 'feed' ? (
    <FeedCard.Link
      testID={`saved-feed-${savedFeed.view.displayName}`}
      {...savedFeed}>
      {({hovered, pressed}) => (
        <View
          style={[commonStyle, (hovered || pressed) && t.atoms.bg_contrast_25]}>
          <FeedCard.Header>
            <FeedCard.Avatar src={savedFeed.view.avatar} size={28} />
            <FeedCard.TitleAndByline title={savedFeed.view.displayName} />

            <ChevronRight size="sm" fill={t.atoms.text_contrast_low.color} />
          </FeedCard.Header>
        </View>
      )}
    </FeedCard.Link>
  ) : (
    <ListCard.Link testID={`saved-feed-${savedFeed.view.name}`} {...savedFeed}>
      {({hovered, pressed}) => (
        <View
          style={[commonStyle, (hovered || pressed) && t.atoms.bg_contrast_25]}>
          <ListCard.Header>
            <ListCard.Avatar src={savedFeed.view.avatar} size={28} />
            <ListCard.TitleAndByline title={savedFeed.view.name} />

            <ChevronRight size="sm" fill={t.atoms.text_contrast_low.color} />
          </ListCard.Header>
        </View>
      )}
    </ListCard.Link>
  )
}

function SavedFeedPlaceholder() {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_1,
        a.px_lg,
        a.py_md,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <FeedCard.Header>
        <FeedCard.AvatarPlaceholder size={28} />
        <FeedCard.TitleAndBylinePlaceholder />
      </FeedCard.Header>
    </View>
  )
}

function FeedsSavedHeader() {
  const t = useTheme()

  return (
    <View
      style={
        isWeb
          ? [
              a.flex_row,
              a.px_md,
              a.py_lg,
              a.gap_md,
              a.border_b,
              t.atoms.border_contrast_low,
            ]
          : [
              {flexDirection: 'row-reverse'},
              a.p_lg,
              a.gap_md,
              a.border_b,
              t.atoms.border_contrast_low,
            ]
      }>
      <IconCircle icon={ListSparkle_Stroke2_Corner0_Rounded} size="lg" />
      <View style={[a.flex_1, a.gap_xs]}>
        <Text style={[a.flex_1, a.text_2xl, a.font_heavy, t.atoms.text]}>
          <Trans>My Feeds</Trans>
        </Text>
        <Text style={[t.atoms.text_contrast_high]}>
          <Trans>All the feeds you've saved, right in one place.</Trans>
        </Text>
      </View>
    </View>
  )
}

function FeedsAboutHeader() {
  const t = useTheme()

  return (
    <View
      style={
        isWeb
          ? [a.flex_row, a.px_md, a.pt_lg, a.pb_lg, a.gap_md]
          : [{flexDirection: 'row-reverse'}, a.p_lg, a.gap_md]
      }>
      <IconCircle
        icon={ListMagnifyingGlass_Stroke2_Corner0_Rounded}
        size="lg"
      />
      <View style={[a.flex_1, a.gap_sm]}>
        <Text style={[a.flex_1, a.text_2xl, a.font_heavy, t.atoms.text]}>
          <Trans>Discover New Feeds</Trans>
        </Text>
        <Text style={[t.atoms.text_contrast_high]}>
          <Trans>
            Choose your own timeline! Feeds built by the community help you find
            content you love.
          </Trans>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  savedFeed: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  savedFeedMobile: {
    paddingVertical: 10,
  },
  offlineSlug: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  headerBtnGroup: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
})
