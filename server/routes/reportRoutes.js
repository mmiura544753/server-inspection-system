// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportGenerationController = require('../controllers/report/reportGenerationController');
const generatedReportController = require('../controllers/report/generatedReportController');
const reportTemplateController = require('../controllers/report/reportTemplateController');

// レポート一覧取得
router.get('/', generatedReportController.getAllReports);

// レポートテンプレート一覧取得
router.get('/templates', reportTemplateController.getAllTemplates);

// レポート生成
router.post('/generate', reportGenerationController.generateReport);

// 生成されたレポートの詳細取得
router.get('/:id', generatedReportController.getReportById);

// レポートダウンロード
router.get('/download/:id', reportGenerationController.downloadReport);

// レポート削除
router.delete('/:id', generatedReportController.deleteReport);

module.exports = router;