'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    
    // テンプレートIDを取得
    const templateRows = await queryInterface.sequelize.query(
      'SELECT id, type FROM report_templates;'
    );
    
    if (templateRows[0].length === 0) {
      console.log('テンプレートデータがないため、レポートのサンプルデータは作成しません');
      return;
    }
    
    const templates = templateRows[0];
    const dailyTemplateId = templates.find(t => t.type === 'daily')?.id || 1;
    const monthlyTemplateId = templates.find(t => t.type === 'monthly')?.id || 2;
    
    // 顧客IDを取得
    const customerRows = await queryInterface.sequelize.query(
      'SELECT id FROM customers LIMIT 1;'
    );
    
    if (customerRows[0].length === 0) {
      console.log('顧客データがないため、レポートのサンプルデータは作成しません');
      return;
    }
    
    const customerId = customerRows[0][0].id;
    
    // 日次と月次のテストレポートを生成
    const reports = [
      {
        customer_id: customerId,
        report_date: new Date(),
        report_period: '2025/03/24',
        report_type: 'daily',
        file_path: 'reports/test_daily_report_1742817721554.pdf',
        status: 'completed',
        template_id: dailyTemplateId,
        created_at: now,
        updated_at: now
      },
      {
        customer_id: customerId,
        report_date: new Date(),
        report_period: '2025年03月',
        report_type: 'monthly',
        file_path: 'reports/test_monthly_report_1742817722071.pdf',
        status: 'completed',
        template_id: monthlyTemplateId,
        created_at: now,
        updated_at: now
      }
    ];
    
    await queryInterface.bulkInsert('generated_reports', reports);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('generated_reports', null, {});
  }
};