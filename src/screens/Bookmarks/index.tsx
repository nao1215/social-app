/**
 * @file ブックマーク画面
 * @description ユーザーが保存した投稿（ブックマーク）の一覧を表示し、管理する画面
 *
 * 主な機能:
 * - ブックマークした投稿の一覧表示
 * - プルトゥリフレッシュによる更新
 * - 無限スクロールによるページネーション
 * - 削除された投稿の表示と削除
 * - 空状態の表示
 *
 * @see useBookmarksQuery ブックマーク一覧を取得するReact Query（Goのstructタグに相当するQueryキー管理）
 * @see useBookmarkMutation ブックマークの追加・削除を行うMutation
 */

// React Hooks: Reactの状態管理・副作用のためのフック（Goの関数クロージャに近い）
// - useCallback: 関数のメモ化（再レンダリング時に同一参照を保持）
// - useMemo: 値のメモ化（計算コストの高い値をキャッシュ）
// - useState: コンポーネントのローカル状態管理（Goのstructフィールドに相当）
import {useCallback, useMemo, useState} from 'react'
// React Nativeのビューコンポーネント（UIの構造を定義）
import {View} from 'react-native'
// AT Protocol型定義: Blueskyプロトコルのスキーマ定義
// $Typed: 型安全性を強化するラッパー型
// AppBskyBookmarkDefs: ブックマーク関連の型定義
// AppBskyFeedDefs: フィード（投稿）関連の型定義
import {
  type $Typed,
  type AppBskyBookmarkDefs,
  AppBskyFeedDefs,
} from '@atproto/api'
// Lingui国際化: メッセージ定義とコンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// React Navigation: 画面フォーカス時のフック（画面表示時に実行される副作用）
import {useFocusEffect} from '@react-navigation/native'

