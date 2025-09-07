// React Native の unstable_batchedUpdates を batchedUpdates として再エクスポート
// Re-export React Native's unstable_batchedUpdates as batchedUpdates
// 複数の状態更新を一度にバッチ処理するための最適化ユーティリティ
// Optimization utility for batching multiple state updates together
export {unstable_batchedUpdates as batchedUpdates} from 'react-native'
