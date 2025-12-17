/**
 * エラー境界コンポーネント
 * Error Boundary Component
 *
 * 【概要】
 * 子コンポーネントで発生した未捕捉のJavaScriptエラーをキャッチし、
 * クラッシュを防いでフォールバックUIを表示するReactのエラーハンドリング機構。
 *
 * 【主な機能】
 * - 子コンポーネントのレンダリングエラーをキャッチ
 * - エラーログをSentryなどに送信
 * - ユーザーフレンドリーなエラー画面を表示
 * - アプリ全体のクラッシュを防止
 *
 * 【Goユーザー向け補足】
 * - ErrorBoundary: Goのrecover()に相当するエラー回復機構
 * - getDerivedStateFromError: panicをrecoverで捕捉するのに似る
 * - componentDidCatch: defer + recoverでログを記録するのに似る
 * - Class Component: Reactでは関数コンポーネントではErrorBoundaryを実装できない
 *
 * 【Goでの同等実装】
 * ```go
 * func SafeRender(render func()) {
 *     defer func() {
 *         if r := recover(); r != nil {
 *             logger.Error("Render error", r)
 *             showErrorScreen(r)
 *         }
 *     }()
 *     render()
 * }
 * ```
 */

// Reactコア機能をインポート（Component: クラスベースコンポーネント）
// Import React core (Component: class-based component)
import {Component, ErrorInfo, ReactNode} from 'react'

// React Nativeのスタイル型定義
// React Native style type definitions
import {StyleProp, ViewStyle} from 'react-native'

// 国際化マクロ（翻訳対象文字列のマーキング）
// Internationalization macro (marking strings for translation)
import {msg} from '@lingui/macro'

// 国際化フック（翻訳関数へのアクセス）
// Internationalization hook (access to translation function)
import {useLingui} from '@lingui/react'

// ロガー（エラーをSentryなどに送信）
// Logger (send errors to Sentry, etc.)
import {logger} from '#/logger'

// エラー表示画面コンポーネント
// Error display screen component
import {ErrorScreen} from './error/ErrorScreen'

// 中央寄せビューコンポーネント
// Centered view component
import {CenteredView} from './Views'

/**
 * ErrorBoundaryコンポーネントのProps型
 * ErrorBoundary component Props type
 */
interface Props {
  /** 子コンポーネント（エラーを監視する対象） / Child components (targets for error monitoring) */
  children?: ReactNode
  /** カスタムエラーレンダラー（独自のエラー表示が必要な場合） / Custom error renderer (for custom error display) */
  renderError?: (error: any) => ReactNode
  /** コンテナスタイル / Container style */
  style?: StyleProp<ViewStyle>
}

/**
 * ErrorBoundaryコンポーネントの内部状態型
 * ErrorBoundary component internal state type
 */
interface State {
  /** エラーが発生したかどうか / Whether an error has occurred */
  hasError: boolean
  /** 捕捉されたエラーオブジェクト / Captured error object */
  error: any
}

/**
 * エラー境界クラスコンポーネント
 * Error Boundary Class Component
 *
 * 【注意】
 * Reactではクラスコンポーネントでのみ ErrorBoundary を実装可能。
 * 関数コンポーネントには getDerivedStateFromError がないため。
 */
export class ErrorBoundary extends Component<Props, State> {
  /**
   * 初期状態（エラーなし）
   * Initial state (no error)
   */
  public state: State = {
    hasError: false,
    error: undefined,
  }

  /**
   * エラーから派生状態を取得（Reactライフサイクルメソッド）
   * Get derived state from error (React lifecycle method)
   *
   * 【動作】
   * 子コンポーネントでエラーが発生すると自動的に呼ばれる。
   * 返された状態でコンポーネントが再レンダリングされる。
   *
   * 【Goユーザー向け補足】
   * Goのrecover()で捕捉したpanicをエラー状態として保存するのに相当
   *
   * @param error 発生したエラー / Error that occurred
   * @returns 新しい状態 / New state
   */
  public static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error}
  }

  /**
   * エラー捕捉時のログ記録（Reactライフサイクルメソッド）
   * Log recording on error capture (React lifecycle method)
   *
   * 【動作】
   * getDerivedStateFromError後に呼ばれ、エラー情報をログに記録。
   * Sentry等の外部サービスへのエラー報告に使用。
   *
   * 【Goユーザー向け補足】
   * defer + recoverブロック内でログを記録するのに相当
   *
   * @param error 発生したエラー / Error that occurred
   * @param errorInfo エラーの追加情報（コンポーネントスタック） / Additional error info (component stack)
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーをSentry等に送信
    // Send error to Sentry, etc.
    logger.error(error, {errorInfo})
  }

  /**
   * レンダリングメソッド
   * Render method
   *
   * 【動作】
   * - エラー発生時: エラー画面またはカスタムレンダラーを表示
   * - 正常時: 子コンポーネントをそのまま表示
   */
  public render() {
    if (this.state.hasError) {
      // カスタムエラーレンダラーがあればそれを使用
      // Use custom error renderer if provided
      if (this.props.renderError) {
        return this.props.renderError(this.state.error)
      }

      // デフォルトのエラー画面を表示
      // Display default error screen
      return (
        <CenteredView style={[{height: '100%', flex: 1}, this.props.style]}>
          <TranslatedErrorScreen details={this.state.error.toString()} />
        </CenteredView>
      )
    }

    // 正常時は子コンポーネントをレンダリング
    // Render children when no error
    return this.props.children
  }
}

/**
 * 翻訳済みエラー画面コンポーネント
 * Translated Error Screen Component
 *
 * 【概要】
 * ErrorBoundary内で使用される、国際化対応したエラー画面。
 * フックを使用するため、ErrorBoundaryクラス内では直接使えない。
 *
 * @param details エラーの詳細情報 / Error details
 */
function TranslatedErrorScreen({details}: {details?: string}) {
  // 翻訳関数を取得
  // Get translation function
  const {_} = useLingui()

  return (
    <ErrorScreen
      title={_(msg`Oh no!`)}
      message={_(
        msg`There was an unexpected issue in the application. Please let us know if this happened to you!`,
      )}
      details={details}
    />
  )
}
