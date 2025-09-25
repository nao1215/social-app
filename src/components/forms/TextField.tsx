/**
 * テキストフィールドコンポーネント
 *
 * 【主な機能】
 * - カスタマイズ可能なテキスト入力フィールド
 * - アイコン、ラベル、サフィックステキストの統合サポート
 * - バリデーション状態の視覚的フィードバック
 * - インタラクション状態（ホバー、フォーカス）の管理
 *
 * 【デザインシステム】
 * - テーマ対応（ライト・ダークモード）
 * - 一貫したタイポグラフィとスペーシング
 * - アクセシビリティ機能（ラベル、ヒント）
 * - レスポンシブデザイン
 *
 * 【プラットフォーム対応】
 * - Web: マウスイベント対応、カスタムスタイル
 * - iOS/Android: ネイティブTextInputの最適化
 * - キーボード外観の自動調整
 *
 * @module TextField - フォームで使用される汎用テキスト入力コンポーネント
 */

// Reactコアフック - コンテキスト、メモ化、参照管理
import {createContext, useContext, useMemo, useRef} from 'react'
// React Nativeコンポーネント - UI構築とテキスト入力機能
import {
  type AccessibilityProps,  // アクセシビリティプロパティ型
  StyleSheet,              // スタイルシート作成
  TextInput,               // テキスト入力コンポーネント
  type TextInputProps,     // テキスト入力プロパティ型
  type TextStyle,          // テキストスタイル型
  View,                    // 基本ビューコンポーネント
  type ViewStyle,          // ビュースタイル型
} from 'react-native'

// アプリ固有のライブラリとユーティリティ
import {HITSLOP_20} from '#/lib/constants'          // タッチ領域拡張定数
import {mergeRefs} from '#/lib/merge-refs'          // 複数ref統合ユーティリティ
// デザインシステム - 統一されたスタイリングとテーマ管理
import {
  android,              // Android固有スタイル
  applyFonts,          // フォント適用ユーティリティ
  atoms as a,          // アトミックスタイル
  ios,                 // iOS固有スタイル
  platform,            // プラットフォーム固有処理
  type TextStyleProp,  // テキストスタイルプロパティ型
  tokens,              // デザイントークン
  useAlf,              // ALFデザインシステムフック
  useTheme,            // テーマフック
  web,                 // Web固有スタイル
} from '#/alf'
// インタラクション状態管理 - ホバー、フォーカス、プレス状態
import {useInteractionState} from '#/components/hooks/useInteractionState'
// SVGアイコンコンポーネントの型定義
import {type Props as SVGIconProps} from '#/components/icons/common'
// タイポグラフィコンポーネント
import {Text} from '#/components/Typography'

// テキストフィールドコンテキスト - 子コンポーネント間での状態共有のため
const Context = createContext<{
  inputRef: React.RefObject<TextInput> | null  // テキスト入力への参照
  isInvalid: boolean                          // バリデーションエラー状態
  hovered: boolean                            // ホバー状態
  onHoverIn: () => void                       // ホバー開始ハンドラー
  onHoverOut: () => void                      // ホバー終了ハンドラー
  focused: boolean                            // フォーカス状態
  onFocus: () => void                         // フォーカス取得ハンドラー
  onBlur: () => void                          // フォーカス喪失ハンドラー
}>({
  inputRef: null,          // デフォルト: 参照なし
  isInvalid: false,        // デフォルト: 有効
  hovered: false,          // デフォルト: ホバーしていない
  onHoverIn: () => {},     // デフォルト: 空関数
  onHoverOut: () => {},    // デフォルト: 空関数
  focused: false,          // デフォルト: フォーカスしていない
  onFocus: () => {},       // デフォルト: 空関数
  onBlur: () => {},        // デフォルト: 空関数
})
Context.displayName = 'TextFieldContext'

// テキストフィールドのルートプロパティ型定義
export type RootProps = React.PropsWithChildren<
  {isInvalid?: boolean} & TextStyleProp  // バリデーション状態とテキストスタイルプロパティ
>

/**
 * テキストフィールドのルートコンポーネント
 *
 * テキストフィールド全体のコンテナとして機能し、子コンポーネント間での
 * 状態共有とインタラクション管理を提供する
 *
 * @param children - 子要素（Input、Icon、LabelTextなど）
 * @param isInvalid - バリデーションエラー状態
 * @param style - カスタムスタイル
 * @returns テキストフィールドのルートコンポーネント
 */
