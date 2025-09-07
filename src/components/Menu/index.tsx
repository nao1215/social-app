// Reactコアフック - 要素のクローン、フラグメント、バリデーション、メモ化
import {cloneElement, Fragment, isValidElement, useMemo} from 'react'
// React Native基本コンポーネントと型定義 - UI構築のため
import {
  Pressable,      // タッチ可能コンポーネント
  type StyleProp, // スタイルプロパティ型
  type TextStyle, // テキストスタイル型
  View,           // 基本ビューコンポーネント
  type ViewStyle, // ビュースタイル型
} from 'react-native'
// Lingui国際化ライブラリ - メッセージの多言語対応
import {msg, Trans} from '@lingui/macro'  // 翻訳メッセージマクロ
import {useLingui} from '@lingui/react'   // Lingui Reactフック
// React子要素をフラット化するユーティリティ - ネストされた子要素を一列化
import flattenReactChildren from 'react-keyed-flatten-children'

// プラットフォーム検出 - Android、iOS、ネイティブ環境の判定
import {isAndroid, isIOS, isNative} from '#/platform/detection'
// デザインシステム - スタイルとテーマ管理
import {atoms as a, useTheme} from '#/alf'
// ボタンコンポーネント - インタラクティブな操作用
import {Button, ButtonText} from '#/components/Button'
// ダイアログコンポーネント群 - メニューはダイアログとして表示
import * as Dialog from '#/components/Dialog'
// インタラクション状態フック - ホバー、フォーカス、プレス状態管理
import {useInteractionState} from '#/components/hooks/useInteractionState'
// メニューコンテキスト - メニュー内での状態共有
import {
  Context,            // メニュー全体のコンテキスト
  ItemContext,        // メニューアイテムのコンテキスト
  useMenuContext,     // メニューコンテキスト取得フック
  useMenuItemContext, // メニューアイテムコンテキスト取得フック
} from '#/components/Menu/context'
// メニューコンポーネントの型定義
import {
  type ContextType,    // コンテキスト型
  type GroupProps,     // グループプロパティ型
  type ItemIconProps,  // アイテムアイコンプロパティ型
  type ItemProps,      // アイテムプロパティ型
  type ItemTextProps,  // アイテムテキストプロパティ型
  type TriggerProps,   // トリガープロパティ型
} from '#/components/Menu/types'
// タイポグラフィコンポーネント
import {Text} from '#/components/Typography'

// ダイアログ制御をメニュー制御としてエクスポート - メニューはダイアログをベースに構築
export {
  type DialogControlProps as MenuControlProps, // メニュー制御プロパティ型
  useDialogControl as useMenuControl,          // メニュー制御フック
} from '#/components/Dialog'

// メニューコンテキストフックをエクスポート
export {useMenuContext}

/**
 * メニューのルートコンポーネント - メニュー全体のコンテキストを提供
 * Menu root component providing context for the entire menu
 */
export function Root({
  children, // 子要素
  control,  // メニュー制御オブジェクト（オプション）
}: React.PropsWithChildren<{
  control?: Dialog.DialogControlProps
}>) {
  const defaultControl = Dialog.useDialogControl() // デフォルトコントロールを作成
  // メニューコンテキストをメモ化 - パフォーマンス最適化のため
  const context = useMemo<ContextType>(
    () => ({
      control: control || defaultControl, // 渡されたコントロールまたはデフォルトを使用
    }),
    [control, defaultControl],
  )

  return <Context.Provider value={context}>{children}</Context.Provider>
}

/**
 * メニュートリガーコンポーネント - メニューを開くためのトリガー要素
 * Menu trigger component for opening the menu
 */
export function Trigger({
  children,           // レンダープロパティ関数
  label,             // アクセシビリティラベル
  role = 'button',   // アクセシビリティロール（デフォルト: button）
  hint,              // アクセシビリティヒント
}: TriggerProps) {
  const context = useMenuContext()                                 // メニューコンテキスト取得
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState() // フォーカス状態管理
  // プレス状態管理 - タッチ時の視覚フィードバックのため
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  // レンダープロパティ関数にメニュー状態とプロパティを渡す
  return children({
    isNative: true,              // ネイティブ環境であることを示す
    control: context.control,    // メニュー制御オブジェクト
    state: {
      hovered: false,            // ホバー状態（ネイティブでは常にfalse）
      focused,                   // フォーカス状態
      pressed,                   // プレス状態
    },
    props: {
      ref: null,                           // 参照（ネイティブではnull）
      onPress: context.control.open,       // メニューを開くハンドラー
      onFocus,                            // フォーカスハンドラー
      onBlur,                             // フォーカス喪失ハンドラー
      onPressIn,                          // プレス開始ハンドラー
      onPressOut,                         // プレス終了ハンドラー
      accessibilityHint: hint,            // アクセシビリティヒント
      accessibilityLabel: label,          // アクセシビリティラベル
      accessibilityRole: role,            // アクセシビリティロール
    },
  })
}

/**
 * メニューの外側コンポーネント - ダイアログとして表示されるメニューのコンテナ
 * Menu outer component - container for the menu displayed as a dialog
 */
