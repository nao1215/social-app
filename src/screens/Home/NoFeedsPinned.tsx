/**
 * フィード未ピン止め状態の空画面コンポーネント
 *
 * 【Go開発者向け説明】
 * このファイルはReact Nativeのコンポーネント（Goでいうとパッケージ内の関数に相当）です。
 * JSX構文はHTMLのようなマークアップとTypeScriptを混在させる記法で、Go言語のhtml/templateとは異なり
 * 型安全性を保ちながら動的にUIを構築できます。
 *
 * 【モジュールの役割】
 * ユーザーがすべてのフィードのピン止めを解除した際の案内画面を提供します。
 * - デフォルトフィードの自動追加機能
 * - カスタムフィード検索画面への誘導
 * - 空状態の適切なUX提供
 *
 * 【技術スタック】
 * - React Native: クロスプラットフォームUI構築（iOS/Android/Web対応）
 * - Lingui: 国際化対応（i18n）
 * - TanStack Query: サーバー状態管理（useOverwriteSavedFeedsMutation）
 * - ATプロトコル: 分散型SNSプロトコル（フィード管理）
 */

// React本体（UIコンポーネントの基盤ライブラリ）
import React from 'react'
// React Nativeの基本UIコンポーネント（Goのhtml/templateに相当するが型安全）
import {View} from 'react-native'
// ATプロトコルの一意識別子生成（GoのUUIDライブラリに相当）
import {TID} from '@atproto/common-web'
// Lingui国際化ライブラリ（翻訳マクロとコンポーネント）
import {msg, Trans} from '@lingui/macro'
// Linguiのフック（言語切り替え機能）
import {useLingui} from '@lingui/react'

// アプリケーション定数（デフォルトフィード設定）
import {DISCOVER_SAVED_FEED, TIMELINE_SAVED_FEED} from '#/lib/constants'
// フィード設定更新のミューテーション関数（TanStack Query）
import {useOverwriteSavedFeedsMutation} from '#/state/queries/preferences'
// ユーザー設定のレスポンス型定義（Goのstructに相当）
import {UsePreferencesQueryResponse} from '#/state/queries/preferences'
// 中央配置レイアウトコンポーネント
import {CenteredView} from '#/view/com/util/Views'
// デザインシステムのアトミックスタイル（Tailwind CSSライクなスタイリング）
import {atoms as a} from '#/alf'
// ボタンコンポーネント群（複合コンポーネントパターン）
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// ヘッダー高さ取得カスタムフック
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
// リストアイコン（SVGコンポーネント）
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'
// プラスアイコン（SVGコンポーネント）
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
// ルーティングリンクコンポーネント（React Navigation統合）
import {Link} from '#/components/Link'
// タイポグラフィコンポーネント（テキスト表示）
import {Text} from '#/components/Typography'

/**
 * ホーム画面のフィードピン無し状態コンポーネント
 *
 * 【Go開発者向け説明】
 * - このinterfaceはGoのstructに相当します
 * - TypeScriptの型システムにより、コンパイル時に型チェックが行われます
 * - preferences: UsePreferencesQueryResponse はGoの埋め込みフィールドに似ていますが、
 *   TypeScriptでは明示的にプロパティ名を指定する必要があります
 */
interface NoFeedsPinnedProps {
  // ユーザーの設定データ（Goのstruct fieldに相当）
  preferences: UsePreferencesQueryResponse
}

/**
 * フィード未ピン止め時の空状態表示コンポーネント
 *
 * 【Go開発者向け説明】
 * - Reactコンポーネントは関数として定義されます（Goの関数に相当）
 * - propsは引数として渡されるデータ（Goの関数引数に相当）
 * - 戻り値はJSX要素（UIの構造を表現）
 * - この関数は再レンダリングされるたびに実行されます（Goのハンドラ関数とは動作が異なる）
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
 * @param props - コンポーネントのプロパティ
 * @param props.preferences - ユーザーの設定データ
 * @returns JSX要素 - フィード未設定時の案内UI
 */
