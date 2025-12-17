/**
 * Canvas操作ユーティリティモジュール
 *
 * 【概要】
 * Base64エンコードされた画像からHTML Canvasを生成。
 * 画像の操作（切り抜き、リサイズ等）の前処理に使用。
 *
 * 【Canvas APIとは】
 * - HTML5の描画機能
 * - 2Dグラフィックスをプログラムで描画・操作可能
 * - 画像処理にも利用される
 *
 * 【Goユーザー向け補足】
 * - Promise: Goのchannel + goroutineに相当する非同期処理
 * - Image.onload: コールバック関数（イベント駆動）
 *   Goではgoroutineで待機する処理に相当
 * - Canvas: Goのimage.RGBAに相当する描画バッファ
 */

/**
 * Base64画像からCanvasを生成
 *
 * 【処理フロー】
 * 1. Image要素を作成
 * 2. 画像のロード完了を待機
 * 3. Canvas要素を作成し、画像サイズに設定
 * 4. 2Dコンテキストで画像を描画
 * 5. Canvasを返却
 *
 * @param base64 Base64エンコードされた画像データ（data:image/...形式）
 * @returns Canvas要素のPromise
 */
export const getCanvas = (base64: string): Promise<HTMLCanvasElement> => {
  return new Promise(resolve => {
    // 新しいImage要素を作成
    const image = new Image()

    // 画像ロード完了時のコールバック
    image.onload = () => {
      // 新しいCanvas要素を作成
      const canvas = document.createElement('canvas')
      // Canvasサイズを画像サイズに合わせる
      canvas.width = image.width
      canvas.height = image.height

      // 2D描画コンテキストを取得して画像を描画
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(image, 0, 0)
      resolve(canvas)
    }

    // 画像ソースを設定（これでロードが開始される）
    image.src = base64
  })
}
