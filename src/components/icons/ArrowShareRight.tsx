/**
 * 右方向共有矢印アイコンモジュール
 * Arrow Share Right Icon Module
 *
 * 右方向へ共有を示す矢印アイコンを提供します。
 * 投稿の共有、リポスト、転送などのソーシャルメディアアクションに使用されます。
 *
 * Provides an arrow icon indicating sharing to the right.
 * Used for social media actions like post sharing, reposting, or forwarding.
 *
 * 【Goユーザー向け補足】
 * - 共有アイコン: SNSで最も頻繁に使用されるアクションの1つ
 * - Bluesky文脈: リポスト（Repost）機能で使用される主要アイコン
 *   Twitterのリツイートに相当する機能を表現
 */

// SVGアイコンテンプレート - 単一パスSVGアイコンを作成するヘルパー関数
// SVG icon template - helper function to create single-path SVG icons
import {createSinglePathSVG} from './TEMPLATE'

/**
 * 右方向共有矢印アイコン (ストローク2, 角丸2)
 * Arrow Share Right Icon (Stroke 2, Corner Radius 2)
 *
 * ボックスから右方向へ2つの矢印が出ているデザインです。
 * コンテンツの拡散や共有を視覚的に表現しています。
 *
 * Design with two arrows extending right from a box.
 * Visually represents content distribution and sharing.
 *
 * @example
 * ```tsx
 * <ArrowShareRight_Stroke2_Corner2_Rounded fill="green" size={20} />
 * ```
 */
export const ArrowShareRight_Stroke2_Corner2_Rounded = createSinglePathSVG({
  path: 'M11.839 4.744c0-1.488 1.724-2.277 2.846-1.364l.107.094 7.66 7.256.128.134c.558.652.558 1.62 0 2.272l-.128.135-7.66 7.255c-1.115 1.057-2.953.267-2.953-1.27v-2.748c-3.503.055-5.417.41-6.592.97-.997.474-1.525 1.122-2.084 2.14l-.243.46c-.558 1.088-2.09.583-2.08-.515l.015-.748c.111-3.68.777-6.5 2.546-8.415 1.83-1.98 4.63-2.771 8.438-2.884V4.744Zm2 3.256c0 .79-.604 1.41-1.341 1.494l-.149.01c-3.9.057-6.147.813-7.48 2.254-.963 1.043-1.562 2.566-1.842 4.79.38-.327.826-.622 1.361-.877 1.656-.788 4.08-1.14 7.938-1.169l.153.007c.754.071 1.36.704 1.36 1.491v2.675L20.884 12l-7.045-6.676V8Z',
})
