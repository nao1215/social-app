/**
 * @fileoverview シャドウ型システム - 型安全性を保証する型マーカー
 *
 * このモジュールは、元のデータとシャドウデータを型レベルで区別するための
 * ユーティリティを提供します。
 *
 * ## Goユーザー向けの説明
 * TypeScriptの型システムにおける「ブランディング」パターンの実装です。
 * Goでは以下のようなtype定義で型を分離しますが、TypeScriptでは構造的型付けのため
 * 同じ形状の型は互換性があります。これを防ぐため、unique symbolを使って
 * 異なる型として扱うようにしています。
 *
 * ```go
 * type UserId string
 * type PostId string
 * // Go: 上記2つは異なる型として扱われる（nominal typing）
 * ```
 *
 * TypeScriptでは:
 * ```typescript
 * type UserId = string
 * type PostId = string
 * // TS: 上記2つは同じ型として扱われる（structural typing）
 * ```
 *
 * Shadow型を使うことで、元データとシャドウが統合されたデータを
 * 型レベルで区別し、誤用を防ぎます。
 */

// シャドウタグ：実際のプロパティではないが、型TとShadow<T>の互換性を防ぐ
// unique symbolは各宣言ごとに一意の型を作成する（Goのtype aliasと似た効果）
// This isn't a real property, but it prevents T being compatible with Shadow<T>.
declare const shadowTag: unique symbol

/**
 * シャドウ型定義 - キャッシュされたデータを表現する型
 * 元の型Tにシャドウタグを追加して、通常のデータと区別可能にする
 *
 * ## Goユーザー向け
 * Goにおける type UserId string のような型エイリアスと似た概念
 * ただし、TypeScriptでは構造的型付けなので、unique symbolを使って
 * 名目的型付け（nominal typing）のような効果を実現している
 *
 * @template T 元の型（例: PostView, ProfileView）
 */
export type Shadow<T> = T & {[shadowTag]: true}

/**
 * 通常のデータをシャドウデータにキャストする関数
 * キャッシュシステムでデータを識別するために使用
 *
 * ## Goユーザー向け
 * Goの型変換（type conversion）に相当: UserId(str)
 * 実行時には何もせず、型情報のみを変更する
 *
 * @param value キャストしたい値
 * @returns シャドウ型にキャストされた値
 */
export function castAsShadow<T>(value: T): Shadow<T> {
  // any経由でキャスト（実際のデータ構造は変更しない）
  // Goの unsafe.Pointer を使った型変換に似ているが、TypeScriptでは安全
  return value as any as Shadow<T>
}
