// Reactコアフック - 命令型ハンドルとref管理
import React, {useImperativeHandle} from 'react'
// React Native基本コンポーネントと型定義 - UI構築とイベント処理
import {
  type NativeScrollEvent,      // ネイティブスクロールイベント型
  type NativeSyntheticEvent,   // ネイティブ合成イベント型
  Pressable,                  // タッチ可能コンポーネント
  type ScrollView,            // スクロールビュー型
  type StyleProp,             // スタイルプロパティ型
  TextInput,                  // テキスト入力コンポーネント
  View,                       // 基本ビューコンポーネント
  type ViewStyle,             // ビュースタイル型
} from 'react-native'
// キーボード制御ライブラリ - キーボード表示時のレイアウト調整
import {
  KeyboardAwareScrollView,      // キーボード対応スクロールビュー
  useKeyboardHandler,           // キーボードイベントハンドラー
  useReanimatedKeyboardAnimation, // キーボードアニメーションフック
} from 'react-native-keyboard-controller'
// React Native Reanimated - 高性能アニメーションライブラリ
import Animated, {
  runOnJS,               // JSスレッドで関数実行
  type ScrollEvent,      // スクロールイベント型
  useAnimatedStyle,      // アニメーションスタイルフック
} from 'react-native-reanimated'
// セーフエリア管理 - ノッチやホームバー領域の取得
import {useSafeAreaInsets} from 'react-native-safe-area-context'
// Lingui国際化ライブラリ - メッセージの多言語対応
import {msg} from '@lingui/macro'    // 翻訳メッセージマクロ
import {useLingui} from '@lingui/react' // Lingui Reactフック

import {useEnableKeyboardController} from '#/lib/hooks/useEnableKeyboardController'
import {ScrollProvider} from '#/lib/ScrollContext'
import {logger} from '#/logger'
import {isAndroid, isIOS} from '#/platform/detection'
import {useA11y} from '#/state/a11y'
import {useDialogStateControlContext} from '#/state/dialogs'
import {List, type ListMethods, type ListProps} from '#/view/com/util/List'
import {atoms as a, ios, platform, tokens, useTheme} from '#/alf'
import {useThemeName} from '#/alf/util/useColorModeTheme'
import {Context, useDialogContext} from '#/components/Dialog/context'
import {
  type DialogControlProps,
  type DialogInnerProps,
  type DialogOuterProps,
} from '#/components/Dialog/types'
import {createInput} from '#/components/forms/TextField'
import {BottomSheet, BottomSheetSnapPoint} from '../../../modules/bottom-sheet'
import {
  type BottomSheetSnapPointChangeEvent,
  type BottomSheetStateChangeEvent,
} from '../../../modules/bottom-sheet/src/BottomSheet.types'
import {type BottomSheetNativeComponent} from '../../../modules/bottom-sheet/src/BottomSheetNativeComponent'

// ダイアログ関連のコンテキストと制御フックをエクスポート
export {useDialogContext, useDialogControl} from '#/components/Dialog/context'
// ダイアログの共有コンポーネント、型、ユーティリティをエクスポート
export * from '#/components/Dialog/shared'
export * from '#/components/Dialog/types'
export * from '#/components/Dialog/utils'

// ダイアログ用のカスタマイズされたテキスト入力コンポーネント
export const Input = createInput(TextInput)

/**
 * ダイアログの外側コンポーネント - ボトムシートとして表示されるメインコンテナ
 * Outer dialog component - main container displayed as a bottom sheet
 */
