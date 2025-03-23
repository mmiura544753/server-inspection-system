'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // テーブル定義を確認
      const tableInfo = await queryInterface.describeTable('inspection_items');
      
      // 既存の外部キーがあるか確認
      const existingKeys = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'inspection_items' 
        AND COLUMN_NAME = 'device_id'
        AND REFERENCED_TABLE_NAME = 'devices'
        AND TABLE_SCHEMA = DATABASE();
      `, { type: queryInterface.sequelize.QueryTypes.SELECT });
      
      // 既存の外部キーがない場合のみ追加
      if (existingKeys.length === 0) {
        // device_idカラムに外部キー制約を追加
        await queryInterface.addConstraint('inspection_items', {
          fields: ['device_id'],
          type: 'foreign key',
          name: 'fk_inspection_items_device_id',
          references: {
            table: 'devices',
            field: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
        console.log('外部キー制約を追加しました: fk_inspection_items_device_id');
      } else {
        console.log('外部キー制約が既に存在します:', existingKeys.map(k => k.CONSTRAINT_NAME).join(', '));
      }

      console.log('inspection_items.device_idへの外部キー制約の追加が成功しました');
    } catch (error) {
      console.error('マイグレーションエラー:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // 追加した外部キー制約を削除
      await queryInterface.removeConstraint('inspection_items', 'fk_inspection_items_device_id');
      
      console.log('inspection_items.device_idからの外部キー制約の削除が成功しました');
    } catch (error) {
      console.error('マイグレーションロールバックエラー:', error);
      throw error;
    }
  }
};