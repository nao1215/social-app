/**
 * 画像アセットモジュール（ネイティブ版）
 *
 * 【概要】
 * アプリケーションで使用する静的画像アセットへの参照を提供。
 * ネイティブ環境ではrequire()を使用してバンドルされた画像を参照。
 *
 * 【プラットフォーム別実装】
 * - ネイティブ版（このファイル）: require()でバンドル画像を参照
 * - Web版（.ts）: URLパス文字列を使用
 *
 * 【require()の動作】
 * - Metro Bundlerがビルド時に画像を処理
 * - 実行時には数値ID（画像のハッシュ）として解決される
 * - Goのembed directiveに相当する機能
 *
 * 【Goユーザー向け補足】
 * - require(): Node.jsのモジュールシステム
 *   Goの//go:embed directiveに類似
 * - ビルド時に画像がアプリバンドルに含まれる
 */
import {ImageRequireSource} from 'react-native'

/** デフォルトアバター画像（ユーザーがアバターを設定していない場合に表示） */
export const DEF_AVATAR: ImageRequireSource = require('../../assets/default-avatar.png')

/** スプラッシュ画像（アプリ起動時に表示） */
export const CLOUD_SPLASH: ImageRequireSource = require('../../assets/splash.png')
