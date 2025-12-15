/**
 * オンボーディング状態管理モジュール
 *
 * 【概要】
 * 新規ユーザーのオンボーディングフローにおける状態を管理します。
 * React の useReducer パターンを使用して、ステップ間の遷移と
 * 各ステップで収集したデータを一元管理します。
 *
 * 【Go言語との対応】
 * - interface/type: Goのstructに相当
 * - React.createContext: Goのcontext.Contextに似た仕組みで、コンポーネントツリー全体で状態を共有
 * - React.Dispatch: Goのチャネル送信のような役割で、アクションを送信して状態を更新
 *
 * 【主な機能】
 * - オンボーディングステップの進行管理
 * - プロフィール作成データの保持
 * - 興味・関心の選択データの保持
 * - A/Bテスト実験フラグの管理
 *
 * 【状態遷移フロー】
 * 1. profile: プロフィール画像の設定
 * 2. interests: 興味・関心の選択
 * 3. suggested-accounts: おすすめアカウントのフォロー（実験フラグで有効化）
 * 4. finished: オンボーディング完了
 */

import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {
  type AvatarColor,
  type Emoji,
} from '#/screens/Onboarding/StepProfile/types'

/**
 * オンボーディング状態の型定義
 *
 * 【Goとの対応】Goのstructに相当
 *
 * @property hasPrev - 前のステップに戻れるかどうか
 * @property totalSteps - オンボーディングの総ステップ数
 * @property activeStep - 現在アクティブなステップ
 * @property activeStepIndex - 現在のステップインデックス（1始まり）
 * @property interestsStepResults - 興味・関心選択ステップの結果
 * @property profileStepResults - プロフィール作成ステップの結果
 * @property experiments - A/Bテスト実験フラグ
 */
export type OnboardingState = {
  hasPrev: boolean
  totalSteps: number
  activeStep: 'profile' | 'interests' | 'suggested-accounts' | 'finished'
  activeStepIndex: number

  /** 興味・関心選択ステップの結果データ */
  interestsStepResults: {
    /** ユーザーが選択した興味タグのリスト */
    selectedInterests: string[]
    /** APIから取得したおすすめコンテンツのマッピング */
    apiResponse: ApiResponseMap
  }
  /** プロフィール作成ステップの結果データ */
  profileStepResults: {
    /** アバタークリエーターで作成したかどうか */
    isCreatedAvatar: boolean
    /** アップロードされた画像の情報 */
    image?: {
      path: string
      mime: string
      size: number
      width: number
      height: number
    }
    /** 画像のData URI */
    imageUri?: string
    /** 画像のMIMEタイプ */
    imageMime?: string
    /** アバタークリエーターの状態（絵文字と背景色） */
    creatorState?: {
      emoji: Emoji
      backgroundColor: AvatarColor
    }
  }

  /** A/Bテスト実験フラグ */
  experiments?: {
    /** おすすめアカウント表示の有効化フラグ */
    onboarding_suggested_accounts?: boolean
    /** バリュープロポジション表示の有効化フラグ */
    onboarding_value_prop?: boolean
  }
}

/**
 * オンボーディングアクションの型定義
 *
 * 【Goとの対応】判別可能なユニオン型で、Goのinterface{}+型アサーションに似た仕組み
 *
 * Redux風のアクションパターンで、typeフィールドでアクションを識別します。
 */
export type OnboardingAction =
  | {
      /** 次のステップへ進む */
      type: 'next'
    }
  | {
      /** 前のステップに戻る */
      type: 'prev'
    }
  | {
      /** オンボーディングを完了する */
      type: 'finish'
    }
  | {
      /** 興味・関心選択ステップの結果を保存 */
      type: 'setInterestsStepResults'
      selectedInterests: string[]
      apiResponse: ApiResponseMap
    }
  | {
      /** プロフィール作成ステップの結果を保存 */
      type: 'setProfileStepResults'
      isCreatedAvatar: boolean
      image: OnboardingState['profileStepResults']['image'] | undefined
      imageUri: string | undefined
      imageMime: string
      creatorState:
        | {
            emoji: Emoji
            backgroundColor: AvatarColor
          }
        | undefined
    }

