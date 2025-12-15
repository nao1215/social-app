/**
 * 画像ギャラリー管理モジュール
 *
 * このモジュールは投稿コンポーザーで使用する画像の操作（クロップ、圧縮、変換）を提供します。
 * Expo File SystemとImage Manipulatorを使用してネイティブプラットフォームで画像処理を行います。
 *
 * 主な機能:
 * - 画像のクロップ（切り抜き）
 * - 画像の圧縮（ファイルサイズ削減）
 * - 画像の変換（リサイズ、フォーマット変換）
 * - 一時ファイルの管理
 *
 * 【Goユーザー向け補足】
 * - type: Goのtype aliasやstructに相当する型定義
 * - interface: Goのinterfaceに似ているが、構造体の型定義としても使われる
 */

// Expo File System - ファイル操作API（キャッシュディレクトリ、削除、作成、移動）
import {
  cacheDirectory,
  deleteAsync,
  makeDirectoryAsync,
  moveAsync,
} from 'expo-file-system'
// Expo Image Manipulator - 画像編集API（クロップ、リサイズ、圧縮）
import {
  type Action,
  type ActionCrop,
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator'
// nanoid - セキュアでないがパフォーマンスの良いユニークID生成（クライアント側で使用）
import {nanoid} from 'nanoid/non-secure'

// 投稿画像の最大サイズ定数（幅、高さ、ファイルサイズ）
import {POST_IMG_MAX} from '#/lib/constants'
// 画像の寸法取得ユーティリティ
import {getImageDim} from '#/lib/media/manip'
// 画像クロッパーUI起動関数
import {openCropper} from '#/lib/media/picker'
// ピッカー画像の型定義
import {type PickerImage} from '#/lib/media/picker.shared'
// Data URI形式の画像サイズ計算ユーティリティ
import {getDataUriSize} from '#/lib/media/util'
// プラットフォーム検出（ネイティブかWebか判定）
import {isNative} from '#/platform/detection'

/**
 * 画像変換設定
 *
 * 【Goユーザー向け補足】
 * TypeScriptの`type`はGoの`type`に似ており、既存の型から新しい型を定義します。
 */
export type ImageTransformation = {
  crop?: ActionCrop['crop'] // クロップ設定（オプション）
}

/**
 * 画像メタデータ
 *
 * 画像の基本情報（パス、サイズ、MIMEタイプ）を保持します。
 *
 * 【Goユーザー向け補足】
 * これはGoのstructに相当します：
 * type ImageMeta struct {
 *   Path   string
 *   Width  int
 *   Height int
 *   Mime   string
 * }
 */
export type ImageMeta = {
  path: string   // ファイルパス（ローカルまたはData URI）
  width: number  // 画像の幅（ピクセル）
  height: number // 画像の高さ（ピクセル）
  mime: string   // MIMEタイプ（image/jpeg, image/pngなど）
}

/**
 * 画像ソース（ID付きメタデータ）
 *
 * ImageMetaを継承し、一意のIDを追加します。
 *
 * 【Goユーザー向け補足】
 * `&`はGoの構造体埋め込みに似ており、ImageMetaの全フィールドを継承します。
 */
export type ImageSource = ImageMeta & {
  id: string // 画像の一意識別子
}

/**
 * コンポーザー画像の基本型
 * 全てのコンポーザー画像が持つ共通フィールドを定義します。
 */
type ComposerImageBase = {
  alt: string          // 代替テキスト（アクセシビリティ）
  source: ImageSource  // 元画像のソース情報
}

/**
 * 変換なしのコンポーザー画像
 *
 * 元画像そのままで、クロップや圧縮などの変換が適用されていない状態。
 */
type ComposerImageWithoutTransformation = ComposerImageBase & {
  transformed?: undefined       // 変換後画像は存在しない
  manips?: undefined           // 変換設定も存在しない
}

/**
 * 変換ありのコンポーザー画像
 *
 * クロップや圧縮などの変換が適用された画像と、その設定を保持します。
 */
type ComposerImageWithTransformation = ComposerImageBase & {
  transformed: ImageMeta           // 変換後の画像メタデータ
  manips?: ImageTransformation     // 適用された変換設定
}

/**
 * コンポーザー画像のユニオン型
 *
 * 変換あり/なしの両方のケースを表現する判別共用体（discriminated union）。
 *
 * 【Goユーザー向け補足】
 * TypeScriptのユニオン型（|）はGoにはない機能です。
 * これは「どちらか一方の型」を表現し、型安全性を保ちながら柔軟な型定義を可能にします。
 */
export type ComposerImage =
  | ComposerImageWithoutTransformation
  | ComposerImageWithTransformation

// 画像キャッシュディレクトリのパス（遅延初期化）
let _imageCacheDirectory: string

/**
 * 画像キャッシュディレクトリのパスを取得
 *
 * ネイティブプラットフォームでのみキャッシュディレクトリを返します。
 * Web環境ではnullを返します（キャッシュ不要）。
 *
 * @returns キャッシュディレクトリパス、またはnull（Web環境）
 *
 * 【Goユーザー向け補足】
 * `??=`はnull合体代入演算子で、変数がnullまたはundefinedの場合のみ代入します。
 * Goの`if val == nil { val = ... }`に相当します。
 */
function getImageCacheDirectory(): string | null {
  if (isNative) {
    // 初回アクセス時にパスを生成してキャッシュ
    return (_imageCacheDirectory ??= joinPath(cacheDirectory!, 'bsky-composer'))
  }

  return null
}

/**
 * コンポーザー画像を生成
 *
 * 生の画像メタデータからコンポーザー用の画像オブジェクトを作成します。
 * 必要に応じてファイルをキャッシュディレクトリに移動します。
 *
 * @param raw - 元画像のメタデータ
 * @returns 変換なしのコンポーザー画像オブジェクト
 *
 * 【Goユーザー向け補足】
 * `async function`はGoのgoroutineに似た非同期関数です。
 * `Promise<T>`はGoのチャネルに似ており、非同期処理の結果を表現します。
 * `await`でPromiseの完了を待機します（Goの`<-ch`に相当）。
 */
export async function createComposerImage(
  raw: ImageMeta,
): Promise<ComposerImageWithoutTransformation> {
  return {
    alt: '',  // 初期状態では代替テキストは空
    source: {
      id: nanoid(),                          // ユニークIDを生成
      path: await moveIfNecessary(raw.path), // 必要に応じてファイルを移動
      width: raw.width,
      height: raw.height,
      mime: raw.mime,
    },
  }
}

/**
 * 初期画像データ
 *
 * コンポーザーを開く際に既存の画像を読み込むための型定義。
 */
export type InitialImage = {
  uri: string       // 画像URI
  width: number     // 幅
  height: number    // 高さ
  altText?: string  // 代替テキスト（オプション）
}

/**
 * 初期画像リストをコンポーザー画像に変換
 *
 * 既存の投稿を編集する場合など、初期状態で画像を表示するために使用します。
 *
 * @param uris - 初期画像データの配列
 * @returns コンポーザー画像の配列
 */
export function createInitialImages(
  uris: InitialImage[] = [],
): ComposerImageWithoutTransformation[] {
  // 各画像データをコンポーザー画像形式に変換
  return uris.map(({uri, width, height, altText = ''}) => {
    return {
      alt: altText,
      source: {
        id: nanoid(),
        path: uri,
        width: width,
        height: height,
        mime: 'image/jpeg', // デフォルトはJPEG
      },
    }
  })
}

/**
 * ペーストされた画像を処理
 *
 * クリップボードから貼り付けられた画像（通常Data URI形式）を
 * コンポーザー画像オブジェクトに変換します。
 *
 * @param uri - 画像URI（Data URIまたはファイルURI）
 * @returns コンポーザー画像オブジェクト
 */
export async function pasteImage(
  uri: string,
): Promise<ComposerImageWithoutTransformation> {
  // 画像の寸法を取得
  const {width, height} = await getImageDim(uri)
  // Data URIからMIMEタイプを抽出（例: data:image/png;base64,... → image/png）
  const match = /^data:(.+?);/.exec(uri)

  return {
    alt: '',
    source: {
      id: nanoid(),
      path: uri,
      width: width,
      height: height,
      mime: match ? match[1] : 'image/jpeg', // MIMEタイプを検出、失敗時はJPEG
    },
  }
}

/**
 * 画像をクロップ（切り抜き）
 *
 * ネイティブプラットフォームでのみ動作します。
 * ユーザーにクロップUIを表示し、選択範囲で画像を切り抜きます。
 *
 * @param img - クロップ対象の画像
 * @returns クロップ後の画像（キャンセル時は元の画像）
 *
 * 【Goユーザー向け補足】
 * try-catchはGoのdefer/recoverに似たエラーハンドリングです。
 * TypeScriptではthrowされた例外をcatchブロックで捕捉します。
 */
export async function cropImage(img: ComposerImage): Promise<ComposerImage> {
  // Web環境では何もせずに元の画像を返す
  if (!isNative) {
    return img
  }

  const source = img.source

  // TODO: 常に元画像を渡しているが、image-cropperは初期クロップ範囲を設定できる？ -mary
  try {
    // ネイティブのクロップUIを起動
    const cropped = await openCropper({
      imageUri: source.path,
    })

    // クロップ後の画像情報を保持（元画像も保持）
    return {
      alt: img.alt,
      source: source,  // 元画像は保持
      transformed: {   // クロップ後の画像
        path: await moveIfNecessary(cropped.path),
        width: cropped.width,
        height: cropped.height,
        mime: cropped.mime,
      },
    }
  } catch (e) {
    // ユーザーがキャンセルした場合は元の画像を返す
    if (e instanceof Error && e.message.includes('User cancelled')) {
      return img
    }

    // その他のエラーは再スロー
    throw e
  }
}

/**
 * 画像を変換（クロップなどの操作を適用）
 *
 * 指定された変換設定を画像に適用します。
 * 変換が不要な場合は元の画像を返します。
 *
 * @param img - 変換対象の画像
 * @param trans - 適用する変換設定
 * @returns 変換後の画像
 */
export async function manipulateImage(
  img: ComposerImage,
  trans: ImageTransformation,
): Promise<ComposerImage> {
  // 変換アクションの配列を構築（cropがある場合のみ追加）
  const rawActions: (Action | undefined)[] = [trans.crop && {crop: trans.crop}]

  // undefinedを除外して有効なアクションのみ抽出
  // 【Goユーザー向け補足】
  // (a): a is Action は型ガード関数で、Goの型アサーションに似ています。
  const actions = rawActions.filter((a): a is Action => a !== undefined)

  // 変換が不要な場合
  if (actions.length === 0) {
    if (img.transformed === undefined) {
      return img  // 既に変換なし状態ならそのまま返す
    }

    // 変換をリセットして元画像を返す
    return {alt: img.alt, source: img.source}
  }

  // 画像変換を実行
  const source = img.source
  const result = await manipulateAsync(source.path, actions, {
    format: SaveFormat.PNG,  // PNG形式で保存（可逆圧縮）
  })

  return {
    alt: img.alt,
    source: img.source,
    transformed: {
      path: await moveIfNecessary(result.uri),
      width: result.width,
      height: result.height,
      mime: 'image/png',
    },
    manips: trans,  // 適用した変換設定を記録
  }
}

/**
 * 画像の変換をリセット
 *
 * クロップなどの変換を破棄し、元の画像に戻します。
 *
 * @param img - リセット対象の画像
 * @returns 変換なしの元画像
 */
export function resetImageManipulation(
  img: ComposerImage,
): ComposerImageWithoutTransformation {
  if (img.transformed !== undefined) {
    // 変換ありの場合は元画像のみを返す
    return {alt: img.alt, source: img.source}
  }

  // 既に変換なし状態ならそのまま返す
  return img
}

/**
 * 画像を圧縮（ファイルサイズを削減）
 *
 * 二分探索を使用して最適な画質を見つけ、指定サイズ以下に圧縮します。
 * アップロード可能な最大サイズ制限に適合するよう品質を調整します。
 *
 * @param img - 圧縮対象の画像
 * @returns 圧縮後の画像データ
 * @throws 圧縮に失敗した場合（指定サイズ以下にできない）
 *
 * 【Goユーザー向け補足】
 * 二分探索アルゴリズムでJPEG品質パラメータを調整し、最適な圧縮率を見つけます。
 */
export async function compressImage(img: ComposerImage): Promise<PickerImage> {
  // 変換後の画像があればそれを使用、なければ元画像を使用
  const source = img.transformed || img.source

  // 最大解像度内に収まるようリサイズ
  const [w, h] = containImageRes(source.width, source.height, POST_IMG_MAX)

  // 二分探索の範囲（品質パーセンテージ）
  let minQualityPercentage = 0
  let maxQualityPercentage = 101 // exclusive
  let newDataUri

  // 二分探索で最適な品質を見つける
  while (maxQualityPercentage - minQualityPercentage > 1) {
    // 中間点の品質を計算
    const qualityPercentage = Math.round(
      (maxQualityPercentage + minQualityPercentage) / 2,
    )

    // 指定品質で画像を圧縮
    const res = await manipulateAsync(
      source.path,
      [{resize: {width: w, height: h}}],
      {
        compress: qualityPercentage / 100,  // 品質（0.0〜1.0）
        format: SaveFormat.JPEG,            // JPEG形式（非可逆圧縮）
        base64: true,                       // Base64エンコード
      },
    )

    // 圧縮後のサイズを計算
    const base64 = res.base64
    const size = base64 ? getDataUriSize(base64) : 0
    if (base64 && size <= POST_IMG_MAX.size) {
      minQualityPercentage = qualityPercentage
      newDataUri = {
        path: await moveIfNecessary(res.uri),
        width: res.width,
        height: res.height,
        mime: 'image/jpeg',
        size,
      }
    } else {
      maxQualityPercentage = qualityPercentage
    }
  }

  if (newDataUri) {
    return newDataUri
  }

  // 最低品質でもサイズオーバー（圧縮失敗）
  throw new Error(`Unable to compress image`)
}

/**
 * 必要に応じてファイルを移動
 *
 * ファイルが既にキャッシュディレクトリにある場合のみ、
 * ユニークなファイル名で移動します（衝突回避）。
 *
 * @param from - 移動元パス
 * @returns 移動後のパス（移動不要な場合は元のパス）
 */
async function moveIfNecessary(from: string) {
  const cacheDir = isNative && getImageCacheDirectory()

  // キャッシュディレクトリ内のファイルの場合のみ移動
  if (cacheDir && from.startsWith(cacheDir)) {
    const to = joinPath(cacheDir, nanoid(36))  // ユニークなファイル名を生成

    await makeDirectoryAsync(cacheDir, {intermediates: true})  // ディレクトリを確実に作成
    await moveAsync({from, to})  // ファイルを移動

    return to
  }

  // キャッシュディレクトリ外のファイルはそのまま
  return from
}

/**
 * 一時画像ファイルをパージ
 *
 * 画像操作で作成された一時ファイルを全て削除します。
 * コンポーザーを閉じる際などに呼び出されます。
 */
export async function purgeTemporaryImageFiles() {
  const cacheDir = isNative && getImageCacheDirectory()

  if (cacheDir) {
    await deleteAsync(cacheDir, {idempotent: true})  // ディレクトリを削除（存在しなくてもエラーにしない）
    await makeDirectoryAsync(cacheDir)               // 空のディレクトリを再作成
  }
}

/**
 * パスを結合
 *
 * 2つのパス文字列を適切に結合します（スラッシュの重複を防ぐ）。
 *
 * @param a - 親パス
 * @param b - 子パス
 * @returns 結合されたパス
 */
function joinPath(a: string, b: string) {
  if (a.endsWith('/')) {
    if (b.startsWith('/')) {
      return a.slice(0, -1) + b  // 両方にスラッシュがある場合、片方を削除
    }
    return a + b
  } else if (b.startsWith('/')) {
    return a + b
  }
  return a + '/' + b  // どちらにもスラッシュがない場合、追加
}

/**
 * 画像解像度を最大値内に収める
 *
 * アスペクト比を維持しながら、指定された最大幅・高さ内に収まるよう
 * 画像サイズを計算します。
 *
 * @param w - 元の幅
 * @param h - 元の高さ
 * @param maxW - 最大幅
 * @param maxH - 最大高さ
 * @returns [調整後の幅, 調整後の高さ]
 *
 * 【Goユーザー向け補足】
 * 戻り値の型`[width: number, height: number]`はタプル型で、
 * Goの複数戻り値`(width int, height int)`に相当します。
 */
function containImageRes(
  w: number,
  h: number,
  {width: maxW, height: maxH}: {width: number; height: number},
): [width: number, height: number] {
  let scale = 1

  // 最大サイズを超える場合、スケールを計算
  if (w > maxW || h > maxH) {
    // 幅と高さのうち、より大きい比率に合わせてスケール
    scale = w > h ? maxW / w : maxH / h
    w = Math.floor(w * scale)
    h = Math.floor(h * scale)
  }

  return [w, h]
}
