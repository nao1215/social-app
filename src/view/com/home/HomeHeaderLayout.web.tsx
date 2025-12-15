/**
 * ホームヘッダーレイアウト（Web版）
 *
 * 【モジュール概要】
 * Web（ブラウザ）向けのホーム画面ヘッダーレイアウトコンポーネント。
 * デスクトップとタブレットで表示されるレイアウトを提供。
 *
 * 【主な機能】
 * - レスポンシブ対応（モバイル/デスクトップ&タブレット自動切り替え）
 * - デスクトップ: ロゴとフィードボタンを上部に配置
 * - タブレット: デスクトップと同様のレイアウト
 * - モバイル: HomeHeaderLayoutMobileにフォールバック
 * - スティッキーヘッダー（スクロール時も上部固定）
 *
 * 【プラットフォーム分岐】
 * - .web.tsx: Web専用ファイル（Metro bundlerが自動選択）
 * - .tsx: モバイル用（iOS/Android）
 *
 * 【Go開発者向け補足】
 * - useBreakpoints: レスポンシブデザイン用フック（画面サイズ判定）
 * - React.ReactNode: 任意のReact要素（Goのinterface{}に類似）
 * - JSX.Element: UIコンポーネント型
 */
import React from 'react' // Reactライブラリ
import {View} from 'react-native' // React Native基本UIコンポーネント
import {msg} from '@lingui/macro' // 国際化マクロ
import {useLingui} from '@lingui/react' // Linguiフック（翻訳機能）

import {useKawaiiMode} from '#/state/preferences/kawaii' // かわいいモード設定フック
import {useSession} from '#/state/session' // セッション状態管理
import {useShellLayout} from '#/state/shell/shell-layout' // シェルレイアウト状態
import {HomeHeaderLayoutMobile} from '#/view/com/home/HomeHeaderLayoutMobile' // モバイル用レイアウト
import {Logo} from '#/view/icons/Logo' // Blueskyロゴ
import {atoms as a, useBreakpoints, useGutters, useTheme} from '#/alf' // Alfデザインシステム
import {ButtonIcon} from '#/components/Button' // アイコンボタン
import {Hashtag_Stroke2_Corner0_Rounded as FeedsIcon} from '#/components/icons/Hashtag' // フィードアイコン
import * as Layout from '#/components/Layout' // レイアウトコンポーネント
import {Link} from '#/components/Link' // リンクコンポーネント

/**
 * HomeHeaderLayout - ホームヘッダーレイアウト（レスポンシブ対応）
 *
 * 【機能説明】
 * 画面サイズに応じてモバイル版とデスクトップ&タブレット版を切り替え。
 * - モバイル: HomeHeaderLayoutMobileを使用
 * - デスクトップ&タブレット: HomeHeaderLayoutDesktopAndTabletを使用
 *
 * 【Go開発者向け補足】
 * - props: React.PropsWithChildren<{...}>: 子要素を含む型定義
 * - children: 子コンポーネント（Goのテンプレートyieldに相当）
 * - gtMobile: "greater than mobile"（モバイルより大きい画面サイズ）
 *
 * @param props - 子要素とタブバーアンカー
 * @returns JSX要素 - レスポンシブヘッダーレイアウト
 */
export function HomeHeaderLayout(props: {
  children: React.ReactNode // 子要素（タブバーなど）
  tabBarAnchor: JSX.Element | null | undefined // タブバーアンカー要素
}) {
  const {gtMobile} = useBreakpoints() // ブレークポイント判定（モバイルより大きいか）
  // 画面サイズに応じてレイアウトを切り替え
  if (!gtMobile) {
    return <HomeHeaderLayoutMobile {...props} /> // モバイル版
  } else {
    return <HomeHeaderLayoutDesktopAndTablet {...props} /> // デスクトップ&タブレット版
  }
}

