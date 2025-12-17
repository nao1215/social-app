/**
 * ブラウザ検出ユーティリティモジュール（ネイティブ版）
 *
 * 【概要】
 * ネイティブアプリではブラウザ検出は不要。
 * Web版との互換性のために固定値を提供。
 *
 * 【固定値の理由】
 * - isSafari/isFirefox: ネイティブはブラウザではないためfalse
 * - isTouchDevice: ネイティブアプリは基本的にタッチデバイス
 * - isAndroidWeb: ネイティブAppであってWebではない
 *
 * 【Goユーザー向け補足】
 * - .native.ts: ネイティブ環境専用ファイル
 *   Goのビルドタグ（// +build !js）に相当
 * - 条件コンパイル的な役割を果たす
 */

/** Safariブラウザかどうか（ネイティブは常にfalse） */
export const isSafari = false

/** Firefoxブラウザかどうか（ネイティブは常にfalse） */
export const isFirefox = false

/** タッチデバイスかどうか（ネイティブは常にtrue） */
export const isTouchDevice = true

/** AndroidデバイスでWebを閲覧しているか（ネイティブは常にfalse） */
export const isAndroidWeb = false
