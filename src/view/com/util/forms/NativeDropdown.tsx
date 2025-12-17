/**
 * ネイティブドロップダウンメニューコンポーネント（レガシー）
 * Native Dropdown Menu Component (Legacy)
 *
 * 【概要】
 * iOS/Androidのネイティブドロップダウンメニューを使用するコンポーネント。
 * WebではRadix UIベースのカスタムドロップダウンを使用。
 *
 * 【注意】
 * このファイルのコンポーネントは非推奨。新規コードでは `#/components/Menu.tsx` を使用。
 *
 * 【プラットフォーム別動作】
 * - iOS: UIMenuによるネイティブコンテキストメニュー
 * - Android: PopupMenuによるネイティブメニュー
 * - Web: Radix UIによるアニメーション付きカスタムメニュー
 *
 * 【含まれるコンポーネント】
 * - DropdownMenuRoot: メニューのルートコンテナ
 * - DropdownMenuTrigger: メニューを開くトリガー
 * - DropdownMenuContent: メニューコンテンツ
 * - DropdownMenuItem: メニューアイテム
 * - DropdownMenuItemTitle: アイテムタイトル
 * - DropdownMenuItemIcon: アイテムアイコン
 * - DropdownMenuSeparator: セパレーター
 *
 * 【Goユーザー向け補足】
 * - zeego: React Native用のネイティブメニューライブラリ
 * - Radix UI: Web用のアクセシブルなUIプリミティブ
 * - Portal: DOMツリーの別の場所にレンダリング（Goには直接対応なし）
 */

// React本体
// React core
import React from 'react'

// React Nativeの基本コンポーネント
// React Native basic components
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'

// FontAwesomeアイコン型
// FontAwesome icon type
import {type IconProp} from '@fortawesome/fontawesome-svg-core'

// FontAwesomeアイコンコンポーネント
// FontAwesome icon component
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

// ネイティブドロップダウンメニューライブラリ
// Native dropdown menu library
import * as DropdownMenu from 'zeego/dropdown-menu'

// メニューアイテム共通Props型
// Menu item common props type
import {type MenuItemCommonProps} from 'zeego/lib/typescript/menu'

// テーマカラー取得フック
// Theme color hook
import {usePalette} from '#/lib/hooks/usePalette'

// テーマフック
// Theme hook
import {useTheme} from '#/lib/ThemeContext'

// プラットフォーム検出
// Platform detection
import {isIOS} from '#/platform/detection'

// ポータルコンポーネント
// Portal component
import {Portal} from '#/components/Portal'

// =============================================
// カスタムドロップダウンメニューコンポーネント群
// Custom Dropdown Menu Components
// =============================================

/**
 * ドロップダウンメニューのルートコンテナ
 * Dropdown Menu Root Container
 *
 * @deprecated use Menu from `#/components/Menu.tsx` instead
 */
export const DropdownMenuRoot = DropdownMenu.Root
// export const DropdownMenuTrigger = DropdownMenu.Trigger
/**
 * @deprecated use Menu from `#/components/Menu.tsx` instead
 */
export const DropdownMenuContent = DropdownMenu.Content

type TriggerProps = Omit<
  React.ComponentProps<(typeof DropdownMenu)['Trigger']>,
  'children'
> &
  React.PropsWithChildren<{
    testID?: string
    accessibilityLabel?: string
    accessibilityHint?: string
  }>
/**
 * @deprecated use Menu from `#/components/Menu.tsx` instead
 */
export const DropdownMenuTrigger = DropdownMenu.create(
  (props: TriggerProps) => {
    const theme = useTheme()
    const defaultCtrlColor = theme.palette.default.postCtrl

    return (
      // This Pressable doesn't actually do anything other than
      // provide the "pressed state" visual feedback.
      <Pressable
        testID={props.testID}
        accessibilityRole="button"
        accessibilityLabel={props.accessibilityLabel}
        accessibilityHint={props.accessibilityHint}
        style={({pressed}) => [{opacity: pressed ? 0.8 : 1}]}>
        <DropdownMenu.Trigger action="press">
          <View>
            {props.children ? (
              props.children
            ) : (
              <FontAwesomeIcon
                icon="ellipsis"
                size={20}
                color={defaultCtrlColor}
              />
            )}
          </View>
        </DropdownMenu.Trigger>
      </Pressable>
    )
  },
  'Trigger',
)

type ItemProps = React.ComponentProps<(typeof DropdownMenu)['Item']>
/**
 * @deprecated use Menu from `#/components/Menu.tsx` instead
 */
export const DropdownMenuItem = DropdownMenu.create(
  (props: ItemProps & {testID?: string}) => {
    const theme = useTheme()
    const [focused, setFocused] = React.useState(false)
    const backgroundColor = theme.colorScheme === 'dark' ? '#fff1' : '#0001'

    return (
      <DropdownMenu.Item
        {...props}
        style={[styles.item, focused && {backgroundColor: backgroundColor}]}
        onFocus={() => {
          setFocused(true)
          props.onFocus && props.onFocus()
        }}
        onBlur={() => {
          setFocused(false)
          props.onBlur && props.onBlur()
        }}
      />
    )
  },
  'Item',
)

type TitleProps = React.ComponentProps<(typeof DropdownMenu)['ItemTitle']>
/**
 * @deprecated use Menu from `#/components/Menu.tsx` instead
 */
