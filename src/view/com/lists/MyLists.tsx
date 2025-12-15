/**
 * マイリストコンポーネント
 *
 * このファイルは、現在ログイン中のユーザーが所有するリストの一覧を
 * 表示するためのReactコンポーネントを提供します。
 *
 * 主な機能:
 * - ユーザーのリスト一覧表示（フィルタリング対応）
 * - キュレーションリスト/モデレーションリストの分類表示
 * - プルツーリフレッシュ機能
 * - インラインモードとフルページモードの切り替え
 * - カスタムレンダリング関数のサポート
 *
 * Go開発者向け補足:
 * - このコンポーネントはフィルタータイプ（curate/mod/all）によって
 *   表示するリストを切り替えます
 * - RNFlatListとカスタムListコンポーネントの2つの表示モードがあります
 *
 * @module MyLists
 */

import React from 'react' // React本体
import {
  ActivityIndicator, // ローディングスピナー
  FlatList as RNFlatList, // React Native標準のFlatList
  RefreshControl, // プルツーリフレッシュコントロール
  StyleProp, // スタイルプロパティ型
  View, // UIコンテナコンポーネント
  ViewStyle, // Viewスタイル型
} from 'react-native'
import {AppBskyGraphDefs as GraphDefs} from '@atproto/api' // AT ProtocolのGraph定義
import {msg} from '@lingui/macro' // 国際化ライブラリ（翻訳マクロ）
import {useLingui} from '@lingui/react' // Linguiフック

