/**
 * @fileoverview E2Eテストコントロールモジュール
 *
 * このモジュールは、Maestro E2Eテストを高速化するためのテストコントロールUI。
 * テストシミュレーター用ビルドにのみ含まれ、ログイン、ナビゲーション、
 * モーダル表示などの操作をプログラマブルに実行できる。
 *
 * 主な機能:
 * - テストアカウント（alice.test, bob.test）への自動ログイン
 * - プロキシヘッダー設定（テスト環境の切り替え）
 * - 画面遷移のショートカット（ホーム、設定、モデレーションなど）
 * - クエリキャッシュの無効化（リフレッシュテスト用）
 * - モーダル表示のトリガー
 * - オンボーディングフローの開始
 *
 * @note 本番ビルドには含まれない（TestCtrls.e2e.tsx がスタブとして使用される）
 *
 * @note Goユーザー向け補足:
 * - useStateはReactの状態管理フック（コンポーネントの内部状態を保持）
 * - JSXは関数が返すUI記述（HTMLライクな構文だがJavaScript）
 * - constはGoのconstに似ているが、ブロックスコープの不変変数
 */

// Reactの基本フック（状態管理用）
import {useState} from 'react'
// React Nativeの基本UIコンポーネント（Goには直接対応するものはない）
import {LogBox, Pressable, View, TextInput} from 'react-native'
// TanStack Queryのクエリクライアント（キャッシュ管理用）
import {useQueryClient} from '@tanstack/react-query'

// Blueskyプロキシヘッダー定数（テスト環境切り替え用）
import {BLUESKY_PROXY_HEADER} from '#/lib/constants'
// モーダル制御フック（モーダルの開閉を管理）
import {useModalControls} from '#/state/modals'
// セッションAPI、エージェントフック（認証・API通信管理）
import {useSessionApi, useAgent} from '#/state/session'
// ログアウト画面制御フック
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
// オンボーディングディスパッチフック（初回ユーザー体験の管理）
import {useOnboardingDispatch} from '#/state/shell/onboarding'
// ナビゲーション関数（画面遷移用）
import {navigate} from '../../../Navigation'

// React Nativeの警告ログを全て無視（テスト環境では不要）
// @note Goユーザー向け: LogBox.ignoreAllLogsはGoのlog.SetOutputに似た機能
LogBox.ignoreAllLogs()

/**
 * E2Eテストコントロールコンポーネント
 *
 * テストシミュレーター用のコントロールパネルを提供する。
 * 画面右上に1x1ピクセルの不可視ボタンを配置し、testIDで識別可能にする。
 *
 * @returns テストコントロールUI（不可視のボタンとテキスト入力）
 *
 * @note このユーティリティコンポーネントはテストシミュレータービルドにのみ含まれる。
 * テストのペースを劇的に向上させるためのクイックトリガーを提供する。
 *
 * @note Goユーザー向け補足:
 * - この関数コンポーネントはGoの関数に似ているが、JSXを返しUIをレンダリングする
 * - useで始まるフックはコンポーネント内でのみ呼び出し可能（Reactのルール）
 */

// ボタンスタイル定数（1x1ピクセルの赤い点 - テスト用に不可視だが存在確認可能）
// @note Goユーザー向け: オブジェクトリテラルはGoの構造体リテラルに似ている
const BTN = {height: 1, width: 1, backgroundColor: 'red'}