export function Outer({
  children,      // 子要素
  control,       // ダイアログ制御オブジェクト
  onClose,       // 閉じる時のコールバック
  nativeOptions, // ネイティブオプション
  testID,        // テスト用ID
}: React.PropsWithChildren<DialogOuterProps>) {
  const themeName = useThemeName()  // 現在のテーマ名取得
  const t = useTheme(themeName)     // テーマオブジェクト取得
  const ref = React.useRef<BottomSheetNativeComponent>(null) // ボトムシートの参照
  const closeCallbacks = React.useRef<(() => void)[]>([])   // 閉じる時のコールバック配列
  // ダイアログ状態制御 - 開闉状態と全展開カウント管理
  const {setDialogIsOpen, setFullyExpandedCount} =
    useDialogStateControlContext()

  // 前回のスナップポイントを記憶 - 全展開状態の管理のため
  const prevSnapPoint = React.useRef<BottomSheetSnapPoint>(
    BottomSheetSnapPoint.Hidden, // 初期状態は非表示
  )

  const [disableDrag, setDisableDrag] = React.useState(false) // ドラッグ無効化状態
  // 現在のスナップポイント - ダイアログの表示高さ制御
  const [snapPoint, setSnapPoint] = React.useState<BottomSheetSnapPoint>(
    BottomSheetSnapPoint.Partial, // 初期状態は部分表示
  )

  // キューに登録されたコールバックを実行する関数
  const callQueuedCallbacks = React.useCallback(() => {
    for (const cb of closeCallbacks.current) {
      try {
        cb() // コールバック実行
      } catch (e: any) {
        logger.error(e || 'Error running close callback') // エラーログ出力
      }
    }

    closeCallbacks.current = [] // コールバック配列をクリア
  }, [])

  // ダイアログを開く関数
  const open = React.useCallback<DialogControlProps['open']>(() => {
    // Run any leftover callbacks that might have been queued up before calling `.open()`
    // .open()呼び出し前にキューに残っているコールバックを実行
    callQueuedCallbacks()
    setDialogIsOpen(control.id, true) // ダイアログ開状態を設定
    ref.current?.present()            // ボトムシートを表示
  }, [setDialogIsOpen, control.id, callQueuedCallbacks])

  // This is the function that we call when we want to dismiss the dialog.
  // ダイアログを閉じる時に呼び出す関数
  const close = React.useCallback<DialogControlProps['close']>(cb => {
    if (typeof cb === 'function') {
      closeCallbacks.current.push(cb) // コールバックをキューに追加
    }
    ref.current?.dismiss() // ボトムシートを非表示
  }, [])

  // This is the actual thing we are doing once we "confirm" the dialog. We want the dialog's close animation to
  // happen before we run this. It is passed to the `BottomSheet` component.
  // ダイアログを「確認」した後に実行される処理。ダイアログの閉じるアニメーションの
  // 完了後に実行される。`BottomSheet`コンポーネントに渡される。
  const onCloseAnimationComplete = React.useCallback(() => {
    // This removes the dialog from our list of stored dialogs. Not super necessary on iOS, but on Android this
    // tells us that we need to toggle the accessibility overlay setting
    // 保存されたダイアログのリストからこのダイアログを削除。iOSでは特に必要ないが、
    // Androidではアクセシビリティオーバーレイ設定を切り替える必要があることを示す
    setDialogIsOpen(control.id, false) // ダイアログ開状態をオフ
    callQueuedCallbacks()              // キューに登録されたコールバックを実行
    onClose?.()                       // 外部から渡された閉じるコールバックを実行
  }, [callQueuedCallbacks, control.id, onClose, setDialogIsOpen])

  const onSnapPointChange = (e: BottomSheetSnapPointChangeEvent) => {
    const {snapPoint} = e.nativeEvent
    setSnapPoint(snapPoint)

    if (
      snapPoint === BottomSheetSnapPoint.Full &&
      prevSnapPoint.current !== BottomSheetSnapPoint.Full
    ) {
      setFullyExpandedCount(c => c + 1)
    } else if (
      snapPoint !== BottomSheetSnapPoint.Full &&
      prevSnapPoint.current === BottomSheetSnapPoint.Full
    ) {
      setFullyExpandedCount(c => c - 1)
    }
    prevSnapPoint.current = snapPoint
  }

  const onStateChange = (e: BottomSheetStateChangeEvent) => {
    if (e.nativeEvent.state === 'closed') {
      onCloseAnimationComplete()

      if (prevSnapPoint.current === BottomSheetSnapPoint.Full) {
        setFullyExpandedCount(c => c - 1)
      }
      prevSnapPoint.current = BottomSheetSnapPoint.Hidden
    }
  }

  useImperativeHandle(
    control.ref,
    () => ({
      open,
      close,
    }),
    [open, close],
  )

  const context = React.useMemo(
    () => ({
      close,
      isNativeDialog: true,
      nativeSnapPoint: snapPoint,
      disableDrag,
      setDisableDrag,
      isWithinDialog: true,
    }),
    [close, snapPoint, disableDrag, setDisableDrag],
  )

  return (
    <BottomSheet
      ref={ref}
      cornerRadius={20}
      backgroundColor={t.atoms.bg.backgroundColor}
      {...nativeOptions}
      onSnapPointChange={onSnapPointChange}
      onStateChange={onStateChange}
      disableDrag={disableDrag}>
      <Context.Provider value={context}>
        <View testID={testID} style={[a.relative]}>
          {children}
        </View>
      </Context.Provider>
    </BottomSheet>
  )
}

