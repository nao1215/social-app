// ルート型定義をインポート
// Import route type definitions
import {type Route, type RouteParams} from './types'

/**
 * ルーティング管理クラス
 * Router management class
 *
 * 【主な機能】
 * - URL パターンマッチングと画面名の対応管理
 * - パラメータ抽出とクエリストリング処理
 * - 動的ルート生成とリバースルーティング
 * - 複数パターン対応（同一画面に複数URL）
 *
 * Key features:
 * - URL pattern matching and screen name mapping management
 * - Parameter extraction and query string processing
 * - Dynamic route generation and reverse routing
 * - Multiple pattern support (multiple URLs for the same screen)
 *
 * 【使用場面】
 * - アプリ内ナビゲーションの中枢管理
 * - Deep Link処理とURL解析
 * - SEO対応のURL生成
 *
 * Use cases:
 * - Central management of in-app navigation
 * - Deep Link processing and URL parsing
 * - SEO-friendly URL generation
 *
 * 【技術的詳細】
 * - 正規表現ベースの高速なパターンマッチング
 * - TypeScript型安全性を保った柔軟なルート定義
 * - URLSearchParamsによるクエリストリング処理
 *
 * Technical details:
 * - Fast pattern matching based on regular expressions
 * - Flexible route definitions maintaining TypeScript type safety
 * - Query string processing using URLSearchParams
 *
 * 【Goユーザー向け補足】
 * - class はGoのstructに相当するが、メソッドとデータを一緒に定義
 * - ジェネリクス<T> はGoのtype parametersに相当
 * - constructor はGoの初期化関数に相当
 *
 * @template T ルート名とパターンの型定義 / Type definition of route names and patterns
 */
export class Router<T extends Record<string, any>> {
  // ルート定義の配列：[画面名, Routeオブジェクト] のタプル配列
  // Array of route definitions: tuple array of [screen name, Route object]
  routes: [string, Route][] = []

  /**
   * コンストラクタ
   * Constructor
   *
   * ルート定義オブジェクトを受け取り、各パターンをRouteオブジェクトに変換して登録します。
   * Receives route definition object, converts each pattern to Route object and registers them.
   *
   * 【処理フロー】
   * 1. ルート定義オブジェクトの各エントリを反復処理
   * 2. パターンが文字列の場合：単一のRouteオブジェクトを作成
   * 3. パターンが配列の場合：各パターンごとにRouteオブジェクトを作成
   * 4. 全てのRouteオブジェクトをroutes配列に追加
   *
   * 【Goユーザー向け補足】
   * - Object.entries() はGoのrange mapに相当
   * - typeof でランタイム型チェック（Goの型アサーションに近い）
   * - forEach はGoのfor range loopに相当
   *
   * @param description ルート定義オブジェクト / Route definition object
   */
  constructor(description: Record<keyof T, string | string[]>) {
    // ルート定義の各エントリを反復処理
    // Iterate over each entry in route definition
    for (const [screen, pattern] of Object.entries(description)) {
      if (typeof pattern === 'string') {
        // 単一パターンの場合、直接登録
        // For single pattern, register directly
        this.routes.push([screen, createRoute(pattern)])
      } else {
        // 複数パターンの場合、各パターンを個別に登録
        // For multiple patterns, register each pattern individually
        pattern.forEach(subPattern => {
          this.routes.push([screen, createRoute(subPattern)])
        })
      }
    }
  }

  /**
   * 画面名からRouteオブジェクトを取得するメソッド
   * Method to get Route object from screen name
   *
   * リバースルーティング（画面名→URL）に使用されます。
   * Used for reverse routing (screen name → URL).
   *
   * 【Goユーザー向け補足】
   * - (string & {}) はTypeScriptのトリックで、文字列リテラル型と通常のstringの両方を許可
   * - undefined を返す可能性があるため、呼び出し側でnilチェックが必要
   *
   * @param name 画面名 / Screen name
   * @returns Routeオブジェクト（見つからない場合undefined） / Route object (undefined if not found)
   */
  matchName(name: keyof T | (string & {})): Route | undefined {
    // 全ルート定義を線形探索
    // Linear search through all route definitions
    for (const [screenName, route] of this.routes) {
      if (screenName === name) {
        return route // マッチしたRouteを返す / Return matched Route
      }
    }
    // 見つからない場合はundefinedを返す（暗黙的） / Return undefined if not found (implicit)
  }

