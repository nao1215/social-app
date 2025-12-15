/**
 * Link.tsx
 *
 * リンクコンポーネント - ナビゲーションとURL処理の統合
 * Webのアンカータグ（<a>）とReact Navigationの統合を提供
 *
 * 主な機能:
 * - 内部リンク（アプリ内ナビゲーション）と外部リンク（ブラウザ）の自動判定
 * - URLの検証とサニタイゼーション（XSS対策）
 * - リンク警告ダイアログ（フィッシング対策）
 * - Web/ネイティブのプラットフォーム固有動作の統合
 * - 長押しでシェア機能（ネイティブのみ）
 * - アクセシビリティ対応（role="link"、ARIA属性）
 *
 * Goユーザー向けの補足:
 * - useMemo: 計算コストの高い処理の結果をメモ化するフック（sync.Onceに似ている）
 * - useCallback: 関数をメモ化するフック（依存配列が変わらない限り同じ関数インスタンスを返す）
 * - type: TypeScriptの型エイリアス（Go の type MyType = OtherType に相当）
 * - Omit<T, K>: 型Tから特定のフィールドKを除外する型操作
 * - Pick<T, K>: 型Tから特定のフィールドKのみを抽出する型操作
 */

// Reactのコア機能とフック
import React, {useMemo} from 'react'
// React Nativeのジェスチャーイベントとリンクオープン機能
import {type GestureResponderEvent, Linking} from 'react-native'
// URLサニタイゼーションライブラリ（XSS攻撃対策）
import {sanitizeUrl} from '@braintree/sanitize-url'
// React Navigation関連の型とアクション
import {
  type LinkProps as RNLinkProps,  // React NavigationのLinkプロパティ型
  StackActions,                    // スタックナビゲーションアクション（push, replace等）
} from '@react-navigation/native'

// アプリ定数
import {BSKY_DOWNLOAD_URL} from '#/lib/constants'
// カスタムフック - ナビゲーション重複排除
import {useNavigationDeduped} from '#/lib/hooks/useNavigationDeduped'
// カスタムフック - リンクオープン処理
import {useOpenLink} from '#/lib/hooks/useOpenLink'
// ルーティング関連の型定義
import {type AllNavigatorParams, type RouteParams} from '#/lib/routes/types'
// シェア機能
import {shareUrl} from '#/lib/sharing'
// URL処理ユーティリティ関数
import {
  convertBskyAppUrlIfNeeded,  // Blueskyアプリ内URLの変換
  createProxiedUrl,           // プロキシ経由URLの生成
  isBskyDownloadUrl,          // ダウンロードURLの判定
  isExternalUrl,              // 外部URLの判定
  linkRequiresWarning,        // リンク警告が必要かの判定
} from '#/lib/strings/url-helpers'
// プラットフォーム検出
import {isNative, isWeb} from '#/platform/detection'
// モーダル制御
import {useModalControls} from '#/state/modals'
// デザインシステム
import {atoms as a, flatten, type TextStyleProp, useTheme, web} from '#/alf'
// ボタンコンポーネント
import {Button, type ButtonProps} from '#/components/Button'
// インタラクション状態管理（ホバー等）
import {useInteractionState} from '#/components/hooks/useInteractionState'
// テキストコンポーネント
import {Text, type TextProps} from '#/components/Typography'
// ルーター
import {router} from '#/routes'
// グローバルダイアログコンテキスト
import {useGlobalDialogsControlContext} from './dialogs/Context'

/**
 * Only available within a `Link`, since that inherits from `Button`.
 * `InlineLink` provides no context.
 *
 * `Link`内でのみ利用可能（`Button`を継承しているため）。
 * `InlineLink`はコンテキストを提供しない。
 */
export {useButtonContext as useLinkContext} from '#/components/Button'

