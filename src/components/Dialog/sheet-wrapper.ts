/**
 * @file シートラッパーフック
 * @description システムAPIのシート呼び出し時にステータスバーの色を制御するユーティリティ
 *
 * このファイルは以下の機能を提供：
 * - useSheetWrapper: Promise実行中にiOSのステータスバーの色を一時的に変更
 *
 * 使用例：
 * 画像ピッカーなどのシステムシートを開く際、ステータスバーの色を
 * 一時的に変更し、シート閉鎖後に元に戻します。
 *
 * Go言語との対比：
 * - useCallback: Goでは関数を返す関数（クロージャ）で表現
 * - Promise: Goのgoroutineとchannelまたはcontext.Contextで実現
 * - async/await: Goでは同期的コードとしてエラーハンドリングで実現
 */

// Reactコアフック - useCallbackによる関数メモ化
import {useCallback} from 'react'
// React Native Edge-to-Edge - システムバー制御ライブラリ
import {SystemBars} from 'react-native-edge-to-edge'

// プラットフォーム検出ユーティリティ - iOS判定
import {isIOS} from '#/platform/detection'

/**
 * シートラッパーフック
 *
 * システムAPI（画像ピッカー、共有シートなど）を呼び出す際に、
 * ステータスバーの色を一時的に変更するラッパー関数を提供します。
 *
 * @returns Promise実行をラップする関数
 *
 * Go言語との対比：
 * - カスタムフック: Goでは関数を返す関数として実装
 *   ```go
 *   func SheetWrapper() func(context.Context, func() error) error {
 *       return func(ctx context.Context, fn func() error) error {
 *           if isIOS {
 *               // ステータスバー変更
 *               defer func() { /* 元に戻す */ }()
 *           }
 *           return fn()
 *       }
 *   }
 *   ```
 *
 * 使用例：
 * ```typescript
 * function MyComponent() {
 *   const wrapSheet = useSheetWrapper()
 *
 *   const pickImage = async () => {
 *     // 画像ピッカーをラップして呼び出し
 *     // ステータスバーが自動的にlight色に変更される
 *     const result = await wrapSheet(ImagePicker.launchImageLibraryAsync())
 *     console.log(result)
 *   }
 *
 *   return <Button onPress={pickImage}>画像を選択</Button>
 * }
 * ```
 */
export function useSheetWrapper() {
  /**
   * useCallback: 関数をメモ化するフック
   *
   * Go言語との対比：
   * - useCallback: Goではクロージャで表現、ただし自動メモ化なし
   * - 依存配列[]: 空の場合、関数は一度だけ作成され再利用される
   *   （Goでは変数に代入して再利用）
   *
   * useCallbackの目的：
   * - 関数の再作成を防ぐ（パフォーマンス最適化）
   * - 子コンポーネントへのProps安定化（不要な再レンダリング防止）
   *
   * メモ化の仕組み：
   * 1. 初回レンダリング: 関数を作成してキャッシュ
   * 2. 再レンダリング: 依存配列が変わらなければキャッシュから取得
   * 3. 依存配列変更時: 新しい関数を作成してキャッシュ更新
   */
  return useCallback(
    /**
     * Promise実行ラッパー関数
     *
     * @param promise - 実行するPromise（画像ピッカー、共有シートなど）
     * @returns Promiseの実行結果
     *
     * @template T - Promise実行結果の型（ジェネリック型パラメータ）
     *
     * Go言語との対比：
     * - ジェネリック関数: Go 1.18以降のジェネリクスに相当
     *   ```go
     *   func WrapSheet[T any](promise func() (T, error)) (T, error) {
     *       if isIOS {
     *           entry := pushStatusBar("light")
     *           defer popStatusBar(entry)
     *       }
     *       return promise()
     *   }
     *   ```
     * - async関数: Goでは通常の関数として実装、goroutineで並行実行
     * - Promise<T>: Goの (T, error) 戻り値パターンに相当
     *
     * async/await説明：
     * - async: 関数が必ずPromiseを返すことを示す
     * - await: Promiseの結果を待つ（同期的に見えるが非同期処理）
     * - Goでは同期的に書けるため、async/awaitは不要
     */
    async <T>(promise: Promise<T>): Promise<T> => {
      // iOS判定 - iOSの場合のみステータスバー変更処理を実行
      if (isIOS) {
        /**
         * ステータスバーのスタックエントリをプッシュ
         *
         * SystemBars.pushStackEntry: スタック構造でステータスバー設定を管理
         * - 複数のシート/ダイアログが重なっても、それぞれの設定を保持
         * - pushすると新しい設定が適用される
         * - popすると前の設定に戻る
         *
         * Go言語との対比：
         * - スタック管理: Goではスライスやリンクリストで実装
         *   ```go
         *   type StatusBarStack struct {
         *       entries []*StatusBarEntry
         *   }
         *
         *   func (s *StatusBarStack) Push(entry *StatusBarEntry) {
         *       s.entries = append(s.entries, entry)
         *       // 適用処理
         *   }
         *
         *   func (s *StatusBarStack) Pop() {
         *       if len(s.entries) > 0 {
         *           s.entries = s.entries[:len(s.entries)-1]
         *           // 前の設定を復元
         *       }
         *   }
         *   ```
         */
        const entry = SystemBars.pushStackEntry({
          style: {
            // ステータスバーをライトモード（白いテキスト）に設定
            // システムシートの背景が暗いため、白いテキストが見やすい
            statusBar: 'light',
          },
        })

        /**
         * Promiseを実行して結果を待つ
         *
         * await: Promiseの完了を待つ
         * - Promiseが成功: 結果値が返される
         * - Promiseが失敗: 例外がスローされる
         *
         * Go言語との対比：
         * - await: Goでは単なる関数呼び出し（同期的）
         *   ```go
         *   result, err := executePromise()
         *   if err != nil {
         *       // エラーハンドリング
         *   }
         *   ```
         * - エラーハンドリング: Goでは明示的なerror戻り値で管理
         *   TypeScriptではtry/catchまたはPromiseのcatchで管理
         */
        const res = await promise

        /**
         * ステータスバーのスタックエントリをポップ（元に戻す）
         *
         * SystemBars.popStackEntry: 先ほどpushした設定を削除
         * - スタックから削除されると、前の設定に自動的に戻る
         * - ネストされたシートでも正しく動作する
         *
         * Go言語との対比：
         * - クリーンアップ処理: Goではdefer文で実現
         *   ```go
         *   entry := SystemBars.PushStackEntry(...)
         *   defer SystemBars.PopStackEntry(entry)
         *   result := executePromise()
         *   return result
         *   ```
         *
         * defer vs 明示的呼び出し:
         * - Go: deferは関数終了時に自動実行（例外時も必ず実行）
         * - TypeScript: 明示的にpopを呼ぶ（例外時はcatchで処理必要）
         */
        SystemBars.popStackEntry(entry)

        // Promise実行結果を返す
        return res
      } else {
        /**
         * iOS以外のプラットフォーム（Android、Web）
         *
         * Androidではステータスバー変更が不要（システムシートが独自管理）
         * Promiseをそのまま実行して結果を返す
         *
         * Go言語との対比：
         * - プラットフォーム分岐: Goではビルドタグやruntime.GOOSで実現
         *   ```go
         *   //go:build ios
         *   // +build ios
         *
         *   func wrapSheet(promise func() error) error {
         *       entry := pushStatusBar()
         *       defer popStatusBar(entry)
         *       return promise()
         *   }
         *   ```
         *
         *   ```go
         *   //go:build !ios
         *   // +build !ios
         *
         *   func wrapSheet(promise func() error) error {
         *       return promise()
         *   }
         *   ```
         */
        return await promise
      }
    },
    /**
     * 依存配列: 空配列 []
     *
     * 空の依存配列は、この関数が一度だけ作成され、
     * コンポーネントの全ライフサイクルを通じて同じ関数インスタンスが
     * 使われることを意味します。
     *
     * Go言語との対比：
     * - 依存配列: Goには直接対応する概念なし
     * - Goでは関数を変数に代入して再利用するだけ
     *   ```go
     *   wrapSheet := func(promise func() error) error {
     *       // 実装
     *   }
     *   // wrapSheetは常に同じ関数インスタンス
     *   ```
     *
     * 依存配列が空の理由：
     * - isIOSは定数（実行時に変わらない）
     * - SystemBarsも外部ライブラリ（変更されない）
     * - 外部変数に依存しないため、一度作成すれば十分
     */
    [],
  )
}
