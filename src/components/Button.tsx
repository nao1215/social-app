// Reactフレームワークのメインライブラリ - UIコンポーネント作成のため
import React from 'react'
// React Nativeのコアコンポーネントと型定義 - クロスプラットフォーム対応のため
import {
  type AccessibilityProps, // アクセシビリティ機能のプロパティ型
  type GestureResponderEvent, // タッチ・ジェスチャーイベント型
  type MouseEvent, // マウスイベント型
  type NativeSyntheticEvent, // ネイティブ合成イベント型
  Pressable, // タッチ可能なコンポーネント
  type PressableProps, // Pressableのプロパティ型
  type StyleProp, // スタイルプロパティ型
  StyleSheet, // スタイルシート作成ユーティリティ
  type TargetedEvent, // ターゲット指定イベント型
  type TextProps, // テキストコンポーネントのプロパティ型
  type TextStyle, // テキストスタイル型
  View, // 基本的なUIコンテナ
  type ViewStyle, // ビュースタイル型
} from 'react-native'

// アプリのデザインシステム - 統一されたスタイリングのため
import {atoms as a, flatten, select, useTheme} from '#/alf'
// SVGアイコンコンポーネント用の共通プロパティ型
import {type Props as SVGIconProps} from '#/components/icons/common'
// タイポグラフィコンポーネント - テキスト表示のため
import {Text} from '#/components/Typography'

/**
 * The `Button` component, and some extensions of it like `Link` are intended
 * to be generic and therefore apply no styles by default. These `VariantProps`
 * are what control the `Button`'s presentation, and are intended only use cases where the buttons appear as, well, buttons.
 *
 * `Button`コンポーネントおよび`Link`などの拡張は汎用的であり、
 * デフォルトではスタイルを適用しません。この`VariantProps`は
 * `Button`の表示を制御し、実際のボタンとして表示される用途でのみ使用されます。
 *
 * If `Button` or an extension of it are used for other compound components, use this property to avoid misuse of these variant props further down the line.
 *
 * `Button`またはその拡張が他の複合コンポーネントで使用される場合、
 * このプロパティを使用して、これらのバリアントプロパティの誤用を防いでください。
 *
 * @example
 * type MyComponentProps = Omit<ButtonProps, UninheritableButtonProps> & {...}
 */
// 継承してはいけないButtonプロパティ型 - 複合コンポーネントでの誤用防止のため
export type UninheritableButtonProps = 'variant' | 'color' | 'size' | 'shape'

// ボタンのバリアント（外観スタイル）型定義
export type ButtonVariant = 'solid' | 'outline' | 'ghost'
// ボタンの色テーマ型定義
export type ButtonColor =
  | 'primary'            // プライマリカラー
  | 'secondary'          // セカンダリカラー
  | 'secondary_inverted' // 反転セカンダリカラー
  | 'negative'           // ネガティブ（警告・削除用）カラー
  | 'primary_subtle'     // 控えめプライマリカラー
  | 'negative_subtle'    // 控えめネガティブカラー
// ボタンのサイズ型定義
export type ButtonSize = 'tiny' | 'small' | 'large'
// ボタンの形状型定義
export type ButtonShape = 'round' | 'square' | 'default'
// バリアント制御用プロパティ型定義
export type VariantProps = {
  /**
   * The style variation of the button
   * ボタンのスタイルバリエーション
   * @deprecated Use `color` instead.
   * @deprecated 代わりに`color`を使用してください
   */
  variant?: ButtonVariant
  /**
   * The color of the button
   * ボタンの色
   */
  color?: ButtonColor
  /**
   * The size of the button
   * ボタンのサイズ
   */
  size?: ButtonSize
  /**
   * The shape of the button
   * ボタンの形状
   */
  shape?: ButtonShape
}

// ボタンの状態を表す型定義
export type ButtonState = {
  hovered: boolean  // ホバー（マウスオーバー）状態
  focused: boolean  // フォーカス状態
  pressed: boolean  // 押下状態
  disabled: boolean // 無効化状態
}

