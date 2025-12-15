/**
 * チャットリスト画面モジュール
 *
 * 【概要】
 * - Blueskyのダイレクトメッセージ（DM）のチャット一覧画面
 * - 承認済み会話とチャット要求（未承認）の両方を管理
 * - リアルタイム更新、無限スクロール、プルツーリフレッシュをサポート
 *
 * 【主な機能】
 * - チャット一覧表示（承認済み会話）
 * - 受信箱プレビュー（未読のチャット要求）
 * - 新規チャット作成ダイアログ
 * - 退出済み会話のフィルタリング
 * - リアルタイムポーリング（10秒間隔）
 *
 * 【状態管理】
 * - TanStack Query: サーバーデータとキャッシング
 * - ConvoProvider: 会話状態の管理
 * - EventBus: リアルタイム更新イベント
 *
 * 【Go開発者向け補足】
 * - useState: Goのローカル変数に相当、再レンダリングをトリガー
 * - useEffect: Goのinit関数やdefer文に類似、コンポーネントライフサイクル管理
 * - useCallback: メモ化された関数、パフォーマンス最適化用
 * - useMemo: メモ化された値、計算コストの高い処理の最適化
 */

// React関連のインポート - フック（Goの関数に相当するが状態を持つ）
import {useCallback, useEffect, useMemo, useState} from 'react'
// ネイティブコンポーネント - プラットフォーム固有のUI要素
import {View} from 'react-native'
// アニメーション参照 - Reanimatedライブラリのref管理
import {useAnimatedRef} from 'react-native-reanimated'
// AT Protocol型定義 - チャット関連のスキーマ定義（Goのstructに相当）
import {type ChatBskyActorDefs, type ChatBskyConvoDefs} from '@atproto/api'
// 国際化 - メッセージとトランスコンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// ナビゲーションフック - 画面フォーカスとナビゲーション状態
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
// ナビゲーション型定義 - 画面プロパティの型安全性
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

