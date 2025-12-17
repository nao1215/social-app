/**
 * 読み込み中画面コンポーネント
 * Loading Screen Component
 *
 * 【概要】
 * データ読み込み中に表示するローディングスピナー画面。
 * 画面全体を覆うローディング表示に使用。
 *
 * 【Goユーザー向け補足】
 * - ActivityIndicator: OSネイティブのローディングスピナー
 *   iOSでは円形のスピナー、Androidではマテリアルデザインのスピナー
 *
 * @deprecated Layoutコンポーネントを直接使用してください / use Layout components directly
 */

// ローディングインジケーターと基本View
// Loading indicator and basic View
import {ActivityIndicator, View} from 'react-native'

// 共通スタイル定義
// Common style definitions
import {s} from '#/lib/styles'

// レイアウトコンポーネント
// Layout components
import * as Layout from '#/components/Layout'

/**
 * 読み込み中画面
 * Loading Screen
 *
 * @deprecated Layoutコンポーネントを直接使用してください / use Layout components directly
 */
export function LoadingScreen() {
  return (
    <Layout.Content>
      {/* パディング付きコンテナ内にスピナー表示 */}
      {/* Display spinner in padded container */}
      <View style={s.p20}>
        <ActivityIndicator size="large" />
      </View>
    </Layout.Content>
  )
}
