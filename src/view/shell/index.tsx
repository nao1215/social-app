// React基本機能・UI
import {useCallback, useEffect, useState} from 'react'                    // Reactフック
import {BackHandler, useWindowDimensions, View} from 'react-native'      // React Native基本コンポーネント
import {Drawer} from 'react-native-drawer-layout'                        // ドロワーレイアウト
import {SystemBars} from 'react-native-edge-to-edge'                     // システムバー制御
import {Gesture} from 'react-native-gesture-handler'                     // ジェスチャーハンドラー
import {useSafeAreaInsets} from 'react-native-safe-area-context'         // セーフエリア
import {useNavigation, useNavigationState} from '@react-navigation/native' // ナビゲーション

// カスタムフック・ユーティリティ
import {useDedupe} from '#/lib/hooks/useDedupe'                          // 重複処理防止
import {useIntentHandler} from '#/lib/hooks/useIntentHandler'            // インテント処理
import {useNotificationsHandler} from '#/lib/hooks/useNotificationHandler' // 通知ハンドラー
import {useNotificationsRegistration} from '#/lib/notifications/notifications' // 通知登録
import {isStateAtTabRoot} from '#/lib/routes/helpers'                    // ルート状態判定
import {isAndroid, isIOS} from '#/platform/detection'                   // プラットフォーム判定

// 状態管理
import {useDialogFullyExpandedCountContext} from '#/state/dialogs'       // ダイアログ展開数
import {useGeolocationStatus} from '#/state/geolocation'                 // 地理位置情報状態
import {useSession} from '#/state/session'                               // セッション状態
import {
  useIsDrawerOpen,
  useIsDrawerSwipeDisabled,
  useSetDrawerOpen,
} from '#/state/shell'                                                   // シェル状態管理
import {useCloseAnyActiveElement} from '#/state/util'                    // アクティブ要素クローズ

// ビューコンポーネント
import {Lightbox} from '#/view/com/lightbox/Lightbox'                    // ライトボックス
import {ModalsContainer} from '#/view/com/modals/Modal'                  // モーダルコンテナ
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'              // エラーバウンダリ

// デザインシステム・テーマ
import {atoms as a, select, useTheme} from '#/alf'                       // Alfデザインシステム
import {setSystemUITheme} from '#/alf/util/systemUI'                     // システムUIテーマ

// ダイアログコンポーネント群
import {AgeAssuranceRedirectDialog} from '#/components/ageAssurance/AgeAssuranceRedirectDialog' // 年齢確認リダイレクト
import {BlockedGeoOverlay} from '#/components/BlockedGeoOverlay'          // 地理的ブロックオーバーレイ
import {EmailDialog} from '#/components/dialogs/EmailDialog'             // メールダイアログ
import {InAppBrowserConsentDialog} from '#/components/dialogs/InAppBrowserConsent' // アプリ内ブラウザ同意
import {LinkWarningDialog} from '#/components/dialogs/LinkWarning'       // リンク警告ダイアログ
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'         // ミュート単語ダイアログ
import {SigninDialog} from '#/components/dialogs/Signin'                 // サインインダイアログ
import {
  Outlet as PolicyUpdateOverlayPortalOutlet,
  usePolicyUpdateContext,
} from '#/components/PolicyUpdateOverlay'                                // ポリシー更新オーバーレイ
import {Outlet as PortalOutlet} from '#/components/Portal'               // ポータルアウトレット

// ナビゲーション・モジュール
import {RoutesContainer, TabsNavigator} from '#/Navigation'              // ナビゲーションコンテナ・タブナビゲーター
import {BottomSheetOutlet} from '../../../modules/bottom-sheet'          // ボトムシートアウトレット
import {updateActiveViewAsync} from '../../../modules/expo-bluesky-swiss-army/src/VisibilityView' // ビュー可視性更新

// シェル内コンポーネント
import {Composer} from './Composer'                                      // 投稿作成
import {DrawerContent} from './Drawer'                                   // ドロワー内容

