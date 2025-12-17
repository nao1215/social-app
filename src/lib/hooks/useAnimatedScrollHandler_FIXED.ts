/**
 * アニメーションスクロールハンドラーフック（ネイティブ版）
 *
 * 【概要】
 * Reanimatedのスクロールハンドラーをそのままエクスポート。
 * Web版とは異なり、ネイティブ環境では追加のラップは不要。
 *
 * 【注意事項】
 * このフックは非常にバグが多く、制限された方法でのみ安全に使用可能：
 * - 戻り値をユーザー定義コンポーネントのpropsとして渡さない
 * - 戻り値を複数のコンポーネントに渡さない
 * - Reanimated Viewのリーフ（末端）でのみ使用
 *
 * 【関連バグレポート】
 * - https://github.com/software-mansion/react-native-reanimated/issues/5345
 * - https://github.com/software-mansion/react-native-reanimated/issues/5360
 * - https://github.com/software-mansion/react-native-reanimated/issues/5364
 *
 * 【Goユーザー向け補足】
 * - export {X} from 'Y': 再エクスポート（Goには直接対応なし）
 * - Reanimated: UIスレッドで動作するアニメーションライブラリ
 */
export {useAnimatedScrollHandler} from 'react-native-reanimated'
