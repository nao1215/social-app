// React関連のインポート - フック関数とネイティブコンポーネント
import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
// AT Protocolの型定義 - チャット会話関連の型
import {
  type ChatBskyConvoDefs,
  type ChatBskyConvoListConvos,
} from '@atproto/api'
// 国際化関連 - メッセージと翻訳コンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// ナビゲーション関連 - フォーカス効果とナビゲーション
import {useFocusEffect, useNavigation} from '@react-navigation/native'
// TanStack Query関連 - 無限クエリの型定義
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'

// アプリ状態管理 - アプリのアクティブ状態取得
import {useAppState} from '#/lib/hooks/useAppState'
// パフォーマンス最適化 - 初期レンダリングアイテム数
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
// ルーティング型定義 - 画面プロパティとナビゲーション
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
// エラー処理 - エラーメッセージのクリーンアップ
import {cleanError} from '#/lib/strings/errors'
// ロギング - アプリケーションログ出力
import {logger} from '#/logger'
// プラットフォーム検出 - ネイティブ環境の判定
import {isNative} from '#/platform/detection'
// メッセージ定数 - ポーリング間隔設定
import {MESSAGE_SCREEN_POLL_INTERVAL} from '#/state/messages/convo/const'
// イベントバス - メッセージ関連のイベント処理
import {useMessagesEventBus} from '#/state/messages/events'
// 会話管理 - 退出した会話の追跡
import {useLeftConvos} from '#/state/queries/messages/leave-conversation'
// 会話リスト - 会話一覧取得クエリ
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
// 既読管理 - 全て既読にするミューテーション
import {useUpdateAllRead} from '#/state/queries/messages/update-all-read'
// FAB - フローティングアクションボタン
import {FAB} from '#/view/com/util/fab/FAB'
// リストコンポーネント - 仮想化リスト
import {List} from '#/view/com/util/List'
// ローディング表示 - チャットリスト用プレースホルダー
import {ChatListLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
// トースト通知 - 成功/エラーメッセージ表示
import * as Toast from '#/view/com/util/Toast'
// スタイリング - CSSアトム、ブレークポイント、テーマ
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
// 年齢制限画面 - 成人向けコンテンツの年齢確認
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
// 年齢確認コピー - 年齢制限関連のテキスト
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
// ボタンコンポーネント - 基本ボタン、アイコン、テキスト
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// フォーカス時リフレッシュ - 画面フォーカス時の自動更新
import {useRefreshOnFocus} from '#/components/hooks/useRefreshOnFocus'
// アイコン - 矢印アイコン
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
// アイコン - 再試行アイコン
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotateCounterClockwise'
// アイコン - チェックマークアイコン
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
// アイコン - 情報アイコン
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
// アイコン - メッセージアイコン
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
// レイアウトコンポーネント - 画面レイアウト構造
import * as Layout from '#/components/Layout'
// リスト関連 - フッターコンポーネント
import {ListFooter} from '#/components/Lists'
// タイポグラフィ - テキストコンポーネント
import {Text} from '#/components/Typography'
// チャット要求リスト - 個別要求アイテムコンポーネント
import {RequestListItem} from './components/RequestListItem'

// プロパティ型定義 - メッセージ受信箱画面のプロパティ
type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesInbox'>

/**
 * メッセージ受信箱画面（外側コンポーネント）
 * 年齢制限チェック付きのチャット要求一覧画面
 * 成人向けコンテンツへのアクセス制限を適用
 */
export function MessagesInboxScreen(props: Props) {
  // 国際化フック - UI文字列の翻訳
  const {_} = useLingui()
  // 年齢確認コピー - 年齢制限関連テキスト取得
  const aaCopy = useAgeAssuranceCopy()
  return (
    <AgeRestrictedScreen
      screenTitle={_(msg`Chat requests`)}
      infoText={aaCopy.chatsInfoText}>
      <MessagesInboxScreenInner {...props} />
    </AgeRestrictedScreen>
  )
}

/**
 * メッセージ受信箱画面（内側コンポーネント）
 * チャット要求の一覧表示と管理機能を提供
 * 未読カウント、既読機能、リアルタイム更新をサポート
 */
export function MessagesInboxScreenInner({}: Props) {
  // ブレークポイント - タブレット以上の画面サイズ判定
  const {gtTablet} = useBreakpoints()

  // 会話リストクエリ - チャット要求ステータスの会話を取得
  const listConvosQuery = useListConvosQuery({status: 'request'})
  const {data} = listConvosQuery

  // 退出会話 - 現在退出処理中の会話ID一覧
  const leftConvos = useLeftConvos()

  // 会話リスト - ページネーションデータを平坦化し、退出中の会話を除外
  const conversations = useMemo(() => {
    if (data?.pages) {
      const convos = data.pages
        .flatMap(page => page.convos)
        // 退出処理中の会話を除外
        .filter(convo => !leftConvos.includes(convo.id))

      return convos
    }
    return []
  }, [data, leftConvos])

  // 未読会話の存在チェック - 有効なメンバーがいる未読会話があるかどうか
  const hasUnreadConvos = useMemo(() => {
    return conversations.some(
      conversation =>
        conversation.members.every(
          member => member.handle !== 'missing.invalid',
        ) && conversation.unreadCount > 0,
    )
  }, [conversations])

  // 画面レンダリング - ヘッダーと要求リストを含む画面構造
  return (
    <Layout.Screen testID="messagesInboxScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align={gtTablet ? 'left' : 'platform'}>
          <Layout.Header.TitleText>
            <Trans>Chat requests</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        {/* 条件付きヘッダーボタン - タブレット画面で未読がある場合のみ表示 */}
        {hasUnreadConvos && gtTablet ? (
          <MarkAsReadHeaderButton />
        ) : (
          <Layout.Header.Slot />
        )}
      </Layout.Header.Outer>
      {/* チャット要求リスト - メインコンテンツエリア */}
      <RequestList
        listConvosQuery={listConvosQuery}
        conversations={conversations}
        hasUnreadConvos={hasUnreadConvos}
      />
    </Layout.Screen>
  )
}

/**
 * チャット要求リストコンポーネント
 * 無限スクロール、プルツーリフレッシュ、リアルタイム更新機能を提供
 * 空状態とエラー状態の適切な処理も含む
 */
function RequestList({
  listConvosQuery,
  conversations,
  hasUnreadConvos,
}: {
  listConvosQuery: UseInfiniteQueryResult<
    InfiniteData<ChatBskyConvoListConvos.OutputSchema>,
    Error
  > // 無限クエリ結果 - 会話リストのページネーション
  conversations: ChatBskyConvoDefs.ConvoView[] // 会話配列 - 表示対象の会話リスト
  hasUnreadConvos: boolean // 未読フラグ - 未読会話の存在状態
}) {
  // 国際化フック
  const {_} = useLingui()
  // テーマフック
  const t = useTheme()
  // ナビゲーションフック
  const navigation = useNavigation<NavigationProp>()

  // ポーリング制御 - 画面がアクティブな時のみリアルタイム更新を実行
  // メッセージ画面のポーリング間隔（デフォルト10秒）でデータを更新
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

  // パフォーマンス最適化 - アイテム高さ130px基準の初期レンダリング数
  const initialNumToRender = useInitialNumToRender({minItemHeight: 130})
  // プルツーリフレッシュ状態 - 手動更新の進行状況
  const [isPTRing, setIsPTRing] = useState(false)

  // クエリ状態 - ローディング、エラー、ページネーション状態
  const {
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = listConvosQuery

  // フォーカス時自動更新 - 画面に戻った時のデータリフレッシュ
  useRefreshOnFocus(refetch)

  // プルツーリフレッシュコールバック - 手動でデータを再取得
  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh conversations', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  // 無限スクロールコールバック - スクロール末尾到達時の次ページ取得
  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more conversations', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  if (conversations.length < 1) {
    return (
      <Layout.Center>
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
                    {cleanError(error) || _(msg`Failed to load conversations`)}
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
                    <Trans comment="Title message shown in chat requests inbox when it's empty">
                      Inbox zero!
                    </Trans>
                  </Text>
                  <Text
                    style={[
                      a.text_md,
                      a.pb_xl,
                      a.text_center,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}>
                    <Trans>
                      You don't have any chat requests at the moment.
                    </Trans>
                  </Text>
                  <Button
                    variant="solid"
                    color="secondary"
                    size="small"
                    label={_(msg`Go back`)}
                    onPress={() => {
                      if (navigation.canGoBack()) {
                        navigation.goBack()
                      } else {
                        navigation.navigate('Messages', {animation: 'pop'})
                      }
                    }}>
                    <ButtonIcon icon={ArrowLeftIcon} />
                    <ButtonText>
                      <Trans>Back to Chats</Trans>
                    </ButtonText>
                  </Button>
                </View>
              </>
            )}
          </>
        )}
      </Layout.Center>
    )
  }

  return (
    <>
      <List
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
      {hasUnreadConvos && <MarkAllReadFAB />}
    </>
  )
}

