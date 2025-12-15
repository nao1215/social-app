# 日本語コメント翻訳進捗状況

## 対象ディレクトリ
- `/src/components/Post/`
- `/src/components/PostControls/`
- `/src/components/ProfileHoverCard/`

## 翻訳完了ファイル (7/47)

### ProfileHoverCard/ (3/3 完了)
- ✅ `types.ts` - プロフィールホバーカード型定義
- ✅ `index.tsx` - ネイティブ版実装
- ⬜ `index.web.tsx` - Web版実装（未完了）

### Post/Embed/ (4/30)
- ✅ `types.ts` - 埋め込み型定義
- ✅ `PostPlaceholder.tsx` - プレースホルダーコンポーネント
- ✅ `LazyQuoteEmbed.tsx` - 遅延読み込み引用埋め込み
- ✅ `FeedEmbed.tsx` - フィード埋め込み
- ✅ `ListEmbed.tsx` - リスト埋め込み
- ⬜ `index.tsx` - メイン埋め込みコンポーネント
- ⬜ `ImageEmbed.tsx` - 画像埋め込み

### Post/ Root
- ⬜ `ShowMoreTextButton.tsx`
- ⬜ `PostRepliedTo.tsx`

### PostControls/ (1/14)
- ✅ `util.ts` - ユーティリティ関数
- ⬜ `index.tsx` - メインコンポーネント
- ⬜ `BookmarkButton.tsx`
- ⬜ `RepostButton.tsx`
- ⬜ `PostControlButton.tsx`
- ⬜ `DiscoverDebug.tsx`

## 翻訳パターン・テンプレート

### 1. ファイル先頭のドキュメンテーションコメント

```typescript
/**
 * [モジュール名]コンポーネント/ユーティリティ
 *
 * [このモジュールの目的と機能の説明]
 *
 * 主な機能:
 * - [機能1の説明]
 * - [機能2の説明]
 * - [機能3の説明]
 *
 * Go言語との対比:
 * - [TypeScript/React概念]: [Go言語での相当する概念]
 * - [例: useMemo: Goのsync.Onceに似た値のメモ化]
 *
 * Reactフック解説（該当する場合）:
 * - [フック名]: [動作の説明]
 */
```

### 2. インポート文のコメント

```typescript
// [インポートの目的を日本語で説明]
import {Component} from 'library'
```

### 3. 関数/コンポーネントのJSDocコメント

```typescript
/**
 * [関数/コンポーネント名]
 *
 * [動作の詳細な説明]
 *
 * Reactフック解説（該当する場合）:
 * - useState: [状態の説明]
 * - useEffect: [副作用の説明]
 * - useCallback: [メモ化の目的]
 * - useMemo: [計算のメモ化目的]
 *
 * @param {Type} props.param - [パラメータの説明]
 * @returns {Type} [戻り値の説明]
 *
 * @example
 * <Component prop="value" />
 */
```

### 4. 重要なロジックのインラインコメント

```typescript
// [複雑なロジックの日本語説明]
const result = complexCalculation()

// Go言語の[概念]に相当
// [JavaScriptの特定パターンとGoとの比較]
```

### 5. Reactフックの標準的な説明テンプレート

#### useState
```typescript
// useState: コンポーネントのローカル状態を管理
// Goの構造体フィールドに似ているが、値が変わると再レンダリングされる
const [value, setValue] = useState(initialValue)
```

#### useEffect
```typescript
// useEffect: 副作用（データ取得、購読など）を実行
// 第2引数の依存配列が変わった時のみ実行
// Goのinit()やdefer文に似た役割
useEffect(() => {
  // 副作用の処理
  return () => {
    // クリーンアップ処理（Goのdefer文に相当）
  }
}, [dependencies])
```

#### useCallback
```typescript
// useCallback: 関数をメモ化し、不要な再生成を防ぐ
// 依存配列が変わった時のみ新しい関数を生成
// Goでは関数は値なので常に新しいアドレスになるが、Reactでは同一性が重要
const memoizedCallback = useCallback(() => {
  // 関数の処理
}, [dependencies])
```

#### useMemo
```typescript
// useMemo: 計算結果をメモ化し、依存値が変わらない限り再計算しない
// Goのsync.Onceに似た動作（依存配列が変わるまでキャッシュ）
const memoizedValue = useMemo(() => {
  return expensiveComputation()
}, [dependencies])
```

### 6. TypeScript型定義のコメント

```typescript
/**
 * [型名]
 *
 * [型の説明]
 *
 * Go言語のstructに相当しますが、TypeScriptは構造的型付け。
 *
 * @property {Type} property - [プロパティの説明]
 */
export type TypeName = {
  property: Type
}

/**
 * [インターフェース名]
 *
 * [インターフェースの説明]
 *
 * @enum {string}
 */
export enum EnumName {
  /** [値の説明] */
  Value1 = 'value1',
  /** [値の説明] */
  Value2 = 'value2',
}
```

## 残りのファイル翻訳手順

1. ファイルを読み込む
2. 上記テンプレートに従ってコメントを追加
3. 特にReactフック（useState, useEffect, useCallback, useMemo）には詳細な説明を追加
4. Go言語ユーザー向けに、TypeScript/React特有の概念を説明
5. 分割代入、スプレッド演算子など、Go言語にない構文にコメントを追加

## 重要な翻訳ガイドライン

### Reactフックの説明は必須
すべてのReactフックに対して、以下を説明すること:
- フックの目的
- 依存配列の意味
- Go言語での相当する概念（存在する場合）

### Go言語との対比を含める
Go言語プログラマーが理解しやすいよう、以下の対比を含める:
- `interface`/`type` → Goの`struct`
- `useState` → 構造体フィールド + 再レンダリングトリガー
- `useEffect` → `init()`や`defer`文
- `useCallback`/`useMemo` → `sync.Once`やキャッシング
- スプレッド演算子`...` → 構造体の埋め込みやスライスのappend
- 分割代入`{a, b} = obj` → 複数戻り値

### TypeScript/JavaScript特有構文の説明
- オプショナルチェイニング `?.`
- Null合体演算子 `??`
- 三項演算子 `? :`
- テンプレートリテラル `` `text ${variable}` ``
- アロー関数 `() => {}`
- 分割代入 `{prop1, prop2}`
- スプレッド演算子 `...`

## 次のステップ

1. `Post/Embed/index.tsx` - 埋め込みコンポーネントのメインファイル
2. `Post/Embed/ImageEmbed.tsx` - 画像埋め込み
3. `PostControls/index.tsx` - 投稿コントロールメインファイル
4. `PostControls/BookmarkButton.tsx` - ブックマークボタン
5. `PostControls/RepostButton.tsx` - リポストボタン
6. VideoEmbed関連ファイル群
7. ExternalEmbed関連ファイル群
8. メニュー関連ファイル群
