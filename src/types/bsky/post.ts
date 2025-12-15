/**
 * Bluesky 投稿埋め込み（Embed）型定義・パーサーモジュール
 *
 * このモジュールは、AT Protocolの投稿に含まれる埋め込みコンテンツ（画像、動画、リンク、
 * 引用投稿など）を型安全に扱うための型定義とパーサー関数を提供します。
 *
 * ## 埋め込み（Embed）とは
 * AT Protocolでは、投稿に様々なメディアやコンテンツを埋め込むことができます：
 * - 画像（最大4枚）
 * - 動画
 * - 外部リンク（Open Graphプレビュー）
 * - 引用投稿（他の投稿への参照）
 * - フィード/リスト/ラベラー/スターターパック
 * - メディア付き投稿（画像/動画 + 引用投稿）
 *
 * ## Goユーザー向け補足
 * - `type Embed = A | B | C`は、Goのsum type（tagged union）に相当
 * - `$Typed<T>`は、AT Protocolの型付きレコードを表現（`$type`フィールドを持つ）
 * - パース処理は、Goのtype switchやtype assertionに似た動作
 *
 * @module types/bsky/post
 */

// AT Protocol SDKから、各種埋め込み型定義をインポート
import {
  $Typed,                           // 型付きレコードマーカー（$typeフィールド付与）
  AppBskyEmbedExternal,            // 外部リンク埋め込み定義
  AppBskyEmbedImages,              // 画像埋め込み定義
  AppBskyEmbedRecord,              // レコード（投稿）埋め込み定義
  AppBskyEmbedRecordWithMedia,    // メディア付きレコード埋め込み定義
  AppBskyEmbedVideo,               // 動画埋め込み定義
  AppBskyFeedDefs,                 // フィード定義（投稿ビュー含む）
  AppBskyGraphDefs,                // グラフ定義（リスト、スターターパック）
  AppBskyLabelerDefs,              // ラベラー定義（コンテンツモデレーション）
} from '@atproto/api'

/**
 * 全ての埋め込みコンテンツ型のユニオン型
 *
 * AT Protocolでサポートされる全ての埋め込みタイプを網羅した識別可能ユニオン型です。
 * `type`フィールドで埋め込みの種類を判別できます（Goのtagged unionに相当）。
 *
 * ## 埋め込みタイプ一覧
 *
 * ### 投稿関連
 * - **post**: 通常の引用投稿（ViewRecord）
 * - **post_not_found**: 削除された投稿への参照
 * - **post_blocked**: ブロックされたユーザーの投稿
 * - **post_detached**: 分離された投稿（親投稿が削除された場合など）
 *
 * ### コンテンツタイプ
 * - **feed**: カスタムフィード（GeneratorView）
 * - **list**: ユーザーリスト（ListView）
 * - **labeler**: コンテンツラベラー（モデレーター）
 * - **starter_pack**: スターターパック（おすすめユーザー集）
 *
 * ### メディアタイプ
 * - **images**: 画像埋め込み（最大4枚）
 * - **link**: 外部リンク（Open Graphプレビュー）
 * - **video**: 動画埋め込み
 *
 * ### 複合タイプ
 * - **post_with_media**: 投稿 + メディア（画像/動画付き引用投稿）
 *
 * ### その他
 * - **unknown**: 未知の埋め込みタイプ
 *
 * ## Goユーザー向け補足
 * Goでの同等の表現：
 * ```go
 * type EmbedType string
 *
 * const (
 *     EmbedTypePost           EmbedType = "post"
 *     EmbedTypeImages         EmbedType = "images"
 *     EmbedTypeVideo          EmbedType = "video"
 *     // ...
 * )
 *
 * type Embed struct {
 *     Type  EmbedType
 *     View  interface{}  // 各型に応じた具体的なビューデータ
 *     Media *Embed       // post_with_mediaの場合のみ使用
 * }
 * ```
 *
 * @example
 * ```typescript
 * function renderEmbed(embed: Embed) {
 *   switch (embed.type) {
 *     case 'images':
 *       // embed.viewは$Typed<AppBskyEmbedImages.View>型
 *       return <ImageGallery images={embed.view.images} />
 *     case 'post':
 *       // embed.viewは$Typed<AppBskyEmbedRecord.ViewRecord>型
 *       return <QuotedPost post={embed.view} />
 *     case 'post_with_media':
 *       // 投稿とメディアの両方を表示
 *       return (
 *         <div>
 *           {renderEmbed(embed.view)}
 *           {renderEmbed(embed.media)}
 *         </div>
 *       )
 *     default:
 *       return null
 *   }
 * }
 * ```
 */