/**
 * BaseLinkProps - リンクコンポーネントの基本プロパティ
 *
 * Link、InlineLink、SimpleInlineLinkで共通して使用される基本プロパティ定義
 *
 * Goユーザー向けの補足:
 * - type定義はGoのstructに相当するが、実装を持たない型のみの定義
 */
type BaseLinkProps = {
  testID?: string  // テスト用の識別子

  // ナビゲーション先
  // 文字列（URL）またはReact Navigationのルートオブジェクト
  to: RNLinkProps<AllNavigatorParams> | string

  /**
   * The React Navigation `StackAction` to perform when the link is pressed.
   * リンク押下時に実行するReact Navigationのスタックアクション
   */
  action?: 'push' | 'replace' | 'navigate'

  /**
   * If true, will warn the user if the link text does not match the href.
   *
   * Note: atm this only works for `InlineLink`s with a string child.
   *
   * trueの場合、リンクテキストとhrefが一致しない場合にユーザーに警告を表示。
   *
   * 注意: 現在、文字列の子要素を持つ`InlineLink`でのみ機能する。
   */
  disableMismatchWarning?: boolean

  /**
   * Callback for when the link is pressed. Prevent default and return `false`
   * to exit early and prevent navigation.
   *
   * DO NOT use this for navigation, that's what the `to` prop is for.
   *
   * リンク押下時のコールバック。
   * デフォルト動作を防止してfalseを返すと、早期終了してナビゲーションを防ぐ。
   *
   * 注意: ナビゲーションにこれを使用しないこと。ナビゲーションは`to`プロパティで行う。
   */
  onPress?: (e: GestureResponderEvent) => void | false

  /**
   * Callback for when the link is long pressed (on native). Prevent default
   * and return `false` to exit early and prevent default long press hander.
   *
   * リンク長押し時のコールバック（ネイティブのみ）。
   * デフォルト動作を防止してfalseを返すと、早期終了してデフォルトの長押しハンドラを防ぐ。
   */
  onLongPress?: (e: GestureResponderEvent) => void | false

  /**
   * Web-only attribute. Sets `download` attr on web.
   * Web専用属性。Web版でdownload属性を設定。
   */
  download?: string

  /**
   * Native-only attribute. If true, will open the share sheet on long press.
   * ネイティブ専用属性。trueの場合、長押し時にシェアシートを開く。
   */
  shareOnLongPress?: boolean

  /**
   * Whether the link should be opened through the redirect proxy.
   * リダイレクトプロキシ経由でリンクを開くかどうか。
   */
  shouldProxy?: boolean
}

/**
 * useLink - リンクロジックのカスタムフック
 *
 * リンクのナビゲーション処理、URL検証、警告表示などの複雑なロジックを集約。
 * Link、InlineLink、SimpleInlineLinkで共通して使用される。
 *
 * @param to - ナビゲーション先（文字列またはルートオブジェクト）
 * @param displayText - 表示テキスト（リンク警告の判定に使用）
 * @param action - ナビゲーションアクション（push/replace/navigate）
 * @param disableMismatchWarning - ミスマッチ警告を無効化するか
 * @param onPress - 外部から渡された押下ハンドラ
 * @param onLongPress - 外部から渡された長押しハンドラ
 * @param shareOnLongPress - 長押し時にシェアシートを表示するか
 * @param overridePresentation - プレゼンテーションをオーバーライドするか
 * @param shouldProxy - プロキシ経由で開くか
 *
 * @returns リンクに必要なプロパティ（isExternal, href, onPress, onLongPress）
 *
 * Goユーザー向けの補足:
 * - このフックは複数の戻り値を持つ（Goの多値返却に似ている）
 * - useMemoでhrefをメモ化し、依存配列[to]が変わらない限り再計算しない
 */
