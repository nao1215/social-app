/**
 * 基本ビューコンポーネント集（ネイティブ版）
 * Basic View Components Collection (Native Version)
 *
 * 【概要】
 * React Native Reanimatedのアニメーション対応コンポーネントを
 * アプリ内で統一的に使用するためのラッパー/エクスポート。
 *
 * 【主な機能】
 * - FlatList: 仮想化リスト（内部用）
 * - ScrollView: スクロール可能ビュー（非推奨）
 * - CenteredView: 中央寄せビュー（非推奨）
 *
 * 【Goユーザー向け補足】
 * - forwardRef: ref（参照）を子コンポーネントに転送（ポインタ渡しに似る）
 * - Animated.FlatList: アニメーション対応の仮想化リスト
 * - Omit<T, K>: 型Tからプロパティを除外（構造体の一部フィールドを隠すのに似る）
 *
 * 【注意】
 * このファイルの関数を展開する場合はforwardRefを忘れずに！
 * If you explode these into functions, don't forget to forwardRef!
 */

// ref転送ユーティリティ
// Ref forwarding utility
import {forwardRef} from 'react'

// React NativeのFlatListコンポーネント型
// React Native FlatList component type
import {FlatListComponent} from 'react-native'

// 基本Viewとそのprops型
// Basic View and its props type
import {View, ViewProps} from 'react-native'

// Reanimated（アニメーション対応コンポーネント）
// Reanimated (animation-enabled components)
import Animated from 'react-native-reanimated'

// FlatListのprops型（レイアウト対応）
// FlatList props type (with layout support)
import {FlatListPropsWithLayout} from 'react-native-reanimated'

/**
 * 内部用FlatListコンポーネント
 * Internal FlatList Component
 *
 * 【注意】
 * 可能な限りListコンポーネントを使用すること。
 * FlatList_INTERNALの型定義には一部問題がある。
 *
 * Avoid using `FlatList_INTERNAL` and use `List` where possible.
 * The types are a bit wrong on `FlatList_INTERNAL`
 */
export const FlatList_INTERNAL = Animated.FlatList

/**
 * FlatList_INTERNALの型定義
 * FlatList_INTERNAL type definition
 *
 * CellRendererComponentを除外（型の互換性問題のため）
 */
export type FlatList_INTERNAL<ItemT = any> = Omit<
  FlatListComponent<ItemT, FlatListPropsWithLayout<ItemT>>,
  'CellRendererComponent'
>

/**
 * スクロールビューコンポーネント
 * ScrollView Component
 *
 * @deprecated Layoutコンポーネントを使用してください / use `Layout` components
 */
export const ScrollView = Animated.ScrollView

/**
 * ScrollViewの型定義
 * ScrollView type definition
 */
export type ScrollView = typeof Animated.ScrollView

/**
 * 中央寄せビューコンポーネント
 * Centered View Component
 *
 * 【概要】
 * ネイティブ版では単純なViewラッパー。
 * Web版ではコンテンツを中央に配置する追加スタイルを適用。
 *
 * @deprecated Layoutコンポーネントを使用してください / use `Layout` components
 */
export const CenteredView = forwardRef<
  View,
  React.PropsWithChildren<
    ViewProps & {
      /** サイドボーダー表示 / Show side borders */
      sideBorders?: boolean
      /** トップボーダー表示 / Show top border */
      topBorder?: boolean
    }
  >
>(function CenteredView(props, ref) {
  // ネイティブでは単純なView（Web版でスタイル追加）
  // Simple View on native (Web version adds styles)
  return <View ref={ref} {...props} />
})
