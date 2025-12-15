/**
 * Apple Inc.ロゴアイコンモジュール
 * Apple Inc. Logo Icon Module
 *
 * Apple Inc.の公式ロゴアイコンを提供します。
 * Apple製品、iOS/macOS関連の機能、Apple固有のサービスへのリンク、
 * またはプラットフォーム識別に使用されます。
 *
 * Provides the official logo icon for Apple Inc.
 * Used for Apple products, iOS/macOS-related features, links to
 * Apple-specific services, or platform identification.
 *
 * 【Goユーザー向け補足】
 * - ブランドロゴ: Appleの商標権により保護されている公式デザイン
 *   使用にはAppleのブランドガイドラインへの準拠が必要
 * - 右側にかじられた跡のある特徴的なリンゴの形状
 *   1977年以来のAppleのシンボリックなアイコンデザイン
 */

// SVGアイコンテンプレート - 単一パスSVGアイコンを作成するヘルパー関数
// SVG icon template - helper function to create single-path SVG icons
import {createSinglePathSVG} from './TEMPLATE'

/**
 * Apple Inc.ロゴアイコン
 * Apple Inc. Logo Icon
 *
 * Appleの象徴的な「かじられたリンゴ」のロゴデザインです。
 * 右側に特徴的なかじられた跡があり、上部に葉があります。
 * 世界で最も認知されているブランドロゴの1つです。
 *
 * Apple's iconic "bitten apple" logo design.
 * Features a distinctive bite mark on the right side and a leaf on top.
 * One of the most recognized brand logos in the world.
 *
 * @example
 * ```tsx
 * <AppleLogo fill="black" size={32} />
 * ```
 */
export const AppleLogo = createSinglePathSVG({
  path: 'M14.57 4.348c.65-.775 1.11-1.85 1.11-2.926 0-.149-.013-.3-.04-.422-1.057.04-2.314.708-3.072 1.592-.595.68-1.15 1.756-1.15 2.846 0 .164.027.327.04.38.066.012.175.027.283.027.948 0 2.14-.638 2.83-1.497Zm4.835 3.847.052-.035c-1.407-2.03-3.546-2.084-4.14-2.084-.911 0-1.726.325-2.411.598-.497.198-.925.368-1.271.368-.383 0-.822-.178-1.311-.377-.618-.25-1.317-.534-2.087-.534C5.64 6.13 3 8.296 3 12.379c0 2.545.975 5.227 2.182 6.954C6.224 20.803 7.13 22 8.43 22c.616 0 1.068-.193 1.543-.395.526-.225 1.082-.462 1.922-.462.849 0 1.356.223 1.845.437.455.2.895.393 1.58.393 1.42 0 2.353-1.292 3.246-2.586 1.003-1.47 1.422-2.913 1.435-2.98-.081-.027-2.802-1.13-2.802-4.246 0-2.51 1.855-3.734 2.207-3.966Z',
})
