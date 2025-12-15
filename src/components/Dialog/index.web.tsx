/**
 * @file Dialog Web版実装ファイル
 * @description Web プラットフォーム専用のダイアログコンポーネント
 *
 * このファイルはWebブラウザ向けの最適化されたダイアログを提供します。
 * ネイティブ版（iOS/Android）とは異なり、以下の特徴があります：
 * - モーダルオーバーレイとして表示
 * - Radix UIのアクセシビリティ機能を使用
 * - キーボードフォーカストラップ機能
 * - スクロールバー無効化
 *
 * プラットフォーム固有ファイル：
 * - index.tsx: ネイティブ版（iOS/Android）
 * - index.web.tsx: Web版（このファイル）
 *
 * Go言語との対比：
 * - ファイル拡張子による分岐: Goのビルドタグ（//go:build web）に相当
 * - React Portal: DOMツリーの別の場所にレンダリング（Goでは直接対応なし）
 */

// Reactコアフック - useImperativeHandleで外部APIを公開
import React, {useImperativeHandle} from 'react'
// React Native基本コンポーネントと型定義
import {
  FlatList,                    // リスト表示コンポーネント（仮想化対応）
  type FlatListProps,          // FlatListのプロパティ型
  type GestureResponderEvent,  // タッチイベント型
  type StyleProp,              // スタイルプロパティ型
  TouchableWithoutFeedback,    // フィードバックなしのタッチ可能コンポーネント
  View,                        // 基本ビューコンポーネント
  type ViewStyle,              // ビュースタイル型
} from 'react-native'
// Lingui国際化ライブラリ - 翻訳メッセージ処理
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// Radix UI - アクセシビリティライブラリ（Web専用）
import {DismissableLayer, FocusGuards, FocusScope} from 'radix-ui/internal'
// スクロールバー削除ライブラリ - ダイアログ表示中はページスクロール無効化
import {RemoveScrollBar} from 'react-remove-scroll-bar'

// プロジェクト内部モジュール
import {logger} from '#/logger'                              // ロガーユーティリティ
import {useA11y} from '#/state/a11y'                        // アクセシビリティ設定フック
import {useDialogStateControlContext} from '#/state/dialogs' // ダイアログ状態管理
import {atoms as a, flatten, useBreakpoints, useTheme, web} from '#/alf' // デザインシステム
import {Button, ButtonIcon} from '#/components/Button'       // ボタンコンポーネント
import {Context} from '#/components/Dialog/context'          // ダイアログコンテキスト
import {
  type DialogControlProps,
  type DialogInnerProps,
  type DialogOuterProps,
} from '#/components/Dialog/types'                           // ダイアログ型定義
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times' // 閉じるアイコン
import {Portal} from '#/components/Portal'                   // Portalコンポーネント（DOMツリー外に描画）

// 共通機能をエクスポート（ネイティブ版と同じAPI提供）
export {useDialogContext, useDialogControl} from '#/components/Dialog/context'
export * from '#/components/Dialog/shared'
export * from '#/components/Dialog/types'
export * from '#/components/Dialog/utils'
export {Input} from '#/components/forms/TextField'

/**
 * Webダイアログの高さ定数
 * 100vh - 10vhの上下パディング = 80vh
 *
 * Go言語との対比：
 * - const: Goの const と同じ（コンパイル時定数）
 */
export const WEB_DIALOG_HEIGHT = '80vh'

/**
 * イベント伝播停止関数
 *
 * ダイアログ内のクリックがバックドロップに伝播するのを防ぎます。
 *
 * @param e - イベントオブジェクト
 *
 * Go言語との対比：
 * - any型: Goの interface{} に相当
 * - イベント伝播: Goでは明示的な処理が必要、自動伝播なし
 */
const stopPropagation = (e: any) => e.stopPropagation()

/**
 * デフォルト動作防止関数
 *
 * ブラウザのデフォルト動作（リンククリック等）を防ぎます。
 *
 * @param e - イベントオブジェクト
 */
const preventDefault = (e: any) => e.preventDefault()

