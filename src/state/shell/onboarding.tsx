/**
 * オンボーディング（初回利用者向けガイド）状態管理モジュール
 * 新規ユーザーが初めてアプリを使用する際のガイド画面の進行状態を管理する
 * 永続化ストレージを使用してオンボーディングの進行状況を保存し、
 * アプリ再起動後も状態を復元できるようにする
 *
 * Onboarding (first-time user guide) state management module
 * Manages progress state of guide screens when new users first use the app
 * Uses persistent storage to save onboarding progress and restore state
 * after app restart
 *
 * Goユーザー向け補足 / Note for Go developers:
 * - useReducer: Goのreducer関数パターンに似ており、(state, action) => newStateの形式です
 * - React.createContext: Goのcontext.Contextに相当し、コンポーネントツリー全体で値を共有します
 * - React.useEffect: コンポーネントのライフサイクル（マウント/アンマウント）時に実行される副作用関数です
 * - 永続化はAsyncStorage（localStorage相当）を使用しています
 */

// Reactライブラリをインポート / Import React library
import React from 'react'

// 永続化ストレージ機能をインポート / Import persistent storage functionality
import * as persisted from '#/state/persisted'

/**
 * オンボーディング画面のステップ定数
 * Onboarding screen step constants
 */
export const OnboardingScreenSteps = {
  Welcome: 'Welcome', // 歓迎画面 / Welcome screen
  RecommendedFeeds: 'RecommendedFeeds', // おすすめフィード画面 / Recommended feeds screen
  RecommendedFollows: 'RecommendedFollows', // おすすめフォロー画面 / Recommended follows screen
  Home: 'Home', // ホーム画面 / Home screen
} as const

// オンボーディングステップの型定義 / Type definition for onboarding steps
type OnboardingStep =
  (typeof OnboardingScreenSteps)[keyof typeof OnboardingScreenSteps]
// オンボーディングステップの配列 / Array of onboarding steps
const OnboardingStepsArray = Object.values(OnboardingScreenSteps)

/**
 * オンボーディング状態変更のアクション型
 * Action type for onboarding state changes
 */
type Action =
  | {type: 'set'; step: OnboardingStep} // 特定ステップに設定 / Set to specific step
  | {type: 'next'; currentStep?: OnboardingStep} // 次のステップに進む / Move to next step
  | {type: 'start'} // オンボーディング開始 / Start onboarding
  | {type: 'finish'} // オンボーディング完了 / Finish onboarding
  | {type: 'skip'} // オンボーディングスキップ / Skip onboarding

/**
 * オンボーディング状態のコンテキスト型
 * Context type for onboarding state
 */
export type StateContext = persisted.Schema['onboarding'] & {
  isComplete: boolean // 完了フラグ / Completion flag
  isActive: boolean // アクティブフラグ / Active flag
}

/**
 * オンボーディングアクション実行のコンテキスト型
 * Context type for onboarding action dispatch
 */
export type DispatchContext = (action: Action) => void

// オンボーディング状態管理のReactコンテキスト / React context for onboarding state management
const stateContext = React.createContext<StateContext>(
  compute(persisted.defaults.onboarding),
)
stateContext.displayName = 'OnboardingStateContext'
// オンボーディングアクション実行のReactコンテキスト / React context for onboarding action dispatch
const dispatchContext = React.createContext<DispatchContext>((_: Action) => {})
dispatchContext.displayName = 'OnboardingDispatchContext'

/**
 * オンボーディング状態のリデューサー関数
 * アクション（set/next/start/finish/skip）に応じて状態を更新し、永続化する
 *
 * Onboarding state reducer function
 * Updates and persists state based on actions (set/next/start/finish/skip)
 *
 * Goユーザー向け補足 / Note for Go developers:
 * - switch文はGoと同じ構文ですが、fallthrough はありません
 * - この関数はGoのreducer パターンに相当し、純粋関数（副作用なし）であるべきですが
 *   実際にはpersisted.writeで副作用があります（React標準パターンからの逸脱）
 *
 * @param state - 現在の状態 / Current state
 * @param action - 実行するアクション / Action to execute
 * @returns 新しい状態 / New state
 */
