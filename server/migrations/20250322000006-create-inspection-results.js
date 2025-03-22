'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inspection_results', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      inspection_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inspections',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      device_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'devices',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      inspection_item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'inspection_items',
          key: 'id'
        }
      },
      check_item: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('正常', '異常'),
        allowNull: false
      },
      checked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
    await queryInterface.addConstraint('inspection_results', {
      fields: ['inspection_id'],
      type: 'foreign key',
      name: 'fk_inspection_result_inspection',
      references: {
        table: 'inspections',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('inspection_results', {
      fields: ['device_id'],
      type: 'foreign key',
      name: 'fk_inspection_result_device',
      references: {
        table: 'devices',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('inspection_results', {
      fields: ['inspection_item_id'],
      type: 'foreign key',
      name: 'fk_inspection_result_item',
      references: {
        table: 'inspection_items',
        field: 'id'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inspection_results');
  }
};