// server/controllers/report/generatedReportController.js
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const { GeneratedReport, Customer, ReportTemplate } = require('../../models');

/**
 * @desc    全レポート取得
 * @route   GET /api/reports
 * @access  Public
 */
const getAllReports = asyncHandler(async (req, res) => {
  const reports = await GeneratedReport.findAll({
    order: [['created_at', 'DESC']],
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'customer_name']
      },
      {
        model: ReportTemplate,
        as: 'template',
        attributes: ['id', 'name', 'type']
      }
    ]
  });

  res.json(reports);
});

/**
 * @desc    レポート詳細取得
 * @route   GET /api/reports/:id
 * @access  Public
 */
const getReportById = asyncHandler(async (req, res) => {
  const report = await GeneratedReport.findByPk(req.params.id, {
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'customer_name']
      },
      {
        model: ReportTemplate,
        as: 'template',
        attributes: ['id', 'name', 'type']
      }
    ]
  });

  if (!report) {
    res.status(404);
    throw new Error('レポートが見つかりません');
  }

  res.json(report);
});

/**
 * @desc    レポート削除
 * @route   DELETE /api/reports/:id
 * @access  Public
 */
const deleteReport = asyncHandler(async (req, res) => {
  const report = await GeneratedReport.findByPk(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error('レポートが見つかりません');
  }

  // ファイルが存在する場合は削除
  if (report.file_path && fs.existsSync(report.file_path)) {
    fs.unlinkSync(report.file_path);
  }

  await report.destroy();

  res.json({ message: 'レポートが削除されました' });
});

module.exports = {
  getAllReports,
  getReportById,
  deleteReport
};