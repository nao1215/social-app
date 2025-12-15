/**
 * ホームヘッダーレイアウト（モバイル版）
 *
 * 【モジュール概要】
 * モバイル（iOS/Android）向けのホーム画面ヘッダーレイアウトコンポーネント。
 * 固定ヘッダー、メニューボタン、ロゴ、フィードボタンを配置。
 *
 * 【主な機能】
 * - 固定ヘッダー表示（スクロール時のアニメーション対応）
 * - メニューボタン（ドロワー開閉）
 * - ロゴタップでフィード最上部へスクロール
 * - フィード一覧画面へのリンクボタン
 * - ヘッダー高さの動的計測と状態管理
 *
 * 【Go開発者向け補足】
 * - View: React Nativeの基本コンテナ（Goのdiv要素に相当）
 * - Animated.View: アニメーション対応のView
 * - useTheme, useLingui, etc: Reactフック（状態や機能を関数コンポーネントに注入）
 * - JSX.Element: UIコンポーネントの型（Goのhtml/template.HTMLに類似）
 */
import {View} from 'react-native' // React Nativeの基本UIコンポーネント
import Animated from 'react-native-reanimated' // アニメーション機能（スムーズなUI遷移を実現）
import {msg} from '@lingui/macro' // 国際化マクロ（翻訳文字列を定義）
import {useLingui} from '@lingui/react' // Linguiフック（翻訳関数を取得）

import {HITSLOP_10} from '#/lib/constants' // タップ領域の拡張値（タップしやすさ向上）
import {PressableScale} from '#/lib/custom-animations/PressableScale' // スケールアニメーション付きボタン
import {useHaptics} from '#/lib/haptics' // 触覚フィードバック（振動）機能
import {useMinimalShellHeaderTransform} from '#/lib/hooks/useMinimalShellTransform' // ミニマルシェル用ヘッダーアニメーション
import {emitSoftReset} from '#/state/events' // ソフトリセットイベント発火（フィード最上部へスクロール）
import {useSession} from '#/state/session' // セッション状態管理フック
import {useShellLayout} from '#/state/shell/shell-layout' // シェルレイアウト状態管理
import {Logo} from '#/view/icons/Logo' // Blueskyロゴコンポーネント
import {atoms as a, useTheme} from '#/alf' // Alfデザインシステム（スタイル定義）
import {ButtonIcon} from '#/components/Button' // アイコンボタンコンポーネント
import {Hashtag_Stroke2_Corner0_Rounded as FeedsIcon} from '#/components/icons/Hashtag' // ハッシュタグアイコン（フィード用）
import * as Layout from '#/components/Layout' // レイアウトコンポーネント群
import {Link} from '#/components/Link' // リンクコンポーネント（画面遷移）

/**
 * HomeHeaderLayoutMobile - モバイル用ホームヘッダーレイアウト
 *
 * 【機能説明】
 * 画面上部に固定されたヘッダーバーを表示。
 * - 左: メニューボタン（ドロワー開閉）
 * - 中央: Blueskyロゴ（タップでフィード最上部へスクロール）
 * - 右: フィード一覧ボタン（ログイン時のみ表示）
 *
 * スクロール時にミニマルシェルモードでアニメーション表示/非表示。
 *
 * 【Go開発者向け補足】
 * - children: 子要素（Goのテンプレートのyieldに類似）
 * - React.ReactNode: 任意のReact要素の型
 * - {}: オブジェクト型定義（Goのstructに相当）
 *
 * @param children - ヘッダー内に表示する子要素（タブバーなど）
 * @param tabBarAnchor - タブバーのアンカー要素（未使用だが型定義に含まれる）
 * @returns JSX要素 - モバイル用ホームヘッダー
 */
export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode // 子コンポーネント
  tabBarAnchor: JSX.Element | null | undefined // タブバーアンカー（将来の拡張用）
}) {
  const t = useTheme() // テーマ設定取得（ライト/ダークモード）
  const {_} = useLingui() // 翻訳関数取得（多言語対応）
  const {headerHeight} = useShellLayout() // ヘッダー高さの状態管理
  const headerMinimalShellTransform = useMinimalShellHeaderTransform() // ミニマルシェルアニメーション変換
  const {hasSession} = useSession() // ログイン状態確認
  const playHaptic = useHaptics() // 触覚フィードバック再生関数

  /**
   * JSX返却: モバイル用ヘッダーレイアウト
   *
   * 【構造説明】
   * - Animated.View: 固定ヘッダー（スクロールでアニメーション）
   * - Layout.Header.Outer: ヘッダー外枠
   *   - 左スロット: メニューボタン
   *   - 中央: Blueskyロゴ（タップでフィード最上部へスクロール）
   *   - 右スロット: フィード一覧ボタン（ログイン時のみ）
   * - children: タブバーなどの追加コンテンツ
   *
   * 【Go開発者向け補足】
   * - style={[...]}: スタイル配列（複数スタイルを結合）
   * - onLayout: レイアウト計測イベント（サイズ変更時に発火）
   * - {条件 && <Component />}: 条件付きレンダリング（Goのif文に相当）
   */
  return (
    <Animated.View
      style={[
        a.fixed, // 固定配置（position: fixed相当）
        a.z_10, // z-index: 10（他要素より前面に表示）
        t.atoms.bg, // 背景色（テーマに応じて変化）
        {
          top: 0, // 画面最上部に配置
          left: 0,
          right: 0,
        },
        headerMinimalShellTransform, // ミニマルシェルアニメーション適用
      ]}
      onLayout={e => {
        // ヘッダーの高さを計測して状態管理に保存
        // 【Go開発者向け補足】onLayout: レイアウト変更イベント（DOMのresizeに類似）
        headerHeight.set(e.nativeEvent.layout.height)
      }}>
      <Layout.Header.Outer noBottomBorder>
        {/* 左スロット: メニューボタン（ドロワー開閉） */}
        <Layout.Header.Slot>
          <Layout.Header.MenuButton />
        </Layout.Header.Slot>

        {/* 中央: Blueskyロゴ */}
        <View style={[a.flex_1, a.align_center]}>
          <PressableScale
            targetScale={0.9} // タップ時のスケール（90%に縮小）
            onPress={() => {
              playHaptic('Light') // 軽い触覚フィードバック再生
              emitSoftReset() // ソフトリセットイベント発火（フィード最上部へスクロール）
            }}>
            <Logo width={30} />
          </PressableScale>
        </View>

        {/* 右スロット: フィード一覧ボタン（ログイン時のみ表示） */}
        <Layout.Header.Slot>
          {hasSession && ( // ログイン中のみ表示
            <Link
              testID="viewHeaderHomeFeedPrefsBtn"
              to={{screen: 'Feeds'}} // フィード一覧画面へ遷移
              hitSlop={HITSLOP_10} // タップ領域を10px拡張（タップしやすさ向上）
              label={_(msg`View your feeds and explore more`)} // アクセシビリティラベル
              size="small"
              variant="ghost" // ゴーストボタン（背景なし）
              color="secondary" // セカンダリカラー
              shape="square" // 正方形
              style={[
                a.justify_center,
                {marginRight: -Layout.BUTTON_VISUAL_ALIGNMENT_OFFSET}, // ボタン視覚的整列オフセット
              ]}>
              <ButtonIcon icon={FeedsIcon} size="lg" />
            </Link>
          )}
        </Layout.Header.Slot>
      </Layout.Header.Outer>
      {children} {/* 子要素（タブバーなど）を描画 */}
    </Animated.View>
  )
}
