/**
 * @file レイアウトコンポーネント
 * @description アプリケーション全体のレイアウトシステムを提供するコンポーネント群
 *
 * このファイルには、以下のコンポーネントが含まれます:
 * - Screen: すべての画面の最外層コンテナ
 * - Content: デフォルトのスクロール可能なコンテンツエリア
 * - KeyboardAwareContent: キーボード対応スクロールビュー
 * - Center: コンテンツを中央揃えするユーティリティ
 * - WebCenterBorders: Web専用の中央ボーダー
 *
 * Goユーザー向け説明:
 * - React Component: Goの関数に似ていますが、UIを返します
 * - Props: Goの関数引数に相当し、コンポーネントの動作をカスタマイズします
 * - Hooks: Reactの特殊な関数で、状態管理や副作用の実行などを行います
 */

/**
 * Reactのコアフックとユーティリティ - コンポーネント最適化とコンテキスト管理
 *
 * Goユーザー向け説明:
 * - forwardRef: 親コンポーネントが子コンポーネントのDOM要素にアクセスできるようにします
 * - memo: propsが変わらない限りコンポーネントを再レンダリングしません（Goのキャッシュに似ています）
 * - useContext: コンテキストから値を取得します（Goのcontext.Valueに似ています）
 * - useMemo: 計算結果をメモ化します（Goのsync.Onceに似ています）
 */
import {forwardRef, memo, useContext, useMemo} from 'react'

/**
 * React Nativeの基本コンポーネントと型定義
 *
 * Goユーザー向け説明:
 * - StyleSheet: スタイル定義を最適化するユーティリティ（Goの定数定義に似ています）
 * - View: HTMLのdivに相当する基本コンテナコンポーネント
 * - ViewProps: Viewコンポーネントのプロパティ型定義
 * - ViewStyle: ビューのスタイル型定義
 * - StyleProp: スタイルプロパティの型定義（配列、オブジェクト、undefinedを受け入れます）
 */
import {StyleSheet, View, type ViewProps, type ViewStyle} from 'react-native'
import {type StyleProp} from 'react-native'

/**
 * キーボード対応スクロールビュー - キーボード表示時のレイアウト調整
 *
 * Goユーザー向け説明:
 * - モバイルでキーボードが表示されると、画面の一部が隠れてしまいます
 * - このコンポーネントは、キーボードが表示されたときに自動的にスクロールして、
 *   フォーカスされた入力フィールドを見えるようにします
 */
import {
  KeyboardAwareScrollView,        // キーボード対応スクロールビューコンポーネント
  type KeyboardAwareScrollViewProps, // そのプロパティ型
} from 'react-native-keyboard-controller'

/**
 * React Native Reanimated - 高性能アニメーションライブラリ
 *
 * Goユーザー向け説明:
 * - Animated: アニメーション可能なコンポーネント（View, ScrollViewなど）を提供
 * - useAnimatedProps: プロパティをアニメーション化するフック
 * - UIスレッドで実行されるため、JavaScriptスレッドをブロックせず滑らかなアニメーションを実現
 * - 60FPS以上のパフォーマンスを維持できます
 */
import Animated, {
  type AnimatedScrollViewProps, // アニメーション対応スクロールビューのプロパティ型
  useAnimatedProps,            // 動的プロパティ管理フック
} from 'react-native-reanimated'

/**
 * セーフエリア管理 - ノッチやステータスバーなどの安全領域を取得
 *
 * Goユーザー向け説明:
 * - 現代のスマートフォンには、画面上部にノッチ（切り欠き）やステータスバーがあります
 * - useSafeAreaInsets: これらの領域を避けるための余白（insets）を取得します
 * - これにより、コンテンツが画面の見えない部分に配置されるのを防ぎます
 */
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
 *
 * Goユーザー向け説明:
 * - memo: このコンポーネントは最適化されており、propsが変わらない限り再レンダリングされません
 * - これはGoでキャッシュされた結果を返すのに似ています
 *
 * 動作:
 * 1. セーフエリアの上部余白を取得
 * 2. Web環境では中央ボーダーを追加
 * 3. すべての画面に共通のスタイルを適用
 *
 * @param style - カスタムスタイル（オプション）
 * @param noInsetTop - 上部セーフエリアを無視するフラグ（オプション）
 * @param props - その他のViewプロパティ
 */