/**
 * ダイアログの内側コンポーネント - 非スクロールコンテンツ用
 * Inner dialog component for non-scrollable content
 */
export function Inner({children, style, header}: DialogInnerProps) {
  const insets = useSafeAreaInsets() // セーフエリア情報取得
  return (
    <>
      {/* ヘッダー要素（ある場合） */}
      {header}
      <View
        style={[
          a.pt_2xl,  // 上部パディング
          a.px_xl,   // 横方向パディング
          {
            paddingBottom: insets.bottom + insets.top, // 下部パディング（セーフエリア分）
          },
          style, // カスタムスタイル
        ]}>
        {children}
      </View>
    </>
  )
}

export const ScrollableInner = React.forwardRef<ScrollView, DialogInnerProps>(
  function ScrollableInner(
    {children, contentContainerStyle, header, ...props},
    ref,
  ) {
    const {nativeSnapPoint, disableDrag, setDisableDrag} = useDialogContext()
    const insets = useSafeAreaInsets()

    useEnableKeyboardController(isIOS)

    const [keyboardHeight, setKeyboardHeight] = React.useState(0)

    useKeyboardHandler(
      {
        onEnd: e => {
          'worklet'
          runOnJS(setKeyboardHeight)(e.height)
        },
      },
      [],
    )

    let paddingBottom = 0
    if (isIOS) {
      paddingBottom += keyboardHeight / 4
      if (nativeSnapPoint === BottomSheetSnapPoint.Full) {
        paddingBottom += insets.bottom + tokens.space.md
      }
      paddingBottom = Math.max(paddingBottom, tokens.space._2xl)
    } else {
      paddingBottom += keyboardHeight
      if (nativeSnapPoint === BottomSheetSnapPoint.Full) {
        paddingBottom += insets.top
      }
      paddingBottom +=
        Math.max(insets.bottom, tokens.space._5xl) + tokens.space._2xl
    }

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isAndroid) {
        return
      }
      const {contentOffset} = e.nativeEvent
      if (contentOffset.y > 0 && !disableDrag) {
        setDisableDrag(true)
      } else if (contentOffset.y <= 1 && disableDrag) {
        setDisableDrag(false)
      }
    }

    return (
      <KeyboardAwareScrollView
        contentContainerStyle={[
          a.pt_2xl,
          a.px_xl,
          {paddingBottom},
          contentContainerStyle,
        ]}
        ref={ref}
        showsVerticalScrollIndicator={isAndroid ? false : undefined}
        {...props}
        bounces={nativeSnapPoint === BottomSheetSnapPoint.Full}
        bottomOffset={30}
        scrollEventThrottle={50}
        onScroll={isAndroid ? onScroll : undefined}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={header ? [0] : undefined}>
        {header}
        {children}
      </KeyboardAwareScrollView>
    )
  },
)

export const InnerFlatList = React.forwardRef<
  ListMethods,
  ListProps<any> & {
    webInnerStyle?: StyleProp<ViewStyle>
    webInnerContentContainerStyle?: StyleProp<ViewStyle>
    footer?: React.ReactNode
  }