/**
 * ダイアログ外側コンポーネント（Web版）
 *
 * Web専用のダイアログコンテナ。モーダルオーバーレイとして表示し、
 * 以下の機能を提供します：
 * - ページスクロール無効化
 * - 背景クリックで閉じる
 * - フォーカストラップ（キーボードフォーカスをダイアログ内に限定）
 * - Portalによる描画（DOMツリーのbody直下に配置）
 *
 * @param props - ダイアログ外側のプロパティ
 *
 * Go言語との対比：
 * - 関数コンポーネント: Goでは構造体とメソッドで表現
 * - React.PropsWithChildren: Goでは Children フィールドを含む構造体
 */
export function Outer({
  children,   // 子要素（ダイアログのコンテンツ）
  control,    // ダイアログ制御オブジェクト
  onClose,    // 閉じた時のコールバック
  webOptions, // Web専用オプション
}: React.PropsWithChildren<DialogOuterProps>) {
  /**
   * useLingui: 翻訳関数を取得するフック
   *
   * Go言語との対比：
   * - i18n: Goでは i18n.T(ctx, "key") のような関数で実現
   * - _関数: 慣例的な翻訳関数名（短く書けるため）
   */
  const {_} = useLingui()

  /**
   * useBreakpoints: レスポンシブブレークポイント取得フック
   *
   * gtMobile: モバイルより大きい画面かどうか（タブレット/デスクトップ）
   *
   * Go言語との対比：
   * - ブレークポイント: Goではウィンドウサイズを直接判定
   *   ```go
   *   gtMobile := windowWidth > 768
   *   ```
   */
  const {gtMobile} = useBreakpoints()

  /**
   * useState: ダイアログの開閉状態管理
   *
   * Go言語との対比：
   * - useState: Goでは構造体フィールドで状態管理
   *   ```go
   *   type Outer struct {
   *       isOpen bool
   *   }
   *   ```
   * - 初期値false: ダイアログは初期状態で閉じている
   */
  const [isOpen, setIsOpen] = React.useState(false)

  /**
   * ダイアログ状態制御コンテキスト取得
   *
   * グローバルなダイアログ状態を管理（複数ダイアログの同時管理）
   */
  const {setDialogIsOpen} = useDialogStateControlContext()

  /**
   * ダイアログを開く関数
   *
   * useCallback: 関数をメモ化（不要な再作成を防ぐ）
   *
   * Go言語との対比：
   * - useCallback: Goではメソッドとして定義
   *   ```go
   *   func (o *Outer) Open() {
   *       o.setDialogIsOpen(o.control.ID, true)
   *       o.isOpen = true
   *   }
   *   ```
   */
  const open = React.useCallback(() => {
    setDialogIsOpen(control.id, true) // グローバル状態更新
    setIsOpen(true)                   // ローカル状態更新
  }, [setIsOpen, setDialogIsOpen, control.id])

  /**
   * ダイアログを閉じる関数
   *
   * @param cb - 閉じた後に実行するコールバック（オプション）
   *
   * Go言語との対比：
   * - コールバック処理: Goでは defer や明示的な関数呼び出し
   *   ```go
   *   func (o *Outer) Close(cb func()) {
   *       defer func() {
   *           if cb != nil {
   *               cb()
   *           }
   *       }()
   *       o.setDialogIsOpen(o.control.ID, false)
   *       o.isOpen = false
   *   }
   *   ```
   */
  const close = React.useCallback<DialogControlProps['close']>(
    cb => {
      setDialogIsOpen(control.id, false) // グローバル状態更新
      setIsOpen(false)                   // ローカル状態更新

      try {
        if (cb && typeof cb === 'function') {
          /**
           * setTimeout: コールバックを非同期実行
           *
           * このタイムアウトにより、コールバックがネイティブ版と同じタイミングで
           * 実行されることを保証します。つまり：
           * console.log('Step 1') -> close(() => console.log('Step 3')) -> console.log('Step 2')
           * これは常に 'Step 1', 'Step 2', 'Step 3' の順で出力されます。
           * タイムアウトがないと 'Step 1', 'Step 3', 'Step 2' の順になります。
           *
           * Go言語との対比：
           * - setTimeout: Goの goroutine と time.AfterFunc で実現
           *   ```go
           *   go func() {
           *       time.Sleep(0)
           *       cb()
           *   }()
           *   ```
           */
          setTimeout(cb)
        }
      } catch (e: any) {
        // コールバック実行エラーをログ出力
        logger.error(`Dialog closeCallback failed`, {
          message: e.message,
        })
      }

      // 外部から渡された閉じるコールバックを実行
      onClose?.()
    },
    [control.id, onClose, setDialogIsOpen],
  )

  /**
   * 背景クリック時のハンドラー
   *
   * ダイアログの背景（オーバーレイ）をクリックした時の処理。
   * カスタムハンドラーが指定されていればそれを実行、なければ閉じる。
   *
   * @param e - ジェスチャーイベント
   *
   * Go言語との対比：
   * - async関数: Goでは通常の関数として実装
   *   ```go
   *   func (o *Outer) HandleBackgroundPress(e GestureResponderEvent) {
   *       if o.webOptions != nil && o.webOptions.OnBackgroundPress != nil {
   *           o.webOptions.OnBackgroundPress(e)
   *       } else {
   *           o.Close(nil)
   *       }
   *   }
   *   ```
   * - 三項演算子(? :): Goでは if-else で表現
   */
  const handleBackgroundPress = React.useCallback(
    async (e: GestureResponderEvent) => {
      webOptions?.onBackgroundPress ? webOptions.onBackgroundPress(e) : close()
    },
    [webOptions, close],
  )

  /**
   * useImperativeHandle: 外部APIの公開
   *
   * controlの参照を通じて、外部からopen/closeメソッドを呼び出せるようにします。
   *
   * Go言語との対比：
   * - useImperativeHandle: Goでは公開メソッドとして定義
   *   ```go
   *   type DialogControl struct {
   *       ref *OuterMethods
   *   }
   *
   *   type OuterMethods struct {
   *       Open  func()
   *       Close func(func())
   *   }
   *   ```
   */
  useImperativeHandle(
    control.ref,
    () => ({
      open,
      close,
    }),
    [close, open],
  )

  /**
   * useMemo: Context値のメモ化
   *
   * Context値を計算してキャッシュ。依存配列の値が変わらない限り
   * 同じオブジェクトを返すため、不要な再レンダリングを防ぎます。
   *
   * Go言語との対比：
   * - useMemo: Goでは sync.Once やキャッシュ変数で実現
   *   ```go
   *   var (
   *       context     *DialogContext
   *       contextOnce sync.Once
   *   )
   *
   *   func (o *Outer) GetContext() *DialogContext {
   *       contextOnce.Do(func() {
   *           context = &DialogContext{
   *               Close: o.Close,
   *               // ...
   *           }
   *       })
   *       return context
   *   }
   *   ```
   */
  const context = React.useMemo(
    () => ({
      close,
      isNativeDialog: false,        // Web版なのでfalse
      nativeSnapPoint: 0,            // Web版ではスナップポイント不使用
      disableDrag: false,            // Web版ではドラッグ不使用
      setDisableDrag: () => {},      // 空関数（何もしない）
      isWithinDialog: true,          // ダイアログ内であることを示す
    }),
    [close],
  )

  /**
   * JSXレンダリング
   *
   * フラグメント(<></>): 複数要素を返す際の親要素
   * - Go: スライスで複数要素を返す []Node{...} に相当
   */
  return (
    <>
      {/* ダイアログが開いている場合のみレンダリング */}
      {isOpen && (
        /**
         * Portal: DOMツリーの別の場所（通常はbody直下）にレンダリング
         *
         * Go言語との対比：
         * - Portal: Goには直接対応する概念なし
         * - 通常のレンダリングツリーとは別の場所に描画する特殊な機能
         * - モーダルやツールチップなどz-index問題を回避するために使用
         */
        <Portal>
          <Context.Provider value={context}>
            {/* スクロールバーを削除（ダイアログ表示中はページスクロール無効） */}
            <RemoveScrollBar />
            {/**
             * TouchableWithoutFeedback: フィードバックなしのタッチ可能領域
             * 背景全体をタッチ可能にし、クリックで閉じる動作を実現
             *
             * Go言語との対比：
             * - イベントハンドラー: Goでは onClick などのコールバック
             *   ```go
             *   type TouchableProps struct {
             *       OnPress func(GestureResponderEvent)
             *   }
             *   ```
             */}
            <TouchableWithoutFeedback
              accessibilityHint={undefined}
              accessibilityLabel={_(msg`Close active dialog`)} // アクセシビリティラベル
              onPress={handleBackgroundPress}> {/* 背景クリックでダイアログを閉じる */}
              <View
                style={[
                  web(a.fixed),     // Web専用: 固定位置指定
                  a.inset_0,        // 上下左右0（全画面）
                  a.z_10,           // z-index: 10（前面に表示）
                  a.px_xl,          // 左右パディング
                  // 中央揃えオプションが有効な場合、垂直方向中央揃え
                  webOptions?.alignCenter ? a.justify_center : undefined,
                  a.align_center,   // 水平方向中央揃え
                  {
                    overflowY: 'auto', // 縦方向スクロール有効
                    // モバイルより大きい画面: 10vh、モバイル: a.pt_xlの値
                    paddingVertical: gtMobile ? '10vh' : a.pt_xl.paddingTop,
                  },
                ]}>
                {/* 背景オーバーレイ */}
                <Backdrop />
                {/**
                 * 中央揃えダイアログの配置調整用コンテナ
                 *
                 * これは中央揃えダイアログが画面上部からはみ出すのを防ぎ、
                 * スタックされたダイアログが相対的に整列して表示されるように
                 * "自然な"中央揃えを提供します。
                 */}
                <View
                  style={[
                    a.w_full,         // 幅100%
                    a.z_20,           // z-index: 20（オーバーレイより前面）
                    a.align_center,   // 中央揃え
                    web({minHeight: '60vh', position: 'static'}), // 最小高さ60vh、静的位置
                  ]}>
                  {/* ダイアログの実際のコンテンツ */}
                  {children}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Context.Provider>
        </Portal>
      )}
    </>
  )
}

