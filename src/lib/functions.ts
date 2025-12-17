/**
 * 汎用ユーティリティ関数モジュール
 *
 * 【概要】
 * 配列操作、オブジェクト比較、選択ユーティリティなどの汎用関数を提供。
 *
 * 【主な機能】
 * - choose: キーに基づく値の選択
 * - dedupArray: 配列の重複排除
 * - replaceEqualDeep: 構造的共有による深い等価比較
 * - isPlainObject/isPlainArray: オブジェクト/配列の判定
 *
 * 【Goユーザー向け補足】
 * - Set: Goのmap[T]struct{}に相当
 * - ジェネリクス<T>: Goのtype parametersに相当
 * - Record<K, V>: Goのmap[K]Vに相当
 */

/**
 * キーに対応する値を選択する
 *
 * 【使用例】
 * choose('a', {a: 1, b: 2, c: 3}) // → 1
 *
 * @param value キー
 * @param choices 選択肢オブジェクト
 * @returns キーに対応する値
 */
export function choose<U, T extends Record<string, U>>(
  value: keyof T,
  choices: T,
): U {
  return choices[value]
}

/**
 * 配列から重複要素を除去
 *
 * 【使用例】
 * dedupArray([1, 2, 2, 3, 3, 3]) // → [1, 2, 3]
 *
 * @param arr 重複を含む可能性のある配列
 * @returns 重複が除去された配列
 */
export function dedupArray<T>(arr: T[]): T[] {
  const s = new Set(arr)
  return [...s]
}

/**
 * Taken from @tanstack/query-core utils.ts
 * Modified to support Date object comparisons
 *
 * This function returns `a` if `b` is deeply equal.
 * If not, it will replace any deeply equal children of `b` with those of `a`.
 * This can be used for structural sharing between JSON values for example.
 */
export function replaceEqualDeep(a: any, b: any): any {
  if (a === b) {
    return a
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime() ? a : b
  }

  const array = isPlainArray(a) && isPlainArray(b)

  if (array || (isPlainObject(a) && isPlainObject(b))) {
    const aItems = array ? a : Object.keys(a)
    const aSize = aItems.length
    const bItems = array ? b : Object.keys(b)
    const bSize = bItems.length
    const copy: any = array ? [] : {}

    let equalItems = 0

    for (let i = 0; i < bSize; i++) {
      const key = array ? i : bItems[i]
      if (
        !array &&
        a[key] === undefined &&
        b[key] === undefined &&
        aItems.includes(key)
      ) {
        copy[key] = undefined
        equalItems++
      } else {
        copy[key] = replaceEqualDeep(a[key], b[key])
        if (copy[key] === a[key] && a[key] !== undefined) {
          equalItems++
        }
      }
    }

    return aSize === bSize && equalItems === aSize ? a : copy
  }

  return b
}

/**
 * 値がプレーンな配列かを判定
 *
 * 【判定基準】
 * - Array.isArrayでtrueを返す
 * - 配列のインデックス以外のプロパティがない
 *
 * @param value 判定対象
 * @returns プレーン配列ならtrue
 */
export function isPlainArray(value: unknown) {
  return Array.isArray(value) && value.length === Object.keys(value).length
}

/**
 * 値がプレーンオブジェクトかを判定
 *
 * 【判定基準】
 * - Object.prototype.toString()が'[object Object]'を返す
 * - コンストラクタが未定義、またはObject
 * - クラスインスタンスやカスタムオブジェクトは除外
 *
 * @see https://github.com/jonschlinkert/is-plain-object
 * @param o 判定対象
 * @returns プレーンオブジェクトならtrue
 */
export function isPlainObject(o: any): o is Object {
  if (!hasObjectPrototype(o)) {
    return false
  }

  // If has no constructor
  const ctor = o.constructor
  if (ctor === undefined) {
    return true
  }

  // If has modified prototype
  const prot = ctor.prototype
  if (!hasObjectPrototype(prot)) {
    return false
  }

  // If constructor does not have an Object-specific method
  if (!prot.hasOwnProperty('isPrototypeOf')) {
    return false
  }

  // Most likely a plain Object
  return true
}

function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}