export function useLink({
  to,
  displayText,
  action = 'push',
  disableMismatchWarning,
  onPress: outerOnPress,
  onLongPress: outerOnLongPress,
  shareOnLongPress,
  overridePresentation,
  shouldProxy,
}: BaseLinkProps & {
  displayText: string
  overridePresentation?: boolean
  shouldProxy?: boolean
}) {
  // 重複排除されたナビゲーションフック
  const navigation = useNavigationDeduped()

  // hrefの生成とメモ化
  // Goユーザー向けの補足: useMemoは計算コストの高い処理結果をキャッシュ
  // 依存配列[to]が変わらない限り、同じhrefを返す
  const href = useMemo(() => {
    // toが文字列の場合
    return typeof to === 'string'
      ? convertBskyAppUrlIfNeeded(sanitizeUrl(to))  // URLをサニタイズして変換
      // toがオブジェクトで、screenプロパティがある場合
      : to.screen
        ? router.matchName(to.screen)?.build(to.params)  // ルート名からパスを構築
        // hrefプロパティがある場合
        : to.href
          ? convertBskyAppUrlIfNeeded(sanitizeUrl(to.href))
          : undefined  // どれでもない場合はundefined
  }, [to])

  // hrefが解決できない場合はエラー
  if (!href) {
    throw new Error(
      'Could not resolve screen. Link `to` prop must be a string or an object with `screen` and `params` properties',
    )
  }

  // 外部URLかどうかを判定
  const isExternal = isExternalUrl(href)
  // モーダル制御フック
  const {closeModal} = useModalControls()
  // リンク警告ダイアログ制御
  const {linkWarningDialogControl} = useGlobalDialogsControlContext()
  // リンクオープン処理フック
  const openLink = useOpenLink()

  // 押下ハンドラ
  // Goユーザー向けの補足: useCallbackで関数をメモ化
  // 依存配列が変わらない限り同じ関数インスタンスを返す（パフォーマンス最適化）
  const onPress = React.useCallback(
    (e: GestureResponderEvent) => {
      // 外部から渡されたonPressを実行
      const exitEarlyIfFalse = outerOnPress?.(e)

      // falseが返された場合は早期終了（ナビゲーションをキャンセル）
      if (exitEarlyIfFalse === false) return

      // リンク警告が必要かどうかを判定
      // - 警告が無効化されていない
      // - 表示テキストがある
      // - 外部リンク
      // - リンクテキストとhrefが一致しない（フィッシング対策）
      const requiresWarning = Boolean(
        !disableMismatchWarning &&
          displayText &&
          isExternal &&
          linkRequiresWarning(href, displayText),
      )

      // Web版の場合、デフォルト動作（ページ遷移）を防止
      // React Navigationで制御するため
      if (isWeb) {
        e.preventDefault()
      }

      // 警告が必要な場合、警告ダイアログを表示
      if (requiresWarning) {
        linkWarningDialogControl.open({
          displayText,
          href,
        })
      } else {
        // 外部リンクの場合
        if (isExternal) {
          openLink(href, overridePresentation, shouldProxy)
        } else {
          // 内部リンクの場合
          // Cmd/Ctrl + クリックや中クリックで新しいタブで開くかどうかを判定
          const shouldOpenInNewTab = shouldClickOpenNewTab(e)

          // Blueskyダウンロードページの場合、シェアする
          if (isBskyDownloadUrl(href)) {
            shareUrl(BSKY_DOWNLOAD_URL)
          } else if (
            shouldOpenInNewTab ||
            href.startsWith('http') ||
            href.startsWith('mailto')
          ) {
            // 新しいタブで開く、またはhttp/mailto URLの場合は外部リンクとして開く
            openLink(href)
          } else {
            // アプリ内ナビゲーション
            closeModal() // アクティブなモーダルを閉じる

            // URLからスクリーンとパラメータをマッチング
            const [screen, params] = router.matchPath(href) as [
              screen: keyof AllNavigatorParams,
              params?: RouteParams,
            ]

            // ネイティブ版かつNotFoundスクリーンでない場合
            // Goユーザー向けの補足: does not apply to web's flat navigator
            // Webは単一ナビゲーター、ネイティブは階層的なナビゲーター構造
            if (isNative && screen !== 'NotFound') {
              const state = navigation.getState()
              // スクリーンが現在のナビゲーターに含まれていない場合
              // おそらくタブスクリーン
              if (!state.routeNames.includes(screen)) {
                const parent = navigation.getParent()
                if (
                  parent &&
                  parent.getState().routeNames.includes(`${screen}Tab`)
                ) {
                  // タブスクリーンであることを確認（例: SearchTab）
                  // 親ナビゲーター経由で子スクリーンに遷移する必要がある
                  // 参照: https://reactnavigation.org/docs/upgrading-from-6.x/#changes-to-the-navigate-action
                  // TODO: push/replaceなど他のアクションもサポートできるか? -sfn

                  // @ts-expect-error include does not narrow the type unfortunately
                  parent.navigate(`${screen}Tab`, {screen, params})
                  return
                } else {
                  // おそらく失敗するが、とにかく試してみる
                }
              }
            }

            // アクションに応じてナビゲーション実行
            if (action === 'push') {
              // 新しいスクリーンをスタックにプッシュ
              navigation.dispatch(StackActions.push(screen, params))
            } else if (action === 'replace') {
              // 現在のスクリーンを置き換え
              navigation.dispatch(StackActions.replace(screen, params))
            } else if (action === 'navigate') {
              // ナビゲート（既存のスクリーンがあればそこに戻る）
              // @ts-expect-error not typed
              navigation.navigate(screen, params, {pop: true})
            } else {
              throw Error('Unsupported navigator action.')
            }
          }
        }
      }
    },
    [
      outerOnPress,
      disableMismatchWarning,
      displayText,
      isExternal,
      href,
      openLink,
      closeModal,
      action,
      navigation,
      overridePresentation,
      shouldProxy,
      linkWarningDialogControl,
    ],
  )

  // 長押しハンドラ（シェア機能用）
  const handleLongPress = React.useCallback(() => {
    // リンク警告が必要かどうかを判定
    const requiresWarning = Boolean(
      !disableMismatchWarning &&
        displayText &&
        isExternal &&
        linkRequiresWarning(href, displayText),
    )

    // 警告が必要な場合、警告ダイアログをシェアオプション付きで表示
    if (requiresWarning) {
      linkWarningDialogControl.open({
        displayText,
        href,
        share: true,  // シェアボタンを表示
      })
    } else {
      // URLをシェア
      shareUrl(href)
    }
  }, [
    disableMismatchWarning,
    displayText,
    href,
    isExternal,
    linkWarningDialogControl,
  ])

  // 長押しハンドラのラッパー
  const onLongPress = React.useCallback(
    (e: GestureResponderEvent) => {
      // 外部から渡されたonLongPressを実行
      const exitEarlyIfFalse = outerOnLongPress?.(e)
      if (exitEarlyIfFalse === false) return
      // ネイティブかつshareOnLongPressが有効な場合のみシェア処理を実行
      return isNative && shareOnLongPress ? handleLongPress() : undefined
    },
    [outerOnLongPress, handleLongPress, shareOnLongPress],
  )

  // 生成したプロパティを返す
  return {
    isExternal,
    href,
    onPress,
    onLongPress,
  }
}

