/**
 * Webスクロール復元フック
 *
 * 【概要】
 * ブラウザの戻る/進む操作時にスクロール位置を復元。
 * SPAでのスクロール位置管理を手動で実装。
 *
 * 【問題の背景】
 * - ブラウザ標準のスクロール復元はSPAで正しく動作しない
 * - React Navigationの画面遷移では復元が必要
 * - history.scrollRestoration = 'manual'でブラウザの自動復元を無効化
 *
 * 【動作原理】
 * 1. 画面遷移前にscrollYをMapに保存
 * 2. 画面復帰時（focus）に保存した位置へスクロール
 * 3. キーは画面のtarget（一意識別子）
 *
 * 【既知の問題】
 * - scrollYsのMapは現在クリーンアップされない（軽微なメモリリーク）
 * - sessionStorageへの移行を検討中
 *
 * 【Goユーザー向け補足】
 * - Map: Goのmap[string]intに相当
 * - __unsafe_action__: 内部APIへのアクセス（非公式だが動作する）
 * - history.scrollRestoration: ブラウザのスクロール復元制御
 */
import {useEffect, useMemo, useState} from 'react'
import {EventArg, useNavigation} from '@react-navigation/core'

// ブラウザのスクロール自動復元を無効化（手動管理に切り替え）
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

/**
 * スクロール状態の初期値を生成
 * scrollYs: 各画面のスクロール位置を保持
 * focusedKey: 現在フォーカスされている画面のキー
 */
function createInitialScrollState() {
  return {
    scrollYs: new Map(),
    focusedKey: null as string | null,
  }
}

/**
 * Web環境でのスクロール位置復元フック
 *
 * 【使用例】
 * const screenListeners = useWebScrollRestoration()
 * <Stack.Navigator screenListeners={screenListeners}>
 *
 * @returns 画面リスナーオブジェクト
 */
export function useWebScrollRestoration() {
  const [state] = useState(createInitialScrollState)
  const navigation = useNavigation()

  useEffect(() => {
    function onDispatch() {
      if (state.focusedKey) {
        // Remember where we were for later.
        state.scrollYs.set(state.focusedKey, window.scrollY)
        // TODO: Strictly speaking, this is a leak. We never clean up.
        // This is because I'm not sure when it's appropriate to clean it up.
        // It doesn't seem like popstate is enough because it can still Forward-Back again.
        // Maybe we should use sessionStorage. Or check what Next.js is doing?
      }
    }
    // We want to intercept any push/pop/replace *before* the re-render.
    // There is no official way to do this yet, but this works okay for now.
    // https://twitter.com/satya164/status/1737301243519725803
    navigation.addListener('__unsafe_action__' as any, onDispatch)
    return () => {
      navigation.removeListener('__unsafe_action__' as any, onDispatch)
    }
  }, [state, navigation])

  const screenListeners = useMemo(
    () => ({
      focus(e: EventArg<'focus', boolean | undefined, unknown>) {
        const scrollY = state.scrollYs.get(e.target) ?? 0
        window.scrollTo(0, scrollY)
        state.focusedKey = e.target ?? null
      },
    }),
    [state],
  )
  return screenListeners
}
