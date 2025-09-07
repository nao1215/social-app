// Reactライブラリをインポート / Import React library
import React from 'react'

// コンポーザー開く機能のフックをインポート / Import hook for opening composer functionality
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
// ダイアログ状態管理のフックをインポート / Import dialog state management hook
import {useDialogStateContext} from '#/state/dialogs'
// ライトボックス（画像表示）状態管理のフックをインポート / Import lightbox (image display) state management hook
import {useLightbox} from '#/state/lightbox'
// モーダル状態管理のフックをインポート / Import modal state management hook
import {useModals} from '#/state/modals'
// セッション（ログイン状態）管理のフックをインポート / Import session (login state) management hook
import {useSession} from '#/state/session'
// ドロワー開閉状態のフックをインポート / Import drawer open/close state hook
import {useIsDrawerOpen} from '#/state/shell/drawer-open'

/**
 * キーボードイベントを無視すべきかを判定する関数
 * hotkeys-jsライブラリの実装を参考にしている
 * 
 * Function to determine if keyboard events should be ignored
 * Based on the hotkeys-js library implementation
 * 
 * Based on {@link https://github.com/jaywcjlove/hotkeys-js/blob/b0038773f3b902574f22af747f3bb003a850f1da/src/index.js#L51C1-L64C2}
 * 
 * @param event - キーボードイベント / Keyboard event
 * @returns イベントを無視すべき場合はtrue / Returns true if the event should be ignored
 */
function shouldIgnore(event: KeyboardEvent) {
  const target: any = event.target || event.srcElement // イベントのターゲット要素を取得 / Get event target element
  if (!target) return false // ターゲットがない場合は無視しない / Don't ignore if no target
  const {tagName} = target // HTML要素のタグ名を取得 / Get HTML element tag name
  if (!tagName) return false // タグ名がない場合は無視しない / Don't ignore if no tag name
  
  // テキスト入力可能なINPUT要素かを判定（チェックボックス等は除外） / Determine if it's a text-input INPUT element (excluding checkboxes, etc.)
  const isInput =
    tagName === 'INPUT' &&
    ![
      'checkbox',
      'radio',
      'range',
      'button',
      'file',
      'reset',
      'submit',
      'color',
    ].includes(target.type)
  
  // 以下の場合はキーボードショートカットを無視する / Ignore keyboard shortcuts in the following cases:
  // - 編集可能なコンテンツ / Editable content
  // - 読み取り専用でないINPUT、TEXTAREA、SELECT要素 / Non-readonly INPUT, TEXTAREA, SELECT elements
  if (
    target.isContentEditable ||
    ((isInput || tagName === 'TEXTAREA' || tagName === 'SELECT') &&
      !target.readOnly)
  ) {
    return true
  }
  return false
}

/**
 * コンポーザー用のキーボードショートカット（'n'キー）を設定するカスタムフック
 * ログイン中でUI要素が開いていない状態でのみ動作する
 * 
 * Custom hook to set up keyboard shortcut ('n' key) for the composer
 * Only works when logged in and no UI elements are open
 * 
 * @returns void - 副作用のみでreturnなし / Side effects only, no return value
 */
export function useComposerKeyboardShortcut() {
  const {openComposer} = useOpenComposer() // コンポーザーを開く機能を取得 / Get function to open composer
  const {openDialogs} = useDialogStateContext() // 開いているダイアログの状態を取得 / Get state of open dialogs
  const {isModalActive} = useModals() // モーダルの表示状態を取得 / Get modal display state
  const {activeLightbox} = useLightbox() // ライトボックスの表示状態を取得 / Get lightbox display state
  const isDrawerOpen = useIsDrawerOpen() // ドロワーの開閉状態を取得 / Get drawer open/close state
  const {hasSession} = useSession() // ログイン状態を取得 / Get login state

  React.useEffect(() => {
    // ログインしていない場合はキーボードショートカットを無効化 / Disable keyboard shortcut if not logged in
    if (!hasSession) {
      return
    }

    /**
     * キーボードイベントハンドラー
     * 'n'または'N'キーでコンポーザーを開く
     * 
     * Keyboard event handler
     * Opens composer on 'n' or 'N' key press
     */
    function handler(event: KeyboardEvent) {
      if (shouldIgnore(event)) return // 入力フィールドなどでは無視 / Ignore in input fields, etc.
      
      // 以下の場合はショートカットを無効化 / Disable shortcut in the following cases:
      // - ダイアログが開いている / Dialogs are open
      // - モーダルが表示されている / Modals are displayed
      // - ライトボックスが表示されている / Lightbox is displayed
      // - ドロワーが開いている / Drawer is open
      if (
        openDialogs?.current.size > 0 ||
        isModalActive ||
        activeLightbox ||
        isDrawerOpen
      )
        return
      
      // 'n'または'N'キーが押された場合、コンポーザーを開く / Open composer when 'n' or 'N' key is pressed
      if (event.key === 'n' || event.key === 'N') {
        openComposer({}) // 空のオプションでコンポーザーを開く / Open composer with empty options
      }
    }
    
    // キーボードイベントリスナーを追加 / Add keyboard event listener
    document.addEventListener('keydown', handler)
    // クリーンアップ関数でイベントリスナーを削除 / Remove event listener in cleanup function
    return () => document.removeEventListener('keydown', handler)
  }, [
    openComposer,
    isModalActive,
    openDialogs,
    activeLightbox,
    isDrawerOpen,
    hasSession,
  ])
}
