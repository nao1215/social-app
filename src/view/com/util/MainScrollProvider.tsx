/**
 * メインスクロールプロバイダー
 * Main Scroll Provider
 *
 * 【概要】
 * アプリのメインスクロール領域のスクロールイベントを監視し、
 * ヘッダー/フッターの表示・非表示を制御するプロバイダーコンポーネント。
 *
 * 【主な機能】
 * - スクロール方向の検出
 * - ヘッダーの自動表示/非表示
 * - スクロール位置に応じたアニメーション
 * - Web/Native両対応
 *
 * 【動作原理】
 * - 下スクロール: ヘッダーを隠す（コンテンツ領域を広げる）
 * - 上スクロール: ヘッダーを表示
 * - ページ上部付近: 常にヘッダー表示
 *
 * 【Goユーザー向け補足】
 * - useSharedValue: UIスレッドとJSスレッド間で共有される値
 *   Goのatomic.Valueに似た同期プリミティブ
 * - worklet: UIスレッドで実行される高速な関数
 * - EventEmitter: Goのchannelに似たイベント通知機構
 * - interpolate: 値の補間（線形変換）
 */

// Reactコア
// React core
import React, {useCallback, useEffect} from 'react'

// React Nativeのスクロールイベント型
// React Native scroll event type
import {NativeScrollEvent} from 'react-native'

// Reanimated（アニメーション、共有値、スプリング効果）
// Reanimated (animation, shared value, spring effect)
import {interpolate, useSharedValue, withSpring} from 'react-native-reanimated'

// イベントエミッター（イベント通知）
// Event emitter (event notification)
import EventEmitter from 'eventemitter3'

// スクロールコンテキストプロバイダー
// Scroll context provider
import {ScrollProvider} from '#/lib/ScrollContext'

// プラットフォーム検出
// Platform detection
import {isNative, isWeb} from '#/platform/detection'

// ミニマルシェルモードフック（ヘッダー表示状態）
// Minimal shell mode hook (header visibility state)
import {useMinimalShellMode} from '#/state/shell'

// シェルレイアウトフック（ヘッダー高さ等）
// Shell layout hook (header height, etc.)
import {useShellLayout} from '#/state/shell/shell-layout'

/**
 * Webでヘッダーを隠すスクロール閾値（ピクセル）
 * Scroll threshold to hide header on Web (pixels)
 *
 * この値未満のスクロール位置ではヘッダーを常に表示
 */
const WEB_HIDE_SHELL_THRESHOLD = 200

function clamp(num: number, min: number, max: number) {
  'worklet'
  return Math.min(Math.max(num, min), max)
}

export function MainScrollProvider({children}: {children: React.ReactNode}) {
  const {headerHeight} = useShellLayout()
  const {headerMode} = useMinimalShellMode()
  const startDragOffset = useSharedValue<number | null>(null)
  const startMode = useSharedValue<number | null>(null)
  const didJustRestoreScroll = useSharedValue<boolean>(false)

  const setMode = React.useCallback(
    (v: boolean) => {
      'worklet'
      headerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        }),
      )
    },
    [headerMode],
  )

  useEffect(() => {
    if (isWeb) {
      return listenToForcedWindowScroll(() => {
        startDragOffset.set(null)
        startMode.set(null)
        didJustRestoreScroll.set(true)
      })
    }
  })

  const snapToClosestState = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      const offsetY = Math.max(0, e.contentOffset.y)
      if (isNative) {
        const startDragOffsetValue = startDragOffset.get()
        if (startDragOffsetValue === null) {
          return
        }
        const didScrollDown = offsetY > startDragOffsetValue
        startDragOffset.set(null)
        startMode.set(null)
        if (offsetY < headerHeight.get()) {
          // If we're close to the top, show the shell.
          setMode(false)
        } else if (didScrollDown) {
          // Showing the bar again on scroll down feels annoying, so don't.
          setMode(true)
        } else {
          // Snap to whichever state is the closest.
          setMode(Math.round(headerMode.get()) === 1)
        }
      }
    },
    [startDragOffset, startMode, setMode, headerMode, headerHeight],
  )

  const onBeginDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      const offsetY = Math.max(0, e.contentOffset.y)
      if (isNative) {
        startDragOffset.set(offsetY)
        startMode.set(headerMode.get())
      }
    },
    [headerMode, startDragOffset, startMode],
  )

  const onEndDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      if (isNative) {
        if (e.velocity && e.velocity.y !== 0) {
          // If we detect a velocity, wait for onMomentumEnd to snap.
          return
        }
        snapToClosestState(e)
      }
    },
    [snapToClosestState],
  )

  const onMomentumEnd = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      if (isNative) {
        snapToClosestState(e)
      }
    },
    [snapToClosestState],
  )

  const onScroll = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      const offsetY = Math.max(0, e.contentOffset.y)
      if (isNative) {
        const startDragOffsetValue = startDragOffset.get()
        const startModeValue = startMode.get()
        if (startDragOffsetValue === null || startModeValue === null) {
          if (headerMode.get() !== 0 && offsetY < headerHeight.get()) {
            // If we're close enough to the top, always show the shell.
            // Even if we're not dragging.
            setMode(false)
          }
          return
        }

        // The "mode" value is always between 0 and 1.
        // Figure out how much to move it based on the current dragged distance.
        const dy = offsetY - startDragOffsetValue
        const dProgress = interpolate(
          dy,
          [-headerHeight.get(), headerHeight.get()],
          [-1, 1],
        )
        const newValue = clamp(startModeValue + dProgress, 0, 1)
        if (newValue !== headerMode.get()) {
          // Manually adjust the value. This won't be (and shouldn't be) animated.
          headerMode.set(newValue)
        }
      } else {
        if (didJustRestoreScroll.get()) {
          didJustRestoreScroll.set(false)
          // Don't hide/show navbar based on scroll restoratoin.
          return
        }
        // On the web, we don't try to follow the drag because we don't know when it ends.
        // Instead, show/hide immediately based on whether we're scrolling up or down.
        const dy = offsetY - (startDragOffset.get() ?? 0)
        startDragOffset.set(offsetY)

        if (dy < 0 || offsetY < WEB_HIDE_SHELL_THRESHOLD) {
          setMode(false)
        } else if (dy > 0) {
          setMode(true)
        }
      }
    },
    [
      headerHeight,
      headerMode,
      setMode,
      startDragOffset,
      startMode,
      didJustRestoreScroll,
    ],
  )

  return (
    <ScrollProvider
      onBeginDrag={onBeginDrag}
      onEndDrag={onEndDrag}
      onScroll={onScroll}
      onMomentumEnd={onMomentumEnd}>
      {children}
    </ScrollProvider>
  )
}

const emitter = new EventEmitter()

if (isWeb) {
  const originalScroll = window.scroll
  window.scroll = function () {
    emitter.emit('forced-scroll')
    return originalScroll.apply(this, arguments as any)
  }

  const originalScrollTo = window.scrollTo
  window.scrollTo = function () {
    emitter.emit('forced-scroll')
    return originalScrollTo.apply(this, arguments as any)
  }
}

function listenToForcedWindowScroll(listener: () => void) {
  emitter.addListener('forced-scroll', listener)
  return () => {
    emitter.removeListener('forced-scroll', listener)
  }
}
