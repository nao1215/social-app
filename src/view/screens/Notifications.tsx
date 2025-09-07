// React基本機能とUI
import {useCallback, useEffect, useMemo, useRef, useState} from 'react' // Reactフック
import {View} from 'react-native'                                      // ビューコンポーネント
import {msg, Trans} from '@lingui/macro'                              // 国際化マクロ
import {useLingui} from '@lingui/react'                               // 国際化フック
import {useFocusEffect, useIsFocused} from '@react-navigation/native' // ナビゲーション状態フック
import {useQueryClient} from '@tanstack/react-query'                  // クエリクライアント

// フック・アイコン・ルーティング
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback' // 非リアクティブコールバック
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'               // 投稿作成画面オープン
import {ComposeIcon2} from '#/lib/icons'                                  // 作成アイコン
import {
  type NativeStackScreenProps,
  type NotificationsTabNavigatorParams,
} from '#/lib/routes/types'                                               // ルート型定義
import {s} from '#/lib/styles'                                            // スタイル定数
import {logger} from '#/logger'                                           // ロガー
import {isNative} from '#/platform/detection'                            // プラットフォーム判定

// 状態管理・イベント
import {emitSoftReset, listenSoftReset} from '#/state/events'            // ソフトリセットイベント
import {RQKEY as NOTIFS_RQKEY} from '#/state/queries/notifications/feed' // 通知クエリキー
import {useNotificationSettingsQuery} from '#/state/queries/notifications/settings' // 通知設定クエリ
import {
  useUnreadNotifications,
  useUnreadNotificationsApi,
} from '#/state/queries/notifications/unread'                            // 未読通知管理
import {truncateAndInvalidate} from '#/state/queries/util'               // クエリ無効化
import {useSetMinimalShellMode} from '#/state/shell'                     // ミニマルシェルモード

// ビューコンポーネント
import {NotificationFeed} from '#/view/com/notifications/NotificationFeed' // 通知フィード
import {Pager} from '#/view/com/pager/Pager'                              // ページャー
import {TabBar} from '#/view/com/pager/TabBar'                            // タブバー
import {FAB} from '#/view/com/util/fab/FAB'                               // フローティングアクションボタン
import {type ListMethods} from '#/view/com/util/List'                     // リストメソッド型
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'   // 最新読み込みボタン
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'     // メインスクロールプロバイダー

// デザインシステム・レイアウト
import {atoms as a, useTheme} from '#/alf'                                // Alfデザインシステム
import {web} from '#/alf'                                                 // Web専用スタイル
import {Admonition} from '#/components/Admonition'                        // 警告コンポーネント
import {ButtonIcon} from '#/components/Button'                            // ボタンアイコン
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2' // 設定アイコン
import * as Layout from '#/components/Layout'                             // レイアウトコンポーネント
import {InlineLinkText, Link} from '#/components/Link'                    // リンクコンポーネント
import {Loader} from '#/components/Loader'                                // ローダー

// リロード時の状態は現在永続化していません
// （バッジをクリアするには「すべて」タブにアクセスする必要があるため）
// ただし、セッション中は少なくとも永続化させます
// We don't currently persist this across reloads since
// you gotta visit All to clear the badge anyway.
// But let's at least persist it during the sesssion.
let lastActiveTab = 0

// 通知画面のプロパティ型定義
type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>

/**
 * 通知画面メインコンポーネント
 * 「すべて」と「メンション」の2つのタブを表示
 * Notifications screen main component
 * Displays two tabs: "All" and "Mentions"
 */
