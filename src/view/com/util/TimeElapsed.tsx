/**
 * 経過時間表示コンポーネント
 * Time Elapsed Display Component
 *
 * 【概要】
 * タイムスタンプからの経過時間を計算し、リアルタイムで更新表示する。
 * 「3分前」「2時間前」などの相対時間表示に使用。
 *
 * 【主な機能】
 * - 経過時間の自動計算
 * - 1分ごとの自動更新
 * - 国際化対応（言語ごとの表示形式）
 * - カスタム文字列フォーマット対応
 *
 * 【Goユーザー向け補足】
 * - Render Props: 子を関数として受け取り、計算結果を渡すパターン
 *   Goで関数を引数に取って結果を渡すコールバックパターンに似る
 * - useTickEveryMinute: 1分ごとに更新をトリガーするフック
 *   Goの time.Ticker に相当
 *
 * 【使用例】
 * ```tsx
 * <TimeElapsed timestamp="2024-01-01T12:00:00Z">
 *   {({timeElapsed}) => <Text>{timeElapsed}</Text>}
 * </TimeElapsed>
 * // 出力: "3分前" / "2時間前" / "昨日" など
 * ```
 */

// Reactコア
// React core
import React from 'react'

// Lingui国際化コアの型
// Lingui i18n core type
import {I18n} from '@lingui/core'

// 国際化フック
// Internationalization hook
import {useLingui} from '@lingui/react'

// 経過時間計算フック
// Time ago calculation hook
import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'

// 1分ごとの更新トリガーフック
// Every-minute update trigger hook
import {useTickEveryMinute} from '#/state/shell'

/**
 * 経過時間表示コンポーネント
 * Time Elapsed Component
 *
 * 【Render Propsパターン】
 * 子コンポーネントは関数として定義され、計算された経過時間を受け取る。
 * これにより、親コンポーネントは時間計算ロジックをカプセル化しつつ、
 * 子コンポーネントに表示の自由度を与える。
 *
 * @param timestamp ISO8601形式のタイムスタンプ / ISO8601 timestamp
 * @param children 経過時間を受け取るrender prop関数 / Render prop function receiving elapsed time
 * @param timeToString カスタム文字列変換関数（オプション） / Custom string conversion function (optional)
 */
export function TimeElapsed({
  timestamp,
  children,
  timeToString,
}: {
  /** ISO8601形式のタイムスタンプ / ISO8601 timestamp */
  timestamp: string
  /** Render prop: 経過時間文字列を受け取りJSXを返す / Render prop: receives time string, returns JSX */
  children: ({timeElapsed}: {timeElapsed: string}) => JSX.Element
  /** カスタム文字列変換関数 / Custom string conversion function */
  timeToString?: (i18n: I18n, timeElapsed: string) => string
}) {
  // 国際化インスタンス
  // Internationalization instance
  const {i18n} = useLingui()

  // 経過時間計算関数を取得
  // Get time ago calculation function
  const ago = useGetTimeAgo()

  // 1分ごとに更新されるティック値
  // Tick value updated every minute
  const tick = useTickEveryMinute()

  // 経過時間の状態（初期値は現在の計算結果）
  // Elapsed time state (initial value is current calculation)
  const [timeElapsed, setTimeAgo] = React.useState(() =>
    timeToString ? timeToString(i18n, timestamp) : ago(timestamp, tick),
  )

  // 前回のティック値を保持（変更検出用）
  // Hold previous tick value (for change detection)
  const [prevTick, setPrevTick] = React.useState(tick)

  // ティックが変わった場合、経過時間を再計算
  // Recalculate elapsed time when tick changes
  // 【Goユーザー向け補足】
  // Reactでは状態変更時に再レンダリングが発生。
  // このパターンは「レンダリング中の状態更新」と呼ばれ、
  // useEffectを使わずに同期的に状態を更新する。
  if (prevTick !== tick) {
    setPrevTick(tick)
    setTimeAgo(
      timeToString ? timeToString(i18n, timestamp) : ago(timestamp, tick),
    )
  }

  // Render Prop: 子関数に経過時間を渡して実行
  // Render Prop: execute child function with elapsed time
  return children({timeElapsed})
}
