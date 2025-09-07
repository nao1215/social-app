// Reactのコアフックとユーティリティ - コンポーネント最適化とコンテキスト管理
import {forwardRef, memo, useContext, useMemo} from 'react'
// React Nativeの基本コンポーネントと型定義
import {StyleSheet, View, type ViewProps, type ViewStyle} from 'react-native'
import {type StyleProp} from 'react-native' // スタイルプロパティ型
// キーボード対応スクロールビュー - キーボード表示時のレイアウト調整
import {
  KeyboardAwareScrollView,        // キーボード対応スクロールビューコンポーネント
  type KeyboardAwareScrollViewProps, // そのプロパティ型
} from 'react-native-keyboard-controller'
// React Native Reanimated - 高性能アニメーションライブラリ
import Animated, {
  type AnimatedScrollViewProps, // アニメーション対応スクロールビューのプロパティ型
  useAnimatedProps,            // 動的プロパティ管理フック
} from 'react-native-reanimated'
// セーフエリア管理 - ノッチやステータスバーなどの安全領域を取得
import {useSafeAreaInsets} from 'react-native-safe-area-context'

// プラットフォーム検出 - Web環境かどうかの判定
import {isWeb} from '#/platform/detection'
// シェルレイアウト状態 - フッターの高さなどのグローバルレイアウト情報
import {useShellLayout} from '#/state/shell/shell-layout'
// デザインシステム - スタイル、ブレイクポイント、テーマ管理
import {
  atoms as a,              // アトミックスタイル
  useBreakpoints,          // ブレイクポイント取得フック
  useLayoutBreakpoints,    // レイアウト用ブレイクポイント取得フック
  useTheme,               // テーマ取得フック
  web,                    // Web用スタイルユーティリティ
} from '#/alf'
// ダイアログコンテキスト - ダイアログ内かどうかの情報取得
import {useDialogContext} from '#/components/Dialog'
// レイアウト定数 - 中央カラムとスクロールバーのオフセット値
import {CENTER_COLUMN_OFFSET, SCROLLBAR_OFFSET} from '#/components/Layout/const'
// スクロールバーオフセットコンテキスト - スクロールバーの位置情報を子コンポーネントで共有
import {ScrollbarOffsetContext} from '#/components/Layout/context'

// レイアウト定数をエクスポート - 他のコンポーネントで使用するため
export * from '#/components/Layout/const'
// Header関連コンポーネントを名前空間付きでエクスポート
export * as Header from '#/components/Layout/Header'

// Screenコンポーネントのプロパティ型定義
export type ScreenProps = React.ComponentProps<typeof View> & {
  style?: StyleProp<ViewStyle> // カスタムスタイル
  noInsetTop?: boolean        // 上部セーフエリアを無視するフラグ
}

/**
 * Outermost component of every screen
 * すべてのスクリーンの最外層コンポーネント
 */
export const Screen = memo(function Screen({
  style,      // カスタムスタイル
  noInsetTop, // 上部セーフエリア無視フラグ
  ...props    // その他のビュープロパティ
}: ScreenProps) {
  const {top} = useSafeAreaInsets() // 上部セーフエリアの高さを取得
  return (
    <>
      {/* Web環境でのみ中央ボーダーを表示 */}
      {isWeb && <WebCenterBorders />}
      <View
        style={[
          a.util_screen_outer,                        // スクリーン外側ユーティリティスタイル
          {paddingTop: noInsetTop ? 0 : top},         // 上部パディング（セーフエリア分）
          style                                       // カスタムスタイル
        ]}
        {...props} // その他のプロパティを展開
      />
    </>
  )
})

// Contentコンポーネントのプロパティ型定義
export type ContentProps = AnimatedScrollViewProps & {
  style?: StyleProp<ViewStyle>                // スクロールビューのスタイル
  contentContainerStyle?: StyleProp<ViewStyle> // コンテンツコンテナのスタイル
  ignoreTabletLayoutOffset?: boolean          // タブレットレイアウトオフセットを無視するフラグ
}

