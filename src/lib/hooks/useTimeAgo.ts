/**
 * 時間経過表示フックモジュール
 *
 * 【概要】
 * 「○分前」「○時間前」などの相対時間表示を生成する。
 * SNSの投稿日時表示で使用される一般的なパターン。
 *
 * 【表示形式】
 * - short: "5m", "2h", "3d"（コンパクト表示）
 * - long: "5 minutes", "2 hours", "3 days"（詳細表示）
 *
 * 【国際化対応】
 * Linguiを使用して多言語対応。
 * 複数形のルールも言語ごとに正しく処理。
 *
 * 【Goユーザー向け補足】
 * - useCallback: 関数のメモ化（Goには直接対応なし）
 * - I18n: Goのx/text/messageパッケージに相当
 * - plural: 複数形の処理（Goではgo-i18nなどで実装）
 */

import {useCallback} from 'react'
import {I18n} from '@lingui/core'
import {defineMessage, msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {differenceInSeconds} from 'date-fns'

/**
 * 日付差分の表示形式
 * - long: "5 minutes ago"（長い形式）
 * - short: "5m"（短い形式）
 */
export type DateDiffFormat = 'long' | 'short'

/**
 * 日付差分の内部表現
 */
type DateDiff = {
  value: number  // 差分の数値
  unit: 'now' | 'second' | 'minute' | 'hour' | 'day' | 'month'  // 単位
  earlier: Date  // 早い方の日付
  later: Date    // 遅い方の日付
}

/**
 * 時間単位の定数（秒単位）
 * 「今」と判定する閾値: 5秒以内
 */
const NOW = 5
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH_30 = DAY * 30  // 30日を1ヶ月として計算

/**
 * 相対時間表示を取得するフック
 *
 * 【使用例】
 * const getTimeAgo = useGetTimeAgo()
 * const text = getTimeAgo(post.createdAt, new Date())
 * // → "5m" または "5 minutes"
 *
 * @param future true: 将来の時間を計算（切り上げ）、false: 過去の時間（切り下げ）
 * @returns 時間差を文字列で返す関数
 */
export function useGetTimeAgo({future = false}: {future?: boolean} = {}) {
  const {i18n} = useLingui()
  return useCallback(
    (
      earlier: number | string | Date,
      later: number | string | Date,
      options?: {format: DateDiffFormat},
    ) => {
      const diff = dateDiff(earlier, later, future ? 'up' : 'down')
      return formatDateDiff({diff, i18n, format: options?.format})
    },
    [i18n, future],
  )
}

/**
 * 2つの日付の差分を計算
 *
 * 【計算ルール】
 * - 全ての月は30日として計算
 * - earlier <= laterを前提（逆の場合は'now'を返す）
 * - 値は切り捨て（roundingオプションで変更可能）
 *
 * 【単位の選択】
 * - 5秒未満: 'now'
 * - 5秒〜60秒: 'second'
 * - 1分〜60分: 'minute'
 * - 1時間〜24時間: 'hour'
 * - 1日〜30日: 'day'
 * - 30日以上: 'month'
 *
 * @param earlier 早い方の日付
 * @param later 遅い方の日付
 * @param rounding 丸め方向（'up': 切り上げ, 'down': 切り下げ）
 * @returns 日付差分オブジェクト
 */
export function dateDiff(
  earlier: number | string | Date,
  later: number | string | Date,
  rounding: 'up' | 'down' = 'down',
): DateDiff {
  let diff = {
    value: 0,
    unit: 'now' as DateDiff['unit'],
  }
  const e = new Date(earlier)
  const l = new Date(later)
  const diffSeconds = differenceInSeconds(l, e)

  if (diffSeconds < NOW) {
    diff = {
      value: 0,
      unit: 'now' as DateDiff['unit'],
    }
  } else if (diffSeconds < MINUTE) {
    diff = {
      value: diffSeconds,
      unit: 'second' as DateDiff['unit'],
    }
  } else if (diffSeconds < HOUR) {
    const value =
      rounding === 'up'
        ? Math.ceil(diffSeconds / MINUTE)
        : Math.floor(diffSeconds / MINUTE)
    diff = {
      value,
      unit: 'minute' as DateDiff['unit'],
    }
  } else if (diffSeconds < DAY) {
    const value =
      rounding === 'up'
        ? Math.ceil(diffSeconds / HOUR)
        : Math.floor(diffSeconds / HOUR)
    diff = {
      value,
      unit: 'hour' as DateDiff['unit'],
    }
  } else if (diffSeconds < MONTH_30) {
    const value =
      rounding === 'up'
        ? Math.ceil(diffSeconds / DAY)
        : Math.floor(diffSeconds / DAY)
    diff = {
      value,
      unit: 'day' as DateDiff['unit'],
    }
  } else {
    const value =
      rounding === 'up'
        ? Math.ceil(diffSeconds / MONTH_30)
        : Math.floor(diffSeconds / MONTH_30)
    diff = {
      value,
      unit: 'month' as DateDiff['unit'],
    }
  }

  return {
    ...diff,
    earlier: e,
    later: l,
  }
}

/**
 * 日付差分を自然言語の文字列にフォーマット
 *
 * 【フォーマットルール】
 * - 全ての月は30日として計算
 * - earlier <= laterを前提（逆の場合は'now'を返す）
 * - 360日以上（12ヶ月以上）の場合は日付を直接表示（"M/D/YYYY"）
 *
 * 【出力例（short形式）】
 * - now: "now"
 * - 5 seconds: "5s"
 * - 30 minutes: "30m"
 * - 2 hours: "2h"
 * - 3 days: "3d"
 * - 2 months: "2mo"
 *
 * 【出力例（long形式）】
 * - now: "now"
 * - 5 seconds: "5 seconds"
 * - 30 minutes: "30 minutes"
 * - 2 hours: "2 hours"
 *
 * @param diff 日付差分オブジェクト
 * @param format 表示形式（'short' | 'long'）
 * @param i18n 国際化コンテキスト
 * @returns フォーマットされた文字列
 */
export function formatDateDiff({
  diff,
  format = 'short',
  i18n,
}: {
  diff: DateDiff
  format?: DateDiffFormat
  i18n: I18n
}): string {
  const long = format === 'long'

  switch (diff.unit) {
    case 'now': {
      return i18n._(msg`now`)
    }
    case 'second': {
      return long
        ? i18n._(plural(diff.value, {one: '# second', other: '# seconds'}))
        : i18n._(
            defineMessage({
              message: `${diff.value}s`,
              comment: `How many seconds have passed, displayed in a narrow form`,
            }),
          )
    }
    case 'minute': {
      return long
        ? i18n._(plural(diff.value, {one: '# minute', other: '# minutes'}))
        : i18n._(
            defineMessage({
              message: `${diff.value}m`,
              comment: `How many minutes have passed, displayed in a narrow form`,
            }),
          )
    }
    case 'hour': {
      return long
        ? i18n._(plural(diff.value, {one: '# hour', other: '# hours'}))
        : i18n._(
            defineMessage({
              message: `${diff.value}h`,
              comment: `How many hours have passed, displayed in a narrow form`,
            }),
          )
    }
    case 'day': {
      return long
        ? i18n._(plural(diff.value, {one: '# day', other: '# days'}))
        : i18n._(
            defineMessage({
              message: `${diff.value}d`,
              comment: `How many days have passed, displayed in a narrow form`,
            }),
          )
    }
    case 'month': {
      if (diff.value < 12) {
        return long
          ? i18n._(plural(diff.value, {one: '# month', other: '# months'}))
          : i18n._(
              defineMessage({
                message: plural(diff.value, {one: '#mo', other: '#mo'}),
                comment: `How many months have passed, displayed in a narrow form`,
              }),
            )
      }
      return i18n.date(new Date(diff.earlier))
    }
  }
}