// ボタンコンテキスト型 - バリアントプロパティと状態の組み合わせ
export type ButtonContext = VariantProps & ButtonState

// テキスト以外の要素型定義 - ボタンの子要素として使用可能な型
type NonTextElements =
  | React.ReactElement // 単一のReact要素
  | Iterable<React.ReactElement | null | undefined | boolean> // 反復可能な要素の配列

// Buttonコンポーネントのプロパティ型定義
export type ButtonProps = Pick<
  PressableProps,
  | 'disabled'    // 無効化フラグ
  | 'onPress'     // 押下時のハンドラー
  | 'testID'      // テスト用ID
  | 'onLongPress' // 長押し時のハンドラー
  | 'hitSlop'     // タッチ可能領域の拡張
  | 'onHoverIn'   // ホバー開始時のハンドラー
  | 'onHoverOut'  // ホバー終了時のハンドラー
  | 'onPressIn'   // 押下開始時のハンドラー
  | 'onPressOut'  // 押下終了時のハンドラー
  | 'onFocus'     // フォーカス取得時のハンドラー
  | 'onBlur'      // フォーカス喪失時のハンドラー
> &
  AccessibilityProps & // アクセシビリティ関連プロパティ
  VariantProps & {     // バリアント制御プロパティ
    testID?: string
    /**
     * For a11y, try to make this descriptive and clear
     * アクセシビリティのため、分かりやすく明確な説明を記述してください
     */
    label: string // ボタンのラベル（アクセシビリティ用）
    style?: StyleProp<ViewStyle>     // 基本スタイル
    hoverStyle?: StyleProp<ViewStyle> // ホバー時のスタイル
    children: NonTextElements | ((context: ButtonContext) => NonTextElements) // 子要素または関数
    PressableComponent?: React.ComponentType<PressableProps> // カスタムPressableコンポーネント
  }

// ButtonTextコンポーネントのプロパティ型定義
export type ButtonTextProps = TextProps & VariantProps & {disabled?: boolean}

// ボタンコンテキスト - 子コンポーネント間でボタンの状態を共有するため
const Context = React.createContext<VariantProps & ButtonState>({
  hovered: false,  // デフォルト: ホバーしていない
  focused: false,  // デフォルト: フォーカスしていない
  pressed: false,  // デフォルト: 押されていない
  disabled: false, // デフォルト: 有効
})
Context.displayName = 'ButtonContext'

/**
 * ボタンコンテキストを取得するフック
 * Gets button context for child components
 */
export function useButtonContext() {
  return React.useContext(Context) // Contextからボタンの現在の状態とプロパティを取得
}

/**
 * 汎用ボタンコンポーネント - 様々なスタイルと状態を持つインタラクティブなボタン
 * Generic button component with various styles and interactive states
 */
