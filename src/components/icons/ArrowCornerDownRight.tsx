/**
 * 角を曲がる矢印（下→右）アイコンモジュール
 * Arrow Corner Down Right Icon Module
 *
 * 下方向から右方向へ90度曲がる矢印アイコンを提供します。
 * 返信、リダイレクト、フロー遷移などを表現する際に使用されます。
 *
 * Provides an arrow icon that turns 90 degrees from down to right.
 * Used to represent replies, redirects, or flow transitions.
 *
 * 【Goユーザー向け補足】
 * - コーナー矢印: 直角に曲がる矢印で、方向転換やフロー変更を視覚化
 * - SNS文脈: Blueskyではスレッドの返信や引用を示すために使用
 *   Twitterの返信アイコンと同様の用途
 */

// SVGアイコンテンプレート - 単一パスSVGアイコンを作成するヘルパー関数
// SVG icon template - helper function to create single-path SVG icons
import {createSinglePathSVG} from './TEMPLATE'

/**
 * 角を曲がる矢印（下→右）アイコン (ストローク2, 角丸2)
 * Arrow Corner Down Right Icon (Stroke 2, Corner Radius 2)
 *
 * 上から下へ伸び、右方向へ90度曲がる矢印デザインです。
 * 返信スレッドや引用投稿などの階層構造を示すのに適しています。
 *
 * Arrow design extending from top to bottom, then turning 90 degrees right.
 * Suitable for showing hierarchical structures like reply threads or quoted posts.
 *
 * @example
 * ```tsx
 * <ArrowCornerDownRight_Stroke2_Corner2_Rounded fill="gray" size={20} />
 * ```
 */
export const ArrowCornerDownRight_Stroke2_Corner2_Rounded = createSinglePathSVG(
  {
    path: 'M15.793 10.293a1 1 0 0 1 1.338-.068l.076.068 3.293 3.293a2 2 0 0 1 .138 2.677l-.138.151-3.293 3.293a1 1 0 1 1-1.414-1.414L18.086 16H8a5 5 0 0 1-5-5V5a1 1 0 0 1 2 0v6a3 3 0 0 0 3 3h10.086l-2.293-2.293-.068-.076a1 1 0 0 1 .068-1.338Z',
  },
)
