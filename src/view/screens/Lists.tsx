/**
 * @file Lists.tsx - リスト管理画面
 * @description ユーザーが作成したリスト（キュレーションリスト）の一覧表示と新規作成を行う画面
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: Goのhttp.HandlerFuncに相当するUIレンダリング関数
 * - モーダル管理: Zustand状態管理によるグローバルモーダル制御（GoのContext Managerに似た概念）
 * - AT Protocol URI: 分散型識別子のパース処理（GoのURL.Parseに相当）
 * - Email認証チェック: HOC（Higher-Order Component）パターンでラップ
 *
 * ## 主な機能
 * - ユーザー作成リストの一覧表示
 * - 新規リスト作成ボタン（Email認証必須）
 * - リスト作成後の自動遷移
 *
 * ## アーキテクチャ
 * - レイアウト: Layout.Screen + Layout.Header構成
 * - モーダル管理: create-or-edit-listモーダルを開く
 * - ナビゲーション: リスト作成後にProfileList画面へ遷移
 * - Email認証ガード: メール未認証ユーザーは作成不可（警告表示）
 *
 * @module view/screens/Lists
 */

// React本体: UIコンポーネントの基盤ライブラリ
import React from 'react'
// AT Protocol URI: AT ProtocolのURI解析ライブラリ（Goのurl.Parseに相当）
import {AtUri} from '@atproto/api'
// Lingui国際化: msg=翻訳キー、Trans=翻訳可能なテキストコンポーネント
import {msg, Trans} from '@lingui/macro'
// Lingui国際化フック: 現在のロケール情報と翻訳関数を提供
import {useLingui} from '@lingui/react'
// React Navigation: フォーカス副作用とナビゲーションフック
import {useFocusEffect, useNavigation} from '@react-navigation/native'

// カスタムフック: Email認証要求ラッパー（HOCパターン）
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
// 型定義: 画面コンポーネントのプロパティ型（React NavigationのNavigator設定）
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
// 型定義: ナビゲーションオブジェクトの型（型安全なルーティング）
import {type NavigationProp} from '#/lib/routes/types'
// モーダル管理: グローバルモーダル状態のコントロール（Zustand）
import {useModalControls} from '#/state/modals'
// シェル状態管理: ミニマルモード（ヘッダー表示制御）の設定フック
import {useSetMinimalShellMode} from '#/state/shell'
// マイリストコンポーネント: ユーザーのリスト一覧を表示
import {MyLists} from '#/view/com/lists/MyLists'
// デザインシステム: Alfアトミックスタイル
import {atoms as a} from '#/alf'
// ボタンコンポーネント: ボタン本体、アイコン、テキストの複合コンポーネント
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// アイコン: プラスアイコン（新規作成用）
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
// レイアウトコンポーネント: 画面全体のレイアウト構造
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Lists'>
export function ListsScreen({}: Props) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const navigation = useNavigation<NavigationProp>()
  const {openModal} = useModalControls()
  const requireEmailVerification = useRequireEmailVerification()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPressNewList = React.useCallback(() => {
    openModal({
      name: 'create-or-edit-list',
      purpose: 'app.bsky.graph.defs#curatelist',
      onSave: (uri: string) => {
        try {
          const urip = new AtUri(uri)
          navigation.navigate('ProfileList', {
            name: urip.hostname,
            rkey: urip.rkey,
          })
        } catch {}
      },
    })
  }, [openModal, navigation])

  const wrappedOnPressNewList = requireEmailVerification(onPressNewList, {
    instructions: [
      <Trans key="lists">
        Before creating a list, you must first verify your email.
      </Trans>,
    ],
  })

  return (
    <Layout.Screen testID="listsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Lists</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Button
          label={_(msg`New list`)}
          testID="newUserListBtn"
          color="secondary"
          variant="solid"
          size="small"
          onPress={wrappedOnPressNewList}>
          <ButtonIcon icon={PlusIcon} />
          <ButtonText>
            <Trans context="action">New</Trans>
          </ButtonText>
        </Button>
      </Layout.Header.Outer>
      <MyLists filter="curate" style={a.flex_grow} />
    </Layout.Screen>
  )
}
