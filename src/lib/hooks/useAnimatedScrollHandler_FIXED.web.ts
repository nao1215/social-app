/**
 * アニメーションスクロールハンドラーフック（Web版・バグ修正版）
 *
 * 【概要】
 * ReanimatedのスクロールハンドラーのWeb環境向けバグ修正版。
 * コンフィグの変更を適切に反映するようにラップ。
 *
 * 【修正内容】
 * - Web版のReanimatedスクロールハンドラーは設定の更新を正しく検知しない
 * - useRefで最新の設定を保持し、各イベントで参照
 * - これにより依存配列の変更が正しく反映される
 *
 * 【ラップされるイベント】
 * - onBeginDrag: ドラッグ開始
 * - onEndDrag: ドラッグ終了
 * - onMomentumBegin: 慣性スクロール開始
 * - onMomentumEnd: 慣性スクロール終了
 * - onScroll: スクロール中
 *
 * 【Goユーザー向け補足】
 * - useRef: 再レンダリング間で値を保持（Goのグローバル変数に相当）
 * - typeof X: 型の取得（GoのTypeOfに相当）
 * - ctx: コンテキストオブジェクト（Goのcontext.Contextに類似）
 */
import {useEffect, useRef} from 'react'
import {useAnimatedScrollHandler as useAnimatedScrollHandler_BUGGY} from 'react-native-reanimated'

/**
 * Web環境向けのバグ修正版スクロールハンドラー
 *
 * @param config スクロールイベントの設定
 * @param deps 依存配列
 * @returns アニメーションスクロールハンドラー
 */
export const useAnimatedScrollHandler: typeof useAnimatedScrollHandler_BUGGY = (
  config,
  deps,
) => {
  const ref = useRef(config)
  useEffect(() => {
    ref.current = config
  })
  return useAnimatedScrollHandler_BUGGY(
    {
      onBeginDrag(e, ctx) {
        if (typeof ref.current !== 'function' && ref.current.onBeginDrag) {
          ref.current.onBeginDrag(e, ctx)
        }
      },
      onEndDrag(e, ctx) {
        if (typeof ref.current !== 'function' && ref.current.onEndDrag) {
          ref.current.onEndDrag(e, ctx)
        }
      },
      onMomentumBegin(e, ctx) {
        if (typeof ref.current !== 'function' && ref.current.onMomentumBegin) {
          ref.current.onMomentumBegin(e, ctx)
        }
      },
      onMomentumEnd(e, ctx) {
        if (typeof ref.current !== 'function' && ref.current.onMomentumEnd) {
          ref.current.onMomentumEnd(e, ctx)
        }
      },
      onScroll(e, ctx) {
        if (typeof ref.current === 'function') {
          ref.current(e, ctx)
        } else if (ref.current.onScroll) {
          ref.current.onScroll(e, ctx)
        }
      },
    },
    deps,
  )
}
