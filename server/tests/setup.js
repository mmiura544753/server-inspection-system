/**
 * テスト実行前の共通セットアップ
 */

// 環境変数を強制的にテスト環境に設定
process.env.NODE_ENV = 'test';

// テスト用の .env ファイルがあれば読み込む
require('dotenv').config({ path: '.env.test' });

// JestのタイムアウトをDeviceコントローラのテスト用に延長
jest.setTimeout(10000);