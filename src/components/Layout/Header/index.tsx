/**
 * @file ヘッダーレイアウトコンポーネント
 * @description アプリケーション全体で使用される画面ヘッダーのコンポーネント群
 *
 * このファイルには、以下のヘッダー関連コンポーネントが含まれます:
 * - Outer: ヘッダーの外側コンテナ
 * - Content: ヘッダーのコンテンツエリア（タイトルなど）
 * - Slot: 左右のボタンスロット
 * - BackButton: 戻るボタン
 * - MenuButton: メニュー（ドロワー）開閉ボタン
 * - TitleText: ヘッダータイトルテキスト
 * - SubtitleText: ヘッダーサブタイトルテキスト
 *
 * Goユーザー向け説明:
 * - これらのコンポーネントは、Goでいう構造体のようなもので、再利用可能なUI部品です
 * - propsはGoの関数引数に相当し、コンポーネントの動作をカスタマイズします
 */

// Reactのコアフック - コンテキスト作成、コールバック最適化、コンテキスト取得
import {createContext, useCallback, useContext} from 'react'
// React Nativeの基本コンポーネントと型定義
import {type GestureResponderEvent, Keyboard, View} from 'react-native'
// 国際化 - メッセージ定義とロケール管理
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// React Navigation - ナビゲーション操作用フック
import {useNavigation} from '@react-navigation/native'

// タッチ領域の拡張設定（30pxの余裕）- タップしやすくするため
import {HITSLOP_30} from '#/lib/constants'
// ナビゲーションの型定義
import {type NavigationProp} from '#/lib/routes/types'
// プラットフォーム検出 - iOS判定
import {isIOS} from '#/platform/detection'
// ドロワー状態管理 - ドロワーの開閉制御
import {useSetDrawerOpen} from '#/state/shell'
// デザインシステム - スタイル、ブレイクポイント、テーマ
import {
  atoms as a,              // アトミックスタイル
  platform,                // プラットフォーム別スタイル関数
  type TextStyleProp,      // テキストスタイルプロパティ型
  useBreakpoints,          // ブレイクポイント取得フック
  useGutters,              // ガッター（余白）スタイル取得フック
  useLayoutBreakpoints,    // レイアウト用ブレイクポイント取得フック
  useTheme,                // テーマ取得フック
  web,                     // Web専用スタイルユーティリティ
} from '#/alf'
// ボタンコンポーネント
import {Button, ButtonIcon, type ButtonProps} from '#/components/Button'
// アイコン - 戻る矢印
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
// アイコン - メニュー（ハンバーガーメニュー）
import {Menu_Stroke2_Corner0_Rounded as Menu} from '#/components/icons/Menu'
// レイアウト定数
import {
  BUTTON_VISUAL_ALIGNMENT_OFFSET, // ボタンの視覚的配置オフセット
  CENTER_COLUMN_OFFSET,           // 中央カラムオフセット
  HEADER_SLOT_SIZE,               // ヘッダースロットサイズ
  SCROLLBAR_OFFSET,               // スクロールバーオフセット
} from '#/components/Layout/const'
// スクロールバーオフセットコンテキスト
import {ScrollbarOffsetContext} from '#/components/Layout/context'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * ヘッダーの外側コンテナコンポーネント
 *
 * Goユーザー向け説明:
 * - コンポーネント: Goの関数に似ていますが、UIを返します
 * - children: 子要素を受け取るプロパティ（Goのinterface{}に似ています）
 * - optional parameters (?): Goのポインタ型に似ており、nilまたは値を取ります
 *
 * @param children - ヘッダー内に表示する子要素
 * @param noBottomBorder - 下部ボーダーを非表示にするフラグ
 * @param headerRef - ヘッダー要素への参照（DOMアクセス用）
 * @param sticky - スティッキー（固定）ヘッダーにするかどうか（デフォルト: true）
 */
