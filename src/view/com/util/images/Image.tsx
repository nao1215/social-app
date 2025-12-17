/**
 * 高優先度画像コンポーネント（ネイティブ版）
 * High Priority Image Component (Native Version)
 *
 * 【概要】
 * expo-imageを使用した高性能な画像コンポーネント。
 * ネイティブアプリで優先的に読み込まれる画像に使用。
 *
 * 【用途】
 * - ユーザーアバター
 * - プロフィールバナー
 * - 重要なUI要素の画像
 *
 * 【Goユーザー向け補足】
 * - expo-image: React Native用の高性能画像ライブラリ
 * - accessibilityIgnoresInvertColors: 色反転時に画像を反転しない
 *   （iOSのアクセシビリティ機能対応）
 * - satisfies: TypeScript 4.9+の型チェック演算子
 */

// expo-imageコンポーネントと型
// expo-image component and types
import {Image, ImageProps, ImageSource} from 'expo-image'

/**
 * 高優先度画像のProps型
 * High Priority Image Props type
 */
interface HighPriorityImageProps extends ImageProps {
  /** 画像ソース / Image source */
  source: ImageSource
}

/**
 * 高優先度画像コンポーネント
 * High Priority Image Component
 *
 * sourceがオブジェクトの場合、uriプロパティを抽出して使用
 */
export function HighPriorityImage({source, ...props}: HighPriorityImageProps) {
  // ソースからURIを抽出（オブジェクトの場合）
  // Extract URI from source (if object)
  const updatedSource = {
    uri: typeof source === 'object' && source ? source.uri : '',
  } satisfies ImageSource

  return (
    <Image accessibilityIgnoresInvertColors source={updatedSource} {...props} />
  )
}
