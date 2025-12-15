/**
 * ホーム画面ヘッダーコンポーネント
 *
 * 【モジュール概要】
 * ホーム画面上部に表示されるタブバーを含むヘッダーコンポーネント。
 * フォローフィードやカスタムフィードのタブ切り替え機能を提供。
 *
 * 【主な機能】
 * - タブバー表示とタブ切り替え
 * - カスタムフィード未ピン時の「Feeds ✨」タブ自動追加
 * - フィード画面へのナビゲーション
 * - タブ選択時のコールバック処理
 *
 * 【Go開発者向け補足】
 * - React: UIライブラリ（Goのテンプレートエンジンに相当）
 * - useNavigation: React Navigation用のフック（画面遷移制御）
 * - useMemo: 計算結果のメモ化（不要な再計算を防ぐ最適化）
 * - useCallback: 関数のメモ化（不要な再生成を防ぐ最適化）
 */
import React from 'react' // Reactライブラリ（JSX記法とコンポーネント機能を提供）
import {useNavigation} from '@react-navigation/native' // React Navigationフック（画面遷移を制御）

import {type NavigationProp} from '#/lib/routes/types' // ナビゲーションプロパティの型定義
import {type FeedSourceInfo} from '#/state/queries/feed' // フィード情報の型定義
import {useSession} from '#/state/session' // セッション状態管理フック（ログイン状態を取得）
import {type RenderTabBarFnProps} from '#/view/com/pager/Pager' // タブバーレンダリング関数のプロパティ型
import {TabBar} from '../pager/TabBar' // タブバーコンポーネント
import {HomeHeaderLayout} from './HomeHeaderLayout' // ホームヘッダーレイアウトコンポーネント

/**
 * HomeHeader - ホーム画面ヘッダーコンポーネント
 *
 * 【機能説明】
 * フォローフィード・カスタムフィードを切り替えるタブバーを表示。
 * カスタムフィードがピン留めされていない場合、「Feeds ✨」タブを自動追加し、
 * タップ時にフィード一覧画面へ遷移する。
 *
 * 【Go開発者向け補足】
 * - props: 関数の引数に相当（TypeScriptの型定義で構造を指定）
 * - RenderTabBarFnProps & {...}: 型の交差（Goのembeddingに類似）
 *
 * @param props - タブバー設定、フィード情報、コールバック関数
 * @returns JSX要素 - ホームヘッダー（タブバーを含む）
 */
export function HomeHeader(
  props: RenderTabBarFnProps & {
    testID?: string // テストID（E2Eテスト用）
    onPressSelected: () => void // 選択中タブ再タップ時のコールバック
    feeds: FeedSourceInfo[] // 表示するフィード情報の配列
  },
) {
  const {feeds, onSelect: onSelectProp} = props // propsから必要な値を分割代入
  const {hasSession} = useSession() // セッション状態を取得（ログインしているか確認）
  const navigation = useNavigation<NavigationProp>() // ナビゲーションオブジェクト取得

  /**
   * カスタムフィードがピン留めされているかチェック
   *
   * 【Go開発者向け補足】
   * - useMemo: 依存配列の値が変わらない限り、前回の計算結果を再利用
   *   （Goでキャッシュ変数を使う最適化に類似）
   * - React.useMemo<boolean>: 戻り値の型を明示
   * - feeds.some(): 配列要素が条件を満たすかチェック（Goのforループ+真偽値判定）
   */
  const hasPinnedCustom = React.useMemo<boolean>(() => {
    if (!hasSession) return false // 未ログイン時はfalse
    return feeds.some(tab => {
      const isFollowing = tab.uri === 'following' // フォローフィードかチェック
      return !isFollowing // フォローフィード以外が存在すればtrue
    })
  }, [feeds, hasSession]) // feedsまたはhasSessionが変更時に再計算

  /**
   * タブバーに表示するアイテム（タブ名）を生成
   *
   * カスタムフィードがない場合、「Feeds ✨」タブを追加し、
   * タップ時にフィード一覧画面へ遷移できるようにする。
   */
  const items = React.useMemo(() => {
    const pinnedNames = feeds.map(f => f.displayName) // フィードの表示名を抽出
    if (!hasPinnedCustom) {
      return pinnedNames.concat('Feeds ✨') // カスタムフィードなしの場合、探索用タブ追加
    }
    return pinnedNames
  }, [hasPinnedCustom, feeds])

  /**
   * フィード一覧画面へ遷移する関数
   *
   * 【Go開発者向け補足】
   * - useCallback: 関数のメモ化フック（依存配列が変わらない限り同じ関数を返す）
   *   再レンダリング時の不要な関数再生成を防ぐ最適化
   */
  const onPressFeedsLink = React.useCallback(() => {
    navigation.navigate('Feeds') // 'Feeds'画面へ遷移
  }, [navigation])

  /**
   * タブ選択時のハンドラー
   *
   * カスタムフィードがない状態で最後のタブ（「Feeds ✨」）を選択した場合、
   * フィード一覧画面へ遷移。それ以外は通常のタブ切り替え処理を実行。
   */
  const onSelect = React.useCallback(
    (index: number) => {
      // カスタムフィードなし＆最後のタブ（「Feeds ✨」）選択時
      if (!hasPinnedCustom && index === items.length - 1) {
        onPressFeedsLink() // フィード一覧画面へ遷移
      } else if (onSelectProp) {
        onSelectProp(index) // 通常のタブ切り替え処理
      }
    },
    [items.length, onPressFeedsLink, onSelectProp, hasPinnedCustom],
  )

  /**
   * JSX: JavaScriptでHTMLライクな構文を記述（Go開発者向け補足）
   *
   * - <Component />: コンポーネントのレンダリング（Goのテンプレート呼び出しに類似）
   * - prop={value}: コンポーネントへのデータ渡し（Goの関数引数に相当）
   * - return: 描画するUI要素を返す
   */
  return (
    <HomeHeaderLayout tabBarAnchor={props.tabBarAnchor}>
      <TabBar
        key={items.join(',')} // Reactのkey属性（リスト要素の一意識別子）
        onPressSelected={props.onPressSelected}
        selectedPage={props.selectedPage}
        onSelect={onSelect}
        testID={props.testID}
        items={items} // 表示するタブ名の配列
        dragProgress={props.dragProgress}
        dragState={props.dragState}
      />
    </HomeHeaderLayout>
  )
}
