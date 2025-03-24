/**
 * レポート生成機能のテストスクリプト
 * 
 * 使用方法:
 * 1. テストDBを使用する場合: NODE_ENV=test node tests/manual/testReportGeneration.js
 * 2. 開発DBを使用する場合: NODE_ENV=development node tests/manual/testReportGeneration.js
 */

// .envファイルの読み込み
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { Customer, Inspection, GeneratedReport, ReportTemplate, sequelize } = require('../../models');
const PDFGenerator = require('../../services/report/pdfGenerator');

// レポート保存ディレクトリ
const REPORTS_DIR = path.join(__dirname, '../../reports');

// レポート出力ディレクトリの確認・作成
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * テスト日次レポートの生成
 */
async function generateDailyReport() {
  try {
    console.log('=== 日次レポート生成テスト開始 ===');

    // 顧客の取得（最初の顧客を使用）
    const customer = await Customer.findOne();
    if (!customer) {
      throw new Error('テスト用の顧客データが見つかりません。シードを実行してください。');
    }
    console.log(`顧客情報: ID=${customer.id}, 名前=${customer.customer_name}`);

    // 日付の設定（今日）
    const today = new Date();
    const reportDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const reportPeriod = today.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    console.log(`対象日付: ${reportDate}`);
    console.log(`レポート期間: ${reportPeriod}`);

    // テンプレートの取得（日次）
    const template = await ReportTemplate.findOne({
      where: { type: 'daily' }
    });

    // ファイル名の生成
    const fileName = `test_daily_report_${Date.now()}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);

    // レポートデータの準備
    const reportData = {
      customerId: customer.id,
      reportType: 'daily',
      reportPeriod: reportPeriod,
      reportDate: reportDate,
      title: '日次点検レポート（テスト）',
      templateId: template ? template.id : null,
      notes: 'これは日次レポートのテスト出力です。'
    };

    console.log('レポート生成中...');
    // レポートの生成
    const outputPath = await PDFGenerator.generateReport(reportData, filePath);
    
    console.log(`レポート生成完了: ${outputPath}`);
    console.log('このファイルをPDFビューアで開いてレポートの内容を確認してください。');

    // テスト用にGenerated Reportレコードを作成
    const generatedReport = await GeneratedReport.create({
      customer_id: customer.id,
      report_date: reportDate,
      report_period: reportPeriod,
      report_type: 'daily',
      file_path: path.relative(path.join(__dirname, '../../..'), filePath),
      status: 'completed',
      template_id: template ? template.id : null
    });

    console.log(`レポートレコード作成: ID=${generatedReport.id}`);
    console.log('=== 日次レポート生成テスト完了 ===\n');
  } catch (error) {
    console.error('日次レポート生成エラー:', error);
  }
}

/**
 * テスト月次レポートの生成
 */
async function generateMonthlyReport() {
  try {
    console.log('=== 月次レポート生成テスト開始 ===');

    // 顧客の取得（最初の顧客を使用）
    const customer = await Customer.findOne();
    if (!customer) {
      throw new Error('テスト用の顧客データが見つかりません。シードを実行してください。');
    }
    console.log(`顧客情報: ID=${customer.id}, 名前=${customer.customer_name}`);

    // 日付の設定（今月）
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const reportDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const reportPeriod = `${year}年${month.toString().padStart(2, '0')}月`;

    console.log(`対象月: ${reportPeriod}`);

    // テンプレートの取得（月次）
    const template = await ReportTemplate.findOne({
      where: { type: 'monthly' }
    });

    // ファイル名の生成
    const fileName = `test_monthly_report_${Date.now()}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);

    // レポートデータの準備
    const reportData = {
      customerId: customer.id,
      reportType: 'monthly',
      reportPeriod: reportPeriod,
      reportDate: reportDate,
      title: '月次点検サマリーレポート（テスト）',
      templateId: template ? template.id : null,
      notes: 'これは月次レポートのテスト出力です。実際のデータ集計やサマリーが表示されます。'
    };

    console.log('レポート生成中...');
    // レポートの生成
    const outputPath = await PDFGenerator.generateReport(reportData, filePath);
    
    console.log(`レポート生成完了: ${outputPath}`);
    console.log('このファイルをPDFビューアで開いてレポートの内容を確認してください。');

    // テスト用にGenerated Reportレコードを作成
    const generatedReport = await GeneratedReport.create({
      customer_id: customer.id,
      report_date: reportDate,
      report_period: reportPeriod,
      report_type: 'monthly',
      file_path: path.relative(path.join(__dirname, '../../..'), filePath),
      status: 'completed',
      template_id: template ? template.id : null
    });

    console.log(`レポートレコード作成: ID=${generatedReport.id}`);
    console.log('=== 月次レポート生成テスト完了 ===\n');
  } catch (error) {
    console.error('月次レポート生成エラー:', error);
  }
}

/**
 * メインの実行関数
 */
async function main() {
  try {
    console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
    
    // テンプレートの確認
    const templates = await ReportTemplate.findAll();
    if (templates.length === 0) {
      console.log('警告: レポートテンプレートが登録されていません。');
      console.log('初回実行の場合は、テンプレートシーダーを実行してください:');
      console.log('npx sequelize-cli db:seed --seed 20250324000001-report-templates.js');
    } else {
      console.log(`利用可能なテンプレート: ${templates.length}件`);
      templates.forEach(t => {
        console.log(`- ${t.name} (${t.type}): ${t.template_path}`);
      });
    }
    
    // 点検データの確認
    const inspectionCount = await Inspection.count();
    console.log(`点検データ: ${inspectionCount}件`);
    
    if (inspectionCount === 0) {
      console.log('警告: 点検データがありません。テストレポートにはデータが表示されません。');
    }
    
    // 日次・月次レポートの生成テスト
    await generateDailyReport();
    await generateMonthlyReport();
    
    console.log('全てのテスト完了');
  } catch (error) {
    console.error('テスト実行エラー:', error);
  } finally {
    // Sequelizeの接続を閉じる
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// スクリプトの実行
main();