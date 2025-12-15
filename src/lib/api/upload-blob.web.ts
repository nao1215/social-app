/**
 * @atproto/api: AT Protocol（Bluesky）のAPI クライアントライブラリ
 * BskyAgent: Bluesky APIとの通信を行うエージェントクラス
 * ComAtprotoRepoUploadBlob: Blobアップロードのレスポンス型定義
 */
import {BskyAgent, ComAtprotoRepoUploadBlob} from '@atproto/api'

/**
 * Web版のBlobアップロード関数
 *
 * 【プラットフォーム固有ファイルについて】
 * このファイルは `.web.ts` 拡張子を持つ。React Nativeのビルドシステムは
 * プラットフォームに応じて適切なファイルを選択する：
 * - upload-blob.web.ts → Web（ブラウザ）向け
 * - upload-blob.ts → React Native（iOS/Android）向け
 *
 * 【Web版の特徴】
 * ブラウザでは fetch() APIがfile://やblob: URLに対応しているため、
 * Native版（XMLHttpRequest使用）よりシンプルな実装になっている。
 *
 * 【推奨される使用方法】
 * Web環境では、<input type="file"> で取得した File オブジェクトを
 * 直接渡すことを推奨。File は Blob を継承しているため、
 * メモリ効率が良い（data: URL に変換する必要がない）。
 *
 * @note It is recommended, on web, to use the `file` instance of the file
 * selector input element, rather than a `data:` URL, to avoid
 * loading the file into memory. `File` extends `Blob` "file" instances can
 * be passed directly to this function.
 *
 * @param agent Bluesky APIエージェント
 * @param input アップロード対象（data: URL | blob: URL | Blob）
 * @param encoding MIMEタイプの上書き指定（オプション）
 * @returns アップロード結果レスポンス
 */
export async function uploadBlob(
  agent: BskyAgent,
  input: string | Blob,
  encoding?: string,
): Promise<ComAtprotoRepoUploadBlob.Response> {
  // data: URL または blob: URL の場合
  // data: URL = Base64エンコードされたデータ（例: "data:image/png;base64,..."）
  // blob: URL = ブラウザ内メモリのBlob参照（例: "blob:https://..."）
  if (
    typeof input === 'string' &&
    (input.startsWith('data:') || input.startsWith('blob:'))
  ) {
    // fetch() でURLからBlobオブジェクトを取得
    // Go言語での io.ReadAll(resp.Body) に相当
    const blob = await fetch(input).then(r => r.blob())
    return agent.uploadBlob(blob, {encoding})
  }

  // 既に Blob オブジェクトの場合（File も Blob を継承しているのでここに含まれる）
  if (input instanceof Blob) {
    return agent.uploadBlob(input, {
      encoding,
    })
  }

  // サポートされていない入力形式の場合はエラー
  throw new TypeError(`Invalid uploadBlob input: ${typeof input}`)
}
