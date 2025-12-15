/**
 * @file SavedFeeds.tsx - 保存済みフィード管理画面
 * @description ユーザーが保存したカスタムフィードの表示・編集・並び替えを行う画面コンポーネント
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: Goの構造体とレシーバー関数に似た、UIを返す関数
 * - フック（use〜）: コンポーネント内で状態やライフサイクルを管理する仕組み（Goのコンテキストに類似）
 * - 状態管理: useState/useQuery = 変数の管理、再レンダリングのトリガー
 * - コンポーネント階層: Goのハンドラーチェーンに似た、親子関係でデータと処理を渡す
 *
 * ## 主な機能
 * - 保存済みフィードのリスト表示（Pinned/Unpinned に分類）
 * - フィードのピン留め/解除（ホーム画面への固定）
 * - フィードの並び替え（上下移動）
 * - フィードの削除
 * - Following フィードの特別扱い（デフォルトタイムライン）
 *
 * ## アーキテクチャ
 * - TanStack Query: サーバー状態管理（Goのキャッシュレイヤーに相当）
 * - 楽観的UI更新: サーバー応答前にローカル状態を即座に更新（UX向上）
 * - アニメーション: Reanimatedによる滑らかな並び替えアニメーション
 *
 * @module view/screens/SavedFeeds
 */

// Reactコアライブラリ（UIコンポーネントの基盤）
import React from 'react'
// React Nativeの基本UI要素（ActivityIndicator=ローディング表示、Pressable=タッチ可能領域、View=コンテナ）
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native'
// アニメーションライブラリ（並び替え時の滑らかな遷移を提供）
import Animated, {LinearTransition} from 'react-native-reanimated'
// AT Protocol API型定義（SavedFeed 構造体など）
import {type AppBskyActorDefs} from '@atproto/api'
// FontAwesome アイコンコンポーネント（矢印、ピン、ゴミ箱などのアイコン表示）
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
// 国際化ライブラリ（msg=翻訳マクロ、Trans=翻訳コンポーネント）
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// React Navigationフック（画面フォーカス時の処理、ナビゲーション操作）
import {useFocusEffect} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/native'
// React Navigation型定義（画面のプロパティ型）
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

