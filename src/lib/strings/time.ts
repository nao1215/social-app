/**
 * 時間・日付ユーティリティモジュール
 *
 * 【概要】
 * 日付・時刻の表示フォーマットと計算に関するユーティリティ関数群。
 * 国際化対応の日付表示、年齢計算などを提供。
 *
 * 【Goユーザー向け補足】
 * - I18nはGoのx/text/languageパッケージに相当
 * - Dateオブジェクトはtime.Timeに相当
 */

/**
 * I18n: Linguiの国際化コンテキスト
 * ロケールに応じた日付フォーマットを提供
 */
import {I18n} from '@lingui/core'

/**
 * 日付を読みやすい形式にフォーマット
 *
 * 【出力形式】
 * ロケールに応じた日付表示。
 * 例（日本語）: "2024年1月15日 14:30"
 * 例（英語）: "January 15, 2024 at 2:30 PM"
 *
 * @param i18n 国際化コンテキスト
 * @param date 日付（数値タイムスタンプ、文字列、Dateオブジェクト）
 * @returns フォーマットされた日付文字列
 */
export function niceDate(i18n: I18n, date: number | string | Date) {
  const d = new Date(date)

  return i18n.date(d, {
    dateStyle: 'long',  // 長い日付形式
    timeStyle: 'short', // 短い時刻形式
  })
}

/**
 * 生年月日から年齢を計算
 *
 * 【アルゴリズム】
 * 1. 今日の年 - 生年 = 基本年齢
 * 2. 誕生日がまだ来ていなければ -1
 *
 * 【使用場面】
 * - アカウント作成時の年齢確認
 * - コンテンツの年齢制限判定
 *
 * @param birthDate 生年月日
 * @returns 年齢（整数）
 */
export function getAge(birthDate: Date): number {
  var today = new Date()
  var age = today.getFullYear() - birthDate.getFullYear()
  var m = today.getMonth() - birthDate.getMonth()
  // 誕生月がまだ来ていない、または誕生月で誕生日がまだ来ていない場合
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

/**
 * N年前の日付を取得
 *
 * 【使用場面】
 * - 年齢制限の閾値日付生成（例: 13年前 = 13歳以上）
 * - 「過去N年分」のデータ取得条件
 *
 * @param years 何年前か
 * @returns N年前の日付（Dateオブジェクト）
 */
export function getDateAgo(years: number): Date {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  return date
}

/**
 * 2つの日付が同じ日か比較
 *
 * 【比較項目】
 * 年、月、日のみを比較。時刻は無視する。
 *
 * 【使用場面】
 * - カレンダーでの日付選択判定
 * - 「今日」かどうかの判定
 *
 * @param a 日付1
 * @param b 日付2
 * @returns 同じ日の場合true
 */
export function simpleAreDatesEqual(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
