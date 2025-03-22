'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inspection_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      device_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'devices',
          key: 'id'
        }
      },
      item_name_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inspection_item_names',
          key: 'id'
        }
      },
      item_name: {
        type: Sequelize.STRING(255),
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
    await queryInterface.addConstraint('inspection_items', {
      fields: ['item_name_id'],
      type: 'foreign key',
      name: 'fk_inspection_items_item_name_id',
      references: {
        table: 'inspection_item_names',
        field: 'id'
      }
    });

    // ユニーク制約を追加（同じ機器に同じ点検項目が重複しないように）
    await queryInterface.addIndex('inspection_items', {
      fields: ['device_id', 'item_name_id'],
      unique: true,
      name: 'device_item_name_unique_constraint'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inspection_items');
  }
};