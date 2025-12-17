/**
 * ブラウザ検出ユーティリティモジュール（Web版）
 *
 * 【概要】
 * User-Agentやメディアクエリを使用してブラウザ種別を判定。
 * ブラウザ固有の動作やスタイルの適用に使用。
 *
 * 【検出対象】
 * - Safari: WebKit系（Chrome/Android除外）
 * - Firefox: Mozilla/Gecko系
 * - タッチデバイス: スマホ/タブレット
 * - Android Web: AndroidブラウザでWebを閲覧
 *
 * 【なぜブラウザ検出が必要か】
 * - CSS/動作がブラウザごとに微妙に異なる
 * - Safari固有のバグ回避
 * - タッチ操作とマウス操作の切り替え
 *
 * 【Goユーザー向け補足】
 * - navigator.userAgent: HTTPリクエストのUser-Agentヘッダーに相当
 * - 正規表現: Goのregexpパッケージと同様の機能
 * - matchMedia: CSSメディアクエリをJSから評価
 *
 * @see https://stackoverflow.com/questions/7944460/detect-safari-browser
 */

/** Safariブラウザかどうか（Chrome/Androidを除外） */
export const isSafari = /^((?!chrome|android).)*safari/i.test(
  navigator.userAgent,
)

/** Firefoxブラウザかどうか（iOS版Firefox含む） */
export const isFirefox = /firefox|fxios/i.test(navigator.userAgent)

/** タッチデバイスかどうか（粗いポインター = タッチスクリーン） */
export const isTouchDevice = window.matchMedia('(pointer: coarse)').matches

/** AndroidデバイスでWebを閲覧しているかどうか */
export const isAndroidWeb =
  /android/i.test(navigator.userAgent) && isTouchDevice