/**
 * LinkProps - Linkコンポーネントのプロパティ型
 *
 * BaseLinkPropsとButtonPropsを組み合わせた型定義
 *
 * Goユーザー向けの補足:
 * - Omit<T, K>: 型Tから特定のフィールドKを除外
 * - & は型の交差（intersection）- Goには直接の対応物がないが、
 *   複数のstructを埋め込むのに似ている
 */
export type LinkProps = Omit<BaseLinkProps, 'disableMismatchWarning'> &
  Omit<ButtonProps, 'onPress' | 'disabled'> & {
    overridePresentation?: boolean
  }

/**
 * Link - インタラクティブなリンクコンポーネント
 *
 * A interactive element that renders as a `<a>` tag on the web. On mobile it
 * will translate the `href` to navigator screens and params and dispatch a
 * navigation action.
 *
 * Intended to behave as a web anchor tag. For more complex routing, use a
 * `Button`.
 *
 * Webでは`<a>`タグとしてレンダリングされるインタラクティブな要素。
 * モバイルでは`href`をナビゲータースクリーンとパラメータに変換し、
 * ナビゲーションアクションをディスパッチする。
 *
 * Webのアンカータグのように振る舞うことを意図している。
 * より複雑なルーティングには`Button`を使用する。
 *
 * @param children - リンク内に表示する子要素
 * @param to - ナビゲーション先
 * @param action - ナビゲーションアクション
 * @param onPress - 押下ハンドラ
 * @param onLongPress - 長押しハンドラ
 * @param download - ダウンロード属性（Web専用）
 * @param shouldProxy - プロキシ経由で開くか
 * @param overridePresentation - プレゼンテーションをオーバーライドするか
 * @param rest - その他のButtonプロパティ
 */
