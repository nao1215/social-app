import React from 'react'
import {View} from 'react-native'
import {TID} from '@atproto/common-web'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DISCOVER_SAVED_FEED, TIMELINE_SAVED_FEED} from '#/lib/constants'
import {useOverwriteSavedFeedsMutation} from '#/state/queries/preferences'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

/**
 * ホーム画面のフィードピン無し状態コンポーネント
 *
 * 【主な機能】
 * - フィードが一つもピン止めされていない場合のプレースホルダー表示
 * - デフォルトフィード（タイムライン＋ディスカバー）の自動セットアップ
 * - カスタムフィード追加への誘導UI
 * - フィードの初回利用促進
 *
 * 【状態管理】
 * - useOverwriteSavedFeedsMutation: 保存済みフィードリストの一括更新
 * - useHeaderOffset: ヘッダー高さに応じたレイアウト調整
 * - preferences: ユーザーの現在のフィード設定
 *
 * 【外部連携】
 * - ATプロトコルのフィード設定API
 * - デフォルトフィード定数（タイムライン、ディスカバー）
 * - フィード追加画面への遷移
 *
 * @param props.preferences - ユーザーの設定データ
 * @returns JSX要素 - フィード未設定時の案内UI
 */
export function NoFeedsPinned({
  preferences,
}: {
  preferences: UsePreferencesQueryResponse
}) {
  const {_} = useLingui()
  const headerOffset = useHeaderOffset()
  const {isPending, mutateAsync: overwriteSavedFeeds} =
    useOverwriteSavedFeedsMutation()

  /**
   * 推奨フィードの自動追加処理
   * - タイムラインとディスカバーフィードを自動設定
   * - 既存の同種フィードの重複を排除
   * - 新規ユーザーの初期設定を簡素化
   */
  const addRecommendedFeeds = React.useCallback(async () => {
    let skippedTimeline = false
    let skippedDiscover = false
    let remainingSavedFeeds = []

    // remove first instance of both timeline and discover, since we're going to overwrite them
    for (const savedFeed of preferences.savedFeeds) {
      if (savedFeed.type === 'timeline' && !skippedTimeline) {
        skippedTimeline = true
      } else if (
        savedFeed.value === DISCOVER_SAVED_FEED.value &&
        !skippedDiscover
      ) {
        skippedDiscover = true
      } else {
        remainingSavedFeeds.push(savedFeed)
      }
    }

    const toSave = [
      {
        ...DISCOVER_SAVED_FEED,
        pinned: true,
        id: TID.nextStr(),
      },
      {
        ...TIMELINE_SAVED_FEED,
        pinned: true,
        id: TID.nextStr(),
      },
      ...remainingSavedFeeds,
    ]

    await overwriteSavedFeeds(toSave)
  }, [overwriteSavedFeeds, preferences.savedFeeds])

  return (
    <CenteredView sideBorders style={[a.h_full_vh]}>
      <View
        style={[
          a.align_center,
          a.h_full_vh,
          a.py_3xl,
          a.px_xl,
          {
            paddingTop: headerOffset + a.py_3xl.paddingTop,
          },
        ]}>
        <View style={[a.align_center, a.gap_sm, a.pb_xl]}>
          <Text style={[a.text_xl, a.font_bold]}>
            <Trans>Whoops!</Trans>
          </Text>
          <Text
            style={[a.text_md, a.text_center, a.leading_snug, {maxWidth: 340}]}>
            <Trans>
              Looks like you unpinned all your feeds. But don't worry, you can
              add some below 😄
            </Trans>
          </Text>
        </View>

        <View style={[a.flex_row, a.gap_md, a.justify_center, a.flex_wrap]}>
          <Button
            disabled={isPending}
            label={_(msg`Apply default recommended feeds`)}
            size="large"
            variant="solid"
            color="primary"
            onPress={addRecommendedFeeds}>
            <ButtonIcon icon={Plus} position="left" />
            <ButtonText>{_(msg`Add recommended feeds`)}</ButtonText>
          </Button>

          <Link
            label={_(msg`Browse other feeds`)}
            to="/feeds"
            size="large"
            variant="solid"
            color="secondary">
            <ButtonIcon icon={ListSparkle} position="left" />
            <ButtonText>{_(msg`Browse other feeds`)}</ButtonText>
          </Link>
        </View>
      </View>
    </CenteredView>
  )
}
