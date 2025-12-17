/**
 * GIF代替テキストユーティリティモジュール
 *
 * 【概要】
 * GIF画像のアクセシビリティ用代替テキストを管理。
 * ユーザー指定のaltとTenor自動生成のaltを区別して保存・復元。
 *
 * 【なぜ区別が必要か】
 * - ユーザーが意図的に設定したaltは優先すべき
 * - Tenor APIが提供するデフォルト説明も利用可能
 * - 編集時にユーザー設定を識別する必要がある
 *
 * 【プレフィックスによる識別】
 * - "Alt: " (小文字l): ユーザー指定のカスタム代替テキスト
 * - "ALT: " (大文字L): Tenorのデフォルト説明
 *
 * 【Goユーザー向け補足】
 * - 文字列操作: Goのstringsパッケージと同様
 * - オプショナル引数: Goでは可変長引数や構造体で実現
 */

/** ユーザー指定の代替テキストを示すプレフィックス（小文字l） */
const USER_ALT_PREFIX = 'Alt: '

/** Tenorデフォルト説明を示すプレフィックス（大文字L） */
const DEFAULT_ALT_PREFIX = 'ALT: '

/**
 * GIFの説明文を作成
 *
 * 【動作】
 * - ユーザーがカスタムaltを指定: "Alt: {カスタムテキスト}"
 * - 指定なし: "ALT: {Tenorの説明}"
 *
 * @param tenorDescription Tenor APIから取得したデフォルト説明
 * @param preferredAlt ユーザーが指定したカスタム代替テキスト（省略可）
 * @returns プレフィックス付きの説明文
 */
export function createGIFDescription(
  tenorDescription: string,
  preferredAlt: string = '',
) {
  preferredAlt = preferredAlt.trim()
  if (preferredAlt !== '') {
    // ユーザー指定のaltがある場合
    return USER_ALT_PREFIX + preferredAlt
  } else {
    // デフォルトのTenor説明を使用
    return DEFAULT_ALT_PREFIX + tenorDescription
  }
}

/**
 * GIFの説明文からaltテキストを解析
 *
 * 【戻り値】
 * - isPreferred: ユーザー指定のaltかどうか
 * - alt: プレフィックスを除去したテキスト
 *
 * @param description プレフィックス付きの説明文
 * @returns 解析結果（ユーザー指定かどうかとaltテキスト）
 */
export function parseAltFromGIFDescription(description: string): {
  isPreferred: boolean
  alt: string
} {
  if (description.startsWith(USER_ALT_PREFIX)) {
    // ユーザー指定のalt
    return {
      isPreferred: true,
      alt: description.replace(USER_ALT_PREFIX, ''),
    }
  } else if (description.startsWith(DEFAULT_ALT_PREFIX)) {
    // Tenorのデフォルト説明
    return {
      isPreferred: false,
      alt: description.replace(DEFAULT_ALT_PREFIX, ''),
    }
  }
  // プレフィックスなし（レガシーデータや外部ソース）
  return {
    isPreferred: false,
    alt: description,
  }
}
