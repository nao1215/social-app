/**
 * 画像レイアウトグリッドコンポーネント
 * Image Layout Grid Component
 *
 * 【概要】
 * 投稿内の複数画像をグリッドレイアウトで表示するコンポーネント。
 * 画像数に応じて自動的にレイアウトを変更。
 *
 * 【レイアウトパターン】
 * 2枚: [1][2] 横並び（各1:1）
 *
 * 3枚: [1][2] 左1枚大、右2枚縦並び
 *      [ ][3]
 *
 * 4枚: [1][2] 2x2グリッド
 *      [3][4]
 *
 * 【Goユーザー向け補足】
 * - useAnimatedRef: アニメーション用ref（共有要素トランジション）
 * - noCorners: 角丸を無効にするヘルパー（隣接画像の境界）
 * - StyleSheet.flatten: 複数スタイルをマージする関数
 */

// React本体
// React core
import React from 'react'

// React Nativeの基本コンポーネントと型
// React Native basic components and types
import {type StyleProp, StyleSheet, View, type ViewStyle} from 'react-native'

// React Native Reanimated（アニメーション用ref）
// React Native Reanimated (for animation ref)
import {type AnimatedRef, useAnimatedRef} from 'react-native-reanimated'

// AT Protocol API型定義（画像埋め込み）
// AT Protocol API type (image embed)
import {type AppBskyEmbedImages} from '@atproto/api'

// デザインシステム
// Design system
import {atoms as a, useBreakpoints} from '#/alf'

// 投稿埋め込み表示コンテキスト型
// Post embed view context type
import {PostEmbedViewContext} from '#/components/Post/Embed/types'

// 画像サイズ型
// Image dimensions type
import {type Dimensions} from '../../lightbox/ImageViewing/@types'

// ギャラリーアイテムコンポーネント
// Gallery item component
import {GalleryItem} from './Gallery'

/**
 * 画像レイアウトグリッドのProps型
 * Image Layout Grid Props type
 */
interface ImageLayoutGridProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (
    index: number,
    containerRefs: AnimatedRef<any>[],
    fetchedDims: (Dimensions | null)[],
  ) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  style?: StyleProp<ViewStyle>
  viewContext?: PostEmbedViewContext
}

export function ImageLayoutGrid({style, ...props}: ImageLayoutGridProps) {
  const {gtMobile} = useBreakpoints()
  const gap =
    props.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
      ? gtMobile
        ? a.gap_xs
        : a.gap_2xs
      : a.gap_xs

  return (
    <View style={style}>
      <View style={[gap, a.rounded_md, a.overflow_hidden]}>
        <ImageLayoutGridInner {...props} gap={gap} />
      </View>
    </View>
  )
}

interface ImageLayoutGridInnerProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (
    index: number,
    containerRefs: AnimatedRef<any>[],
    fetchedDims: (Dimensions | null)[],
  ) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  viewContext?: PostEmbedViewContext
  gap: {gap: number}
}

function ImageLayoutGridInner(props: ImageLayoutGridInnerProps) {
  const gap = props.gap
  const count = props.images.length

  const containerRef1 = useAnimatedRef()
  const containerRef2 = useAnimatedRef()
  const containerRef3 = useAnimatedRef()
  const containerRef4 = useAnimatedRef()
  const thumbDimsRef = React.useRef<(Dimensions | null)[]>([])

  switch (count) {
    case 2: {
      const containerRefs = [containerRef1, containerRef2]
      return (
        <View style={[a.flex_1, a.flex_row, gap]}>
          <View style={[a.flex_1, {aspectRatio: 1}]}>
            <GalleryItem
              {...props}
              index={0}
              insetBorderStyle={noCorners(['topRight', 'bottomRight'])}
              containerRefs={containerRefs}
              thumbDimsRef={thumbDimsRef}
            />
          </View>
          <View style={[a.flex_1, {aspectRatio: 1}]}>
            <GalleryItem
              {...props}
              index={1}
              insetBorderStyle={noCorners(['topLeft', 'bottomLeft'])}
              containerRefs={containerRefs}
              thumbDimsRef={thumbDimsRef}
            />
          </View>
        </View>
      )
    }

    case 3: {
      const containerRefs = [containerRef1, containerRef2, containerRef3]
      return (
        <View style={[a.flex_1, a.flex_row, gap]}>
          <View style={[a.flex_1, {aspectRatio: 1}]}>
            <GalleryItem
              {...props}
              index={0}
              insetBorderStyle={noCorners(['topRight', 'bottomRight'])}
              containerRefs={containerRefs}
              thumbDimsRef={thumbDimsRef}
            />
          </View>
          <View style={[a.flex_1, {aspectRatio: 1}, gap]}>
            <View style={[a.flex_1]}>
              <GalleryItem
                {...props}
                index={1}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'bottomLeft',
                  'bottomRight',
                ])}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
              />
            </View>
            <View style={[a.flex_1]}>
              <GalleryItem
                {...props}
                index={2}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'bottomLeft',
                  'topRight',
                ])}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
              />
            </View>
          </View>
        </View>
      )
    }

    case 4: {
      const containerRefs = [
        containerRef1,
        containerRef2,
        containerRef3,
        containerRef4,
      ]
      return (
        <>
          <View style={[a.flex_row, gap]}>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem
                {...props}
                index={0}
                insetBorderStyle={noCorners([
                  'bottomLeft',
                  'topRight',
                  'bottomRight',
                ])}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
              />
            </View>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem
                {...props}
                index={1}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'bottomLeft',
                  'bottomRight',
                ])}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
              />
            </View>
          </View>
          <View style={[a.flex_row, gap]}>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem
                {...props}
                index={2}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'topRight',
                  'bottomRight',
                ])}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
              />
            </View>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem
                {...props}
                index={3}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'bottomLeft',
                  'topRight',
                ])}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
              />
            </View>
          </View>
        </>
      )
    }

    default:
      return null
  }
}

function noCorners(
  corners: ('topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight')[],
) {
  const styles: StyleProp<ViewStyle>[] = []
  if (corners.includes('topLeft')) {
    styles.push({borderTopLeftRadius: 0})
  }
  if (corners.includes('topRight')) {
    styles.push({borderTopRightRadius: 0})
  }
  if (corners.includes('bottomLeft')) {
    styles.push({borderBottomLeftRadius: 0})
  }
  if (corners.includes('bottomRight')) {
    styles.push({borderBottomRightRadius: 0})
  }
  return StyleSheet.flatten(styles)
}
