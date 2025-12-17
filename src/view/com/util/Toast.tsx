/**
 * トースト通知互換レイヤー（レガシー）
 * Toast Notification Compatibility Layer (Legacy)
 *
 * 【概要】
 * 旧トーストAPIから新トーストシステムへの互換性レイヤー。
 * 古いアイコン名ベースのトースト呼び出しを新しい意味論的な型に変換。
 *
 * 【使用場面】
 * - レガシーコードからの移行期間中
 * - 古いAPI互換性が必要な場合
 *
 * 【Goユーザー向け補足】
 * - switch文: Goのswitch文と同様の分岐処理
 * - type union: Goのinterface{}に似た複数型の受け入れ
 *
 * @deprecated 新しいToastコンポーネントを使用してください / use toast components
 */

// 新トーストシステム
// New toast system
import * as toast from '#/components/Toast'

// トースト型定義
// Toast type definitions
import {type ToastType} from '#/components/Toast/types'

/**
 * レガシートースト型
 * Legacy Toast Type
 *
 * 旧APIで使用されていたアイコン名ベースの型定義。
 *
 * @deprecated ToastTypeとtoastを使用してください / use ToastType and toast instead
 */
export type LegacyToastType =
  | 'xmark' // エラー / Error
  | 'exclamation-circle' // 警告 / Warning
  | 'check' // 成功 / Success
  | 'clipboard-check' // コピー成功 / Copy success
  | 'circle-exclamation' // 警告 / Warning

/**
 * レガシートースト型を新しい型に変換
 * Convert Legacy Toast Type to New Type
 *
 * 【変換マッピング】
 * - xmark → error
 * - exclamation-circle → warning
 * - check → success
 * - clipboard-check → success
 * - circle-exclamation → warning
 *
 * @param type レガシーまたは新しいトースト型 / Legacy or new toast type
 * @returns 新しいトースト型 / New toast type
 */
export const convertLegacyToastType = (
  type: ToastType | LegacyToastType,
): ToastType => {
  switch (type) {
    // 新しい型はそのまま返す
    // Return new types as-is
    case 'default':
    case 'success':
    case 'error':
    case 'warning':
    case 'info':
      return type
    // レガシー型は変換が必要
    // Legacy types need conversion
    case 'xmark':
      return 'error'
    case 'exclamation-circle':
      return 'warning'
    case 'check':
      return 'success'
    case 'clipboard-check':
      return 'success'
    case 'circle-exclamation':
      return 'warning'
    default:
      return 'default'
  }
}

/**
 * トーストを表示（レガシーAPI）
 * Show Toast (Legacy API)
 *
 * @deprecated toast.show()を使用してください / use toast.show() instead
 * @param message 表示するメッセージ / Message to display
 * @param type トースト型（レガシーまたは新規） / Toast type (legacy or new)
 */
export function show(
  message: string,
  type: ToastType | LegacyToastType = 'default',
): void {
  // レガシー型を新しい型に変換して表示
  // Convert legacy type to new type and display
  const convertedType = convertLegacyToastType(type)
  toast.show(message, {type: convertedType})
}
