// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report');

// レポートテンプレートルート
router.get('/templates', reportController.getReportTemplates);
router.get('/templates/:id', reportController.getReportTemplateById);
router.get('/templates/type/:type', reportController.getReportTemplatesByType);
router.post('/templates', reportController.createReportTemplate);
router.put('/templates/:id', reportController.updateReportTemplate);
router.delete('/templates/:id', reportController.deleteReportTemplate);

// 生成されたレポートルート
router.get('/generated', reportController.getGeneratedReports);
router.get('/generated/:id', reportController.getGeneratedReportById);
router.get('/generated/customer/:customerId', reportController.getReportsByCustomer);
router.get('/generated/type/:type', reportController.getReportsByType);
router.post('/generated', reportController.createGeneratedReport);
router.put('/generated/:id', reportController.updateGeneratedReport);
router.delete('/generated/:id', reportController.deleteGeneratedReport);

// レポートPDF生成・ダウンロードルート
router.post('/generate/:reportId', reportController.generateReportPDF);
router.get('/download/:reportId', reportController.downloadReportPDF);

module.exports = router;