>(function InnerFlatList({footer, style, ...props}, ref) {
  const insets = useSafeAreaInsets()
  const {nativeSnapPoint, disableDrag, setDisableDrag} = useDialogContext()

  useEnableKeyboardController(isIOS)

  const onScroll = (e: ScrollEvent) => {
    'worklet'
    if (!isAndroid) {
      return
    }
    const {contentOffset} = e
    if (contentOffset.y > 0 && !disableDrag) {
      runOnJS(setDisableDrag)(true)
    } else if (contentOffset.y <= 1 && disableDrag) {
      runOnJS(setDisableDrag)(false)
    }
  }

  return (
    <ScrollProvider onScroll={onScroll}>
      <List
        keyboardShouldPersistTaps="handled"
        bounces={nativeSnapPoint === BottomSheetSnapPoint.Full}
        ListFooterComponent={<View style={{height: insets.bottom + 100}} />}
        ref={ref}
        showsVerticalScrollIndicator={isAndroid ? false : undefined}
        {...props}
        style={[a.h_full, style]}
      />
      {footer}
    </ScrollProvider>
  )
})

export function FlatListFooter({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const {top, bottom} = useSafeAreaInsets()
  const {height} = useReanimatedKeyboardAnimation()

  const animatedStyle = useAnimatedStyle(() => {
    if (!isIOS) return {}
    return {
      transform: [{translateY: Math.min(0, height.get() + bottom - 10)}],
    }
  })

  return (
    <Animated.View
      style={[
        a.absolute,
        a.bottom_0,
        a.w_full,
        a.z_10,
        a.border_t,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.px_lg,
        a.pt_md,
        {
          paddingBottom: platform({
            ios: tokens.space.md + bottom,
            android: tokens.space.md + bottom + top,
          }),
        },
        // TODO: had to admit defeat here, but we should
        // try and get this to work for Android as well -sfn
        ios(animatedStyle),
      ]}>
      {children}
    </Animated.View>
  )
}

/**
 * ダイアログのハンドルコンポーネント - ドラッグやタップでダイアログを閉じるためのハンドル
 * Dialog handle component for dragging or tapping to close the dialog
 */
export function Handle({difference = false}: {difference?: boolean}) {
  const t = useTheme()                      // テーマ取得
  const {_} = useLingui()                   // 翻訳関数取得
  const {screenReaderEnabled} = useA11y()   // アクセシビリティ情報取得
  const {close} = useDialogContext()        // ダイアログ閉じる関数取得

  return (
    <View style={[a.absolute, a.w_full, a.align_center, a.z_10, {height: 20}]}>
      <Pressable
        accessible={screenReaderEnabled}                        // スクリーンリーダー有効時のみアクセシブル
        onPress={() => close()}                                 // タップでダイアログを閉じる
        accessibilityLabel={_(msg`Dismiss`)}                   // アクセシビリティラベル
        accessibilityHint={_(msg`Double tap to close the dialog`)}> {/* アクセシビリティヒント */}
        <View
          style={[
            a.rounded_sm, // 小さな角丸
            {
              top: tokens.space._2xl / 2 - 2.5, // 上部位置調整
              width: 35,                         // ハンドル幅
              height: 5,                         // ハンドル高さ
              alignSelf: 'center',               // 中央揃え
            },
            // ディファレンスモードか通常モードかでスタイル変更
            difference
              ? {
                  // TODO: mixBlendMode is only available on the new architecture -sfn
                  // backgroundColor: t.palette.white,
                  // mixBlendMode: 'difference',
                  backgroundColor: t.palette.white, // 白背景
                  opacity: 0.75,                   // 半透明
                }
              : {
                  backgroundColor: t.palette.contrast_975, // 高コントラスト背景
                  opacity: 0.5,                           // 半透明
                },
          ]}
        />
      </Pressable>
    </View>
  )
}

/**
 * ダイアログ用のクローズコンポーネント - 現在は何もレンダリングしない
 * Close component for dialog - currently renders nothing
 */
export function Close() {
  return null // 何もレンダリングしない
}
