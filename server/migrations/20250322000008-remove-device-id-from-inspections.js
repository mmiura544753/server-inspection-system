'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // カラムが存在するか確認してから削除
      const tableInfo = await queryInterface.describeTable('inspections');
      if (tableInfo.device_id) {
        await queryInterface.removeColumn('inspections', 'device_id');
      }
    } catch (error) {
      console.error('マイグレーションエラー:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // カラムが存在しないか確認してから追加
      const tableInfo = await queryInterface.describeTable('inspections');
      if (!tableInfo.device_id) {
        await queryInterface.addColumn('inspections', 'device_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'devices',
            key: 'id'
          }
        });
      }
    } catch (error) {
      console.error('マイグレーションロールバックエラー:', error);
    }
  }
};