export function Outer({
  children,
  noBottomBorder,
  headerRef,
  sticky = true,
}: {
  children: React.ReactNode
  noBottomBorder?: boolean
  headerRef?: React.MutableRefObject<View | null>
  sticky?: boolean
}) {
  const t = useTheme()               // 現在のテーマ取得
  const gutters = useGutters([0, 'base']) // ガッター（横方向の余白）を取得
  const {gtMobile} = useBreakpoints()     // モバイルより大きいブレイクポイントかどうか
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext) // スクロールバーオフセットビュー内か
  const {centerColumnOffset} = useLayoutBreakpoints() // 中央カラムオフセットが有効か

  return (
    <View
      ref={headerRef} // 外部から参照できるようにrefを設定
      style={[
        a.w_full,                     // 全幅
        !noBottomBorder && a.border_b, // 条件付き下部ボーダー
        a.flex_row,                   // 横並びレイアウト
        a.align_center,               // 垂直方向中央揃え
        a.gap_sm,                     // 小さいギャップ
        // スティッキーヘッダーの設定（Web専用）
        sticky && web([a.sticky, {top: 0}, a.z_10, t.atoms.bg]),
        gutters,                      // ガッター適用
        // プラットフォーム別の高さとパディング
        platform({
          native: [a.pb_xs, {minHeight: 48}], // ネイティブ: 最小高さ48px
          web: [a.py_xs, {minHeight: 52}],    // Web: 最小高さ52px
        }),
        t.atoms.border_contrast_low,  // 低コントラストボーダー色
        // モバイルより大きい画面では中央揃え、最大幅600px
        gtMobile && [a.mx_auto, {maxWidth: 600}],
        // オフセットビュー外では中央カラムとスクロールバーのオフセットを適用
        !isWithinOffsetView && {
          transform: [
            {translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0}, // 中央カラムオフセット
            {translateX: web(SCROLLBAR_OFFSET) ?? 0},                    // スクロールバーオフセット
          ],
        },
      ]}>
      {children}
    </View>
  )
}

/**
 * アライメント（配置）コンテキスト
 *
 * ヘッダーのコンテンツを、プラットフォーム標準の配置にするか、
 * 常に左揃えにするかを子コンポーネントに伝えるためのコンテキストです。
 *
 * - 'platform': プラットフォームのデフォルト（iOSは中央、Androidは左）
 * - 'left': 常に左揃え
 */
const AlignmentContext = createContext<'platform' | 'left'>('platform')
AlignmentContext.displayName = 'AlignmentContext'

/**
 * ヘッダーのコンテンツエリアコンポーネント
 *
 * ヘッダーの中央部分を占め、タイトルやサブタイトルを表示します。
 * プラットフォームに応じて、中央揃えまたは左揃えにします。
 *
 * @param children - コンテンツエリアに表示する子要素（タイトルなど）
 * @param align - テキストの配置方法（'platform' または 'left'）
 */
export function Content({
  children,
  align = 'platform',
}: {
  children?: React.ReactNode
  align?: 'platform' | 'left'
}) {
  return (
    <View
      style={[
        a.flex_1,                    // 残りのスペースを占める
        a.justify_center,            // 垂直方向中央揃え
        // iOSでプラットフォーム配置の場合は横方向も中央揃え
        isIOS && align === 'platform' && a.align_center,
        {minHeight: HEADER_SLOT_SIZE}, // 最小高さをスロットサイズに合わせる
      ]}>
      {/* アライメント情報を子コンポーネントに提供 */}
      <AlignmentContext.Provider value={align}>
        {children}
      </AlignmentContext.Provider>
    </View>
  )
}

/**
 * ヘッダーのスロットコンポーネント
 *
 * ヘッダーの左右に配置されるボタンなどのためのスロットです。
 * 固定幅（HEADER_SLOT_SIZE）を持ち、一貫した配置を実現します。
 *
 * @param children - スロット内に表示する子要素（ボタンなど）
 */
export function Slot({children}: {children?: React.ReactNode}) {
  return <View style={[a.z_50, {width: HEADER_SLOT_SIZE}]}>{children}</View>
}

/**
 * 戻るボタンコンポーネント
 *
 * Goユーザー向け説明:
 * - useCallback: Goでいうとクロージャに似ており、関数を再利用可能にします
 * - dependency array: この配列の値が変わったときのみ、関数が再生成されます
 *
 * 動作:
 * 1. カスタムonPress処理を実行（提供されている場合）
 * 2. event.defaultPreventedがtrueなら何もしない（カスタム処理で阻止された）
 * 3. 戻れる履歴があればgoBack()で戻る
 * 4. 戻れない場合はHomeに遷移
 *
 * @param onPress - カスタムプレスハンドラ（オプション）
 * @param style - カスタムスタイル（オプション）
 * @param props - その他のボタンプロパティ
 */