/**
 * ダイアログ内側コンポーネント（Web版）
 *
 * ダイアログの実際のコンテンツ領域。
 * Radix UIのアクセシビリティ機能を統合：
 * - FocusScope: キーボードフォーカスをダイアログ内に限定
 * - DismissableLayer: Escキーで閉じる、外部クリックを検出
 * - FocusGuards: フォーカストラップの補助
 *
 * @param props - 内側コンポーネントのプロパティ
 *
 * Go言語との対比：
 * - 関数コンポーネント: Goでは構造体とRenderメソッド
 */
export function Inner({
  children,                // 子要素
  style,                   // カスタムスタイル
  label,                   // ダイアログラベル（アクセシビリティ用）
  accessibilityLabelledBy, // ラベル要素のID参照
  accessibilityDescribedBy,// 説明要素のID参照
  header,                  // ヘッダー要素
  contentContainerStyle,   // コンテンツコンテナスタイル
}: DialogInnerProps) {
  const t = useTheme()                         // テーマ取得
  const {close} = React.useContext(Context)    // Context から close 関数取得
  const {gtMobile} = useBreakpoints()          // ブレークポイント取得
  const {reduceMotionEnabled} = useA11y()      // アクセシビリティ設定（アニメーション削減）

  /**
   * useFocusGuards: フォーカスガードのセットアップ
   *
   * フォーカスがダイアログから外に出ないようにする補助機能
   * （Radix UIのアクセシビリティ機能の一部）
   */
  FocusGuards.useFocusGuards()

  /**
   * JSXレンダリング
   *
   * FocusScope.FocusScope: キーボードフォーカスをダイアログ内に限定
   * - loop: Tabキーでフォーカスがループ（最後の要素から最初に戻る）
   * - asChild: 子要素をそのまま使用（追加のdivを作らない）
   * - trapped: フォーカスをダイアログ内に閉じ込める
   */
  return (
    <FocusScope.FocusScope loop asChild trapped>
      <View
        role="dialog"                      // ARIAロール: ダイアログ
        aria-role="dialog"                 // 旧形式のARIAロール（互換性）
        aria-label={label}                 // ARIAラベル
        aria-labelledby={accessibilityLabelledBy}   // ラベル要素のID
        aria-describedby={accessibilityDescribedBy} // 説明要素のID
        // @ts-expect-error web only -prf
        onClick={stopPropagation}          // クリックイベントの伝播を停止
        onStartShouldSetResponder={_ => true} // タッチレスポンダーを常に設定
        onTouchEnd={stopPropagation}       // タッチ終了イベントの伝播を停止
        style={flatten([
          a.relative,      // 相対位置指定
          a.rounded_md,    // 中程度の角丸
          a.w_full,        // 幅100%
          a.border,        // ボーダー
          t.atoms.bg,      // 背景色（テーマ依存）
          {
            maxWidth: 600, // 最大幅600px
            borderColor: t.palette.contrast_200,        // ボーダー色
            shadowColor: t.palette.black,               // 影の色
            shadowOpacity: t.name === 'light' ? 0.1 : 0.4, // 影の不透明度（テーマ依存）
            shadowRadius: 30,                           // 影のぼかし半径
          },
          // アニメーション削減が無効な場合、ズームフェードインアニメーション
          !reduceMotionEnabled && a.zoom_fade_in,
          style, // カスタムスタイル
        ])}>
        {/**
         * DismissableLayer: ダイアログを閉じる動作を管理
         * - onInteractOutside: 外部クリック時の処理（デフォルト動作を防止）
         * - onFocusOutside: フォーカス外れ時の処理（デフォルト動作を防止）
         * - onDismiss: 閉じる動作時の処理（Escキーなど）
         *
         * Go言語との対比：
         * - イベントハンドラー: Goではコールバック関数フィールド
         *   ```go
         *   type DismissableLayer struct {
         *       OnInteractOutside func(Event)
         *       OnFocusOutside    func(Event)
         *       OnDismiss         func()
         *   }
         *   ```
         */}
        <DismissableLayer.DismissableLayer
          onInteractOutside={preventDefault} // 外部クリックのデフォルト動作を防止
          onFocusOutside={preventDefault}    // フォーカス外れのデフォルト動作を防止
          onDismiss={close}                  // 閉じる動作でcloseを実行
          style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
          {/* ヘッダー要素 */}
          {header}
          {/* コンテンツ領域 */}
          <View style={[gtMobile ? a.p_2xl : a.p_xl, contentContainerStyle]}>
            {children}
          </View>
        </DismissableLayer.DismissableLayer>
      </View>
    </FocusScope.FocusScope>
  )
}

