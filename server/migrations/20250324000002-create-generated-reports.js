'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('generated_reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      report_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      report_period: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '年月または日付を表す文字列（例：2025-03, 2025-03-24）'
      },
      report_type: {
        type: Sequelize.ENUM('monthly', 'daily'),
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '生成されたPDFファイルのパス'
      },
      status: {
        type: Sequelize.ENUM('draft', 'completed'),
        defaultValue: 'draft',
        allowNull: false
      },
      template_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'report_templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '将来的にユーザーIDとリンクする予定'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // インデックスを追加
    await queryInterface.addIndex('generated_reports', ['customer_id']);
    await queryInterface.addIndex('generated_reports', ['report_type', 'report_period']);
    await queryInterface.addIndex('generated_reports', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('generated_reports');
  }
};