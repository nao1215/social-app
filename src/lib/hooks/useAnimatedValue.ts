/**
 * アニメーション値フック
 *
 * 【概要】
 * React NativeのAnimated.Valueをフック化。
 * 再レンダリング時も同じインスタンスを保持する遅延初期化パターン。
 *
 * 【遅延初期化の意味】
 * - useRef内で条件付きで初期化することで、最初の呼び出しでのみ生成
 * - 再レンダリング時は既存のインスタンスを再利用
 * - メモリ効率とパフォーマンスの最適化
 *
 * 【Animated.Valueとは】
 * React Nativeのアニメーション駆動値。
 * 値の変化をUIスレッドで直接処理し、スムーズなアニメーションを実現。
 *
 * 【使用例】
 * const opacity = useAnimatedValue(0)
 * Animated.timing(opacity, {toValue: 1, duration: 300}).start()
 *
 * 【Goユーザー向け補足】
 * - useRef: 再レンダリング間で値を保持（Goのグローバル変数に相当）
 * - 遅延初期化: Goのsync.Onceパターンに類似
 * - Animated.Value: Goのatomic.Valueに概念的に近い
 */
import * as React from 'react'
import {Animated} from 'react-native'

/**
 * アニメーション用の値を遅延初期化して返すフック
 *
 * @param initialValue 初期値
 * @returns Animated.Valueインスタンス
 */
export function useAnimatedValue(initialValue: number) {
  const lazyRef = React.useRef<Animated.Value>()

  if (lazyRef.current === undefined) {
    lazyRef.current = new Animated.Value(initialValue)
  }

  return lazyRef.current as Animated.Value
}
