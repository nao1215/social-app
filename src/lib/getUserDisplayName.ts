/**
 * ユーザー表示名取得ユーティリティモジュール
 *
 * 【概要】
 * ユーザーの表示名を安全に取得するヘルパー関数を提供。
 * displayNameが未設定の場合はhandleをフォールバックとして使用。
 *
 * 【表示名の優先順位】
 * 1. displayName（設定されている場合）
 * 2. handle（@付きでサニタイズ）
 *
 * 【Goユーザー向け補足】
 * - ジェネリック型<T>: Goのジェネリクス（Go 1.18+）に相当
 * - extends: 型制約。Goの「type T interface」に類似
 * - [key: string]: any: Goのmap[string]interface{}に相当
 */
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'

/**
 * ユーザーの表示名を取得
 *
 * 【型パラメータ T】
 * - displayName?: オプショナルな表示名
 * - handle: 必須のハンドル名
 * - その他任意のプロパティ
 *
 * 【使用例】
 * const name = getUserDisplayName({ displayName: 'Alice', handle: 'alice.bsky.social' })
 * // displayNameがある場合: "Alice"
 * // displayNameがない場合: "@alice.bsky.social"
 *
 * @param props displayNameとhandleを含むオブジェクト
 * @returns サニタイズされた表示名
 */
export function getUserDisplayName<
  T extends {displayName?: string; handle: string; [key: string]: any},
>(props: T): string {
  return sanitizeDisplayName(
    // displayNameがあればそれを使用、なければ@付きのhandleを使用
    props.displayName || sanitizeHandle(props.handle, '@'),
  )
}