/**
 * HomeHeaderLayoutDesktopAndTablet - デスクトップ&タブレット用ヘッダーレイアウト
 *
 * 【機能説明】
 * デスクトップとタブレットサイズ画面向けのヘッダーレイアウト。
 * - 上部: ロゴとフィードボタンを配置
 * - タブバーアンカー: ページ上部に固定配置
 * - 中央揃え: Layout.Centerで中央配置
 * - スティッキー: スクロール時も上部固定
 *
 * 【レイアウト構造】
 * 1. ログイン時のみ表示される上部セクション（ロゴ+フィードボタン）
 * 2. タブバーアンカー（外部から渡される）
 * 3. 子要素（タブバーなど）- スティッキー配置
 *
 * 【Go開発者向け補足】
 * - {}: 型定義（Goのstructに相当）
 * - <>...</>: Reactフラグメント（複数要素をラップする透明コンテナ）
 * - onLayout: レイアウト計測イベント
 *
 * @param children - 子要素（タブバーなど）
 * @param tabBarAnchor - タブバーアンカー要素
 * @returns JSX要素 - デスクトップ&タブレット用ヘッダー
 */
function HomeHeaderLayoutDesktopAndTablet({
  children,
  tabBarAnchor,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const t = useTheme() // テーマ設定取得
  const {headerHeight} = useShellLayout() // ヘッダー高さ管理
  const {hasSession} = useSession() // ログイン状態確認
  const {_} = useLingui() // 翻訳関数
  const kawaii = useKawaiiMode() // かわいいモード（ロゴサイズ変更）
  const gutters = useGutters([0, 'base']) // ガター（余白）設定

  /**
   * JSX返却: デスクトップ&タブレット用レイアウト
   *
   * 【構造説明】
   * 1. Reactフラグメント: 複数要素をグループ化
   * 2. ログイン時のみ表示される上部セクション
   *    - ロゴ（中央配置、かわいいモード時はサイズ拡大）
   *    - フィード一覧ボタン（右端）
   * 3. タブバーアンカー（外部から渡される）
   * 4. 子要素（タブバー）- スティッキー配置で上部固定
   *
   * 【Go開発者向け補足】
   * - {hasSession && ...}: 条件付きレンダリング（Goのif文に相当）
   * - style={[...]}: スタイル配列（複数スタイルをマージ）
   * - onLayout: レイアウトサイズ変更イベント
   */
  return (
    <>
      {/* ログイン時のみ表示: ロゴとフィードボタン */}
      {hasSession && (
        <Layout.Center>
          <View
            style={[a.flex_row, a.align_center, gutters, a.pt_md, t.atoms.bg]}>
            {/* 左側のスペーサー（ロゴを中央配置するため） */}
            <View style={{width: 34}} />
            {/* 中央: Blueskyロゴ */}
            <View style={[a.flex_1, a.align_center, a.justify_center]}>
              <Logo width={kawaii ? 60 : 28} /> {/* かわいいモード時はロゴ拡大 */}
            </View>
            {/* 右: フィード一覧ボタン */}
            <Link
              to="/feeds" // フィード一覧画面へのパス
              hitSlop={10} // タップ領域拡張
              label={_(msg`View your feeds and explore more`)} // アクセシビリティラベル
              size="small"
              variant="ghost" // 背景なしボタン
              color="secondary"
              shape="square"
              style={[a.justify_center]}>
              <ButtonIcon icon={FeedsIcon} size="lg" />
            </Link>
          </View>
        </Layout.Center>
      )}
      {/* タブバーアンカー（外部から渡される要素） */}
      {tabBarAnchor}
      {/* スティッキーヘッダー: タブバーなどの子要素 */}
      <Layout.Center
        style={[a.sticky, a.z_10, a.align_center, t.atoms.bg, {top: 0}]} // スクロール時も上部固定
        onLayout={e => {
          // ヘッダー高さを計測して状態管理に保存
          headerHeight.set(e.nativeEvent.layout.height)
        }}>
        {children} {/* タブバーなどの子要素 */}
      </Layout.Center>
    </>
  )
}