  /**
   * URLパスから画面名とパラメータを取得するメソッド
   * Method to get screen name and parameters from URL path
   *
   * Deep LinkやURL遷移時に、URLをパースして適切な画面とパラメータを特定します。
   * Parses URL to identify appropriate screen and parameters during Deep Link or URL navigation.
   *
   * 【処理フロー】
   * 1. デフォルトで'NotFound'を設定（マッチしない場合）
   * 2. 全ルート定義を順に試行
   * 3. 最初にマッチしたルートの画面名とパラメータを返す
   * 4. どれもマッチしない場合は'NotFound'を返す
   *
   * 【Goユーザー向け補足】
   * - タプル型 [string, RouteParams] はGoの複数戻り値に相当
   * - break でループを早期終了（Goと同じ）
   *
   * @param path URLパス / URL path
   * @returns [画面名, パラメータ] のタプル / Tuple of [screen name, parameters]
   */
  matchPath(path: string): [string, RouteParams] {
    // デフォルト値を設定（マッチしない場合用）
    // Set default values (for no match case)
    let name = 'NotFound'
    let params: RouteParams = {}

    // 全ルート定義を順に試行
    // Try all route definitions in order
    for (const [screenName, route] of this.routes) {
      const res = route.match(path) // URLとパターンをマッチング / Match URL with pattern
      if (res) {
        // マッチした場合、画面名とパラメータを設定して終了
        // If matched, set screen name and parameters and exit
        name = screenName
        params = res.params
        break // 最初のマッチで終了 / Exit at first match
      }
    }
    // 画面名とパラメータのタプルを返す / Return tuple of screen name and parameters
    return [name, params]
  }
}

/**
 * URLパターンからRouteオブジェクトを生成する関数
 * Function to generate Route object from URL pattern
 *
 * パターン文字列（例: '/profile/:name'）から、マッチング用の正規表現と
 * URL生成関数を持つRouteオブジェクトを生成します。
 *
 * Generates Route object with matching regex and URL generation function
 * from pattern string (e.g., '/profile/:name').
 *
 * 【処理フロー】
 * 1. パターン内のパスパラメータ（:name形式）を抽出
 * 2. 各パラメータを名前付きキャプチャグループに変換
 * 3. 正規表現オブジェクトを生成
 * 4. matchメソッド：URLをパースしてパラメータを抽出
 * 5. buildメソッド：パラメータからURLを構築
 *
 * 【正規表現パターン変換例】
 * 入力: '/profile/:name/posts/:rkey'
 * 出力: '^/profile/(?<name>[^/]+)/posts/(?<rkey>[^/]+)([?]|$)'
 *
 * 【Goユーザー向け補足】
 * - 正規表現 /:([\w]+)/g の説明:
 *   - /: 正規表現リテラルの開始（Goのregexp.MustCompile相当）
 *   - : コロンにマッチ
 *   - ([\w]+): \w（単語文字：a-z,A-Z,0-9,_）の1文字以上をキャプチャ
 *   - /g: グローバルフラグ（全てのマッチを置換）
 * - Set<string> はGoのmap[string]struct{}に相当（重複のないコレクション）
 * - 名前付きキャプチャグループ (?<name>...) はGo 1.18+でもサポート
 *
 * @param pattern URLパターン文字列（例: '/profile/:name'） / URL pattern string (e.g., '/profile/:name')
 * @returns Routeオブジェクト / Route object
 */