/**
 * Default scroll view for simple pages
 * シンプルなページ用のデフォルトスクロールビュー
 */
export const Content = memo(
  forwardRef<Animated.ScrollView, ContentProps>(function Content(
    {
      children,                   // 子要素
      style,                      // スクロールビュースタイル
      contentContainerStyle,      // コンテンツコンテナスタイル
      ignoreTabletLayoutOffset,   // タブレットオフセット無視フラグ
      ...props                    // その他のスクロールビュープロパティ
    },
    ref, // 参照オブジェクト
  ) {
    const t = useTheme()               // 現在のテーマ取得
    const {footerHeight} = useShellLayout() // シェルレイアウトからフッター高さを取得
    // スクロールインジケータの位置を動的に計算するアニメーションプロパティ
    const animatedProps = useAnimatedProps(() => {
      return {
        scrollIndicatorInsets: {
          bottom: footerHeight.get(), // フッター高さ分の下部マージン
          top: 0,                    // 上部マージン
          right: 1,                  // 右部マージン
        },
      } satisfies AnimatedScrollViewProps
    })

    return (
      <Animated.ScrollView
        ref={ref}   // 参照を転送
        id="content" // HTMLでの要素ID
        automaticallyAdjustsScrollIndicatorInsets={false} // 自動インジケータ調整を無効化
        indicatorStyle={t.scheme === 'dark' ? 'white' : 'black'} // テーマに応じたスクロールバー色
        // sets the scroll inset to the height of the footer
        // フッター高さに合わせてスクロールインセットを設定
        animatedProps={animatedProps}
        style={[scrollViewStyles.common, style]}         // 共通スタイルとカスタムスタイルを結合
        contentContainerStyle={[
          scrollViewStyles.contentContainer,            // 共通コンテンツコンテナスタイル
          contentContainerStyle,                        // カスタムコンテンツコンテナスタイル
        ]}
        {...props}> {/* その他のプロパティを展開 */}
        {/* Webでは中央揃え、ネイティブではそのまま表示 */}
        {isWeb ? (
          <Center ignoreTabletLayoutOffset={ignoreTabletLayoutOffset}>
            {/* @ts-expect-error web only -esb */}
            {children}
          </Center>
        ) : (
          children
        )}
      </Animated.ScrollView>
    )
  }),
)

// スクロールビュー用の共通スタイル定義
const scrollViewStyles = StyleSheet.create({
  common: {
    width: '100%', // 全幅を使用
  },
  contentContainer: {
    paddingBottom: 100, // 下部に十分なパディングを設定（スクロール領域確保）
  },
})

// キーボード対応コンテンツコンポーネントのプロパティ型定義
export type KeyboardAwareContentProps = KeyboardAwareScrollViewProps & {
  children: React.ReactNode                   // 子要素
  contentContainerStyle?: StyleProp<ViewStyle> // コンテンツコンテナスタイル
}

/**
 * Default scroll view for simple pages.
 * シンプルなページ用のデフォルトスクロールビュー。
 *
 * BE SURE TO TEST THIS WHEN USING, it's untested as of writing this comment.
 * 使用時は必ずテストしてください。このコメントを書いた時点では未テストです。
 */
export const KeyboardAwareContent = memo(function LayoutKeyboardAwareContent({
  children,              // 子要素
  style,                 // スクロールビュースタイル
  contentContainerStyle, // コンテンツコンテナスタイル
  ...props               // その他のキーボード対応スクロールビュープロパティ
}: KeyboardAwareContentProps) {
  return (
    <KeyboardAwareScrollView
      style={[scrollViewStyles.common, style]}         // 共通スタイルとカスタムスタイルを結合
      contentContainerStyle={[
        scrollViewStyles.contentContainer,             // 共通コンテンツコンテナスタイル
        contentContainerStyle,                          // カスタムコンテンツコンテナスタイル
      ]}
      keyboardShouldPersistTaps="handled"              // キーボード表示中でもタップを処理
      {...props}> {/* その他のプロパティを展開 */}
      {/* Webでは中央揃え、ネイティブではそのまま表示 */}
      {isWeb ? <Center>{children}</Center> : children}
    </KeyboardAwareScrollView>
  )
})