export function Root({children, isInvalid = false, style}: RootProps) {
  const inputRef = useRef<TextInput>(null)  // テキスト入力への参照
  // ホバー状態管理 - マウスオーバー時の視覚的フィードバック
  const {
    state: hovered,      // ホバー状態
    onIn: onHoverIn,     // ホバー開始
    onOut: onHoverOut,   // ホバー終了
  } = useInteractionState()
  // フォーカス状態管理 - キーボードフォーカス時の視覚的フィードバック
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  // コンテキスト値をメモ化 - パフォーマンス最適化のため
  const context = useMemo(
    () => ({
      inputRef,        // テキスト入力参照
      hovered,         // ホバー状態
      onHoverIn,       // ホバー開始ハンドラー
      onHoverOut,      // ホバー終了ハンドラー
      focused,         // フォーカス状態
      onFocus,         // フォーカス取得ハンドラー
      onBlur,          // フォーカス喪失ハンドラー
      isInvalid,       // バリデーション状態
    }),
    [
      inputRef,
      hovered,
      onHoverIn,
      onHoverOut,
      focused,
      onFocus,
      onBlur,
      isInvalid,
    ],
  )

  return (
    <Context.Provider value={context}>
      <View
        style={[
          a.flex_row,      // 横並びレイアウト
          a.align_center,  // 垂直中央揃え
          a.relative,      // 相対位置指定
          a.w_full,        // 全幅
          a.px_md,         // 横方向パディング
          style,           // カスタムスタイル
        ]}
        {...web({
          // Web専用: クリックでフォーカス、マウスイベント処理
          onClick: () => inputRef.current?.focus(),  // クリック時にフォーカス
          onMouseOver: onHoverIn,                    // マウスオーバー時
          onMouseOut: onHoverOut,                    // マウスアウト時
        })}>
        {children}
      </View>
    </Context.Provider>
  )
}

/**
 * テキスト入力の共有スタイルフック
 *
 * 各種インタラクション状態（ホバー、フォーカス、エラー）に応じた
 * 視覚的フィードバック用のスタイルオブジェクトを提供する
 *
 * @returns スタイルオブジェクト（ホバー、フォーカス、エラー状態用）
 */
export function useSharedInputStyles() {
  const t = useTheme()  // テーマ取得
  return useMemo(() => {
    // ホバー状態のスタイル - マウスオーバー時の境界線色変更
    const hover: ViewStyle[] = [
      {
        borderColor: t.palette.contrast_100,  // 軽いコントラストの境界線
      },
    ]
    // フォーカス状態のスタイル - アクティブ時の背景と境界線
    const focus: ViewStyle[] = [
      {
        backgroundColor: t.palette.contrast_50,  // 軽い背景色
        borderColor: t.palette.primary_500,      // プライマリカラーの境界線
      },
    ]
    // エラー状態のスタイル - バリデーション失敗時の視覚的フィードバック
    const error: ViewStyle[] = [
      {
        backgroundColor: t.palette.negative_25,  // 軽いエラー背景色
        borderColor: t.palette.negative_300,     // エラー色の境界線
      },
    ]
    // エラー状態でのホバースタイル - エラー時のマウスオーバー強調
    const errorHover: ViewStyle[] = [
      {
        backgroundColor: t.palette.negative_25,  // エラー背景色維持
        borderColor: t.palette.negative_500,     // より強いエラー境界線色
      },
    ]

    return {
      chromeHover: StyleSheet.flatten(hover),         // ホバー時のクロームスタイル
      chromeFocus: StyleSheet.flatten(focus),         // フォーカス時のクロームスタイル
      chromeError: StyleSheet.flatten(error),         // エラー時のクロームスタイル
      chromeErrorHover: StyleSheet.flatten(errorHover), // エラーホバー時のクロームスタイル
    }
  }, [t])  // テーマが変更された時に再計算
}

export type InputProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string
  /**
   * @deprecated Controlled inputs are *strongly* discouraged. Use `defaultValue` instead where possible.
   *
   * See https://github.com/facebook/react-native-website/pull/4247
   */
  value?: string
  onChangeText?: (value: string) => void
  isInvalid?: boolean
  inputRef?: React.RefObject<TextInput> | React.ForwardedRef<TextInput>
}

