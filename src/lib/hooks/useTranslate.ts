// ReactのuseCallbackフックをインポート
// Import React useCallback hook
import {useCallback} from 'react'
// ExpoのIntentLauncher（Androidアプリ起動用）をインポート
// Import Expo IntentLauncher (for launching Android apps)
import * as IntentLauncher from 'expo-intent-launcher'

// 翻訳サービスのURLを生成するヘルパー関数をインポート
// Import helper function to generate translation service URL
import {getTranslatorLink} from '#/locale/helpers'
// プラットフォーム検出ユーティリティをインポート
// Import platform detection utility
import {isAndroid} from '#/platform/detection'
// リンクを開くためのカスタムフックをインポート
// Import custom hook for opening links
import {useOpenLink} from './useOpenLink'

/**
 * テキスト翻訳機能を提供するカスタムフック
 * Custom hook to provide text translation functionality
 * Androidではネイティブ翻訳アプリ、そうでなければWeb翻訳サービスを使用
 * Uses native translation app on Android, otherwise uses web translation service
 * @returns 翻訳実行関数 / Translation execution function
 */
export function useTranslate() {
  // リンクを開くためのフックを初期化
  // Initialize hook for opening links
  const openLink = useOpenLink()

  return useCallback(
    /**
     * 指定されたテキストを翻訳する関数
     * Function to translate the specified text
     * @param text 翻訳するテキスト / Text to translate
     * @param language 翻訳先の言語コード / Target language code
     */
    async (text: string, language: string) => {
      // Web翻訳サービスのURLを生成
      // Generate URL for web translation service
      const translateUrl = getTranslatorLink(text, language)
      // Androidプラットフォームの場合の処理
      // Processing for Android platform
      if (isAndroid) {
        try {
          // アプリケーションアイコンを取得して翻訳アプリがインストールされているかを判定
          // use getApplicationIconAsync to determine if the translate app is installed
          if (
            !(await IntentLauncher.getApplicationIconAsync(
              'com.google.android.apps.translate',
            ))
          ) {
            throw new Error('Translate app not installed')
          }

          // TODO: これは一度に一つだけ呼び出されるべき。RQの`scope`のようなものを使用
          // - そうしないと呼び出しが失敗した時にブラウザが予期せず開く可能性がある -sfn
          // TODO: this should only be called one at a time, use something like
          // RQ's `scope` - otherwise can trigger the browser to open unexpectedly when the call throws -sfn
          // AndroidのINTENTでテキスト処理アプリ（翻訳アプリ）を起動
          // Launch text processing app (translation app) with Android INTENT
          await IntentLauncher.startActivityAsync(
            'android.intent.action.PROCESS_TEXT',
            {
              type: 'text/plain', // テキストタイプを指定 / Specify text type
              extra: { // 追加データ / Additional data
                'android.intent.extra.PROCESS_TEXT': text, // 翻訳するテキスト / Text to translate
                'android.intent.extra.PROCESS_TEXT_READONLY': true, // 読み取り専用モード / Read-only mode
              },
              // 注意：中間のアプリ選択をスキップするには`className`を指定する必要がある。
              // ただし、これをハードコードするのは安全ではなく、パッケージマネージャで正しいアクティビティをクエリする必要がある。
              // これにはネイティブコードが必要なので、今はスキップ -sfn
              // note: to skip the intermediate app select, we need to specify a
              // `className`. however, this isn't safe to hardcode, we'd need to query the
              // package manager for the correct activity. this requires native code, so
              // skip for now -sfn
              // packageName: 'com.google.android.apps.translate',
              // className: 'com.google.android.apps.translate.TranslateActivity',
            },
          )
        } catch (err) {
          // 開発モードではエラーをコンソールに表示
          // Display error in console in development mode
          if (__DEV__) console.error(err)
          // おそらく翻訳アプリがインストールされていないことを意味する
          // most likely means they don't have the translate app
          // フォールバックとしてWeb翻訳サービスを開く
          // Open web translation service as fallback
          await openLink(translateUrl)
        }
      } else {
        // iOSやその他のプラットフォームではWeb翻訳サービスを使用
        // Use web translation service on iOS and other platforms
        await openLink(translateUrl)
      }
    },
    [openLink], // openLink関数が変更された時のみ再作成 / Recreate only when openLink function changes
  )
}
