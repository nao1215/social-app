/**
 * @fileoverview レポートダイアログ型定義
 *
 * レポート（通報）機能で使用される型定義を提供。
 * 通報可能な対象（アカウント、投稿、リスト、フィード、チャットメッセージなど）の
 * 型定義と、それらを統一的に扱うための型を定義。
 *
 * @module components/moderation/ReportDialog/types
 */

// AT Protocol型定義とユーティリティ
// $Typed: 型アサーションヘルパー（$typeプロパティを持つ型を表現）
import {
  $Typed,
  AppBskyActorDefs,   // アクター（ユーザー）関連の型定義
  AppBskyFeedDefs,    // フィード関連の型定義
  AppBskyGraphDefs,   // グラフ（リスト、スターターパック）関連の型定義
  ChatBskyConvoDefs,  // チャット会話関連の型定義
} from '@atproto/api'

// ダイアログコンポーネントの型定義
import * as Dialog from '#/components/Dialog'

/**
 * レポート対象のUnion型
 *
 * TypeScript Union型メモ（Go開発者向け）:
 * - Union型（|）は「いずれかの型」を表現
 * - Go equivalent: interface{} で受け取り、型アサーションで判定
 *   例: switch v := subject.(type) { case ProfileView: ... }
 *
 * 対応する通報対象:
 * - ProfileViewBasic/ProfileView/ProfileViewDetailed: ユーザープロフィール
 * - ListView: ユーザーリスト
 * - GeneratorView: カスタムフィード
 * - StarterPackView: スターターパック
 * - PostView: 投稿
 * - {convoId, message}: チャットメッセージ（独自形式）
 *
 * $Typed<T>メモ:
 * - AT Protocolの型付きオブジェクトを表現
 * - $typeプロパティを持ち、オブジェクトの種類を識別可能
 */
export type ReportSubject =
  | $Typed<AppBskyActorDefs.ProfileViewBasic>
  | $Typed<AppBskyActorDefs.ProfileView>
  | $Typed<AppBskyActorDefs.ProfileViewDetailed>
  | $Typed<AppBskyGraphDefs.ListView>
  | $Typed<AppBskyFeedDefs.GeneratorView>
  | $Typed<AppBskyGraphDefs.StarterPackView>
  | $Typed<AppBskyFeedDefs.PostView>
  | {convoId: string; message: ChatBskyConvoDefs.MessageView}

/**
 * パース済みレポート対象のUnion型
 *
 * ReportSubjectから抽出した統一形式の型。
 * 各対象から必要な情報（URI、CID、DIDなど）を標準化して保持。
 *
 * 各型の説明:
 * - type: 対象の種類を識別する文字列リテラル型（Discriminated Union）
 * - uri: AT ProtocolのURI（一意識別子）
 * - cid: コンテンツID（Content Identifier、変更検出用）
 * - nsid: AT ProtocolのNamespaced ID（スキーマ識別子）
 * - did: 分散型識別子（Decentralized Identifier、ユーザーID）
 * - attributes: 投稿の属性（返信、画像、動画などのフラグ）
 *
 * Discriminated Unionメモ（Go開発者向け）:
 * - type フィールドで型を判別可能
 * - Go equivalent:
 *   type ParsedReportSubject interface { Type() string }
 *   type PostSubject struct { type string; uri string; ... }
 *   switch s.Type() { case "post": ... }
 */
export type ParsedReportSubject =
  | {
      type: 'post'
      uri: string
      cid: string
      nsid: string
      attributes: {
        reply: boolean   // 返信投稿かどうか
        image: boolean   // 画像を含むか
        video: boolean   // 動画を含むか
        link: boolean    // リンクを含むか
        quote: boolean   // 引用投稿か
      }
    }
  | {
      type: 'list'
      uri: string
      cid: string
      nsid: string
    }
  | {
      type: 'feed'
      uri: string
      cid: string
      nsid: string
    }
  | {
      type: 'starterPack'
      uri: string
      cid: string
      nsid: string
    }
  | {
      type: 'account'
      did: string      // アカウントはDIDのみで識別（URIやCIDは不要）
      nsid: string
    }
  | {
      type: 'chatMessage'
      convoId: string  // 会話ID
      message: ChatBskyConvoDefs.MessageView  // メッセージ全体のビュー
    }

/**
 * レポートダイアログのProps型
 *
 * React Propsパターンメモ（Go開発者向け）:
 * - Props: コンポーネントに渡される引数（構造体タグに相当）
 * - Go equivalent:
 *   type ReportDialogProps struct {
 *     Control DialogControl
 *     Subject ParsedReportSubject
 *   }
 *
 * @property control - ダイアログの開閉制御オブジェクト
 * @property subject - 通報対象の情報（パース済み）
 */
export type ReportDialogProps = {
  control: Dialog.DialogOuterProps['control'] // Dialogコンポーネントのcontrolプロパティの型を参照
  subject: ParsedReportSubject
}
