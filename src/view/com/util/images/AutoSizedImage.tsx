/**
 * 自動サイズ調整画像コンポーネント
 * Auto-Sized Image Component
 *
 * 【概要】
 * アスペクト比に基づいて自動的にサイズ調整される画像コンポーネント。
 * フィードやスレッド内での画像表示に使用。
 *
 * 【機能】
 * - アスペクト比の自動計算・制限
 * - ALTバッジ表示（アクセシビリティ）
 * - フルスクリーンアイコン（クロップ時）
 * - レスポンシブ対応（モバイル/デスクトップで異なる制限）
 *
 * 【クロップモード】
 * - none: クロップなし（最大1:4まで）
 * - square: 正方形にクロップ
 * - constrained: 制限付きクロップ（最大1:2まで）
 *
 * 【Goユーザー向け補足】
 * - useAnimatedRef: アニメーション用のref（共有要素トランジション用）
 * - expo-image: 高性能な画像コンポーネント
 * - aspectRatio: CSSのaspect-ratioに相当
 * - paddingTopでアスペクト比を制御するテクニック（CSSハック）
 */

// Reactフック
// React hooks
import React, {useRef} from 'react'

// React Nativeの基本コンポーネント
// React Native basic components
import {type DimensionValue, Pressable, View} from 'react-native'

// React Native Reanimated（アニメーション用ref）
// React Native Reanimated (for animation ref)
import Animated, {
  type AnimatedRef,
  useAnimatedRef,
} from 'react-native-reanimated'

// Expo Imageコンポーネント
// Expo Image component
import {Image} from 'expo-image'

// AT Protocol API型定義（画像埋め込み）
// AT Protocol API type (image embed)
import {type AppBskyEmbedImages} from '@atproto/api'

// 国際化マクロ
// Internationalization macro
import {msg} from '@lingui/macro'

// 国際化フック
// Internationalization hook
import {useLingui} from '@lingui/react'

// メディアサイズ型
// Media dimensions type
import {type Dimensions} from '#/lib/media/types'

// プラットフォーム検出
// Platform detection
import {isNative} from '#/platform/detection'

// 大きいALTバッジ設定フック
// Large ALT badge preference hook
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'

// デザインシステム
// Design system
import {atoms as a, useBreakpoints, useTheme} from '#/alf'

// フルスクリーンアイコン
// Fullscreen icon
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as Fullscreen} from '#/components/icons/ArrowsDiagonal'

// メディア内側ボーダー
// Media inset border
import {MediaInsetBorder} from '#/components/MediaInsetBorder'

// テキストコンポーネント
// Text component
import {Text} from '#/components/Typography'

/**
 * 制約付き画像コンテナ
 * Constrained Image Container
 *
 * アスペクト比に基づいて高さを制限する。
 * paddingTopパーセンテージでアスペクト比を実現。
 */
