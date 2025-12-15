/**
 * ルーティングヘルパーユーティリティモジュール
 * Routing helper utilities module
 *
 * 【主な機能】
 * - ナビゲーション階層の操作（ルートナビゲーション取得、現在ルート判定）
 * - タブ状態の管理と判定
 * - ナビゲーション状態オブジェクトの構築
 *
 * 【使用場面】
 * - アプリ全体のナビゲーション制御
 * - タブバーの表示/非表示制御
 * - Deep Link処理時のナビゲーション状態復元
 *
 * 【技術詳細】
 * - React Navigationのナビゲーション階層を再帰的に探索
 * - タブルートの複数命名規則（Home/HomeTab/HomeInner）を統一的に処理
 * - ネストしたナビゲーターの状態を適切に管理
 */

// React Navigationのナビゲーションプロパティ型をインポート
// TypeScriptの型安全性を保ちながらナビゲーション操作を行うために使用
// Import navigation property type from React Navigation
// Used to perform navigation operations while maintaining TypeScript type safety
import {NavigationProp} from '@react-navigation/native'

// ルーティング関連の型定義をインポート
// Import routing-related type definitions
import {RouteParams, State} from './types'

/**
 * ルートナビゲーションを取得する関数
 * Function to get root navigation
 *
 * ナビゲーション階層のツリーを最上位まで遡り、ルートナビゲーターを取得します。
 * ネストしたナビゲーター（タブナビゲーター内のスタックナビゲーターなど）から
 * 最上位のナビゲーターにアクセスする際に使用します。
 *
 * Traverses the navigation tree upward to retrieve the root navigator.
 * Used to access the top-level navigator from nested navigators
 * (e.g., stack navigator within a tab navigator).
 *
 * 【Goユーザー向け補足】
 * - ジェネリクス型 <T extends {}> はGoのtype constraintに相当
 * - while文でツリーを再帰的に遡る処理（Goでも同様の実装が可能）
 * - 親ナビゲーターがnullになるまでループ
 *
 * @template T ナビゲーターのパラメータ型 / Navigator parameter type
 * @param nav 現在のナビゲーションオブジェクト / Current navigation object
 * @returns ルートナビゲーションオブジェクト / Root navigation object
 */
export function getRootNavigation<T extends {}>(
  nav: NavigationProp<T>,
): NavigationProp<T> {
  // 親ナビゲーターが存在する限り、上に遡る
  // Traverse upward as long as a parent navigator exists
  while (nav.getParent()) {
    nav = nav.getParent()
  }
  // 最上位のナビゲーターを返す
  // Return the top-level navigator
  return nav
}

/**
 * 現在アクティブなルートを取得する関数
 * Function to get currently active route
 *
 * ナビゲーション状態ツリーをたどり、最も深くネストした
 * 現在アクティブなルートを取得します。
 *
 * Traverses the navigation state tree to get the deepest
 * currently active route.
 *
 * 【処理フロー】
 * 1. 状態が未定義の場合はデフォルトでHomeを返す（初期化時）
 * 2. 現在のインデックスのルートから開始
 * 3. ネストした状態が存在する限り、深く潜る
 * 4. 最も深い階層のルートを返す
 *
 * 【Goユーザー向け補足】
 * - state?: State はGoのポインタ型 *State に相当（nilの可能性あり）
 * - オプショナルチェイニング (?.) はGoのnilチェックに相当
 * - while文で再帰的にネストを探索
 *
 * @param state ナビゲーション状態オブジェクト / Navigation state object
 * @returns 現在のルート情報 / Current route information
 */
export function getCurrentRoute(state?: State) {
  // 状態が未定義の場合、初期化中とみなしてHomeを返す
  // If state is undefined, consider it as initializing and return Home
  if (!state) {
    return {name: 'Home'}
  }

  // 現在のインデックス（デフォルト0）のルートを取得
  // Get the route at current index (default 0)
  let node = state.routes[state.index || 0]
  // ネストした状態が存在する限り、最深部まで探索
  // Explore to the deepest level as long as nested state exists
  while (node.state?.routes && typeof node.state?.index === 'number') {
    node = node.state?.routes[node.state?.index]
  }
  // 最も深くネストしたルートを返す
  // Return the most deeply nested route
  return node
}

