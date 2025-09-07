// BCP-47言語タグパーサー - 言語コードの正規化に使用
import {parse} from 'bcp-47'

// 配列の重複除去ユーティリティ関数
import {dedupArray} from '#/lib/functions'
// ログ出力システム
import {logger} from '#/logger'
// 永続化データのスキーマ定義
import {Schema} from '#/state/persisted/schema'

/**
 * 永続化データの正規化処理
 * 保存されたデータを一貫した形式に変換し、アプリケーションで安全に使用できるようにする
 * 主に言語設定の正規化を行う
 * @param data 正規化対象のスキーマデータ
 * @returns 正規化されたデータ
 */
export function normalizeData(data: Schema) {
  const next = {...data} // 元データをコピーして不変性を保持

  /**
   * 言語設定の正規化処理
   * 言語コードを2文字の国コード（地域なし）に統一する
   * Normalize language prefs to ensure that these values only contain 2-letter
   * country codes without region.
   */
  try {
    const langPrefs = {...next.languagePrefs} // 言語設定をコピー
    
    // プライマリ言語の正規化
    langPrefs.primaryLanguage = normalizeLanguageTagToTwoLetterCode(
      langPrefs.primaryLanguage,
    )
    
    // コンテンツ言語の正規化（重複除去も実施）
    langPrefs.contentLanguages = dedupArray(
      langPrefs.contentLanguages.map(lang =>
        normalizeLanguageTagToTwoLetterCode(lang),
      ),
    )
    
    // 投稿言語設定の正規化（カンマ区切り文字列対応）
    langPrefs.postLanguage = langPrefs.postLanguage
      .split(',')                                               // カンマで分割
      .map(lang => normalizeLanguageTagToTwoLetterCode(lang))  // 各言語を正規化
      .filter(Boolean)                                         // 空値を除外
      .join(',')                                               // カンマで結合
      
    // 投稿言語履歴の正規化（重複除去も実施）
    langPrefs.postLanguageHistory = dedupArray(
      langPrefs.postLanguageHistory.map(postLanguage => {
        return postLanguage
          .split(',')                                               // カンマで分割
          .map(lang => normalizeLanguageTagToTwoLetterCode(lang))  // 各言語を正規化
          .filter(Boolean)                                         // 空値を除外
          .join(',')                                               // カンマで結合
      }),
    )
    
    next.languagePrefs = langPrefs // 正規化された言語設定を反映
  } catch (e: any) {
    // 正規化処理でエラーが発生した場合のログ出力
    logger.error(`persisted state: failed to normalize language prefs`, {
      safeMessage: e.message,
    })
  }

  return next
}

/**
 * 言語タグを2文字コードに正規化する関数
 * BCP-47形式の言語タグから言語部分のみを抽出
 * 例：'en-US' -> 'en', 'ja-JP' -> 'ja'
 * @param lang 正規化対象の言語タグ
 * @returns 2文字言語コード（抽出できない場合は元の文字列）
 */
export function normalizeLanguageTagToTwoLetterCode(lang: string) {
  const result = parse(lang).language // BCP-47パーサーで言語部分を抽出
  return result ?? lang // 抽出結果がない場合は元の文字列を返却
}