/**
 * API レスポンスマッピングの型定義
 *
 * 【Goとの対応】Goのmap[string][]stringに相当
 *
 * @property interests - 利用可能な興味タグのリスト
 * @property suggestedAccountDids - 興味タグごとのおすすめアカウントDIDマップ
 * @property suggestedFeedUris - 興味タグごとのおすすめフィードURIマップ
 */
export type ApiResponseMap = {
  interests: string[]
  suggestedAccountDids: {
    [key: string]: string[]
  }
  suggestedFeedUris: {
    [key: string]: string[]
  }
}

/**
 * 人気の興味タグリスト
 *
 * よく選択される興味タグを定義しています。
 * 優先表示やデフォルト値として使用されます。
 */
export const popularInterests = [
  'art',
  'gaming',
  'sports',
  'comics',
  'music',
  'politics',
  'photography',
  'science',
  'news',
]

/**
 * 興味タグの多言語表示名を取得するカスタムフック
 *
 * 【Go言語との対応】
 * - React.useMemo: 計算結果をキャッシュして再計算を防ぐ（Goにはない概念）
 * - useLingui: 国際化ライブラリで、翻訳テキストを取得
 *
 * @returns 興味タグ名から表示名へのマッピング
 */
export function useInterestsDisplayNames() {
  const {_} = useLingui() // 翻訳関数を取得

  // 言語が変わった時のみ再計算（パフォーマンス最適化）
  return React.useMemo<Record<string, string>>(() => {
    return {
      // アルファベット順に保持
      animals: _(msg`Animals`),
      art: _(msg`Art`),
      books: _(msg`Books`),
      comedy: _(msg`Comedy`),
      comics: _(msg`Comics`),
      culture: _(msg`Culture`),
      dev: _(msg`Software Dev`),
      education: _(msg`Education`),
      food: _(msg`Food`),
      gaming: _(msg`Video Games`),
      journalism: _(msg`Journalism`),
      movies: _(msg`Movies`),
      music: _(msg`Music`),
      nature: _(msg`Nature`),
      news: _(msg`News`),
      pets: _(msg`Pets`),
      photography: _(msg`Photography`),
      politics: _(msg`Politics`),
      science: _(msg`Science`),
      sports: _(msg`Sports`),
      tech: _(msg`Tech`),
      tv: _(msg`TV`),
      writers: _(msg`Writers`),
    }
  }, [_]) // 依存配列：_（翻訳関数）が変わった時のみ再計算
}

/**
 * オンボーディング状態の初期値
 *
 * アプリ起動時やリセット時に使用される初期状態を定義します。
 */
export const initialState: OnboardingState = {
  hasPrev: false,
  totalSteps: 3,
  activeStep: 'profile',
  activeStepIndex: 1,

  interestsStepResults: {
    selectedInterests: [],
    apiResponse: {
      interests: [],
      suggestedAccountDids: {},
      suggestedFeedUris: {},
    },
  },
  profileStepResults: {
    isCreatedAvatar: false,
    image: undefined,
    imageUri: '',
    imageMime: '',
  },
}

/**
 * オンボーディング用Reactコンテキスト
 *
 * 【Go言語との対応】
 * - React.createContext: Goのcontext.Contextに似た仕組みで、
 *   コンポーネントツリー全体で状態を共有できます
 * - React.Dispatch: アクションを送信する関数（Goのチャネル送信に似ています）
 *
 * このコンテキストを使用することで、親から子への深いprops渡しを回避できます。
 */
export const Context = React.createContext<{
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
}>({
  state: {...initialState},
  dispatch: () => {}, // デフォルトは何もしない
})
Context.displayName = 'OnboardingContext' // デバッグ用の表示名

