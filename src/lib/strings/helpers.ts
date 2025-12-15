/**
 * 文字列ヘルパーモジュール
 *
 * 【概要】
 * 文字列処理に関する汎用ユーティリティ関数群。
 * 文字数制限、グラフェーム（書記素）処理、ハッシュ生成などを提供。
 *
 * 【グラフェームとは】
 * ユーザーが「1文字」と認識する最小単位。
 * 例: 👨‍👩‍👧‍👦（家族絵文字）は見た目は1文字だが、複数のUnicodeコードポイントで構成。
 * 文字数制限では、この視覚的な1文字を正しくカウントする必要がある。
 *
 * 【Goユーザー向け補足】
 * - Graphemerライブラリ: Goのunicode/normパッケージの拡張版に相当
 * - useMemo/useCallback: 計算結果のキャッシュ（Goには直接対応する概念なし）
 */

// Reactのフック類をインポート
// Import React hooks
import {useCallback, useMemo} from 'react'

/**
 * Graphemer: グラフェーム（書記素）を正しく分割・カウントするライブラリ
 * Unicode UAX#29準拠で、絵文字や結合文字を正しく処理
 */
import Graphemer from 'graphemer'

/**
 * 文字列の長さを強制的に制限するユーティリティ関数
 * Utility function to enforce string length limits
 * @param str 処理する文字列 / String to process
 * @param len 最大長さ / Maximum length
 * @param ellipsis 省略記号を追加するか / Whether to add ellipsis
 * @param mode 省略モード / Ellipsis mode
 * @returns 制限された文字列 / Length-limited string
 */
export function enforceLen(
  str: string,
  len: number,
  ellipsis = false,
  mode: 'end' | 'middle' = 'end',
): string {
  // null/undefinedの場合は空文字列として処理
  // Handle null/undefined as empty string
  str = str || ''
  // 指定された長さを超えている場合の処理
  // Handle cases where string exceeds specified length
  if (str.length > len) {
    if (ellipsis) {
      if (mode === 'end') {
        // 末尾に省略記号を追加
        // Add ellipsis at the end
        return str.slice(0, len) + '…'
      } else if (mode === 'middle') {
        // 中央に省略記号を追加（前半と後半を表示）
        // Add ellipsis in the middle (show beginning and end)
        const half = Math.floor(len / 2)
        return str.slice(0, half) + '…' + str.slice(-half)
      } else {
        // フォールバック：単純に切り捨て
        // fallback: simply truncate
        return str.slice(0, len)
      }
    } else {
      // 省略記号なしで切り捨て
      // Truncate without ellipsis
      return str.slice(0, len)
    }
  }
  // 長さ制限内の場合はそのまま返す
  // Return as-is if within length limit
  return str
}

/**
 * グラフェーム数制限を強制するReactフック
 *
 * 【用途】
 * テキスト入力で、グラフェーム単位での文字数制限を適用。
 * 投稿本文やプロフィールなど、文字数制限のある入力で使用。
 *
 * 【なぜグラフェーム単位か】
 * 絵文字や結合文字を「見た目の1文字」として正しくカウントするため。
 * str.lengthだと絵文字が2〜7文字分としてカウントされてしまう。
 *
 * @returns グラフェーム数制限を適用する関数
 */
export function useEnforceMaxGraphemeCount() {
  // Graphemerインスタンスはコンポーネント間で再利用（メモ化）
  const splitter = useMemo(() => new Graphemer(), [])

  return useCallback(
    (text: string, maxCount: number) => {
      // グラフェーム数が制限を超えている場合、切り詰め
      if (splitter.countGraphemes(text) > maxCount) {
        return splitter.splitGraphemes(text).slice(0, maxCount).join('')
      } else {
        return text
      }
    },
    [splitter],
  )
}

/**
 * グラフェーム数の超過を警告するReactフック
 *
 * 【用途】
 * 文字数制限に近づいた/超過した際にUIで警告を表示するために使用。
 * 例: 残り文字数のカウンター表示、超過時の赤色表示など。
 *
 * @param text チェック対象のテキスト
 * @param maxCount 最大グラフェーム数
 * @returns 制限を超過している場合true
 */
export function useWarnMaxGraphemeCount({
  text,
  maxCount,
}: {
  text: string
  maxCount: number
}) {
  const splitter = useMemo(() => new Graphemer(), [])

  return useMemo(() => {
    return splitter.countGraphemes(text) > maxCount
  }, [splitter, maxCount, text])
}

/**
 * 文字列をハッシュコードに変換
 *
 * 【アルゴリズム】
 * cyrb53ハッシュ関数（高速で衝突が少ない）
 * @see https://stackoverflow.com/a/52171480
 *
 * 【用途】
 * - キャッシュキーの生成
 * - 一意性判定（暗号目的ではない）
 * - 色の決定（ユーザーごとに異なるアバター色など）
 *
 * 【Goユーザー向け補足】
 * - Math.imul: 32ビット整数乗算（オーバーフローを適切に処理）
 * - >>>: 符号なし右シフト（Goの >> と異なる）
 *
 * @param str ハッシュ化する文字列
 * @param seed シード値（同じ文字列でも異なるハッシュを生成可能）
 * @returns ハッシュコード（数値）
 */
export function toHashCode(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/**
 * 文字列内の改行数をカウント
 *
 * 【用途】
 * - 投稿のプレビュー表示で行数制限
 * - テキストエリアの高さ自動調整
 *
 * @param str カウント対象の文字列
 * @returns 改行文字（\n）の数
 */
export function countLines(str: string | undefined): number {
  if (!str) return 0
  return str.match(/\n/g)?.length ?? 0
}

/**
 * 検索クエリに`from:me`などの追加構文で拡張する関数
 * Function to augment search query with additional syntax like `from:me`
 * @param query 検索クエリ / Search query
 * @param options オプション / Options
 * @returns 拡張された検索クエリ / Augmented search query
 */
export function augmentSearchQuery(query: string, {did}: {did?: string}) {
  // DIDがない場合は何もしない
  // Don't do anything if there's no DID
  if (!did) {
    return query
  }

  // 「スマートクォート」を通常の引用符に置き換え
  // iOSキーボードは装飾的なUnicode引用符を追加するが、通常の引用符しか機能しない
  // replace "smart quotes" with normal ones
  // iOS keyboard will add fancy unicode quotes, but only normal ones work
  query = query.replaceAll(/[""]/g, '"')

  // 「引用」されている部分文字列は置き換えたくない（完全一致検索なので）
  // そのため、引用部分と非引用部分を分割する
  // We don't want to replace substrings that are being "quoted" because those
  // are exact string matches, so what we'll do here is to split them apart

  // 偶数インデックスの文字列は引用されていない、奇数インデックスの文字列は引用されている
  // Even-indexed strings are unquoted, odd-indexed strings are quoted
  const splits = query.split(/("(?:[^"\\]|\\.)*")/g)

  return splits
    .map((str, idx) => {
      // 引用されていない部分のみ`from:me`を実際DIDに置き換え
      // Replace `from:me` with actual DID only in unquoted parts
      if (idx % 2 === 0) {
        // 単語境界で`from:me`をユーザーDIDに置き換え
        // Replace `from:me` with user DID at word boundaries
        return str.replaceAll(/(^|\s)from:me(\s|$)/g, `$1${did}$2`)
      }

      // 引用部分はそのまま返す
      // Return quoted parts as-is
      return str
    })
    .join('') // 分割された部分を再結合 / Rejoin the split parts
}