export const DropdownMenuItemTitle = DropdownMenu.create(
  (props: TitleProps) => {
    const pal = usePalette('default')
    return (
      <DropdownMenu.ItemTitle
        {...props}
        style={[props.style, pal.text, styles.itemTitle]}
      />
    )
  },
  'ItemTitle',
)

type IconProps = React.ComponentProps<(typeof DropdownMenu)['ItemIcon']>
/**
 * @deprecated use Menu from `#/components/Menu.tsx` instead
 */
export const DropdownMenuItemIcon = DropdownMenu.create((props: IconProps) => {
  return <DropdownMenu.ItemIcon {...props} />
}, 'ItemIcon')

type SeparatorProps = React.ComponentProps<(typeof DropdownMenu)['Separator']>
/**
 * @deprecated use Menu from `#/components/Menu.tsx` instead
 */
export const DropdownMenuSeparator = DropdownMenu.create(
  (props: SeparatorProps) => {
    const pal = usePalette('default')
    const theme = useTheme()
    const {borderColor: separatorColor} =
      theme.colorScheme === 'dark' ? pal.borderDark : pal.border
    return (
      <DropdownMenu.Separator
        {...props}
        style={[
          props.style,
          styles.separator,
          {backgroundColor: separatorColor},
        ]}
      />
    )
  },
  'Separator',
)

// Types for Dropdown Menu and Items
export type DropdownItem = {
  label: string | 'separator'
  onPress?: () => void
  testID?: string
  icon?: {
    ios: MenuItemCommonProps['ios']
    android: string
    web: IconProp
  }
}
type Props = {
  items: DropdownItem[]
  testID?: string
  accessibilityLabel?: string
  accessibilityHint?: string
  triggerStyle?: ViewStyle
}

/**
 * The `NativeDropdown` function uses native iOS and Android dropdown menus.
 * It also creates a animated custom dropdown for web that uses
 * Radix UI primitives under the hood
 * @prop {DropdownItem[]} items - An array of dropdown items
 * @prop {React.ReactNode} children - A custom dropdown trigger
 *
 * @deprecated use Menu from `#/components/Menu.tsx` instead
 */
export function NativeDropdown({
  items,
  children,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: React.PropsWithChildren<Props>) {
  const pal = usePalette('default')
  const theme = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)
  const dropDownBackgroundColor =
    theme.colorScheme === 'dark' ? pal.btn : pal.viewLight

  return (
    <>
      {isIOS && isOpen && (
        <Portal>
          <Backdrop />
        </Portal>
      )}
      <DropdownMenuRoot onOpenWillChange={setIsOpen}>
        <DropdownMenuTrigger
          action="press"
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}>
          {children}
        </DropdownMenuTrigger>
        {/* @ts-ignore inheriting props from Radix, which is only for web */}
        <DropdownMenuContent
          style={[styles.content, dropDownBackgroundColor]}
          loop>
          {items.map((item, index) => {
            if (item.label === 'separator') {
              return (
                <DropdownMenuSeparator
                  key={getKey(item.label, index, item.testID)}
                />
              )
            }
            if (index > 1 && items[index - 1].label === 'separator') {
              return (
                <DropdownMenu.Group
                  key={getKey(item.label, index, item.testID)}>
                  <DropdownMenuItem
                    key={getKey(item.label, index, item.testID)}
                    onSelect={item.onPress}>
                    <DropdownMenuItemTitle>{item.label}</DropdownMenuItemTitle>
                    {item.icon && (
                      <DropdownMenuItemIcon
                        ios={item.icon.ios}
                        // androidIconName={item.icon.android} TODO: Add custom android icon support, because these ones are based on https://developer.android.com/reference/android/R.drawable.html and they are ugly
                      >
                        <FontAwesomeIcon
                          icon={item.icon.web}
                          size={20}
                          style={[pal.text]}
                        />
                      </DropdownMenuItemIcon>
                    )}
                  </DropdownMenuItem>
                </DropdownMenu.Group>
              )
            }
            return (
              <DropdownMenuItem
                key={getKey(item.label, index, item.testID)}
                onSelect={item.onPress}>
                <DropdownMenuItemTitle>{item.label}</DropdownMenuItemTitle>
                {item.icon && (
                  <DropdownMenuItemIcon
                    ios={item.icon.ios}
                    // androidIconName={item.icon.android}
                  >
                    <FontAwesomeIcon
                      icon={item.icon.web}
                      size={20}
                      style={[pal.text]}
                    />
                  </DropdownMenuItemIcon>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenuRoot>
    </>
  )
}

function Backdrop() {
  // Not visible but it eats the click outside.
  // Only necessary for iOS.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Dialog backdrop"
      accessibilityHint="Press the backdrop to close the dialog"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'absolute',
      }}
      onPress={() => {
        /* noop */
      }}
    />
  )
}

const getKey = (label: string, index: number, id?: string) => {
  if (id) {
    return id
  }
  return `${label}_${index}`
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    marginVertical: 4,
  },
  content: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginTop: 6,
    ...Platform.select({
      web: {
        animationDuration: '400ms',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform, opacity',
        animationKeyframes: {
          '0%': {opacity: 0, transform: [{scale: 0.5}]},
          '100%': {opacity: 1, transform: [{scale: 1}]},
        },
        boxShadow:
          '0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)',
        transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin)',
      },
    }),
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 20,
    // @ts-ignore -web
    cursor: 'pointer',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 18,
  },
})
