/**
 * @file ModerationMutedAccounts.tsx - ミュートしたアカウント一覧画面
 * @description ユーザーがミュートしたアカウントの一覧を表示・管理する画面。
 * プライベートなモデレーション機能として、フィードと通知からミュート対象の投稿を除外。
 *
 * ## Goエンジニア向けの説明
 * - React関数コンポーネント: Goのhttp.HandlerFuncに相当し、状態を持つUI関数
 * - useCallback: 関数のメモ化（再描画時に同じ関数インスタンスを返す、依存配列変更時のみ再生成）
 * - useMemo: 値のメモ化（計算結果をキャッシュ、依存配列変更時のみ再計算）
 * - useState: ローカル状態管理（Goのstructフィールド相当だが、変更時に自動再描画）
 * - カスタムフック: useXxx形式の関数で、ロジックを再利用可能な形で抽出
 *
 * ## 主な機能
 * - ミュートアカウント一覧の無限スクロール表示
 * - Pull-to-refresh（引っ張って更新）による最新データ取得
 * - 各アカウントのプロフィール情報表示（アバター、名前、説明文）
 * - モデレーションラベルの表示
 * - 空状態の説明とエラーハンドリング
 *
 * ## アーキテクチャ
 * - データ取得: TanStack Query（useMyMutedAccountsQuery）で自動キャッシュ・再取得管理
 * - 無限スクロール: ページネーション対応（hasNextPage/fetchNextPageでカーソルベース取得）
 * - 状態管理: ローカル状態（isPTRing）とグローバル状態（TanStack Query）の組み合わせ
 * - レンダリング最適化: renderItem関数でリストアイテムを効率的に描画
 *
 * ## データフロー
 * 1. useMyMutedAccountsQuery()でミュートリストを取得（キャッシュ優先）
 * 2. data.pagesをflatMapで単一配列に変換
 * 3. Listコンポーネントで仮想スクロール表示
 * 4. onEndReached時に次ページを自動取得（無限スクロール）
 * 5. onRefreshでデータを再取得（Pull-to-refresh）
 *
 * @module view/screens/ModerationMutedAccounts
 */

