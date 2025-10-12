import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useWindowDimensions, View } from 'react-native'
import Animated, { Easing, ZoomIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { atoms as a, select, useTheme } from '#/alf'
import { useOnGesture } from '#/components/hooks/useOnGesture'
import { Portal } from '#/components/Portal'
import {
  ARROW_HALF_SIZE,
  ARROW_SIZE,
  BUBBLE_MAX_WIDTH,
  MIN_EDGE_SPACE,
} from '#/components/Tooltip/const'
import { Text } from '#/components/Typography'

/**
 * Tooltipコンポーネントはターゲット要素の座標計測を利用してネイティブUI上の吹き出しを表示する。
 */
const ARROW_VISUAL_OFFSET = ARROW_SIZE / 1.25 // 視覚的な中心合わせのため先端位置を微調整
const BUBBLE_SHADOW_OFFSET = ARROW_SIZE / 3 // 先端下に影が落ちるよう影の開始位置を調整

type TooltipContextType = {
  position: 'top' | 'bottom'
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}

type TargetMeasurements = {
  x: number
  y: number
  width: number
  height: number
}

type TargetContextType = {
  targetMeasurements: TargetMeasurements | undefined
  setTargetMeasurements: (measurements: TargetMeasurements) => void
  shouldMeasure: boolean
}

const TooltipContext = createContext<TooltipContextType>({
  position: 'bottom',
  visible: false,
  onVisibleChange: () => { },
})
TooltipContext.displayName = 'TooltipContext'

const TargetContext = createContext<TargetContextType>({
  targetMeasurements: undefined,
  setTargetMeasurements: () => { },
  shouldMeasure: false,
})
TargetContext.displayName = 'TargetContext'

/**
 * Outerはツールチップの表示状態とターゲット計測結果をコンテキスト経由で子要素に共有する。
 */
export function Outer({
  children,
  position = 'bottom',
  visible: requestVisible,
  onVisibleChange,
}: {
  children: React.ReactNode
  position?: 'top' | 'bottom'
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}) {
  /**
   * 外部入力に合わせつつターゲット計測完了までは表示を保留する遅延用ステート。
   */
  const [visible, setVisible] = useState<boolean>(false)
  const [targetMeasurements, setTargetMeasurements] = useState<
    | {
      x: number
      y: number
      width: number
      height: number
    }
    | undefined
  >(undefined)

  if (requestVisible && !visible && targetMeasurements) {
    setVisible(true)
  } else if (!requestVisible && visible) {
    setVisible(false)
    setTargetMeasurements(undefined)
  }

  const ctx = useMemo(
    () => ({ position, visible, onVisibleChange }),
    [position, visible, onVisibleChange],
  )
  const targetCtx = useMemo(
    () => ({
      targetMeasurements,
      setTargetMeasurements,
      shouldMeasure: requestVisible,
    }),
    [requestVisible, targetMeasurements, setTargetMeasurements],
  )

  return (
    <TooltipContext.Provider value={ctx}>
      <TargetContext.Provider value={targetCtx}>
        {children}
      </TargetContext.Provider>
    </TooltipContext.Provider>
  )
}

/**
 * Targetは計測対象となる子要素を保持し、必要時にネイティブ座標を取得する。
 */
export function Target({ children }: { children: React.ReactNode }) {
  const { shouldMeasure, setTargetMeasurements } = useContext(TargetContext)
  const targetRef = useRef<View>(null)

  useEffect(() => {
    if (!shouldMeasure) return
    /*
     * ツールチップ表示のタイミングでターゲットのサイズと位置を測定する。
     */
    targetRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      if (pageX !== undefined && pageY !== undefined && width && height) {
        setTargetMeasurements({ x: pageX, y: pageY, width, height })
      }
    })
  }, [shouldMeasure, setTargetMeasurements])

  return (
    <View collapsable={false} ref={targetRef}>
      {children}
    </View>
  )
}

/**
 * Contentはコンテキストの状態に応じてPortal内に吹き出しを描画する。
 */
