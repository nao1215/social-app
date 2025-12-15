/**
 * expo-file-system: Expoのファイルシステムモジュール
 * copyAsync: ファイルを非同期でコピーする関数
 *
 * 【Go言語での類似処理】
 * io.Copy(dst, src) でファイルをコピーするのと同様
 */
import {copyAsync} from 'expo-file-system'

/**
 * @atproto/api: AT Protocol（Bluesky）のAPI クライアントライブラリ
 * BskyAgent: Bluesky APIとの通信を行うエージェントクラス
 * ComAtprotoRepoUploadBlob: Blobアップロードのレスポンス型定義
 *
 * 【AT Protocolとは】
 * 分散型SNSのためのオープンプロトコル。
 * Blueskyはこのプロトコルを使用している。
 */
import {BskyAgent, ComAtprotoRepoUploadBlob} from '@atproto/api'

/**
 * safeDeleteAsync: 安全にファイルを削除する関数
 * エラーが発生しても例外をスローしない（静かに失敗する）
 */
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

/**
 * ファイルURIをBlobオブジェクトに変換する内部関数
 *
 * 【Blobとは】
 * Binary Large Object の略。画像や動画などのバイナリデータを
 * JavaScript で扱うためのオブジェクト。
 * Go言語での []byte に相当する。
 *
 * 【XMLHttpRequestを使う理由】
 * Android では fetch() が file:// URI に対応していない。
 * そのため、古い XMLHttpRequest API を使用してファイルを読み込む。
 *
 * 【Promiseパターン】
 * new Promise((resolve, reject) => {...}) は非同期処理のラッパー。
 * - resolve(値): 成功時に呼び出し、値を返す
 * - reject(エラー): 失敗時に呼び出し、エラーを投げる
 *
 * @param uri ファイルのURI（file://で始まる）
 * @returns Blobオブジェクトを含むPromise
 */
async function asBlob(uri: string): Promise<Blob> {
  return withSafeFile(uri, async safeUri => {
    // Note
    // Android does not support `fetch()` on `file://` URIs. for this reason, we
    // use XMLHttpRequest instead of simply calling:

    // return fetch(safeUri.replace('file:///', 'file:/')).then(r => r.blob())

    return await new Promise((resolve, reject) => {
      // XMLHttpRequest: ブラウザ標準のHTTPリクエストAPI（古いが互換性が高い）
      const xhr = new XMLHttpRequest()

      // onload: リクエスト成功時のコールバック
      xhr.onload = () => resolve(xhr.response)

      // onerror: リクエスト失敗時のコールバック
      xhr.onerror = () => reject(new Error('Failed to load blob'))

      // responseType: レスポンスの形式を指定（'blob'でバイナリデータとして受け取る）
      xhr.responseType = 'blob'

      // open: リクエストの初期化（メソッド, URL, 非同期フラグ）
      xhr.open('GET', safeUri, true)

      // send: リクエストを送信（GETなのでbodyはnull）
      xhr.send(null)
    })
  })
}

/**
 * React Native の JPEG アップロードバグを回避するためのラッパー関数
 *
 * 【問題の背景】
 * React Native には JPEG ファイルをアップロードする際に
 * ファイルサイズが膨らんでしまうバグがある（issue #27099）。
 * 原因は、.jpg/.jpeg 拡張子のファイルに対して
 * 内部で再エンコーディングが行われるため。
 *
 * 【解決策】
 * 拡張子を .bin に変更することで、React Native の
 * JPEG 検出を回避し、バイナリデータとしてそのまま送信する。
 *
 * 【ジェネリクス <T> について】
 * <T> は型パラメータ。関数の戻り値の型を柔軟に指定できる。
 * Go言語の interface{} や any に似ているが、型安全性が保たれる。
 *
 * 【高階関数パターン】
 * fn: (path: string) => Promise<T> は「関数を引数に取る関数」。
 * Go言語での func(path string) T のようなコールバック関数に相当。
 *
 * 【try-finally パターン】
 * finally ブロックは成功・失敗に関わらず必ず実行される。
 * Go言語の defer に相当する。一時ファイルの削除に使用。
 *
 * @param uri ファイルのURI
 * @param fn ファイルパスを受け取って処理を行う関数
 * @returns 処理結果
 *
 * @see https://github.com/facebook/react-native/issues/27099
 */
async function withSafeFile<T>(
  uri: string,
  fn: (path: string) => Promise<T>,
): Promise<T> {
  // JPEG ファイルの場合のみ特別な処理を行う
  if (uri.endsWith('.jpeg') || uri.endsWith('.jpg')) {
    // Since we don't "own" the file, we should avoid renaming or modifying it.
    // Instead, let's copy it to a temporary file and use that (then remove the
    // temporary file).
    // 元ファイルは変更せず、一時ファイルにコピーして処理する

    // 拡張子を .bin に変更（React Native の JPEG 検出を回避）
    const newPath = uri.replace(/\.jpe?g$/, '.bin')
    try {
      // ファイルをコピー（元ファイルを保護）
      await copyAsync({from: uri, to: newPath})
    } catch {
      // Failed to copy the file, just use the original
      // コピー失敗時は元ファイルをそのまま使用
      return await fn(uri)
    }
    try {
      // 一時ファイルで処理を実行
      return await fn(newPath)
    } finally {
      // Remove the temporary file
      // 成功・失敗に関わらず一時ファイルを削除（Go の defer に相当）
      await safeDeleteAsync(newPath)
    }
  } else {
    // JPEG 以外のファイルはそのまま処理
    return fn(uri)
  }
}
