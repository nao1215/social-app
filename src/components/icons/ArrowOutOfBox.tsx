/**
 * ボックスから出る矢印アイコンモジュール
 * Arrow Out Of Box Icon Module
 *
 * ボックスから上方向へ出ていく矢印アイコンを提供します。
 * エクスポート、共有、外部へ送信などのアクションに使用されます。
 *
 * Provides an arrow pointing upward out of a box icon.
 * Used for actions like export, share, or send to external.
 *
 * 【Goユーザー向け補足】
 * - アウトボックス矢印: コンテンツを外部に送り出すアクションを表現
 * - ユースケース: ファイルのアップロード、データのエクスポート、共有機能
 *   Goでいうio.Writerのような「出力」の概念を視覚化
 */

// SVGアイコンテンプレート - 単一パスSVGアイコンを作成するヘルパー関数
// SVG icon template - helper function to create single-path SVG icons
import {createSinglePathSVG} from './TEMPLATE'

/**
 * ボックスから出る矢印アイコン (ストローク2, 角丸なし)
 * Arrow Out Of Box Icon (Stroke 2, No Corner Radius)
 *
 * 下部にボックスがあり、上方向へ矢印が伸びるデザインです。
 * シャープなエッジのスタイルを持ちます。
 *
 * @example
 * ```tsx
 * <ArrowOutOfBox_Stroke2_Corner0_Rounded fill="blue" size={24} />
 * ```
 */
export const ArrowOutOfBox_Stroke2_Corner0_Rounded = createSinglePathSVG({
  path: 'M12.707 3.293a1 1 0 0 0-1.414 0l-4.5 4.5a1 1 0 0 0 1.414 1.414L11 6.414v8.836a1 1 0 1 0 2 0V6.414l2.793 2.793a1 1 0 1 0 1.414-1.414l-4.5-4.5ZM5 12.75a1 1 0 1 0-2 0V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-7.25a1 1 0 1 0-2 0V19H5v-6.25Z',
})

/**
 * ボックスから出る矢印アイコン（改良版） (ストローク2, 角丸2)
 * Arrow Out Of Box Icon (Modified) (Stroke 2, Corner Radius 2)
 *
 * 下部にボックスがあり、上方向へ矢印が伸びるデザインです。
 * 角が丸みを帯びた柔らかいスタイルを持ち、改良されたレイアウトです。
 *
 * @example
 * ```tsx
 * <ArrowOutOfBoxModified_Stroke2_Corner2_Rounded fill="green" size={28} />
 * ```
 */
export const ArrowOutOfBoxModified_Stroke2_Corner2_Rounded =
  createSinglePathSVG({
    path: 'M20 13.75a1 1 0 0 1 1 1V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-3.25a1 1 0 1 1 2 0V18a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.25a1 1 0 0 1 1-1ZM12 3a1 1 0 0 1 .707.293l4.5 4.5a1 1 0 1 1-1.414 1.414L13 6.414v8.836a1 1 0 1 1-2 0V6.414L8.207 9.207a1 1 0 1 1-1.414-1.414l4.5-4.5A1 1 0 0 1 12 3Z',
  })
