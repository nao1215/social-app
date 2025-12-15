// Reactライブラリのインポート - コンポーネントの作成に使用
import React from 'react'
// AT Protocol APIの型定義インポート - Blueskyのグラフ定義（リスト等）
import {type AppBskyGraphDefs} from '@atproto/api'

// 非リアクティブコールバックフック - パフォーマンス最適化のためのカスタムフック
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

/**
 * リスト作成・編集モーダルの型定義
 * ユーザーリストの作成や既存リストの編集時に使用
 */
export interface CreateOrEditListModal {
  name: 'create-or-edit-list'    // モーダルの識別子
  purpose?: string               // リストの目的・用途
  list?: AppBskyGraphDefs.ListView  // 編集対象のリスト（編集時のみ）
  onSave?: (uri: string) => void // 保存時のコールバック関数
}

/**
 * ユーザーのリスト追加・削除モーダルの型定義
 * 特定ユーザーをリストに追加/削除する際に使用
 */
export interface UserAddRemoveListsModal {
  name: 'user-add-remove-lists' // モーダルの識別子
  subject: string               // 対象ユーザーのID
  handle: string                // ユーザーハンドル名
  displayName: string           // 表示名
  onAdd?: (listUri: string) => void    // リスト追加時のコールバック
  onRemove?: (listUri: string) => void // リスト削除時のコールバック
}

/**
 * アカウント削除モーダルの型定義
 * アカウントの完全削除処理時に使用
 */
export interface DeleteAccountModal {
  name: 'delete-account' // モーダルの識別子
}

/**
 * ウェイトリストモーダルの型定義
 * 招待制時期のウェイトリスト登録に使用
 */
export interface WaitlistModal {
  name: 'waitlist' // モーダルの識別子
}

/**
 * 招待コードモーダルの型定義
 * 招待コードの管理・表示に使用
 */
export interface InviteCodesModal {
  name: 'invite-codes' // モーダルの識別子
}

/**
 * コンテンツ言語設定モーダルの型定義
 * 表示言語やフィルタリング設定に使用
 */
export interface ContentLanguagesSettingsModal {
  name: 'content-languages-settings' // モーダルの識別子
}

/**
 * @deprecated DO NOT ADD NEW MODALS
 * 非推奨：新しいモーダルは追加しないでください
 * 代わりにダイアログシステム（#/components/Dialog.tsx）を使用してください
 */
export type Modal =
  // Account - アカウント関連
  | DeleteAccountModal

  // Curation - コンテンツキュレーション関連
  | ContentLanguagesSettingsModal

  // Lists - リスト関連
  | CreateOrEditListModal
  | UserAddRemoveListsModal

  // Bluesky access - Blueskyアクセス関連
  | WaitlistModal
  | InviteCodesModal

// モーダル状態管理用のReactコンテキスト
// アクティブなモーダルの状態を保持・共有
const ModalContext = React.createContext<{
  isModalActive: boolean // モーダルが1つでも開いているかのフラグ
  activeModals: Modal[]  // 現在アクティブなモーダルの配列（スタック構造）
}>({
  isModalActive: false, // デフォルト：モーダル非表示
  activeModals: [],     // デフォルト：空の配列
})
ModalContext.displayName = 'ModalContext' // デバッグ用の表示名

// モーダル操作用のReactコンテキスト
// モーダルの開閉操作を管理
const ModalControlContext = React.createContext<{
  openModal: (modal: Modal) => void    // モーダル開く関数
  closeModal: () => boolean            // 最上位モーダルを閉じる関数
  closeAllModals: () => boolean        // 全モーダルを閉じる関数
}>({
  openModal: () => {},      // デフォルト：空関数
  closeModal: () => false,  // デフォルト：false返却
  closeAllModals: () => false, // デフォルト：false返却
})
ModalControlContext.displayName = 'ModalControlContext' // デバッグ用の表示名

/**
 * モーダル管理プロバイダー
 * アプリケーション全体でモーダルの状態と操作を提供
 * @deprecated 新しいモーダルは追加せず、ダイアログシステムを使用してください
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  // アクティブなモーダルの状態管理（スタック構造）
  const [activeModals, setActiveModals] = React.useState<Modal[]>([])

  // モーダルを開く関数（スタック末尾に追加）
  const openModal = useNonReactiveCallback((modal: Modal) => {
    setActiveModals(modals => [...modals, modal])
  })

  // 最上位モーダルを閉じる関数（スタック末尾から削除）
  const closeModal = useNonReactiveCallback(() => {
    let wasActive = activeModals.length > 0 // 閉じる前の状態を記録
    setActiveModals(modals => {
      return modals.slice(0, -1) // 末尾要素を削除
    })
    return wasActive // 実際に閉じたかどうかを返却
  })

  // 全てのモーダルを閉じる関数（スタックをクリア）
  const closeAllModals = useNonReactiveCallback(() => {
    let wasActive = activeModals.length > 0 // 閉じる前の状態を記録
    setActiveModals([]) // 配列を空にしてスタックをクリア
    return wasActive // 実際に閉じたかどうかを返却
  })

  // モーダル状態オブジェクトのメモ化（パフォーマンス最適化）
  const state = React.useMemo(
    () => ({
      isModalActive: activeModals.length > 0, // モーダルがアクティブかの判定
      activeModals, // アクティブなモーダルの配列
    }),
    [activeModals], // activeModalsが変更された時のみ再計算
  )

  // モーダル操作メソッドのメモ化（パフォーマンス最適化）
  const methods = React.useMemo(
    () => ({
      openModal,     // モーダル開く関数
      closeModal,    // モーダル閉じる関数
      closeAllModals, // 全モーダル閉じる関数
    }),
    [openModal, closeModal, closeAllModals], // 依存する関数が変更された時のみ再計算
  )

  return (
    // モーダル状態を子コンポーネントに提供
    <ModalContext.Provider value={state}>
      {/* モーダル操作メソッドを子コンポーネントに提供 */}
      <ModalControlContext.Provider value={methods}>
        {children}
      </ModalControlContext.Provider>
    </ModalContext.Provider>
  )
}

/**
 * モーダル状態取得フック
 * @deprecated ダイアログシステム（#/components/Dialog.tsx）を使用してください
 * @returns モーダルの状態情報（アクティブ状態、アクティブなモーダル配列）
 */
export function useModals() {
  return React.useContext(ModalContext)
}

/**
 * モーダル操作フック
 * @deprecated ダイアログシステム（#/components/Dialog.tsx）を使用してください
 * @returns モーダル操作関数（開く、閉じる、全て閉じる）
 */
export function useModalControls() {
  return React.useContext(ModalControlContext)
}
