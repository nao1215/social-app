/**
 * ボトムバーオフセット計算フック
 *
 * 【概要】
 * 画面下部のナビゲーションバー分のオフセットを計算。
 * リストの最終アイテムがボトムバーに隠れないようにするために使用。
 *
 * 【計算ロジック】
 * - Web（タブレット/デスクトップ）: 0（ボトムバーなし）
 * - モバイル: 60px + セーフエリア（60〜75pxにクランプ）
 *
 * 【セーフエリアとは】
 * - iPhone X以降のホームインジケーター領域
 * - Androidのナビゲーションバー領域
 * - これらを考慮してコンテンツを配置
 *
 * 【使用例】
 * const bottomOffset = useBottomBarOffset()
 * <FlatList contentContainerStyle={{paddingBottom: bottomOffset}} />
 *
 * 【Goユーザー向け補足】
 * - clamp: 値を範囲内に収める（Goのmath.Min/Maxの組み合わせ）
 * - 三項演算子: Goのif-elseに相当
 */
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {isWeb} from '#/platform/detection'

/**
 * ボトムバーの高さを考慮したオフセットを取得するフック
 *
 * @param modifier 追加のオフセット値（デフォルト: 0）
 * @returns ボトムバー分のオフセット（ピクセル）
 */
export function useBottomBarOffset(modifier: number = 0) {
  const {isTabletOrDesktop} = useWebMediaQueries()
  const {bottom: bottomInset} = useSafeAreaInsets()
  return (
    (isWeb && isTabletOrDesktop ? 0 : clamp(60 + bottomInset, 60, 75)) +
    modifier
  )
}
