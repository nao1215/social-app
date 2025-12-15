/**
 * @file ModerationModlists.tsx - モデレーションリスト管理画面
 * @description ユーザーが作成・管理するモデレーションリスト（ミュート/ブロック用リスト）の一覧画面
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: UIを返す関数（Goのhttp.HandlerFuncに相当）
 * - useFocusEffect: 画面フォーカス時のライフサイクル処理（Goのmiddlewareに類似）
 * - useNavigation: ナビゲーション操作フック（Goのhttp.Redirectに相当）
 * - useModalControls: モーダルダイアログの表示/非表示制御
 * - AT Protocol URI: at://did/collection/rkey 形式の分散識別子
 *
 * ## 主な機能
 * - ユーザーが作成したモデレーションリストの一覧表示
 * - 新しいモデレーションリストの作成（メール認証必須）
 * - リスト詳細画面への遷移
 * - リストの編集・削除（MyLists コンポーネント経由）
 *
 * ## アーキテクチャ
 * - MyLists コンポーネント: filter="mod" でモデレーション用リストのみ表示
 * - メール認証ラッパー: リスト作成前にメール認証を要求（スパム対策）
 * - モーダル経由の作成フロー: create-or-edit-list モーダルで作成UI表示
 *
 * ## モデレーションリストの用途
 * - ミュートリスト: 一括でユーザーをミュート（フィードと通知から除外）
 * - ブロックリスト: 一括でユーザーをブロック（相互にコンテンツ非表示）
 * - 目的コード: app.bsky.graph.defs#modlist
 *
 * @module view/screens/ModerationModlists
 */

// Reactコアライブラリ
import React from 'react'
// AT Protocol URI解析クラス（at://形式のURIを操作）
import {AtUri} from '@atproto/api'
// 国際化ライブラリ（msg: 翻訳キー、Trans: コンポーネント形式の翻訳）
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// React Navigationフック（フォーカス時処理、ナビゲーション操作）
import {useFocusEffect, useNavigation} from '@react-navigation/native'

// メール認証を要求するラッパーフック（スパム対策）
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
// ナビゲーション型定義
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
// モーダルコントロール（ダイアログの表示/非表示）
import {useModalControls} from '#/state/modals'
// シェルモード設定（ヘッダー/フッター表示制御）
import {useSetMinimalShellMode} from '#/state/shell'
// 自分のリスト一覧コンポーネント
import {MyLists} from '#/view/com/lists/MyLists'
// デザインシステム（atoms: スタイルプリミティブ）
import {atoms as a} from '#/alf'
// ボタンコンポーネント群
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// プラスアイコン
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
// レイアウトコンポーネント群
import * as Layout from '#/components/Layout'

// 画面プロパティ型定義（React Navigation のルートパラメータ）
type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>

/**
 * ModerationModlistsScreen - モデレーションリスト管理画面
 *
 * Goでの例:
 * func ModListsHandler(w http.ResponseWriter, r *http.Request) {
 *   user := auth.GetUser(r.Context())
 *   lists := listService.GetMyModLists(ctx, user.DID)
 *   render(w, "mod_lists.html", lists)
 * }
 *
 * 機能:
 * 1. モデレーションリスト一覧表示（MyLists filter="mod"）
 * 2. 新規リスト作成ボタン（メール認証必須）
 * 3. リスト作成後、詳細画面へ自動遷移
 */
export function ModerationModlistsScreen({}: Props) {
  // 国際化フック（翻訳関数 _ を取得）
  const {_} = useLingui()
  // シェルモード設定関数（ヘッダー/フッター表示制御）
  const setMinimalShellMode = useSetMinimalShellMode()
  // ナビゲーション操作フック
  const navigation = useNavigation<NavigationProp>()
  // モーダル操作フック（ダイアログの表示）
  const {openModal} = useModalControls()
  // メール認証を要求するラッパー関数を取得
  const requireEmailVerification = useRequireEmailVerification()

  /**
   * 画面フォーカス時の副作用処理
   * ミニマルシェルモードを無効化（ヘッダー・タブバーを表示）
   */
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  /**
   * 新規リスト作成ボタンのハンドラ
   *
   * Goでの例:
   * func handleCreateList(w http.ResponseWriter, r *http.Request) {
   *   list := listService.Create(ctx, "modlist")
   *   http.Redirect(w, r, "/list/"+list.Rkey, http.StatusFound)
   * }
   *
   * 処理フロー:
   * 1. create-or-edit-list モーダルを開く
   * 2. purpose を 'app.bsky.graph.defs#modlist' に設定
   * 3. 保存成功時、作成されたリストの詳細画面へ遷移
   */
  const onPressNewList = React.useCallback(() => {
    openModal({
      name: 'create-or-edit-list',
      // モデレーションリストの目的コード
      purpose: 'app.bsky.graph.defs#modlist',
      // 保存成功時のコールバック: 作成されたリストの詳細画面へ遷移
      onSave: (uri: string) => {
        try {
          // AT Protocol URIを解析してホスト名（DID）とrkeyを取得
          const urip = new AtUri(uri)
          // ProfileList画面へ遷移
          navigation.navigate('ProfileList', {
            name: urip.hostname,
            rkey: urip.rkey,
          })
        } catch {}
      },
    })
  }, [openModal, navigation])

  /**
   * メール認証を要求するラッパー
   *
   * メール未認証の場合:
   * 1. 認証ダイアログを表示
   * 2. 認証完了後に元の処理を実行
   *
   * スパム対策として、リスト作成にはメール認証を必須にしている
   */
  const wrappedOnPressNewList = requireEmailVerification(onPressNewList, {
    instructions: [
      <Trans key="modlist">
        Before creating a list, you must first verify your email.
      </Trans>,
    ],
  })

  return (
    <Layout.Screen testID="moderationModlistsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Moderation Lists</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Button
          label={_(msg`New list`)}
          testID="newModListBtn"
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
      <MyLists filter="mod" style={a.flex_grow} />
    </Layout.Screen>
  )
}
