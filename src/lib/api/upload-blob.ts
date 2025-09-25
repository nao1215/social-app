import {copyAsync} from 'expo-file-system'
import {BskyAgent, ComAtprotoRepoUploadBlob} from '@atproto/api'

import {safeDeleteAsync} from '#/lib/media/manip'

/**
 * Blob（バイナリデータ）アップロード関数
 *
 * 【主な機能】
 * - 様々な形式の入力（ファイルパス、Blob、Data URL）を統一的に処理
 * - React NativeのJPEGアップロードバグ対応（.bin拡張子回避策）
 * - プラットフォーム固有のファイルアクセス方法の統一
 * - 一時ファイル管理とクリーンアップ処理
 *
 * 【使用場面】
 * - 投稿画像のアップロード処理
 * - 動画ファイルのアップロード処理
 * - ユーザーアバター・ヘッダー画像の更新
 *
 * 【技術的詳細】
 * - AndroidでのXMLHttpRequest使用（fetchの制限回避）
 * - React Native issue #27099のJPEGバグ対策
 * - 安全なファイル操作と自動クリーンアップ機能
 *
 * @param agent Bluesky APIエージェント
 * @param input アップロード対象（ファイルパス | Blob | Data URL）
 * @param encoding Blob形式の上書き指定（オプション）
 * @returns アップロード結果レスポンス
 */
export async function uploadBlob(
  agent: BskyAgent,
  input: string | Blob,
  encoding?: string,
): Promise<ComAtprotoRepoUploadBlob.Response> {
  // file:// URIの場合
  if (typeof input === 'string' && input.startsWith('file:')) {
    const blob = await asBlob(input)
    return agent.uploadBlob(blob, {encoding})
  }

  // 絶対パスの場合（file://プレフィックスを追加）
  if (typeof input === 'string' && input.startsWith('/')) {
    const blob = await asBlob(`file://${input}`)
    return agent.uploadBlob(blob, {encoding})
  }

  // Data URLの場合（Base64エンコードされたデータ）
  if (typeof input === 'string' && input.startsWith('data:')) {
    const blob = await fetch(input).then(r => r.blob())
    return agent.uploadBlob(blob, {encoding})
  }

  // 既にBlobオブジェクトの場合
  if (input instanceof Blob) {
    return agent.uploadBlob(input, {encoding})
  }

  throw new TypeError(`Invalid uploadBlob input: ${typeof input}`)
}

async function asBlob(uri: string): Promise<Blob> {
  return withSafeFile(uri, async safeUri => {
    // Note
    // Android does not support `fetch()` on `file://` URIs. for this reason, we
    // use XMLHttpRequest instead of simply calling:

    // return fetch(safeUri.replace('file:///', 'file:/')).then(r => r.blob())

    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.onload = () => resolve(xhr.response)
      xhr.onerror = () => reject(new Error('Failed to load blob'))
      xhr.responseType = 'blob'
      xhr.open('GET', safeUri, true)
      xhr.send(null)
    })
  })
}

// HACK
// React native has a bug that inflates the size of jpegs on upload
// we get around that by renaming the file ext to .bin
// see https://github.com/facebook/react-native/issues/27099
// -prf
async function withSafeFile<T>(
  uri: string,
  fn: (path: string) => Promise<T>,
): Promise<T> {
  if (uri.endsWith('.jpeg') || uri.endsWith('.jpg')) {
    // Since we don't "own" the file, we should avoid renaming or modifying it.
    // Instead, let's copy it to a temporary file and use that (then remove the
    // temporary file).
    const newPath = uri.replace(/\.jpe?g$/, '.bin')
    try {
      await copyAsync({from: uri, to: newPath})
    } catch {
      // Failed to copy the file, just use the original
      return await fn(uri)
    }
    try {
      return await fn(newPath)
    } finally {
      // Remove the temporary file
      await safeDeleteAsync(newPath)
    }
  } else {
    return fn(uri)
  }
}
