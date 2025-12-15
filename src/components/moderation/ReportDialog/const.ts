/**
 * @fileoverview レポートダイアログ定数定義
 *
 * レポート（通報）ダイアログで使用される定数URLを定義。
 * 外部リンク先（著作権侵害、サポートページ）のURL定義を管理。
 *
 * @module components/moderation/ReportDialog/const
 */

/**
 * DMCA（デジタルミレニアム著作権法）関連のリンク
 *
 * 著作権侵害に関する通報や情報を提供するページのURL。
 * 一般的なモデレーション通報とは別の法的手続きが必要な場合に使用。
 *
 * Go equivalent: const DMCA_LINK = "https://..."
 */
export const DMCA_LINK = 'https://bsky.social/about/support/copyright'

/**
 * サポートページのリンク
 *
 * 一般的なサポート情報、法的リクエスト、規制遵守に関する
 * 問題を報告するためのページURL。
 *
 * レポートダイアログ内で「その他の問題」として表示されるリンク先。
 */
export const SUPPORT_PAGE = 'https://bsky.social/about/support'
