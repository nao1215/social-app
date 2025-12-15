/**
 * ダイアログコンテキスト管理モジュール
 *
 * このファイルはダイアログの状態と制御を管理するためのReact Contextとカスタムフックを提供する。
 * ダイアログの開閉制御、アクティブなダイアログの追跡、ドラッグ無効化などの機能を含む。
 *
 * 主な機能:
 * - Context: ダイアログ内部で使用するコンテキスト（close関数、ネイティブ設定など）
 * - useDialogContext: ダイアログ内部から状態を取得するフック
 * - useDialogControl: ダイアログの開閉を制御するためのフック
 */

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react'

// グローバルなダイアログ状態を管理するコンテキスト
import {useDialogStateContext} from '#/state/dialogs'
// ダイアログ関連の型定義
import {
  type DialogContextProps,
  type DialogControlRefProps,
  type DialogOuterProps,
} from '#/components/Dialog/types'
// ボトムシートのスナップポイント（表示位置）の型
import {BottomSheetSnapPoint} from '../../../modules/bottom-sheet/src/BottomSheet.types'

/**
 * ダイアログ内部で使用するコンテキスト
 *
 * このコンテキストはダイアログコンポーネント内部で使用され、
 * 子コンポーネントがダイアログの状態や制御関数にアクセスできるようにする。
 *
 * デフォルト値はダイアログ外で使用された場合のフォールバック。
 */
export const Context = createContext<DialogContextProps>({
  close: () => {},                              // ダイアログを閉じる関数（デフォルトは何もしない）
  isNativeDialog: false,                        // ネイティブ（iOS/Android）のダイアログかどうか
  nativeSnapPoint: BottomSheetSnapPoint.Hidden, // ボトムシートの表示位置
  disableDrag: false,                           // ドラッグによる閉じ操作を無効にするか
  setDisableDrag: () => {},                     // ドラッグ無効化の設定関数
  isWithinDialog: false,                        // ダイアログ内部にいるかどうか
})
// React DevToolsでのデバッグ用表示名
Context.displayName = 'DialogContext'

/**
 * ダイアログコンテキストを取得するフック
 *
 * ダイアログ内部のコンポーネントから呼び出すことで、
 * close関数やダイアログの状態にアクセスできる。
 *
 * @returns DialogContextProps - ダイアログの状態と制御関数
 *
 * @example
 * ```tsx
 * function DialogContent() {
 *   const { close } = useDialogContext()
 *   return <Button onPress={close}>閉じる</Button>
 * }
 * ```
 */
export function useDialogContext() {
  return useContext(Context)
}

/**
 * ダイアログの開閉を制御するためのフック
 *
 * このフックは以下の処理を行う:
 * 1. ユニークなダイアログIDを生成（useId）
 * 2. open/close関数への参照を保持（useRef）
 * 3. グローバルなダイアログリストに登録/削除（useEffect）
 * 4. 制御オブジェクトを返却（useMemo）
 *
 * @returns ダイアログ制御オブジェクト { id, ref, open, close }
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const dialogControl = useDialogControl()
 *
 *   return (
 *     <>
 *       <Button onPress={() => dialogControl.open()}>開く</Button>
 *       <Dialog control={dialogControl}>
 *         <DialogContent />
 *       </Dialog>
 *     </>
 *   )
 * }
 * ```
 */
export function useDialogControl(): DialogOuterProps['control'] {
  // ReactがコンポーネントごとにユニークなIDを生成
  // 例: ":r1:", ":r2:" など
  // SSR（サーバーサイドレンダリング）でも一貫したIDが得られる
  const id = useId()

  // ダイアログの実際のopen/close関数への参照を保持
  // 初期値は空関数（ダイアログがマウントされる前に呼ばれてもエラーにならない）
  // 実際のダイアログコンポーネントがマウントされた時に、
  // このrefの中身が実際の開閉処理で上書きされる
  const control = useRef<DialogControlRefProps>({
    open: () => {},
    close: () => {},
  })

  // グローバルなダイアログ状態を管理するコンテキストから
  // アクティブなダイアログのMapを取得
  const {activeDialogs} = useDialogStateContext()

  // 副作用: ダイアログの登録と削除
  useEffect(() => {
    // マウント時: このダイアログをグローバルリストに登録
    // これにより「全ダイアログを閉じる」などの操作が可能になる
    activeDialogs.current.set(id, control)

    // アンマウント時: リストから削除（クリーンアップ）
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      activeDialogs.current.delete(id)
    }
  }, [id, activeDialogs])

  // 制御オブジェクトをメモ化して返却
  // useMemoにより、依存配列が変わらない限り同じオブジェクト参照が返される
  // これによりダイアログコンポーネントの不要な再レンダリングを防ぐ
  return useMemo<DialogOuterProps['control']>(
    () => ({
      id,           // ダイアログの一意識別子
      ref: control, // open/close関数への参照（内部使用）
      open: () => {
        // ダイアログを開く
        // control.currentには実際のダイアログの開く処理が入っている
        control.current.open()
      },
      close: cb => {
        // ダイアログを閉じる
        // cbは閉じた後に実行されるコールバック関数（オプション）
        control.current.close(cb)
      },
    }),
    [id, control],
  )
}