export const Screen = memo(function Screen({
  style,      // カスタムスタイル
  noInsetTop, // 上部セーフエリア無視フラグ
  ...props    // その他のビュープロパティ
}: ScreenProps) {
  /**
   * useSafeAreaInsets: セーフエリアの余白を取得するフック
   *
   * Goユーザー向け説明:
   * - このフックは画面の安全領域（ノッチやステータスバーを避ける領域）の寸法を返します
   * - top: 上部の余白（ステータスバーやノッチの高さ）
   * - bottom: 下部の余白（ホームインジケーターの高さ）
   * - left/right: 横方向の余白（縁が丸い画面用）
   */
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
 *
 * Goユーザー向け説明:
 * - memo: Goでいうキャッシュに似ており、propsが変わらない限り再レンダリングを防ぎます
 * - forwardRef: 親コンポーネントがこのコンポーネントのDOM要素にアクセスできるようにします
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
    ref, // 参照オブジェクト - Goのポインタに似ており、コンポーネントのインスタンスを指します
  ) {
    const t = useTheme()               // 現在のテーマ取得
    const {footerHeight} = useShellLayout() // シェルレイアウトからフッター高さを取得

    /**
     * スクロールインジケータの位置を動的に計算するアニメーションプロパティ
     *
     * Goユーザー向け説明:
     * - useAnimatedProps: React Native Reanimatedのフックで、アニメーション可能なプロパティを定義
     * - このフックはUIスレッドで実行され、JavaScriptスレッドをブロックせずに滑らかなアニメーションを実現
     * - footerHeight.get(): Reanimatedの共有値から現在の値を取得
     * - 戻り値: スクロールバーの位置を動的に調整するプロパティオブジェクト
     */
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
        // その他のプロパティを展開
        {...props}>
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

/**
 * スクロールビュー用の共通スタイル定義
 *
 * Goユーザー向け説明:
 * - StyleSheet.create: スタイルオブジェクトを最適化して作成します
 * - これはGoの定数定義に似ており、一度作成されたスタイルは再利用されます
 * - パフォーマンス向上のため、スタイルはコンポーネント外で定義します
 */
const scrollViewStyles = StyleSheet.create({
  /**
   * スクロールビュー自体のスタイル
   */
  common: {
    width: '100%', // 全幅を使用
  },
  /**
   * スクロールビューの内部コンテンツコンテナのスタイル
   *
   * 注意: ScrollViewには2つのスタイルプロパティがあります:
   * - style: ScrollView自体のスタイル（外側のコンテナ）
   * - contentContainerStyle: スクロール可能なコンテンツのスタイル（内側のコンテンツ）
   */
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
 * キーボードが表示されたときに、フォーカスされた入力フィールドを
 * 自動的に表示領域内にスクロールします。
 *
 * Goユーザー向け説明:
 * - このコンポーネントは、フォーム入力など、キーボードを使用する画面で使用します
 * - キーボードが入力フィールドを隠さないように自動調整します
 *
 * BE SURE TO TEST THIS WHEN USING, it's untested as of writing this comment.
 * 使用時は必ずテストしてください。このコメントを書いた時点では未テストです。
 *
 * @param children - スクロールビュー内に表示する子要素
 * @param style - スクロールビューのスタイル
 * @param contentContainerStyle - コンテンツコンテナのスタイル
 * @param props - その他のキーボード対応スクロールビュープロパティ
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
      /**
       * keyboardShouldPersistTaps: キーボード表示中のタップ動作を制御
       * - "handled": タップ可能な要素（ボタンなど）のタップを処理し、それ以外はキーボードを閉じる
       * - これにより、キーボード表示中でもボタンを押すことができます
       */
      keyboardShouldPersistTaps="handled"
      {...props}> {/* その他のプロパティを展開 */}
      {/* Webでは中央揃え、ネイティブではそのまま表示 */}
      {isWeb ? <Center>{children}</Center> : children}
    </KeyboardAwareScrollView>
  )
})

/**
 * Utility component to center content within the screen
 * スクリーン内でコンテンツを中央揃えするユーティリティコンポーネント
 *
 * Goユーザー向け説明:
 * - memo: コンポーネントの最適化に使用。propsが変わらない限り再レンダリングしません
 */
export const Center = memo(function LayoutCenter({
  children,                 // 子要素
  style,                    // カスタムスタイル
  ignoreTabletLayoutOffset, // タブレットレイアウトオフセット無視フラグ
  ...props                  // その他のビュープロパティ
}: ViewProps & {ignoreTabletLayoutOffset?: boolean}) {
  /**
   * useContext: Reactコンテキストから値を取得するフック
   *
   * Goユーザー向け説明:
   * - Goのcontext.Valueに似ており、コンポーネントツリー全体で共有される値を取得
   * - プロパティを何層も経由せずに、深い階層のコンポーネントに値を渡せます
   */
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext) // スクロールバーオフセットビュー内かどうか
  const {gtMobile} = useBreakpoints()                          // モバイル以上のサイズかどうか
  const {centerColumnOffset} = useLayoutBreakpoints()          // 中央カラムオフセットが有効かどうか
  const {isWithinDialog} = useDialogContext()                  // ダイアログ内かどうか

  /**
   * useMemo: 計算結果をメモ化（キャッシュ）するフック
   *
   * Goユーザー向け説明:
   * - Goのsync.Onceに似ており、依存配列の値が変わらない限り再計算しません
   * - 空の依存配列[]は、コンポーネントの初回レンダリング時のみ実行されることを意味します
   * - この例では、常に同じコンテキストオブジェクトを返すため、子コンポーネントの不要な再レンダリングを防ぎます
   */
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
 *
 * Web専用: 中央カラムの左右に縦のボーダーを表示します
 *
 * Goユーザー向け説明:
 * - このコンポーネントは、デスクトップブラウザで見たときに、
 *   コンテンツエリアの境界を視覚的に示すために使用されます
 * - モバイルサイズでは表示されません（全幅を使用するため）
 *
 * 動作:
 * 1. モバイルより大きい画面でのみ表示
 * 2. 画面中央に602pxの幅（コンテンツ600px + ボーダー2px）で配置
 * 3. 中央カラムオフセットとスクロールバーオフセットを考慮して位置調整
 */
const WebCenterBorders = memo(function LayoutWebCenterBorders() {
  const t = useTheme()                        // 現在のテーマ取得
  const {gtMobile} = useBreakpoints()          // モバイル以上のサイズかどうか
  const {centerColumnOffset} = useLayoutBreakpoints() // 中央カラムオフセットが有効かどうか

  // モバイル以上の場合のみボーダーを表示
  return gtMobile ? (
    <View
      style={[
        a.fixed,                      // 固定位置（スクロールしても動かない）
        a.inset_0,                    // 全面に配置（top: 0, right: 0, bottom: 0, left: 0）
        a.border_l,                   // 左ボーダー
        a.border_r,                   // 右ボーダー
        t.atoms.border_contrast_low,  // 低コントラストボーダー色（目立ちすぎないように）
        // Web用のスタイル設定
        web({
          width: 602,                   // ボーダーの幅（コンテンツ幅600px + ボーダー2px）
          left: '50%',                  // 左から50%の位置（画面の中央）
          /**
           * transform: 位置調整の配列
           *
           * Goユーザー向け説明:
           * - transformは要素の位置や回転、拡大縮小などを変更します
           * - 複数のtransformを配列で指定すると、順番に適用されます
           */
          transform: [
            {translateX: '-50%'},       // 中央揃えのための基本オフセット（要素自体の幅の50%分左にずらす）
            {translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0}, // 中央カラムオフセット（タブレット用）
            ...a.scrollbar_offset.transform, // スクロールバーオフセット（スクロールバー分の調整）
          ],
        }),
      ]}
    />
  ) : null // モバイルでは何も表示しない
})
