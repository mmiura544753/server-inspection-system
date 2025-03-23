/**
 * テスト終了後に一度だけ実行されるクリーンアップ
 */

module.exports = async () => {
  console.log('テスト環境のクリーンアップ中...');
  // テスト用データベース接続の切断をスキップ（モックを使用）
  /*
  const { sequelize } = require('../config/db');
  try {
    // データベース接続を閉じる
    await sequelize.close();
    console.log('✓ テスト用データベース接続を閉じました');
  } catch (error) {
    console.error('テスト用データベースの切断に失敗しました:', error);
  }
  */
};