/**
 * 現在の状態がタブのルート画面にあるかを判定する関数
 * Function to determine if current state is at tab root screen
 *
 * タブナビゲーターのルート画面（Home, Search, Messages, Notifications, MyProfile）
 * のいずれかにいるかを判定します。タブバーの表示制御などに使用されます。
 *
 * Determines if we are at one of the tab navigator root screens
 * (Home, Search, Messages, Notifications, MyProfile).
 * Used for tab bar display control, etc.
 *
 * 【判定ロジック】
 * - 状態が未定義の場合：true（初期化中のため、ルートにいると仮定）
 * - それ以外：5つのタブルートのいずれかにいるかをチェック
 *
 * 【Goユーザー向け補足】
 * - 複数の条件をOR (||) で結合して判定
 * - 早期リターンパターンを使用
 *
 * @param state ナビゲーション状態オブジェクト / Navigation state object
 * @returns タブルートにいる場合true / true if at tab root
 */
export function isStateAtTabRoot(state: State | undefined) {
  if (!state) {
    // 注意：
    // 状態が未定義の場合、初期化が進行中であることを意味するため、
    // 安全にルートにいると仮定できる
    // NOTE:
    // If state is not defined it's because init is occurring
    // and therefore we can safely assume we're at root
    // -prf
    return true
  }
  // 現在のルートを取得
  // Get current route
  const currentRoute = getCurrentRoute(state)
  // 5つのタブルートのいずれかにいるかを判定
  // Check if we're at any of the five tab roots
  return (
    isTab(currentRoute.name, 'Home') ||
    isTab(currentRoute.name, 'Search') ||
    isTab(currentRoute.name, 'Messages') ||
    isTab(currentRoute.name, 'Notifications') ||
    isTab(currentRoute.name, 'MyProfile')
  )
}

/**
 * タブルート名の3種類の命名規則を統一的に判定する関数
 * Function to uniformly determine tab route name across 3 naming conventions
 *
 * タブルートは実装の都合上、以下の3パターンで参照されることがあります：
 * - 基本形：'Home'
 * - タブ接尾辞付き：'HomeTab'
 * - Inner接尾辞付き：'HomeInner'
 *
 * Tab routes may be referenced in 3 patterns due to implementation:
 * - Base form: 'Home'
 * - With Tab suffix: 'HomeTab'
 * - With Inner suffix: 'HomeInner'
 *
 * この関数はこれらの命名のばらつきを吸収し、統一的に判定します。
 * This function absorbs these naming variations for uniform determination.
 *
 * 【Goユーザー向け補足】
 * - テンプレートリテラル `${route}Tab` はGoのfmt.Sprintf("%sTab", route)に相当
 * - 文字列連結によるパターンマッチング
 *
 * @param current 現在のルート名 / Current route name
 * @param route 判定対象のベースルート名 / Base route name to check
 * @returns タブルートの場合true / true if it's a tab route
 */
export function isTab(current: string, route: string) {
  // 注意：
  // タブルートは3つの異なる名前で参照される可能性がある
  // このヘルパーはその奇妙さに対処する
  // NOTE:
  // Our tab routes can be variously referenced by 3 different names
  // This helper deals with that weirdness
  // -prf
  return (
    current === route || // 基本形 / Base form
    current === `${route}Tab` || // Tab接尾辞 / Tab suffix
    current === `${route}Inner` // Inner接尾辞 / Inner suffix
  )
}

/**
 * タブの状態を表す列挙型
 * Enum representing tab state
 *
 * 【Goユーザー向け補足】
 * - TypeScriptのenumはGoのiota constに相当
 * - 数値型の列挙値を持つ
 */
export enum TabState {
  InsideAtRoot, // タブのルート画面にいる / At tab root screen
  Inside, // タブ内の子画面にいる / Inside tab at child screen
  Outside, // タブの外にいる / Outside the tab
}

