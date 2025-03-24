'use strict';

const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('report_templates', [
      {
        name: '日次点検レポート',
        type: 'daily',
        template_path: path.join('templates', 'reports', 'daily_template.json'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '月次点検サマリーレポート',
        type: 'monthly',
        template_path: path.join('templates', 'reports', 'monthly_template.json'),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('report_templates', null, {});
  }
};