export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      children,
      variant,
      color,
      size,
      shape = 'default',
      label,
      disabled = false,
      style,
      hoverStyle: hoverStyleProp,
      PressableComponent = Pressable,
      onPressIn: onPressInOuter,
      onPressOut: onPressOutOuter,
      onHoverIn: onHoverInOuter,
      onHoverOut: onHoverOutOuter,
      onFocus: onFocusOuter,
      onBlur: onBlurOuter,
      ...rest
    },
    ref,
  ) => {
    /**
     * The `variant` prop is deprecated in favor of simply specifying `color`.
     * `variant`プロパティは非推奨となり、単純に`color`を指定することが推奨されています。
     * If a `color` is set, then we want to use the existing codepaths for
     * "solid" buttons. This is to maintain backwards compatibility.
     * `color`が設定されている場合、既存の"solid"ボタンのコードパスを使用します。
     * これは後方互換性を保つためです。
     */
    if (!variant && color) {
      variant = 'solid'
    }

    const t = useTheme() // テーマ取得 - 色やスタイリング情報のため
    // ボタンの状態管理 - ユーザーインタラクションの追跡のため
    const [state, setState] = React.useState({
      pressed: false, // 押下状態
      hovered: false, // ホバー状態
      focused: false, // フォーカス状態
    })

    // 押下開始ハンドラー - 押下状態を更新し外部ハンドラーを呼び出し
    const onPressIn = React.useCallback(
      (e: GestureResponderEvent) => {
        setState(s => ({
          ...s,
          pressed: true, // 押下状態をtrueに設定
        }))
        onPressInOuter?.(e) // 外部から渡されたハンドラーがあれば実行
      },
      [setState, onPressInOuter],
    )
    // 押下終了ハンドラー - 押下状態を解除し外部ハンドラーを呼び出し
    const onPressOut = React.useCallback(
      (e: GestureResponderEvent) => {
        setState(s => ({
          ...s,
          pressed: false, // 押下状態をfalseに設定
        }))
        onPressOutOuter?.(e) // 外部から渡されたハンドラーがあれば実行
      },
      [setState, onPressOutOuter],
    )
    // ホバー開始ハンドラー - ホバー状態を設定し外部ハンドラーを呼び出し
    const onHoverIn = React.useCallback(
      (e: MouseEvent) => {
        setState(s => ({
          ...s,
          hovered: true, // ホバー状態をtrueに設定
        }))
        onHoverInOuter?.(e) // 外部から渡されたハンドラーがあれば実行
      },
      [setState, onHoverInOuter],
    )
    // ホバー終了ハンドラー - ホバー状態を解除し外部ハンドラーを呼び出し
    const onHoverOut = React.useCallback(
      (e: MouseEvent) => {
        setState(s => ({
          ...s,
          hovered: false, // ホバー状態をfalseに設定
        }))
        onHoverOutOuter?.(e) // 外部から渡されたハンドラーがあれば実行
      },
      [setState, onHoverOutOuter],
    )
    // フォーカス取得ハンドラー - フォーカス状態を設定し外部ハンドラーを呼び出し
    const onFocus = React.useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        setState(s => ({
          ...s,
          focused: true, // フォーカス状態をtrueに設定
        }))
        onFocusOuter?.(e) // 外部から渡されたハンドラーがあれば実行
      },
      [setState, onFocusOuter],
    )
    // フォーカス喪失ハンドラー - フォーカス状態を解除し外部ハンドラーを呼び出し
    const onBlur = React.useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        setState(s => ({
          ...s,
          focused: false, // フォーカス状態をfalseに設定
        }))
        onBlurOuter?.(e) // 外部から渡されたハンドラーがあれば実行
      },
      [setState, onBlurOuter],
    )

    // スタイル計算 - バリアント、色、サイズに基づいて動的にスタイルを生成
    const {baseStyles, hoverStyles} = React.useMemo(() => {
      const baseStyles: ViewStyle[] = []  // 基本スタイル配列
      const hoverStyles: ViewStyle[] = [] // ホバー時スタイル配列

      /*
       * This is the happy path for new button styles, following the
       * deprecation of `variant` prop. This redundant `variant` check is here
       * just to make this handling easier to understand.
       * これは新しいボタンスタイルのハッピーパスで、`variant`プロパティの
       * 非推奨化に従っています。この冗長な`variant`チェックは、
       * この処理をより理解しやすくするためにあります。
       */
      if (variant === 'solid') {
        if (color === 'primary') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.primary_500,
            })
            hoverStyles.push({
              backgroundColor: t.palette.primary_600,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.primary_200,
            })
          }
        } else if (color === 'secondary') {
          if (!disabled) {
            baseStyles.push(t.atoms.bg_contrast_25)
            hoverStyles.push(t.atoms.bg_contrast_100)
          } else {
            baseStyles.push(t.atoms.bg_contrast_50)
          }
        } else if (color === 'secondary_inverted') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.contrast_900,
            })
            hoverStyles.push({
              backgroundColor: t.palette.contrast_975,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.contrast_600,
            })
          }
        } else if (color === 'negative') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.negative_500,
            })
            hoverStyles.push({
              backgroundColor: t.palette.negative_600,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.negative_700,
            })
          }
        } else if (color === 'primary_subtle') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.primary_50,
                dim: t.palette.primary_100,
                dark: t.palette.primary_100,
              }),
            })
            hoverStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.primary_100,
                dim: t.palette.primary_200,
                dark: t.palette.primary_200,
              }),
            })
          } else {
            baseStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.primary_25,
                dim: t.palette.primary_50,
                dark: t.palette.primary_50,
              }),
            })
          }
        } else if (color === 'negative_subtle') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.negative_50,
                dim: t.palette.negative_100,
                dark: t.palette.negative_100,
              }),
            })
            hoverStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.negative_100,
                dim: t.palette.negative_200,
                dark: t.palette.negative_200,
              }),
            })
          } else {
            baseStyles.push({
              backgroundColor: select(t.name, {
                light: t.palette.negative_25,
                dim: t.palette.negative_50,
                dark: t.palette.negative_50,
              }),
            })
          }
        }
      } else {
        /*
         * BEGIN DEPRECATED STYLES
         * 非推奨スタイルの開始
         */
        if (color === 'primary') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.primary_500,
              })
              hoverStyles.push(a.border, {
                backgroundColor: t.palette.primary_50,
              })
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.primary_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.primary_100,
              })
            }
          }
        } else if (color === 'secondary') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.contrast_300,
              })
              hoverStyles.push(t.atoms.bg_contrast_50)
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.contrast_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.contrast_25,
              })
            }
          }
        } else if (color === 'secondary_inverted') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.contrast_300,
              })
              hoverStyles.push(t.atoms.bg_contrast_50)
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.contrast_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.contrast_25,
              })
            }
          }
        } else if (color === 'negative') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.negative_500,
              })
              hoverStyles.push(a.border, {
                backgroundColor: t.palette.negative_50,
              })
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.negative_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.negative_100,
              })
            }
          }
        } else if (color === 'negative_subtle') {
          if (variant === 'outline') {
            baseStyles.push(a.border, t.atoms.bg, {
              borderWidth: 1,
            })

            if (!disabled) {
              baseStyles.push(a.border, {
                borderColor: t.palette.negative_500,
              })
              hoverStyles.push(a.border, {
                backgroundColor: t.palette.negative_50,
              })
            } else {
              baseStyles.push(a.border, {
                borderColor: t.palette.negative_200,
              })
            }
          } else if (variant === 'ghost') {
            if (!disabled) {
              baseStyles.push(t.atoms.bg)
              hoverStyles.push({
                backgroundColor: t.palette.negative_100,
              })
            }
          }
        }
        /*
         * END DEPRECATED STYLES
         * 非推奨スタイルの終了
         */
      }

      // デフォルト形状の場合のサイズ別パディング設定
      if (shape === 'default') {
        if (size === 'large') {
          baseStyles.push({
            paddingVertical: 12,   // 縦方向パディング
            paddingHorizontal: 25, // 横方向パディング
            borderRadius: 10,      // 角丸
            gap: 3,               // 子要素間の間隔
          })
        } else if (size === 'small') {
          baseStyles.push({
            paddingVertical: 8,
            paddingHorizontal: 13,
            borderRadius: 8,
            gap: 3,
          })
        } else if (size === 'tiny') {
          baseStyles.push({
            paddingVertical: 5,
            paddingHorizontal: 9,
            borderRadius: 6,
            gap: 2,
          })
        }
      } else if (shape === 'round' || shape === 'square') {
        /*
         * These sizes match the actual rendered size on screen, based on
         * Chrome's web inspector
         * これらのサイズは、Chromeのウェブインスペクターに基づいて
         * 画面上の実際のレンダリングサイズと一致します
         */
        if (size === 'large') {
          if (shape === 'round') {
            baseStyles.push({height: 44, width: 44})
          } else {
            baseStyles.push({height: 44, width: 44})
          }
        } else if (size === 'small') {
          if (shape === 'round') {
            baseStyles.push({height: 33, width: 33})
          } else {
            baseStyles.push({height: 33, width: 33})
          }
        } else if (size === 'tiny') {
          if (shape === 'round') {
            baseStyles.push({height: 25, width: 25})
          } else {
            baseStyles.push({height: 25, width: 25})
          }
        }

        if (shape === 'round') {
          baseStyles.push(a.rounded_full)
        } else if (shape === 'square') {
          if (size === 'tiny') {
            baseStyles.push({
              borderRadius: 6,
            })
          } else {
            baseStyles.push(a.rounded_sm)
          }
        }
      }

      return {
        baseStyles,
        hoverStyles,
      }
    }, [t, variant, color, size, shape, disabled])

    // ボタンコンテキストの作成 - 子コンポーネントで使用される状態とプロパティの組み合わせ
    const context = React.useMemo<ButtonContext>(
      () => ({
        ...state,                    // 現在の状態（hovered, focused, pressed）
        variant,                     // バリアント
        color,                       // 色
        size,                        // サイズ
        disabled: disabled || false, // 無効化状態
      }),
      [state, variant, color, size, disabled],
    )

    // スタイルの結合 - 基本スタイルと外部から渡されたスタイルをマージ
    const flattenedBaseStyles = flatten([baseStyles, style])

    return (
      <PressableComponent
        role="button" // ボタンロールの指定（アクセシビリティ）
        accessibilityHint={undefined} // オプション（アクセシビリティヒント）
        {...rest} // その他のプロパティを展開
        // @ts-ignore - this will always be a pressable
        ref={ref} // 参照の転送
        aria-label={label} // ARIAラベル（Webアクセシビリティ）
        aria-pressed={state.pressed} // ARIA押下状態
        accessibilityLabel={label} // アクセシビリティラベル（ネイティブ）
        disabled={disabled || false} // 無効化状態
        accessibilityState={{
          disabled: disabled || false, // アクセシビリティ状態での無効化フラグ
        }}
        style={[
          a.flex_row,           // 横方向のフレックスレイアウト
          a.align_center,       // 中央揃え（縦方向）
          a.justify_center,     // 中央揃え（横方向）
          a.curve_continuous,   // 連続曲線（角丸効果）
          flattenedBaseStyles,  // 結合された基本スタイル
          // ホバーまたは押下状態の場合、ホバースタイルを適用
          ...(state.hovered || state.pressed
            ? [hoverStyles, flatten(hoverStyleProp)]
            : []),
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        onFocus={onFocus}
        onBlur={onBlur}>
        <Context.Provider value={context}>
          {/* 子要素が関数の場合はコンテキストを渡し、そうでなければそのまま描画 */}
          {typeof children === 'function' ? children(context) : children}
        </Context.Provider>
      </PressableComponent>
    )
  },
)
Button.displayName = 'Button'