export function ConstrainedImage({
  aspectRatio,
  fullBleed,
  children,
}: {
  aspectRatio: number
  fullBleed?: boolean
  children: React.ReactNode
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  /**
   * Computed as a % value to apply as `paddingTop`, this basically controls
   * the height of the image.
   */
  const outerAspectRatio = React.useMemo<DimensionValue>(() => {
    const ratio =
      isNative || !gtMobile
        ? Math.min(1 / aspectRatio, 16 / 9) // 9:16 bounding box
        : Math.min(1 / aspectRatio, 1) // 1:1 bounding box
    return `${ratio * 100}%`
  }, [aspectRatio, gtMobile])

  return (
    <View style={[a.w_full]}>
      <View style={[a.overflow_hidden, {paddingTop: outerAspectRatio}]}>
        <View style={[a.absolute, a.inset_0, a.flex_row]}>
          <View
            style={[
              a.h_full,
              a.rounded_md,
              a.overflow_hidden,
              t.atoms.bg_contrast_25,
              fullBleed ? a.w_full : {aspectRatio},
            ]}>
            {children}
          </View>
        </View>
      </View>
    </View>
  )
}

export function AutoSizedImage({
  image,
  crop = 'constrained',
  hideBadge,
  onPress,
  onLongPress,
  onPressIn,
}: {
  image: AppBskyEmbedImages.ViewImage
  crop?: 'none' | 'square' | 'constrained'
  hideBadge?: boolean
  onPress?: (
    containerRef: AnimatedRef<any>,
    fetchedDims: Dimensions | null,
  ) => void
  onLongPress?: () => void
  onPressIn?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const largeAlt = useLargeAltBadgeEnabled()
  const containerRef = useAnimatedRef()
  const fetchedDimsRef = useRef<{width: number; height: number} | null>(null)

  let aspectRatio: number | undefined
  const dims = image.aspectRatio
  if (dims) {
    aspectRatio = dims.width / dims.height
    if (Number.isNaN(aspectRatio)) {
      aspectRatio = undefined
    }
  }

  let constrained: number | undefined
  let max: number | undefined
  let rawIsCropped: boolean | undefined
  if (aspectRatio !== undefined) {
    const ratio = 1 / 2 // max of 1:2 ratio in feeds
    constrained = Math.max(aspectRatio, ratio)
    max = Math.max(aspectRatio, 0.25) // max of 1:4 in thread
    rawIsCropped = aspectRatio < constrained
  }

  const cropDisabled = crop === 'none'
  const isCropped = rawIsCropped && !cropDisabled
  const isContain = aspectRatio === undefined
  const hasAlt = !!image.alt

  const contents = (
    <Animated.View ref={containerRef} collapsable={false} style={{flex: 1}}>
      <Image
        contentFit={isContain ? 'contain' : 'cover'}
        style={[a.w_full, a.h_full]}
        source={image.thumb}
        accessible={true} // Must set for `accessibilityLabel` to work
        accessibilityIgnoresInvertColors
        accessibilityLabel={image.alt}
        accessibilityHint=""
        onLoad={e => {
          if (!isContain) {
            fetchedDimsRef.current = {
              width: e.source.width,
              height: e.source.height,
            }
          }
        }}
      />
      <MediaInsetBorder />

      {(hasAlt || isCropped) && !hideBadge ? (
        <View
          accessible={false}
          style={[
            a.absolute,
            a.flex_row,
            {
              bottom: a.p_xs.padding,
              right: a.p_xs.padding,
              gap: 3,
            },
            largeAlt && [
              {
                gap: 4,
              },
            ],
          ]}>
          {isCropped && (
            <View
              style={[
                a.rounded_xs,
                t.atoms.bg_contrast_25,
                {
                  padding: 3,
                  opacity: 0.8,
                },
                largeAlt && [
                  {
                    padding: 5,
                  },
                ],
              ]}>
              <Fullscreen
                fill={t.atoms.text_contrast_high.color}
                width={largeAlt ? 18 : 12}
              />
            </View>
          )}
          {hasAlt && (
            <View
              style={[
                a.justify_center,
                a.rounded_xs,
                t.atoms.bg_contrast_25,
                {
                  padding: 3,
                  opacity: 0.8,
                },
                largeAlt && [
                  {
                    padding: 5,
                  },
                ],
              ]}>
              <Text
                style={[a.font_heavy, largeAlt ? a.text_xs : {fontSize: 8}]}>
                ALT
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </Animated.View>
  )

  if (cropDisabled) {
    return (
      <Pressable
        onPress={() => onPress?.(containerRef, fetchedDimsRef.current)}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        // alt here is what screen readers actually use
        accessibilityLabel={image.alt}
        accessibilityHint={_(msg`Views full image`)}
        style={[
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          {aspectRatio: max ?? 1},
        ]}>
        {contents}
      </Pressable>
    )
  } else {
    return (
      <ConstrainedImage
        fullBleed={crop === 'square'}
        aspectRatio={constrained ?? 1}>
        <Pressable
          onPress={() => onPress?.(containerRef, fetchedDimsRef.current)}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          // alt here is what screen readers actually use
          accessibilityLabel={image.alt}
          accessibilityHint={_(msg`Views full image`)}
          style={[a.h_full]}>
          {contents}
        </Pressable>
      </ConstrainedImage>
    )
  }
}
