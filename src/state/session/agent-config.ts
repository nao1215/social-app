// React Native非同期ストレージ（ローカルストレージ機能）
// React Native asynchronous storage (local storage functionality)
import AsyncStorage from '@react-native-async-storage/async-storage'

// エージェント設定用のストレージキープレフィックス
// Storage key prefix for agent configuration
const PREFIX = 'agent-labelers'

/**
 * ラベラー設定を保存する関数
 * 指定されたユーザーの投稿ラベリング設定をローカルストレージに保存
 * 
 * Function to save labeler configuration
 * Saves post labeling settings for specified user to local storage
 */
export async function saveLabelers(did: string, value: string[]) {
  // ユーザーID付きのキーでラベラーIDの配列をJSON形式で保存
  // Save array of labeler IDs in JSON format with user ID-based key
  await AsyncStorage.setItem(`${PREFIX}:${did}`, JSON.stringify(value))
}

/**
 * ラベラー設定を読み込む関数
 * 指定されたユーザーの投稿ラベリング設定をローカルストレージから取得
 * 
 * Function to read labeler configuration
 * Retrieves post labeling settings for specified user from local storage
 */
export async function readLabelers(did: string): Promise<string[] | undefined> {
  // ユーザーID付きのキーでデータを取得
  // Retrieve data with user ID-based key
  const rawData = await AsyncStorage.getItem(`${PREFIX}:${did}`)
  // データが存在する場合はJSONパース、なければundefinedを返す
  // Parse JSON if data exists, otherwise return undefined
  return rawData ? JSON.parse(rawData) : undefined
}
