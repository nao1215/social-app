/**
 * @file util.ts
 * @description ダイレクトメッセージ関連のユーティリティ関数集
 *
 * このファイルは、ダイレクトメッセージ機能で使用される汎用的なヘルパー関数を提供します。
 * メッセージ送信可否の判定、日付フォーマット、絵文字リアクションの制限チェックなどを含みます。
 *
 * ◆ Go開発者向けの注意点:
 * - このファイルは純粋な関数のみを提供（副作用なし）
 * - Goのユーティリティパッケージ（utils/helpers）に相当
 * - 全ての関数はエクスポート可能で、他のモジュールから再利用可能
 */

// AT Protocolの型定義 - チャットメッセージスキーマ
import {type ChatBskyConvoDefs} from '@atproto/api'

// 絵文字リアクションの上限数（定数定義）
import {EMOJI_REACTION_LIMIT} from '#/lib/constants'
// Blueskyプロファイル型定義
import type * as bsky from '#/types/bsky'

/**
 * canBeMessaged - ユーザーにメッセージを送信可能か判定
 *
 * @description
 * プロファイル情報に基づいて、該当ユーザーにダイレクトメッセージを送信可能かを判定します。
 * ユーザーのメッセージ受信設定（allowIncoming）とフォロー状態を確認します。
 *
 * ◆ Goでの類似パターン:
 * ```go
 * func CanBeMessaged(profile *bsky.ProfileView) bool {
 *     switch profile.Associated.Chat.AllowIncoming {
 *     case "none":
 *         return false
 *     case "all":
 *         return true
 *     // ...
 *     }
 * }
 * ```
 *
 * @param {bsky.profile.AnyProfileView} profile - チェック対象のユーザープロファイル
 * @returns {boolean} メッセージ送信可能な場合はtrue、不可の場合はfalse
 *
 * ◆ 判定ロジック:
 * - 'none': 誰からもメッセージを受け付けない → false
 * - 'all': 全員からメッセージを受け付ける → true
 * - 'following' (またはundefined): フォロワーのみからメッセージを受け付ける
 *   → viewer.followedBy が true の場合のみ true
 * - その他の値: 不正な値として安全のため false
 */
export function canBeMessaged(profile: bsky.profile.AnyProfileView) {
  /**
   * ◆ オプショナルチェイニング演算子（?.）:
   * - Goでは nil チェックを明示的に行う必要がある
   * - JavaScriptでは ?. でnull/undefinedを安全にチェック
   * - profile.associated?.chat?.allowIncoming は以下と同等:
   *   if (profile.associated && profile.associated.chat) {
   *     return profile.associated.chat.allowIncoming
   *   }
   */
  switch (profile.associated?.chat?.allowIncoming) {
    case 'none':
      // 誰からもメッセージを受け付けない
      return false
    case 'all':
      // 全員からメッセージを受け付ける
      return true
    // if unset, treat as following
    // 設定されていない場合はfollowingとして扱う
    case 'following':
    case undefined:
      /**
       * ◆ Boolean型への変換:
       * - Goでは明示的な型変換が必要: if followedBy { return true }
       * - JavaScriptでは Boolean() またはダブル否定（!!）で真偽値に変換
       * - profile.viewer?.followedBy が undefined/null の場合は false
       */
      return Boolean(profile.viewer?.followedBy)
    // any other values are invalid according to the lexicon, so
    // let's treat as false to be safe
    // レキシコン（スキーマ定義）に従っていないその他の値は、
    // 安全のため false として扱う
    default:
      return false
  }
}

/**
 * localDateString - ローカルタイムゾーンでの日付文字列を生成
 *
 * @description
 * 日付オブジェクトをローカルタイムゾーンの日付文字列（YYYY-MM-DD形式）に変換します。
 * メッセージの日付区切り表示などで使用されます。
 *
 * ◆ Goでの類似実装:
 * ```go
 * func LocalDateString(date time.Time) string {
 *     return fmt.Sprintf("%d-%d-%d", date.Year(), date.Month(), date.Day())
 * }
 * ```
 *
 * @param {Date} date - 変換する日付オブジェクト
 * @returns {string} YYYY-MM-DD形式の日付文字列（例: "2025-9-7"）
 *
 * ◆ 注意点:
 * - toISOString()は使用しない（UTCタイムゾーンになるため）
 * - ゼロパディングは行わない（比較用途のみで使用されるため）
 */
