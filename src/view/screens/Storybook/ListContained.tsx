/**
 * @file ListContained.tsx - 仮想スクロールリストのデモ
 * @description 固定高さコンテナ内での仮想スクロールリストのテスト画面
 *
 * ## Goエンジニア向けの説明
 * - 仮想スクロール: 表示中のアイテムのみDOMに存在させる最適化技術
 * - ListMethods: リストの命令的操作インターフェース（scrollToOffset, scrollToEnd等）
 * - ScrollProvider: スクロールイベントを子孫コンポーネントに伝播するコンテキスト
 * - 'worklet' ディレクティブ: Reanimated用、UIスレッドで実行するコード
 *
 * ## テスト対象
 * - 固定高さ(300px)のコンテナ内でのスクロール
 * - disableFullWindowScroll: フルウィンドウスクロールを無効化
 * - disableVirtualization: 仮想化を無効化（デバッグ用）
 * - onStartReached / onEndReached: リスト端到達イベント
 * - scrollToOffset / scrollToEnd: プログラム的なスクロール操作
 * - animated オプション: スクロールアニメーションの有無
 *
 * ## アーキテクチャ
 * - 100アイテムのダミーデータを生成
 * - useRef でListインスタンスへの参照を保持
 * - Toggle で animated フラグを切り替え
 * - 3つのボタンで異なるスクロール操作をテスト
 *
 * @module view/screens/Storybook/ListContained
 */

// Reactコアライブラリ
import React from 'react'
// React NativeのViewコンポーネント
import {View} from 'react-native'

// スクロールイベント伝播用コンテキストプロバイダー
import {ScrollProvider} from '#/lib/ScrollContext'
// 仮想スクロールリストコンポーネントと命令的操作インターフェース
import {List, ListMethods} from '#/view/com/util/List'
// ボタンコンポーネント
import {Button, ButtonText} from '#/components/Button'
// トグルコンポーネント
import * as Toggle from '#/components/forms/Toggle'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * ListContained - 仮想スクロールリストのデモ表示
 *
 * 固定高さコンテナ内でのスクロール動作、
 * プログラム的なスクロール操作、イベント発火を確認できる
 */
export function ListContained() {
  const [animated, setAnimated] = React.useState(false)
  const ref = React.useRef<ListMethods>(null)

  const data = React.useMemo(() => {
    return Array.from({length: 100}, (_, i) => ({
      id: i,
      text: `Message ${i}`,
    }))
  }, [])

  return (
    <>
      <View style={{width: '100%', height: 300}}>
        <ScrollProvider
          onScroll={e => {
            'worklet'
            console.log(
              JSON.stringify({
                contentOffset: e.contentOffset,
                layoutMeasurement: e.layoutMeasurement,
                contentSize: e.contentSize,
              }),
            )
          }}>
          <List
            data={data}
            renderItem={item => {
              return (
                <View
                  style={{
                    padding: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(0,0,0,0.1)',
                  }}>
                  <Text>{item.item.text}</Text>
                </View>
              )
            }}
            keyExtractor={item => item.id.toString()}
            disableFullWindowScroll={true}
            style={{flex: 1}}
            onStartReached={() => {
              console.log('Start Reached')
            }}
            onEndReached={() => {
              console.log('End Reached (threshold of 2)')
            }}
            onEndReachedThreshold={2}
            ref={ref}
            disableVirtualization={true}
          />
        </ScrollProvider>
      </View>

      <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
        <Toggle.Item
          name="a"
          label="Click me"
          value={animated}
          onChange={() => setAnimated(prev => !prev)}>
          <Toggle.Checkbox />
          <Toggle.LabelText>Animated Scrolling</Toggle.LabelText>
        </Toggle.Item>
      </View>

      <Button
        variant="solid"
        color="primary"
        size="large"
        label="Scroll to End"
        onPress={() => ref.current?.scrollToOffset({animated, offset: 0})}>
        <ButtonText>Scroll to Top</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="large"
        label="Scroll to End"
        onPress={() => ref.current?.scrollToEnd({animated})}>
        <ButtonText>Scroll to End</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="large"
        label="Scroll to Offset 100"
        onPress={() => ref.current?.scrollToOffset({animated, offset: 500})}>
        <ButtonText>Scroll to Offset 500</ButtonText>
      </Button>
    </>
  )
}