export function Link({
  children,
  to,
  action = 'push',
  onPress: outerOnPress,
  onLongPress: outerOnLongPress,
  download,
  shouldProxy,
  overridePresentation,
  ...rest
}: LinkProps) {
  // useLinkフックでリンクロジックを処理
  const {href, isExternal, onPress, onLongPress} = useLink({
    to,
    displayText: typeof children === 'string' ? children : '',
    action,
    onPress: outerOnPress,
    onLongPress: outerOnLongPress,
    shouldProxy: shouldProxy,
    overridePresentation,
  })

  return (
    <Button
      // Goユーザー向けの補足: スプレッド演算子 {...rest} で
      // 残りの全プロパティを展開してButtonに渡す
      {...rest}
      style={[a.justify_start, flatten(rest.style)]}
      role="link"                      // アクセシビリティロール
      accessibilityRole="link"         // ネイティブのアクセシビリティロール
      href={href}
      onPress={download ? undefined : onPress}  // ダウンロードの場合はonPressを無効化
      onLongPress={onLongPress}
      // Goユーザー向けの補足: web()関数はWeb専用のプロパティを返す
      // ネイティブでは無視される
      {...web({
        hrefAttrs: {
          target: download ? undefined : isExternal ? 'blank' : undefined,  // 外部リンクは新しいタブで開く
          rel: isExternal ? 'noopener noreferrer' : undefined,  // セキュリティ対策
          download,
        },
        dataSet: {
          // no underline, only `InlineLink` has underlines
          // 下線なし、`InlineLink`のみ下線を持つ
          noUnderline: '1',
        },
      })}>
      {children}
    </Button>
  )
}

/**
 * InlineLinkProps - インラインリンクのプロパティ型
 *
 * テキスト内に埋め込まれるリンク用のプロパティ定義
 *
 * Goユーザー向けの補足:
 * - Pick<T, K>: 型Tから特定のフィールドKのみを抽出
 */
export type InlineLinkProps = React.PropsWithChildren<
  BaseLinkProps &
    TextStyleProp &
    Pick<TextProps, 'selectable' | 'numberOfLines' | 'emoji'> &
    Pick<ButtonProps, 'label' | 'accessibilityHint'> & {
      disableUnderline?: boolean
      title?: TextProps['title']
      overridePresentation?: boolean
    }
>

