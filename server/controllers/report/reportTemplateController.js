// server/controllers/report/reportTemplateController.js
const { ReportTemplate } = require('../../models');

// レポートテンプレート一覧を取得
const getReportTemplates = async (req, res, next) => {
  try {
    const templates = await ReportTemplate.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

// レポートテンプレート詳細を取得
const getReportTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const template = await ReportTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'テンプレートが見つかりません'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// レポートテンプレートのタイプによるフィルタリング
const getReportTemplatesByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    
    if (!['monthly', 'daily'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '無効なレポートタイプです'
      });
    }
    
    const templates = await ReportTemplate.findAll({
      where: { type },
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportTemplates,
  getReportTemplateById,
  getReportTemplatesByType
};