function ShellInner() {
  const winDim = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const {state: policyUpdateState} = usePolicyUpdateContext()

  const closeAnyActiveElement = useCloseAnyActiveElement()

  useNotificationsRegistration()
  useNotificationsHandler()

  useEffect(() => {
    if (isAndroid) {
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        return closeAnyActiveElement()
      })

      return () => {
        listener.remove()
      }
    }
  }, [closeAnyActiveElement])

  // HACK
  // expo-video doesn't like it when you try and move a `player` to another `VideoView`. Instead, we need to actually
  // unregister that player to let the new screen register it. This is only a problem on Android, so we only need to
  // apply it there.
  // The `state` event should only fire whenever we push or pop to a screen, and should not fire consecutively quickly.
  // To be certain though, we will also dedupe these calls.
  const navigation = useNavigation()
  const dedupe = useDedupe(1000)
  useEffect(() => {
    if (!isAndroid) return
    const onFocusOrBlur = () => {
      setTimeout(() => {
        dedupe(updateActiveViewAsync)
      }, 500)
    }
    navigation.addListener('state', onFocusOrBlur)
    return () => {
      navigation.removeListener('state', onFocusOrBlur)
    }
  }, [dedupe, navigation])

  return (
    <>
      <View style={[a.h_full]}>
        <ErrorBoundary
          style={{paddingTop: insets.top, paddingBottom: insets.bottom}}>
          <DrawerLayout>
            <TabsNavigator />
          </DrawerLayout>
        </ErrorBoundary>
      </View>

      <Composer winHeight={winDim.height} />
      <ModalsContainer />
      <MutedWordsDialog />
      <SigninDialog />
      <EmailDialog />
      <AgeAssuranceRedirectDialog />
      <InAppBrowserConsentDialog />
      <LinkWarningDialog />
      <Lightbox />

      {/* Until policy update has been completed by the user, don't render anything that is portaled */}
      {policyUpdateState.completed && (
        <>
          <PortalOutlet />
          <BottomSheetOutlet />
        </>
      )}

      <PolicyUpdateOverlayPortalOutlet />
    </>
  )
}

function DrawerLayout({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const isDrawerOpen = useIsDrawerOpen()
  const setIsDrawerOpen = useSetDrawerOpen()
  const isDrawerSwipeDisabled = useIsDrawerSwipeDisabled()
  const winDim = useWindowDimensions()

  const canGoBack = useNavigationState(state => !isStateAtTabRoot(state))
  const {hasSession} = useSession()

  const swipeEnabled = !canGoBack && hasSession && !isDrawerSwipeDisabled
  const [trendingScrollGesture] = useState(() => Gesture.Native())

  const renderDrawerContent = useCallback(() => <DrawerContent />, [])
  const onOpenDrawer = useCallback(
    () => setIsDrawerOpen(true),
    [setIsDrawerOpen],
  )
  const onCloseDrawer = useCallback(
    () => setIsDrawerOpen(false),
    [setIsDrawerOpen],
  )

  return (
    <Drawer
      renderDrawerContent={renderDrawerContent}
      drawerStyle={{width: Math.min(400, winDim.width * 0.8)}}
      configureGestureHandler={handler => {
        handler = handler.requireExternalGestureToFail(trendingScrollGesture)

        if (swipeEnabled) {
          if (isDrawerOpen) {
            return handler.activeOffsetX([-1, 1])
          } else {
            return (
              handler
                // Any movement to the left is a pager swipe
                // so fail the drawer gesture immediately.
                .failOffsetX(-1)
                // Don't rush declaring that a movement to the right
                // is a drawer swipe. It could be a vertical scroll.
                .activeOffsetX(5)
            )
          }
        } else {
          // Fail the gesture immediately.
          // This seems more reliable than the `swipeEnabled` prop.
          // With `swipeEnabled` alone, the gesture may freeze after toggling off/on.
          return handler.failOffsetX([0, 0]).failOffsetY([0, 0])
        }
      }}
      open={isDrawerOpen}
      onOpen={onOpenDrawer}
      onClose={onCloseDrawer}
      swipeEdgeWidth={winDim.width}
      swipeMinVelocity={100}
      swipeMinDistance={10}
      drawerType={isIOS ? 'slide' : 'front'}
      overlayStyle={{
        backgroundColor: select(t.name, {
          light: 'rgba(0, 57, 117, 0.1)',
          dark: isAndroid ? 'rgba(16, 133, 254, 0.1)' : 'rgba(1, 82, 168, 0.1)',
          dim: 'rgba(10, 13, 16, 0.8)',
        }),
      }}>
      {children}
    </Drawer>
  )
}

export function Shell() {
  const t = useTheme()
  const {status: geolocation} = useGeolocationStatus()
  const fullyExpandedCount = useDialogFullyExpandedCountContext()

  useIntentHandler()

  useEffect(() => {
    setSystemUITheme('theme', t)
  }, [t])

  return (
    <View testID="mobileShellView" style={[a.h_full, t.atoms.bg]}>
      <SystemBars
        style={{
          statusBar:
            t.name !== 'light' || (isIOS && fullyExpandedCount > 0)
              ? 'light'
              : 'dark',
          navigationBar: t.name !== 'light' ? 'light' : 'dark',
        }}
      />
      {geolocation?.isAgeBlockedGeo ? (
        <BlockedGeoOverlay />
      ) : (
        <RoutesContainer>
          <ShellInner />
        </RoutesContainer>
      )}
    </View>
  )
}