/**
 * InlineLinkText - テキスト内に埋め込まれるリンクコンポーネント
 *
 * テキスト段落内で使用されるインラインリンク。
 * ホバー時に下線が表示され、プライマリカラーで表示される。
 *
 * @param children - リンクテキスト
 * @param to - ナビゲーション先
 * @param action - ナビゲーションアクション
 * @param disableMismatchWarning - ミスマッチ警告を無効化
 * @param style - 追加スタイル
 * @param onPress - 押下ハンドラ
 * @param onLongPress - 長押しハンドラ
 * @param download - ダウンロード属性
 * @param selectable - テキスト選択可能フラグ
 * @param label - アクセシビリティラベル
 * @param shareOnLongPress - 長押し時にシェア
 * @param disableUnderline - 下線を無効化
 * @param overridePresentation - プレゼンテーションをオーバーライド
 * @param shouldProxy - プロキシ経由で開く
 * @param rest - その他のTextプロパティ
 */
export function InlineLinkText({
  children,
  to,
  action = 'push',
  disableMismatchWarning,
  style,
  onPress: outerOnPress,
  onLongPress: outerOnLongPress,
  download,
  selectable,
  label,
  shareOnLongPress,
  disableUnderline,
  overridePresentation,
  shouldProxy,
  ...rest
}: InlineLinkProps) {
  const t = useTheme()  // テーマ取得
  const stringChildren = typeof children === 'string'  // 子要素が文字列かどうか
  // useLinkフックでリンクロジックを処理
  const {href, isExternal, onPress, onLongPress} = useLink({
    to,
    displayText: stringChildren ? children : '',
    action,
    disableMismatchWarning,
    onPress: outerOnPress,
    onLongPress: outerOnLongPress,
    shareOnLongPress,
    overridePresentation,
    shouldProxy: shouldProxy,
  })
  // インタラクション状態（ホバー等）を管理
  // Goユーザー向けの補足: 分割代入 {state, onIn, onOut} は Go にはない構文
  // JavaScriptでは複数の戻り値をオブジェクトで返し、必要なプロパティのみを抽出できる
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  // スタイルをフラット化（配列から単一オブジェクトへ）
  const flattenedStyle = flatten(style) || {}

  return (
    <Text
      selectable={selectable}
      accessibilityHint=""
      accessibilityLabel={label}
      {...rest}
      style={[
        {color: t.palette.primary_500},  // プライマリカラー
        // ホバー時かつ下線が無効化されていない場合、下線を表示
        hovered &&
          !disableUnderline && {
            ...web({
              outline: 0,
              textDecorationLine: 'underline',
              textDecorationColor:
                flattenedStyle.color ?? t.palette.primary_500,
            }),
          },
        flattenedStyle,
      ]}
      role="link"
      onPress={download ? undefined : onPress}
      onLongPress={onLongPress}
      onMouseEnter={onHoverIn}   // マウスホバー開始
      onMouseLeave={onHoverOut}  // マウスホバー終了
      accessibilityRole="link"
      href={href}
      {...web({
        hrefAttrs: {
          target: download ? undefined : isExternal ? 'blank' : undefined,
          rel: isExternal ? 'noopener noreferrer' : undefined,
          download,
        },
        dataSet: {
          // default to no underline, apply this ourselves
          // デフォルトでは下線なし、自分で適用する
          noUnderline: '1',
        },
      })}>
      {children}
    </Text>
  )
}

/**
 * SimpleInlineLinkText - react-navigationコンテキスト外で使用できるシンプルなインラインリンク
 *
 * A barebones version of `InlineLinkText`, for use outside a
 * `react-navigation` context.
 *
 * `InlineLinkText`の簡易版で、`react-navigation`コンテキスト外で使用する。
 * 常に外部リンクとして扱われ、Linking.openURLで開く。
 *
 * @param children - リンクテキスト
 * @param to - URL文字列（オブジェクトではなく文字列のみ）
 * @param style - 追加スタイル
 * @param download - ダウンロード属性
 * @param selectable - テキスト選択可能フラグ
 * @param label - アクセシビリティラベル
 * @param disableUnderline - 下線を無効化
 * @param shouldProxy - プロキシ経由で開く
 * @param rest - その他のTextプロパティ
 */