export function Content({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  const { position, visible, onVisibleChange } = useContext(TooltipContext)
  const { targetMeasurements } = useContext(TargetContext)
  const requestClose = useCallback(() => {
    onVisibleChange(false)
  }, [onVisibleChange])

  if (!visible || !targetMeasurements) return null

  return (
    <Portal>
      <Bubble
        label={label}
        position={position}
        /*
         * Portal配下ではコンテキストが届かないため計測情報と閉じる処理を明示的に渡す。
         */
        targetMeasurements={targetMeasurements}
        requestClose={requestClose}>
        {children}
      </Bubble>
    </Portal>
  )
}

/**
 * Bubbleは計算済み座標を利用して吹き出し本体と矢印を表示する。
 */
function Bubble({
  children,
  label,
  position,
  requestClose,
  targetMeasurements,
}: {
  children: React.ReactNode
  label: string
  position: TooltipContextType['position']
  requestClose: () => void
  targetMeasurements: Exclude<
    TargetContextType['targetMeasurements'],
    undefined
  >
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const dimensions = useWindowDimensions()
  const [bubbleMeasurements, setBubbleMeasurements] = useState<
    | {
      width: number
      height: number
    }
    | undefined
  >(undefined)
  /**
   * バブルのサイズと画面寸法から最終的な表示位置と矢印の向きを算出する。
   */
  const coords = useMemo(() => {
    if (!bubbleMeasurements)
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        tipTop: 0,
        tipLeft: 0,
      }

    const { width: ww, height: wh } = dimensions
    const maxTop = insets.top
    const maxBottom = wh - insets.bottom
    const { width: cw, height: ch } = bubbleMeasurements
    const minLeft = MIN_EDGE_SPACE
    const maxLeft = ww - minLeft

    let computedPosition: 'top' | 'bottom' = position
    let top = targetMeasurements.y + targetMeasurements.height
    let left = Math.max(
      minLeft,
      targetMeasurements.x + targetMeasurements.width / 2 - cw / 2,
    )
    const tipTranslate = ARROW_HALF_SIZE * -1
    let tipTop = tipTranslate

    if (left + cw > maxLeft) {
      left -= left + cw - maxLeft
    }

    let tipLeft =
      targetMeasurements.x -
      left +
      targetMeasurements.width / 2 -
      ARROW_HALF_SIZE

    let bottom = top + ch

    function positionTop() {
      top = top - ch - targetMeasurements.height
      bottom = top + ch
      tipTop = tipTop + ch
      computedPosition = 'top'
    }

    function positionBottom() {
      top = targetMeasurements.y + targetMeasurements.height
      bottom = top + ch
      tipTop = tipTranslate
      computedPosition = 'bottom'
    }

    if (position === 'top') {
      positionTop()
      if (top < maxTop) {
        positionBottom()
      }
    } else {
      if (bottom > maxBottom) {
        positionTop()
      }
    }

    if (computedPosition === 'bottom') {
      top += ARROW_VISUAL_OFFSET
      bottom += ARROW_VISUAL_OFFSET
    } else {
      top -= ARROW_VISUAL_OFFSET
      bottom -= ARROW_VISUAL_OFFSET
    }

    return {
      computedPosition,
      top,
      bottom,
      left,
      right: left + cw,
      tipTop,
      tipLeft,
    }
  }, [position, targetMeasurements, bubbleMeasurements, insets, dimensions])

  const requestCloseWrapped = useCallback(() => {
    setBubbleMeasurements(undefined)
    requestClose()
  }, [requestClose])

  useOnGesture(
    useCallback(
      e => {
        const { x, y } = e
        const isInside =
          x > coords.left &&
          x < coords.right &&
          y > coords.top &&
          y < coords.bottom

        if (!isInside) {
          requestCloseWrapped()
        }
      },
      [coords, requestCloseWrapped],
    ),
  )

  return (
    <View
      accessible
      role="alert"
      accessibilityHint=""
      accessibilityLabel={label}
      // Android向け設定
      importantForAccessibility="yes"
      // iOS向け設定
      accessibilityViewIsModal
      style={[
        a.absolute,
        a.align_start,
        {
          width: BUBBLE_MAX_WIDTH,
          opacity: bubbleMeasurements ? 1 : 0,
          top: coords.top,
          left: coords.left,
        },
      ]}>
      <Animated.View
        entering={ZoomIn.easing(Easing.out(Easing.exp))}
        style={{ transformOrigin: oppposite(position) }}>
        <View
          style={[
            a.absolute,
            a.top_0,
            a.z_10,
            t.atoms.bg,
            select(t.name, {
              light: t.atoms.bg,
              dark: t.atoms.bg_contrast_100,
              dim: t.atoms.bg_contrast_100,
            }),
            {
              borderTopLeftRadius: a.rounded_2xs.borderRadius,
              borderBottomRightRadius: a.rounded_2xs.borderRadius,
              width: ARROW_SIZE,
              height: ARROW_SIZE,
              transform: [{ rotate: '45deg' }],
              top: coords.tipTop,
              left: coords.tipLeft,
            },
          ]}
        />
        <View
          style={[
            a.px_md,
            a.py_sm,
            a.rounded_sm,
            select(t.name, {
              light: t.atoms.bg,
              dark: t.atoms.bg_contrast_100,
              dim: t.atoms.bg_contrast_100,
            }),
            t.atoms.shadow_md,
            {
              shadowOpacity: 0.2,
              shadowOffset: {
                width: 0,
                height:
                  BUBBLE_SHADOW_OFFSET *
                  (coords.computedPosition === 'bottom' ? -1 : 1),
              },
            },
          ]}
          onLayout={e => {
            setBubbleMeasurements({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }}>
          {children}
        </View>
      </Animated.View>
    </View>
  )
}

function oppposite(position: 'top' | 'bottom') {
  // 表示位置に応じてアニメーションの基準点を切り替える。
  switch (position) {
    case 'top':
      return 'center bottom'
    case 'bottom':
      return 'center top'
    default:
      return 'center'
  }
}

/**
 * TextBubbleは文字列を簡潔なツールチップとして表示するためのラッパー。
 */
export function TextBubble({ children }: { children: React.ReactNode }) {
  const c = Children.toArray(children)
  return (
    <Content label={c.join(' ')}>
      <View style={[a.gap_xs]}>
        {c.map((child, i) => (
          <Text key={i} style={[a.text_sm, a.leading_snug]}>
            {child}
          </Text>
        ))}
      </View>
    </Content>
  )
}
