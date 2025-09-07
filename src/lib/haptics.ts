// React の基本フック類をインポート
// Import basic React hooks
import React from 'react'
// Expo のデバイス情報検出ライブラリをインポート
// Import Expo device information detection library
import * as Device from 'expo-device'
// Expo の触覚フィードバック（ハプティクス）機能をインポート
// Import Expo haptic feedback functionality
import {impactAsync, ImpactFeedbackStyle} from 'expo-haptics'

// プラットフォーム検出ユーティリティをインポート
// Import platform detection utilities
import {isIOS, isWeb} from '#/platform/detection'
// ハプティクス無効化設定の状態管理フックをインポート
// Import haptics disabled setting state management hook
import {useHapticsDisabled} from '#/state/preferences/disable-haptics'

/**
 * ハプティクス（触覚フィードバック）を制御するカスタムフック
 * Custom hook to control haptics (tactile feedback)
 * @returns ハプティクス実行関数 / Haptics execution function
 */
export function useHaptics() {
  // ハプティクスが無効化されているかを取得
  // Get whether haptics is disabled
  const isHapticsDisabled = useHapticsDisabled()

  return React.useCallback(
    /**
     * ハプティクス実行関数
     * Haptics execution function
     * @param strength ハプティクスの強度 / Haptic feedback strength
     */
    (strength: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
      // ハプティクスが無効またはWebブラウザの場合は何もしない
      // Do nothing if haptics is disabled or running in web browser
      if (isHapticsDisabled || isWeb) {
        return
      }

      // ユーザーからAndroidでのMedium強度が強すぎるとの報告があったため調整（APP-537s参照）
      // Users said the medium impact was too strong on Android; see APP-537s
      // iOSでは指定された強度、Androidでは常にLight強度を使用
      // Use specified strength on iOS, always Light strength on Android
      const style = isIOS
        ? ImpactFeedbackStyle[strength]
        : ImpactFeedbackStyle.Light
      // 実際にハプティクスを実行
      // Execute the haptic feedback
      impactAsync(style)

      // 開発時のみ - シミュレータでハプティクスが発火する予定の時にトーストを表示
      // DEV ONLY - show a toast when a haptic is meant to fire on simulator
      if (__DEV__ && !Device.isDevice) {
        // うるさいので無効化済み
        // disabled because it's annoying
        // Toast.show(`Buzzz!`)
      }
    },
    [isHapticsDisabled], // ハプティクス無効化状態が変更された時のみ再作成 / Recreate only when haptics disabled state changes
  )
}
