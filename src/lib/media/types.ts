/**
 * メディア型定義モジュール
 *
 * 【概要】
 * 画像・動画処理に関する共通型定義。
 * 画像ピッカー、カメラ、クロップ機能で使用。
 *
 * 【Goユーザー向け補足】
 * - interfaceはGoのstructに相当
 * - ?付きフィールドはオプション（ポインタまたはomitemptyに相当）
 */

/**
 * 画像サイズの型
 *
 * 【用途】
 * - 画像のリサイズ指定
 * - アスペクト比計算
 * - クロップ領域指定
 */
export interface Dimensions {
  width: number   // 幅（ピクセル）
  height: number  // 高さ（ピクセル）
}

/**
 * 画像ピッカーのオプション
 *
 * 【用途】
 * expo-image-picker使用時のオプション指定。
 * 投稿への画像添付、プロフィール画像選択などで使用。
 */
export interface PickerOpts {
  mediaType?: string   // メディアタイプ（'Images', 'Videos', 'All'）
  multiple?: boolean   // 複数選択を許可するか
  maxFiles?: number    // 最大選択ファイル数
}

/**
 * カメラ撮影のオプション
 *
 * 【用途】
 * react-native-image-crop-picker使用時のオプション指定。
 * プロフィール画像撮影、投稿用写真撮影などで使用。
 */
export interface CameraOpts {
  width: number                   // 出力画像の幅
  height: number                  // 出力画像の高さ
  freeStyleCropEnabled?: boolean  // 自由なアスペクト比でのクロップを許可
  cropperCircleOverlay?: boolean  // 円形のクロップオーバーレイを表示（アバター用）
}