// 触覚フィードバック（タップ時の振動）
import {useHaptics} from '#/lib/haptics'
// パレット（テーマカラー取得）
import {usePalette} from '#/lib/hooks/usePalette'
// レスポンシブデザイン（モバイル/デスクトップ判定）
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
// ナビゲーション型定義
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
// スタイル定数（色、共通スタイル）
import {colors, s} from '#/lib/styles'
// ロガー（エラーログ、メトリクス）
import {logger} from '#/logger'
// フィード設定のクエリとミューテーション（TanStack Query）
import {
  useOverwriteSavedFeedsMutation,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
// シェルモード制御（ヘッダー/フッターの表示状態）
import {useSetMinimalShellMode} from '#/state/shell'
// フィードカードコンポーネント（個別フィードの表示）
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
// テキストリンクコンポーネント
import {TextLink} from '#/view/com/util/Link'
// テキストコンポーネント（レガシー）
import {Text} from '#/view/com/util/text/Text'
// トースト通知（保存成功・失敗メッセージ）
import * as Toast from '#/view/com/util/Toast'
// 空状態コンポーネント（Followingフィードがない場合の表示）
import {NoFollowingFeed} from '#/screens/Feeds/NoFollowingFeed'
import {NoSavedFeedsOfAnyType} from '#/screens/Feeds/NoSavedFeedsOfAnyType'
// デザインシステム（アトミックスタイル、テーマ）
import {atoms as a, useTheme} from '#/alf'
// 新しいボタンコンポーネント
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// フィルターアイコン
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'
// 保存アイコン
import {FloppyDisk_Stroke2_Corner0_Rounded as SaveIcon} from '#/components/icons/FloppyDisk'
// レイアウトコンポーネント（画面、ヘッダー、コンテンツ構造）
import * as Layout from '#/components/Layout'
// ローディングスピナー
import {Loader} from '#/components/Loader'
// 新しいテキストコンポーネント（デザインシステム）
import {Text as NewText} from '#/components/Typography'

// 画面プロパティ型定義（React Navigation のルートパラメータ）
type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>

/**
 * SavedFeeds - 保存済みフィード画面のエントリーポイント
 *
 * Goでの例: func SavedFeedsHandler(w http.ResponseWriter, r *http.Request)
 * preferenceデータのロード待機、ロード完了後にInnerコンポーネントをレンダリング
 */
export function SavedFeeds({}: Props) {
  // usePreferencesQuery: TanStack Queryでサーバーからユーザー設定を取得
  // Goでの例: preferences, err := preferencesRepo.Get(ctx, userID)
  const {data: preferences} = usePreferencesQuery()

  // ローディング中は空のViewを返す（Goのearly returnパターン）
  if (!preferences) {
    return <View />
  }
  return <SavedFeedsInner preferences={preferences} />
}

/**
 * SavedFeedsInner - フィード管理のメインロジック
 *
 * 楽観的UI更新を実装: サーバーレスポンス前にUIを即座に更新し、
 * エラー時のみロールバック（UX向上のため）
 */
function SavedFeedsInner({
  preferences,
}: {
  preferences: UsePreferencesQueryResponse
}) {
  const pal = usePalette('default') // テーマカラー取得
  const {_} = useLingui() // 国際化関数（翻訳）
  const {isMobile, isDesktop} = useWebMediaQueries() // レスポンシブ判定
  const setMinimalShellMode = useSetMinimalShellMode() // ヘッダー/フッター表示制御
  // フィード保存のミューテーション（TanStack Query）
  const {mutateAsync: overwriteSavedFeeds, isPending: isOverwritePending} =
    useOverwriteSavedFeedsMutation()
  const navigation = useNavigation<NavigationProp>() // ナビゲーション操作

  /**
   * 楽観的UI更新用のローカル状態
   *
   * Goでの例:
   * type FeedState struct {
   *   currentFeeds []SavedFeed
   *   isDirty bool
   * }
   *
   * サーバーデータとは独立して即座に更新され、
   * "Save" ボタン押下時に実際のサーバー更新を実行
   */
  const [currentFeeds, setCurrentFeeds] = React.useState(
    () => preferences.savedFeeds || [],
  )

  // 未保存の変更があるか判定（保存ボタンの有効/無効制御）
  const hasUnsavedChanges = currentFeeds !== preferences.savedFeeds
  // ピン留めフィード（ホーム画面に固定表示）
  const pinnedFeeds = currentFeeds.filter(f => f.pinned)
  // 未ピン留めフィード（保存済みだが固定されていない）
  const unpinnedFeeds = currentFeeds.filter(f => !f.pinned)
  // 完全に空の状態
  const noSavedFeedsOfAnyType = pinnedFeeds.length + unpinnedFeeds.length === 0
  // Followingフィード（type='timeline'）が存在しない警告状態
  const noFollowingFeed =
    currentFeeds.every(f => f.type !== 'timeline') && !noSavedFeedsOfAnyType

  /**
   * useFocusEffect: 画面がフォーカスされた時の副作用
   *
   * Goでの例: middleware.OnEnter(func() { ... })
   * 画面表示時にフルスクリーンモードを解除（ヘッダー/フッターを表示）
   */
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  /**
   * onSaveChanges - 変更をサーバーに保存
   *
   * Goでの例:
   * func (s *FeedService) UpdateSavedFeeds(ctx context.Context, feeds []SavedFeed) error {
   *   if err := s.repo.Overwrite(ctx, feeds); err != nil {
   *     return fmt.Errorf("failed to save feeds: %w", err)
   *   }
   *   return nil
   * }
   */
  const onSaveChanges = React.useCallback(async () => {
    try {
      // サーバーにフィードリスト全体を上書き保存
      await overwriteSavedFeeds(currentFeeds)
      Toast.show(_(msg({message: 'Feeds updated!', context: 'toast'})))

      // 保存成功後、前の画面に戻るか、Feedsタブに遷移
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('Feeds')
      }
    } catch (e) {
      // エラー時はトースト通知とログ記録
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }, [_, overwriteSavedFeeds, currentFeeds, navigation])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Feeds</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Button
          testID="saveChangesBtn"
          size="small"
          variant={hasUnsavedChanges ? 'solid' : 'solid'}
          color={hasUnsavedChanges ? 'primary' : 'secondary'}
          onPress={onSaveChanges}
          label={_(msg`Save changes`)}
          disabled={isOverwritePending || !hasUnsavedChanges}>
          <ButtonIcon icon={isOverwritePending ? Loader : SaveIcon} />
          <ButtonText>
            {isDesktop ? <Trans>Save changes</Trans> : <Trans>Save</Trans>}
          </ButtonText>
        </Button>
      </Layout.Header.Outer>

      <Layout.Content>
        {noSavedFeedsOfAnyType && (
          <View style={[pal.border, a.border_b]}>
            <NoSavedFeedsOfAnyType />
          </View>
        )}

        <View style={[pal.text, pal.border, styles.title]}>
          <Text type="title" style={pal.text}>
            <Trans>Pinned Feeds</Trans>
          </Text>
        </View>

        {preferences ? (
          !pinnedFeeds.length ? (
            <View
              style={[
                pal.border,
                isMobile && s.flex1,
                pal.viewLight,
                styles.empty,
              ]}>
              <Text type="lg" style={[pal.text]}>
                <Trans>You don't have any pinned feeds.</Trans>
              </Text>
            </View>
          ) : (
            pinnedFeeds.map(f => (
              <ListItem
                key={f.id}
                feed={f}
                isPinned
                currentFeeds={currentFeeds}
                setCurrentFeeds={setCurrentFeeds}
                preferences={preferences}
              />
            ))
          )
        ) : (
          <ActivityIndicator style={{marginTop: 20}} />
        )}

        {noFollowingFeed && (
          <View style={[pal.border, a.border_b]}>
            <NoFollowingFeed />
          </View>
        )}

        <View style={[pal.text, pal.border, styles.title]}>
          <Text type="title" style={pal.text}>
            <Trans>Saved Feeds</Trans>
          </Text>
        </View>
        {preferences ? (
          !unpinnedFeeds.length ? (
            <View
              style={[
                pal.border,
                isMobile && s.flex1,
                pal.viewLight,
                styles.empty,
              ]}>
              <Text type="lg" style={[pal.text]}>
                <Trans>You don't have any saved feeds.</Trans>
              </Text>
            </View>
          ) : (
            unpinnedFeeds.map(f => (
              <ListItem
                key={f.id}
                feed={f}
                isPinned={false}
                currentFeeds={currentFeeds}
                setCurrentFeeds={setCurrentFeeds}
                preferences={preferences}
              />
            ))
          )
        ) : (
          <ActivityIndicator style={{marginTop: 20}} />
        )}

        <View style={styles.footerText}>
          <Text type="sm" style={pal.textLight}>
            <Trans>
              Feeds are custom algorithms that users build with a little coding
              expertise.{' '}
              <TextLink
                type="sm"
                style={pal.link}
                href="https://github.com/bluesky-social/feed-generator"
                text={_(msg`See this guide`)}
              />{' '}
              for more information.
            </Trans>
          </Text>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

/**
 * ListItem - 個別フィードアイテムコンポーネント
 *
 * Goでの例:
 * type FeedListItem struct {
 *   Feed SavedFeed
 *   OnMove func(direction int)
 *   OnTogglePin func()
 *   OnRemove func()
 * }
 *
 * フィードの表示と操作（ピン留め、並び替え、削除）を提供
 */
function ListItem({
  feed,
  isPinned,
  currentFeeds,
  setCurrentFeeds,
}: {
  feed: AppBskyActorDefs.SavedFeed
  isPinned: boolean
  currentFeeds: AppBskyActorDefs.SavedFeed[]
  setCurrentFeeds: React.Dispatch<AppBskyActorDefs.SavedFeed[]>
  preferences: UsePreferencesQueryResponse
}) {
  const {_} = useLingui() // 国際化
  const pal = usePalette('default') // テーマカラー
  const playHaptic = useHaptics() // 触覚フィードバック
  const feedUri = feed.value // フィードURI（AT Protocol URI）

  /**
   * onTogglePinned - ピン留め状態をトグル
   *
   * Goでの例:
   * func (f *Feed) TogglePinned() {
   *   f.Pinned = !f.Pinned
   * }
   *
   * Immutable更新パターン（元の配列を変更せず新しい配列を作成）
   */
  const onTogglePinned = React.useCallback(async () => {
    playHaptic() // タップ時の振動フィードバック
    setCurrentFeeds(
      // 配列全体をマップして該当フィードのみpinnedを反転
      currentFeeds.map(f =>
        f.id === feed.id ? {...feed, pinned: !feed.pinned} : f,
      ),
    )
  }, [playHaptic, feed, currentFeeds, setCurrentFeeds])

  /**
   * onPressUp - フィードを上に移動
   *
   * Goでの例:
   * func (feeds *FeedList) MoveUp(index int) error {
   *   if index <= 0 || index >= len(feeds.items) {
   *     return ErrInvalidIndex
   *   }
   *   feeds.items[index], feeds.items[index-1] = feeds.items[index-1], feeds.items[index]
   *   return nil
   * }
   */
  const onPressUp = React.useCallback(async () => {
    if (!isPinned) return // ピン留めフィードのみ並び替え可能

    const nextFeeds = currentFeeds.slice() // 配列をコピー（Immutable）
    const ids = currentFeeds.map(f => f.id)
    const index = ids.indexOf(feed.id)
    const nextIndex = index - 1

    // 境界チェック: 先頭またはインデックス不正の場合は何もしない
    if (index === -1 || index === 0) return

    // 要素を入れ替え（分割代入によるスワップ）
    ;[nextFeeds[index], nextFeeds[nextIndex]] = [
      nextFeeds[nextIndex],
      nextFeeds[index],
    ]

    setCurrentFeeds(nextFeeds)
  }, [feed, isPinned, setCurrentFeeds, currentFeeds])

  /**
   * onPressDown - フィードを下に移動
   *
   * 上移動と同様のロジックだが、末尾チェックが異なる
   * ピン留めフィード内のみで移動可能（ピン留め境界を越えない）
   */
  const onPressDown = React.useCallback(async () => {
    if (!isPinned) return

    const nextFeeds = currentFeeds.slice()
    const ids = currentFeeds.map(f => f.id)
    const index = ids.indexOf(feed.id)
    const nextIndex = index + 1

    // 境界チェック: 末尾またはピン留めフィードの最後
    if (index === -1 || index >= nextFeeds.filter(f => f.pinned).length - 1)
      return

    ;[nextFeeds[index], nextFeeds[nextIndex]] = [
      nextFeeds[nextIndex],
      nextFeeds[index],
    ]

    setCurrentFeeds(nextFeeds)
  }, [feed, isPinned, setCurrentFeeds, currentFeeds])

  /**
   * onPressRemove - フィードを削除
   *
   * Goでの例:
   * func (feeds *FeedList) Remove(id string) {
   *   feeds.items = slices.DeleteFunc(feeds.items, func(f Feed) bool {
   *     return f.ID == id
   *   })
   * }
   */
  const onPressRemove = React.useCallback(async () => {
    playHaptic()
    // filter で該当フィード以外の新しい配列を作成
    setCurrentFeeds(currentFeeds.filter(f => f.id !== feed.id))
  }, [playHaptic, feed, currentFeeds, setCurrentFeeds])

  return (
    <Animated.View
      style={[styles.itemContainer, pal.border]}
      layout={LinearTransition.duration(100)}>
      {feed.type === 'timeline' ? (
        <FollowingFeedCard />
      ) : (
        <FeedSourceCard
          key={feedUri}
          feedUri={feedUri}
          style={[isPinned && a.pr_sm]}
          showMinimalPlaceholder
          hideTopBorder={true}
        />
      )}
      {isPinned ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={onPressUp}
            hitSlop={5}
            style={state => ({
              backgroundColor: pal.viewLight.backgroundColor,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 4,
              marginRight: 8,
              opacity: state.hovered || state.pressed ? 0.5 : 1,
            })}
            testID={`feed-${feed.type}-moveUp`}>
            <FontAwesomeIcon
              icon="arrow-up"
              size={14}
              style={[pal.textLight]}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onPressDown}
            hitSlop={5}
            style={state => ({
              backgroundColor: pal.viewLight.backgroundColor,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 4,
              marginRight: 8,
              opacity: state.hovered || state.pressed ? 0.5 : 1,
            })}
            testID={`feed-${feed.type}-moveDown`}>
            <FontAwesomeIcon
              icon="arrow-down"
              size={14}
              style={[pal.textLight]}
            />
          </Pressable>
        </>
      ) : (
        <Pressable
          testID={`feed-${feedUri}-toggleSave`}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Remove from my feeds`)}
          accessibilityHint=""
          onPress={onPressRemove}
          hitSlop={5}
          style={state => ({
            marginRight: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 4,
            opacity: state.hovered || state.focused ? 0.5 : 1,
          })}>
          <FontAwesomeIcon
            icon={['far', 'trash-can']}
            size={19}
            color={pal.colors.icon}
          />
        </Pressable>
      )}
      <View style={{paddingRight: 16}}>
        <Pressable
          accessibilityRole="button"
          hitSlop={5}
          onPress={onTogglePinned}
          style={state => ({
            backgroundColor: pal.viewLight.backgroundColor,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 4,
            opacity: state.hovered || state.focused ? 0.5 : 1,
          })}
          testID={`feed-${feed.type}-togglePin`}>
          <FontAwesomeIcon
            icon="thumb-tack"
            size={14}
            color={isPinned ? colors.blue3 : pal.colors.icon}
          />
        </Pressable>
      </View>
    </Animated.View>
  )
}

/**
 * FollowingFeedCard - Followingフィード（デフォルトタイムライン）のカード
 *
 * カスタムフィードとは異なり、システム標準の「フォロー中のユーザーの投稿」フィード
 * type='timeline' で識別され、特別なアイコンとスタイルで表示
 */
function FollowingFeedCard() {
  const t = useTheme() // デザインシステムのテーマ取得
  return (
    <View style={[a.flex_row, a.align_center, a.flex_1, a.p_lg]}>
      {/* アイコン領域 - プライマリカラーの背景に白いフィルターアイコン */}
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_sm,
          a.mr_md,
          {
            width: 36,
            height: 36,
            backgroundColor: t.palette.primary_500,
          },
        ]}>
        <FilterTimeline
          style={[
            {
              width: 22,
              height: 22,
            },
          ]}
          fill={t.palette.white}
        />
      </View>
      {/* テキスト領域 */}
      <View style={[a.flex_1, a.flex_row, a.gap_sm, a.align_center]}>
        <NewText style={[a.text_sm, a.font_bold, a.leading_snug]}>
          <Trans context="feed-name">Following</Trans>
        </NewText>
      </View>
    </View>
  )
}

/**
 * StyleSheet - コンポーネントのスタイル定義
 *
 * Goでの例:
 * type Styles struct {
 *   Empty containerStyle
 *   Title containerStyle
 * }
 *
 * React Nativeでは、StyleSheet.create でスタイルオブジェクトを最適化
 */
const styles = StyleSheet.create({
  // 空状態の表示スタイル
  empty: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
  },
  // セクションタイトル（"Pinned Feeds", "Saved Feeds"）のスタイル
  title: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, // 1px未満の極細線
  },
  // フィードアイテムコンテナのスタイル
  itemContainer: {
    flexDirection: 'row', // 横並び（フィード | ボタン群）
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // フッターテキストのスタイル（「カスタムフィードの説明」リンク）
  footerText: {
    paddingHorizontal: 26,
    paddingVertical: 22,
  },
})