export function TestCtrls() {
  // AT Protocol エージェント（API通信クライアント）
  const agent = useAgent()
  // TanStack Query クエリクライアント（キャッシュ管理）
  const queryClient = useQueryClient()
  // セッションAPI（ログイン・ログアウト操作）
  const {logoutEveryAccount, login} = useSessionApi()
  // モーダル制御（モーダルの開閉）
  const {openModal} = useModalControls()
  // オンボーディングディスパッチ（初回体験フローの制御）
  const onboardingDispatch = useOnboardingDispatch()
  // ログアウト画面表示制御
  const {setShowLoggedOut} = useLoggedOutViewControls()

  /**
   * Aliceアカウントでログインするハンドラー
   *
   * テストアカウント alice.test でローカルホストにログインし、
   * ログアウト画面を非表示にする。
   *
   * @note Goユーザー向け: async/awaitはGoのgoroutine + channelに似た非同期処理
   */
  const onPressSignInAlice = async () => {
    await login(
      {
        service: 'http://localhost:3000', // テスト用PDSサーバー
        identifier: 'alice.test', // テストアカウント識別子
        password: 'hunter2', // テストパスワード
      },
      'LoginForm', // ログイン元の識別子（分析用）
    )
    setShowLoggedOut(false) // ログアウト画面を非表示
  }

  /**
   * Bobアカウントでログインするハンドラー
   *
   * テストアカウント bob.test でローカルホストにログインし、
   * ログアウト画面を非表示にする。
   */
  const onPressSignInBob = async () => {
    await login(
      {
        service: 'http://localhost:3000', // テスト用PDSサーバー
        identifier: 'bob.test', // テストアカウント識別子
        password: 'hunter2', // テストパスワード
      },
      'LoginForm',
    )
    setShowLoggedOut(false)
  }

  // プロキシヘッダー状態（テスト環境切り替え用）
  // @note Goユーザー向け: useStateは[値, 更新関数]のペアを返す
  const [proxyHeader, setProxyHeader] = useState('')

  // テストコントロールUIのレンダリング
  // @note Goユーザー向け: JSXはHTMLライクだがJavaScript式が埋め込める
  return (
    <View style={{position: 'absolute', top: 100, right: 0, zIndex: 100}}>
      {/* プロキシヘッダー入力フィールド（テスト環境切り替え用） */}
      <TextInput
        testID="e2eProxyHeaderInput"
        onChangeText={val => setProxyHeader(val as any)}
        onSubmitEditing={() => {
          // プロキシヘッダーを設定（Appview識別子を追加）
          const header = `${proxyHeader}#bsky_appview`
          BLUESKY_PROXY_HEADER.set(header)
          agent.configureProxy(header as any)
        }}
        style={BTN}
      />
      {/* Aliceでログインボタン */}
      <Pressable
        testID="e2eSignInAlice"
        onPress={onPressSignInAlice}
        accessibilityRole="button"
        style={BTN}
      />
      {/* Bobでログインボタン */}
      <Pressable
        testID="e2eSignInBob"
        onPress={onPressSignInBob}
        accessibilityRole="button"
        style={BTN}
      />
      {/* ログアウトボタン */}
      <Pressable
        testID="e2eSignOut"
        onPress={() => logoutEveryAccount('Settings')}
        accessibilityRole="button"
        style={BTN}
      />
      {/* ホーム画面へ遷移ボタン */}
      <Pressable
        testID="e2eGotoHome"
        onPress={() => navigate('Home')}
        accessibilityRole="button"
        style={BTN}
      />
      {/* 設定画面へ遷移ボタン */}
      <Pressable
        testID="e2eGotoSettings"
        onPress={() => navigate('Settings')}
        accessibilityRole="button"
        style={BTN}
      />
      {/* モデレーション画面へ遷移ボタン */}
      <Pressable
        testID="e2eGotoModeration"
        onPress={() => navigate('Moderation')}
        accessibilityRole="button"
        style={BTN}
      />
      {/* リスト画面へ遷移ボタン */}
      <Pressable
        testID="e2eGotoLists"
        onPress={() => navigate('Lists')}
        accessibilityRole="button"
        style={BTN}
      />
      {/* フィード画面へ遷移ボタン */}
      <Pressable
        testID="e2eGotoFeeds"
        onPress={() => navigate('Feeds')}
        accessibilityRole="button"
        style={BTN}
      />
      {/* デバッグ画面（Storybook）へ遷移ボタン */}
      <Pressable
        testID="storybookBtn"
        onPress={() => navigate('Debug')}
        accessibilityRole="button"
        style={BTN}
      />
      {/* ホームフィードリフレッシュボタン（キャッシュ無効化） */}
      <Pressable
        testID="e2eRefreshHome"
        onPress={() => queryClient.invalidateQueries({queryKey: ['post-feed']})}
        accessibilityRole="button"
        style={BTN}
      />
      {/* 招待コードモーダル表示ボタン */}
      <Pressable
        testID="e2eOpenInviteCodesModal"
        onPress={() => openModal({name: 'invite-codes'})}
        accessibilityRole="button"
        style={BTN}
      />
      {/* ログアウト画面表示ボタン */}
      <Pressable
        testID="e2eOpenLoggedOutView"
        onPress={() => setShowLoggedOut(true)}
        accessibilityRole="button"
        style={BTN}
      />
      {/* オンボーディング開始ボタン */}
      <Pressable
        testID="e2eStartOnboarding"
        onPress={() => {
          onboardingDispatch({type: 'start'})
        }}
        accessibilityRole="button"
        style={BTN}
      />
      {/* TODO: 実験終了時にこのコントロール全体を削除 */}
      {/* ロングボーディング開始ボタン（実験的機能） */}
      <Pressable
        testID="e2eStartLongboarding"
        onPress={() => {
          onboardingDispatch({type: 'start'})
        }}
        accessibilityRole="button"
        style={BTN}
      />
    </View>
  )
}
