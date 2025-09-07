// Reactライブラリをインポート / Import React library
import React from 'react'
// ATProtoのActor、Feed、スレッド、モデレーション関連の型定義をインポート / Import ATProto Actor, Feed, thread, and moderation related type definitions
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
  type ModerationDecision,
} from '@atproto/api'
// 国際化メッセージ機能をインポート / Import internationalization message functionality
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// ReactQueryのクライアントフックをインポート / Import ReactQuery client hook
import {useQueryClient} from '@tanstack/react-query'

// リアクティブでないコールバックフック（最適化用）をインポート / Import non-reactive callback hook (for optimization)
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
// 投稿URIからパス変換と外部URL生成のユーティリティをインポート / Import utilities for converting post URIs to paths and generating external URLs
import {postUriToRelativePath, toBskyAppUrl} from '#/lib/strings/url-helpers'
// ギャラリーの一時画像ファイル削除機能をインポート / Import gallery temporary image file purging functionality
import {purgeTemporaryImageFiles} from '#/state/gallery'
// リンク解決クエリのプリキャッシュ機能をインポート / Import link resolution query precaching functionality
import {precacheResolveLinkQuery} from '#/state/queries/resolve-link'
// 絵文字ピッカーの表示位置の型定義をインポート / Import emoji picker display position type definitions
import {type EmojiPickerPosition} from '#/view/com/composer/text-input/web/EmojiPicker'
// トースト通知機能をインポート / Import toast notification functionality
import * as Toast from '#/view/com/util/Toast'

/**
 * コンポーザーで参照される投稿の情報を定義するインターフェース
 * Interface defining information for posts referenced in the composer
 */
export interface ComposerOptsPostRef {
  uri: string // 投稿のURI / Post URI
  cid: string // 投稿のコンテンツ識別子 / Post content identifier
  text: string // 投稿のテキスト内容 / Post text content
  langs?: string[] // 投稿の言語コード（オプション） / Post language codes (optional)
  author: AppBskyActorDefs.ProfileViewBasic // 投稿者のプロフィール情報 / Author profile information
  embed?: AppBskyFeedDefs.PostView['embed'] // 埋め込みコンテンツ（オプション） / Embedded content (optional)
  moderation?: ModerationDecision // モデレーション判定（オプション） / Moderation decision (optional)
}

/**
 * 投稿成功時のコールバックデータ型
 * Callback data type for successful post creation
 */
export type OnPostSuccessData =
  | {
      replyToUri?: string // 返信先の投稿URI（オプション） / URI of the post being replied to (optional)
      posts: AppBskyUnspeccedGetPostThreadV2.ThreadItem[] // 投稿スレッドのアイテム一覧 / List of post thread items
    }
  | undefined

/**
 * コンポーザー（投稿作成）の設定オプションを定義するインターフェース
 * Interface defining configuration options for the composer (post creation)
 */
export interface ComposerOpts {
  replyTo?: ComposerOptsPostRef // 返信対象の投稿（オプション） / Post being replied to (optional)
  onPost?: (postUri: string | undefined) => void // 投稿実行時のコールバック / Callback when post is created
  onPostSuccess?: (data: OnPostSuccessData) => void // 投稿成功時のコールバック / Callback when post creation succeeds
  quote?: AppBskyFeedDefs.PostView // 引用対象の投稿（オプション） / Post being quoted (optional)
  mention?: string // メンション対象ユーザーのハンドル名 / Handle of user to mention
  openEmojiPicker?: (pos: EmojiPickerPosition | undefined) => void // 絵文字ピッカー開く機能 / Function to open emoji picker
  text?: string // 初期テキスト内容（オプション） / Initial text content (optional)
  imageUris?: {uri: string; width: number; height: number; altText?: string}[] // 添付画像のURI一覧（オプション） / List of attached image URIs (optional)
  videoUri?: {uri: string; width: number; height: number} // 添付動画のURI（オプション） / Attached video URI (optional)
}

// コンポーザーの状態を管理するコンテキストの型 / Type for context managing composer state
type StateContext = ComposerOpts | undefined
// コンポーザーの操作を管理するコンテキストの型 / Type for context managing composer controls
type ControlsContext = {
  openComposer: (opts: ComposerOpts) => void // コンポーザーを開く機能 / Function to open composer
  closeComposer: () => boolean // コンポーザーを閉じる機能（開いていたかの真偽値を返す） / Function to close composer (returns boolean indicating if it was open)
}

// コンポーザーの状態を管理するReactコンテキストを作成 / Create React context for managing composer state
const stateContext = React.createContext<StateContext>(undefined)
stateContext.displayName = 'ComposerStateContext'
// コンポーザーの操作を管理するReactコンテキストを作成（デフォルト値付き） / Create React context for managing composer controls (with default values)
const controlsContext = React.createContext<ControlsContext>({
  openComposer(_opts: ComposerOpts) {}, // 何もしないデフォルト実装 / Default no-op implementation
  closeComposer() {
    return false // デフォルトでは閉じていない状態を返す / Default returns not-closed state
  },
})
controlsContext.displayName = 'ComposerControlsContext'

