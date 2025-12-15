/**
 * @file スターターパックのフィードリストコンポーネント
 * @description スターターパックに含まれるカスタムフィード一覧を表示するコンポーネント。
 *              スクロール可能なリスト形式でフィードカードを表示し、ユーザーがフィードを閲覧できます。
 */

// React: useCallback（関数メモ化フック）
// Go開発者向け補足: useCallbackは関数の再生成を防ぐメモ化フックです
import React, {useCallback} from 'react'
// React Nativeのリスト関連型定義とビューコンポーネント
import {type ListRenderItemInfo, View} from 'react-native'
// AT Protocol APIのフィード定義型（Goのstructに相当）
import {type AppBskyFeedDefs} from '@atproto/api'

// ボトムバーのオフセット計算用カスタムフック
import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
// プラットフォーム検出ユーティリティ（ネイティブ/Web判定）
import {isNative, isWeb} from '#/platform/detection'
// カスタムリストコンポーネントと参照型（Goのポインタに相当）
import {List, type ListRef} from '#/view/com/util/List'
// セクション参照型定義（スクロール制御用）
import {type SectionRef} from '#/screens/Profile/Sections/types'
// アトミックスタイルとテーマフック
import {atoms as a, useTheme} from '#/alf'
// フィードカードコンポーネント
import * as FeedCard from '#/components/FeedCard'

/**
 * @function keyExtractor
 * @description リストアイテムの一意キーを生成する関数。
 *              React Listの最適化のため、各アイテムに一意のキーを提供します。
 *
 * @param {AppBskyFeedDefs.GeneratorView} item - フィードジェネレータービュー
 * @returns {string} フィードのURI（一意識別子）
 *
 * Go開発者向け補足:
 * - Reactのリストレンダリングでは、各アイテムに一意のkeyが必要です
 * - これはGoのマップのキーに似た概念で、効率的な差分更新に使用されます
 */
function keyExtractor(item: AppBskyFeedDefs.GeneratorView) {
  return item.uri
}

/**
 * @interface ProfilesListProps
 * @description FeedsListコンポーネントのプロパティ型定義
 *
 * Go開発者向け補足: interfaceはGoのstructに相当する型定義です
 */
interface ProfilesListProps {
  feeds: AppBskyFeedDefs.GeneratorView[] // フィード配列
  headerHeight: number // ヘッダーの高さ（スクロールオフセット用）
  scrollElRef: ListRef // リスト要素への参照（Goのポインタに相当）
}

/**
 * @component FeedsList
 * @description スターターパックのフィード一覧を表示するコンポーネント。
 *              フィードを縦スクロールリストで表示し、トップへのスクロール機能を提供します。
 *
 * @param {ProfilesListProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} フィードリストのJSX要素
 *
 * Go開発者向け補足:
 * - React.forwardRefは親コンポーネントからの参照（ref）を受け取るためのパターンです
 * - Goのポインタレシーバーに似た概念で、親から子の関数を呼び出せます
 * - useCallbackは関数の再生成を防ぐメモ化フックで、パフォーマンス最適化に使用されます
 * - useImperativeHandleは、refを通して公開する関数を定義します
 */
export const FeedsList = React.forwardRef<SectionRef, ProfilesListProps>(
  function FeedsListImpl({feeds, headerHeight, scrollElRef}, ref) {
    // useState: 初期ヘッダー高さを状態として保持
    // Go開発者向け補足: useStateはコンポーネント内の状態管理フックです
    // 第1要素が値、第2要素が更新関数（Goのゲッター/セッターに似た概念）
    const [initialHeaderHeight] = React.useState(headerHeight)

    // ボトムバーのオフセット計算（画面下部のナビゲーションバー分のスペース）
    const bottomBarOffset = useBottomBarOffset(20)

    // テーマ情報を取得（ダークモード対応など）
    const t = useTheme()

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
     * @function renderItem
     * @description リストの各アイテムをレンダリングする関数。
     *              各フィードをFeedCardコンポーネントでラップして表示します。
     *
     * @param {ListRenderItemInfo<AppBskyFeedDefs.GeneratorView>} params - レンダリング情報
     * @returns {JSX.Element} レンダリングされたフィードカード
     */
    const renderItem = ({
      item,
      index,
    }: ListRenderItemInfo<AppBskyFeedDefs.GeneratorView>) => {
      return (
        <View
          style={[
            a.p_lg, // 大きいパディング
            // Web、または最初のアイテムでない場合は上部ボーダーを表示
            (isWeb || index !== 0) && a.border_t,
            t.atoms.border_contrast_low, // 低コントラストボーダー色
          ]}>
          <FeedCard.Default view={item} />
        </View>
      )
    }

    return (
      <List
        data={feeds} // フィードデータ配列
        renderItem={renderItem} // アイテムレンダリング関数
        keyExtractor={keyExtractor} // キー抽出関数
        ref={scrollElRef} // リスト要素への参照
        headerOffset={headerHeight} // ヘッダーオフセット
        // フッターコンポーネント: 下部に余白を追加してスクロール可能領域を確保
        ListFooterComponent={
          <View style={[{height: initialHeaderHeight + bottomBarOffset}]} />
        }
        showsVerticalScrollIndicator={false} // 縦スクロールバーを非表示
        desktopFixedHeight={true} // デスクトップで固定高さを使用
      />
    )
  },
)
