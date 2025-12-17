/**
 * 権限管理フック（Web版・スタブ実装）
 *
 * 【概要】
 * Web環境向けの権限フック。
 * ブラウザはネイティブアプリとは異なる権限モデルを持つため、
 * 特別な権限要求は不要。
 *
 * 【Webの権限モデル】
 * - 写真/動画: <input type="file">を使用、権限不要
 * - カメラ: WebRTC getUserMedia()を使用、ブラウザが自動でプロンプト表示
 * - 位置情報: Geolocation APIを使用、ブラウザが自動でプロンプト表示
 *
 * 【ネイティブ版との違い】
 * - ネイティブ: OSレベルの権限を明示的に要求
 * - Web: ブラウザが必要に応じて自動的にプロンプト表示
 *
 * 【Goユーザー向け補足】
 * - スタブ実装: 同じインターフェースで最小限の実装を提供
 *   Goのインターフェース充足のためのダミー実装に相当
 */

/**
 * フォトライブラリ権限フック（Web版）
 * Web版ではinput[type=file]を使用するため、権限は常に「許可」
 *
 * @returns requestPhotoAccessIfNeeded: 常にtrueを返す
 */
export function usePhotoLibraryPermission() {
  const requestPhotoAccessIfNeeded = async () => {
    // Webでは<input type="file">でファイル選択を行うため
    // 特別な権限要求は不要
    return true
  }
  return {requestPhotoAccessIfNeeded}
}

/**
 * カメラ権限フック（Web版）
 * Web版ではカメラ機能をサポートしていないため、常にfalseを返す
 *
 * @returns requestCameraAccessIfNeeded: 常にfalseを返す
 */
export function useCameraPermission() {
  const requestCameraAccessIfNeeded = async () => {
    // Webではカメラ撮影機能は未サポート
    return false
  }

  return {requestCameraAccessIfNeeded}
}

/**
 * 動画ライブラリ権限フック（Web版）
 * Web版ではinput[type=file]を使用するため、権限は常に「許可」
 *
 * @returns requestVideoAccessIfNeeded: 常にtrueを返す
 */
export function useVideoLibraryPermission() {
  const requestVideoAccessIfNeeded = async () => {
    // Webでは<input type="file">でファイル選択を行うため
    // 特別な権限要求は不要
    return true
  }

  return {requestVideoAccessIfNeeded}
}
