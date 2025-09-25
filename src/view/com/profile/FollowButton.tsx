import {type StyleProp, type TextStyle, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type Shadow} from '#/state/cache/types'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import type * as bsky from '#/types/bsky'
import {Button, type ButtonType} from '../util/forms/Button'
import * as Toast from '../util/Toast'

/**
 * FollowButton - フォロー・アンフォローボタンコンポーネント
 *
 * 【主な機能】
 * - ユーザーのフォロー・アンフォロー操作
 * - フォロー状態に応じたボタン表示切り替え
 * - 楽観的UI更新とエラーハンドリング
 * - カスタマイズ可能なボタンスタイル
 *
 * 【レガシー情報】
 * - プロフィール関連UIの重要コンポーネント
 * - 従来のButtonコンポーネント使用
 *
 * 【アーキテクチャ】
 * - useProfileFollowMutationQueueでの状態管理
 * - シャドウプロフィール対応
 * - ログコンテキストベースの分析追跡
 * - Toastによるエラー通知
 *
 * @param props - プロフィール、スタイル設定、ログ情報、コールバック
 * @returns JSX要素 - フォローボタン
 */
export function FollowButton({
  unfollowedType = 'inverted',
  followedType = 'default',
  profile,
  labelStyle,
  logContext,
  onFollow,
}: {
  unfollowedType?: ButtonType
  followedType?: ButtonType
  profile: Shadow<bsky.profile.AnyProfileView>
  labelStyle?: StyleProp<TextStyle>
  logContext: 'ProfileCard' | 'StarterPackProfilesList'
  onFollow?: () => void
}) {
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
  )
  const {_} = useLingui()

  const onPressFollow = async () => {
    try {
      await queueFollow()
      onFollow?.()
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
      }
    }
  }

  const onPressUnfollow = async () => {
    try {
      await queueUnfollow()
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
      }
    }
  }

  if (!profile.viewer) {
    return <View />
  }

  if (profile.viewer.following) {
    return (
      <Button
        type={followedType}
        labelStyle={labelStyle}
        onPress={onPressUnfollow}
        label={_(msg({message: 'Unfollow', context: 'action'}))}
      />
    )
  } else if (!profile.viewer.followedBy) {
    return (
      <Button
        type={unfollowedType}
        labelStyle={labelStyle}
        onPress={onPressFollow}
        label={_(msg({message: 'Follow', context: 'action'}))}
      />
    )
  } else {
    return (
      <Button
        type={unfollowedType}
        labelStyle={labelStyle}
        onPress={onPressFollow}
        label={_(msg({message: 'Follow back', context: 'action'}))}
      />
    )
  }
}