/**
 * オンボーディング状態のリデューサー関数
 *
 * 【Go言語との対応】
 * - useReducer: Goのswitch文による状態遷移に似ていますが、
 *   不変性（immutability）を保つため常に新しいオブジェクトを返します
 *
 * @param s - 現在の状態
 * @param a - 実行するアクション
 * @returns 新しい状態（元の状態は変更しない）
 */
export function reducer(
  s: OnboardingState,
  a: OnboardingAction,
): OnboardingState {
  let next = {...s} // 現在の状態をシャローコピー（不変性を保つため）

  // アクションタイプに応じて状態を更新
  switch (a.type) {
    case 'next': {
      // 次のステップへ進む処理
      // 実験フラグに応じて異なるフローを実行
      if (s.experiments?.onboarding_suggested_accounts) {
        // おすすめアカウント機能が有効な場合の4ステップフロー
        if (s.activeStep === 'profile') {
          next.activeStep = 'interests'
          next.activeStepIndex = 2
        } else if (s.activeStep === 'interests') {
          next.activeStep = 'suggested-accounts'
          next.activeStepIndex = 3
        }
        if (s.activeStep === 'suggested-accounts') {
          next.activeStep = 'finished'
          next.activeStepIndex = 4
        }
      } else {
        // おすすめアカウント機能が無効な場合の3ステップフロー
        if (s.activeStep === 'profile') {
          next.activeStep = 'interests'
          next.activeStepIndex = 2
        } else if (s.activeStep === 'interests') {
          next.activeStep = 'finished'
          next.activeStepIndex = 3
        }
      }
      break
    }
    case 'prev': {
      // 前のステップに戻る処理
      if (s.experiments?.onboarding_suggested_accounts) {
        if (s.activeStep === 'interests') {
          next.activeStep = 'profile'
          next.activeStepIndex = 1
        } else if (s.activeStep === 'suggested-accounts') {
          next.activeStep = 'interests'
          next.activeStepIndex = 2
        } else if (s.activeStep === 'finished') {
          next.activeStep = 'suggested-accounts'
          next.activeStepIndex = 3
        }
      } else {
        if (s.activeStep === 'interests') {
          next.activeStep = 'profile'
          next.activeStepIndex = 1
        } else if (s.activeStep === 'finished') {
          next.activeStep = 'interests'
          next.activeStepIndex = 2
        }
      }
      break
    }
    case 'finish': {
      // オンボーディングを完了して初期状態にリセット
      next = initialState
      break
    }
    case 'setInterestsStepResults': {
      // 興味・関心選択の結果を保存
      next.interestsStepResults = {
        selectedInterests: a.selectedInterests,
        apiResponse: a.apiResponse,
      }
      break
    }
    case 'setProfileStepResults': {
      // プロフィール作成の結果を保存
      next.profileStepResults = {
        isCreatedAvatar: a.isCreatedAvatar,
        image: a.image,
        imageUri: a.imageUri,
        imageMime: a.imageMime,
        creatorState: a.creatorState,
      }
      break
    }
  }

  // 最終的な状態を計算（hasPrevフラグを更新）
  const state = {
    ...next,
    hasPrev: next.activeStep !== 'profile', // プロフィール以外は戻るボタンを表示
  }

  // デバッグ用ログ出力
  logger.debug(`onboarding`, {
    hasPrev: state.hasPrev,
    activeStep: state.activeStep,
    activeStepIndex: state.activeStepIndex,
    interestsStepResults: {
      selectedInterests: state.interestsStepResults.selectedInterests,
    },
    profileStepResults: state.profileStepResults,
  })

  // ステップが変更された場合は追加ログを出力
  if (s.activeStep !== state.activeStep) {
    logger.debug(`onboarding: step changed`, {activeStep: state.activeStep})
  }

  // 新しい状態を返す（元の状態は変更されない）
  return state
}