export type Embed =
  // 投稿埋め込み系（引用投稿とその状態）
  | {
      type: 'post'                                    // 通常の引用投稿
      view: $Typed<AppBskyEmbedRecord.ViewRecord>    // 投稿の完全なビューデータ
    }
  | {
      type: 'post_not_found'                          // 削除された投稿
      view: $Typed<AppBskyEmbedRecord.ViewNotFound>  // 「見つかりません」状態
    }
  | {
      type: 'post_blocked'                            // ブロックされた投稿
      view: $Typed<AppBskyEmbedRecord.ViewBlocked>   // 「ブロック中」状態
    }
  | {
      type: 'post_detached'                           // 分離された投稿
      view: $Typed<AppBskyEmbedRecord.ViewDetached>  // 「分離」状態
    }
  // コンテンツ埋め込み系（フィード、リスト、ラベラー、スターターパック）
  | {
      type: 'feed'                                    // カスタムフィード
      view: $Typed<AppBskyFeedDefs.GeneratorView>    // フィードジェネレータービュー
    }
  | {
      type: 'list'                                    // ユーザーリスト
      view: $Typed<AppBskyGraphDefs.ListView>        // リストビュー
    }
  | {
      type: 'labeler'                                 // コンテンツラベラー
      view: $Typed<AppBskyLabelerDefs.LabelerView>   // ラベラービュー
    }
  | {
      type: 'starter_pack'                                        // スターターパック
      view: $Typed<AppBskyGraphDefs.StarterPackViewBasic>       // スターターパック基本ビュー
    }
  // メディア埋め込み系（画像、リンク、動画）
  | {
      type: 'images'                                  // 画像埋め込み（最大4枚）
      view: $Typed<AppBskyEmbedImages.View>          // 画像ビュー配列
    }
  | {
      type: 'link'                                    // 外部リンク
      view: $Typed<AppBskyEmbedExternal.View>        // Open Graphプレビューデータ
    }
  | {
      type: 'video'                                   // 動画埋め込み
      view: $Typed<AppBskyEmbedVideo.View>           // 動画ビューデータ
    }
  // 複合埋め込み（投稿 + メディア）
  | {
      type: 'post_with_media'                         // メディア付き投稿
      view: Embed                                     // 投稿部分（再帰的）
      media: Embed                                    // メディア部分（images/video/link）
    }
  // 未知の埋め込みタイプ
  | {
      type: 'unknown'                                 // 未知の埋め込み
      view: null                                      // ビューデータなし
    }

/**
 * 埋め込みタイプ抽出ユーティリティ型
 *
 * 特定のtypeを持つEmbed型を抽出するヘルパー型です。
 * TypeScriptの型システムを使って、type値に基づいて正確な型を取得できます。
 *
 * ## Goユーザー向け補足
 * Goのtype assertionに相当する型レベルの操作です：
 * ```go
 * // 実行時の型アサーション
 * if imageEmbed, ok := embed.(ImagesEmbed); ok {
 *     // imageEmbedはImagesEmbed型
 * }
 * ```
 *
 * @template T - 抽出する埋め込みタイプ（'post', 'images', など）
 *
 * @example
 * ```typescript
 * // 'images'型の埋め込みのみを扱う関数
 * function handleImagesEmbed(embed: EmbedType<'images'>) {
 *   // embedは確実に{ type: 'images', view: $Typed<AppBskyEmbedImages.View> }型
 *   embed.view.images.forEach(img => {
 *     console.log(img.thumb)
 *   })
 * }
 * ```
 */