/**
 * スクロール可能な内側コンポーネント（Web版）
 *
 * Web版ではScrollableInnerとInnerは同じ実装を使用します。
 * （ネイティブ版とは異なり、Web版では特別なスクロール処理が不要）
 *
 * Go言語との対比：
 * - 型エイリアス: Goの type ScrollableInner = Inner に相当
 */
export const ScrollableInner = Inner

/**
 * FlatList内側コンポーネント（Web版）
 *
 * ダイアログ内でFlatListを使用する際のコンポーネント。
 * Web版ではネイティブ版のような複雑な処理は不要で、
 * 単純にInnerコンポーネントでFlatListをラップします。
 *
 * @param props - FlatListとダイアログのプロパティを組み合わせた型
 *
 * Go言語との対比：
 * - React.forwardRef: Goでは参照を直接渡すことで実現
 *   ```go
 *   type InnerFlatList struct {
 *       ref *FlatList
 *       props FlatListProps
 *   }
 *   ```
 * - ジェネリック型パラメータ<any>: Goの interface{} に相当
 */
export const InnerFlatList = React.forwardRef<
  FlatList,
  FlatListProps<any> & {label: string} & {
    webInnerStyle?: StyleProp<ViewStyle>
    webInnerContentContainerStyle?: StyleProp<ViewStyle>
    footer?: React.ReactNode
  }
