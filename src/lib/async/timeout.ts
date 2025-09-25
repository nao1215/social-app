/**
 * 非同期タイムアウトユーティリティ
 *
 * 【主な機能】
 * - 指定したミリ秒後に解決されるPromiseを生成
 * - async/await構文での待機処理を簡潔に記述
 * - デバッグ時の意図的な遅延処理
 *
 * 【使用場面】
 * - API呼び出し間の適切な間隔制御
 * - UI アニメーション完了待ち
 * - デバッグ・テスト時の意図的な遅延
 * - レート制限回避のための待機処理
 *
 * 【技術的詳細】
 * - setTimeout をPromise化した軽量実装
 * - メモリリークのない安全な非同期処理
 *
 * @param ms 待機時間（ミリ秒）
 * @returns 指定時間後に解決されるPromise
 */
export function timeout(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
