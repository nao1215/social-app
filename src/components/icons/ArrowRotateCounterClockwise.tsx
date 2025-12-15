/**
 * 反時計回り回転矢印アイコンモジュール
 * Arrow Rotate Counter Clockwise Icon Module
 *
 * 反時計回りに回転する矢印アイコンを提供します。
 * リフレッシュ、リセット、元に戻す、再試行などのアクションに使用されます。
 *
 * Provides a counter-clockwise rotating arrow icon.
 * Used for actions like refresh, reset, undo, or retry.
 *
 * 【Goユーザー向け補足】
 * - リフレッシュアイコン: データの再読み込みや状態のリセットを表現
 * - 時計回り vs 反時計回り: 文化的な慣習により「更新」の意味が異なる場合がある
 *   多くのUIでは反時計回りが「やり直し」、時計回りが「進める」を示す
 */

// SVGアイコンテンプレート - 単一パスSVGアイコンを作成するヘルパー関数
// SVG icon template - helper function to create single-path SVG icons
import {createSinglePathSVG} from './TEMPLATE'

/**
 * 反時計回り回転矢印アイコン (ストローク2, 角丸なし)
 * Arrow Rotate Counter Clockwise Icon (Stroke 2, No Corner Radius)
 *
 * 反時計回りに回転する矢印で、左側に戻る方向を示します。
 * ページのリロード、状態のリセット、やり直しなどのアクションを視覚化します。
 *
 * Counter-clockwise rotating arrow pointing back to the left.
 * Visualizes actions like page reload, state reset, or redo.
 *
 * @example
 * ```tsx
 * <ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded fill="blue" size={24} />
 * ```
 */
export const ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded =
  createSinglePathSVG({
    path: 'M5 3a1 1 0 0 1 1 1v1.423c.498-.46 1.02-.869 1.58-1.213C8.863 3.423 10.302 3 12.028 3a9 9 0 1 1-8.487 12 1 1 0 0 1 1.885-.667A7 7 0 1 0 12.028 5c-1.37 0-2.444.327-3.402.915-.474.29-.93.652-1.383 1.085H9a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
  })