export function SimpleInlineLinkText({
  children,
  to,
  style,
  download,
  selectable,
  label,
  disableUnderline,
  shouldProxy,
  ...rest
}: Omit<
  InlineLinkProps,
  | 'to'
  | 'action'
  | 'disableMismatchWarning'
  | 'overridePresentation'
  | 'onPress'
  | 'onLongPress'
  | 'shareOnLongPress'
> & {
  to: string  // 文字列のみ（ルートオブジェクトは不可）
}) {
  const t = useTheme()
  // インタラクション状態（ホバー等）を管理
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const flattenedStyle = flatten(style) || {}
  const isExternal = isExternalUrl(to)  // 外部URLかどうかを判定

  // href の決定
  let href = to
  if (shouldProxy) {
    href = createProxiedUrl(href)  // プロキシ経由URLに変換
  }

  // 押下ハンドラ（常にLinking.openURLで開く）
  const onPress = () => {
    Linking.openURL(href)
  }

  return (
    <Text
      selectable={selectable}
      accessibilityHint=""
      accessibilityLabel={label}
      {...rest}
      style={[
        {color: t.palette.primary_500},
        hovered &&
          !disableUnderline && {
            ...web({
              outline: 0,
              textDecorationLine: 'underline',
              textDecorationColor:
                flattenedStyle.color ?? t.palette.primary_500,
            }),
          },
        flattenedStyle,
      ]}
      role="link"
      onPress={onPress}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      accessibilityRole="link"
      href={href}
      {...web({
        hrefAttrs: {
          target: download ? undefined : isExternal ? 'blank' : undefined,
          rel: isExternal ? 'noopener noreferrer' : undefined,
          download,
        },
        dataSet: {
          // default to no underline, apply this ourselves
          noUnderline: '1',
        },
      })}>
      {children}
    </Text>
  )
}

/**
 * WebOnlyInlineLinkText - Web版でのみリンクとして機能するコンポーネント
 *
 * Web版ではInlineLinkTextとして、ネイティブ版では通常のTextとして表示される。
 * プラットフォーム固有の動作が必要な場合に使用。
 *
 * @param children - リンクテキスト
 * @param to - ナビゲーション先
 * @param onPress - 押下ハンドラ
 * @param props - その他のInlineLinkプロパティ
 */
export function WebOnlyInlineLinkText({
  children,
  to,
  onPress,
  ...props
}: Omit<InlineLinkProps, 'onLongPress'>) {
  return isWeb ? (
    <InlineLinkText {...props} to={to} onPress={onPress}>
      {children}
    </InlineLinkText>
  ) : (
    <Text {...props}>{children}</Text>
  )
}

/**
 * createStaticClick - 静的な押下ハンドラを作成するユーティリティ
 *
 * Utility to create a static `onPress` handler for a `Link` that would otherwise link to a URI
 *
 * URIにリンクする代わりに、静的な`onPress`ハンドラを作成するユーティリティ。
 * リンクのように見えるが、実際にはナビゲーションせずにカスタム処理を実行する場合に使用。
 *
 * Example:
 *   `<Link {...createStaticClick(e => {...})} />`
 *
 * @param onPressHandler - 実行する押下ハンドラ
 * @returns toとonPressを含むオブジェクト
 */
export function createStaticClick(
  onPressHandler: Exclude<BaseLinkProps['onPress'], undefined>,
): {
  to: BaseLinkProps['to']
  onPress: Exclude<BaseLinkProps['onPress'], undefined>
} {
  return {
    to: '#',  // ダミーのURL
    onPress(e: GestureResponderEvent) {
      e.preventDefault()  // デフォルト動作を防止
      onPressHandler(e)   // カスタムハンドラを実行
      return false        // ナビゲーションをキャンセル
    },
  }
}

