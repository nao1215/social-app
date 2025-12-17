/**
 * ビューヘッダーコンポーネント（レガシー）
 * View Header Component (Legacy)
 *
 * 【概要】
 * 画面上部に表示されるヘッダーコンポーネント。
 * 戻るボタン、タイトル、カスタムボタンを含むシンプルなレイアウト。
 *
 * 【構成】
 * [戻るボタン] [タイトル] [カスタムボタン]
 *
 * 【Goユーザー向け補足】
 * - Compound Components: 複合コンポーネントパターン
 *   Header.Outer, Header.Content などの組み合わせで構成
 *   Goの埋め込み構造体に似た概念
 *
 * @deprecated Layout.Headerを使用してください / use `Layout.Header` from `#/components/Layout.tsx`
 */

// レイアウトコンポーネントからヘッダーをインポート
// Import header from layout components
import {Header} from '#/components/Layout'

/**
 * レガシービューヘッダー
 * Legacy View Header
 *
 * 【注意】
 * このコンポーネントは非推奨です。
 * 今後は Layout.Header を使用してください。
 *
 * @deprecated Layout.Headerを使用してください / use `Layout.Header` from `#/components/Layout.tsx`
 *
 * @param title ヘッダーのタイトル / Header title
 * @param subtitle サブタイトル（未使用） / Subtitle (unused)
 * @param showOnDesktop デスクトップで表示するか（未使用） / Show on desktop (unused)
 * @param showBorder ボーダー表示（未使用） / Show border (unused)
 * @param renderButton カスタムボタンをレンダリングする関数 / Function to render custom button
 */
export function ViewHeader({
  title,
  renderButton,
}: {
  /** ヘッダーのタイトル / Header title */
  title: string
  /** サブタイトル（現在未使用） / Subtitle (currently unused) */
  subtitle?: string
  /** デスクトップでも表示するか（現在未使用） / Show on desktop (currently unused) */
  showOnDesktop?: boolean
  /** 下部ボーダーを表示するか（現在未使用） / Show bottom border (currently unused) */
  showBorder?: boolean
  /** 右側のカスタムボタン / Custom button on the right */
  renderButton?: () => JSX.Element
}) {
  return (
    <Header.Outer>
      {/* 戻るボタン（自動的にナビゲーション履歴を戻る） */}
      {/* Back button (automatically navigates back in history) */}
      <Header.BackButton />

      {/* タイトルコンテンツエリア */}
      {/* Title content area */}
      <Header.Content>
        <Header.TitleText>{title}</Header.TitleText>
      </Header.Content>

      {/* カスタムボタンスロット（オプション） */}
      {/* Custom button slot (optional) */}
      <Header.Slot>{renderButton?.() ?? null}</Header.Slot>
    </Header.Outer>
  )
}
