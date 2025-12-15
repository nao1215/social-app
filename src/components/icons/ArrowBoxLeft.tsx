/**
 * ボックス付き左矢印アイコンモジュール
 * Arrow Box Left Icon Module
 *
 * ボックス内から左方向を指す矢印アイコンを提供します。
 * ログアウト、退出、前のステップへ戻るなどのアクションに使用されます。
 *
 * Provides an arrow pointing left from within a box icon.
 * Used for actions like logout, exit, or returning to previous steps.
 *
 * 【Goユーザー向け補足】
 * - ボックス矢印: 箱またはコンテナからの移動を視覚的に表現
 * - バリエーション: Corner0（角丸なし）とCorner2（角丸2px）の2種類
 *   異なるデザインスタイルに対応するための選択肢を提供
 */

// SVGアイコンテンプレート - 単一パスSVGアイコンを作成するヘルパー関数
// SVG icon template - helper function to create single-path SVG icons
import {createSinglePathSVG} from './TEMPLATE'

/**
 * ボックス付き左矢印アイコン (ストローク2, 角丸なし)
 * Arrow Box Left Icon (Stroke 2, No Corner Radius)
 *
 * 左端にボックスの輪郭があり、そこから右方向へ矢印が伸びるデザインです。
 * シャープなエッジのスタイルを持ちます。
 *
 * @example
 * ```tsx
 * <ArrowBoxLeft_Stroke2_Corner0_Rounded fill="red" size={24} />
 * ```
 */
export const ArrowBoxLeft_Stroke2_Corner0_Rounded = createSinglePathSVG({
  path: 'M3.293 3.293A1 1 0 0 1 4 3h7.25a1 1 0 1 1 0 2H5v14h6.25a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1V4a1 1 0 0 1 .293-.707Zm11.5 3.5a1 1 0 0 1 1.414 0l4.5 4.5a1 1 0 0 1 0 1.414l-4.5 4.5a1 1 0 0 1-1.414-1.414L17.586 13H8.75a1 1 0 1 1 0-2h8.836l-2.793-2.793a1 1 0 0 1 0-1.414Z',
})

/**
 * ボックス付き左矢印アイコン (ストローク2, 角丸2)
 * Arrow Box Left Icon (Stroke 2, Corner Radius 2)
 *
 * 左端にボックスの輪郭があり、そこから右方向へ矢印が伸びるデザインです。
 * 角が丸みを帯びた柔らかいスタイルを持ちます。
 *
 * @example
 * ```tsx
 * <ArrowBoxLeft_Stroke2_Corner2_Rounded fill="blue" size={24} />
 * ```
 */
export const ArrowBoxLeft_Stroke2_Corner2_Rounded = createSinglePathSVG({
  path: 'M6 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5.25a1 1 0 1 1 0 2H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h5.25a1 1 0 1 1 0 2H6Zm8.793 1.793a1 1 0 0 1 1.414 0l4.5 4.5a1 1 0 0 1 0 1.414l-4.5 4.5a1 1 0 0 1-1.414-1.414L17.586 13H8.75a1 1 0 1 1 0-2h8.836l-2.793-2.793a1 1 0 0 1 0-1.414Z',
})