// キー抽出関数 - リストアイテムの一意識別子として会話IDを使用
function keyExtractor(item: ChatBskyConvoDefs.ConvoView) {
  return item.id
}

// アイテムレンダリング関数 - 会話データを要求リストアイテムコンポーネントで表示
function renderItem({item}: {item: ChatBskyConvoDefs.ConvoView}) {
  return <RequestListItem convo={item} />
}

/**
 * 全て既読フローティングアクションボタン
 * 未読チャット要求を一括で既読にする機能
 * 成功/失敗時にトースト通知を表示
 */
function MarkAllReadFAB() {
  const {_} = useLingui()
  const t = useTheme()
  // 全て既読ミューテーション - 要求ステータスの会話を対象
  const {mutate: markAllRead} = useUpdateAllRead('request', {
    onMutate: () => {
      Toast.show(_(msg`Marked all as read`), 'check')
    },
    onError: () => {
      Toast.show(_(msg`Failed to mark all requests as read`), 'xmark')
    },
  })

  return (
    <FAB
      testID="markAllAsReadFAB"
      onPress={() => markAllRead()}
      icon={<CheckIcon size="lg" fill={t.palette.white} />}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Mark all as read`)}
      accessibilityHint=""
    />
  )
}

/**
 * ヘッダー内既読ボタン
 * タブレット画面用の全て既読機能
 * ヘッダー右側に配置され、タブレットレイアウトで使用
 */
function MarkAsReadHeaderButton() {
  const {_} = useLingui()
  // 全て既読ミューテーション - 要求ステータスの会話を対象
  const {mutate: markAllRead} = useUpdateAllRead('request', {
    onMutate: () => {
      Toast.show(_(msg`Marked all as read`), 'check')
    },
    onError: () => {
      Toast.show(_(msg`Failed to mark all requests as read`), 'xmark')
    },
  })

  return (
    <Button
      label={_(msg`Mark all as read`)}
      size="small"
      color="secondary"
      variant="solid"
      onPress={() => markAllRead()}>
      <ButtonIcon icon={CheckIcon} />
      <ButtonText>
        <Trans>Mark all as read</Trans>
      </ButtonText>
    </Button>
  )
}