/**
 * Utility component to center content within the screen
 * スクリーン内でコンテンツを中央揃えするユーティリティコンポーネント
 */
export const Center = memo(function LayoutCenter({
  children,                 // 子要素
  style,                    // カスタムスタイル
  ignoreTabletLayoutOffset, // タブレットレイアウトオフセット無視フラグ
  ...props                  // その他のビュープロパティ
}: ViewProps & {ignoreTabletLayoutOffset?: boolean}) {
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext) // スクロールバーオフセットビュー内かどうか
  const {gtMobile} = useBreakpoints()                          // モバイル以上のサイズかどうか
  const {centerColumnOffset} = useLayoutBreakpoints()          // 中央カラムオフセットが有効かどうか
  const {isWithinDialog} = useDialogContext()                  // ダイアログ内かどうか
  const ctx = useMemo(() => ({isWithinOffsetView: true}), [])  // オフセットビュー内であることを示すコンテキスト
  return (
    <View
      style={[
        a.w_full,    // 全幅使用
        a.mx_auto,   // 横方向自動マージン（中央揃え）
        gtMobile && {
          maxWidth: 600, // モバイル以上では最大幅を600pxに制限
        },
        // オフセットビュー外では中央カラムとスクロールバーのオフセットを適用
        !isWithinOffsetView && {
          transform: [
            {
              // 中央カラムのオフセット計算
              translateX:
                centerColumnOffset &&           // 中央カラムオフセットが有効で
                !ignoreTabletLayoutOffset &&    // タブレットオフセットを無視しないで
                !isWithinDialog                 // ダイアログ内でない場合
                  ? CENTER_COLUMN_OFFSET        // 中央カラムオフセットを適用
                  : 0,                          // そうでなければオフセットなし
            },
            {translateX: web(SCROLLBAR_OFFSET) ?? 0}, // Webではスクロールバーオフセットを適用
          ],
        },
        style, // カスタムスタイル
      ]}
      {...props}> {/* その他のプロパティを展開 */}
      {/* スクロールバーオフセットコンテキストを子要素に提供 */}
      <ScrollbarOffsetContext.Provider value={ctx}>
        {children}
      </ScrollbarOffsetContext.Provider>
    </View>
  )
})

/**
 * Only used within `Layout.Screen`, not for reuse
 * `Layout.Screen`内でのみ使用、再利用用ではありません
 */
const WebCenterBorders = memo(function LayoutWebCenterBorders() {
  const t = useTheme()                        // 現在のテーマ取得
  const {gtMobile} = useBreakpoints()          // モバイル以上のサイズかどうか
  const {centerColumnOffset} = useLayoutBreakpoints() // 中央カラムオフセットが有効かどうか
  // モバイル以上の場合のみボーダーを表示
  return gtMobile ? (
    <View
      style={[
        a.fixed,                      // 固定位置
        a.inset_0,                    // 全面に配置
        a.border_l,                   // 左ボーダー
        a.border_r,                   // 右ボーダー
        t.atoms.border_contrast_low,  // 低コントラストボーダー色
        // Web用のスタイル設定
        web({
          width: 602,                   // ボーダーの幅（コンテンツ幅600px + ボーダー2px）
          left: '50%',                  // 左から50%の位置
          transform: [
            {translateX: '-50%'},       // 中央揃えのための基本オフセット
            {translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0}, // 中央カラムオフセット
            ...a.scrollbar_offset.transform, // スクロールバーオフセット
          ],
        }),
      ]}
    />
  ) : null // モバイルでは何も表示しない
})