// React基本フック群（Goの標準ライブラリ的な位置づけ）
import {useCallback, useMemo, useState} from 'react'
// React Nativeの型定義とコンポーネント（UIの基本要素）
import {type StyleProp, View, type ViewStyle} from 'react-native'
// AT Protocolのアクター（ユーザー）型定義
import {type AppBskyActorDefs as ActorDefs} from '@atproto/api'
// 国際化ライブラリ（Trans: コンポーネント形式の翻訳）
import {Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// React Navigationのフック（画面フォーカス検知）
import {useFocusEffect} from '@react-navigation/native'
// React Navigationの型定義（ルーティング）
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

// アプリ内ルーティングの型定義
import {type CommonNavigatorParams} from '#/lib/routes/types'
// エラーメッセージを人間が読める形式にクリーンアップ
import {cleanError} from '#/lib/strings/errors'
// ログ出力ユーティリティ（Sentry, Console等の統一インターフェース）
import {logger} from '#/logger'
// モデレーション設定を取得するフック
import {useModerationOpts} from '#/state/preferences/moderation-opts'
// ミュートアカウント一覧を取得するTanStack Queryフック
import {useMyMutedAccountsQuery} from '#/state/queries/my-muted-accounts'
// シェルモード設定フック（ミニマルモード: ヘッダー/タブバー非表示）
import {useSetMinimalShellMode} from '#/state/shell'
// エラー画面コンポーネント
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
// 仮想スクロール対応リストコンポーネント
import {List} from '#/view/com/util/List'
// デザインシステム（atoms: スタイルプリミティブ、useTheme: テーマフック）
import {atoms as a, useTheme} from '#/alf'
// レイアウトコンポーネント群（画面構造）
import * as Layout from '#/components/Layout'
// リストフッターコンポーネント（ローディング/エラー表示）
import {ListFooter} from '#/components/Lists'
// プロフィールカード表示コンポーネント群
import * as ProfileCard from '#/components/ProfileCard'
// タイポグラフィコンポーネント
import {Text} from '#/components/Typography'

// コンポーネントのProps型定義（React Navigationから自動生成される型）
type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationMutedAccounts'
>

/**
 * ModerationMutedAccounts - ミュートアカウント一覧画面コンポーネント
 *
 * Goエンジニア向け:
 * - この関数はReact関数コンポーネント（Goのhttp.HandlerFunc的だが状態を持つ）
 * - TanStack Queryが非同期データ取得とキャッシュを自動管理（Goではcontext+goroutine+channel）
 * - useMemoで高コスト計算をキャッシュ（依存配列の値が変わるまで再計算しない）
 * - useCallbackで関数をキャッシュ（子コンポーネントへの不要な再描画を防ぐ）
 *
 * データフロー:
 * 1. useMyMutedAccountsQuery()がミュートリストを取得（自動キャッシュ・再検証）
 * 2. pages配列をflatMapで平坦化し、単一のprofiles配列を作成
 * 3. Listコンポーネントが仮想スクロール描画（画面内のアイテムのみレンダリング）
 * 4. スクロール末尾でfetchNextPage()を呼び出し、次ページ取得（無限スクロール）
 */
export function ModerationMutedAccounts({}: Props) {
  // テーマ情報取得（ダークモード/ライトモード対応）
  const t = useTheme()
  // モデレーション設定取得（ラベル表示設定等）
  const moderationOpts = useModerationOpts()
  // 国際化フック（翻訳関数_を取得）
  const {_} = useLingui()
  // シェルモードをミニマル化する関数（フルスクリーン表示時に使用）
  const setMinimalShellMode = useSetMinimalShellMode()

  // Pull-to-refresh中かどうかのローカル状態（PTR = Pull To Refresh）
  const [isPTRing, setIsPTRing] = useState(false)
  // TanStack Queryでミュートアカウント一覧を取得（自動キャッシュ・再検証）
  const {
    data, // ページネーション形式のデータ（pages配列）
    isFetching, // データ取得中フラグ（初回・更新問わず）
    isError, // エラー発生フラグ
    error, // エラーオブジェクト
    refetch, // 手動再取得関数
    hasNextPage, // 次ページが存在するか
    fetchNextPage, // 次ページ取得関数
    isFetchingNextPage, // 次ページ取得中フラグ
  } = useMyMutedAccountsQuery()
  // 空リスト判定（取得完了かつデータなし）
  const isEmpty = !isFetching && !data?.pages[0]?.mutes.length
  // 全ページのミュートアカウントを単一配列に変換（メモ化で不要な再計算を回避）
  const profiles = useMemo(() => {
    if (data?.pages) {
      // flatMap: 各ページのmutes配列を平坦化して単一配列にする
      return data.pages.flatMap(page => page.mutes)
    }
    return []
  }, [data]) // dataが変更された時のみ再計算

  // 画面フォーカス時の副作用（Reactのライフサイクル管理）
  // Goエンジニア向け: defer的な使い方で、画面表示時・非表示時に処理を実行
  useFocusEffect(
    useCallback(() => {
      // 画面表示時: ミニマルシェルモードを無効化（ヘッダー・タブバー表示）
      setMinimalShellMode(false)
      // 画面非表示時: クリーンアップ関数を返す（この場合は何もしない）
    }, [setMinimalShellMode]),
  )

  // Pull-to-refreshハンドラ（画面を引っ張って更新する処理）
  // Goエンジニア向け: async/awaitはGoのgoroutine+channel的な非同期処理
  const onRefresh = useCallback(async () => {
    setIsPTRing(true) // リフレッシュ中フラグをON
    try {
      await refetch() // データを再取得（キャッシュを無視して最新データを取得）
    } catch (err) {
      // エラーログ出力（Sentry等に送信される）
      logger.error('Failed to refresh my muted accounts', {message: err})
    }
    setIsPTRing(false) // リフレッシュ完了フラグをOFF
  }, [refetch, setIsPTRing]) // 依存配列: これらが変わった時のみ関数を再生成

  // 無限スクロール: リスト末尾到達時のハンドラ
  // Goエンジニア向け: スクロール位置が末尾に近づいたら自動で次ページ取得
  const onEndReached = useCallback(async () => {
    // ガード節: 取得中、次ページなし、エラー時はスキップ
    if (isFetching || !hasNextPage || isError) return

    try {
      await fetchNextPage() // 次ページのデータを取得（カーソルベースページネーション）
    } catch (err) {
      logger.error('Failed to load more of my muted accounts', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  // リストアイテムのレンダリング関数
  // Goエンジニア向け: Listコンポーネントが各アイテムごとにこの関数を呼び出す
  // renderItemは仮想スクロールの最適化のため、画面内のアイテムのみ描画される
  const renderItem = ({
    item,
    index,
  }: {
    item: ActorDefs.ProfileView // 表示するプロフィール
    index: number // リスト内のインデックス
  }) => {
    // モデレーション設定が未取得の場合は何も表示しない
    if (!moderationOpts) return null
    return (
      <View
        style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}
        key={item.did}> {/* DID（分散識別子）をキーに使用 */}
        {/* プロフィールカードをクリック可能なリンクでラップ */}
        <ProfileCard.Link profile={item} testID={`mutedAccount-${index}`}>
          <ProfileCard.Outer>
            <ProfileCard.Header>
              {/* アバター画像表示（モデレーションでぼかし可能） */}
              <ProfileCard.Avatar
                profile={item}
                moderationOpts={moderationOpts}
              />
              {/* 表示名とハンドル名表示 */}
              <ProfileCard.NameAndHandle
                profile={item}
                moderationOpts={moderationOpts}
              />
            </ProfileCard.Header>
            {/* モデレーションラベル表示（porn, spam等） */}
            <ProfileCard.Labels
              profile={item}
              moderationOpts={moderationOpts}
            />
            {/* プロフィール説明文表示 */}
            <ProfileCard.Description profile={item} />
          </ProfileCard.Outer>
        </ProfileCard.Link>
      </View>
    )
  }
  return (
    <Layout.Screen testID="mutedAccountsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Muted Accounts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Center>
        {isEmpty ? (
          <View>
            <Info style={[a.border_b]} />
            {isError ? (
              <ErrorScreen
                title="Oops!"
                message={cleanError(error)}
                onPressTryAgain={refetch}
              />
            ) : (
              <Empty />
            )}
          </View>
        ) : (
          <List
            data={profiles}
            keyExtractor={item => item.did}
            refreshing={isPTRing}
            onRefresh={onRefresh}
            onEndReached={onEndReached}
            renderItem={renderItem}
            initialNumToRender={15}
            // FIXME(dan)

            ListHeaderComponent={Info}
            ListFooterComponent={
              <ListFooter
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                error={cleanError(error)}
                onRetry={fetchNextPage}
              />
            }
          />
        )}
      </Layout.Center>
    </Layout.Screen>
  )
}

/**
 * Empty - 空状態表示コンポーネント
 *
 * Goエンジニア向け:
 * - ミュートアカウントが0件の時に表示される説明メッセージ
 * - 中央寄せの情報ボックスで、ミュート方法のガイダンスを提供
 */
function Empty() {
  const t = useTheme()
  return (
    <View style={[a.pt_2xl, a.px_xl, a.align_center]}>
      <View
        style={[
          a.py_md,
          a.px_lg,
          a.rounded_sm,
          t.atoms.bg_contrast_25, // テーマ対応の背景色（25%コントラスト）
          a.border,
          t.atoms.border_contrast_low,
          {maxWidth: 400}, // 最大幅を制限して読みやすさを確保
        ]}>
        <Text style={[a.text_sm, a.text_center, t.atoms.text_contrast_high]}>
          <Trans>
            You have not muted any accounts yet. To mute an account, go to their
            profile and select "Mute account" from the menu on their account.
          </Trans>
        </Text>
      </View>
    </View>
  )
}

/**
 * Info - 情報メッセージコンポーネント
 *
 * Goエンジニア向け:
 * - リスト上部に固定表示される情報バー
 * - ミュート機能の説明（投稿除外、プライバシー等）を提供
 *
 * @param style - 追加のスタイル（オプショナル）
 */
function Info({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        t.atoms.bg_contrast_25, // テーマ対応の背景色
        a.py_md,
        a.px_xl,
        a.border_t,
        {marginTop: a.border.borderWidth * -1}, // 上部ボーダーの重複を避けるためネガティブマージン
        t.atoms.border_contrast_low,
        style,
      ]}>
      <Text style={[a.text_center, a.text_sm, t.atoms.text_contrast_high]}>
        <Trans>
          Muted accounts have their posts removed from your feed and from your
          notifications. Mutes are completely private.
        </Trans>
      </Text>
    </View>
  )
}