export type EmbedType<T extends Embed['type']> = Extract<Embed, {type: T}>

/**
 * レコード埋め込みビューをパースして型付きEmbedに変換
 *
 * AppBskyEmbedRecord.Viewの`record`フィールドを解析し、
 * 適切な型のEmbed構造体に変換します。レコード埋め込みには様々な状態
 * （通常/未発見/ブロック/分離）やタイプ（投稿/フィード/リストなど）があり、
 * それぞれを識別可能なユニオン型に変換します。
 *
 * ## 処理フロー
 * 1. recordの型を型チェッカー（is*関数）で判定
 * 2. 判定結果に応じて適切なEmbed型のオブジェクトを生成
 * 3. type discriminatorを付与して返却
 *
 * ## Goユーザー向け補足
 * Goのtype switchに相当する処理です：
 * ```go
 * func parseEmbedRecord(record interface{}) Embed {
 *     switch r := record.(type) {
 *     case ViewRecord:
 *         return Embed{Type: "post", View: r}
 *     case ViewNotFound:
 *         return Embed{Type: "post_not_found", View: r}
 *     // ...
 *     default:
 *         return Embed{Type: "unknown", View: nil}
 *     }
 * }
 * ```
 *
 * @param record - パース対象のレコードビュー（AppBskyEmbedRecord.View）
 * @returns 型付きEmbed構造体
 *
 * @example
 * ```typescript
 * const recordEmbed: AppBskyEmbedRecord.View = {
 *   record: {
 *     $type: 'app.bsky.embed.record#viewRecord',
 *     // ... その他のフィールド
 *   }
 * }
 *
 * const parsed = parseEmbedRecordView(recordEmbed)
 * // parsed = { type: 'post', view: {...} }
 *
 * if (parsed.type === 'post') {
 *   console.log(parsed.view.author.displayName)
 * }
 * ```
 */
export function parseEmbedRecordView({record}: AppBskyEmbedRecord.View): Embed {
  // ViewRecord: 通常の投稿埋め込み
  if (AppBskyEmbedRecord.isViewRecord(record)) {
    return {
      type: 'post',
      view: record,
    }
  }
  // ViewNotFound: 削除された投稿への参照
  else if (AppBskyEmbedRecord.isViewNotFound(record)) {
    return {
      type: 'post_not_found',
      view: record,
    }
  }
  // ViewBlocked: ブロックされたユーザーの投稿
  else if (AppBskyEmbedRecord.isViewBlocked(record)) {
    return {
      type: 'post_blocked',
      view: record,
    }
  }
  // ViewDetached: 分離された投稿（親投稿削除など）
  else if (AppBskyEmbedRecord.isViewDetached(record)) {
    return {
      type: 'post_detached',
      view: record,
    }
  }
  // GeneratorView: カスタムフィード埋め込み
  else if (AppBskyFeedDefs.isGeneratorView(record)) {
    return {
      type: 'feed',
      view: record,
    }
  }
  // ListView: ユーザーリスト埋め込み
  else if (AppBskyGraphDefs.isListView(record)) {
    return {
      type: 'list',
      view: record,
    }
  }
  // LabelerView: コンテンツラベラー埋め込み
  else if (AppBskyLabelerDefs.isLabelerView(record)) {
    return {
      type: 'labeler',
      view: record,
    }
  }
  // StarterPackViewBasic: スターターパック埋め込み
  else if (AppBskyGraphDefs.isStarterPackViewBasic(record)) {
    return {
      type: 'starter_pack',
      view: record,
    }
  }
  // 上記のいずれにも該当しない未知の型
  else {
    return {
      type: 'unknown',
      view: null,
    }
  }
}

