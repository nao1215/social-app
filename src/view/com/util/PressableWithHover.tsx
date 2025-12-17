/**
 * ホバースタイル対応Pressableコンポーネント
 * Pressable Component with Hover Style Support
 *
 * 【概要】
 * マウスホバー時に追加スタイルを適用できるPressableコンポーネント。
 * Web/デスクトップでのホバーインタラクションを実現。
 *
 * 【使用場面】
 * - Web版でのボタンホバーエフェクト
 * - リストアイテムのホバーハイライト
 * - インタラクティブ要素のフィードバック
 *
 * 【Goユーザー向け補足】
 * - forwardRef: 親から子へのref転送（Goのポインタ渡しに似る）
 * - useInteractionState: ホバー状態を管理するカスタムフック
 * - Pressable: タッチ/クリック可能な基本コンポーネント
 *
 * 【動作原理】
 * 1. マウスがコンポーネント上に入る → onHoverIn発火 → hovered = true
 * 2. hovered時にhoverStyleを通常styleにマージ
 * 3. マウスがコンポーネントから出る → onHoverOut発火 → hovered = false
 */

// ref転送と子要素型のユーティリティ
// Ref forwarding and children type utility
import {forwardRef, PropsWithChildren} from 'react'

// React Nativeの基本コンポーネント
// React Native basic components
import {Pressable, PressableProps, StyleProp, ViewStyle} from 'react-native'
import {View} from 'react-native'

// スタイル追加ユーティリティ
// Style addition utility
import {addStyle} from '#/lib/styles'

// インタラクション状態管理フック
// Interaction state management hook
import {useInteractionState} from '#/components/hooks/useInteractionState'

/**
 * PressableWithHoverのProps型
 * PressableWithHover Props type
 *
 * PressablePropsを拡張し、hoverStyleプロパティを追加
 */
interface PressableWithHover extends PressableProps {
  /** ホバー時に適用する追加スタイル / Style to apply on hover */
  hoverStyle: StyleProp<ViewStyle>
}

/**
 * ホバースタイル対応Pressable
 * Pressable with Hover Style
 *
 * 【使用例】
 * ```tsx
 * <PressableWithHover
 *   style={styles.button}
 *   hoverStyle={{ backgroundColor: 'lightblue' }}
 *   onPress={() => console.log('Pressed!')}>
 *   <Text>Hover me</Text>
 * </PressableWithHover>
 * ```
 */
export const PressableWithHover = forwardRef<
  View,
  PropsWithChildren<PressableWithHover>
>(function PressableWithHoverImpl(
  {children, style, hoverStyle, ...props},
  ref,
) {
  // ホバー状態を管理
  // Manage hover state
  const {
    state: hovered, // 現在ホバー中かどうか / Whether currently hovered
    onIn: onHoverIn, // ホバー開始時のコールバック / Callback on hover start
    onOut: onHoverOut, // ホバー終了時のコールバック / Callback on hover end
  } = useInteractionState()

  return (
    <Pressable
      {...props}
      style={
        // styleが関数でなく、かつホバー中の場合のみhoverStyleを追加
        // Add hoverStyle only if style is not a function and currently hovered
        typeof style !== 'function' && hovered
          ? addStyle(style, hoverStyle)
          : style
      }
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      ref={ref}>
      {children}
    </Pressable>
  )
})
