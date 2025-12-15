/**
 * @file レポートダイアログの定数定義
 * @description レポートダイアログで使用される定数を定義します。
 *              現在は著作権侵害報告用のDMCAリンクを提供しています。
 *
 * Go開発者向け補足:
 * - TypeScriptのexport constはGoのconst定義に相当します
 * - これらの定数はコンパイル時に値が確定し、実行時に変更できません
 */

/**
 * @const DMCA_LINK
 * @description DMCA（デジタルミレニアム著作権法）違反を報告するためのリンク。
 *              著作権侵害を報告する際に使用するBlueskyの公式サポートページへのURL。
 *
 * DMCAについて:
 * - Digital Millennium Copyright Act（デジタルミレニアム著作権法）
 * - 米国の著作権法で、オンライン上の著作権侵害に対する通知と削除の手続きを規定
 * - ユーザーが著作権侵害コンテンツを発見した場合、このリンクから報告可能
 */
export const DMCA_LINK = 'https://bsky.social/about/support/copyright'
