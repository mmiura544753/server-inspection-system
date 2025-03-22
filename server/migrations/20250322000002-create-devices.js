'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('devices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false
        // 外部キー制約は下部で追加するため、ここでは定義しない
      },
      device_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      model: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      device_type: {
        type: Sequelize.ENUM('サーバ', 'UPS', 'ネットワーク機器', 'その他'),
        allowNull: false
      },
      hardware_type: {
        type: Sequelize.ENUM('物理', 'VM'),
        allowNull: false
      },
      rack_number: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      unit_start_position: {
        type: Sequelize.SMALLINT(2),
        allowNull: true
      },
      unit_end_position: {
        type: Sequelize.SMALLINT(2),
        allowNull: true
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    });

    // 外部キー制約を追加
    await queryInterface.addConstraint('devices', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'devices_ibfk_1',
      references: {
        table: 'customers',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('devices');
  }
};
