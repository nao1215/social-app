/**
 * メッセージ設定画面モジュール
 *
 * 【概要】
 * - チャット機能の詳細設定画面
 * - メッセージ受信許可設定（全員/フォロー中/なし）
 * - 通知音の有効/無効切り替え（ネイティブのみ）
 *
 * 【主な機能】
 * - メッセージ受信許可レベルの設定
 * - アクター宣言（Actor Declaration）の更新
 * - 通知音設定の永続化
 * - エラーハンドリングとトースト通知
 *
 * 【Go開発者向け補足】
 * - type: Goのtype aliasに相当、型に別名を付ける
 * - useCallback: メモ化された関数、Goのクロージャに類似だが最適化済み
 * - Toast: UI通知システム、エラーや成功メッセージの表示
 */

// React関連のインポート - useCallbackフック（関数のメモ化用）
import {useCallback} from 'react'
// ネイティブコンポーネント - プラットフォーム固有のView要素
import {View} from 'react-native'
// 国際化 - メッセージとトランスコンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// ナビゲーション型定義 - 画面プロパティの型安全性
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

// ルート型定義 - 共通ナビゲーターのパラメータ
import {type CommonNavigatorParams} from '#/lib/routes/types'
// プラットフォーム検出 - iOS/Android判定
import {isNative} from '#/platform/detection'
// アクター宣言更新 - メッセージ受信設定のAPI
import {useUpdateActorDeclaration} from '#/state/queries/messages/actor-declaration'
// プロフィールクエリ - ユーザープロフィールデータ取得
import {useProfileQuery} from '#/state/queries/profile'
// セッション - 現在ログイン中のアカウント情報
import {useSession} from '#/state/session'
// トースト通知 - UI通知システム
import * as Toast from '#/view/com/util/Toast'
// スタイリング - CSSアトム
import {atoms as a} from '#/alf'
// アドモニション - 情報表示用の注意書きコンポーネント
import {Admonition} from '#/components/Admonition'
// ディバイダー - 視覚的な区切り線
import {Divider} from '#/components/Divider'
// トグルコンポーネント - ラジオボタン/チェックボックスUI
import * as Toggle from '#/components/forms/Toggle'
// レイアウトコンポーネント - 画面構造とヘッダー
import * as Layout from '#/components/Layout'
// テキストコンポーネント - タイポグラフィ
import {Text} from '#/components/Typography'
// バックグラウンド通知設定 - 通知音などの永続化設定
import {useBackgroundNotificationPreferences} from '../../../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'

/**
 * メッセージ受信許可レベル型定義（Goのtype aliasに相当）
 *
 * 【レベル説明】
 * - 'all': 全ユーザーからのメッセージを許可
 * - 'none': 誰からもメッセージを受信しない
 * - 'following': フォロー中のユーザーのみ許可
 */
type AllowIncoming = 'all' | 'none' | 'following'

/**
 * プロパティ型定義（Goのstructに相当）
 * ナビゲーションスタックから渡されるプロパティ
 */
type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesSettings'>

/**
 * メッセージ設定画面コンポーネント（外側）
 *
 * 【機能】
 * - 内部コンポーネントのラッパー
 * - プロパティの受け渡し
 *
 * @param props - ナビゲーションプロパティ
 * @returns JSX要素 - 設定画面
 */
export function MessagesSettingsScreen(props: Props) {
  return <MessagesSettingsScreenInner {...props} />
}

/**
 * メッセージ設定画面コンポーネント（内部）
 *
 * 【機能】
 * - メッセージ受信許可設定のUI表示と更新
 * - 通知音設定の切り替え（ネイティブのみ）
 * - アクター宣言の更新とエラーハンドリング
 *
 * 【Go開発者向け補足】
 * - useProfileQuery: APIからデータ取得、Goのhttp.Getに類似だがキャッシュ付き
 * - useUpdateActorDeclaration: ミューテーション、Goのhttp.Postに相当
 * - onError: エラーハンドリングコールバック、Goのerrorチェックに類似
 *
 * @param props - ナビゲーションプロパティ（未使用）
 * @returns JSX要素 - 設定画面UI
 */
