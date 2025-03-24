// server/controllers/report/reportGenerationController.js
const { GeneratedReport, ReportTemplate, Customer } = require('../../models');
const PDFGenerator = require('../../services/report/pdfGenerator');
const path = require('path');
const fs = require('fs');

// レポートPDFの生成
const generateReportPDF = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    // レポート情報取得
    const report = await GeneratedReport.findByPk(reportId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: ReportTemplate, as: 'template' }
      ]
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'レポートが見つかりません'
      });
    }
    
    // レポート保存用ディレクトリの作成
    const reportsDir = path.join(__dirname, '../../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // 顧客ごとのディレクトリ
    const customerDir = path.join(reportsDir, `customer_${report.customer_id}`);
    if (!fs.existsSync(customerDir)) {
      fs.mkdirSync(customerDir, { recursive: true });
    }
    
    // レポートファイル名の設定
    const fileName = `${report.report_type}_report_${report.id}_${new Date().getTime()}.pdf`;
    const filePath = path.join(customerDir, fileName);
    const relativeFilePath = path.relative(path.join(__dirname, '../../..'), filePath);
    
    // PDFの生成
    const reportData = {
      customerId: report.customer_id,
      reportType: report.report_type,
      reportPeriod: report.report_period,
      reportDate: report.report_date,
      title: `${report.report_type === 'daily' ? '日次' : '月次'}点検報告書`,
      templateId: report.template_id || null
    };
    
    // ノート情報があれば追加
    if (req.body && req.body.notes) {
      reportData.notes = req.body.notes;
    }
    
    await PDFGenerator.generateReport(reportData, filePath);
    
    // ファイルパスをレポートに保存
    await report.update({
      file_path: relativeFilePath,
      status: 'completed'
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: report.id,
        file_path: relativeFilePath,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('レポート生成エラー:', error);
    next(error);
  }
};

// レポートPDFのダウンロード
const downloadReportPDF = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    // レポート情報取得
    const report = await GeneratedReport.findByPk(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'レポートが見つかりません'
      });
    }
    
    if (!report.file_path) {
      return res.status(400).json({
        success: false,
        error: 'レポートファイルが生成されていません'
      });
    }
    
    // ファイルパスの解決
    const filePath = path.join(__dirname, '../../../', report.file_path);
    
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'レポートファイルが見つかりません'
      });
    }
    
    // ファイル名の設定
    const fileName = path.basename(filePath);
    
    // ファイルのダウンロード
    res.download(filePath, fileName, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReportPDF,
  downloadReportPDF
};