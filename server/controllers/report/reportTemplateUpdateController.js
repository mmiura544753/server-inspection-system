// server/controllers/report/reportTemplateUpdateController.js
const { ReportTemplate } = require('../../models');

// レポートテンプレート更新
const updateReportTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, template_path } = req.body;
    
    // テンプレート存在確認
    const template = await ReportTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'テンプレートが見つかりません'
      });
    }
    
    // タイプバリデーション
    if (type && !['monthly', 'daily'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '無効なレポートタイプです。monthly または daily を指定してください'
      });
    }
    
    // 更新
    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (template_path) updateData.template_path = template_path;
    
    await template.update(updateData);
    
    // 更新後のデータを取得
    const updatedTemplate = await ReportTemplate.findByPk(id);
    
    res.status(200).json({
      success: true,
      data: updatedTemplate
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

module.exports = { updateReportTemplate };