function reducer(state: StateContext, action: Action): StateContext {
  switch (action.type) {
    case 'set': {
      // 指定されたステップに設定（バリデーション付き） / Set to specified step (with validation)
      if (OnboardingStepsArray.includes(action.step)) {
        persisted.write('onboarding', {step: action.step}) // 永続化 / Persist
        return compute({...state, step: action.step}) // 新しい状態を計算 / Compute new state
      }
      return state // 無効なステップの場合は現在の状態を返す / Return current state if invalid step
    }
    case 'next': {
      // 次のステップに進む（ステップの順序: Welcome → RecommendedFeeds → RecommendedFollows → Home）
      // Move to next step (step order: Welcome → RecommendedFeeds → RecommendedFollows → Home)
      const currentStep = action.currentStep || state.step
      let nextStep = 'Home'
      if (currentStep === 'Welcome') {
        nextStep = 'RecommendedFeeds' // おすすめフィード画面へ / To recommended feeds screen
      } else if (currentStep === 'RecommendedFeeds') {
        nextStep = 'RecommendedFollows' // おすすめフォロー画面へ / To recommended follows screen
      } else if (currentStep === 'RecommendedFollows') {
        nextStep = 'Home' // ホーム画面へ（完了） / To home screen (completed)
      }
      persisted.write('onboarding', {step: nextStep}) // 永続化 / Persist
      return compute({...state, step: nextStep}) // 新しい状態を計算 / Compute new state
    }
    case 'start': {
      // オンボーディングを最初から開始 / Start onboarding from the beginning
      persisted.write('onboarding', {step: 'Welcome'}) // 永続化 / Persist
      return compute({...state, step: 'Welcome'}) // 歓迎画面から開始 / Start from welcome screen
    }
    case 'finish': {
      // オンボーディングを完了（ホーム画面へ） / Finish onboarding (to home screen)
      persisted.write('onboarding', {step: 'Home'}) // 永続化 / Persist
      return compute({...state, step: 'Home'}) // ホーム画面に設定 / Set to home screen
    }
    case 'skip': {
      // オンボーディングをスキップ（即座にホーム画面へ） / Skip onboarding (immediately to home screen)
      persisted.write('onboarding', {step: 'Home'}) // 永続化 / Persist
      return compute({...state, step: 'Home'}) // ホーム画面に設定 / Set to home screen
    }
    default: {
      // 無効なアクション型の場合はエラー / Error if invalid action type
      throw new Error('Invalid action')
    }
  }
}

/**
 * オンボーディング状態管理プロバイダーコンポーネント
 * アプリ全体でオンボーディング状態とアクション実行機能を提供する
 *
 * Onboarding state management provider component
 * Provides onboarding state and action dispatch functionality across the app
 *
 * Goユーザー向け補足 / Note for Go developers:
 * - useReducer: 状態管理フック。(state, action) => newStateの関数と初期値を受け取ります
 * - useEffect: コンポーネントのマウント/アンマウント時に実行される副作用関数です
 *   戻り値としてクリーンアップ関数を返すと、アンマウント時に実行されます
 *
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  // オンボーディング状態とディスパッチ関数を管理 / Manage onboarding state and dispatch function
  const [state, dispatch] = React.useReducer(
    reducer, // リデューサー関数 / Reducer function
    compute(persisted.get('onboarding')), // 永続化された状態から初期値を計算 / Compute initial value from persisted state
  )

  // 永続化ストレージの変更を監視して状態を同期 / Monitor persistent storage changes and synchronize state
  React.useEffect(() => {
    return persisted.onUpdate('onboarding', nextOnboarding => {
      const next = nextOnboarding.step
      // TODO: 潜在的な問題が発生しやすい実装（フットガン）
      // TODO: we've introduced a footgun
      if (state.step !== next) {
        // 他のタブやウィンドウからの変更を反映 / Reflect changes from other tabs/windows
        dispatch({
          type: 'set',
          step: nextOnboarding.step as OnboardingStep,
        })
      }
    })
  }, [state, dispatch])

  return (
    <stateContext.Provider value={state}>
      <dispatchContext.Provider value={dispatch}>
        {children}
      </dispatchContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * オンボーディング状態を取得するカスタムフック
 * Custom hook to get onboarding state
 *
 * @returns オンボーディング状態（step, isActive, isComplete） / Onboarding state (step, isActive, isComplete)
 */
export function useOnboardingState() {
  return React.useContext(stateContext)
}

/**
 * オンボーディングアクション実行機能を取得するカスタムフック
 * Custom hook to get onboarding action dispatch functionality
 *
 * @returns アクション実行関数 / Action dispatch function
 */
export function useOnboardingDispatch() {
  return React.useContext(dispatchContext)
}

/**
 * オンボーディングがアクティブかどうかを判定する関数
 * ホーム画面以外のステップにいる場合はアクティブとみなす
 *
 * Function to determine if onboarding is active
 * Considered active if on any step other than Home screen
 *
 * @returns オンボーディングがアクティブな場合はtrue / Returns true if onboarding is active
 */
export function isOnboardingActive() {
  return compute(persisted.get('onboarding')).isActive
}

/**
 * オンボーディング状態から派生状態を計算する関数
 * isActiveとisCompleteフラグを追加する
 *
 * Function to compute derived state from onboarding state
 * Adds isActive and isComplete flags
 *
 * @param state - 永続化されたオンボーディング状態 / Persisted onboarding state
 * @returns 派生状態を含む完全な状態コンテキスト / Full state context including derived state
 */
function compute(state: persisted.Schema['onboarding']): StateContext {
  return {
    ...state,
    isActive: state.step !== 'Home', // ホーム以外ならアクティブ / Active if not Home
    isComplete: state.step === 'Home', // ホームなら完了 / Complete if Home
  }
}
