/**
 * ビューセレクターコンポーネント
 * View Selector Component
 *
 * 【概要】
 * タブ付きのリストビューを提供するコンポーネント。
 * ヘッダー、セレクター（タブ）、コンテンツリストを統合表示。
 *
 * 【構造】
 * ┌─────────────────────┐
 * │    [ヘッダー]        │ ← 任意
 * ├─────────────────────┤
 * │ [タブ1] [タブ2] ...  │ ← スティッキーヘッダー
 * ├─────────────────────┤
 * │    コンテンツ        │
 * │    リスト           │
 * └─────────────────────┘
 *
 * 【機能】
 * - タブ切り替え
 * - プルツーリフレッシュ
 * - 無限スクロール（onEndReached）
 * - スティッキーヘッダー（Androidでは無効）
 *
 * 【Goユーザー向け補足】
 * - forwardRef: 親コンポーネントからrefを受け取る（Goのポインタ渡しに相当）
 * - useImperativeHandle: ref経由で公開するメソッドを定義
 * - stickyHeaderIndices: スクロール時に固定するアイテムのインデックス
 */

// Reactフック
// React hooks
import React, {useEffect, useState} from 'react'

// React Nativeの基本コンポーネント
// React Native basic components
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'

// カラースキームスタイルフック
// Color scheme style hook
import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'

// テーマカラー取得フック
// Theme color hook
import {usePalette} from '#/lib/hooks/usePalette'

// 数値クランプユーティリティ
// Number clamp utility
import {clamp} from '#/lib/numbers'

// 共通スタイルとカラー
// Common styles and colors
import {colors, s} from '#/lib/styles'

// プラットフォーム検出
// Platform detection
import {isAndroid} from '#/platform/detection'

// テキストコンポーネント
// Text component
import {Text} from './text/Text'

// 内部用FlatList
// Internal FlatList
import {FlatList_INTERNAL} from './Views'

// ヘッダーアイテム識別子
// Header item identifier
const HEADER_ITEM = {_reactKey: '__header__'}

// セレクターアイテム識別子
// Selector item identifier
const SELECTOR_ITEM = {_reactKey: '__selector__'}

// スティッキーヘッダーのインデックス（セレクターを固定）
// Sticky header indices (fixes selector)
const STICKY_HEADER_INDICES = [1]

/**
 * ViewSelectorのref経由で公開するメソッド
 * Methods exposed via ViewSelector ref
 */
export type ViewSelectorHandle = {
  /** トップにスクロール / Scroll to top */
  scrollToTop: () => void
}

/**
 * ビューセレクターコンポーネント
 * View Selector Component
 */
export const ViewSelector = React.forwardRef<
  ViewSelectorHandle,
  {
    sections: string[]
    items: any[]
    refreshing?: boolean
    swipeEnabled?: boolean
    renderHeader?: () => JSX.Element
    renderItem: (item: any) => JSX.Element
    ListFooterComponent?:
      | React.ComponentType<any>
      | React.ReactElement
      | null
      | undefined
    onSelectView?: (viewIndex: number) => void
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
    onRefresh?: () => void
    onEndReached?: (info: {distanceFromEnd: number}) => void
  }
>(function ViewSelectorImpl(
  {
    sections,
    items,
    refreshing,
    renderHeader,
    renderItem,
    ListFooterComponent,
    onSelectView,
    onScroll,
    onRefresh,
    onEndReached,
  },
  ref,
) {
  const pal = usePalette('default')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const flatListRef = React.useRef<FlatList_INTERNAL>(null)

  // events
  // =

  const keyExtractor = React.useCallback((item: any) => item._reactKey, [])

  const onPressSelection = React.useCallback(
    (index: number) => setSelectedIndex(clamp(index, 0, sections.length)),
    [setSelectedIndex, sections],
  )
  useEffect(() => {
    onSelectView?.(selectedIndex)
  }, [selectedIndex, onSelectView])

  React.useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      flatListRef.current?.scrollToOffset({offset: 0})
    },
  }))

  // rendering
  // =

  const renderItemInternal = React.useCallback(
    ({item}: {item: any}) => {
      if (item === HEADER_ITEM) {
        if (renderHeader) {
          return renderHeader()
        }
        return <View />
      } else if (item === SELECTOR_ITEM) {
        return (
          <Selector
            items={sections}
            selectedIndex={selectedIndex}
            onSelect={onPressSelection}
          />
        )
      } else {
        return renderItem(item)
      }
    },
    [sections, selectedIndex, onPressSelection, renderHeader, renderItem],
  )

  const data = React.useMemo(
    () => [HEADER_ITEM, SELECTOR_ITEM, ...items],
    [items],
  )
  return (
    <FlatList_INTERNAL
      // @ts-expect-error FlatList_INTERNAL ref type is wrong -sfn
      ref={flatListRef}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItemInternal}
      ListFooterComponent={ListFooterComponent}
      // NOTE sticky header disabled on android due to major performance issues -prf
      stickyHeaderIndices={isAndroid ? undefined : STICKY_HEADER_INDICES}
      onScroll={onScroll}
      onEndReached={onEndReached}
      refreshControl={
        <RefreshControl
          refreshing={refreshing!}
          onRefresh={onRefresh}
          tintColor={pal.colors.text}
        />
      }
      onEndReachedThreshold={0.6}
      contentContainerStyle={s.contentContainer}
      removeClippedSubviews={true}
      scrollIndicatorInsets={{right: 1}} // fixes a bug where the scroll indicator is on the middle of the screen https://github.com/bluesky-social/social-app/pull/464
    />
  )
})

export function Selector({
  selectedIndex,
  items,
  onSelect,
}: {
  selectedIndex: number
  items: string[]
  onSelect?: (index: number) => void
}) {
  const pal = usePalette('default')
  const borderColor = useColorSchemeStyle(
    {borderColor: colors.black},
    {borderColor: colors.white},
  )

  const onPressItem = (index: number) => {
    onSelect?.(index)
  }

  return (
    <View
      style={{
        width: '100%',
        backgroundColor: pal.colors.background,
      }}>
      <ScrollView
        testID="selector"
        horizontal
        showsHorizontalScrollIndicator={false}>
        <View style={[pal.view, styles.outer]}>
          {items.map((item, i) => {
            const selected = i === selectedIndex
            return (
              <Pressable
                testID={`selector-${i}`}
                key={item}
                onPress={() => onPressItem(i)}
                accessibilityLabel={item}
                accessibilityHint={`Selects ${item}`}
                // TODO: Modify the component API such that lint fails
                // at the invocation site as well
              >
                <View
                  style={[
                    styles.item,
                    selected && styles.itemSelected,
                    borderColor,
                  ]}>
                  <Text
                    style={
                      selected
                        ? [styles.labelSelected, pal.text]
                        : [styles.label, pal.textLight]
                    }>
                    {item}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  item: {
    marginRight: 14,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 12,
  },
  itemSelected: {
    borderBottomWidth: 3,
  },
  label: {
    fontWeight: '600',
  },
  labelSelected: {
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    height: 4,
    bottom: 0,
  },
})
