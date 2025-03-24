// server/controllers/report/reportTemplateCreateController.js
const { ReportTemplate } = require('../../models');

// レポートテンプレート作成
const createReportTemplate = async (req, res, next) => {
  try {
    const { name, type, template_path } = req.body;
    
    // バリデーション
    if (!name || !type || !template_path) {
      return res.status(400).json({
        success: false,
        error: 'テンプレート名、タイプ、パスは必須です'
      });
    }
    
    if (!['monthly', 'daily'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '無効なレポートタイプです。monthly または daily を指定してください'
      });
    }
    
    // テンプレート作成
    const newTemplate = await ReportTemplate.create({
      name,
      type,
      template_path
    });
    
    res.status(201).json({
      success: true,
      data: newTemplate
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

module.exports = { createReportTemplate };