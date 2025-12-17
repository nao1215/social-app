/**
 * ドラッグ可能スクロールビューフック
 *
 * 【概要】
 * Web環境でマウスドラッグによる水平スクロールを実現。
 * デスクトップブラウザでタッチスクロールのようなUXを提供。
 *
 * 【動作原理】
 * 1. mousedown: ドラッグ開始位置を記録
 * 2. mousemove: ドラッグ中は scrollLeft を更新
 * 3. mouseup: ドラッグ終了、クリックイベントをブロック
 *
 * 【ドラッグ判定】
 * - 3px以上の移動でドラッグとみなす
 * - それ以下はクリックとして通常処理
 *
 * 【プラットフォーム対応】
 * - Web: マウスイベントでドラッグスクロール実装
 * - ネイティブ: 何もしない（標準のタッチスクロール使用）
 *
 * 【使用例】
 * const {refs} = useDraggableScroll({cursor: 'grab'})
 * <ScrollView ref={refs} horizontal>...</ScrollView>
 *
 * 【Goユーザー向け補足】
 * - addEventListener: Goのnet/http HandlerFuncに相当するイベント登録
 * - removeEventListener: クリーンアップ（Goのdefer相当）
 * - mergeRefs: 複数のrefを1つに統合するユーティリティ
 */
import {type ForwardedRef, useEffect, useMemo, useRef} from 'react'
import {type ScrollView} from 'react-native'
import {Platform} from 'react-native'

import {mergeRefs} from '#/lib/merge-refs'

/**
 * フックのプロパティ型定義
 * @template Scrollable スクロール可能な要素の型
 */
type Props<Scrollable extends ScrollView = ScrollView> = {
  cursor?: string                        // ドラッグ中のカーソルスタイル
  outerRef?: ForwardedRef<Scrollable>    // 外部から渡されるref
}

/**
 * マウスドラッグでスクロール可能にするフック
 *
 * @template Scrollable スクロールビューの型
 * @param cursor ドラッグ中のカーソル（デフォルト: 'grab'）
 * @param outerRef 外部から渡されるref
 * @returns refs: マージされたref
 */
export function useDraggableScroll<Scrollable extends ScrollView = ScrollView>({
  outerRef,
  cursor = 'grab',
}: Props<Scrollable> = {}) {
  const ref = useRef<Scrollable>(null)

  useEffect(() => {
    if (Platform.OS !== 'web' || !ref.current) {
      return
    }
    const slider = ref.current as unknown as HTMLDivElement
    let isDragging = false
    let isMouseDown = false
    let startX = 0
    let scrollLeft = 0

    const mouseDown = (e: MouseEvent) => {
      isMouseDown = true
      startX = e.pageX - slider.offsetLeft
      scrollLeft = slider.scrollLeft

      slider.style.cursor = cursor
    }

    const mouseUp = () => {
      if (isDragging) {
        slider.addEventListener('click', e => e.stopPropagation(), {once: true})
      }

      isMouseDown = false
      isDragging = false
      slider.style.cursor = 'default'
    }

    const mouseMove = (e: MouseEvent) => {
      if (!isMouseDown) {
        return
      }

      // Require n pixels momement before start of drag (3 in this case )
      const x = e.pageX - slider.offsetLeft
      if (Math.abs(x - startX) < 3) {
        return
      }

      isDragging = true
      e.preventDefault()
      const walk = x - startX
      slider.scrollLeft = scrollLeft - walk

      if (slider.contains(document.activeElement))
        (document.activeElement as HTMLElement)?.blur?.()
    }

    slider.addEventListener('mousedown', mouseDown)
    window.addEventListener('mouseup', mouseUp)
    window.addEventListener('mousemove', mouseMove)

    return () => {
      slider.removeEventListener('mousedown', mouseDown)
      window.removeEventListener('mouseup', mouseUp)
      window.removeEventListener('mousemove', mouseMove)
    }
  }, [cursor])

  const refs = useMemo(
    () => mergeRefs(outerRef ? [ref, outerRef] : [ref]),
    [ref, outerRef],
  )

  return {
    refs,
  }
}
