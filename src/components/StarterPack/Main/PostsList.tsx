/**
 * @file スターターパックの投稿リストコンポーネント
 * @description スターターパックに関連するリストの投稿を表示するコンポーネント。
 *              リストURIに基づいてフィードを構築し、投稿を縦スクロール形式で表示します。
 */

// React: useCallback（関数メモ化フック）
// Go開発者向け補足: useCallbackは関数の再生成を防ぎ、パフォーマンスを最適化します
import React, {useCallback} from 'react'
// React Nativeのビューコンポーネント
import {View} from 'react-native'
// Lingui国際化ライブラリ（多言語対応）
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// プラットフォーム検出（ネイティブ判定）
import {isNative} from '#/platform/detection'
// フィード記述子型定義（Goのstructに相当）
import {FeedDescriptor} from '#/state/queries/post-feed'
// 投稿フィードコンポーネント（投稿一覧表示の中核）
import {PostFeed} from '#/view/com/posts/PostFeed'
// 空状態表示コンポーネント
import {EmptyState} from '#/view/com/util/EmptyState'
// リスト参照型（Goのポインタに相当）
import {ListRef} from '#/view/com/util/List'
// セクション参照型定義（スクロール制御用）
import {SectionRef} from '#/screens/Profile/Sections/types'

/**
 * @interface ProfilesListProps
 * @description PostsListコンポーネントのプロパティ型定義
 *
 * Go開発者向け補足: interfaceはGoのstructに相当する型定義です
 */
interface ProfilesListProps {
  listUri: string // リストのURI（投稿ソースとして使用）
  headerHeight: number // ヘッダーの高さ（スクロールオフセット用）
  scrollElRef: ListRef // スクロール要素への参照（Goのポインタに相当）
}

/**
 * @component PostsList
 * @description スターターパックに関連するリストの投稿を表示するコンポーネント。
 *              リストURIからフィード記述子を構築し、PostFeedコンポーネントで投稿を表示します。
 *
 * @param {ProfilesListProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} 投稿リストのJSX要素
 *
 * Go開発者向け補足:
 * - React.forwardRefは親コンポーネントからの参照（ref）を受け取るためのパターンです
 * - Goのポインタレシーバーに似た概念で、親から子の関数を呼び出せます
 * - useCallbackは関数の再生成を防ぐメモ化フックで、パフォーマンス最適化に使用されます
 * - useImperativeHandleは、refを通して公開する関数を定義します
 */
export const PostsList = React.forwardRef<SectionRef, ProfilesListProps>(
  function PostsListImpl({listUri, headerHeight, scrollElRef}, ref) {
    // フィード記述子を構築: "list|{listUri}" 形式でリストベースのフィードを指定
    // Go開発者向け補足: テンプレートリテラル（`${}`）はGoのfmt.Sprintfに似た文字列補間です
    const feed: FeedDescriptor = `list|${listUri}`

    // 国際化フック（翻訳関数を提供）
    const {_} = useLingui()

    /**
     * @function onScrollToTop
     * @description リストをトップまでスクロールする関数。
     *              タブをタップした際などに呼び出されます。
     *
     * useCallbackでメモ化することで、依存配列の値が変わらない限り
     * 同じ関数インスタンスを再利用し、不要な再レンダリングを防ぎます。
     */
    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative, // ネイティブプラットフォームでのみアニメーション有効
        offset: -headerHeight, // ヘッダー分上にスクロール
      })
    }, [scrollElRef, headerHeight])

    // useImperativeHandle: 親コンポーネントに公開するメソッドを定義
    // Go開発者向け補足: これによりrefを通してonScrollToTopを呼び出し可能になります
    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    /**
     * @function renderPostsEmpty
     * @description 投稿が存在しない場合の空状態を表示する関数。
     *              ハッシュタグアイコンと「このフィードは空です」メッセージを表示します。
     *
     * @returns {JSX.Element} 空状態コンポーネント
     */
    const renderPostsEmpty = useCallback(() => {
      return <EmptyState icon="hashtag" message={_(msg`This feed is empty.`)} />
    }, [_])

    return (
      <View>
        <PostFeed
          feed={feed} // フィード記述子（リストベースのフィード）
          pollInterval={60e3} // ポーリング間隔: 60秒（60 * 1000ミリ秒）
          scrollElRef={scrollElRef} // スクロール要素への参照
          renderEmptyState={renderPostsEmpty} // 空状態レンダリング関数
          headerOffset={headerHeight} // ヘッダーオフセット
        />
      </View>
    )
  },
)
