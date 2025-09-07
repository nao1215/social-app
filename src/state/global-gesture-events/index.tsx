// React Hooksのインポート - コンポーネントの状態とコンテキストの管理に使用
import {createContext, useContext, useMemo, useRef, useState} from 'react'
// React Native Viewコンポーネントのインポート - UIレイアウトの基盤
import {View} from 'react-native'
// react-native-gesture-handlerからのジェスチャー関連インポート - タッチジェスチャー処理機能
import {
  Gesture, // ジェスチャー定義用クラス
  GestureDetector, // ジェスチャー検出コンポーネント
  type GestureStateChangeEvent, // ジェスチャー状態変更イベントの型定義
  type GestureUpdateEvent, // ジェスチャー更新イベントの型定義
  type PanGestureHandlerEventPayload, // パンジェスチャーのペイロード型定義
} from 'react-native-gesture-handler'
// EventEmitterのインポート - イベント駆動アーキテクチャを実現するためのライブラリ
import EventEmitter from 'eventemitter3'

/**
 * グローバルジェスチャーイベントの型定義
 * アプリ全体で共有されるパンジェスチャーイベントの集合を定義
 */
export type GlobalGestureEvents = {
  begin: GestureStateChangeEvent<PanGestureHandlerEventPayload>    // ジェスチャー開始イベント
  update: GestureUpdateEvent<PanGestureHandlerEventPayload>       // ジェスチャー更新イベント（ドラッグ中）
  end: GestureStateChangeEvent<PanGestureHandlerEventPayload>     // ジェスチャー終了イベント
  finalize: GestureStateChangeEvent<PanGestureHandlerEventPayload> // ジェスチャー完了イベント（クリーンアップ用）
}

// グローバルジェスチャーイベントのコンテキスト作成
// アプリ全体でジェスチャーイベントを共有するためのReactコンテキスト
const Context = createContext<{
  events: EventEmitter<GlobalGestureEvents> // イベント配信システム
  register: () => void   // ジェスチャーリスナーの登録関数
  unregister: () => void // ジェスチャーリスナーの登録解除関数
}>({
  events: new EventEmitter<GlobalGestureEvents>(), // デフォルトのEventEmitterインスタンス
  register: () => {},    // デフォルトの空関数
  unregister: () => {},  // デフォルトの空関数
})
Context.displayName = 'GlobalGestureEventsContext' // デバッグ用のコンテキスト名設定

/**
 * グローバルジェスチャーイベントプロバイダー
 * アプリ全体でジェスチャーイベントを管理・配信するコンポーネント
 * 参照カウント方式で効率的にジェスチャー検出の有効/無効を制御
 */
export function GlobalGestureEventsProvider({
  children,
}: {
  children: React.ReactNode // 子コンポーネント
}) {
  // ジェスチャーを利用するコンポーネントの参照カウント
  const refCount = useRef(0)
  // グローバルイベントエミッター（メモ化で再作成を防止）
  const events = useMemo(() => new EventEmitter<GlobalGestureEvents>(), [])
  // ジェスチャー検出の有効/無効状態
  const [enabled, setEnabled] = useState(false)
  // コンテキストの値をメモ化（パフォーマンス最適化）
  const ctx = useMemo(
    () => ({
      events, // イベントエミッターの参照
      register() {
        // ジェスチャーリスナーを登録（参照カウントを増加）
        refCount.current += 1
        if (refCount.current === 1) {
          // 最初の登録時にジェスチャー検出を有効化
          setEnabled(true)
        }
      },
      unregister() {
        // ジェスチャーリスナーの登録を解除（参照カウントを減少）
        refCount.current -= 1
        if (refCount.current === 0) {
          // 全て解除されたらジェスチャー検出を無効化
          setEnabled(false)
        }
      },
    }),
    [events, setEnabled],
  )
  // パンジェスチャーの定義と設定
  const gesture = Gesture.Pan()
    .runOnJS(true)                      // JavaScriptスレッドで実行（イベント配信のため）
    .enabled(enabled)                   // 参照カウントに基づく有効/無効制御
    .simultaneousWithExternalGesture()  // 外部ジェスチャーとの同時実行を許可
    .onBegin(e => {
      // ジェスチャー開始時のイベント配信
      events.emit('begin', e)
    })
    .onUpdate(e => {
      // ジェスチャー更新時のイベント配信（ドラッグ中）
      events.emit('update', e)
    })
    .onEnd(e => {
      // ジェスチャー終了時のイベント配信
      events.emit('end', e)
    })
    .onFinalize(e => {
      // ジェスチャー完了時のイベント配信（クリーンアップ処理用）
      events.emit('finalize', e)
    })

  return (
    // グローバルジェスチャーコンテキストを子コンポーネントに提供
    <Context.Provider value={ctx}>
      {/* ジェスチャー検出器でアプリ全体をラップ */}
      <GestureDetector gesture={gesture}>
        {/* collapsable={false}でビューの折りたたみを防止（Android最適化） */}
        <View collapsable={false}>{children}</View>
      </GestureDetector>
    </Context.Provider>
  )
}

/**
 * グローバルジェスチャーイベントを使用するためのカスタムフック
 * @returns ジェスチャーイベントの配信システムと登録/解除関数
 */
export function useGlobalGestureEvents() {
  return useContext(Context)
}
