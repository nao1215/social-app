/**
 * ハンドル処理モジュール
 *
 * 【概要】
 * AT Protocolのハンドル（ユーザー名）に関するユーティリティ関数群。
 * ハンドルの検証、サニタイズ、表示用変換などを行う。
 *
 * 【ハンドルの形式】
 * - user.bsky.social（Blueskyデフォルト）
 * - user.example.com（カスタムドメイン）
 * - DNS形式で、各ラベルは63文字以下
 *
 * 【参照】
 * Go実装: https://github.com/bluesky-social/indigo/blob/main/atproto/syntax/handle.go
 *
 * 【Goユーザー向け補足】
 * - 正規表現はGoのregexpパッケージと同様
 * - Goの同等実装がindigo/atproto/syntaxにある
 */

import {forceLTR} from '#/lib/strings/bidi'

/**
 * ハンドル検証用の正規表現
 *
 * 【パターン説明】
 * - 各ラベル: 英数字で開始・終了、途中にハイフン可、最大63文字
 * - 全体: ドットで区切られた複数のラベル
 * - TLD: 英字で開始、英数字・ハイフン可
 *
 * 【Go実装との対応】
 * indigo/atproto/syntax/handle.go#L10 の正規表現と同一
 */
const VALIDATE_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

/**
 * サービスハンドルの最大長
 * xxx.bsky.social の xxx 部分の最大文字数
 */
export const MAX_SERVICE_HANDLE_LENGTH = 18

/**
 * 入力文字列を有効なハンドル形式に変換
 *
 * 【変換処理】
 * 1. 20文字に切り詰め
 * 2. 小文字に変換
 * 3. 先頭の非英数字を除去
 * 4. 英数字とハイフン以外を除去
 *
 * 【使用場面】
 * ユーザー入力のリアルタイムバリデーション時に使用。
 *
 * @param str 変換する文字列
 * @returns 有効なハンドル形式の文字列
 */
export function makeValidHandle(str: string): string {
  if (str.length > 20) {
    str = str.slice(0, 20)
  }
  str = str.toLowerCase()
  // 先頭の無効な文字を除去し、許可された文字のみ残す
  return str.replace(/^[^a-z0-9]+/g, '').replace(/[^a-z0-9-]/g, '')
}

/**
 * ユーザー名とドメインからフルハンドルを生成
 *
 * 【生成例】
 * createFullHandle('user', 'bsky.social') → 'user.bsky.social'
 *
 * @param name ユーザー名（末尾のドットは除去される）
 * @param domain ドメイン（先頭のドットは除去される）
 * @returns フルハンドル（name.domain形式）
 */
export function createFullHandle(name: string, domain: string): string {
  name = (name || '').replace(/[.]+$/, '')  // 末尾のドット除去
  domain = (domain || '').replace(/^[.]+/, '') // 先頭のドット除去
  return `${name}.${domain}`
}

/**
 * 無効なハンドルか判定
 *
 * 【無効ハンドルとは】
 * 'handle.invalid' は特別な値で、ユーザーのハンドルが
 * 無効（例: DNS検証失敗、ドメイン失効）の場合に設定される。
 *
 * @param handle 判定するハンドル
 * @returns 無効ハンドルの場合true
 */
export function isInvalidHandle(handle: string): boolean {
  return handle === 'handle.invalid'
}

/**
 * ハンドルをサニタイズして表示用に変換
 *
 * 【処理内容】
 * - 無効なハンドル → '⚠Invalid Handle' を返す
 * - 通常のハンドル → 小文字化 + プレフィックス追加 + LTR強制
 *
 * 【LTR強制について】
 * RTL言語（アラビア語、ヘブライ語）でハンドルが逆順表示される
 * 問題を防ぐため、LTR（左から右）を強制する。
 *
 * @param handle サニタイズするハンドル
 * @param prefix プレフィックス（通常は '@'）
 * @param forceLeftToRight LTR強制するかどうか（デフォルト: true）
 * @returns サニタイズされたハンドル
 */
export function sanitizeHandle(
  handle: string,
  prefix = '',
  forceLeftToRight = true,
): string {
  const lowercasedWithPrefix = `${prefix}${handle.toLocaleLowerCase()}`
  return isInvalidHandle(handle)
    ? '⚠Invalid Handle'
    : forceLeftToRight
      ? forceLTR(lowercasedWithPrefix)
      : lowercasedWithPrefix
}

/**
 * ハンドル検証結果の型
 *
 * 【検証項目】
 * - handleChars: 許可された文字のみ使用しているか
 * - hyphenStartOrEnd: ハイフンで開始/終了していないか
 * - frontLengthNotTooShort: ユーザー名部分が3文字以上か
 * - frontLengthNotTooLong: ユーザー名部分が18文字以下か
 * - totalLength: 全体が253文字以下か
 * - overall: 全ての検証がパスしたか
 */
export interface IsValidHandle {
  handleChars: boolean
  hyphenStartOrEnd: boolean
  frontLengthNotTooShort: boolean
  frontLengthNotTooLong: boolean
  totalLength: boolean
  overall: boolean
}

/**
 * サービスハンドルを検証
 *
 * 【概要】
 * Blueskyサービス用ハンドル（xxx.bsky.social）の
 * 詳細なバリデーションを実行。
 *
 * 【検証内容】
 * - 許可された文字のみ（英数字、ハイフン）
 * - ハイフンで開始/終了していない
 * - ユーザー名部分が3〜18文字
 * - 全体が253文字以下
 *
 * 【参照】
 * https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/index.ts#L72
 *
 * @param str ユーザー名部分（ドメインなし）
 * @param userDomain ドメイン部分（例: 'bsky.social'）
 * @returns 検証結果オブジェクト
 */
export function validateServiceHandle(
  str: string,
  userDomain: string,
): IsValidHandle {
  const fullHandle = createFullHandle(str, userDomain)

  const results = {
    handleChars:
      !str || (VALIDATE_REGEX.test(fullHandle) && !str.includes('.')),
    hyphenStartOrEnd: !str.startsWith('-') && !str.endsWith('-'),
    frontLengthNotTooShort: str.length >= 3,
    frontLengthNotTooLong: str.length <= MAX_SERVICE_HANDLE_LENGTH,
    totalLength: fullHandle.length <= 253,
  }

  return {
    ...results,
    overall: !Object.values(results).includes(false),
  }
}