/**
 * createStaticClickIfUnmodified - 修飾されていないクリックの場合のみ静的ハンドラを実行
 *
 * Utility to create a static `onPress` handler for a `Link`, but only if the
 * click was not modified in some way e.g. `Cmd` or a middle click.
 *
 * On native, this behaves the same as `createStaticClick` because there are no
 * options to "modify" the click in this sense.
 *
 * クリックが何らかの方法で修飾されていない場合（例: Cmdや中クリック）のみ、
 * 静的な`onPress`ハンドラを作成するユーティリティ。
 *
 * ネイティブでは、この意味でクリックを「修飾」するオプションがないため、
 * `createStaticClick`と同じ動作をする。
 *
 * Example:
 *   `<Link {...createStaticClick(e => {...})} />`
 *
 * @param onPressHandler - 実行する押下ハンドラ
 * @returns onPressを含むオブジェクト
 */
export function createStaticClickIfUnmodified(
  onPressHandler: Exclude<BaseLinkProps['onPress'], undefined>,
): {onPress: Exclude<BaseLinkProps['onPress'], undefined>} {
  return {
    onPress(e: GestureResponderEvent) {
      // Webでないか、修飾されていないクリックの場合のみ実行
      if (!isWeb || !isModifiedClickEvent(e)) {
        e.preventDefault()
        onPressHandler(e)
        return false
      }
    },
  }
}

/**
 * isClickEventWithMetaKey - メタキーが押されているかを判定
 *
 * Determines if the click event has a meta key pressed, indicating the user
 * intends to deviate from default behavior.
 *
 * クリックイベントでメタキーが押されているかを判定する。
 * ユーザーがデフォルト動作から逸脱する意図があることを示す。
 *
 * @param e - ジェスチャーイベント
 * @returns メタキーが押されている場合true
 */
export function isClickEventWithMetaKey(e: GestureResponderEvent) {
  if (!isWeb) return false
  const event = e as unknown as MouseEvent
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey
}

/**
 * isClickTargetExternal - クリックターゲットが外部かを判定
 *
 * Determines if the web click target is anything other than `_self`
 *
 * Webクリックターゲットが`_self`以外かどうかを判定する。
 *
 * @param e - ジェスチャーイベント
 * @returns ターゲットが外部の場合true
 */
export function isClickTargetExternal(e: GestureResponderEvent) {
  if (!isWeb) return false
  const event = e as unknown as MouseEvent
  const el = event.currentTarget as HTMLAnchorElement
  return el && el.target && el.target !== '_self'
}

/**
 * isModifiedClickEvent - クリックイベントが修飾されているかを判定
 *
 * Determines if a click event has been modified in some way from its default
 * behavior, e.g. `Cmd` or a middle click.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
 *
 * クリックイベントがデフォルト動作から何らかの方法で修飾されているかを判定する。
 * 例: Cmdキーや中クリック。
 *
 * @param e - ジェスチャーイベント
 * @returns 修飾されている場合true
 */
export function isModifiedClickEvent(e: GestureResponderEvent): boolean {
  if (!isWeb) return false
  const event = e as unknown as MouseEvent
  const isPrimaryButton = event.button === 0  // 左クリック
  return (
    isClickEventWithMetaKey(e) || isClickTargetExternal(e) || !isPrimaryButton
  )
}

/**
 * shouldClickOpenNewTab - クリックで新しいタブを開くべきかを判定
 *
 * Determines if a click event has been modified in a way that should indiciate
 * that the user intends to open a new tab.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
 *
 * クリックイベントが、ユーザーが新しいタブを開く意図があることを示す方法で
 * 修飾されているかを判定する。
 *
 * @param e - ジェスチャーイベント
 * @returns 新しいタブで開くべき場合true
 */
export function shouldClickOpenNewTab(e: GestureResponderEvent) {
  if (!isWeb) return false
  const event = e as unknown as MouseEvent
  const isMiddleClick = isWeb && event.button === 1  // 中クリック
  return isClickEventWithMetaKey(e) || isClickTargetExternal(e) || isMiddleClick
}