/**
 * コンポーザー状態管理プロバイダーコンポーネント
 * 投稿作成機能の状態と操作を子コンポーネントに提供する
 * 
 * Composer state management provider component
 * Provides post creation functionality state and operations to child components
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const {_} = useLingui() // 国際化機能を取得 / Get internationalization functionality
  const [state, setState] = React.useState<StateContext>() // コンポーザーの状態を管理 / Manage composer state
  const queryClient = useQueryClient() // ReactQueryクライアントを取得 / Get ReactQuery client

  // コンポーザーを開く処理（最適化されたコールバック） / Process to open composer (optimized callback)
  const openComposer = useNonReactiveCallback((opts: ComposerOpts) => {
    // 引用投稿がある場合、リンク解決のプリキャッシュを実行 / If there's a quoted post, perform link resolution precaching
    if (opts.quote) {
      const path = postUriToRelativePath(opts.quote.uri)
      if (path) {
        const appUrl = toBskyAppUrl(path)
        precacheResolveLinkQuery(queryClient, appUrl, {
          type: 'record',
          kind: 'post',
          record: {
            cid: opts.quote.cid,
            uri: opts.quote.uri,
          },
          view: opts.quote,
        })
      }
    }
    
    // 返信先または引用投稿の作者を取得 / Get author of reply target or quoted post
    const author = opts.replyTo?.author || opts.quote?.author
    // ブロック状態をチェック（相互ブロック、リストブロックを含む） / Check block status (including mutual blocks and list blocks)
    const isBlocked = Boolean(
      author &&
        (author.viewer?.blocking ||
          author.viewer?.blockedBy ||
          author.viewer?.blockingByList),
    )
    
    if (isBlocked) {
      // ブロックされたユーザーとのインタラクション不可のトースト表示 / Show toast for blocked user interaction
      Toast.show(
        _(msg`Cannot interact with a blocked user`),
        'exclamation-circle',
      )
    } else {
      setState(prevOpts => {
        if (prevOpts) {
          // 既にコンポーザーが開いている場合は置き換えない / Never replace an already open composer
          return prevOpts
        }
        return opts // 新しいオプションで状態を設定 / Set state with new options
      })
    }
  })

  // コンポーザーを閉じる処理（最適化されたコールバック） / Process to close composer (optimized callback)
  const closeComposer = useNonReactiveCallback(() => {
    let wasOpen = !!state // 現在開いているかを記録 / Record if currently open
    if (wasOpen) {
      setState(undefined) // 状態をクリア / Clear state
      purgeTemporaryImageFiles() // 一時画像ファイルを削除 / Delete temporary image files
    }

    return wasOpen // 開いていたかどうかを返す / Return whether it was open
  })

  // APIオブジェクトをメモ化して再レンダリングを最適化 / Memoize API object to optimize re-renders
  const api = React.useMemo(
    () => ({
      openComposer,
      closeComposer,
    }),
    [openComposer, closeComposer],
  )

  return (
    <stateContext.Provider value={state}>
      <controlsContext.Provider value={api}>
        {children}
      </controlsContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * コンポーザーの現在の状態を取得するカスタムフック
 * Custom hook to get the current state of the composer
 * 
 * @returns 現在のコンポーザーオプション（未定義の場合はコンポーザーが閉じている） / Current composer options (undefined if composer is closed)
 */
export function useComposerState() {
  return React.useContext(stateContext)
}

/**
 * コンポーザーを閉じる操作を提供するカスタムフック
 * Custom hook to provide composer closing operations
 * 
 * @returns コンポーザーを閉じるための機能オブジェクト / Function object for closing the composer
 */
export function useComposerControls() {
  const {closeComposer} = React.useContext(controlsContext)
  return React.useMemo(() => ({closeComposer}), [closeComposer])
}

/**
 * 直接使用禁止：この非推奨警告は警告のみで、実際には非推奨ではない
 * DO NOT USE DIRECTLY: The deprecation notice as a warning only, it's not actually deprecated
 *
 * @deprecated use `#/lib/hooks/useOpenComposer` instead
 * 
 * コンポーザーを開く操作を提供するカスタムフック（内部使用のみ）
 * Custom hook to provide composer opening operations (internal use only)
 * 
 * @returns コンポーザーを開くための機能オブジェクト / Function object for opening the composer
 */
export function useOpenComposer() {
  const {openComposer} = React.useContext(controlsContext)
  return React.useMemo(() => ({openComposer}), [openComposer])
}
