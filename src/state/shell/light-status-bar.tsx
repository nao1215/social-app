// Reactのエフェクトフックをインポート / Import React effect hook
import {useEffect} from 'react'
// React Native Edge-to-EdgeのシステムバーAPI機能をインポート / Import system bar API functionality from React Native Edge-to-Edge
import {SystemBars} from 'react-native-edge-to-edge'

/**
 * ステータスバーをライト（明るい背景に暗いテキスト）スタイルに設定するカスタムフック
 * スタック管理により、複数のコンポーネントで使用しても適切にスタイルが管理される
 * 
 * Custom hook to set status bar to light style (dark text on bright background)
 * Stack management ensures proper style management even when used by multiple components
 * 
 * @param enabled - ライトステータスバーを有効にするかどうか / Whether to enable light status bar
 */
export function useSetLightStatusBar(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      // システムバースタックにライトスタイルのエントリを追加 / Add light style entry to system bar stack
      const entry = SystemBars.pushStackEntry({
        style: {
          statusBar: 'light', // ステータスバーをライトスタイル（暗いテキスト）に設定 / Set status bar to light style (dark text)
        },
      })
      // クリーンアップ関数でスタックからエントリを削除 / Remove entry from stack in cleanup function
      return () => {
        SystemBars.popStackEntry(entry)
      }
    }
  }, [enabled]) // enabled値が変更されたときにエフェクトを再実行 / Re-run effect when enabled value changes
}
