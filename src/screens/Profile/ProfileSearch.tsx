/**
 * プロフィール検索画面コンポーネント
 *
 * 【Go開発者向け説明】
 * このモジュールは、特定ユーザーの投稿を検索する画面を提供します。
 * React Navigationの画面コンポーネントとして機能します。
 *
 * 【モジュールの役割】
 * - 特定ユーザーのプロフィール内の投稿検索
 * - DID解決とプロフィール情報の取得
 * - 検索プレースホルダーの動的生成
 * - 検索パラメータの固定設定（from: ユーザーハンドル）
 *
 * 【技術スタック】
 * - React Navigation: 画面遷移管理
 * - TanStack Query: データフェッチングと状態管理
 * - Lingui: 国際化対応
 *
 * 【使用例】
 * プロフィール画面から「投稿を検索」をタップすると、この画面が表示されます。
 * URLパラメータからユーザー名を受け取り、そのユーザーの投稿を検索できます。
 *
 * 【Goとの対応】
 * GoのHTTPハンドラに似ていますが、画面コンポーネントとして動作します。
 */

// React useMemoフック（値のメモ化）
// 【Go開発者向け】Goにはないパフォーマンス最適化機能
import {useMemo} from 'react'
// Lingui国際化ライブラリ（翻訳機能）
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// React Navigationの型定義（型安全なルーティング）
// 【Go開発者向け】GoのHTTPルーター型定義に相当
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
// プロフィール情報取得クエリ（TanStack Query）
import {useProfileQuery} from '#/state/queries/profile'
// DID（分散型識別子）解決クエリ
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
// セッション情報取得フック（現在ログイン中のユーザー）
import {useSession} from '#/state/session'
// 検索画面のシェルコンポーネント（共通UI）
import {SearchScreenShell} from '#/screens/Search/Shell'

/**
 * プロフィール検索画面のプロパティ型
 *
 * 【Go開発者向け説明】
 * - NativeStackScreenPropsはReact Navigationの型ヘルパー
 * - Goのhttp.Request構造体に似た役割（ルートパラメータを含む）
 * - CommonNavigatorParams: アプリ全体のルート定義
 * - 'ProfileSearch': この画面のルート名
 */
type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileSearch'>

/**
 * プロフィール検索画面コンポーネント
 *
 * 【Go開発者向け説明】
 * - Reactの画面コンポーネント（GoのHTTPハンドラ関数に相当）
 * - routeパラメータにはURLパラメータが含まれる（GoのmuxやchiのURLパラメータに相当）
 * - export constは名前付きエクスポート（Goのpublic関数に相当）
 *
 * 【主な機能】
 * 1. URLパラメータからユーザー名と検索クエリを取得
 * 2. DIDを解決してユーザー情報を取得
 * 3. プロフィール情報を取得
 * 4. 検索プレースホルダーを動的生成（自分/他人で文言変更）
 * 5. 検索シェルに固定パラメータ（from:）を渡す
 *
 * @param props - コンポーネントのプロパティ
 * @param props.route - React Navigationのルート情報（URLパラメータを含む）
 * @returns JSX要素 - プロフィール検索画面UI
 */
export const ProfileSearchScreen = ({route}: Props) => {
  // 【Go開発者向け説明 - 分割代入】
  // route.paramsからパラメータを展開（Goにはない構文）
  // name: ユーザー名（@handleまたはDID）
  // q: 検索クエリ（デフォルト空文字列）
  const {name, q: queryParam = ''} = route.params

  // 国際化フック - 翻訳関数を取得
  const {_} = useLingui()
  // 現在のログインユーザー情報を取得
  const {currentAccount} = useSession()

  // 【Go開発者向け説明 - TanStack Query】
  // useResolveDidQueryは非同期データフェッチングフック
  // - nameをDID（分散型識別子）に解決
  // - キャッシュ、再試行、エラーハンドリングを自動で行う
  // - Goのhttp.Clientでのリクエストに相当するが、より高機能
  const {data: resolvedDid} = useResolveDidQuery(name)

  // 解決したDIDを使ってプロフィール情報を取得
  // 【Go開発者向け】2段階のAPIリクエスト（DID解決 → プロフィール取得）
  const {data: profile} = useProfileQuery({did: resolvedDid})

  /**
   * 検索の固定パラメータ（from: ユーザーハンドル）
   *
   * 【Go開発者向け説明 - useMemo】
   * - useMemoは計算結果をメモ化するフック（Goにはない概念）
   * - 依存配列[profile?.handle, name]が変わらない限り、同じオブジェクトを返す
   * - これにより不要な再計算と子コンポーネントの再レンダリングを防ぐ
   *
   * 【処理内容】
   * - profile?.handleはオプショナルチェイニング（Goのif profile != nil { profile.handle }に相当）
   * - プロフィール取得前はnameをフォールバックとして使用
   * - from:パラメータで検索対象ユーザーを固定
   */
  const fixedParams = useMemo(
    () => ({
      // プロフィールハンドル、取得前はnameを使用（Goの三項演算子に相当）
      from: profile?.handle ?? name,
    }),
    [profile?.handle, name], // 依存配列 - これらが変更されたら再計算
  )

  // 【Go開発者向け説明 - JSX】
  // SearchScreenShellコンポーネントをレンダリング
  // propsを渡してUIをカスタマイズ（Goの関数引数に相当）
  return (
    <SearchScreenShell
      // 戻るボタンを表示（React Navigationの制御）
      navButton="back"
      // 【動的プレースホルダー生成】
      // 【Go開発者向け】三項演算子のネストでプレースホルダー文言を決定
      // 1. profileがまだnullの場合: "Search..."
      // 2. 自分のプロフィールの場合: "Search my posts"
      // 3. 他人のプロフィールの場合: "Search @handle's posts"
      inputPlaceholder={
        profile
          ? currentAccount?.did === profile.did
            ? _(msg`Search my posts`) // 自分の投稿を検索
            : _(msg`Search @${profile.handle}'s posts`) // @ハンドルの投稿を検索
          : _(msg`Search...`) // プロフィール読み込み中
      }
      // 検索の固定パラメータ（from: ユーザーハンドル）
      fixedParams={fixedParams}
      // URLから取得した初期検索クエリ
      queryParam={queryParam}
      // テスト用ID（E2Eテストで要素を特定するため）
      testID="searchPostsScreen"
    />
  )
}