export function Outer({
  children,    // 子要素
  showCancel,  // キャンセルボタンを表示するかどうか
}: React.PropsWithChildren<{
  showCancel?: boolean
  style?: StyleProp<ViewStyle>
}>) {
  const context = useMenuContext() // メニューコンテキスト取得
  const {_} = useLingui()          // 翻訳関数取得

  return (
    <Dialog.Outer
      control={context.control}                           // メニュー制御オブジェクト
      nativeOptions={{preventExpansion: true}}>          {/* メニューの自動展開を禁止 */}
      <Dialog.Handle />  {/* ダイアログハンドル */}
      {/* Re-wrap with context since Dialogs are portal-ed to root */}
      {/* ダイアログはルートにポータルされるため、コンテキストを再ラップ */}
      <Context.Provider value={context}>
        <Dialog.ScrollableInner label={_(msg`Menu`)}> {/* スクロール可能なメニュー内部 */}
          <View style={[a.gap_lg]}> {/* 大きなギャップでアイテムを配置 */}
            {children}
            {/* ネイティブ環境でキャンセルボタンが有効な場合のみ表示 */}
            {isNative && showCancel && <Cancel />}
          </View>
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

export function Item({children, label, style, onPress, ...rest}: ItemProps) {
  const t = useTheme()
  const context = useMenuContext()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return (
    <Pressable
      {...rest}
      accessibilityHint=""
      accessibilityLabel={label}
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={async e => {
        if (isAndroid) {
          /**
           * Below fix for iOS doesn't work for Android, this does.
           */
          onPress?.(e)
          context.control.close()
        } else if (isIOS) {
          /**
           * Fixes a subtle bug on iOS
           * {@link https://github.com/bluesky-social/social-app/pull/5849/files#diff-de516ef5e7bd9840cd639213301df38cf03acfcad5bda85a1d63efd249ba79deL124-L127}
           */
          context.control.close(() => {
            onPress?.(e)
          })
        }
      }}
      onPressIn={e => {
        onPressIn()
        rest.onPressIn?.(e)
      }}
      onPressOut={e => {
        onPressOut()
        rest.onPressOut?.(e)
      }}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_md,
        a.rounded_md,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {minHeight: 44, paddingVertical: 10},
        style,
        (focused || pressed) && !rest.disabled && [t.atoms.bg_contrast_50],
      ]}>
      <ItemContext.Provider value={{disabled: Boolean(rest.disabled)}}>
        {children}
      </ItemContext.Provider>
    </Pressable>
  )
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  const {disabled} = useMenuItemContext()
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="middle"
      style={[
        a.flex_1,
        a.text_md,
        a.font_bold,
        t.atoms.text_contrast_high,
        {paddingTop: 3},
        style,
        disabled && t.atoms.text_contrast_low,
      ]}>
      {children}
    </Text>
  )
}

export function ItemIcon({icon: Comp}: ItemIconProps) {
  const t = useTheme()
  const {disabled} = useMenuItemContext()
  return (
    <Comp
      size="lg"
      fill={
        disabled
          ? t.atoms.text_contrast_low.color
          : t.atoms.text_contrast_medium.color
      }
    />
  )
}

export function ItemRadio({selected}: {selected: boolean}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.justify_center,
        a.align_center,
        a.rounded_full,
        t.atoms.border_contrast_high,
        {
          borderWidth: 1,
          height: 20,
          width: 20,
        },
      ]}>
      {selected ? (
        <View
          style={[
            a.absolute,
            a.rounded_full,
            {height: 14, width: 14},
            selected
              ? {
                  backgroundColor: t.palette.primary_500,
                }
              : {},
          ]}
        />
      ) : null}
    </View>
  )
}

/**
 * NATIVE ONLY - for adding non-pressable items to the menu
 *
 * @platform ios, android
 */
export function ContainerItem({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_md,
        a.rounded_md,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {paddingVertical: 10},
        style,
      ]}>
      {children}
    </View>
  )
}

export function LabelText({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<TextStyle>
}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.font_bold,
        t.atoms.text_contrast_medium,
        {marginBottom: -8},
        style,
      ]}>
      {children}
    </Text>
  )
}

export function Group({children, style}: GroupProps) {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_md,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
        style,
      ]}>
      {flattenReactChildren(children).map((child, i) => {
        return isValidElement(child) &&
          (child.type === Item || child.type === ContainerItem) ? (
          <Fragment key={i}>
            {i > 0 ? (
              <View style={[a.border_b, t.atoms.border_contrast_low]} />
            ) : null}
            {cloneElement(child, {
              // @ts-expect-error cloneElement is not aware of the types
              style: {
                borderRadius: 0,
                borderWidth: 0,
              },
            })}
          </Fragment>
        ) : null
      })}
    </View>
  )
}

function Cancel() {
  const {_} = useLingui()
  const context = useMenuContext()

  return (
    <Button
      label={_(msg`Close this dialog`)}
      size="small"
      variant="ghost"
      color="secondary"
      onPress={() => context.control.close()}>
      <ButtonText>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )
}

export function Divider() {
  return null
}