export function BackButton({onPress, style, ...props}: Partial<ButtonProps>) {
  const {_} = useLingui()                       // 国際化関数の取得
  const navigation = useNavigation<NavigationProp>() // ナビゲーションオブジェクト取得

  /**
   * 戻るボタンのプレスハンドラ
   *
   * Goユーザー向け説明:
   * - useCallback: この関数を依存配列の値が変わらない限り再生成しません
   * - これにより、不要な再レンダリングを防ぎます
   */
  const onPressBack = useCallback(
    (evt: GestureResponderEvent) => {
      // カスタムハンドラを呼び出す（提供されている場合）
      onPress?.(evt)
      // カスタムハンドラでイベントが阻止された場合は何もしない
      if (evt.defaultPrevented) return
      // 戻れる履歴がある場合は前の画面に戻る
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        // 戻れない場合はホーム画面に遷移
        navigation.navigate('Home')
      }
    },
    [onPress, navigation], // これらが変わったときのみ関数を再生成
  )

  return (
    <Slot>
      <Button
        label={_(msg`Go back`)}         // アクセシビリティラベル（スクリーンリーダー用）
        size="small"                    // 小サイズボタン
        variant="ghost"                 // ゴースト（背景なし）バリアント
        color="secondary"               // セカンダリーカラー
        shape="square"                  // 正方形
        onPress={onPressBack}           // プレスハンドラ
        hitSlop={HITSLOP_30}            // タップ領域を30px拡張
        style={[
          // 視覚的な配置調整のため左マージンを負の値に
          {marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET},
          a.bg_transparent,             // 背景を透明に
          style,                        // カスタムスタイル
        ]}
        {...props}> {/* その他のプロパティを展開 */}
        <ButtonIcon icon={ArrowLeft} size="lg" />
      </Button>
    </Slot>
  )
}

/**
 * メニュー（ドロワー）ボタンコンポーネント
 *
 * モバイルサイズでのみ表示され、ドロワーメニューを開くためのボタンです。
 * モバイルより大きい画面では、サイドバーが常時表示されるため不要です。
 *
 * 動作:
 * 1. ボタンを押すとキーボードを閉じる
 * 2. ドロワーを開く
 */
export function MenuButton() {
  const {_} = useLingui()                  // 国際化関数の取得
  const setDrawerOpen = useSetDrawerOpen() // ドロワー状態設定関数
  const {gtMobile} = useBreakpoints()      // モバイルより大きいブレイクポイントか

  /**
   * メニューボタンのプレスハンドラ
   */
  const onPress = useCallback(() => {
    Keyboard.dismiss()      // キーボードを閉じる
    setDrawerOpen(true)     // ドロワーを開く
  }, [setDrawerOpen])

  // モバイルより大きい画面では何も表示しない
  return gtMobile ? null : (
    <Slot>
      <Button
        label={_(msg`Open drawer menu`)} // アクセシビリティラベル
        size="small"
        variant="ghost"
        color="secondary"
        shape="square"
        onPress={onPress}
        hitSlop={HITSLOP_30}
        style={[{marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET}]}>
        <ButtonIcon icon={Menu} size="lg" />
      </Button>
    </Slot>
  )
}

/**
 * ヘッダータイトルテキストコンポーネント
 *
 * ヘッダーのメインタイトルを表示します。
 * プラットフォームとアライメント設定に応じて、配置が変わります。
 *
 * @param children - タイトルテキスト
 * @param style - カスタムスタイル
 */
export function TitleText({
  children,
  style,
}: {children: React.ReactNode} & TextStyleProp) {
  const {gtMobile} = useBreakpoints()          // モバイルより大きいブレイクポイントか
  const align = useContext(AlignmentContext)   // 親のアライメント設定を取得

  return (
    <Text
      style={[
        a.text_lg,                    // 大きいテキストサイズ
        a.font_heavy,                 // 太字フォント
        a.leading_tight,              // タイトな行間
        // iOSでプラットフォーム配置の場合は中央揃え
        isIOS && align === 'platform' && a.text_center,
        // モバイルより大きい画面ではさらに大きいサイズ
        gtMobile && a.text_xl,
        style,                        // カスタムスタイル
      ]}
      numberOfLines={2}               // 最大2行
      emoji>                          {/* 絵文字サポート */}
      {children}
    </Text>
  )
}

/**
 * ヘッダーサブタイトルテキストコンポーネント
 *
 * ヘッダーのサブタイトルや補足情報を表示します。
 * タイトルより小さく、控えめな色で表示されます。
 *
 * @param children - サブタイトルテキスト
 */
export function SubtitleText({children}: {children: React.ReactNode}) {
  const t = useTheme()                         // テーマ取得
  const align = useContext(AlignmentContext)   // 親のアライメント設定を取得

  return (
    <Text
      style={[
        a.text_sm,                    // 小さいテキストサイズ
        a.leading_snug,               // 詰まった行間
        // iOSでプラットフォーム配置の場合は中央揃え
        isIOS && align === 'platform' && a.text_center,
        t.atoms.text_contrast_medium, // 中程度のコントラストテキスト色
      ]}
      numberOfLines={2}>              {/* 最大2行 */}
      {children}
    </Text>
  )
}
