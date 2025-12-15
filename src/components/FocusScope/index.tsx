/**
 * フォーカススコープコンポーネント - ネイティブ版
 *
 * このファイルはiOS/Android専用のフォーカス管理実装です。
 * スクリーンリーダー使用時に、フォーカスを特定の範囲内に閉じ込めます。
 *
 * ネイティブアプリのアクセシビリティ課題:
 * - Web版のような完全なフォーカストラップAPIが存在しない
 * - TalkBack/VoiceOverでのフォーカス制御が限定的
 * - カスタム実装が必要（ガードコンポーネントで境界を明示）
 *
 * このコンポーネントの戦略:
 * 1. スクリーンリーダー有効時のみアクティブ化
 * 2. コンテンツの前後に「ガード」要素を配置
 * 3. ガードに到達したらコンテンツ先頭にフォーカスを戻す
 *
 * 注意: これは「最終手段」の実装です。可能な限り使用を避けてください。
 *
 * @module FocusScope/Native
 */

// React基本機能（Goユーザー向け: これらはすべてReact Hooksです）
import {
  Children, // 子要素を配列として扱うユーティリティ
  cloneElement, // 既存要素のコピーを作成（propsを追加）
  isValidElement, // 有効なReact要素かチェック
  type ReactElement, // React要素の型
  type ReactNode, // Reactで表示可能な任意の型
  useCallback, // 関数をメモ化（再レンダリング時に再生成しない）
  useEffect, // 副作用を実行（Goのdefer/cleanupに類似）
  useMemo, // 値をメモ化（計算コストの高い処理に使用）
  useRef, // ミュータブルな参照を保持（Goのポインタに類似、再レンダリングを引き起こさない）
} from 'react'
// React Native基本コンポーネント
import {
  AccessibilityInfo, // アクセシビリティAPIへのアクセス
  findNodeHandle, // React要素からネイティブノードハンドルを取得
  Pressable, // タップ可能な領域
  Text, // テキスト表示
  View, // コンテナ要素（Goでいうdiv）
} from 'react-native'
// 国際化マクロ
import {msg} from '@lingui/macro'
// 国際化フック
import {useLingui} from '@lingui/react'

// アクセシビリティ状態を管理するZustandストア
import {useA11y} from '#/state/a11y'

/**
 * フォーカススコープコンポーネント（条件付きラッパー）
 *
 * スクリーンリーダーが有効な場合のみFocusTrapを適用します。
 * 健常者ユーザーには通常通りの動作を提供します。
 *
 * このアプローチの理由:
 * - FocusTrapは完璧な実装ではなく、バグがある可能性
 * - スクリーンリーダー使用者にのみ必要
 * - パフォーマンスオーバーヘッドを最小化
 *
 * 警告: 可能な限り使用を控えてください。
 * より良い代替手段がある場合はそちらを使用してください。
 *
 * @param children - フォーカスをトラップする子要素
 * @returns スクリーンリーダー有効時はFocusTrap、無効時はそのまま
 */
export function FocusScope({children}: {children: ReactNode}) {
  // Zustandストアからスクリーンリーダー状態を取得
  const {screenReaderEnabled} = useA11y()

  // スクリーンリーダーが有効な場合のみFocusTrapを使用
  return screenReaderEnabled ? <FocusTrap>{children}</FocusTrap> : children
}

/**
 * フォーカストラップの実装（ネイティブ版）
 *
 * この実装は「最後の手段」であり、完璧ではありません。
 *
 * 動作原理:
 * 1. コンテンツの前後に「ガード」Pressableを配置
 * 2. ガードはアクセシビリティメッセージを表示
 * 3. ガードがアクティブ化されたらコンテンツ先頭にフォーカスを戻す
 * 4. iOS: accessibilityViewIsModalでフォーカスをトラップ（部分的）
 *
 * 制限事項:
 * - Android: accessibilityViewIsModalが機能しない
 * - 完全なフォーカストラップではない
 * - ユーザーがガードを認識する必要がある
 *
 * @param children - トラップ内の子要素
 */