/**
 * 指定したタブの状態を取得する関数
 * Function to get the state of specified tab
 *
 * 現在のナビゲーション状態から、指定されたタブに対する位置関係を判定します。
 * Determines the positional relationship with the specified tab from current navigation state.
 *
 * 【判定ロジック】
 * 1. 状態が未定義：Outside（タブ外）
 * 2. 現在のルートがタブのルート：InsideAtRoot（タブルート）
 * 3. タブのスタック内の子画面：Inside（タブ内）
 * 4. それ以外：Outside（タブ外）
 *
 * @param state ナビゲーション状態 / Navigation state
 * @param tab タブ名 / Tab name
 * @returns タブの状態 / Tab state
 */
export function getTabState(state: State | undefined, tab: string): TabState {
  // 状態が未定義の場合、タブ外とみなす
  // If state is undefined, consider it outside the tab
  if (!state) {
    return TabState.Outside
  }
  // 現在の最深ルートを取得
  // Get the current deepest route
  const currentRoute = getCurrentRoute(state)
  // 現在のルートがタブのルートか判定
  // Check if current route is the tab root
  if (isTab(currentRoute.name, tab)) {
    return TabState.InsideAtRoot // タブルートにいる / At tab root
  } else if (isTab(state.routes[state.index || 0].name, tab)) {
    // タブのスタック内にいる（子画面） / Inside tab stack (child screen)
    return TabState.Inside
  }
  // タブの外にいる / Outside the tab
  return TabState.Outside
}

/**
 * 既存のナビゲーション状態を表す型
 * Type representing existing navigation state
 *
 * 【Goユーザー向け補足】
 * - TypeScriptのtype aliasはGoのtype定義に相当
 * - interface との違い: typeは任意の型に別名を付けられる
 * - params?: はGoの *RouteParams（ポインタ型、nilの可能性）に相当
 */
type ExistingState = {
  name: string // ルート名 / Route name
  params?: RouteParams // オプショナルなパラメータ / Optional parameters
}

/**
 * ナビゲーション状態オブジェクトを構築する関数
 * Function to build navigation state object
 *
 * Deep LinkやプログラマティックなナビゲーションのためのReact Navigation状態オブジェクトを生成します。
 * Generates React Navigation state object for Deep Link or programmatic navigation.
 *
 * 【処理の分岐】
 * 1. stack === 'Flat'の場合：
 *    - フラットなルート構造を生成（ネストなし）
 *    - 単一の画面への直接ナビゲーション用
 *
 * 2. それ以外の場合：
 *    - ネストしたナビゲーター構造を生成
 *    - スタック名を親として、既存の状態に新しいルートを追加
 *    - タブナビゲーター内のスタックナビゲーションなどに使用
 *
 * 【使用例】
 * buildStateObject('HomeTab', 'Profile', {name: 'alice.bsky.social'})
 * → HomeTabスタック内のProfileルートに遷移する状態を生成
 *
 * 【Goユーザー向け補足】
 * - スプレッド構文 ...state はGoのappendに相当（配列の展開と結合）
 * - オブジェクトリテラルはGoのstructリテラルに相当
 *
 * @param stack スタック名（'Flat'で非ネスト） / Stack name ('Flat' for non-nested)
 * @param route ルート名 / Route name
 * @param params ルートパラメータ / Route parameters
 * @param state 既存の状態配列（デフォルト空配列） / Existing state array (default empty)
 * @returns ナビゲーション状態オブジェクト / Navigation state object
 */
export function buildStateObject(
  stack: string,
  route: string,
  params: RouteParams,
  state: ExistingState[] = [],
) {
  // Flatスタックの場合、フラットな構造を返す
  // For Flat stack, return flat structure
  if (stack === 'Flat') {
    return {
      routes: [{name: route, params}],
    }
  }
  // ネストしたナビゲーター構造を返す
  // Return nested navigator structure
  return {
    routes: [
      {
        name: stack, // 親スタック名 / Parent stack name
        state: {
          // 既存の状態に新しいルートを追加
          // Add new route to existing state
          routes: [...state, {name: route, params}],
        },
      },
    ],
  }
}
