/**
 * グローバルジェスチャーイベントプロバイダー（Web版）
 * Web環境では react-native-gesture-handler が利用できないため、
 * 意図的にエラーを発生させてネイティブ専用機能であることを明示
 */
export function GlobalGestureEventsProvider(_props: {
  children: React.ReactNode // 子コンポーネント（使用されない）
}) {
  throw new Error('GlobalGestureEventsProvider is not supported on web.')
}

/**
 * グローバルジェスチャーイベントフック（Web版）
 * Web環境では利用不可のため、エラーを発生させる
 */
export function useGlobalGestureEvents() {
  throw new Error('useGlobalGestureEvents is not supported on web.')
}
