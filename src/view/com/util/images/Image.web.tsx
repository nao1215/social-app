/**
 * 高優先度画像コンポーネント（Web版）
 * High Priority Image Component (Web Version)
 *
 * 【概要】
 * Web版では標準のReact Native Imageコンポーネントをそのまま使用。
 * Webでは特別な最適化が不要なため、シンプルな再エクスポート。
 *
 * 【Goユーザー向け補足】
 * - プラットフォーム別ファイル: .tsx（ネイティブ）と.web.tsx（Web）
 * - Webでは<img>タグにトランスパイルされる
 */

// React Nativeの標準Imageコンポーネント
// React Native standard Image component
import {Image} from 'react-native'

/**
 * Web版の高優先度画像（標準Imageの再エクスポート）
 * Web version high priority image (re-export of standard Image)
 */
export const HighPriorityImage = Image
