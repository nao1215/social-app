/**
 * メディアユーティリティモジュール
 *
 * 【概要】
 * Data URI、Blob、ファイル形式の判定など、
 * メディア処理に関する汎用ユーティリティ関数群。
 *
 * 【Data URIとは】
 * data:image/png;base64,iVBORw0KGgo... のような形式。
 * ファイルパスを使わずにデータを直接URLとして埋め込める。
 *
 * 【Goユーザー向け補足】
 * - Promise: Goのchannel経由の非同期結果取得に相当
 * - FileReader: Goのio.Readerに相当するブラウザAPI
 */

/**
 * Data URIからMIMEタイプを抽出
 *
 * 【Data URIの形式】
 * data:image/png;base64,iVBORw0KGgo...
 *      ^^^^^^^^^ ← この部分を抽出
 *
 * @param uri Data URI文字列
 * @returns MIMEタイプ（例: 'image/png'）
 */
export function extractDataUriMime(uri: string): string {
  return uri.substring(uri.indexOf(':') + 1, uri.indexOf(';'))
}

/**
 * Data URIのデータサイズを推定
 *
 * 【計算方法】
 * Base64エンコードはオリジナルの約4/3倍になるため、
 * URI長 × 3/4 で元のサイズを概算できる。
 *
 * 【パフォーマンス】
 * 実際にデコードするより高速（デコード不要）。
 *
 * @param uri Data URI文字列
 * @returns 推定バイトサイズ
 */
export function getDataUriSize(uri: string): number {
  return Math.round((uri.length * 3) / 4)
}

/**
 * URIが画像ファイルか判定
 *
 * 【判定対象】
 * - .jpg, .jpeg（JPEG画像）
 * - .png（PNG画像）
 * - .webp（WebP画像）
 *
 * @param uri ファイルパスまたはURL
 * @returns 画像ファイルの場合true
 */
export function isUriImage(uri: string): boolean {
  return /\.(jpg|jpeg|png|webp).*$/.test(uri)
}

/**
 * BlobをData URIに変換
 *
 * 【処理の流れ】
 * 1. FileReaderでBlobを読み込み
 * 2. Base64エンコードされたData URIを生成
 * 3. Promise経由で結果を返す
 *
 * 【Goユーザー向け補足】
 * - Blob: Goのio.Readerで読めるバイト列に相当
 * - FileReader: 非同期読み込みAPI（Goのio.ReadAll相当だが非同期）
 * - Promise: Goのchannel経由の結果取得に相当
 *
 * @param blob 変換するBlobオブジェクト
 * @returns Data URI文字列（Promise）
 */
export function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read blob'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob) // Base64エンコードしてData URIとして読み込み
  })
}
