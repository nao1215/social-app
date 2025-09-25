import {useEffect, useState} from 'react'
import {AppState} from 'react-native'

/**
 * アプリケーション状態監視フック
 *
 * 【主な機能】
 * - React Nativeのアプリ状態（active/background/inactive）を監視
 * - アプリの前景/背景切り替えをリアルタイムで検出
 * - 状態変化時の自動的な再レンダリングトリガー
 *
 * 【使用場面】
 * - バックグラウンド時のデータ更新停止
 * - フォアグラウンド復帰時のデータ再取得
 * - 画面録画検出やセキュリティ関連処理
 * - 省電力モード対応とパフォーマンス最適化
 *
 * 【技術的詳細】
 * - React NativeのAppState APIを使用
 * - useEffectによるイベントリスナーの自動管理
 * - コンポーネントアンマウント時のクリーンアップ処理
 *
 * @returns 'active' | 'background' | 'inactive' のアプリ状態文字列
 */
export function useAppState() {
  // 現在のアプリ状態を初期値として設定
  const [state, setState] = useState(AppState.currentState)

  // アプリ状態変更のイベントリスナーを設定
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextAppState => {
      setState(nextAppState)
    })
    // コンポーネントアンマウント時にリスナーをクリーンアップ
    return () => sub.remove()
  }, [])

  return state
}
