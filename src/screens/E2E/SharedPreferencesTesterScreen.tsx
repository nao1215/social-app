/**
 * @file SharedPreferencesテスター画面
 * @description E2Eテスト用のSharedPreferences動作確認画面
 *
 * この画面はEnd-to-End（E2E）テストで使用され、
 * SharedPreferencesの各種操作が正しく動作するかを検証する。
 *
 * テスト対象:
 * - 文字列の保存・削除
 * - 真偽値の保存・削除
 * - 数値の保存・削除
 * - セット（集合）への追加・削除・存在確認
 *
 * @note
 * - SharedPrefs: ネイティブモジュール（AndroidのSharedPreferences/iOSのUserDefaults）
 * - E2Eテスト: Maestroを使用した自動テスト
 * - このファイルは本番機能ではなく、テストインフラの一部
 */

// React: UIライブラリの基本モジュール
import React from 'react'
// React Nativeのビューコンポーネント
import {View} from 'react-native'

// スクロール可能なビューコンポーネント
import {ScrollView} from '#/view/com/util/Views'
// デザインシステム: atoms（スタイルユーティリティ）
import {atoms as a} from '#/alf'
// ボタンコンポーネント群
import {Button, ButtonText} from '#/components/Button'
// レイアウトコンポーネント（画面構造）
import * as Layout from '#/components/Layout'
// テキストコンポーネント
import {Text} from '#/components/Typography'
// SharedPreferencesネイティブモジュール（カスタムExpoモジュール）
import {SharedPrefs} from '../../../modules/expo-bluesky-swiss-army'

/**
 * @function SharedPreferencesTesterScreen
 * @description SharedPreferencesのE2Eテスター画面
 *
 * SharedPreferencesの各種操作をUIから実行し、
 * 結果を画面に表示することで動作を検証する。
 *
 * 各ボタンは以下の操作をテスト:
 * 1. 文字列の保存・削除
 * 2. 真偽値の保存・削除
 * 3. 数値の保存・削除
 * 4. セット（集合）への追加・削除・存在確認
 *
 * @returns {JSX.Element} テスター画面のUI
 *
 * @note
 * - useState: React Hooks - コンポーネントのローカル状態管理（Goのstructフィールドに相当）
 * - testID: E2Eテストでの要素識別用属性（Maestroで使用）
 * - SharedPrefs: AndroidのSharedPreferences/iOSのUserDefaultsラッパー
 */
export function SharedPreferencesTesterScreen() {
  // テスト出力結果の状態（画面に表示される文字列）
  // useState: Reactのローカル状態管理フック
  // - currentTestOutput: 現在の状態値
  // - setCurrentTestOutput: 状態を更新する関数（Goのsetterメソッドに相当）
  const [currentTestOutput, setCurrentTestOutput] = React.useState<string>('')

  return (
    <Layout.Screen>
      {/* スクロール可能なコンテナ（テストボタンが多いため） */}
      <ScrollView contentContainerStyle={{backgroundColor: 'red'}}>
        <View style={[a.flex_1]}>
          {/* テスト結果出力エリア */}
          <View>
            {/* testID: E2Eテストで要素を識別するための属性 */}
            <Text testID="testOutput">{currentTestOutput}</Text>
          </View>
          {/* テストボタン群 */}
          <View style={[a.flex_wrap]}>
            {/* 文字列保存テストボタン */}
            <Button
              label="btn"
              testID="setStringBtn" // E2Eテストでの識別子
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                // 既存値を削除してクリーンな状態から開始
                SharedPrefs.removeValue('testerString')
                // 文字列を保存
                SharedPrefs.setValue('testerString', 'Hello')
                // 保存した文字列を取得
                const str = SharedPrefs.getString('testerString')
                // デバッグログ出力
                console.log(JSON.stringify(str))
                // 結果を画面に表示
                setCurrentTestOutput(`${str}`)
              }}>
              <ButtonText>Set String</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="removeStringBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeValue('testerString')
                const str = SharedPrefs.getString('testerString')
                setCurrentTestOutput(`${str}`)
              }}>
              <ButtonText>Remove String</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="setBoolBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeValue('testerBool')
                SharedPrefs.setValue('testerBool', true)
                const bool = SharedPrefs.getBool('testerBool')
                setCurrentTestOutput(`${bool}`)
              }}>
              <ButtonText>Set Bool</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="setNumberBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeValue('testerNumber')
                SharedPrefs.setValue('testerNumber', 123)
                const num = SharedPrefs.getNumber('testerNumber')
                setCurrentTestOutput(`${num}`)
              }}>
              <ButtonText>Set Number</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="addToSetBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeFromSet('testerSet', 'Hello!')
                SharedPrefs.addToSet('testerSet', 'Hello!')
                const contains = SharedPrefs.setContains('testerSet', 'Hello!')
                setCurrentTestOutput(`${contains}`)
              }}>
              <ButtonText>Add to Set</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="removeFromSetBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeFromSet('testerSet', 'Hello!')
                const contains = SharedPrefs.setContains('testerSet', 'Hello!')
                setCurrentTestOutput(`${contains}`)
              }}>
              <ButtonText>Remove from Set</ButtonText>
            </Button>
          </View>
        </View>
      </ScrollView>
    </Layout.Screen>
  )
}
