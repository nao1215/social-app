/**
 * ミニマルシェルトランスフォームフック
 *
 * 【概要】
 * スクロール時のヘッダー/フッター非表示アニメーションを提供。
 * コンテンツ閲覧時に画面を広く使うための「ミニマルモード」を実現。
 *
 * 【動作原理】
 * - headerMode/footerMode: 0（表示）〜 1（非表示）の値
 * - interpolate: 値を座標変換（0→表示位置、1→画面外）
 * - opacity: 2乗で減衰（よりスムーズなフェードアウト）
 *
 * 【フック分離の理由】
 * useAnimatedStyleは使用するたびにコストがかかるため、
 * 必要なトランスフォームのみを個別に取得できるよう分離。
 *
 * 【アニメーション詳細】
 * - ヘッダー: 上方向にスライドアウト（-headerHeight）
 * - フッター: 下方向にスライドアウト（+footerHeight）
 * - FAB: フッターに連動して下方向に移動
 *
 * 【Goユーザー向け補足】
 * - useAnimatedStyle: アニメーション値をスタイルに変換するReanimatedフック
 * - interpolate: 値の範囲変換（Goのmath.Lerpに相当）
 * - SharedValue: JSスレッドとUIスレッド間で共有される値
 */
import {interpolate, useAnimatedStyle} from 'react-native-reanimated'

import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'

/**
 * ヘッダーのトランスフォームスタイルを取得
 *
 * 【動作】
 * - headerMode=0: 通常表示（opacity=1, translateY=0）
 * - headerMode=1: 完全非表示（opacity=0, translateY=-headerHeight）
 *
 * @returns ヘッダーに適用するAnimatedStyle
 */
export function useMinimalShellHeaderTransform() {
  const {headerMode} = useMinimalShellMode()
  const {headerHeight} = useShellLayout()

  const headerTransform = useAnimatedStyle(() => {
    const headerModeValue = headerMode.get()
    return {
      pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - headerModeValue, 2),
      transform: [
        {
          translateY: interpolate(
            headerModeValue,
            [0, 1],
            [0, -headerHeight.get()],
          ),
        },
      ],
    }
  })

  return headerTransform
}

export function useMinimalShellFooterTransform() {
  const {footerMode} = useMinimalShellMode()
  const {footerHeight} = useShellLayout()

  const footerTransform = useAnimatedStyle(() => {
    const footerModeValue = footerMode.get()
    return {
      pointerEvents: footerModeValue === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - footerModeValue, 2),
      transform: [
        {
          translateY: interpolate(
            footerModeValue,
            [0, 1],
            [0, footerHeight.get()],
          ),
        },
      ],
    }
  })

  return footerTransform
}

export function useMinimalShellFabTransform() {
  const {footerMode} = useMinimalShellMode()

  const fabTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(footerMode.get(), [0, 1], [-44, 0]),
        },
      ],
    }
  })
  return fabTransform
}
