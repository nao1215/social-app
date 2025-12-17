/**
 * リンクコンポーネント集（レガシー）
 * Link Components Collection (Legacy)
 *
 * 【概要】
 * アプリ内・外部リンクを処理するコンポーネント群。
 * ナビゲーション、外部URL、モーダル制御を統合的に処理。
 *
 * 【注意】
 * このファイルは非推奨。新規コードでは `#/components/Link.tsx` を使用すること。
 *
 * 【含まれるコンポーネント】
 * - Link: 基本リンクコンポーネント（@deprecated）
 * - TextLink: テキストリンク（@deprecated）
 * - TextLinkOnWebOnly: Web専用テキストリンク（@deprecated）
 *
 * 【Goユーザー向け補足】
 * - sanitizeUrl: URLインジェクション対策（GoのnetpackageのURL検証に相当）
 * - StackActions: React Navigationのスタック操作（push/replace/navigate）
 * - Goでいうhttp.Router + ミドルウェアに近い役割
 *
 * 【リンク処理フロー】
 * 1. URLをサニタイズ（XSS対策）
 * 2. Bluesky URLを内部形式に変換
 * 3. 外部URL → システムブラウザで開く
 * 4. 内部URL → React Navigationでナビゲート
 * 5. 修飾キー（Ctrl+Click等） → 新タブで開く
 */

// Reactフック
// React hooks
import {memo, useCallback, useMemo} from 'react'