function FocusTrap({children}: {children: ReactNode}) {
  // 翻訳関数
  const {_} = useLingui()
  // 最初の子要素への参照（フォーカスを戻すため）
  const child = useRef<View>(null)

  /**
   * useMemo:
   * React Hook（Goにはない概念）で、計算結果をメモ化。
   * 依存配列（children）が変わらない限り、再計算しません。
   *
   * ここでは、最初の子要素にrefを追加しています。
   * 注意: 既存のrefがあるとエラーをスローします。
   */
  const decoratedChildren = useMemo(() => {
    return Children.toArray(children).map((node, i) => {
      if (i === 0 && isValidElement(node)) {
        const n = node as ReactElement<any>
        // 既存のrefがある場合はエラー（refの上書きを防ぐ）
        if (n.props.ref !== undefined) {
          throw new Error(
            'FocusScope needs to override the ref on its first child.',
          )
        }
        // cloneElement: 既存要素のコピーを作成し、refを追加
        return cloneElement(n, {
          ...n.props,
          ref: child,
        })
      }
      return node
    })
  }, [children])

  /**
   * useCallback:
   * React Hook（Goにはない概念）で、関数をメモ化。
   * 依存配列が変わらない限り、同じ関数インスタンスを返します。
   * これにより、子コンポーネントの不要な再レンダリングを防ぎます。
   *
   * この関数は、指定されたView要素にアクセシビリティフォーカスを設定します。
   */
  const focusNode = useCallback((ref: View | null) => {
    if (!ref) return
    // React要素からネイティブノードハンドルを取得
    const node = findNodeHandle(ref)
    if (node) {
      // ネイティブAPIでアクセシビリティフォーカスを設定
      AccessibilityInfo.setAccessibilityFocus(node)
    }
  }, [])

  /**
   * useEffect:
   * React Hook（Goにはない概念）で、副作用を実行。
   * コンポーネントのマウント時、および依存配列の値が変化時に実行されます。
   *
   * ここでは、1秒後に最初の子要素にフォーカスを設定しています。
   * 1秒の遅延は、レンダリング完了を待つための経験的な値です。
   */
  useEffect(() => {
    setTimeout(() => {
      focusNode(child.current)
    }, 1e3) // 1000ミリ秒 = 1秒
  }, [focusNode])

  return (
    <>
      {/* 開始ガード: コンテンツの前に配置 */}
      <Pressable
        accessible
        accessibilityLabel={_(
          msg`You've reached the start of the active content.`,
        )}
        accessibilityHint={_(
          msg`Please go back, or activate this element to return to the start of the active content.`,
        )}
        accessibilityActions={[{name: 'activate', label: 'activate'}]}
        onAccessibilityAction={event => {
          switch (event.nativeEvent.actionName) {
            case 'activate': {
              // アクティブ化されたらコンテンツ先頭にフォーカスを戻す
              focusNode(child.current)
            }
          }
        }}>
        <Noop />
      </Pressable>

      {/* メインコンテンツ */}
      <View
        /**
         * accessibilityViewIsModal:
         * iOSでフォーカスをこのビュー内に制限（部分的に機能）
         * Androidでは効果なし
         */
        accessibilityViewIsModal>
        {decoratedChildren}
      </View>

      {/* 終了ガード: コンテンツの後に配置 */}
      <Pressable
        accessibilityLabel={_(
          msg`You've reached the end of the active content.`,
        )}
        accessibilityHint={_(
          msg`Please go back, or activate this element to return to the start of the active content.`,
        )}
        accessibilityActions={[{name: 'activate', label: 'activate'}]}
        onAccessibilityAction={event => {
          switch (event.nativeEvent.actionName) {
            case 'activate': {
              // アクティブ化されたらコンテンツ先頭にフォーカスを戻す
              focusNode(child.current)
            }
          }
        }}>
        <Noop />
      </Pressable>
    </>
  )
}

/**
 * Noopコンポーネント（No Operation）
 *
 * 視覚的には見えないが、アクセシビリティツリーには存在する要素。
 * ガードとして機能するために必要な最小限のDOM要素を提供します。
 *
 * スタイル:
 * - height: 1: 最小限の高さ（0だとレイアウトから除外される可能性）
 * - opacity: 0: 完全に透明（視覚的に見えない）
 * - accessible: false: スクリーンリーダーからは親のPressableとして認識
 *
 * @returns 透明な空のテキスト要素
 */
function Noop() {
  return (
    <Text
      accessible={false}
      style={{
        height: 1,
        opacity: 0,
      }}>
      {' '} {/* 空白文字（完全に空だとReactが警告を出す可能性）*/}
    </Text>
  )
}