/**
 * ボタン内テキストの共有スタイルを取得するフック
 * Gets shared styles for button text based on current button context
 */
export function useSharedButtonTextStyles() {
  const t = useTheme() // テーマ取得
  const {color, variant, disabled, size} = useButtonContext() // ボタンコンテキストから状態とプロパティを取得
  return React.useMemo(() => {
    const baseStyles: TextStyle[] = [] // テキストスタイル配列

    /*
     * This is the happy path for new button styles, following the
     * deprecation of `variant` prop. This redundant `variant` check is here
     * just to make this handling easier to understand.
     * これは新しいボタンスタイルのハッピーパスで、`variant`プロパティの
     * 非推奨化に従っています。この冗長な`variant`チェックは、
     * この処理をより理解しやすくするためにあります。
     */
    if (variant === 'solid') {
      if (color === 'primary') {
        if (!disabled) {
          baseStyles.push({color: t.palette.white})
        } else {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.white,
              dim: t.atoms.text_inverted.color,
              dark: t.atoms.text_inverted.color,
            }),
          })
        }
      } else if (color === 'secondary') {
        if (!disabled) {
          baseStyles.push(t.atoms.text_contrast_medium)
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
          })
        }
      } else if (color === 'secondary_inverted') {
        if (!disabled) {
          baseStyles.push(t.atoms.text_inverted)
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
          })
        }
      } else if (color === 'negative') {
        if (!disabled) {
          baseStyles.push({color: t.palette.white})
        } else {
          baseStyles.push({color: t.palette.negative_300})
        }
      } else if (color === 'primary_subtle') {
        if (!disabled) {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.primary_600,
              dim: t.palette.primary_800,
              dark: t.palette.primary_800,
            }),
          })
        } else {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.primary_200,
              dim: t.palette.primary_200,
              dark: t.palette.primary_200,
            }),
          })
        }
      } else if (color === 'negative_subtle') {
        if (!disabled) {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.negative_600,
              dim: t.palette.negative_800,
              dark: t.palette.negative_800,
            }),
          })
        } else {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.negative_200,
              dim: t.palette.negative_200,
              dark: t.palette.negative_200,
            }),
          })
        }
      }
    } else {
      /*
       * BEGIN DEPRECATED STYLES
       * 非推奨スタイルの開始
       */
      if (color === 'primary') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.primary_600,
            })
          } else {
            baseStyles.push({color: t.palette.primary_600, opacity: 0.5})
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({color: t.palette.primary_600})
          } else {
            baseStyles.push({color: t.palette.primary_600, opacity: 0.5})
          }
        }
      } else if (color === 'secondary') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.contrast_600,
            })
          } else {
            baseStyles.push({
              color: t.palette.contrast_300,
            })
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.contrast_600,
            })
          } else {
            baseStyles.push({
              color: t.palette.contrast_300,
            })
          }
        }
      } else if (color === 'secondary_inverted') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.contrast_600,
            })
          } else {
            baseStyles.push({
              color: t.palette.contrast_300,
            })
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({
              color: t.palette.contrast_600,
            })
          } else {
            baseStyles.push({
              color: t.palette.contrast_300,
            })
          }
        }
      } else if (color === 'negative') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({color: t.palette.negative_400})
          } else {
            baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({color: t.palette.negative_400})
          } else {
            baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
          }
        }
      } else if (color === 'negative_subtle') {
        if (variant === 'outline') {
          if (!disabled) {
            baseStyles.push({color: t.palette.negative_400})
          } else {
            baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push({color: t.palette.negative_400})
          } else {
            baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
          }
        }
      }
      /*
       * END DEPRECATED STYLES
       * 非推奨スタイルの終了
       */
    }

    // サイズ別フォントスタイル設定
    if (size === 'large') {
      baseStyles.push(a.text_md, a.leading_snug, a.font_medium) // 大サイズ: 中フォント、スナッグ行間、ミディアム太さ
    } else if (size === 'small') {
      baseStyles.push(a.text_sm, a.leading_snug, a.font_medium) // 小サイズ: 小フォント、スナッグ行間、ミディアム太さ
    } else if (size === 'tiny') {
      baseStyles.push(a.text_xs, a.leading_snug, a.font_medium) // 極小サイズ: 極小フォント、スナッグ行間、ミディアム太さ
    }

    return StyleSheet.flatten(baseStyles) // スタイル配列をフラット化して返す
  }, [t, variant, color, size, disabled]) // 依存関係: テーマ、バリアント、色、サイズ、無効化状態
}