export function createInput(Component: typeof TextInput) {
  return function Input({
    label,
    placeholder,
    value,
    onChangeText,
    onFocus,
    onBlur,
    isInvalid,
    inputRef,
    style,
    ...rest
  }: InputProps) {
    const t = useTheme()
    const {fonts} = useAlf()
    const ctx = useContext(Context)
    const withinRoot = Boolean(ctx.inputRef)

    const {chromeHover, chromeFocus, chromeError, chromeErrorHover} =
      useSharedInputStyles()

    if (!withinRoot) {
      return (
        <Root isInvalid={isInvalid}>
          <Input
            label={label}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            isInvalid={isInvalid}
            {...rest}
          />
        </Root>
      )
    }

    const refs = mergeRefs([ctx.inputRef, inputRef!].filter(Boolean))

    const flattened = StyleSheet.flatten([
      a.relative,
      a.z_20,
      a.flex_1,
      a.text_md,
      t.atoms.text,
      a.px_xs,
      {
        // paddingVertical doesn't work w/multiline - esb
        lineHeight: a.text_md.fontSize * 1.1875,
        textAlignVertical: rest.multiline ? 'top' : undefined,
        minHeight: rest.multiline ? 80 : undefined,
        minWidth: 0,
      },
      ios({paddingTop: 12, paddingBottom: 13}),
      // Needs to be sm on Paper, md on Fabric for some godforsaken reason -sfn
      android(a.py_sm),
      // fix for autofill styles covering border
      web({
        paddingTop: 10,
        paddingBottom: 11,
        marginTop: 2,
        marginBottom: 2,
      }),
      style,
    ])

    applyFonts(flattened, fonts.family)

    // should always be defined on `typography`
    // @ts-ignore
    if (flattened.fontSize) {
      // @ts-ignore
      flattened.fontSize = Math.round(
        // @ts-ignore
        flattened.fontSize * fonts.scaleMultiplier,
      )
    }

    return (
      <>
        <Component
          accessibilityHint={undefined}
          hitSlop={HITSLOP_20}
          {...rest}
          accessibilityLabel={label}
          ref={refs}
          value={value}
          onChangeText={onChangeText}
          onFocus={e => {
            ctx.onFocus()
            onFocus?.(e)
          }}
          onBlur={e => {
            ctx.onBlur()
            onBlur?.(e)
          }}
          placeholder={placeholder || label}
          placeholderTextColor={t.palette.contrast_500}
          keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
          style={flattened}
        />

        <View
          style={[
            a.z_10,
            a.absolute,
            a.inset_0,
            a.rounded_sm,
            t.atoms.bg_contrast_25,
            {borderColor: 'transparent', borderWidth: 2},
            ctx.hovered ? chromeHover : {},
            ctx.focused ? chromeFocus : {},
            ctx.isInvalid || isInvalid ? chromeError : {},
            (ctx.isInvalid || isInvalid) && (ctx.hovered || ctx.focused)
              ? chromeErrorHover
              : {},
          ]}
        />
      </>
    )
  }
}

export const Input = createInput(TextInput)

export function LabelText({
  nativeID,
  children,
}: React.PropsWithChildren<{nativeID?: string}>) {
  const t = useTheme()
  return (
    <Text
      nativeID={nativeID}
      style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium, a.mb_sm]}>
      {children}
    </Text>
  )
}

export function Icon({icon: Comp}: {icon: React.ComponentType<SVGIconProps>}) {
  const t = useTheme()
  const ctx = useContext(Context)
  const {hover, focus, errorHover, errorFocus} = useMemo(() => {
    const hover: TextStyle[] = [
      {
        color: t.palette.contrast_800,
      },
    ]
    const focus: TextStyle[] = [
      {
        color: t.palette.primary_500,
      },
    ]
    const errorHover: TextStyle[] = [
      {
        color: t.palette.negative_500,
      },
    ]
    const errorFocus: TextStyle[] = [
      {
        color: t.palette.negative_500,
      },
    ]

    return {
      hover,
      focus,
      errorHover,
      errorFocus,
    }
  }, [t])

  return (
    <View style={[a.z_20, a.pr_xs]}>
      <Comp
        size="md"
        style={[
          {color: t.palette.contrast_500, pointerEvents: 'none', flexShrink: 0},
          ctx.hovered ? hover : {},
          ctx.focused ? focus : {},
          ctx.isInvalid && ctx.hovered ? errorHover : {},
          ctx.isInvalid && ctx.focused ? errorFocus : {},
        ]}
      />
    </View>
  )
}

export function SuffixText({
  children,
  label,
  accessibilityHint,
  style,
}: React.PropsWithChildren<
  TextStyleProp & {
    label: string
    accessibilityHint?: AccessibilityProps['accessibilityHint']
  }
>) {
  const t = useTheme()
  const ctx = useContext(Context)
  return (
    <Text
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      numberOfLines={1}
      style={[
        a.z_20,
        a.pr_sm,
        a.text_md,
        t.atoms.text_contrast_medium,
        a.pointer_events_none,
        web([{marginTop: -2}, a.leading_snug]),
        (ctx.hovered || ctx.focused) && {color: t.palette.contrast_800},
        style,
      ]}>
      {children}
    </Text>
  )
}

export function GhostText({
  children,
  value,
}: {
  children: string
  value: string
}) {
  const t = useTheme()
  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <View
      style={[
        a.pointer_events_none,
        a.absolute,
        a.z_10,
        {
          paddingLeft: platform({
            native:
              // input padding
              tokens.space.md +
              // icon
              tokens.space.xl +
              // icon padding
              tokens.space.xs +
              // text input padding
              tokens.space.xs,
            web:
              // icon
              tokens.space.xl +
              // icon padding
              tokens.space.xs +
              // text input padding
              tokens.space.xs,
          }),
        },
        web(a.pr_md),
        a.overflow_hidden,
        a.max_w_full,
      ]}
      aria-hidden={true}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Text
        style={[
          {color: 'transparent'},
          a.text_md,
          {lineHeight: a.text_md.fontSize * 1.1875},
          a.w_full,
        ]}
        numberOfLines={1}>
        {children}
        <Text
          style={[
            t.atoms.text_contrast_low,
            a.text_md,
            {lineHeight: a.text_md.fontSize * 1.1875},
          ]}>
          {value}
        </Text>
      </Text>
    </View>
  )
}
