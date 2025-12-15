/**
 * ViewFullThread - スレッド全体表示リンクコンポーネント
 *
 * 【概要】
 * 長いスレッド（会話）の一部のみが表示されている場合に、
 * スレッド全体を表示するためのリンクを提供するコンポーネント。
 * 視覚的には点線とドット（...）で表現されます。
 *
 * 【機能】
 * - スレッド全体表示へのナビゲーションリンク
 * - SVGによる視覚的な省略表現（縦線とドット）
 * - ホバーエフェクト対応
 *
 * 【Goユーザー向け補足】
 * - このファイルはReact Nativeコンポーネント（UI部品）を定義
 * - export functionで外部公開（Goのpublic funcに相当）
 * - JSXはReact特有のUI記述構文（HTMLに似た宣言的記述）
 *
 * @module ViewFullThread
 */

// Reactコアライブラリ（コンポーネント作成の基盤）
import React from 'react'
// React NativeのUI部品（View: コンテナ、StyleSheet: スタイル定義、Svg: SVG描画）
import {StyleSheet, View} from 'react-native'
// React Native SVGライブラリ - SVG図形の描画
import Svg, {Circle, Line} from 'react-native-svg'
// AT Protocol URI処理ライブラリ - 分散型SNSプロトコルのURI操作
import {AtUri} from '@atproto/api'
// 国際化（i18n）ライブラリ - 多言語対応
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// カスタムフック - カラーパレット取得
import {usePalette} from '#/lib/hooks/usePalette'
// ルーティングヘルパー - プロフィールリンク生成
import {makeProfileLink} from '#/lib/routes/links'
// インタラクション状態フック - ホバー/タップ状態管理
import {useInteractionState} from '#/components/hooks/useInteractionState'
// Web向けサブトルホバーエフェクト
import {SubtleWebHover} from '#/components/SubtleWebHover'
// リンクコンポーネント
import {Link} from '../util/Link'
// テキストコンポーネント
import {Text} from '../util/text/Text'

/**
 * ViewFullThread - スレッド全体表示リンクコンポーネント
 *
 * 【Props】
 * @param {string} uri - 投稿のAT Protocol URI（スレッドのルート投稿を指す）
 *
 * 【動作】
 * 1. URIから投稿情報を抽出（DID、rkey）
 * 2. プロフィール投稿ページへのリンクを生成
 * 3. SVGで視覚的な「続きあり」表現を描画
 * 4. クリック/タップでスレッド全体ページへ遷移
 *
 * 【Reactフック】
 * - useInteractionState: ホバー/タップ状態の追跡
 * - usePalette: カラーパレットの取得
 * - React.useMemo: リンク先URLのメモ化（パフォーマンス最適化）
 *
 * 【Goユーザー向け補足】
 * - useXXXはReactフック（状態管理や副作用を扱う特殊な関数）
 * - useMemoは計算結果をキャッシュし、依存配列が変わるまで再利用
 * - これはGoでいうsync.Onceやキャッシュパターンに似ています
 *
 * @returns {JSX.Element} スレッド全体表示リンク
 */