import {usePalette} from '#/lib/hooks/usePalette' // カラーパレット取得フック
import {cleanError} from '#/lib/strings/errors' // エラーメッセージ整形
import {s} from '#/lib/styles' // 共通スタイル
import {logger} from '#/logger' // ロギングシステム
import {useModerationOpts} from '#/state/preferences/moderation-opts' // モデレーション設定
import {MyListsFilter, useMyListsQuery} from '#/state/queries/my-lists' // マイリスト取得クエリ
import {atoms as a, useTheme} from '#/alf' // デザインシステム
import {BulletList_Stroke2_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList' // リストアイコン
import * as ListCard from '#/components/ListCard' // リストカードコンポーネント
import {Text} from '#/components/Typography' // テキストコンポーネント
import {ErrorMessage} from '../util/error/ErrorMessage' // エラー表示
import {List} from '../util/List' // カスタムリストコンポーネント

// 特殊なリストアイテムの識別子（Goの定数に相当）
const LOADING = {_reactKey: '__loading__'} // ローディング表示用
const EMPTY = {_reactKey: '__empty__'} // 空状態表示用
const ERROR_ITEM = {_reactKey: '__error__'} // エラー表示用

/**
 * MyListsコンポーネントのプロパティ型定義
 * （Goのstructに相当）
 */
interface MyListsProps {
  filter: MyListsFilter // リストフィルター（'curate' | 'mod' | 'all'）
  inline?: boolean // インライン表示モード（trueの場合RNFlatListを使用）
  style?: StyleProp<ViewStyle> // コンポーネントのスタイル
  renderItem?: (list: GraphDefs.ListView, index: number) => JSX.Element // カスタムレンダリング関数
  testID?: string // テスト用ID
}

/**
 * マイリスト表示コンポーネント
 *
 * 現在ログイン中のユーザーが所有するリストを表示します。
 * フィルタリングにより、キュレーションリスト、モデレーションリスト、
 * または全リストを選択的に表示できます。
 *
 * @param props - コンポーネントのプロパティ
 * @returns JSX要素（レンダリングされるUI）
 */
export function MyLists({
  filter,
  inline,
  style,
  renderItem,
  testID,
}: MyListsProps) {
  // フックを使用した状態管理とデータ取得
  const pal = usePalette('default') // デフォルトカラーパレット取得
  const t = useTheme() // 現在のテーマ取得
  const {_} = useLingui() // 翻訳関数取得
  const moderationOpts = useModerationOpts() // モデレーション設定取得
  const [isPTRing, setIsPTRing] = React.useState(false) // プルツーリフレッシュ中フラグ

  // マイリストデータの取得
  const {data, isFetching, isFetched, isError, error, refetch} =
    useMyListsQuery(filter)
  const isEmpty = !isFetching && !data?.length // データが空かどうか

  // リスト表示用のアイテム配列を生成
  const items = React.useMemo(() => {
    let items: any[] = []
    if (isError && isEmpty) {
      items = items.concat([ERROR_ITEM]) // エラー表示
    }
    if ((!isFetched && isFetching) || !moderationOpts) {
      items = items.concat([LOADING]) // ローディング表示（モデレーション設定待ち含む）
    } else if (isEmpty) {
      items = items.concat([EMPTY]) // 空状態表示
    } else {
      items = items.concat(data) // 実際のリストデータ
    }
    return items
  }, [isError, isEmpty, isFetched, isFetching, moderationOpts, data])

  // フィルタータイプに応じた空状態メッセージ
  let emptyText
  switch (filter) {
    case 'curate':
      emptyText = _(
        msg`Public, sharable lists which can be used to drive feeds.`,
      )
      break
    case 'mod':
      emptyText = _(
        msg`Public, sharable lists of users to mute or block in bulk.`,
      )
      break
    default:
      emptyText = _(msg`You have no lists.`)
      break
  }

  // ===================================
  // イベントハンドラー定義
  // ===================================

  /**
   * プルツーリフレッシュハンドラー
   */
  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh lists', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  // ===================================
  // レンダリング関数
  // ===================================

  /**
   * リストアイテムのレンダリング関数
   */
  const renderItemInner = React.useCallback(
    ({item, index}: {item: any; index: number}) => {
      // 特殊アイテムの処理
      if (item === EMPTY) {
        return (
          <View style={[a.flex_1, a.align_center, a.gap_sm, a.px_xl, a.pt_xl]}>
            <View
              style={[
                a.align_center,
                a.justify_center,
                a.rounded_full,
                t.atoms.bg_contrast_25,
                {
                  width: 32,
                  height: 32,
                },
              ]}>
              <ListIcon size="md" fill={t.atoms.text_contrast_low.color} />
            </View>
            <Text
              style={[
                a.text_center,
                a.flex_1,
                a.text_sm,
                a.leading_snug,
                t.atoms.text_contrast_medium,
                {
                  maxWidth: 200,
                },
              ]}>
              {emptyText}
            </Text>
          </View>
        )
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            message={cleanError(error)}
            onPressTryAgain={onRefresh}
          />
        )
      } else if (item === LOADING) {
        return (
          <View style={{padding: 20}}>
            <ActivityIndicator />
          </View>
        )
      }
      // カスタムレンダリング関数がある場合はそれを使用、なければデフォルト表示
      return renderItem ? (
        renderItem(item, index)
      ) : (
        <View
          style={[
            index !== 0 && a.border_t, // 最初以外は上部ボーダー
            t.atoms.border_contrast_low,
            a.px_lg,
            a.py_lg,
          ]}>
          <ListCard.Default view={item} />
        </View>
      )
    },
    [t, renderItem, error, onRefresh, emptyText],
  )

  // インラインモードとフルページモードで異なるリストコンポーネントを使用
  // Go開発者向け補足: inlineフラグによって表示方式を切り替えています
  if (inline) {
    // インラインモード: React Native標準のFlatListを使用
    return (
      <View testID={testID} style={style}>
        {items.length > 0 && (
          <RNFlatList
            testID={testID ? `${testID}-flatlist` : undefined}
            data={items}
            keyExtractor={item => (item.uri ? item.uri : item._reactKey)} // 一意キー生成
            renderItem={renderItemInner}
            refreshControl={
              <RefreshControl
                refreshing={isPTRing}
                onRefresh={onRefresh}
                tintColor={pal.colors.text} // プルツーリフレッシュの色
                titleColor={pal.colors.text}
              />
            }
            contentContainerStyle={[s.contentContainer]}
            removeClippedSubviews={true} // パフォーマンス最適化
          />
        )}
      </View>
    )
  } else {
    // フルページモード: カスタムListコンポーネントを使用
    return (
      <View testID={testID} style={style}>
        {items.length > 0 && (
          <List
            testID={testID ? `${testID}-flatlist` : undefined}
            data={items}
            keyExtractor={item => (item.uri ? item.uri : item._reactKey)}
            renderItem={renderItemInner}
            refreshing={isPTRing}
            onRefresh={onRefresh}
            contentContainerStyle={[s.contentContainer]}
            removeClippedSubviews={true}
            desktopFixedHeight // デスクトップ表示時の固定高さ
            sideBorders={false} // サイドボーダーなし
          />
        )}
      </View>
    )
  }
}
