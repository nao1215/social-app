/**
 * ギャラリーアイテムコンポーネント
 * Gallery Item Component
 *
 * 【概要】
 * 画像グリッド内の個別画像アイテム。
 * ImageLayoutGridから呼び出される子コンポーネント。
 *
 * 【機能】
 * - 画像表示とタップ/ロングプレス処理
 * - ALTバッジ表示
 * - 内側ボーダー表示
 * - ライトボックス表示のためのref管理
 *
 * 【Goユーザー向け補足】
 * - MutableRefObject: 変更可能なrefオブジェクト（Goのポインタに相当）
 * - thumbDimsRef: サムネイル画像のサイズを保持（onLoadで取得）
 * - collapsable={false}: Androidでrefが正しく動作するために必要
 */

// React Nativeの基本コンポーネント
// React Native basic components
import {Pressable, type StyleProp, View, type ViewStyle} from 'react-native'

// React Native Reanimated（アニメーション用ref）
// React Native Reanimated (for animation ref)
import {type AnimatedRef} from 'react-native-reanimated'

// Expo Imageコンポーネント
// Expo Image component
import {Image, type ImageStyle} from 'expo-image'

// AT Protocol API型定義（画像埋め込み）
// AT Protocol API type (image embed)
import {type AppBskyEmbedImages} from '@atproto/api'

// 国際化マクロ
// Internationalization macro
import {msg} from '@lingui/macro'

// 国際化フック
// Internationalization hook
import {useLingui} from '@lingui/react'

// React型
// React type
import type React from 'react'

// 画像サイズ型
// Image dimensions type
import {type Dimensions} from '#/lib/media/types'

// 大きいALTバッジ設定フック
// Large ALT badge preference hook
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'

// デザインシステム
// Design system
import {atoms as a, useTheme} from '#/alf'

// メディア内側ボーダー
// Media inset border
import {MediaInsetBorder} from '#/components/MediaInsetBorder'

// 投稿埋め込み表示コンテキスト型
// Post embed view context type
import {PostEmbedViewContext} from '#/components/Post/Embed/types'

// テキストコンポーネント
// Text component
import {Text} from '#/components/Typography'

/**
 * イベント関数型（インデックスを受け取る）
 * Event function type (receives index)
 */
type EventFunction = (index: number) => void

/**
 * ギャラリーアイテムのProps型
 * Gallery Item Props type
 */
interface Props {
  images: AppBskyEmbedImages.ViewImage[]
  index: number
  onPress?: (
    index: number,
    containerRefs: AnimatedRef<any>[],
    fetchedDims: (Dimensions | null)[],
  ) => void
  onLongPress?: EventFunction
  onPressIn?: EventFunction
  imageStyle?: StyleProp<ImageStyle>
  viewContext?: PostEmbedViewContext
  insetBorderStyle?: StyleProp<ViewStyle>
  containerRefs: AnimatedRef<any>[]
  thumbDimsRef: React.MutableRefObject<(Dimensions | null)[]>
}

export function GalleryItem({
  images,
  index,
  imageStyle,
  onPress,
  onPressIn,
  onLongPress,
  viewContext,
  insetBorderStyle,
  containerRefs,
  thumbDimsRef,
}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const largeAltBadge = useLargeAltBadgeEnabled()
  const image = images[index]
  const hasAlt = !!image.alt
  const hideBadges =
    viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
  return (
    <View style={a.flex_1} ref={containerRefs[index]} collapsable={false}>
      <Pressable
        onPress={
          onPress
            ? () => onPress(index, containerRefs, thumbDimsRef.current.slice())
            : undefined
        }
        onPressIn={onPressIn ? () => onPressIn(index) : undefined}
        onLongPress={onLongPress ? () => onLongPress(index) : undefined}
        style={[
          a.flex_1,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          imageStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={image.alt || _(msg`Image`)}
        accessibilityHint="">
        <Image
          source={{uri: image.thumb}}
          style={[a.flex_1]}
          accessible={true}
          accessibilityLabel={image.alt}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
          onLoad={e => {
            thumbDimsRef.current[index] = {
              width: e.source.width,
              height: e.source.height,
            }
          }}
        />
        <MediaInsetBorder style={insetBorderStyle} />
      </Pressable>
      {hasAlt && !hideBadges ? (
        <View
          accessible={false}
          style={[
            a.absolute,
            a.flex_row,
            a.align_center,
            a.rounded_xs,
            t.atoms.bg_contrast_25,
            {
              gap: 3,
              padding: 3,
              bottom: a.p_xs.padding,
              right: a.p_xs.padding,
              opacity: 0.8,
            },
            largeAltBadge && [
              {
                gap: 4,
                padding: 5,
              },
            ],
          ]}>
          <Text
            style={[a.font_heavy, largeAltBadge ? a.text_xs : {fontSize: 8}]}>
            ALT
          </Text>
        </View>
      ) : null}
    </View>
  )
}