>(function InnerFlatList(
  {
    label,                             // ダイアログラベル
    style,                             // FlatListスタイル
    webInnerStyle,                     // Web専用内側スタイル
    webInnerContentContainerStyle,     // Web専用コンテンツコンテナスタイル
    footer,                            // フッター要素
    ...props                           // その他のFlatListプロパティ
  },
  ref, // FlatListへの参照
) {
  const {gtMobile} = useBreakpoints() // ブレークポイント取得

  /**
   * スプレッド演算子(...props): 残りのプロパティを展開
   *
   * Go言語との対比：
   * - スプレッド演算子: Goでは構造体の埋め込みやフィールドコピー
   *   ```go
   *   type InnerFlatListProps struct {
   *       Label string
   *       Style ViewStyle
   *       // ... 個別フィールド
   *       FlatListProps // 埋め込み
   *   }
   *   ```
   */
  return (
    <Inner
      label={label}
      style={[
        a.overflow_hidden,                     // オーバーフロー非表示
        a.px_0,                                // 左右パディング0（FlatListが独自管理）
        web({maxHeight: WEB_DIALOG_HEIGHT}),   // Web専用: 最大高さ80vh
        webInnerStyle,                         // Web専用スタイル
      ]}
      contentContainerStyle={[a.h_full, a.px_0, webInnerContentContainerStyle]}>
      <FlatList
        ref={ref}  // FlatListへの参照を転送
        style={[a.h_full, gtMobile ? a.px_2xl : a.px_xl, flatten(style)]}
        {...props} // その他のFlatListプロパティを展開
      />
      {/* フッター要素 */}
      {footer}
    </Inner>
  )
})

