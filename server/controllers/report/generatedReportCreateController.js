// server/controllers/report/generatedReportCreateController.js
const { GeneratedReport, Customer, ReportTemplate } = require('../../models');
const path = require('path');
const fs = require('fs');

// レポート生成
const createGeneratedReport = async (req, res, next) => {
  try {
    const { 
      customer_id, 
      report_date, 
      report_period, 
      report_type, 
      template_id,
      created_by = null
    } = req.body;
    
    // バリデーション
    if (!customer_id || !report_date || !report_period || !report_type || !template_id) {
      return res.status(400).json({
        success: false,
        error: '顧客ID、レポート日付、期間、タイプ、テンプレートIDは必須です'
      });
    }
    
    // レポートタイプのバリデーション
    if (!['monthly', 'daily'].includes(report_type)) {
      return res.status(400).json({
        success: false,
        error: '無効なレポートタイプです。monthly または daily を指定してください'
      });
    }
    
    // 顧客の存在確認
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: '指定された顧客が見つかりません'
      });
    }
    
    // テンプレートの存在確認
    const template = await ReportTemplate.findByPk(template_id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: '指定されたテンプレートが見つかりません'
      });
    }
    
    // テンプレートタイプと報告書タイプが一致することを確認
    if (template.type !== report_type) {
      return res.status(400).json({
        success: false,
        error: 'テンプレートタイプと報告書タイプが一致しません'
      });
    }

    // 新規レポート作成（ドラフト状態）
    const newReport = await GeneratedReport.create({
      customer_id,
      report_date,
      report_period,
      report_type,
      template_id,
      status: 'draft',
      created_by
    });
    
    // レポート用ディレクトリの作成（必要に応じて）
    const reportsDir = path.join(__dirname, '../../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    res.status(201).json({
      success: true,
      data: newReport
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message)
      });
    }
    next(error);
  }
};

module.exports = { createGeneratedReport };