// React Nativeの基本コンポーネントと型
// React Native basic components and types
import {
  type GestureResponderEvent,
  Platform,
  Pressable,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'

// URLサニタイズライブラリ（XSS対策）
// URL sanitization library (XSS prevention)
import {sanitizeUrl} from '@braintree/sanitize-url'

// React Navigationのスタック操作アクション
// React Navigation stack action creators
import {StackActions} from '@react-navigation/native'

// デバウンス付きナビゲーションフック
// Debounced navigation hook
import {
  type DebouncedNavigationProp,
  useNavigationDeduped,
} from '#/lib/hooks/useNavigationDeduped'

// 外部リンク開くフック
// Open external link hook
import {useOpenLink} from '#/lib/hooks/useOpenLink'

// タブ状態ヘルパー
// Tab state helpers
import {getTabState, TabState} from '#/lib/routes/helpers'

// URL処理ユーティリティ
// URL processing utilities
import {
  convertBskyAppUrlIfNeeded,
  isExternalUrl,
  linkRequiresWarning,
} from '#/lib/strings/url-helpers'

// タイポグラフィバリアント型
// Typography variant type
import {type TypographyVariant} from '#/lib/ThemeContext'

// プラットフォーム検出
// Platform detection
import {isAndroid, isWeb} from '#/platform/detection'

// ソフトリセットイベント発火
// Soft reset event emitter
import {emitSoftReset} from '#/state/events'

// モーダル制御フック
// Modal controls hook
import {useModalControls} from '#/state/modals'

// Web補助クリックラッパー（中クリック対応）
// Web auxiliary click wrapper (middle click support)
import {WebAuxClickWrapper} from '#/view/com/util/WebAuxClickWrapper'

// テーマフック
// Theme hook
import {useTheme} from '#/alf'

// グローバルダイアログコンテキスト
// Global dialogs context
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'

// ルーター（パスマッチング用）
// Router (for path matching)
import {router} from '../../../routes'

// ホバースタイル対応Pressable
// Pressable with hover style
import {PressableWithHover} from './PressableWithHover'

// テキストコンポーネント
// Text component
import {Text} from './text/Text'

/**
 * イベント型（Web/Native両対応）
 * Event type (Web/Native compatible)
 */
type Event =
  | React.MouseEvent<HTMLAnchorElement, MouseEvent>
  | GestureResponderEvent

/**
 * LinkコンポーネントのProps型
 * Link Component Props type
 */
interface Props extends React.ComponentProps<typeof TouchableOpacity> {
  /** テストID / Test ID */
  testID?: string
  /** カスタムスタイル / Custom style */
  style?: StyleProp<ViewStyle>
  /** リンク先URL / Destination URL */
  href?: string
  /** リンクタイトル / Link title */
  title?: string
  /** 子要素 / Children */
  children?: React.ReactNode
  /** ホバー時のスタイル / Hover style */
  hoverStyle?: StyleProp<ViewStyle>
  /** フィードバックなしフラグ / No feedback flag */
  noFeedback?: boolean
  /** アンカータグとしてレンダリング / Render as anchor tag */
  asAnchor?: boolean
  /** データ属性（Web用） / Data attributes (for Web) */
  dataSet?: any
  /** アンカーの下線なしフラグ / No underline for anchor */
  anchorNoUnderline?: boolean
  /** ナビゲーションアクション種別 / Navigation action type */
  navigationAction?: 'push' | 'replace' | 'navigate'
  /** ポインター進入時コールバック / Pointer enter callback */
  onPointerEnter?: () => void
  /** ポインター退出時コールバック / Pointer leave callback */
  onPointerLeave?: () => void
  /** 押下前コールバック / Before press callback */
  onBeforePress?: () => void
}

/**
 * 基本リンクコンポーネント（レガシー）
 * Basic Link Component (Legacy)
 *
 * @deprecated use Link from `#/components/Link.tsx` instead
 *
 * 【処理フロー】
 * 1. URLをサニタイズ
 * 2. 押下時にナビゲーション処理を実行
 * 3. noFeedbackの場合はフィードバックなしPressable
 * 4. それ以外はホバー対応Pressable
 */
export const Link = memo(function Link({
  testID,
  style,
  href,
  title,
  children,
  noFeedback,
  asAnchor,
  accessible,
  anchorNoUnderline,
  navigationAction,
  onBeforePress,
  accessibilityActions,
  onAccessibilityAction,
  dataSet: dataSetProp,
  ...props
}: Props) {
  const t = useTheme()
  const {closeModal} = useModalControls()
  const navigation = useNavigationDeduped()
  const anchorHref = asAnchor ? sanitizeUrl(href) : undefined
  const openLink = useOpenLink()

  const onPress = useCallback(
    (e?: Event) => {
      onBeforePress?.()
      if (typeof href === 'string') {
        return onPressInner(
          closeModal,
          navigation,
          sanitizeUrl(href),
          navigationAction,
          openLink,
          e,
        )
      }
    },
    [closeModal, navigation, navigationAction, href, openLink, onBeforePress],
  )

  const accessibilityActionsWithActivate = [
    ...(accessibilityActions || []),
    {name: 'activate', label: title},
  ]

  const dataSet = anchorNoUnderline
    ? {...dataSetProp, noUnderline: 1}
    : dataSetProp

  if (noFeedback) {
    return (
      <WebAuxClickWrapper>
        <Pressable
          testID={testID}
          onPress={onPress}
          accessible={accessible}
          accessibilityRole="link"
          accessibilityActions={accessibilityActionsWithActivate}
          onAccessibilityAction={e => {
            if (e.nativeEvent.actionName === 'activate') {
              onPress()
            } else {
              onAccessibilityAction?.(e)
            }
          }}
          // @ts-ignore web only -sfn
          dataSet={dataSet}
          {...props}
          android_ripple={{
            color: t.atoms.bg_contrast_25.backgroundColor,
          }}
          unstable_pressDelay={isAndroid ? 90 : undefined}>
          {/* @ts-ignore web only -prf */}
          <View style={style} href={anchorHref}>
            {children ? children : <Text>{title || 'link'}</Text>}
          </View>
        </Pressable>
      </WebAuxClickWrapper>
    )
  }

  const Com = props.hoverStyle ? PressableWithHover : Pressable
  return (
    <Com
      testID={testID}
      style={style}
      onPress={onPress}
      accessible={accessible}
      accessibilityRole="link"
      accessibilityLabel={props.accessibilityLabel ?? title}
      accessibilityHint={props.accessibilityHint}
      // @ts-ignore web only -prf
      href={anchorHref}
      dataSet={dataSet}
      {...props}>
      {children ? children : <Text>{title || 'link'}</Text>}
    </Com>
  )
})

/**
 * テキストリンクコンポーネント（レガシー）
 * Text Link Component (Legacy)
 *
 * @deprecated use InlineLinkText from `#/components/Link.tsx` instead
 *
 * 【概要】
 * テキストとして表示されるリンク。フィッシング対策機能付き。
 *
 * 【フィッシング対策】
 * リンクテキストとhrefが一致しない場合（例: "google.com"と表示して
 * 実際は"malicious.com"にリンク）、警告ダイアログを表示。
 *
 * 【Goユーザー向け補足】
 * - linkRequiresWarning: URLの不一致を検出する関数
 *   Goのnet/url.Parseで検証するような処理
 */
export const TextLink = memo(function TextLink({
  testID,
  type = 'md',
  style,
  href,
  text,
  numberOfLines,
  lineHeight,
  dataSet: dataSetProp,
  title,
  onPress: onPressProp,
  onBeforePress,
  disableMismatchWarning,
  navigationAction,
  anchorNoUnderline,
  ...props
}: {
  testID?: string
  type?: TypographyVariant
  style?: StyleProp<TextStyle>
  href: string
  text: string | JSX.Element | React.ReactNode
  numberOfLines?: number
  lineHeight?: number
  dataSet?: any
  title?: string
  disableMismatchWarning?: boolean
  navigationAction?: 'push' | 'replace' | 'navigate'
  anchorNoUnderline?: boolean
  onBeforePress?: () => void
} & TextProps) {
  const navigation = useNavigationDeduped()
  const {closeModal} = useModalControls()
  const {linkWarningDialogControl} = useGlobalDialogsControlContext()
  const openLink = useOpenLink()

  if (!disableMismatchWarning && typeof text !== 'string') {
    console.error('Unable to detect mismatching label')
  }

  const dataSet = anchorNoUnderline
    ? {...dataSetProp, noUnderline: 1}
    : dataSetProp

  const onPress = useCallback(
    (e?: Event) => {
      const requiresWarning =
        !disableMismatchWarning &&
        linkRequiresWarning(href, typeof text === 'string' ? text : '')
      if (requiresWarning) {
        e?.preventDefault?.()
        linkWarningDialogControl.open({
          displayText: typeof text === 'string' ? text : '',
          href,
        })
      }
      if (
        isWeb &&
        href !== '#' &&
        e != null &&
        isModifiedEvent(e as React.MouseEvent)
      ) {
        // Let the browser handle opening in new tab etc.
        return
      }
      onBeforePress?.()
      if (onPressProp) {
        e?.preventDefault?.()
        // @ts-expect-error function signature differs by platform -prf
        return onPressProp()
      }
      return onPressInner(
        closeModal,
        navigation,
        sanitizeUrl(href),
        navigationAction,
        openLink,
        e,
      )
    },
    [
      onBeforePress,
      onPressProp,
      closeModal,
      navigation,
      href,
      text,
      disableMismatchWarning,
      navigationAction,
      openLink,
      linkWarningDialogControl,
    ],
  )
  const hrefAttrs = useMemo(() => {
    const isExternal = isExternalUrl(href)
    if (isExternal) {
      return {
        target: '_blank',
        // rel: 'noopener noreferrer',
      }
    }
    return {}
  }, [href])

  return (
    <Text
      testID={testID}
      type={type}
      style={style}
      numberOfLines={numberOfLines}
      lineHeight={lineHeight}
      dataSet={dataSet}
      title={title}
      // @ts-ignore web only -prf
      hrefAttrs={hrefAttrs} // hack to get open in new tab to work on safari. without this, safari will open in a new window
      onPress={onPress}
      accessibilityRole="link"
      href={convertBskyAppUrlIfNeeded(sanitizeUrl(href))}
      {...props}>
      {text}
    </Text>
  )
})

/**
 * Web専用テキストリンクのProps型
 * Web-only Text Link Props type
 *
 * デスクトップWebでのみリンクとして機能し、
 * モバイルでは通常のテキストとして表示される。
 */
interface TextLinkOnWebOnlyProps extends TextProps {
  testID?: string
  type?: TypographyVariant
  style?: StyleProp<TextStyle>
  href: string
  text: string | JSX.Element
  numberOfLines?: number
  lineHeight?: number
  accessible?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  title?: string
  navigationAction?: 'push' | 'replace' | 'navigate'
  disableMismatchWarning?: boolean
  onBeforePress?: () => void
  onPointerEnter?: () => void
  anchorNoUnderline?: boolean
}

/**
 * Web専用テキストリンクコンポーネント（レガシー）
 * Web-only Text Link Component (Legacy)
 *
 * @deprecated use WebOnlyInlineLinkText from `#/components/Link.tsx` instead
 *
 * 【概要】
 * デスクトップWebではリンク、モバイルでは通常テキストとして表示。
 * SEO対策やデスクトップ向けUX向上のため。
 *
 * 【Goユーザー向け補足】
 * - isWeb: プラットフォーム判定（Goのbuild tagsに相当）
 * - 条件分岐でコンポーネントを切り替え
 */
export const TextLinkOnWebOnly = memo(function DesktopWebTextLink({
  testID,
  type = 'md',
  style,
  href,
  text,
  numberOfLines,
  lineHeight,
  navigationAction,
  disableMismatchWarning,
  onBeforePress,
  ...props
}: TextLinkOnWebOnlyProps) {
  if (isWeb) {
    return (
      <TextLink
        testID={testID}
        type={type}
        style={style}
        href={href}
        text={text}
        numberOfLines={numberOfLines}
        lineHeight={lineHeight}
        title={props.title}
        navigationAction={navigationAction}
        disableMismatchWarning={disableMismatchWarning}
        onBeforePress={onBeforePress}
        {...props}
      />
    )
  }
  return (
    <Text
      testID={testID}
      type={type}
      style={style}
      numberOfLines={numberOfLines}
      lineHeight={lineHeight}
      title={props.title}
      {...props}>
      {text}
    </Text>
  )
})

/**
 * ナビゲーションから除外するパス
 * Paths exempt from navigation handling
 *
 * これらのパスはシステムブラウザで直接開く。
 * クローラー・セキュリティ関連の標準ファイル。
 */
const EXEMPT_PATHS = ['/robots.txt', '/security.txt', '/.well-known/']

/**
 * リンク押下時の内部処理
 * Internal link press handler
 *
 * 【注意】
 * useLinkPropsのonPressは使用できない。
 * 理由: ほとんどのパスがHomeTabにマッチしてしまい、
 * 現在のタブを維持できないため。
 *
 * 【追加動作】
 * - モーダルを閉じる
 * - Bluesky URLを内部形式に変換
 * - http/sリンクはシステムブラウザで開く
 *
 * 【Goユーザー向け補足】
 * - この関数はhttp.Handlerミドルウェアのような役割
 * - リクエスト（クリック）を適切なハンドラに振り分け
 *
 * @param closeModal モーダルを閉じる関数 / Modal close function
 * @param navigation ナビゲーションオブジェクト / Navigation object
 * @param href リンク先URL / Destination URL
 * @param navigationAction ナビゲーションアクション種別 / Navigation action type
 * @param openLink 外部リンクを開く関数 / External link opener
 * @param e イベントオブジェクト / Event object
 */
function onPressInner(
  closeModal = () => {},
  navigation: DebouncedNavigationProp,
  href: string,
  navigationAction: 'push' | 'replace' | 'navigate' = 'push',
  openLink: (href: string) => void,
  e?: Event,
) {
  let shouldHandle = false
  const isLeftClick =
    // @ts-ignore Web only -prf
    Platform.OS === 'web' && (e.button == null || e.button === 0)
  // @ts-ignore Web only -prf
  const isMiddleClick = Platform.OS === 'web' && e.button === 1
  const isMetaKey =
    // @ts-ignore Web only -prf
    Platform.OS === 'web' && (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
  const newTab = isMetaKey || isMiddleClick

  if (Platform.OS !== 'web' || !e) {
    shouldHandle = e ? !e.defaultPrevented : true
  } else if (
    !e.defaultPrevented && // onPress prevented default
    (isLeftClick || isMiddleClick) && // ignore everything but left and middle clicks
    // @ts-ignore Web only -prf
    [undefined, null, '', 'self'].includes(e.currentTarget?.target) // let browser handle "target=_blank" etc.
  ) {
    e.preventDefault()
    shouldHandle = true
  }

  if (shouldHandle) {
    href = convertBskyAppUrlIfNeeded(href)
    if (
      newTab ||
      href.startsWith('http') ||
      href.startsWith('mailto') ||
      EXEMPT_PATHS.some(path => href.startsWith(path))
    ) {
      openLink(href)
    } else {
      closeModal() // close any active modals

      const [routeName, params] = router.matchPath(href)
      if (navigationAction === 'push') {
        // @ts-ignore we're not able to type check on this one -prf
        navigation.dispatch(StackActions.push(routeName, params))
      } else if (navigationAction === 'replace') {
        // @ts-ignore we're not able to type check on this one -prf
        navigation.dispatch(StackActions.replace(routeName, params))
      } else if (navigationAction === 'navigate') {
        const state = navigation.getState()
        const tabState = getTabState(state, routeName)
        if (tabState === TabState.InsideAtRoot) {
          emitSoftReset()
        } else {
          // note: 'navigate' actually acts the same as 'push' nowadays
          // therefore we need to add 'pop' -sfn
          // @ts-ignore we're not able to type check on this one -prf
          navigation.navigate(routeName, params, {pop: true})
        }
      } else {
        throw Error('Unsupported navigator action.')
      }
    }
  }
}

/**
 * 修飾キー押下判定
 * Modified Event Detection
 *
 * 【概要】
 * クリック時に修飾キーが押されているかを判定。
 * 新タブで開く等のブラウザ標準動作を有効にするため。
 *
 * 【判定条件】
 * - target属性が_self以外（別ウィンドウ指定）
 * - Cmd/Ctrl/Shift/Altキーが押されている
 * - 中クリック（which === 2）
 *
 * 【Goユーザー向け補足】
 * - Webブラウザ固有の概念（Goには直接対応なし）
 * - Cmd+Click（Mac）やCtrl+Click（Win）で新タブ
 *
 * @param e マウスイベント / Mouse event
 * @returns 修飾キーが押されているか / Whether modifier key is pressed
 */
function isModifiedEvent(e: React.MouseEvent): boolean {
  const eventTarget = e.currentTarget as HTMLAnchorElement
  const target = eventTarget.getAttribute('target')
  return (
    (target && target !== '_self') ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    (e.nativeEvent && e.nativeEvent.which === 2)
  )
}