export function MessagesSettingsScreenInner({}: Props) {
  // 国際化フック - UI文字列の翻訳取得
  const {_} = useLingui()
  // セッション - 現在のアカウント情報取得
  const {currentAccount} = useSession()
  // プロフィールクエリ - ユーザープロフィールとチャット設定を取得
  const {data: profile} = useProfileQuery({
    did: currentAccount!.did,
  })
  // 通知設定 - バックグラウンド通知の永続化設定
  const {preferences, setPref} = useBackgroundNotificationPreferences()

  // アクター宣言更新ミューテーション - メッセージ受信許可の変更
  // エラー時にトースト通知を表示
  const {mutate: updateDeclaration} = useUpdateActorDeclaration({
    onError: () => {
      Toast.show(_(msg`Failed to update settings`), 'xmark')
    },
  })

  /**
   * メッセージ受信許可変更ハンドラー
   *
   * 【処理内容】
   * - ラジオボタン選択時にアクター宣言を更新
   * - 選択値（all/following/none）をサーバーに送信
   *
   * @param keys - 選択されたキーの配列（単一選択なので配列の最初の要素を使用）
   */
  const onSelectMessagesFrom = useCallback(
    (keys: string[]) => {
      const key = keys[0]
      // キーが存在しない場合は何もしない
      if (!key) return
      // 型アサーションで AllowIncoming 型に変換してAPIを呼び出し
      updateDeclaration(key as AllowIncoming)
    },
    [updateDeclaration],
  )

  /**
   * 通知音設定変更ハンドラー
   *
   * 【処理内容】
   * - 通知音のオン/オフを切り替え
   * - 設定をローカルストレージに永続化
   *
   * @param keys - 選択されたキーの配列（enabled/disabled）
   */
  const onSelectSoundSetting = useCallback(
    (keys: string[]) => {
      const key = keys[0]
      // キーが存在しない場合は何もしない
      if (!key) return
      // 'enabled'の場合はtrue、それ以外はfalseを設定
      setPref('playSoundChat', key === 'enabled')
    },
    [setPref],
  )

  return (
    <Layout.Screen testID="messagesSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Chat Settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.p_lg, a.gap_md]}>
          <Text style={[a.text_lg, a.font_bold]}>
            <Trans>Allow new messages from</Trans>
          </Text>
          <Toggle.Group
            label={_(msg`Allow new messages from`)}
            type="radio"
            values={[
              (profile?.associated?.chat?.allowIncoming as AllowIncoming) ??
                'following',
            ]}
            onChange={onSelectMessagesFrom}>
            <View>
              <Toggle.Item
                name="all"
                label={_(msg`Everyone`)}
                style={[a.justify_between, a.py_sm]}>
                <Toggle.LabelText>
                  <Trans>Everyone</Trans>
                </Toggle.LabelText>
                <Toggle.Radio />
              </Toggle.Item>
              <Toggle.Item
                name="following"
                label={_(msg`Users I follow`)}
                style={[a.justify_between, a.py_sm]}>
                <Toggle.LabelText>
                  <Trans>Users I follow</Trans>
                </Toggle.LabelText>
                <Toggle.Radio />
              </Toggle.Item>
              <Toggle.Item
                name="none"
                label={_(msg`No one`)}
                style={[a.justify_between, a.py_sm]}>
                <Toggle.LabelText>
                  <Trans>No one</Trans>
                </Toggle.LabelText>
                <Toggle.Radio />
              </Toggle.Item>
            </View>
          </Toggle.Group>
          <Admonition type="tip">
            <Trans>
              You can continue ongoing conversations regardless of which setting
              you choose.
            </Trans>
          </Admonition>
          {isNative && (
            <>
              <Divider style={a.my_md} />
              <Text style={[a.text_lg, a.font_bold]}>
                <Trans>Notification Sounds</Trans>
              </Text>
              <Toggle.Group
                label={_(msg`Notification sounds`)}
                type="radio"
                values={[preferences.playSoundChat ? 'enabled' : 'disabled']}
                onChange={onSelectSoundSetting}>
                <View>
                  <Toggle.Item
                    name="enabled"
                    label={_(msg`Enabled`)}
                    style={[a.justify_between, a.py_sm]}>
                    <Toggle.LabelText>
                      <Trans>Enabled</Trans>
                    </Toggle.LabelText>
                    <Toggle.Radio />
                  </Toggle.Item>
                  <Toggle.Item
                    name="disabled"
                    label={_(msg`Disabled`)}
                    style={[a.justify_between, a.py_sm]}>
                    <Toggle.LabelText>
                      <Trans>Disabled</Trans>
                    </Toggle.LabelText>
                    <Toggle.Radio />
                  </Toggle.Item>
                </View>
              </Toggle.Group>
            </>
          )}
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