/**
 * ボタン内のテキストコンポーネント
 * Button text component with proper styling based on button context
 */
export function ButtonText({children, style, ...rest}: ButtonTextProps) {
  const textStyles = useSharedButtonTextStyles() // 共有テキストスタイルを取得

  return (
    <Text {...rest} style={[a.text_center, textStyles, style]}>
      {children}
    </Text>
  )
}

/**
 * ボタン内のアイコンコンポーネント
 * Button icon component with proper sizing and styling based on button context
 */
export function ButtonIcon({
  icon: Comp,
  size,
}: {
  icon: React.ComponentType<SVGIconProps> // SVGアイコンコンポーネント
  /**
   * @deprecated no longer needed
   * @deprecated もう必要ありません
   */
  position?: 'left' | 'right' // 位置指定（非推奨）
  size?: SVGIconProps['size'] // アイコンサイズ
}) {
  const {size: buttonSize} = useButtonContext() // ボタンサイズを取得
  const textStyles = useSharedButtonTextStyles() // テキストスタイルを取得（色情報のため）
  // アイコンサイズとコンテナサイズの計算
  const {iconSize, iconContainerSize} = React.useMemo(() => {
    /**
     * Pre-set icon sizes for different button sizes
     * 異なるボタンサイズに対する事前設定アイコンサイズ
     */
    const iconSizeShorthand =
      size ??
      (({
        large: 'md', // 大ボタン: 中アイコン
        small: 'sm', // 小ボタン: 小アイコン
        tiny: 'xs',  // 極小ボタン: 極小アイコン
      }[buttonSize || 'small'] || 'sm') as Exclude<
        SVGIconProps['size'],
        undefined
      >)

    /*
     * Copied here from icons/common.tsx so we can tweak if we need to, but
     * also so that we can calculate transforms.
     * icons/common.tsxからコピーしたもので、必要に応じて調整できるように、
     * また変形計算を行えるようにしています。
     */
    // アイコンサイズマッピング
    const iconSize = {
      xs: 12,    // 極小: 12px
      sm: 16,    // 小: 16px
      md: 18,    // 中: 18px
      lg: 24,    // 大: 24px
      xl: 28,    // 特大: 28px
      '2xl': 32, // 超特大: 32px
    }[iconSizeShorthand]

    /*
     * Goal here is to match rendered text size so that different size icons
     * don't increase button size
     * ここでの目標は、レンダリングされたテキストサイズに合わせることで、
     * 異なるサイズのアイコンがボタンサイズを増加させないようにすることです。
     */
    const iconContainerSize = {
      large: 20, // 大ボタン: 20px
      small: 17, // 小ボタン: 17px
      tiny: 15,  // 極小ボタン: 15px
    }[buttonSize || 'small']

    return {
      iconSize,           // 実際のアイコンサイズ
      iconContainerSize,  // アイコンコンテナサイズ
    }
  }, [buttonSize, size]) // 依存関係: ボタンサイズ、指定されたサイズ

  return (
    <View
      style={[
        a.z_20, // 高いz-index（重なり順序）
        {
          width: iconContainerSize,  // コンテナ幅
          height: iconContainerSize, // コンテナ高さ
        },
      ]}>
      <View
        style={[
          a.absolute, // 絶対位置指定
          {
            width: iconSize,   // アイコン幅
            height: iconSize,  // アイコン高さ
            top: '50%',       // 上から50%の位置
            left: '50%',      // 左から50%の位置
            transform: [
              {
                translateX: (iconSize / 2) * -1, // X軸方向の中央寄せ調整
              },
              {
                translateY: (iconSize / 2) * -1, // Y軸方向の中央寄せ調整
              },
            ],
          },
        ]}>
        <Comp
          width={iconSize} // アイコンの幅を設定
          style={[
            {
              color: textStyles.color,  // ボタンテキストと同じ色を適用
              pointerEvents: 'none',    // ポインターイベントを無効化
            },
          ]}
        />
      </View>
    </View>
  )
}
