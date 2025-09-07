// Reactライブラリのインポート - 設定プロバイダーコンポーネントの作成
import React from 'react'

// 各種設定プロバイダーのインポート - アプリケーション設定の管理
import {Provider as AltTextRequiredProvider} from './alt-text-required'       // alt-text必須設定プロバイダー
import {Provider as AutoplayProvider} from './autoplay'                       // 自動再生設定プロバイダー
import {Provider as DisableHapticsProvider} from './disable-haptics'          // ハプティクス無効化設定プロバイダー
import {Provider as ExternalEmbedsProvider} from './external-embeds-prefs'    // 外部埋め込み設定プロバイダー
import {Provider as HiddenPostsProvider} from './hidden-posts'                // 非表示投稿設定プロバイダー
import {Provider as InAppBrowserProvider} from './in-app-browser'             // アプリ内ブラウザ設定プロバイダー
import {Provider as KawaiiProvider} from './kawaii'                           // かわいい設定プロバイダー
import {Provider as LanguagesProvider} from './languages'                     // 言語設定プロバイダー
import {Provider as LargeAltBadgeProvider} from './large-alt-badge'           // 大型alt-textバッジ設定プロバイダー
import {Provider as SubtitlesProvider} from './subtitles'                     // 字幕設定プロバイダー
import {Provider as TrendingSettingsProvider} from './trending'               // トレンド設定プロバイダー
import {Provider as UsedStarterPacksProvider} from './used-starter-packs'     // 使用済みスターターパック設定プロバイダー

// 各設定項目のフックを外部に公開
export {
  useRequireAltTextEnabled,     // alt-text必須設定の取得フック
  useSetRequireAltTextEnabled,  // alt-text必須設定の更新フック
} from './alt-text-required'
export {useAutoplayDisabled, useSetAutoplayDisabled} from './autoplay'           // 自動再生無効化の設定フック
export {useHapticsDisabled, useSetHapticsDisabled} from './disable-haptics'     // ハプティクス無効化の設定フック
export {
  useExternalEmbedsPrefs,      // 外部埋め込み設定の取得フック
  useSetExternalEmbedPref,     // 外部埋め込み設定の更新フック
} from './external-embeds-prefs'
export * from './hidden-posts'                                                   // 非表示投稿設定の全フック
export {useLabelDefinitions} from './label-defs'                                // ラベル定義の取得フック
export {useLanguagePrefs, useLanguagePrefsApi} from './languages'              // 言語設定の取得・操作フック
export {useSetSubtitlesEnabled, useSubtitlesEnabled} from './subtitles'        // 字幕設定の取得・更新フック

/**
 * 設定プロバイダー統合コンポーネント
 * 全ての設定プロバイダーを階層的に組み合わせてアプリケーション全体に設定コンテキストを提供
 * ネストした構造により各設定が独立して管理される
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <LanguagesProvider>               {/* 言語設定プロバイダー */}
      <AltTextRequiredProvider>       {/* alt-text必須設定プロバイダー */}
        <LargeAltBadgeProvider>       {/* 大型alt-textバッジ設定プロバイダー */}
          <ExternalEmbedsProvider>    {/* 外部埋め込み設定プロバイダー */}
            <HiddenPostsProvider>     {/* 非表示投稿設定プロバイダー */}
              <InAppBrowserProvider>  {/* アプリ内ブラウザ設定プロバイダー */}
                <DisableHapticsProvider>  {/* ハプティクス無効化設定プロバイダー */}
                  <AutoplayProvider>      {/* 自動再生設定プロバイダー */}
                    <UsedStarterPacksProvider>  {/* 使用済みスターターパック設定プロバイダー */}
                      <SubtitlesProvider>       {/* 字幕設定プロバイダー */}
                        <TrendingSettingsProvider>  {/* トレンド設定プロバイダー */}
                          <KawaiiProvider>            {/* かわいい設定プロバイダー */}
                            {children}
                          </KawaiiProvider>
                        </TrendingSettingsProvider>
                      </SubtitlesProvider>
                    </UsedStarterPacksProvider>
                  </AutoplayProvider>
                </DisableHapticsProvider>
              </InAppBrowserProvider>
            </HiddenPostsProvider>
          </ExternalEmbedsProvider>
        </LargeAltBadgeProvider>
      </AltTextRequiredProvider>
    </LanguagesProvider>
  )
}