export function NoFeedsPinned({
  preferences,
}: NoFeedsPinnedProps) {
  // 【Go開発者向け説明 - useフック】
  // ReactのuseXXXフックは、Goの関数内でグローバル変数にアクセスするのに似ていますが、
  // より制御された方法でコンポーネントの状態やライフサイクルにアクセスします。
  // フックは必ずコンポーネントのトップレベルで呼び出す必要があります（条件分岐内では使用不可）。

  // Lingui国際化フック - 翻訳関数を取得（GoのGettext的な機能）
  const {_} = useLingui()

  // ヘッダーのオフセット値を取得（レイアウト調整用）
  const headerOffset = useHeaderOffset()

  // 【Go開発者向け説明 - TanStack Queryミューテーション】
  // useOverwriteSavedFeedsMutationはTanStack Queryのフックです。
  // - isPending: APIリクエスト中かどうか（Goのcontext.Doneチャネルに似た状態管理）
  // - mutateAsync: 非同期でAPIリクエストを実行する関数（GoのHTTPクライアント関数に相当）
  // - キャッシュ管理、エラーハンドリング、再試行などを自動で行います
  const {isPending, mutateAsync: overwriteSavedFeeds} =
    useOverwriteSavedFeedsMutation()

  /**
   * 推奨フィードの自動追加処理
   *
   * 【Go開発者向け説明 - React.useCallback】
   * - useCallbackは関数のメモ化フック（Goにはない概念）
   * - 依存配列（第2引数）の値が変わらない限り、同じ関数インスタンスを返す
   * - これにより不要な再レンダリングを防ぎ、パフォーマンスを最適化
   * - 依存配列: [overwriteSavedFeeds, preferences.savedFeeds]
   *   → これらが変更された時のみ、関数が再作成される
   *
   * 【処理フロー】
   * 1. 既存のフィードリストから重複するタイムラインとディスカバーフィードを除外
   * 2. 新しいピン止めフィードを先頭に追加
   * 3. サーバーに一括保存
   *
   * @async
   * @returns Promise<void> - 非同期処理の完了を表すPromise
   */
  const addRecommendedFeeds = React.useCallback(async () => {
    // 重複除外フラグ（Goのbool変数と同じ）
    let skippedTimeline = false
    let skippedDiscover = false
    // 重複以外の保存済みフィード（Goのsliceに相当）
    let remainingSavedFeeds = []

    // 【Go開発者向け説明】
    // for...ofループはGoのfor range文に相当します
    // TypeScriptでは配列の要素を直接イテレートできます
    // 既存のタイムラインとディスカバーフィードの最初の1つを除外（上書き防止）
    for (const savedFeed of preferences.savedFeeds) {
      // タイムラインフィードの最初の1つをスキップ
      if (savedFeed.type === 'timeline' && !skippedTimeline) {
        skippedTimeline = true
      } else if (
        // ディスカバーフィードの最初の1つをスキップ
        savedFeed.value === DISCOVER_SAVED_FEED.value &&
        !skippedDiscover
      ) {
        skippedDiscover = true
      } else {
        // それ以外は保持リストに追加
        remainingSavedFeeds.push(savedFeed)
      }
    }

    // 【Go開発者向け説明 - スプレッド構文】
    // ...演算子はGoのスライス展開に似ていますが、より汎用的です
    // {...DISCOVER_SAVED_FEED} はGoの構造体リテラルのフィールドコピーに相当
    // その後に個別フィールドを上書きできます
    const toSave = [
      {
        // ディスカバーフィードの全フィールドをコピー（Goの構造体埋め込みに似た動作）
        ...DISCOVER_SAVED_FEED,
        pinned: true, // ピン止めフラグを上書き
        id: TID.nextStr(), // 新しい一意IDを生成（GoのUUID.Newに相当）
      },
      {
        // タイムラインフィードも同様に設定
        ...TIMELINE_SAVED_FEED,
        pinned: true,
        id: TID.nextStr(),
      },
      // 既存の残りのフィードを展開して追加（Goのappend(...slice)に相当）
      ...remainingSavedFeeds,
    ]

    // 【Go開発者向け説明 - async/await】
    // awaitはGoのチャネル受信 <- chan に似た動作をします
    // Promiseが完了するまで処理をブロックしますが、UIスレッドはブロックしません
    // Goのgoroutineとは異なり、async関数内でのみawaitを使用できます
    await overwriteSavedFeeds(toSave)
  }, [overwriteSavedFeeds, preferences.savedFeeds])

  // 【Go開発者向け説明 - JSXの戻り値】
  // return以下のJSX構文は、Goのhtml/templateとは異なる方法でUIを構築します
  // - JSXはコンパイル時にReact.createElement()呼び出しに変換されます
  // - 型安全性が保たれ、TypeScriptの型チェックが適用されます
  // - {}内にTypeScript式を埋め込むことができます（Goのテンプレート{{.}}に相当）
  return (
    // 【中央配置コンテナ】左右にボーダーを持つフルハイトビュー
    <CenteredView sideBorders style={[a.h_full_vh]}>
      <View
        style={[
          // スタイル配列（複数のスタイルオブジェクトをマージ）
          a.align_center, // 中央揃え（CSS: align-items: center）
          a.h_full_vh, // ビューポート全体の高さ（CSS: height: 100vh）
          a.py_3xl, // 垂直方向のパディング（Goにはない概念、CSSのpadding-top/bottomに相当）
          a.px_xl, // 水平方向のパディング
          {
            // 動的スタイル計算（ヘッダーの高さを考慮）
            paddingTop: headerOffset + a.py_3xl.paddingTop,
          },
        ]}>
        {/* メッセージエリア */}
        <View style={[a.align_center, a.gap_sm, a.pb_xl]}>
          {/* タイトルテキスト - 【Go開発者向け】Transコンポーネントは自動翻訳 */}
          <Text style={[a.text_xl, a.font_bold]}>
            <Trans>Whoops!</Trans>
          </Text>
          {/* 説明テキスト */}
          <Text
            style={[a.text_md, a.text_center, a.leading_snug, {maxWidth: 340}]}>
            <Trans>
              Looks like you unpinned all your feeds. But don't worry, you can
              add some below 😄
            </Trans>
          </Text>
        </View>

        {/* ボタンエリア - フレックスボックスレイアウト */}
        <View style={[a.flex_row, a.gap_md, a.justify_center, a.flex_wrap]}>
          {/* 推奨フィード追加ボタン */}
          {/* 【Go開発者向け説明】
               - disabled属性はボタンの有効/無効を制御（APIリクエスト中は無効化）
               - onPressはGoのHTTPハンドラ関数に似たイベントハンドラ
               - _(msg`...`)はLingui翻訳マクロ（実行時に適切な言語の文字列を返す）
          */}
          <Button
            disabled={isPending} // API実行中は無効化
            label={_(msg`Apply default recommended feeds`)} // アクセシビリティ用ラベル
            size="large" // ボタンサイズ
            variant="solid" // ボタンバリアント（塗りつぶし）
            color="primary" // プライマリカラー
            onPress={addRecommendedFeeds}> {/* クリック時のハンドラ */}
            {/* ボタン内アイコン（左側配置） */}
            <ButtonIcon icon={Plus} position="left" />
            {/* ボタンテキスト */}
            <ButtonText>{_(msg`Add recommended feeds`)}</ButtonText>
          </Button>

          {/* フィード一覧ページへのリンク */}
          {/* 【Go開発者向け説明 - React Navigation】
               - Linkコンポーネントはルーティング機能を提供
               - toプロパティで遷移先のパス指定（Goのhttp.Redirectに似た動作）
               - React Navigationがルーティングを管理（Goのgorilla/muxに相当）
          */}
          <Link
            label={_(msg`Browse other feeds`)}
            to="/feeds" // 遷移先パス
            size="large"
            variant="solid"
            color="secondary"> {/* セカンダリカラー */}
            <ButtonIcon icon={ListSparkle} position="left" />
            <ButtonText>{_(msg`Browse other feeds`)}</ButtonText>
          </Link>
        </View>
      </View>
    </CenteredView>
  )
}
