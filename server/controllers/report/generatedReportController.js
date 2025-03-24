// server/controllers/report/generatedReportController.js
const { GeneratedReport, Customer, ReportTemplate } = require('../../models');

// 生成されたレポート一覧を取得
const getGeneratedReports = async (req, res, next) => {
  try {
    const reports = await GeneratedReport.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: ReportTemplate, as: 'template', attributes: ['id', 'name', 'type'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// 特定の生成レポート詳細を取得
const getGeneratedReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const report = await GeneratedReport.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: ReportTemplate, as: 'template', attributes: ['id', 'name', 'type'] }
      ]
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'レポートが見つかりません'
      });
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// 顧客ごとの生成レポート一覧を取得
const getReportsByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    // 顧客の存在確認
    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: '顧客が見つかりません'
      });
    }
    
    const reports = await GeneratedReport.findAll({
      where: { customer_id: customerId },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: ReportTemplate, as: 'template', attributes: ['id', 'name', 'type'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// レポートタイプごとの生成レポート一覧を取得
const getReportsByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    
    if (!['monthly', 'daily'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '無効なレポートタイプです'
      });
    }
    
    const reports = await GeneratedReport.findAll({
      where: { report_type: type },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: ReportTemplate, as: 'template', attributes: ['id', 'name', 'type'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGeneratedReports,
  getGeneratedReportById,
  getReportsByCustomer,
  getReportsByType
};