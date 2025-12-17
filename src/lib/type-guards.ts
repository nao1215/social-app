/**
 * 型ガードユーティリティモジュール
 *
 * 【概要】
 * TypeScriptの型ガード関数を提供。
 * 実行時の型チェックとTypeScriptの型推論を連携。
 *
 * 【型ガードとは】
 * - 関数の戻り値が `v is Type` の形式
 * - trueを返すと、その後のコードでvがType型として扱われる
 * - TypeScriptコンパイラがこの情報を利用して型を絞り込む
 *
 * 【Goユーザー向け補足】
 * - 型ガード: Goの型アサーション（v, ok := x.(Type)）に類似
 * - unknown型: Goのinterface{}に相当
 * - PropertyKey: string | number | symbolの合成型
 */

/**
 * 値がオブジェクトかを判定
 *
 * 【判定】
 * - nullやundefinedではない
 * - typeof が 'object' を返す
 *
 * @param v 判定対象
 * @returns オブジェクトならtrue（型をRecord<string, unknown>に絞り込み）
 */
export function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object'
}

/**
 * オブジェクトが特定のプロパティを持つかを判定
 *
 * 【使用例】
 * if (hasProp(obj, 'name')) {
 *   console.log(obj.name) // TypeScript が name の存在を認識
 * }
 *
 * @param data 判定対象のオブジェクト
 * @param prop 存在確認するプロパティ名
 * @returns プロパティが存在すればtrue
 */
export function hasProp<K extends PropertyKey>(
  data: object,
  prop: K,
): data is Record<K, unknown> {
  return prop in data
}

/**
 * 値が文字列配列かを判定
 *
 * 【判定】
 * - 配列である
 * - 全要素がstring型
 *
 * @param v 判定対象
 * @returns 文字列配列ならtrue
 */
export function isStrArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(item => typeof item === 'string')
}
