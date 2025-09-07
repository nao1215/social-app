// Reactの型定義をインポート / Import React type definitions
import type React from 'react'

// カラーモード（ダークモード・ライトモード）のプロバイダーをインポート / Import color mode (dark/light mode) provider
import {Provider as ColorModeProvider} from './color-mode'
// ドロワー（サイドメニュー）の開閉状態管理プロバイダーをインポート / Import drawer (side menu) open/close state management provider
import {Provider as DrawerOpenProvider} from './drawer-open'
// ドロワーのスワイプ操作の有効/無効状態管理プロバイダーをインポート / Import drawer swipe gesture enable/disable state management provider
import {Provider as DrawerSwipableProvider} from './drawer-swipe-disabled'
// ミニマルモード（簡略表示）のプロバイダーをインポート / Import minimal mode (simplified display) provider
import {Provider as MinimalModeProvider} from './minimal-mode'
// オンボーディング（初回利用者向けガイド）のプロバイダーをインポート / Import onboarding (first-time user guide) provider
import {Provider as OnboardingProvider} from './onboarding'
// シェルレイアウト（アプリ全体のUI構造）のプロバイダーをインポート / Import shell layout (overall app UI structure) provider
import {Provider as ShellLayoutProvder} from './shell-layout'
// 1分ごとの時刻更新通知プロバイダーをインポート / Import minute-by-minute time update notification provider
import {Provider as TickEveryMinuteProvider} from './tick-every-minute'

// カラーモード関連のフック（テーマ設定の取得・更新）をエクスポート / Export color mode related hooks (get/set theme preferences)
export {useSetThemePrefs, useThemePrefs} from './color-mode'
// ドロワー開閉状態関連のフック（状態取得・更新）をエクスポート / Export drawer open/close state related hooks (get/set state)
export {useIsDrawerOpen, useSetDrawerOpen} from './drawer-open'
// ドロワーのスワイプ操作制御関連のフック（状態取得・更新）をエクスポート / Export drawer swipe control related hooks (get/set state)
export {
  useIsDrawerSwipeDisabled,
  useSetDrawerSwipeDisabled,
} from './drawer-swipe-disabled'
// ミニマルシェルモード関連のフック（状態取得・更新）をエクスポート / Export minimal shell mode related hooks (get/set state)
export {useMinimalShellMode, useSetMinimalShellMode} from './minimal-mode'
// オンボーディング状態管理関連のフック（状態取得・アクション実行）をエクスポート / Export onboarding state management related hooks (get state/dispatch actions)
export {useOnboardingDispatch, useOnboardingState} from './onboarding'
// 分単位の時刻監視フックをエクスポート / Export minute-level time monitoring hook
export {useTickEveryMinute} from './tick-every-minute'

/**
 * シェル（アプリの基盤UI）状態管理プロバイダーのルートコンポーネント
 * 全ての子コンポーネントに各種UI状態（カラーモード、ドロワー、レイアウトなど）を提供する
 * 
 * Shell (app foundation UI) state management provider root component
 * Provides various UI states (color mode, drawer, layout, etc.) to all child components
 * 
 * @param children - 子コンポーネント / Child components
 * @returns ネストされたプロバイダーで包まれたReactコンポーネント / React component wrapped in nested providers
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  // プロバイダーを階層的にネストして、全てのシェル状態を管理
  // Hierarchically nest providers to manage all shell states
  return (
    <ShellLayoutProvder>
      <DrawerOpenProvider>
        <DrawerSwipableProvider>
          <MinimalModeProvider>
            <ColorModeProvider>
              <OnboardingProvider>
                <TickEveryMinuteProvider>{children}</TickEveryMinuteProvider>
              </OnboardingProvider>
            </ColorModeProvider>
          </MinimalModeProvider>
        </DrawerSwipableProvider>
      </DrawerOpenProvider>
    </ShellLayoutProvder>
  )
}
