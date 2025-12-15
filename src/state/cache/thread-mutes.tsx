// Reactライブラリのインポート - コンポーネントとエフェクト処理
import React, {useEffect} from 'react'

// 永続化ストレージ管理モジュール - データの永続保存に使用
import * as persisted from '#/state/persisted'
// セッション管理フック - エージェントとセッション情報の取得
import {useAgent, useSession} from '../session'

// スレッドミュート状態の型定義（URI文字列 -> ミュート状態のマップ）
type StateContext = Map<string, boolean>
// スレッドミュート設定関数の型定義
type SetStateContext = (uri: string, value: boolean) => void

// スレッドミュート状態管理用のReactコンテキスト
const stateContext = React.createContext<StateContext>(new Map())
stateContext.displayName = 'ThreadMutesStateContext' // デバッグ用表示名

// スレッドミュート設定関数用のReactコンテキスト
const setStateContext = React.createContext<SetStateContext>(
  (_: string) => false, // デフォルト実装（何もしない）
)
setStateContext.displayName = 'ThreadMutesSetStateContext' // デバッグ用表示名

/**
 * スレッドミュート管理プロバイダー
 * アプリケーション全体でスレッドのミュート状態を管理・提供
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  // スレッドミュート状態のMapを管理（URI -> ミュート状態）
  const [state, setState] = React.useState<StateContext>(() => new Map())

  // スレッドミュート状態を更新する関数（useCallbackで最適化）
  const setThreadMute = React.useCallback(
    (uri: string, value: boolean) => {
      setState(prev => {
        // 新しいMapを作成して不変性を保持
        const next = new Map(prev)
        next.set(uri, value) // 指定URIのミュート状態を設定
        return next
      })
    },
    [setState],
  )

  // 旧形式のミュートデータを新形式に移行する処理
  useMigrateMutes(setThreadMute)

  return (
    // スレッドミュート状態を子コンポーネントに提供
    <stateContext.Provider value={state}>
      {/* スレッドミュート設定関数を子コンポーネントに提供 */}
      <setStateContext.Provider value={setThreadMute}>
        {children}
      </setStateContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * ミュート済みスレッド一覧取得フック
 * @returns 全てのミュート済みスレッドのMapを返却
 */
export function useMutedThreads() {
  return React.useContext(stateContext)
}

/**
 * 特定スレッドのミュート状態確認フック
 * @param uri 確認したいスレッドのURI
 * @param defaultValue ミュート情報がない場合のデフォルト値
 * @returns スレッドがミュート済みかどうかのboolean値
 */
export function useIsThreadMuted(uri: string, defaultValue = false) {
  const state = React.useContext(stateContext)
  return state.get(uri) ?? defaultValue // Mapから取得、存在しない場合はデフォルト値
}

/**
 * スレッドミュート設定関数取得フック
 * @returns スレッドのミュート状態を変更する関数
 */
export function useSetThreadMute() {
  return React.useContext(setStateContext)
}

/**
 * 旧形式ミュートデータの移行処理フック
 * 永続化ストレージに保存された旧形式のミュートデータを
 * 新しいサーバーベースのミュートシステムに移行する
 * @param setThreadMute スレッドミュート設定関数
 */
function useMigrateMutes(setThreadMute: SetStateContext) {
  const agent = useAgent()                    // AT Protocol エージェント
  const {currentAccount} = useSession()       // 現在のアカウント情報

  useEffect(() => {
    if (currentAccount) {
      // 現在アカウントに関連する旧ミュートデータが存在するかチェック
      if (
        !persisted
          .get('mutedThreads')
          .some(uri => uri.includes(currentAccount.did))
      ) {
        return // 関連データがない場合は処理終了
      }

      let cancelled = false // キャンセルフラグ（クリーンアップ用）

      // 非同期移行処理
      const migrate = async () => {
        while (!cancelled) {
          const threads = persisted.get('mutedThreads') // 永続化されたミュートスレッド一覧

          // @ts-ignore findLast is polyfilled - esb
          // 現在アカウントに関連する最後のミュートスレッドを検索
          const root = threads.findLast(uri => uri.includes(currentAccount.did))

          if (!root) break // 移行対象がなければループ終了

          // 永続化ストレージから該当スレッドを削除
          persisted.write(
            'mutedThreads',
            threads.filter(uri => uri !== root),
          )

          // ローカル状態にミュート状態を設定
          setThreadMute(root, true)

          // サーバー側でスレッドをミュート
          await agent.api.app.bsky.graph
            .muteThread({root})
            // 投稿が削除されている場合があるため、失敗は重要ではない
            // not a big deal if this fails, since the post might have been deleted
            .catch(console.error)
        }
      }

      migrate() // 移行処理開始

      return () => {
        // クリーンアップ：処理のキャンセル
        cancelled = true
      }
    }
  }, [agent, currentAccount, setThreadMute])
}