function createRoute(pattern: string): Route {
  // パスパラメータ名を格納するSet（重複排除）
  // Set to store path parameter names (deduplication)
  const pathParamNames: Set<string> = new Set()

  // パターン文字列内の :name 形式を名前付きキャプチャグループに変換
  // Convert :name format in pattern string to named capture groups
  // 正規表現 /:([\w]+)/g:
  // - : をマッチ、続く単語文字列をキャプチャし、(?<name>[^/]+) に置換
  // - [^/]+ は「/以外の1文字以上」を意味（パスセグメント内の文字列）
  let matcherReInternal = pattern.replace(/:([\w]+)/g, (_m, name) => {
    pathParamNames.add(name) // パラメータ名をSetに追加 / Add parameter name to Set
    return `(?<${name}>[^/]+)` // 名前付きキャプチャグループを返す / Return named capture group
  })

  // 最終的な正規表現を生成（^で行頭、([?]|$)でクエリ開始または行末）
  // Generate final regex (^ for line start, ([?]|$) for query start or line end)
  // 'i' フラグで大文字小文字を区別しない / 'i' flag for case-insensitive matching
  const matcherRe = new RegExp(`^${matcherReInternal}([?]|$)`, 'i')

  // Routeオブジェクトを返す
  // Return Route object
  return {
    /**
     * URLをマッチングしてパラメータを抽出するメソッド
     * Method to match URL and extract parameters
     *
     * 【処理フロー】
     * 1. URL文字列をパースしてパス名とクエリパラメータを分離
     * 2. クエリパラメータをオブジェクトに変換
     * 3. パス名を正規表現でマッチング
     * 4. パスパラメータとクエリパラメータをマージして返す
     *
     * @param path URLパス文字列 / URL path string
     * @returns マッチング結果（パラメータオブジェクト） / Matching result (parameters object)
     */
    match(path) {
      // URLをパースしてパス名とクエリパラメータを取得
      // Parse URL to get pathname and query parameters
      // 'http://throwaway.com' はダミーベースURL（相対パスをパースするため）
      // 'http://throwaway.com' is dummy base URL (to parse relative paths)
      const {pathname, searchParams} = new URL(path, 'http://throwaway.com')

      // クエリパラメータをオブジェクトに変換
      // Convert query parameters to object
      const addedParams = Object.fromEntries(searchParams.entries())

      // パス名を正規表現でマッチング
      // Match pathname with regex
      const res = matcherRe.exec(pathname)
      if (res) {
        // マッチした場合、クエリパラメータとパスパラメータをマージ
        // If matched, merge query parameters and path parameters
        // res.groups には名前付きキャプチャグループの結果が格納される
        // res.groups contains results of named capture groups
        return {params: Object.assign(addedParams, res.groups || {})}
      }
      // マッチしない場合はundefinedを返す
      // Return undefined if no match
      return undefined
    },

    /**
     * パラメータからURLを構築するメソッド
     * Method to build URL from parameters
     *
     * 【処理フロー】
     * 1. パターン文字列内の :name を実際のパラメータ値で置換
     * 2. パスパラメータ以外のパラメータをクエリストリングに追加
     * 3. パス + クエリストリングを結合して返す
     *
     * 【Goユーザー向け補足】
     * - URLSearchParams はクエリストリングのビルダー（Goのurl.Valuesに相当）
     * - encodeURIComponent は URL エンコード（Goのurl.QueryEscapeに相当）
     *
     * @param params パラメータオブジェクト / Parameters object
     * @returns 構築されたURL文字列 / Built URL string
     */
    build(params = {}) {
      // パターン文字列内の :name を実際の値で置換
      // Replace :name in pattern string with actual values
      const str = pattern.replace(
        /:([\w]+)/g,
        (_m, name) => params[encodeURIComponent(name)] || 'undefined',
      )

      // クエリパラメータを構築
      // Build query parameters
      let hasQp = false // クエリパラメータが存在するかのフラグ / Flag for query parameter existence
      const qp = new URLSearchParams()
      // パスパラメータ以外をクエリパラメータとして追加
      // Add parameters other than path parameters as query parameters
      for (const paramName in params) {
        if (!pathParamNames.has(paramName)) {
          qp.set(paramName, params[paramName])
          hasQp = true
        }
      }

      // パス + クエリストリング（存在する場合）を返す
      // Return path + query string (if exists)
      return str + (hasQp ? `?${qp.toString()}` : '')
    },
  }
}