export function NotificationsScreen({}: Props) {
  const {_} = useLingui()                                    // 国際化
  const {openComposer} = useOpenComposer()                   // 投稿作成画面オープナー
  const unreadNotifs = useUnreadNotifications()              // 未読通知データ
  const hasNew = !!unreadNotifs                              // 新しい通知があるかの判定
  const {checkUnread: checkUnreadAll} = useUnreadNotificationsApi() // 未読通知チェックAPI
  const [isLoadingAll, setIsLoadingAll] = useState(false)     // すべてタブの読み込み状態
  const [isLoadingMentions, setIsLoadingMentions] = useState(false) // メンションタブの読み込み状態
  const initialActiveTab = lastActiveTab                      // 初期アクティブタブ
  const [activeTab, setActiveTab] = useState(initialActiveTab) // 現在のアクティブタブ
  const isLoading = activeTab === 0 ? isLoadingAll : isLoadingMentions // 現在のタブの読み込み状態

  const onPageSelected = useCallback(
    (index: number) => {
      setActiveTab(index)
      lastActiveTab = index
    },
    [setActiveTab],
  )

  const queryClient = useQueryClient()
  const checkUnreadMentions = useCallback(
    async ({invalidate}: {invalidate: boolean}) => {
      if (invalidate) {
        return truncateAndInvalidate(queryClient, NOTIFS_RQKEY('mentions'))
      } else {
        // Background polling is not implemented for the mentions tab.
        // Just ignore it.
      }
    },
    [queryClient],
  )

  const sections = useMemo(() => {
    return [
      {
        title: _(msg`All`),
        component: (
          <NotificationsTab
            filter="all"
            isActive={activeTab === 0}
            isLoading={isLoadingAll}
            hasNew={hasNew}
            setIsLoadingLatest={setIsLoadingAll}
            checkUnread={checkUnreadAll}
          />
        ),
      },
      {
        title: _(msg`Mentions`),
        component: (
          <NotificationsTab
            filter="mentions"
            isActive={activeTab === 1}
            isLoading={isLoadingMentions}
            hasNew={false /* We don't know for sure */}
            setIsLoadingLatest={setIsLoadingMentions}
            checkUnread={checkUnreadMentions}
          />
        ),
      },
    ]
  }, [
    _,
    hasNew,
    checkUnreadAll,
    checkUnreadMentions,
    activeTab,
    isLoadingAll,
    isLoadingMentions,
  ])

  return (
    <Layout.Screen testID="notificationsScreen">
      <Layout.Header.Outer noBottomBorder sticky={false}>
        <Layout.Header.MenuButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Notifications</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <Link
            to={{screen: 'NotificationSettings'}}
            label={_(msg`Notification settings`)}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            style={[a.justify_center]}>
            <ButtonIcon icon={isLoading ? Loader : SettingsIcon} size="lg" />
          </Link>
        </Layout.Header.Slot>
      </Layout.Header.Outer>
      <Pager
        onPageSelected={onPageSelected}
        renderTabBar={props => (
          <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
            <TabBar
              {...props}
              items={sections.map(section => section.title)}
              onPressSelected={() => emitSoftReset()}
            />
          </Layout.Center>
        )}
        initialPage={initialActiveTab}>
        {sections.map((section, i) => (
          <View key={i}>{section.component}</View>
        ))}
      </Pager>
      <FAB
        testID="composeFAB"
        onPress={() => openComposer({})}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New post`)}
        accessibilityHint=""
      />
    </Layout.Screen>
  )
}

function NotificationsTab({
  filter,
  isActive,
  isLoading,
  hasNew,
  checkUnread,
  setIsLoadingLatest,
}: {
  filter: 'all' | 'mentions'
  isActive: boolean
  isLoading: boolean
  hasNew: boolean
  checkUnread: ({invalidate}: {invalidate: boolean}) => Promise<void>
  setIsLoadingLatest: (v: boolean) => void
}) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const scrollElRef = useRef<ListMethods>(null)
  const queryClient = useQueryClient()
  const isScreenFocused = useIsFocused()
  const isFocusedAndActive = isScreenFocused && isActive

  // event handlers
  // =
  const scrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({animated: isNative, offset: 0})
    setMinimalShellMode(false)
  }, [scrollElRef, setMinimalShellMode])

  const onPressLoadLatest = useCallback(() => {
    scrollToTop()
    if (hasNew) {
      // render what we have now
      truncateAndInvalidate(queryClient, NOTIFS_RQKEY(filter))
    } else if (!isLoading) {
      // check with the server
      setIsLoadingLatest(true)
      checkUnread({invalidate: true})
        .catch(() => undefined)
        .then(() => setIsLoadingLatest(false))
    }
  }, [
    scrollToTop,
    queryClient,
    checkUnread,
    hasNew,
    isLoading,
    setIsLoadingLatest,
    filter,
  ])

  const onFocusCheckLatest = useNonReactiveCallback(() => {
    // on focus, check for latest, but only invalidate if the user
    // isnt scrolled down to avoid moving content underneath them
    let currentIsScrolledDown
    if (isNative) {
      currentIsScrolledDown = isScrolledDown
    } else {
      // On the web, this isn't always updated in time so
      // we're just going to look it up synchronously.
      currentIsScrolledDown = window.scrollY > 200
    }
    checkUnread({invalidate: !currentIsScrolledDown})
  })

  // on-visible setup
  // =
  useFocusEffect(
    useCallback(() => {
      if (isFocusedAndActive) {
        setMinimalShellMode(false)
        logger.debug('NotificationsScreen: Focus')
        onFocusCheckLatest()
      }
    }, [setMinimalShellMode, onFocusCheckLatest, isFocusedAndActive]),
  )

  useEffect(() => {
    if (!isFocusedAndActive) {
      return
    }
    return listenSoftReset(onPressLoadLatest)
  }, [onPressLoadLatest, isFocusedAndActive])

  return (
    <>
      <MainScrollProvider>
        <NotificationFeed
          enabled={isFocusedAndActive}
          filter={filter}
          refreshNotifications={() => checkUnread({invalidate: true})}
          onScrolledDownChange={setIsScrolledDown}
          scrollElRef={scrollElRef}
          ListHeaderComponent={
            filter === 'mentions' ? (
              <DisabledNotificationsWarning active={isFocusedAndActive} />
            ) : null
          }
        />
      </MainScrollProvider>
      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new notifications`)}
          showIndicator={hasNew}
        />
      )}
    </>
  )
}

function DisabledNotificationsWarning({active}: {active: boolean}) {
  const t = useTheme()
  const {_} = useLingui()
  const {data} = useNotificationSettingsQuery({enabled: active})

  if (!data) return null

  if (!data.reply.list && !data.quote.list && !data.mention.list) {
    // mention tab notifications are disabled
    return (
      <View style={[a.py_md, a.px_lg, a.border_b, t.atoms.border_contrast_low]}>
        <Admonition type="warning">
          <Trans>
            You have completely disabled reply, quote, and mention
            notifications, so this tab will no longer update. To adjust this,
            visit your{' '}
            <InlineLinkText
              label={_(msg`Visit your notification settings`)}
              to={{screen: 'NotificationSettings'}}>
              notification settings
            </InlineLinkText>
            .
          </Trans>
        </Admonition>
      </View>
    )
  }

  return null
}
