/**
 * React Ref統合ユーティリティモジュール
 *
 * 【概要】
 * 複数のReact refを1つのrefコールバックに統合する関数を提供。
 * 低レベルUIコンポーネント開発で、ローカルrefと外部ref（forwardRef経由）を
 * 同時に使用する必要がある場合に便利。
 *
 * 【なぜ必要か】
 * - Reactは1つのref propsに複数のrefを設定する標準的な方法を提供していない
 * - forwardRef使用時、親から渡されるrefと自身のrefを両方設定したい場合がある
 *
 * 【refの種類】
 * - 関数ref: (value) => void 形式のコールバック
 * - オブジェクトref: { current: T } 形式（useRef()の戻り値）
 * - 将来的に新しい形式が追加される可能性も考慮
 *
 * 【Goユーザー向け補足】
 * - RefCallback: Goの関数型（func(T)）に相当
 * - MutableRefObject: Goの*T（ポインタ）に類似
 * - ジェネリクス<T>: Goのtype parametersに相当
 *
 * @see https://github.com/gregberge/react-merge-refs
 */

/**
 * 複数のReact refを1つのrefコールバックに統合
 *
 * 【動作】
 * - 各refの型（関数/オブジェクト）を自動判定
 * - 関数refには値を引数として渡す
 * - オブジェクトrefには.currentプロパティに値を設定
 *
 * 【使用例】
 * const MyComponent = forwardRef((props, externalRef) => {
 *   const internalRef = useRef()
 *   return <div ref={mergeRefs([internalRef, externalRef])} />
 * })
 *
 * @param refs 統合するref配列（MutableRefObject または LegacyRef）
 * @returns 統合されたrefコールバック関数
 */
export function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>,
): React.RefCallback<T> {
  return value => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref != null) {
        ;(ref as React.MutableRefObject<T | null>).current = value
      }
    })
  }
}
