/**
 * バッチ更新ユーティリティモジュール（ネイティブ版）
 *
 * 【概要】
 * 複数の状態更新を1回のレンダリングサイクルにまとめて処理。
 * React Nativeのunstable_batchedUpdatesを再エクスポート。
 *
 * 【なぜバッチ処理が必要か】
 * - 複数のsetState()を連続で呼ぶと、各呼び出しごとに再レンダリングが発生
 * - batchedUpdates内で呼ぶと、全更新を1回の再レンダリングにまとめる
 * - パフォーマンス最適化に効果的
 *
 * 【使用例】
 * batchedUpdates(() => {
 *   setName('Alice')    // これだけで再レンダリングしない
 *   setAge(30)          // これだけで再レンダリングしない
 *   setEmail('...')     // ここでまとめて1回再レンダリング
 * })
 *
 * 【Goユーザー向け補足】
 * - unstable_: API名の接頭辞。将来変更される可能性を示す
 *   Goのinternal/パッケージに相当する概念
 * - バッチ処理: Goでは複数のgoroutineの結果をチャネルでまとめる
 *   ことに相当
 */
export {unstable_batchedUpdates as batchedUpdates} from 'react-native'
