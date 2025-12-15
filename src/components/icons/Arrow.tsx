/**
 * 矢印アイコンモジュール
 * Arrow Icon Module
 *
 * 様々な方向を指す矢印アイコンのコレクションを提供します。
 * ナビゲーション、方向指示、UI要素の移動などに使用されます。
 *
 * Provides a collection of arrow icons pointing in various directions.
 * Used for navigation, directional indicators, and UI element movement.
 *
 * 【Goユーザー向け補足】
 * - 方向別エクスポート: 同一ファイルから複数の関連コンポーネントをエクスポート
 *   Goのパッケージ内の複数の公開関数に相当する構造
 * - 命名規則: ArrowDirection_StyleAttributes の形式
 *   例: ArrowTop = 上向き矢印, ArrowLeft = 左向き矢印
 */

// SVGアイコンテンプレート - 単一パスSVGアイコンを作成するヘルパー関数
// SVG icon template - helper function to create single-path SVG icons
import {createSinglePathSVG} from './TEMPLATE'

/**
 * 右上矢印アイコン (ストローク2, 角丸なし)
 * Arrow Top Right Icon (Stroke 2, No Corner Radius)
 *
 * 右上方向を指す対角線の矢印です。
 * 外部リンク、新しいウィンドウで開く、展開などのアクションに使用されます。
 *
 * @example
 * ```tsx
 * <ArrowTopRight_Stroke2_Corner0_Rounded fill="blue" size={24} />
 * ```
 */
export const ArrowTopRight_Stroke2_Corner0_Rounded = createSinglePathSVG({
  path: 'M8 6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0V8.414l-9.793 9.793a1 1 0 0 1-1.414-1.414L15.586 7H9a1 1 0 0 1-1-1Z',
})

/**
 * 上矢印アイコン (ストローク2, 角丸なし)
 * Arrow Top Icon (Stroke 2, No Corner Radius)
 *
 * 真上を指す矢印です。
 * 上へスクロール、昇順ソート、前のセクションへ移動などに使用されます。
 *
 * @example
 * ```tsx
 * <ArrowTop_Stroke2_Corner0_Rounded fill="gray" size={20} />
 * ```
 */
export const ArrowTop_Stroke2_Corner0_Rounded = createSinglePathSVG({
  path: 'M11 20V6.164l-4.293 4.293a1 1 0 1 1-1.414-1.414l5.293-5.293.151-.138a2 2 0 0 1 2.677.138l5.293 5.293.068.076a1 1 0 0 1-1.406 1.406l-.076-.068L13 6.164V20a1 1 0 0 1-2 0Z',
})

/**
 * 左矢印アイコン (ストローク2, 角丸なし)
 * Arrow Left Icon (Stroke 2, No Corner Radius)
 *
 * 真左を指す矢印です。
 * 戻る、前へ、左へスライドなどのナビゲーションに使用されます。
 *
 * @example
 * ```tsx
 * <ArrowLeft_Stroke2_Corner0_Rounded fill="black" size={24} />
 * ```
 */
export const ArrowLeft_Stroke2_Corner0_Rounded = createSinglePathSVG({
  path: 'M3 12a1 1 0 0 1 .293-.707l6-6a1 1 0 0 1 1.414 1.414L6.414 11H20a1 1 0 1 1 0 2H6.414l4.293 4.293a1 1 0 0 1-1.414 1.414l-6-6A1 1 0 0 1 3 12Z',
})

/**
 * 右矢印アイコン (ストローク2, 角丸なし)
 * Arrow Right Icon (Stroke 2, No Corner Radius)
 *
 * 真右を指す矢印です。
 * 次へ、進む、右へスライドなどのナビゲーションに使用されます。
 *
 * @example
 * ```tsx
 * <ArrowRight_Stroke2_Corner0_Rounded fill="blue" size={24} />
 * ```
 */
export const ArrowRight_Stroke2_Corner0_Rounded = createSinglePathSVG({
  path: 'M21 12a1 1 0 0 1-.293.707l-6 6a1 1 0 0 1-1.414-1.414L17.586 13H4a1 1 0 1 1 0-2h13.586l-4.293-4.293a1 1 0 0 1 1.414-1.414l6 6A1 1 0 0 1 21 12Z',
})

/**
 * 下矢印アイコン (ストローク2, 角丸なし)
 * Arrow Bottom Icon (Stroke 2, No Corner Radius)
 *
 * 真下を指す矢印です。
 * 下へスクロール、降順ソート、次のセクションへ移動、ドロップダウン展開などに使用されます。
 *
 * @example
 * ```tsx
 * <ArrowBottom_Stroke2_Corner0_Rounded fill="gray" size={16} />
 * ```
 */
export const ArrowBottom_Stroke2_Corner0_Rounded = createSinglePathSVG({
  path: 'M12 21a1 1 0 0 1-.707-.293l-6-6a1 1 0 1 1 1.414-1.414L11 17.586V4a1 1 0 1 1 2 0v13.586l4.293-4.293a1 1 0 0 1 1.414 1.414l-6 6A1 1 0 0 1 12 21Z',
})
