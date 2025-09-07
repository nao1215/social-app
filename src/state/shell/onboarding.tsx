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

function reducer(state: StateContext, action: Action): StateContext {
  switch (action.type) {
    case 'set': {
      if (OnboardingStepsArray.includes(action.step)) {
        persisted.write('onboarding', {step: action.step})
        return compute({...state, step: action.step})
      }
      return state
    }
    case 'next': {
      const currentStep = action.currentStep || state.step
      let nextStep = 'Home'
      if (currentStep === 'Welcome') {
        nextStep = 'RecommendedFeeds'
      } else if (currentStep === 'RecommendedFeeds') {
        nextStep = 'RecommendedFollows'
      } else if (currentStep === 'RecommendedFollows') {
        nextStep = 'Home'
      }
      persisted.write('onboarding', {step: nextStep})
      return compute({...state, step: nextStep})
    }
    case 'start': {
      persisted.write('onboarding', {step: 'Welcome'})
      return compute({...state, step: 'Welcome'})
    }
    case 'finish': {
      persisted.write('onboarding', {step: 'Home'})
      return compute({...state, step: 'Home'})
    }
    case 'skip': {
      persisted.write('onboarding', {step: 'Home'})
      return compute({...state, step: 'Home'})
    }
    default: {
      throw new Error('Invalid action')
    }
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, dispatch] = React.useReducer(
    reducer,
    compute(persisted.get('onboarding')),
  )

  React.useEffect(() => {
    return persisted.onUpdate('onboarding', nextOnboarding => {
      const next = nextOnboarding.step
      // TODO we've introduced a footgun
      if (state.step !== next) {
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

export function useOnboardingState() {
  return React.useContext(stateContext)
}

export function useOnboardingDispatch() {
  return React.useContext(dispatchContext)
}

export function isOnboardingActive() {
  return compute(persisted.get('onboarding')).isActive
}

function compute(state: persisted.Schema['onboarding']): StateContext {
  return {
    ...state,
    isActive: state.step !== 'Home',
    isComplete: state.step === 'Home',
  }
}
