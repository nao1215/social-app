// Reactライブラリをインポート / Import React library
import React from 'react'

// プラットフォーム判定機能（Web判定）をインポート / Import platform detection functionality (Web detection)
import {isWeb} from '#/platform/detection'
// 永続化ストレージ機能をインポート / Import persistent storage functionality
import * as persisted from '#/state/persisted'
// フィード識別子の型定義をインポート / Import feed descriptor type definition
import {type FeedDescriptor} from '#/state/queries/post-feed'

// 選択されたフィード状態のコンテキスト型（フィード記述子またはnull） / Type for selected feed state context (feed descriptor or null)
type StateContext = FeedDescriptor | null
// フィード選択設定関数のコンテキスト型 / Type for feed selection setting function context
type SetContext = (v: FeedDescriptor) => void

// 選択されたフィード状態管理のReactコンテキスト（初期値はnull） / React context for selected feed state management (initial value is null)
const stateContext = React.createContext<StateContext>(null)
stateContext.displayName = 'SelectedFeedStateContext'
// フィード選択設定のReactコンテキスト（デフォルトは何もしない関数） / React context for feed selection setting (default is no-op function)
const setContext = React.createContext<SetContext>((_: string) => {})
setContext.displayName = 'SelectedFeedSetContext'

/**
 * 初期フィードを取得する関数
 * 優先順位：URL > セッションストレージ > 永続化ストレージ > null
 * 
 * Function to get initial feed
 * Priority: URL > session storage > persistent storage > null
 * 
 * @returns 初期フィード記述子またはnull / Initial feed descriptor or null
 */
function getInitialFeed(): FeedDescriptor | null {
  if (isWeb) {
    // Web環境でホームページ（ルート）にいる場合 / If in web environment and on homepage (root)
    if (window.location.pathname === '/') {
      const params = new URLSearchParams(window.location.search)
      const feedFromUrl = params.get('feed')
      if (feedFromUrl) {
        // /?feed=... のようなリンクから明示的に起動された場合はそれを優先 / If explicitly booted from a link like /?feed=..., prefer that
        return feedFromUrl as FeedDescriptor
      }
    }

    // セッションストレージから以前選択されたフィードを取得 / Get previously selected feed from session storage
    const feedFromSession = sessionStorage.getItem('lastSelectedHomeFeed')
    if (feedFromSession) {
      // このブラウザタブで以前選択されたフィードにフォールバック / Fall back to a previously chosen feed for this browser tab
      return feedFromSession as FeedDescriptor
    }
  }

  // 永続化ストレージから最後に選択されたフィードを取得 / Get last selected feed from persistent storage
  const feedFromPersisted = persisted.get('lastSelectedHomeFeed')
  if (feedFromPersisted) {
    // 全タブで最後に選択されたフィードにフォールバック / Fall back to the last chosen one across all tabs
    return feedFromPersisted as FeedDescriptor
  }

  // どこからも見つからない場合はnull / Return null if not found anywhere
  return null
}

/**
 * 選択されたフィード（投稿タイムライン）の状態管理プロバイダーコンポーネント
 * ユーザーが選択したホームフィードを記憶し、複数のストレージに保存する
 * 
 * Selected feed (post timeline) state management provider component
 * Remembers user-selected home feed and saves it to multiple storage locations
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(() => getInitialFeed()) // 初期フィードを取得して状態として設定 / Get initial feed and set as state

  // フィード保存関数（セッションと永続化ストレージに保存） / Feed saving function (save to session and persistent storage)
  const saveState = React.useCallback((feed: FeedDescriptor) => {
    setState(feed) // ローカル状態を更新 / Update local state
    
    if (isWeb) {
      try {
        // Web環境ではセッションストレージにも保存（タブ単位で記憶） / In web environment, also save to session storage (remember per tab)
        sessionStorage.setItem('lastSelectedHomeFeed', feed)
      } catch {} // セッションストレージが使えない場合は無視 / Ignore if session storage is not available
    }
    
    // 永続化ストレージに保存（全タブ・全セッションで共有） / Save to persistent storage (shared across all tabs and sessions)
    persisted.write('lastSelectedHomeFeed', feed)
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={saveState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * 現在選択されているフィードを取得するカスタムフック
 * Custom hook to get currently selected feed
 * 
 * @returns 選択されたフィード記述子またはnull / Selected feed descriptor or null
 */
export function useSelectedFeed() {
  return React.useContext(stateContext)
}

/**
 * フィード選択を設定する機能を取得するカスタムフック
 * Custom hook to get functionality for setting feed selection
 * 
 * @returns フィード設定関数（ストレージ保存付き） / Feed setting function (with storage saving)
 */
export function useSetSelectedFeed() {
  return React.useContext(setContext)
}