export function ViewFullThread({uri}: {uri: string}) {
  /**
   * インタラクション状態の管理
   *
   * 【useInteractionState】
   * ホバー/タップ状態を追跡するカスタムフック。
   * - state: 現在のホバー状態（boolean）
   * - onIn: ホバー開始時のハンドラー
   * - onOut: ホバー終了時のハンドラー
   */
  const {
    state: hover,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  // カラーパレットの取得（テーマカラー）
  const pal = usePalette('default')

  /**
   * スレッド投稿へのリンクURLを生成
   *
   * 【useMemo】
   * 計算コストの高い処理をメモ化（キャッシュ）するReactフック。
   * 依存配列[uri]が変わらない限り、同じ結果を再利用します。
   *
   * 【処理内容】
   * 1. AT Protocol URIをパース（例: at://did:plc:xxx/app.bsky.feed.post/123）
   * 2. hostnameからユーザーDIDを抽出
   * 3. rkeyから投稿IDを抽出
   * 4. プロフィール投稿ページへのリンクを生成
   *
   * 【Goユーザー向け補足】
   * - useMemoはGoのsync.Onceやキャッシュ機構に相当
   * - 依存配列が変わるまで計算結果を再利用し、パフォーマンスを最適化
   */
  const itemHref = React.useMemo(() => {
    const urip = new AtUri(uri) // URIをパース
    return makeProfileLink({did: urip.hostname, handle: ''}, 'post', urip.rkey)
  }, [uri]) // 依存配列：uriが変わったときのみ再計算

  // 国際化ヘルパー（多言語対応）
  const {_} = useLingui()

  /**
   * レンダリング部分
   *
   * 【JSX構造】
   * - Link: クリック可能なリンクコンポーネント
   *   - SubtleWebHover: Webでのホバーエフェクト
   *   - View + Svg: SVG図形（縦線とドット）で視覚表現
   *   - Text: 「スレッド全体を表示」テキスト
   *
   * 【SVG図形の意味】
   * - Line: 上部の縦線（スレッドの続きを示唆）
   * - Circle x3: 3つのドット（省略記号「...」を視覚化）
   *
   * 【Goユーザー向け補足】
   * - JSXは宣言的UI記述（HTMLに似た構文）
   * - styleプロパティでCSSライクなスタイリング
   * - onPointerEnter/Leaveはマウスホバーイベント（Webのみ）
   */
  return (
    <Link
      style={[styles.viewFullThread]}
      href={itemHref}
      asAnchor // Web: <a>タグとしてレンダリング
      noFeedback // タップフィードバックを無効化
      onPointerEnter={onHoverIn} // ホバー開始（Web専用イベント）
      onPointerLeave={onHoverOut}> {/* ホバー終了（Web専用イベント） */}
      {/* Webホバーエフェクト（背景色の微妙な変化） */}
      <SubtleWebHover
        hover={hover}
        // 視覚的な位置調整 - 実際のボックスは上部パディングが多く下部パディングが少ないため調整
        style={{top: 8, bottom: -5}}
      />

      {/* SVG図形コンテナ */}
      <View style={styles.viewFullThreadDots}>
        <Svg width="4" height="40">
          {/* 上部の縦線 - スレッドの続きを示唆 */}
          <Line
            x1="2"
            y1="0"
            x2="2"
            y2="15"
            stroke={pal.colors.replyLine} // テーマの返信線カラー
            strokeWidth="2"
          />
          {/* 省略記号「...」を表す3つのドット */}
          <Circle cx="2" cy="22" r="1.5" fill={pal.colors.replyLineDot} />
          <Circle cx="2" cy="28" r="1.5" fill={pal.colors.replyLineDot} />
          <Circle cx="2" cy="34" r="1.5" fill={pal.colors.replyLineDot} />
        </Svg>
      </View>

      {/* リンクテキスト */}
      <Text type="md" style={[pal.link, {paddingTop: 18, paddingBottom: 4}]}>
        {/* HACKFIX: TransがSDK 53アップグレード後に動作しないため直接_(msg)を使用 */}
        {_(msg`View full thread`)}
      </Text>
    </Link>
  )
}

/**
 * スタイル定義
 *
 * 【StyleSheet.create】
 * React NativeのスタイルシステムでCSS-likeなスタイルを定義。
 * パフォーマンス最適化とTypeScript型チェックを提供します。
 *
 * 【Goユーザー向け補足】
 * - これはGoのstruct定義に似た型安全なスタイル定義
 * - flexDirection: 'row'はFlexboxレイアウト（横並び配置）
 * - gap, paddingLeftなどはCSSプロパティと同じ
 */
const styles = StyleSheet.create({
  // スレッド全体表示リンクのメインコンテナ
  viewFullThread: {
    flexDirection: 'row', // 子要素を横並びに配置（Flexbox）
    gap: 10, // 子要素間のスペース（ギャップ）
    paddingLeft: 18, // 左側のパディング
  },
  // SVGドットコンテナ
  viewFullThreadDots: {
    width: 42, // 固定幅（アバターサイズに合わせる）
    alignItems: 'center', // 中央揃え（横方向）
  },
})
