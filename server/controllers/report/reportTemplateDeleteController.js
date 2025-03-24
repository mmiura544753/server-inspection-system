// server/controllers/report/reportTemplateDeleteController.js
const { ReportTemplate, GeneratedReport } = require('../../models');

// レポートテンプレート削除
const deleteReportTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // テンプレート存在確認
    const template = await ReportTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'テンプレートが見つかりません'
      });
    }
    
    // テンプレートが使用されていないか確認
    const usedReports = await GeneratedReport.findOne({
      where: { template_id: id }
    });
    
    if (usedReports) {
      return res.status(400).json({
        success: false,
        error: 'このテンプレートは既に使用されているため削除できません'
      });
    }
    
    // 削除実行
    await template.destroy();
    
    res.status(200).json({
      success: true,
      message: 'テンプレートが正常に削除されました'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { deleteReportTemplate };