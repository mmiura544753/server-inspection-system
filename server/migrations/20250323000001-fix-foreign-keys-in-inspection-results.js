'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 既存の外部キーを削除（重複している制約）
      const foreignKeys = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'inspection_results' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_SCHEMA = DATABASE();
      `, { type: queryInterface.sequelize.QueryTypes.SELECT });
      
      for (const key of foreignKeys) {
        await queryInterface.sequelize.query(`
          ALTER TABLE inspection_results 
          DROP FOREIGN KEY ${key.CONSTRAINT_NAME};
        `);
        console.log(`外部キー ${key.CONSTRAINT_NAME} を削除しました`);
      }

      // 一貫性のある命名規則で外部キーを再追加
      await queryInterface.addConstraint('inspection_results', {
        fields: ['inspection_id'],
        type: 'foreign key',
        name: 'fk_inspection_result_inspection',
        references: {
          table: 'inspections',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      await queryInterface.addConstraint('inspection_results', {
        fields: ['device_id'],
        type: 'foreign key',
        name: 'fk_inspection_result_device',
        references: {
          table: 'devices',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      await queryInterface.addConstraint('inspection_results', {
        fields: ['inspection_item_id'],
        type: 'foreign key',
        name: 'fk_inspection_result_item',
        references: {
          table: 'inspection_items',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });

      console.log('外部キー制約の修正が成功しました');
    } catch (error) {
      console.error('マイグレーションエラー:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // 追加した外部キーを削除
      const foreignKeys = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'inspection_results' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_SCHEMA = DATABASE();
      `, { type: queryInterface.sequelize.QueryTypes.SELECT });
      
      for (const key of foreignKeys) {
        await queryInterface.sequelize.query(`
          ALTER TABLE inspection_results 
          DROP FOREIGN KEY ${key.CONSTRAINT_NAME};
        `);
        console.log(`外部キー ${key.CONSTRAINT_NAME} を削除しました`);
      }

      // 元の外部キーを復元
      await queryInterface.addConstraint('inspection_results', {
        fields: ['inspection_id'],
        type: 'foreign key',
        name: 'inspection_results_ibfk_1',
        references: {
          table: 'inspections',
          field: 'id'
        },
        onDelete: 'CASCADE'
      });

      await queryInterface.addConstraint('inspection_results', {
        fields: ['device_id'],
        type: 'foreign key',
        name: 'inspection_results_ibfk_2',
        references: {
          table: 'devices',
          field: 'id'
        },
        onDelete: 'CASCADE'
      });

      await queryInterface.addConstraint('inspection_results', {
        fields: ['inspection_item_id'],
        type: 'foreign key',
        name: 'inspection_results_ibfk_3',
        references: {
          table: 'inspection_items',
          field: 'id'
        }
      });

      console.log('外部キー制約の復元が成功しました');
    } catch (error) {
      console.error('マイグレーションロールバックエラー:', error);
      throw error;
    }
  }
};