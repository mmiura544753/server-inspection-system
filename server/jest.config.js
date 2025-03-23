/**
 * Jest設定ファイル
 */
module.exports = {
  // テスト環境
  testEnvironment: 'node',
  
  // テストファイルのパターン
  testMatch: [
    "**/tests/**/*.test.js"
  ],
  
  // カバレッジの収集対象
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
    "!**/migrations/**",
    "!**/seeders/**"
  ],
  
  // カバレッジレポートの出力先
  coverageDirectory: "coverage",
  
  // セットアップファイル
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // タイムアウト設定
  testTimeout: 10000,
  
  // モジュールエイリアス（必要に応じて設定）
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  
  // テスト実行前のグローバル設定
  globalSetup: './tests/globalSetup.js',
  
  // テスト実行後のクリーンアップ
  globalTeardown: './tests/globalTeardown.js',
  
  // Jestが無視するディレクトリ
  testPathIgnorePatterns: [
    "/node_modules/"
  ]
};