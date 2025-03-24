// server/controllers/report/generatedReportUpdateController.js
const { GeneratedReport, Customer, ReportTemplate } = require('../../models');

// 生成されたレポートの更新
const updateGeneratedReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      customer_id, 
      report_date, 
      report_period, 
      report_type, 
      template_id,
      file_path,
      status
    } = req.body;
    
    // レポートの存在確認
    const report = await GeneratedReport.findByPk(id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'レポートが見つかりません'
      });
    }
    
    // 顧客IDが指定された場合、存在確認
    if (customer_id) {
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: '指定された顧客が見つかりません'
        });
      }
    }
    
    // テンプレートIDが指定された場合、存在確認
    if (template_id) {
      const template = await ReportTemplate.findByPk(template_id);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: '指定されたテンプレートが見つかりません'
        });
      }
      
      // レポートタイプが指定されている場合、テンプレートタイプと一致することを確認
      if (report_type && template.type !== report_type) {
        return res.status(400).json({
          success: false,
          error: 'テンプレートタイプと報告書タイプが一致しません'
        });
      }
    }
    
    // ステータスバリデーション
    if (status && !['draft', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: '無効なステータスです。draft または completed を指定してください'
      });
    }
    
    // 更新データの準備
    const updateData = {};
    if (customer_id) updateData.customer_id = customer_id;
    if (report_date) updateData.report_date = report_date;
    if (report_period) updateData.report_period = report_period;
    if (report_type) updateData.report_type = report_type;
    if (template_id) updateData.template_id = template_id;
    if (file_path) updateData.file_path = file_path;
    if (status) updateData.status = status;
    
    // 更新実行
    await report.update(updateData);
    
    // 更新後のデータを取得
    const updatedReport = await GeneratedReport.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: ReportTemplate, as: 'template', attributes: ['id', 'name', 'type'] }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: updatedReport
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

module.exports = { updateGeneratedReport };