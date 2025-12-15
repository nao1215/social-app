/**
 * 表示名処理モジュール
 *
 * 【概要】
 * ユーザーの表示名（DisplayName）のサニタイズと整形を行う。
 * なりすまし防止のため、特定の文字を除去する。
 *
 * 【セキュリティ上の重要性】
 * - チェックマーク絵文字を表示名に含めることで「公式アカウント」を装う詐欺を防止
 * - 制御文字によるUI操作の悪用を防止
 *
 * 【Goユーザー向け補足】
 * - 正規表現はGoのregexpパッケージと同様
 * - Unicodeエスケープ（\u2705など）はGoでも同じ
 */

/**
 * ModerationUI: モデレーション情報
 * blur: trueの場合、コンテンツを非表示にする
 */
import {ModerationUI} from '@atproto/api'

/**
 * チェックマーク文字の正規表現
 *
 * 【除去対象】
 * - \u2705 = ✅（チェックマークボタン絵文字）
 * - \u2713 = ✓（チェックマーク）
 * - \u2714 = ✔（重いチェックマーク）
 * - \u2611 = ☑（チェックボックス）
 *
 * 【除去理由】
 * これらの文字を表示名に含めることで「認証済み」を
 * 装う詐欺行為を防止するため
 */
const CHECK_MARKS_RE = /[\u2705\u2713\u2714\u2611]/gu

/**
 * 制御文字の正規表現
 *
 * 【除去対象】
 * - \u0000-\u001F: C0制御文字
 * - \u007F-\u009F: DEL文字とC1制御文字
 * - \u061C: アラビア語マーク
 * - \u200E-\u200F: 左右マーク
 * - \u202A-\u202E: 双方向テキスト埋め込み
 * - \u2066-\u2069: 方向分離記号
 *
 * 【除去理由】
 * これらの不可視文字でUIを操作する攻撃を防止
 */
const CONTROL_CHARS_RE =
  /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g

/**
 * 連続空白の正規表現
 * 空白文字（スペース、タブ等）が連続、またはゼロ幅スペースを含む場合にマッチ
 */
const MULTIPLE_SPACES_RE = /[\s][\s\u200B]+/g

/**
 * 表示名をサニタイズ
 *
 * 【処理内容】
 * 1. モデレーションでblur指定 → 空文字を返す
 * 2. チェックマーク絵文字を除去
 * 3. 制御文字を除去
 * 4. 連続空白を1つのスペースに正規化
 * 5. 前後の空白を除去
 *
 * @param str サニタイズする表示名
 * @param moderation モデレーション情報（オプション）
 * @returns サニタイズされた表示名
 */
export function sanitizeDisplayName(
  str: string,
  moderation?: ModerationUI,
): string {
  if (moderation?.blur) {
    return ''
  }
  if (typeof str === 'string') {
    return str
      .replace(CHECK_MARKS_RE, '')
      .replace(CONTROL_CHARS_RE, '')
      .replace(MULTIPLE_SPACES_RE, ' ')
      .trim()
  }
  return ''
}

/**
 * 表示名とハンドルを組み合わせた文字列を生成
 *
 * 【出力形式】
 * - 表示名がある場合: "表示名 (@handle)"
 * - 表示名がない場合: "@handle"
 * - ハンドルがない場合: ""
 *
 * 【使用場面】
 * - 共有テキスト生成
 * - 通知メッセージ
 * - プロフィールのタイトル
 *
 * @param handle ユーザーハンドル
 * @param displayName 表示名（オプション）
 * @returns 組み合わせた表示文字列
 */
export function combinedDisplayName({
  handle,
  displayName,
}: {
  handle?: string
  displayName?: string
}): string {
  if (!handle) {
    return ''
  }
  return displayName
    ? `${sanitizeDisplayName(displayName)} (@${handle})`
    : `@${handle}`
}
