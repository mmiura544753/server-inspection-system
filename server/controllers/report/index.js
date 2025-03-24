// server/controllers/report/index.js
const { 
  getReportTemplates,
  getReportTemplateById,
  getReportTemplatesByType
} = require('./reportTemplateController');

const { createReportTemplate } = require('./reportTemplateCreateController');
const { updateReportTemplate } = require('./reportTemplateUpdateController');
const { deleteReportTemplate } = require('./reportTemplateDeleteController');

const {
  getGeneratedReports,
  getGeneratedReportById,
  getReportsByCustomer,
  getReportsByType
} = require('./generatedReportController');

const { createGeneratedReport } = require('./generatedReportCreateController');
const { updateGeneratedReport } = require('./generatedReportUpdateController');
const { deleteGeneratedReport } = require('./generatedReportDeleteController');

const {
  generateReportPDF,
  downloadReportPDF
} = require('./reportGenerationController');

module.exports = {
  // レポートテンプレート
  getReportTemplates,
  getReportTemplateById,
  getReportTemplatesByType,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  
  // 生成されたレポート
  getGeneratedReports,
  getGeneratedReportById,
  getReportsByCustomer,
  getReportsByType,
  createGeneratedReport,
  updateGeneratedReport,
  deleteGeneratedReport,
  
  // レポート生成
  generateReportPDF,
  downloadReportPDF
};