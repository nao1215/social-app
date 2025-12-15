/**
 * エイリアンアイコンモジュール
 * Alien Icon Module
 *
 * エイリアン（宇宙人）を表すアイコンを提供します。
 * ユーモラスな表現やSF関連の機能、または「未知」や「外部」を
 * 表現する際に使用されます。
 *
 * Provides an alien (extraterrestrial) icon.
 * Used for humorous expressions, SF-related features, or to represent
 * "unknown" or "external" concepts.
 *
 * 【Goユーザー向け補足】
 * - SVGパス: d属性の文字列で、M(moveTo)、L(lineTo)、C(curveTo)などの
 *   コマンドで形状を定義。GoのパスビルダーやSVGライブラリと同様の概念
 * - Props: TypeScriptの型定義で、Goの構造体フィールドタグに相当
 *   fill、size、styleなどのカスタマイズ可能なプロパティを定義
 */

// SVGアイコンテンプレート - 単一パスSVGアイコンを作成するヘルパー関数
// SVG icon template - helper function to create single-path SVG icons
import {createSinglePathSVG} from './TEMPLATE'

/**
 * エイリアンアイコン (ストローク2, 角丸なし)
 * Alien Icon (Stroke 2, No Corner Radius)
 *
 * 大きな目を持つクラシックなエイリアンの頭部デザインです。
 * 頭部は逆U字型で、2つの楕円形の目が特徴的です。
 * ストローク幅2px、角の丸みなしのシャープなスタイルを使用しています。
 *
 * Classic alien head design with large eyes.
 * Features an inverted U-shaped head with two oval eyes.
 * Uses sharp styling with 2px stroke width and no corner radius.
 *
 * @example
 * ```tsx
 * <Alien_Stroke2_Corner0_Rounded fill="green" size={32} />
 * ```
 */
export const Alien_Stroke2_Corner0_Rounded = createSinglePathSVG({
  path: 'M5 11a7 7 0 0 1 14 0c0 2.625-1.547 5.138-3.354 7.066a17.23 17.23 0 0 1-2.55 2.242 8.246 8.246 0 0 1-.924.577 2.904 2.904 0 0 1-.172.083 2.904 2.904 0 0 1-.172-.083 8.246 8.246 0 0 1-.923-.577 17.227 17.227 0 0 1-2.55-2.242C6.547 16.138 5 13.625 5 11Zm6.882 10.012Zm.232-.001h-.003a.047.047 0 0 0 .007.001l-.004-.001ZM12 2a9 9 0 0 0-9 9c0 3.375 1.953 6.362 3.895 8.434a19.216 19.216 0 0 0 2.856 2.508c.425.3.82.545 1.159.72.168.087.337.164.498.222.14.05.356.116.592.116s.451-.066.592-.116c.16-.058.33-.135.498-.222.339-.175.734-.42 1.159-.72.85-.6 1.87-1.457 2.856-2.508C19.047 17.362 21 14.375 21 11a9 9 0 0 0-9-9ZM7.38 9.927c2.774-.094 3.459 1.31 3.591 3.19a.89.89 0 0 1-.855.956c-2.774.094-3.458-1.31-3.59-3.19a.89.89 0 0 1 .854-.956Zm9.236 0c-2.774-.094-3.458 1.31-3.59 3.19a.89.89 0 0 0 .854.956c2.774.094 3.459-1.31 3.591-3.19a.89.89 0 0 0-.855-.956Z',
})
