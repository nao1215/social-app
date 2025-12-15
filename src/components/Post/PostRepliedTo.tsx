/**
 * 投稿返信先表示コンポーネント
 *
 * 投稿が他の投稿への返信である場合に、返信先の情報を表示するコンポーネントです。
 * 返信先のユーザー名やブロック状態などを適切に表示します。
 *
 * 主な機能:
 * - 返信先ユーザーの表示
 * - ブロックされた投稿への返信の表示
 * - 削除された投稿への返信の表示
 * - 自分への返信の特別表示
 * - プロフィールホバーカード統合
 *
 * Go言語との対比:
 * - 条件分岐: Goのif-else-ifチェーンと同じ
 * - typeof: Goの型アサーションに似た型チェック
 */

import {View} from 'react-native'
import {Trans} from '@lingui/macro'

// セッション情報取得フック（現在のユーザー情報）
import {useSession} from '#/state/session'
// ユーザー情報テキストコンポーネント
import {UserInfoText} from '#/view/com/util/UserInfoText'
// デザインシステム
import {atoms as a, useTheme} from '#/alf'
// 矢印アイコン
import {ArrowCornerDownRight_Stroke2_Corner2_Rounded as ArrowCornerDownRightIcon} from '#/components/icons/ArrowCornerDownRight'
// プロフィールホバーカード
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
// テキストコンポーネント
import {Text} from '#/components/Typography'
// Bluesky型定義
import type * as bsky from '#/types/bsky'

/**
 * 投稿返信先表示コンポーネント
 *
 * 投稿が返信の場合、返信先の情報を表示します。
 * 返信先の状態（通常/ブロック済み/削除済み/自分）に応じて
 * 適切なメッセージを表示します。
 *
 * @param {Object} props - コンポーネントプロパティ
 * @param {string | bsky.profile.AnyProfileView | undefined} props.parentAuthor - 返信先の作成者（DIDまたはプロフィール）
 * @param {boolean} [props.isParentBlocked] - 返信先がブロックされているか
 * @param {boolean} [props.isParentNotFound] - 返信先が見つからないか（削除済み）
 * @returns {JSX.Element | null} 返信先情報またはnull
 */
export function PostRepliedTo({
  parentAuthor,
  isParentBlocked,
  isParentNotFound,
}: {
  parentAuthor: string | bsky.profile.AnyProfileView | undefined
  isParentBlocked?: boolean
  isParentNotFound?: boolean
}) {
  // テーマ情報を取得
  const t = useTheme()
  // 現在のログインユーザー情報を取得
  const {currentAccount} = useSession()

  // テキストスタイルを定義（小さめ、グレー、行間詰め）
  const textStyle = [a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]

  // 表示するラベルテキストを決定（条件分岐）
  let label
  if (isParentBlocked) {
    // 返信先がブロックされている場合
    label = <Trans context="description">Replied to a blocked post</Trans>
  } else if (isParentNotFound) {
    // 返信先が見つからない（削除済み）場合
    label = <Trans context="description">Replied to a post</Trans>
  } else if (parentAuthor) {
    // 返信先の作成者のDIDを取得
    // typeof でparentAuthorが文字列かオブジェクトかを判定（Goの型アサーションに似た処理）
    const did =
      typeof parentAuthor === 'string' ? parentAuthor : parentAuthor.did
    // 自分への返信かどうかをチェック
    const isMe = currentAccount?.did === did

    if (isMe) {
      // 自分への返信の場合
      label = <Trans context="description">Replied to you</Trans>
    } else {
      // 他のユーザーへの返信の場合
      // プロフィールホバーカードで包んで表示
      label = (
        <Trans context="description">
          Replied to{' '}
          <ProfileHoverCard did={did}>
            {/* ユーザーの表示名を取得して表示 */}
            <UserInfoText did={did} attr="displayName" style={textStyle} />
          </ProfileHoverCard>
        </Trans>
      )
    }
  }

  // ラベルが存在しない場合はnullを返す（何も表示しない）
  if (!label) {
    // Should not happen.
    return null
  }

  return (
    <View style={[a.flex_row, a.align_center, a.pb_xs, a.gap_xs]}>
      {/* 返信を示す矢印アイコン */}
      <ArrowCornerDownRightIcon
        size="xs"
        style={[t.atoms.text_contrast_medium, {top: -1}]} // -1pxで微調整
      />
      {/* 返信先情報テキスト */}
      <Text style={textStyle}>{label}</Text>
    </View>
  )
}