// アプリ状態フック - アクティブ/バックグラウンド状態の取得
import {useAppState} from '#/lib/hooks/useAppState'
// 初期レンダリング数フック - パフォーマンス最適化
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
// メール認証フック - メール認証が必要な操作のガード
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
// ルート型定義 - メッセージタブのナビゲーションパラメータ
import {type MessagesTabNavigatorParams} from '#/lib/routes/types'
// エラー処理 - エラーメッセージのクリーンアップ
import {cleanError} from '#/lib/strings/errors'
// ロガー - アプリケーションログ出力
import {logger} from '#/logger'
// プラットフォーム検出 - iOS/Android判定
import {isNative} from '#/platform/detection'
// イベントリスナー - ソフトリセットイベント（タブ再タップ時の処理）
import {listenSoftReset} from '#/state/events'
// ポーリング定数 - メッセージ画面の更新間隔（デフォルト10秒）
import {MESSAGE_SCREEN_POLL_INTERVAL} from '#/state/messages/convo/const'
// イベントバス - メッセージ関連のイベント処理
import {useMessagesEventBus} from '#/state/messages/events'
// 退出会話フック - 退出した会話の追跡
import {useLeftConvos} from '#/state/queries/messages/leave-conversation'
// 会話リストクエリ - 会話一覧データの取得
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
// セッションフック - 現在のアカウント情報
import {useSession} from '#/state/session'
// リストコンポーネント - 仮想化されたスクロールリスト
import {List, type ListRef} from '#/view/com/util/List'
// ローディング表示 - チャットリスト用プレースホルダー
import {ChatListLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
// スタイリング - CSSアトム、ブレークポイント、テーマ
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
// 年齢制限画面 - 成人向けコンテンツの年齢確認ラッパー
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
// 年齢確認コピー - 年齢制限関連のテキスト取得
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
// ボタンコンポーネント - 基本ボタン、アイコン、テキスト
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// ダイアログ制御 - ダイアログの開閉管理（Goのチャネルに類似）
import {type DialogControlProps, useDialogControl} from '#/components/Dialog'
// 新規チャットダイアログ - 新しい会話を開始するUI
import {NewChat} from '#/components/dms/dialogs/NewChatDialog'
// フォーカス時リフレッシュ - 画面フォーカス時の自動更新
import {useRefreshOnFocus} from '#/components/hooks/useRefreshOnFocus'
// アイコン - 再試行アイコン
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotateCounterClockwise'
// アイコン - 情報アイコン
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
// アイコン - メッセージアイコン
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
// アイコン - プラスアイコン
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
// アイコン - 設定アイコン
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
// レイアウトコンポーネント - 画面構造とヘッダー
import * as Layout from '#/components/Layout'
// リンクコンポーネント - ナビゲーション可能なリンク
import {Link} from '#/components/Link'
// リストフッター - 無限スクロール用フッターコンポーネント
import {ListFooter} from '#/components/Lists'
// テキストコンポーネント - タイポグラフィ
import {Text} from '#/components/Typography'
// チャットリストアイテム - 個別のチャット表示コンポーネント
import {ChatListItem} from './components/ChatListItem'
// 受信箱プレビュー - 未読チャット要求のプレビュー
import {InboxPreview} from './components/InboxPreview'

/**
 * リストアイテム型定義（Goのtype aliasやstructに相当）
 *
 * 【説明】
 * - TypeScriptのUnion型: 2つの異なる型のいずれかを表現
 * - Goの interface{} + type switch に類似
 *
 * 【アイテム種別】
 * - INBOX: チャット要求の受信箱プレビュー
 * - CONVERSATION: 個別のチャット会話
 */
type ListItem =
  | {
      type: 'INBOX' // 受信箱タイプ
      count: number // 未読チャット要求数
      profiles: ChatBskyActorDefs.ProfileViewBasic[] // プロフィールプレビュー（最大3件）
    }
  | {
      type: 'CONVERSATION' // 会話タイプ
      conversation: ChatBskyConvoDefs.ConvoView // 会話データ
    }

/**
 * リストアイテムレンダリング関数
 *
 * 【説明】
 * - FlatList/Listコンポーネントの renderItem プロパティで使用
 * - アイテムの型に応じて適切なコンポーネントを返す
 * - Goのtype switchに類似した処理
 *
 * @param item - 表示するリストアイテム
 * @returns JSX要素 - レンダリングされたコンポーネント
 */
function renderItem({item}: {item: ListItem}) {
  switch (item.type) {
    case 'INBOX':
      // 受信箱プレビューコンポーネント
      return <InboxPreview profiles={item.profiles} />
    case 'CONVERSATION':
      // チャットリストアイテムコンポーネント
      return <ChatListItem convo={item.conversation} />
  }
}

/**
 * キー抽出関数
 *
 * 【説明】
 * - React Listの各アイテムに一意のキーを割り当て
 * - 仮想DOMの差分計算を最適化（GoのmapのキーIDに類似）
 *
 * @param item - リストアイテム
 * @returns 一意のキー文字列
 */
function keyExtractor(item: ListItem) {
  return item.type === 'INBOX' ? 'INBOX' : item.conversation.id
}

/**
 * プロパティ型定義（Goのstructに相当）
 * ナビゲーションスタックから渡されるプロパティ
 */
type Props = NativeStackScreenProps<MessagesTabNavigatorParams, 'Messages'>

/**
 * メッセージ画面コンポーネント（外側）
 *
 * 【機能】
 * - 年齢制限チェックを適用したチャット一覧画面
 * - 成人向けコンテンツとしてチャット機能へのアクセスを制御
 * - ヘッダーにチャット設定リンクを配置
 *
 * 【Go開発者向け補足】
 * - 関数コンポーネント: Goの関数だがJSXを返す
 * - Props: 引数として型安全にデータを受け取る
 *
 * @param props - ナビゲーションプロパティ
 * @returns JSX要素 - 年齢制限ラップ済みのメッセージ画面
 */
export function MessagesScreen(props: Props) {
  // 国際化フック - UI文字列の翻訳取得
  const {_} = useLingui()
  // 年齢確認コピー - 年齢制限関連テキスト
  const aaCopy = useAgeAssuranceCopy()

  return (
    <AgeRestrictedScreen
      screenTitle={_(msg`Chats`)}
      infoText={aaCopy.chatsInfoText}
      rightHeaderSlot={
        <Link
          to="/messages/settings"
          label={_(msg`Chat settings`)}
          size="small"
          color="secondary">
          <ButtonText>
            <Trans>Chat settings</Trans>
          </ButtonText>
        </Link>
      }>
      <MessagesScreenInner {...props} />
    </AgeRestrictedScreen>
  )
}

export function MessagesScreenInner({navigation, route}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const newChatControl = useDialogControl()
  const scrollElRef: ListRef = useAnimatedRef()
  const pushToConversation = route.params?.pushToConversation

  // Whenever we have `pushToConversation` set, it means we pressed a notification for a chat without being on
  // this tab. We should immediately push to the conversation after pressing the notification.
  // After we push, reset with `setParams` so that this effect will fire next time we press a notification, even if
  // the conversation is the same as before
  useEffect(() => {
    if (pushToConversation) {
      navigation.navigate('MessagesConversation', {
        conversation: pushToConversation,
      })
      navigation.setParams({pushToConversation: undefined})
    }
  }, [navigation, pushToConversation])

  // Request the poll interval to be 10s (or whatever the MESSAGE_SCREEN_POLL_INTERVAL is set to in the future)
  // but only when the screen is active
  const messagesBus = useMessagesEventBus()
  const state = useAppState()
  const isActive = state === 'active'
  useFocusEffect(
    useCallback(() => {
      if (isActive) {
        const unsub = messagesBus.requestPollInterval(
          MESSAGE_SCREEN_POLL_INTERVAL,
        )
        return () => unsub()
      }
    }, [messagesBus, isActive]),
  )

  const initialNumToRender = useInitialNumToRender({minItemHeight: 80})
  const [isPTRing, setIsPTRing] = useState(false)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useListConvosQuery({status: 'accepted'})

  const {data: inboxData, refetch: refetchInbox} = useListConvosQuery({
    status: 'request',
  })

  useRefreshOnFocus(refetch)
  useRefreshOnFocus(refetchInbox)

  const leftConvos = useLeftConvos()

  const inboxAllConvos =
    inboxData?.pages
      .flatMap(page => page.convos)
      .filter(
        convo =>
          !leftConvos.includes(convo.id) &&
          !convo.muted &&
          convo.members.every(member => member.handle !== 'missing.invalid'),
      ) ?? []
  const hasInboxConvos = inboxAllConvos?.length > 0

  const inboxUnreadConvos = inboxAllConvos.filter(
    convo => convo.unreadCount > 0,
  )

  const inboxUnreadConvoMembers = inboxUnreadConvos
    .map(x => x.members.find(y => y.did !== currentAccount?.did))
    .filter(x => !!x)

  const conversations = useMemo(() => {
    if (data?.pages) {
      const conversations = data.pages
        .flatMap(page => page.convos)
        // filter out convos that are actively being left
        .filter(convo => !leftConvos.includes(convo.id))

      return [
        ...(hasInboxConvos
          ? [
              {
                type: 'INBOX' as const,
                count: inboxUnreadConvoMembers.length,
                profiles: inboxUnreadConvoMembers.slice(0, 3),
              },
            ]
          : []),
        ...conversations.map(
          convo => ({type: 'CONVERSATION', conversation: convo}) as const,
        ),
      ] satisfies ListItem[]
    }
    return []
  }, [data, leftConvos, hasInboxConvos, inboxUnreadConvoMembers])

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await Promise.all([refetch(), refetchInbox()])
    } catch (err) {
      logger.error('Failed to refresh conversations', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, refetchInbox, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more conversations', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const onNewChat = useCallback(
    (conversation: string) =>
      navigation.navigate('MessagesConversation', {conversation}),
    [navigation],
  )

  const onSoftReset = useCallback(async () => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: 0,
    })
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh conversations', {message: err})
    }
  }, [scrollElRef, refetch])

  const isScreenFocused = useIsFocused()
  useEffect(() => {
    if (!isScreenFocused) {
      return
    }
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, isScreenFocused])

  // NOTE(APiligrim)
  // Show empty state only if there are no conversations at all
  const activeConversations = conversations.filter(
    item => item.type === 'CONVERSATION',
  )

  if (activeConversations.length === 0) {
    return (
      <Layout.Screen>
        <Header newChatControl={newChatControl} />
        <Layout.Center>
          {!isLoading && hasInboxConvos && (
            <InboxPreview profiles={inboxUnreadConvoMembers} />
          )}
          {isLoading ? (
            <ChatListLoadingPlaceholder />
          ) : (
            <>
              {isError ? (
                <>
                  <View style={[a.pt_3xl, a.align_center]}>
                    <CircleInfoIcon
                      width={48}
                      fill={t.atoms.text_contrast_low.color}
                    />
                    <Text style={[a.pt_md, a.pb_sm, a.text_2xl, a.font_bold]}>
                      <Trans>Whoops!</Trans>
                    </Text>
                    <Text
                      style={[
                        a.text_md,
                        a.pb_xl,
                        a.text_center,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                        {maxWidth: 360},
                      ]}>
                      {cleanError(error) ||
                        _(msg`Failed to load conversations`)}
                    </Text>

                    <Button
                      label={_(msg`Reload conversations`)}
                      size="small"
                      color="secondary_inverted"
                      variant="solid"
                      onPress={() => refetch()}>
                      <ButtonText>
                        <Trans>Retry</Trans>
                      </ButtonText>
                      <ButtonIcon icon={RetryIcon} position="right" />
                    </Button>
                  </View>
                </>
              ) : (
                <>
                  <View style={[a.pt_3xl, a.align_center]}>
                    <MessageIcon width={48} fill={t.palette.primary_500} />
                    <Text style={[a.pt_md, a.pb_sm, a.text_2xl, a.font_bold]}>
                      <Trans>Nothing here</Trans>
                    </Text>
                    <Text
                      style={[
                        a.text_md,
                        a.pb_xl,
                        a.text_center,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans>You have no conversations yet. Start one!</Trans>
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </Layout.Center>

        {!isLoading && !isError && (
          <NewChat onNewChat={onNewChat} control={newChatControl} />
        )}
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen testID="messagesScreen">
      <Header newChatControl={newChatControl} />
      <NewChat onNewChat={onNewChat} control={newChatControl} />
      <List
        ref={scrollElRef}
        data={conversations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            error={cleanError(error)}
            onRetry={fetchNextPage}
            style={{borderColor: 'transparent'}}
            hasNextPage={hasNextPage}
          />
        }
        onEndReachedThreshold={isNative ? 1.5 : 0}
        initialNumToRender={initialNumToRender}
        windowSize={11}
        desktopFixedHeight
        sideBorders={false}
      />
    </Layout.Screen>
  )
}

function Header({newChatControl}: {newChatControl: DialogControlProps}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const requireEmailVerification = useRequireEmailVerification()

  const openChatControl = useCallback(() => {
    newChatControl.open()
  }, [newChatControl])
  const wrappedOpenChatControl = requireEmailVerification(openChatControl, {
    instructions: [
      <Trans key="new-chat">
        Before you can message another user, you must first verify your email.
      </Trans>,
    ],
  })

  const settingsLink = (
    <Link
      to="/messages/settings"
      label={_(msg`Chat settings`)}
      size="small"
      variant="ghost"
      color="secondary"
      shape="round"
      style={[a.justify_center]}>
      <ButtonIcon icon={SettingsIcon} size="lg" />
    </Link>
  )

  return (
    <Layout.Header.Outer>
      {gtMobile ? (
        <>
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Chats</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>

          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            {settingsLink}
            <Button
              label={_(msg`New chat`)}
              color="primary"
              size="small"
              variant="solid"
              onPress={wrappedOpenChatControl}>
              <ButtonIcon icon={PlusIcon} position="left" />
              <ButtonText>
                <Trans>New chat</Trans>
              </ButtonText>
            </Button>
          </View>
        </>
      ) : (
        <>
          <Layout.Header.MenuButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Chats</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot>{settingsLink}</Layout.Header.Slot>
        </>
      )}
    </Layout.Header.Outer>
  )
}
