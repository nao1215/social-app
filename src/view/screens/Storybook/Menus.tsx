/**
 * @file Menus.tsx - メニューコンポーネントのカタログ
 * @description ドロップダウンメニュー、コンテキストメニューのStorybook画面
 *
 * ## Goエンジニア向けの説明
 * - メニュー: クリック/タップで表示されるアクションリスト（HTMLのselect要素に似た概念）
 * - Trigger: メニューを開くトリガー要素（ボタンやテキスト）
 * - Render Props: {state, props} => JSX パターンでカスタムトリガーを実装
 * - useMenuControl: メニューの開閉を制御するフック
 *
 * ## 表示されるコンポーネント
 * - Menu.Root: メニューのルートコンテナ
 * - Menu.Trigger: メニューを開くトリガー
 * - Menu.Outer: メニューのドロップダウン部分
 * - Menu.Group: メニューアイテムのグループ
 * - Menu.Item: 個々のメニューアイテム（アイコン、テキスト）
 * - Menu.Divider: グループ間の区切り線
 *
 * ## Compound Component パターン
 * Menu.Root
 *   ├── Menu.Trigger
 *   └── Menu.Outer
 *         ├── Menu.Group
 *         │     ├── Menu.Item
 *         │     └── Menu.Item
 *         ├── Menu.Divider
 *         └── Menu.Item
 *
 * @module view/screens/Storybook/Menus
 */

// React NativeのViewコンポーネント
import {View} from 'react-native'

// デザインシステム（atoms: スタイル、useTheme: テーマフック）
import {atoms as a, useTheme} from '#/alf'
// 検索アイコン
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
// メニューコンポーネント群
import * as Menu from '#/components/Menu'
// テキストコンポーネント
import {Text} from '#/components/Typography'
// import {useDialogStateControlContext} from '#/state/dialogs'

/**
 * Menus - メニューコンポーネントのカタログ表示
 *
 * ドロップダウンメニューのトリガー、アイテム、グループ、
 * 区切り線などの全要素を視覚的に確認できる
 */
export function Menus() {
  const t = useTheme()
  const menuControl = Menu.useMenuControl()
  // const {closeAllDialogs} = useDialogStateControlContext()

  return (
    <View style={[a.gap_md]}>
      <View style={[a.flex_row, a.align_start]}>
        <Menu.Root control={menuControl}>
          <Menu.Trigger label="Open basic menu">
            {({state, props}) => {
              return (
                <Text
                  {...props}
                  style={[
                    a.py_sm,
                    a.px_md,
                    a.rounded_sm,
                    t.atoms.bg_contrast_50,
                    (state.hovered || state.focused || state.pressed) && [
                      t.atoms.bg_contrast_200,
                    ],
                  ]}>
                  Open
                </Text>
              )
            }}
          </Menu.Trigger>

          <Menu.Outer>
            <Menu.Group>
              <Menu.Item label="Click me" onPress={() => {}}>
                <Menu.ItemIcon icon={Search} />
                <Menu.ItemText>Click me</Menu.ItemText>
              </Menu.Item>

              <Menu.Item
                label="Another item"
                onPress={() => menuControl.close()}>
                <Menu.ItemText>Another item</Menu.ItemText>
              </Menu.Item>
            </Menu.Group>

            <Menu.Divider />

            <Menu.Group>
              <Menu.Item label="Click me" onPress={() => {}}>
                <Menu.ItemIcon icon={Search} />
                <Menu.ItemText>Click me</Menu.ItemText>
              </Menu.Item>

              <Menu.Item
                label="Another item"
                onPress={() => menuControl.close()}>
                <Menu.ItemText>Another item</Menu.ItemText>
              </Menu.Item>
            </Menu.Group>

            <Menu.Divider />

            <Menu.Item label="Click me" onPress={() => {}}>
              <Menu.ItemIcon icon={Search} />
              <Menu.ItemText>Click me</Menu.ItemText>
            </Menu.Item>
          </Menu.Outer>
        </Menu.Root>
      </View>
    </View>
  )
}