// エラーメッセージのクリーンアップフック
import {useCleanError} from '#/lib/hooks/useCleanError'
// リストの初期レンダリング数を計算するフック（パフォーマンス最適化）
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
// ルーティング型定義（Goのルーター型定義に相当）
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
// ロギングユーティリティ（メトリクス計測）
import {logger} from '#/logger'
// プラットフォーム検出（iOS/Android/Web判定）
import {isIOS} from '#/platform/detection'
// ブックマーク操作のMutation（Goのリポジトリパターンに相当）
import {useBookmarkMutation} from '#/state/queries/bookmarks/useBookmarkMutation'
// ブックマーク一覧取得のQuery（データフェッチング）
import {useBookmarksQuery} from '#/state/queries/bookmarks/useBookmarksQuery'
// シェルモード制御（ヘッダー/タブバーの表示制御）
import {useSetMinimalShellMode} from '#/state/shell'
// 投稿コンポーネント
import {Post} from '#/view/com/post/Post'
// リストコンポーネント（VirtualizedList）
import {List} from '#/view/com/util/List'
// ローディングプレースホルダー（スケルトンスクリーン）
import {PostFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
// 空状態コンポーネント
import {EmptyState} from '#/screens/Bookmarks/components/EmptyState'
// デザインシステム: atoms（スタイルユーティリティ）とテーマフック
import {atoms as a, useTheme} from '#/alf'
// ボタンコンポーネント群
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// ブックマークアイコン（塗りつぶし版）
import {BookmarkFilled} from '#/components/icons/Bookmark'
// 疑問符アイコン（削除された投稿用）
import {CircleQuestion_Stroke2_Corner2_Rounded as QuestionIcon} from '#/components/icons/CircleQuestion'
// レイアウトコンポーネント（画面構造）
import * as Layout from '#/components/Layout'
// リストフッターコンポーネント
import {ListFooter} from '#/components/Lists'
// スケルトンコンポーネント（ローディング表示）
import * as Skele from '#/components/Skeleton'
// トースト通知
import * as toast from '#/components/Toast'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * @typedef Props
 * @description ブックマーク画面のプロパティ型（Goのstructに相当）
 * @property {NativeStackScreenProps<CommonNavigatorParams, 'Bookmarks'>} - React Navigationの画面プロパティ
 */
type Props = NativeStackScreenProps<CommonNavigatorParams, 'Bookmarks'>

/**
 * @function BookmarksScreen
 * @description ブックマーク画面のメインコンポーネント
 *
 * この画面は以下の要素で構成される:
 * - ヘッダー（戻るボタン、タイトル）
 * - ブックマーク一覧（BookmarksInner）
 *
 * @param {Props} props - 画面プロパティ（未使用だが型安全性のため定義）
 * @returns {JSX.Element} ブックマーク画面のUI
 *
 * @note
 * - useSetMinimalShellMode: シェルモードを設定するフック（ヘッダー/タブバーの表示制御）
 * - useFocusEffect: 画面フォーカス時に実行される副作用フック（Goのdefer文に似た動作）
 * - logger.metric: メトリクスログを記録（Analytics用）
 */
export function BookmarksScreen({}: Props) {
  // シェルモードを設定する関数を取得（最小モードではヘッダーが縮小される）
  const setMinimalShellMode = useSetMinimalShellMode()

  // 画面フォーカス時の副作用
  // useEffect: React Hooks - コンポーネントのライフサイクルで副作用を実行
  // - 画面表示時: シェルモードをリセット、メトリクスを記録
  // - 依存配列[setMinimalShellMode]: この値が変わると再実行される
  useFocusEffect(
    useCallback(() => {
      // フルモードに設定（ヘッダー/タブバーを表示）
      setMinimalShellMode(false)
      // ブックマーク画面の表示メトリクスを記録
      logger.metric('bookmarks:view', {})
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen testID="bookmarksScreen">
      {/* ヘッダー領域 */}
      <Layout.Header.Outer>
        {/* 戻るボタン */}
        <Layout.Header.BackButton />
        {/* ヘッダータイトル */}
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Saved Posts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        {/* 右側スロット（将来的な拡張用） */}
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {/* ブックマーク一覧コンテンツ */}
      <BookmarksInner />
    </Layout.Screen>
  )
}

/**
 * @typedef ListItem
 * @description リストアイテムのユニオン型（Goのinterface{}やsum typeに相当）
 *
 * TypeScriptのユニオン型は、複数の型のいずれかを表現する型システム。
 * 各アイテムはtypeフィールドでタグ付けされ、型ガードで判別される。
 *
 * アイテムタイプ:
 * - loading: ローディング中のプレースホルダー
 * - empty: ブックマークが空の状態
 * - bookmark: 通常のブックマーク投稿
 * - bookmarkNotFound: 削除された投稿のブックマーク
 *
 * @note Goのsum type/tagged unionに相当する型安全なパターン
 */
type ListItem =
  | {
      // ローディング状態のアイテム
      type: 'loading'
      key: 'loading'
    }
  | {
      // 空状態のアイテム
      type: 'empty'
      key: 'empty'
    }
  | {
      // 通常のブックマーク投稿
      type: 'bookmark'
      key: string // 投稿URI（一意識別子）
      bookmark: Omit<AppBskyBookmarkDefs.BookmarkView, 'item'> & {
        item: $Typed<AppBskyFeedDefs.PostView> // 投稿データ
      }
    }
  | {
      // 削除された投稿のブックマーク
      type: 'bookmarkNotFound'
      key: string // 投稿URI
      bookmark: Omit<AppBskyBookmarkDefs.BookmarkView, 'item'> & {
        item: $Typed<AppBskyFeedDefs.NotFoundPost> // 削除済み投稿データ
      }
    }

/**
 * @function BookmarksInner
 * @description ブックマーク一覧の内部実装コンポーネント
 *
 * React Query（TanStack Query）を使用してブックマークデータを取得し、
 * 無限スクロール対応のリストとして表示する。
 *
 * 機能:
 * - 無限スクロール（Infinite Query）
 * - プルトゥリフレッシュ（Pull-to-Refresh）
 * - エラーハンドリング
 * - ローディング状態の管理
 *
 * @returns {JSX.Element} ブックマーク一覧のUI
 *
 * @note
 * - useState: ローカル状態管理フック（Goのstructフィールドに相当）
 * - useBookmarksQuery: React Queryのカスタムフック（データフェッチングとキャッシュ管理）
 * - useMemo: 計算結果のメモ化（依存値が変わらない限り再計算しない）
 */
function BookmarksInner() {
  // リストの初期レンダリング数（デバイス性能に応じて最適化）
  const initialNumToRender = useInitialNumToRender()
  // エラーメッセージクリーンアップ関数
  const cleanError = useCleanError()
  // プルトゥリフレッシュ中かどうかの状態
  // useState: Reactのローカル状態管理フック（Goのstructフィールドに相当）
  const [isPTRing, setIsPTRing] = useState(false)

  // ブックマークデータを取得（React Query）
  // useBookmarksQuery: 無限スクロール対応のデータフェッチングフック
  // - data: ページネーションされたデータ
  // - isLoading: 初回読み込み中かどうか
  // - isFetchingNextPage: 次ページ読み込み中かどうか
  // - hasNextPage: 次ページが存在するか
  // - fetchNextPage: 次ページを取得する関数
  // - error: エラー情報
  // - refetch: データを再取得する関数
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useBookmarksQuery()

  // エラーメッセージをクリーンアップ（ユーザーフレンドリーな形式に変換）
  // useMemo: 計算結果のメモ化（errorが変わった時のみ再計算）
  const cleanedError = useMemo(() => {
    const {raw, clean} = cleanError(error)
    return clean || raw
  }, [error, cleanError])

  /**
   * プルトゥリフレッシュのハンドラー
   * ユーザーがリストを下に引っ張って更新する操作
   *
   * @note useCallback: 関数のメモ化（依存配列が変わらない限り同じ参照を保持）
   */
  const onRefresh = useCallback(async () => {
    // PTR状態をtrueに設定（ローディングインジケータ表示）
    setIsPTRing(true)
    try {
      // データを再取得
      await refetch()
    } finally {
      // 完了後、PTR状態をfalseに戻す
      setIsPTRing(false)
    }
  }, [refetch, setIsPTRing])

  /**
   * リスト末尾到達時のハンドラー（無限スクロール）
   * ユーザーがスクロールして末尾に近づいたら次ページを読み込む
   *
   * @note 以下の場合は読み込みをスキップ:
   * - すでに次ページ読み込み中
   * - 次ページが存在しない
   * - エラーが発生している
   */
  const onEndReached = useCallback(async () => {
    // ガード節: 読み込み条件をチェック
    if (isFetchingNextPage || !hasNextPage || error) return
    try {
      // 次ページを取得
      await fetchNextPage()
    } catch {}
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  /**
   * リストアイテムの配列を生成（メモ化）
   *
   * React Queryのページネーションデータを、リスト表示用のアイテム配列に変換する。
   * 以下の状態に応じて異なるアイテムタイプを生成:
   * - ローディング中: loadingアイテム
   * - エラー/データなし: フッターで処理（空配列）
   * - データあり: bookmarkまたはbookmarkNotFoundアイテム
   * - データが空: emptyアイテム
   *
   * @note useMemo: 依存値（isLoading, error, data）が変わった時のみ再計算
   */
  const items = useMemo(() => {
    const i: ListItem[] = []

    if (isLoading) {
      // ローディング中: プレースホルダーを表示
      i.push({type: 'loading', key: 'loading'})
    } else if (error || !data) {
      // エラーまたはデータなし: ListFooterでエラー表示を処理
      // 空配列を返す
    } else {
      // 全ページのブックマークを平坦化（flatMap）
      // pages: [{bookmarks: [...]}, {bookmarks: [...]}] → bookmarks: [...]
      const bookmarks = data.pages.flatMap(p => p.bookmarks)

      if (bookmarks.length > 0) {
        // ブックマークが存在する場合、各アイテムを処理
        for (const bookmark of bookmarks) {
          // 型ガード: 削除された投稿かチェック
          if (AppBskyFeedDefs.isNotFoundPost(bookmark.item)) {
            i.push({
              type: 'bookmarkNotFound',
              key: bookmark.item.uri,
              bookmark: {
                ...bookmark,
                item: bookmark.item as $Typed<AppBskyFeedDefs.NotFoundPost>,
              },
            })
          }
          // 型ガード: 通常の投稿かチェック
          if (AppBskyFeedDefs.isPostView(bookmark.item)) {
            i.push({
              type: 'bookmark',
              key: bookmark.item.uri,
              bookmark: {
                ...bookmark,
                item: bookmark.item as $Typed<AppBskyFeedDefs.PostView>,
              },
            })
          }
        }
      } else {
        // ブックマークが空の場合
        i.push({type: 'empty', key: 'empty'})
      }
    }

    return i
  }, [isLoading, error, data])

  // 空状態かどうかを判定（emptyアイテムが1つだけの場合）
  const isEmpty = items.length === 1 && items[0]?.type === 'empty'

  return (
    <List
      data={items} // 表示するアイテム配列
      renderItem={renderItem} // 各アイテムのレンダリング関数
      keyExtractor={keyExtractor} // アイテムの一意キーを抽出する関数
      refreshing={isPTRing} // プルトゥリフレッシュ中かどうか
      onRefresh={onRefresh} // プルトゥリフレッシュのハンドラー
      onEndReached={onEndReached} // リスト末尾到達時のハンドラー
      onEndReachedThreshold={4} // 末尾到達の閾値（4アイテム手前で発火）
      ListFooterComponent={
        // リストフッター（ローディング/エラー表示）
        <ListFooter
          isFetchingNextPage={isFetchingNextPage} // 次ページ読み込み中か
          error={cleanedError} // エラーメッセージ
          onRetry={fetchNextPage} // リトライハンドラー
          style={[isEmpty && a.border_t_0]} // 空の場合は上ボーダーを非表示
        />
      }
      // パフォーマンス最適化設定
      initialNumToRender={initialNumToRender} // 初期レンダリング数
      windowSize={9} // レンダリングウィンドウサイズ（表示領域の前後9画面分）
      maxToRenderPerBatch={isIOS ? 5 : 1} // バッチあたりの最大レンダリング数（iOS: 5, Android: 1）
      updateCellsBatchingPeriod={40} // セル更新のバッチ期間（40ms）
      sideBorders={false} // サイドボーダーを非表示
    />
  )
}

/**
 * @function BookmarkNotFound
 * @description 削除された投稿のブックマーク表示コンポーネント
 *
 * 投稿が削除された後もブックマークには残るため、
 * その旨を表示し、ユーザーがブックマークから削除できるようにする。
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {boolean} props.hideTopBorder - 上部ボーダーを非表示にするか
 * @param {$Typed<AppBskyFeedDefs.NotFoundPost>} props.post - 削除された投稿データ
 * @returns {JSX.Element} 削除済み投稿のUI
 *
 * @note
 * - useBookmarkMutation: ブックマーク操作のMutation（削除処理）
 * - mutateAsync: 非同期でMutationを実行する関数
 */
function BookmarkNotFound({
  hideTopBorder,
  post,
}: {
  hideTopBorder: boolean
  post: $Typed<AppBskyFeedDefs.NotFoundPost>
}) {
  // テーマ情報を取得
  const t = useTheme()
  // 国際化関数を取得
  const {_} = useLingui()
  // ブックマーク操作のMutation
  const {mutateAsync: bookmark} = useBookmarkMutation()
  // エラーメッセージクリーンアップ関数
  const cleanError = useCleanError()

  /**
   * ブックマークから削除する処理
   *
   * 削除された投稿をブックマーク一覧から削除し、
   * 成功/失敗をトースト通知で表示する。
   */
  const remove = async () => {
    try {
      // ブックマークを削除
      await bookmark({action: 'delete', uri: post.uri})
      // 成功トースト表示
      toast.show(_(msg`Removed from saved posts`), {
        type: 'info',
      })
    } catch (e: any) {
      // エラーメッセージをクリーンアップして表示
      const {raw, clean} = cleanError(e)
      toast.show(clean || raw || e, {
        type: 'error',
      })
    }
  }

  return (
    <View
      style={[
        a.flex_row, // 横並び
        a.align_start, // 上揃え
        a.px_xl, // 左右パディング
        a.py_lg, // 上下パディング
        a.gap_sm, // アイテム間ギャップ
        !hideTopBorder && a.border_t, // 上部ボーダー（条件付き）
        t.atoms.border_contrast_low, // ボーダー色
      ]}>
      {/* アバタープレースホルダー（疑問符アイコン） */}
      <Skele.Circle size={42}>
        <QuestionIcon size="lg" fill={t.atoms.text_contrast_low.color} />
      </Skele.Circle>
      {/* コンテンツエリア */}
      <View style={[a.flex_1, a.gap_2xs]}>
        {/* ユーザー名プレースホルダー（スケルトン） */}
        <View style={[a.flex_row, a.gap_xs]}>
          <Skele.Text style={[a.text_md, {width: 80}]} />
          <Skele.Text style={[a.text_md, {width: 100}]} />
        </View>

        {/* 削除メッセージ */}
        <Text
          style={[
            a.text_md,
            a.leading_snug,
            a.italic, // イタリック体
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>This post was deleted by its author</Trans>
        </Text>
      </View>
      {/* 削除ボタン */}
      <Button
        label={_(msg`Remove from saved posts`)}
        size="tiny"
        color="secondary"
        onPress={remove}>
        <ButtonIcon icon={BookmarkFilled} />
        <ButtonText>
          <Trans>Remove</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}

/**
 * @function renderItem
 * @description リストアイテムのレンダリング関数
 *
 * ListItemの型に応じて、適切なコンポーネントを返す。
 * switch文による型ガード（Discriminated Union）で型安全にレンダリング。
 *
 * @param {Object} params - レンダリングパラメータ
 * @param {ListItem} params.item - レンダリングするアイテム
 * @param {number} params.index - アイテムのインデックス
 * @returns {JSX.Element | null} レンダリングされたコンポーネント
 *
 * @note
 * - TypeScriptのDiscriminated Union: typeフィールドで型を判別
 * - index === 0: 最初のアイテムは上部ボーダーを非表示（二重ボーダー回避）
 */
function renderItem({item, index}: {item: ListItem; index: number}) {
  switch (item.type) {
    case 'loading': {
      // ローディングプレースホルダー（スケルトンスクリーン）
      return <PostFeedLoadingPlaceholder />
    }
    case 'empty': {
      // 空状態（ブックマークなし）
      return <EmptyState />
    }
    case 'bookmark': {
      // 通常のブックマーク投稿
      return (
        <Post
          post={item.bookmark.item}
          hideTopBorder={index === 0} // 最初のアイテムは上部ボーダー非表示
          onBeforePress={() => {
            // 投稿クリック時のメトリクス記録
            logger.metric('bookmarks:post-clicked', {})
          }}
        />
      )
    }
    case 'bookmarkNotFound': {
      // 削除された投稿のブックマーク
      return (
        <BookmarkNotFound
          post={item.bookmark.item}
          hideTopBorder={index === 0}
        />
      )
    }
    default:
      // 到達不可能（型システムで保証）
      return null
  }
}

/**
 * @function keyExtractor
 * @description リストアイテムの一意キーを抽出する関数
 *
 * React Listのパフォーマンス最適化のため、各アイテムに一意のキーを提供。
 * キーが変わらない限り、コンポーネントは再利用される。
 *
 * @param {ListItem} item - リストアイテム
 * @returns {string} アイテムの一意キー
 */
const keyExtractor = (item: ListItem) => item.key
