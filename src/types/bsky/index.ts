/**
 * Bluesky AT Protocol型定義ユーティリティモジュール
 *
 * このモジュールは、AT Protocolのデータ型を検証・判定するためのユーティリティ関数を提供します。
 * 高速な型チェックと厳密なスキーマ検証の2つのアプローチをサポートしています。
 *
 * ## 型の概念（Goユーザー向け）
 * - AT Protocolでは、全てのレコード型に`$type`フィールドが存在（Goのtype assertionに相当）
 * - TypeScriptの型ガード（type guard）は、Goのtype assertion/type switchに似た機能
 * - `interface`や`type`は、Goの`struct`や`type`定義に相当
 *
 * ## 使用例
 * ```typescript
 * import * as bsky from '#/types/bsky'
 *
 * // 高速チェック（信頼できるデータ向け）
 * if (bsky.dangerousIsType<AppBskyFeedPost.Record>(item, AppBskyFeedPost.isRecord)) {
 *   // itemはAppBskyFeedPost.Record型として扱える
 * }
 *
 * // 完全検証（未知のデータ向け）
 * if (bsky.validate(item, AppBskyFeedPost.validateRecord)) {
 *   // itemは完全に検証されたAppBskyFeedPost.Record型
 * }
 * ```
 *
 * @module types/bsky
 */

// AT Protocol Lexicon（スキーマ定義）の検証結果型
// Goの`error`と`bool`を組み合わせたような検証結果を表現
import {ValidationResult} from '@atproto/lexicon'

// サブモジュールの再エクスポート
// Goの`package`に相当する構造で、型定義を整理
export * as post from '#/types/bsky/post'         // 投稿関連型
export * as profile from '#/types/bsky/profile'   // プロフィール関連型
export * as starterPack from '#/types/bsky/starterPack'  // スターターパック関連型

/**
 * 高速型チェック関数（完全なスキーマ検証なし）
 *
 * 信頼できるデータソース（アプリビューからの取得データなど）や、
 * クリティカルでない処理パスで使用する高速な型判定を提供します。
 *
 * ## 動作原理
 * SDKの`is*`ユーティリティは、オブジェクト全体のスキーマを検証せず、
 * `$type`文字列のみをチェックします（Goのtype assertionの簡易版に相当）。
 * これにより、パフォーマンスが向上しますが、データの整合性は保証されません。
 *
 * ## 使用上の注意
 * - 信頼できるデータソース（自社APIなど）からのデータにのみ使用
 * - 未知のデータや外部APIからのデータには`validate`関数を使用
 *
 * ## Goユーザー向け補足
 * Goの以下のパターンに相当：
 * ```go
 * if record, ok := data.(*AppBskyFeedPost); ok {
 *     // recordを使用（型のみチェック、内容は未検証）
 * }
 * ```
 *
 * @template R - チェックする型（$typeフィールドを持つ）
 * @param record - 検証対象のオブジェクト（unknownから型を判定）
 * @param identity - 型判定関数（SDKの`is*`関数）
 * @returns 型ガード結果（trueの場合、recordはR型として扱える）
 *
 * @example
 * ```typescript
 * import * as bsky from '#/types/bsky'
 *
 * if (bsky.dangerousIsType<AppBskyFeedPost.Record>(item, AppBskyFeedPost.isRecord)) {
 *   // `item`はAppBskyFeedPost.Record型として扱える
 *   console.log(item.text)  // 型安全にアクセス可能
 * }
 * ```
 */
export function dangerousIsType<R extends {$type?: string}>(
  record: unknown,
  identity: <V>(v: V) => v is V & {$type: NonNullable<R['$type']>},
): record is R {
  // 渡された型判定関数を実行し、結果を返す
  // TypeScriptのtype predicateにより、trueの場合はrecordの型がRに絞り込まれる
  return identity(record)
}

/**
 * 完全スキーマ検証関数（パフォーマンスコストあり）
 *
 * オブジェクト全体のスキーマを厳密に検証します。
 * パフォーマンスコストがありますが、データの整合性を完全に保証します。
 *
 * ## 使用ケース
 * - 外部APIからの未検証データ
 * - ユーザー入力データ
 * - セキュリティが重要な処理
 * - データの整合性が必須の場合
 *
 * ## Goユーザー向け補足
 * Goの以下のパターンに相当：
 * ```go
 * var record AppBskyFeedPost
 * if err := json.Unmarshal(data, &record); err == nil {
 *     if err := validator.Validate(record); err == nil {
 *         // recordは完全に検証済み
 *     }
 * }
 * ```
 *
 * @template R - 検証する型（$typeフィールドを持つ）
 * @param record - 検証対象のオブジェクト
 * @param validator - 検証関数（Lexiconスキーマに基づく完全検証）
 * @returns 検証結果（trueの場合、recordはR型として扱え、スキーマも満たす）
 *
 * @example
 * ```typescript
 * import * as bsky from '#/types/bsky'
 *
 * if (bsky.validate(item, AppBskyFeedPost.validateRecord)) {
 *   // `item`は完全に検証されたAppBskyFeedPost.Record型
 *   // 全フィールドがスキーマ定義に準拠していることが保証される
 *   console.log(item.text)  // 安全にアクセス可能
 * }
 * ```
 */
export function validate<R extends {$type?: string}>(
  record: unknown,
  validator: (v: unknown) => ValidationResult<R>,
): record is R {
  // バリデーター関数を実行し、検証の成功/失敗を返す
  // ValidationResult.successがtrueの場合、recordはR型に絞り込まれる
  return validator(record).success
}