export function localDateString(date: Date) {
  // can't use toISOString because it should be in local time
  // toISOString()は使えない（ローカルタイムである必要があるため）

  // getMonth()は0始まり（0=1月, 1=2月, ...）
  const mm = date.getMonth()
  // getDate()は1始まり（1-31）
  const dd = date.getDate()
  // getFullYear()は4桁の年（例: 2025）
  const yyyy = date.getFullYear()

  // not padding with 0s because it's not necessary, it's just used for comparison
  // ゼロパディングは不要（比較にのみ使用されるため）
  // 例: "2025-8-7" （08や07ではない）
  return `${yyyy}-${mm}-${dd}`
}

/**
 * hasAlreadyReacted - 特定の絵文字で既にリアクション済みか判定
 *
 * @description
 * 指定されたメッセージに対して、現在のユーザーが特定の絵文字で
 * 既にリアクションしているかを確認します。
 *
 * ◆ Goでの類似実装:
 * ```go
 * func HasAlreadyReacted(message *Message, myDID string, emoji string) bool {
 *     if message.Reactions == nil {
 *         return false
 *     }
 *     for _, reaction := range message.Reactions {
 *         if reaction.Value == emoji && reaction.Sender.DID == myDID {
 *             return true
 *         }
 *     }
 *     return false
 * }
 * ```
 *
 * @param {ChatBskyConvoDefs.MessageView} message - チェック対象のメッセージ
 * @param {string | undefined} myDid - 現在のユーザーのDID（分散型識別子）
 * @param {string} emoji - チェックする絵文字（例: "👍", "❤️"）
 * @returns {boolean} 既にリアクション済みの場合はtrue
 *
 * ◆ 処理フロー:
 * 1. メッセージにリアクションが存在しない → false
 * 2. リアクション配列を検索
 * 3. 同じ絵文字 && 送信者が自分 のリアクションが見つかった → true
 */
export function hasAlreadyReacted(
  message: ChatBskyConvoDefs.MessageView,
  myDid: string | undefined,
  emoji: string,
): boolean {
  // リアクションが存在しない場合は即座にfalseを返す
  if (!message.reactions) {
    return false
  }

  /**
   * ◆ Array.prototype.find() - 配列から条件に一致する要素を検索
   *
   * Goでの類似パターン:
   * ```go
   * var found *Reaction
   * for _, r := range reactions {
   *     if r.Value == emoji && r.Sender.DID == myDID {
   *         found = r
   *         break
   *     }
   * }
   * return found != nil
   * ```
   *
   * - find()は最初に一致した要素を返す（一致しない場合はundefined）
   * - !!をつけることでboolean型に変換（undefined → false, オブジェクト → true）
   */
  return !!message.reactions.find(
    reaction => reaction.value === emoji && reaction.sender.did === myDid,
  )
}

/**
 * hasReachedReactionLimit - 絵文字リアクションの上限に達しているか判定
 *
 * @description
 * 指定されたメッセージに対して、現在のユーザーが追加できる
 * 絵文字リアクションの上限に達しているかを確認します。
 * スパム防止のため、1メッセージあたりのリアクション数に制限があります。
 *
 * ◆ Goでの類似実装:
 * ```go
 * func HasReachedReactionLimit(message *Message, myDID string) bool {
 *     if message.Reactions == nil {
 *         return false
 *     }
 *     count := 0
 *     for _, reaction := range message.Reactions {
 *         if reaction.Sender.DID == myDID {
 *             count++
 *         }
 *     }
 *     return count >= EMOJI_REACTION_LIMIT
 * }
 * ```
 *
 * @param {ChatBskyConvoDefs.MessageView} message - チェック対象のメッセージ
 * @param {string | undefined} myDid - 現在のユーザーのDID
 * @returns {boolean} 上限に達している場合はtrue
 *
 * ◆ 制限の目的:
 * - スパム防止
 * - UI/UXの品質維持（大量の絵文字で画面が埋まるのを防ぐ）
 * - バックエンドのリソース保護
 */
export function hasReachedReactionLimit(
  message: ChatBskyConvoDefs.MessageView,
  myDid: string | undefined,
): boolean {
  // リアクションが存在しない場合は上限に達していない
  if (!message.reactions) {
    return false
  }

  /**
   * ◆ Array.prototype.filter() - 配列から条件に一致する要素をフィルタリング
   *
   * Goでの類似パターン:
   * ```go
   * myReactions := make([]*Reaction, 0)
   * for _, reaction := range message.Reactions {
   *     if reaction.Sender.DID == myDID {
   *         myReactions = append(myReactions, reaction)
   *     }
   * }
   * ```
   *
   * - filter()は条件に一致する全ての要素を含む新しい配列を返す
   * - 元の配列は変更されない（イミュータブル）
   */
  const myReactions = message.reactions.filter(
    reaction => reaction.sender.did === myDid,
  )

  // 自分のリアクション数が上限以上かチェック
  return myReactions.length >= EMOJI_REACTION_LIMIT
}