/**
 * FlatListフッターコンポーネント（Web版）
 *
 * FlatListの下部に固定表示されるフッター領域。
 * アクションボタンなどを配置するために使用されます。
 *
 * @param props - フッタープロパティ
 * @param props.children - フッター内容
 *
 * Go言語との対比：
 * - 関数コンポーネント: Goでは構造体とRenderメソッド
 */
export function FlatListFooter({children}: {children: React.ReactNode}) {
  const t = useTheme() // テーマ取得

  return (
    <View
      style={[
        a.absolute,    // 絶対位置指定
        a.bottom_0,    // 下端に配置
        a.w_full,      // 幅100%
        a.z_10,        // z-index: 10（前面に表示）
        t.atoms.bg,    // 背景色（テーマ依存）
        a.border_t,    // 上部ボーダー
        t.atoms.border_contrast_low, // 低コントラストボーダー色
        a.px_lg,       // 左右パディング
        a.py_md,       // 上下パディング
      ]}>
      {children}
    </View>
  )
}

/**
 * ダイアログ閉じるボタンコンポーネント（Web版）
 *
 * ダイアログの右上に表示される閉じるボタン。
 * ネイティブ版では不要（ドラッグで閉じられるため）ですが、
 * Web版では明示的な閉じるボタンが必要です。
 *
 * Go言語との対比：
 * - 関数コンポーネント: Goでは構造体とRenderメソッド
 */
export function Close() {
  const {_} = useLingui()                   // 翻訳関数取得
  const {close} = React.useContext(Context) // Context から close 関数取得

  return (
    <View
      style={[
        a.absolute, // 絶対位置指定
        a.z_10,     // z-index: 10（前面に表示）
        {
          top: a.pt_md.paddingTop,     // 上部位置
          right: a.pr_md.paddingRight, // 右部位置
        },
      ]}>
      <Button
        size="small"         // 小サイズ
        variant="ghost"      // ゴーストバリアント（背景なし）
        color="secondary"    // セカンダリーカラー
        shape="round"        // 丸型
        onPress={() => close()} // クリックで閉じる
        label={_(msg`Close active dialog`)}> {/* アクセシビリティラベル */}
        <ButtonIcon icon={X} size="md" /> {/* Xアイコン */}
      </Button>
    </View>
  )
}

/**
 * ハンドルコンポーネント（Web版）
 *
 * Web版ではドラッグハンドルは不要なため、何もレンダリングしません。
 * （ネイティブ版との API 互換性のために存在）
 *
 * Go言語との対比：
 * - 空実装: Goでは空のメソッドまたはnilを返す関数
 *   ```go
 *   func (d *Dialog) Handle() ReactNode {
 *       return nil
 *   }
 *   ```
 */
export function Handle() {
  return null
}

/**
 * 背景オーバーレイコンポーネント
 *
 * ダイアログの背景を暗くするオーバーレイ。
 * 不透明度とフェードインアニメーションを適用します。
 *
 * Go言語との対比：
 * - プライベート関数: Goでは小文字で始まる関数名で表現
 *   ```go
 *   func backdrop() ReactNode {
 *       // 実装
 *   }
 *   ```
 */
function Backdrop() {
  const t = useTheme()                        // テーマ取得
  const {reduceMotionEnabled} = useA11y()     // アクセシビリティ設定

  return (
    <View style={{opacity: 0.8}}> {/* 外側: 不透明度80% */}
      <View
        style={[
          a.fixed,    // 固定位置
          a.inset_0,  // 上下左右0（全画面）
          {backgroundColor: t.palette.black}, // 黒背景
          // アニメーション削減が無効な場合、フェードインアニメーション
          !reduceMotionEnabled && a.fade_in,
        ]}
      />
    </View>
  )
}
