// シャドウタグ：実際のプロパティではないが、型TとShadow<T>の互換性を防ぐ
// This isn't a real property, but it prevents T being compatible with Shadow<T>.
declare const shadowTag: unique symbol

/**
 * シャドウ型定義 - キャッシュされたデータを表現する型
 * 元の型Tにシャドウタグを追加して、通常のデータと区別可能にする
 */
export type Shadow<T> = T & {[shadowTag]: true}

/**
 * 通常のデータをシャドウデータにキャストする関数
 * キャッシュシステムでデータを識別するために使用
 * @param value キャストしたい値
 * @returns シャドウ型にキャストされた値
 */
export function castAsShadow<T>(value: T): Shadow<T> {
  return value as any as Shadow<T>
}
