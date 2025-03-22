'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. サンプル顧客データ
    await queryInterface.bulkInsert('customers', [
      {
        customer_name: 'サンプル株式会社',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_name: 'テスト企業',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 2. サンプル機器データ
    const customers = await queryInterface.sequelize.query(
      `SELECT id FROM customers WHERE customer_name IN ('サンプル株式会社', 'テスト企業')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (customers.length >= 2) {
      await queryInterface.bulkInsert('devices', [
        {
          customer_id: customers[0].id,
          device_name: 'Webサーバー',
          model: 'Dell R740',
          device_type: 'サーバ',
          hardware_type: '物理',
          rack_number: 1,
          unit_start_position: 10,
          unit_end_position: 11,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          customer_id: customers[0].id,
          device_name: 'DBサーバー',
          model: 'HP DL380',
          device_type: 'サーバ',
          hardware_type: '物理',
          rack_number: 1,
          unit_start_position: 12,
          unit_end_position: 13,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          customer_id: customers[1].id,
          device_name: 'バックアップサーバー',
          model: 'SuperMicro',
          device_type: 'サーバ',
          hardware_type: '物理',
          rack_number: 2,
          unit_start_position: 8,
          unit_end_position: 9,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }

    // 3. サンプル点検項目名
    await queryInterface.bulkInsert('inspection_item_names', [
      {
        name: '電源ランプ確認',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'ファン動作確認',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'ネットワークLED確認',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'ケーブル緩み確認',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // データの削除は逆順で行う
    await queryInterface.bulkDelete('inspection_item_names', null, {});
    await queryInterface.bulkDelete('devices', null, {});
    await queryInterface.bulkDelete('customers', null, {});
  }
};