/**
 * 投稿の埋め込みデータをパースして型付きEmbedに変換
 *
 * AppBskyFeedDefs.PostViewの`embed`フィールドを解析し、
 * 適切な型のEmbed構造体に変換します。画像、動画、外部リンク、
 * レコード埋め込み、複合埋め込み（レコード+メディア）など、
 * 全ての埋め込みタイプに対応しています。
 *
 * ## 処理フロー
 * 1. embedの型をSDKの型チェッカー（is*関数）で判定
 * 2. 単純な埋め込み（images/video/link）はそのまま変換
 * 3. レコード埋め込みは`parseEmbedRecordView`で再帰的にパース
 * 4. 複合埋め込み（RecordWithMedia）は両方をパースして結合
 *
 * ## Goユーザー向け補足
 * Goのtype switchによる多段階パースに相当：
 * ```go
 * func parseEmbed(embed interface{}) Embed {
 *     switch e := embed.(type) {
 *     case ImagesView:
 *         return Embed{Type: "images", View: e}
 *     case VideoView:
 *         return Embed{Type: "video", View: e}
 *     case RecordView:
 *         return parseEmbedRecord(e)  // 再帰的にパース
 *     case RecordWithMediaView:
 *         return Embed{
 *             Type:  "post_with_media",
 *             View:  parseEmbedRecord(e.Record),
 *             Media: parseEmbed(e.Media),
 *         }
 *     default:
 *         return Embed{Type: "unknown", View: nil}
 *     }
 * }
 * ```
 *
 * @param embed - パース対象の埋め込みデータ（PostView.embed）
 * @returns 型付きEmbed構造体
 *
 * @example
 * ```typescript
 * const post: AppBskyFeedDefs.PostView = {
 *   // ... その他のフィールド
 *   embed: {
 *     $type: 'app.bsky.embed.images#view',
 *     images: [...]
 *   }
 * }
 *
 * const parsed = parseEmbed(post.embed)
 * // parsed = { type: 'images', view: {...} }
 *
 * if (parsed.type === 'images') {
 *   parsed.view.images.forEach(img => {
 *     console.log(img.fullsize)
 *   })
 * }
 *
 * // 複合埋め込みの例
 * const postWithMedia: AppBskyFeedDefs.PostView = {
 *   embed: {
 *     $type: 'app.bsky.embed.recordWithMedia#view',
 *     record: { ... },  // 引用投稿
 *     media: { ... }    // 画像/動画
 *   }
 * }
 *
 * const parsedComplex = parseEmbed(postWithMedia.embed)
 * // parsedComplex = {
 * //   type: 'post_with_media',
 * //   view: { type: 'post', view: {...} },
 * //   media: { type: 'images', view: {...} }
 * // }
 * ```
 */
export function parseEmbed(embed: AppBskyFeedDefs.PostView['embed']): Embed {
  // 画像埋め込み（最大4枚）
  if (AppBskyEmbedImages.isView(embed)) {
    return {
      type: 'images',
      view: embed,
    }
  }
  // 外部リンク埋め込み（Open Graphプレビュー）
  else if (AppBskyEmbedExternal.isView(embed)) {
    return {
      type: 'link',
      view: embed,
    }
  }
  // 動画埋め込み
  else if (AppBskyEmbedVideo.isView(embed)) {
    return {
      type: 'video',
      view: embed,
    }
  }
  // レコード埋め込み（投稿/フィード/リストなど）
  // 再帰的にparseEmbedRecordViewを呼び出して詳細な型を取得
  else if (AppBskyEmbedRecord.isView(embed)) {
    return parseEmbedRecordView(embed)
  }
  // 複合埋め込み（レコード + メディア）
  // 例: 画像付きの引用投稿、動画付きの引用投稿
  else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
    return {
      type: 'post_with_media',
      view: parseEmbedRecordView(embed.record),  // レコード部分をパース
      media: parseEmbed(embed.media),             // メディア部分をパース（再帰呼び出し）
    }
  }
  // 上記のいずれにも該当しない未知の埋め込みタイプ
  else {
    return {
      type: 'unknown',
      view: null,
    }
  }
}
