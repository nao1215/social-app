/**
 * 投稿埋め込み（Embed）コンポーネントの型定義モジュール
 *
 * このモジュールは、投稿に含まれる様々な埋め込みコンテンツ（画像、動画、リンク、引用など）を
 * 表示するためのコンポーネントで共通して使用される型定義を提供します。
 *
 * 主な機能:
 * - 埋め込み表示コンテキストの定義（スレッド、フィード、メディア付き引用など）
 * - 埋め込みコンポーネントの共通プロパティ定義
 * - モデレーション（コンテンツ管理）情報の型定義
 *
 * Go言語との対比:
 * - enum: Goのconst + iotaに相当
 * - type: Goのstructに相当（ただしTypeScriptは構造的型付け）
 * - StyleProp<ViewStyle>: React Nativeのスタイルオブジェクト型
 */

// React Nativeのスタイル関連型をインポート
import {type StyleProp, type ViewStyle} from 'react-native'
// AT Protocolのフィード定義とモデレーション判定型をインポート
import {type AppBskyFeedDefs, type ModerationDecision} from '@atproto/api'

/**
 * 投稿埋め込みの表示コンテキスト列挙型
 *
 * 埋め込みコンテンツがどのような場所で表示されているかを示します。
 * これにより、表示スタイルや動作を文脈に応じて変更できます。
 *
 * @enum {string}
 */
export enum PostEmbedViewContext {
  /** スレッド内でハイライト表示される投稿（詳細ビュー） */
  ThreadHighlighted = 'ThreadHighlighted',
  /** フィード（タイムライン）内での表示 */
  Feed = 'Feed',
  /** メディア付き引用投稿内での埋め込み表示 */
  FeedEmbedRecordWithMedia = 'FeedEmbedRecordWithMedia',
}

/**
 * 引用埋め込みの表示コンテキスト列挙型
 *
 * 引用投稿に特化した表示コンテキスト。
 * 現在はPostEmbedViewContextのサブセット。
 *
 * @enum {string}
 */
export enum QuoteEmbedViewContext {
  /** メディア付き引用投稿内での表示 */
  FeedEmbedRecordWithMedia = PostEmbedViewContext.FeedEmbedRecordWithMedia,
}

/**
 * 埋め込みコンポーネントの共通プロパティ型
 *
 * すべての埋め込みコンポーネントで共有されるプロパティを定義します。
 * Go言語のstructに相当しますが、TypeScriptでは構造的型付けを使用。
 *
 * @property {ModerationDecision} [moderation] - コンテンツモデレーション（表示制限）情報
 * @property {() => void} [onOpen] - 埋め込みを開いた時のコールバック関数
 * @property {StyleProp<ViewStyle>} [style] - React Nativeスタイルオブジェクト
 * @property {PostEmbedViewContext} [viewContext] - 表示コンテキスト
 * @property {boolean} [isWithinQuote] - 引用投稿内に表示されているか
 * @property {boolean} [allowNestedQuotes] - ネストされた引用を許可するか
 */
export type CommonProps = {
  moderation?: ModerationDecision
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  viewContext?: PostEmbedViewContext
  isWithinQuote?: boolean
  allowNestedQuotes?: boolean
}

/**
 * 埋め込みコンポーネントのプロパティ型
 *
 * CommonPropsを継承し、AT Protocolの投稿ビューから埋め込みデータを受け取ります。
 *
 * Go言語の埋め込み（embedding）に似ていますが、TypeScriptでは交差型（&）で表現。
 *
 * @property {AppBskyFeedDefs.PostView['embed']} [embed] - 投稿の埋め込みデータ
 */
export type EmbedProps = CommonProps & {
  embed?: AppBskyFeedDefs.PostView['embed']
}
