// tests/unit/report/services/pdfGenerator.test.js
const path = require('path');
const fs = require('fs');
const PDFGenerator = require('../../../../services/report/pdfGenerator');
const TemplateEngine = require('../../../../services/report/templateEngine');
const { Customer, Device, Inspection, InspectionResult, InspectionItem, InspectionItemName, ReportTemplate } = require('../../../../models');

// PDFDocument, モデルとSequelizeをモック化
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      pipe: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      end: jest.fn(),
      page: {
        width: 595.28,
        height: 841.89,
        pageNumber: 1
      },
      y: 100
    };
  });
});

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'finish') {
        callback();
      }
    })
  })),
  readFileSync: jest.fn().mockReturnValue('{}')
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn().mockReturnValue('/mock/path'),
  dirname: jest.fn().mockReturnValue('/mock/dir')
}));

// TemplateEngineをモック化
jest.mock('../../../../services/report/templateEngine', () => ({
  getDefaultTemplatePath: jest.fn().mockReturnValue('/path/to/template.json'),
  loadTemplate: jest.fn().mockReturnValue({
    name: 'テストテンプレート',
    type: 'daily',
    sections: [
      { title: '点検概要', type: 'summary' }
    ]
  }),
  validateTemplate: jest.fn().mockReturnValue(true),
  mergeTemplateWithData: jest.fn().mockReturnValue({
    title: 'テストレポート',
    customerName: 'テスト顧客',
    reportPeriod: '2025年03月',
    reportDate: '2025-03-01',
    sections: [
      { title: '点検概要', type: 'summary', content: { inspectionCount: 1, date: '2025/03/01', inspectorNames: 'テスト担当者' } }
    ],
    footer: { text: 'テストフッター' }
  })
}));

// Sequelizeモデルをモック化
jest.mock('../../../../models', () => {
  const mockCustomer = {
    id: 1,
    customer_name: 'テスト顧客',
    contact_person: 'テスト担当者',
    email: 'test@example.com'
  };
  
  const mockTemplate = {
    id: 1,
    name: 'テストテンプレート',
    type: 'daily',
    template_path: '/path/to/template.json'
  };
  
  return {
    Customer: {
      findByPk: jest.fn().mockResolvedValue(mockCustomer)
    },
    ReportTemplate: {
      findByPk: jest.fn().mockResolvedValue(mockTemplate)
    },
    Inspection: {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 1,
          inspection_date: new Date('2025-03-01'),
          inspector_name: 'テスト担当者',
          results: [
            {
              id: 1,
              check_result: true,
              note: 'テストノート',
              result_device: { id: 1, name: 'テストデバイス' },
              inspection_item: { 
                id: 1, 
                item_name_master: { id: 1, name: 'テスト項目' } 
              }
            }
          ]
        }
      ])
    },
    Device: {},
    InspectionResult: {},
    InspectionItem: {},
    InspectionItemName: {},
    Op: {
      between: Symbol('between')
    }
  };
});

describe('PDFGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('正常にPDFレポートを生成できること', async () => {
      const reportData = {
        customerId: 1,
        reportType: 'daily',
        reportPeriod: '2025年03月',
        reportDate: '2025-03-01',
        title: 'テスト日次レポート'
      };
      
      const outputPath = '/path/to/output.pdf';
      
      const result = await PDFGenerator.generateReport(reportData, outputPath);
      
      // 顧客情報の取得を確認
      expect(Customer.findByPk).toHaveBeenCalledWith(1);
      
      // テンプレートの処理を確認
      expect(TemplateEngine.getDefaultTemplatePath).toHaveBeenCalledWith('daily');
      expect(TemplateEngine.loadTemplate).toHaveBeenCalled();
      expect(TemplateEngine.validateTemplate).toHaveBeenCalled();
      
      // 出力ディレクトリの確認
      expect(fs.existsSync).toHaveBeenCalled();
      
      // PDFの生成を確認
      expect(result).toBe(outputPath);
    });
    
    it('顧客情報が見つからない場合はエラーになること', async () => {
      // 顧客が見つからないケース
      Customer.findByPk.mockResolvedValueOnce(null);
      
      const reportData = {
        customerId: 999, // 存在しないID
        reportType: 'daily',
        reportPeriod: '2025年03月',
        reportDate: '2025-03-01'
      };
      
      const outputPath = '/path/to/output.pdf';
      
      await expect(PDFGenerator.generateReport(reportData, outputPath))
        .rejects.toThrow('顧客情報が見つかりません');
    });
    
    it('テンプレートIDが指定された場合は該当テンプレートを使用すること', async () => {
      const reportData = {
        customerId: 1,
        reportType: 'daily',
        reportPeriod: '2025年03月',
        reportDate: '2025-03-01',
        templateId: 2
      };
      
      const outputPath = '/path/to/output.pdf';
      
      await PDFGenerator.generateReport(reportData, outputPath);
      
      // テンプレート取得を確認
      expect(ReportTemplate.findByPk).toHaveBeenCalledWith(2);
    });
    
    it('無効なテンプレートの場合はエラーになること', async () => {
      // テンプレート検証が失敗するケース
      TemplateEngine.validateTemplate.mockReturnValueOnce(false);
      
      const reportData = {
        customerId: 1,
        reportType: 'daily',
        reportPeriod: '2025年03月',
        reportDate: '2025-03-01'
      };
      
      const outputPath = '/path/to/output.pdf';
      
      await expect(PDFGenerator.generateReport(reportData, outputPath))
        .rejects.toThrow('無効なテンプレート形式です');
    });
    
    it('月次レポートの期間処理が正しく行われること', async () => {
      const reportData = {
        customerId: 1,
        reportType: 'monthly',
        reportPeriod: '2025年03月',
        reportDate: '2025-03-15'
      };
      
      const outputPath = '/path/to/output.pdf';
      
      // テスト用にモックを再設定
      TemplateEngine.loadTemplate.mockReturnValueOnce({
        name: 'テスト月次テンプレート',
        type: 'monthly',
        sections: [{ title: '月次概要', type: 'monthly_summary' }]
      });
      
      await PDFGenerator.generateReport(reportData, outputPath);
      
      // 期間の処理が正しく行われることを確認
      expect(Inspection.findAll).toHaveBeenCalled();
      const whereClause = Inspection.findAll.mock.calls[0][0].where;
      expect(whereClause).toHaveProperty('inspection_date');
    });
    
    it('ISO形式の月次レポート期間も処理できること', async () => {
      const reportData = {
        customerId: 1,
        reportType: 'monthly',
        reportPeriod: '2025-03',
        reportDate: '2025-03-15'
      };
      
      const outputPath = '/path/to/output.pdf';
      
      // テスト用にモックを再設定
      TemplateEngine.loadTemplate.mockReturnValueOnce({
        name: 'テスト月次テンプレート',
        type: 'monthly',
        sections: [{ title: '月次概要', type: 'monthly_summary' }]
      });
      
      await PDFGenerator.generateReport(reportData, outputPath);
      
      // 期間の処理が正しく行われることを確認
      expect(Inspection.findAll).toHaveBeenCalled();
    });
    
    it('無効なレポートタイプの場合はエラーになること', async () => {
      const reportData = {
        customerId: 1,
        reportType: 'invalid',
        reportPeriod: '2025年03月',
        reportDate: '2025-03-01'
      };
      
      const outputPath = '/path/to/output.pdf';
      
      await expect(PDFGenerator.generateReport(reportData, outputPath))
        .rejects.toThrow('無効なレポートタイプです');
    });
    
    it('出力ディレクトリが存在しない場合は作成すること', async () => {
      // ディレクトリが存在しないケース
      fs.existsSync.mockReturnValueOnce(false);
      
      const reportData = {
        customerId: 1,
        reportType: 'daily',
        reportPeriod: '2025年03月',
        reportDate: '2025-03-01'
      };
      
      const outputPath = '/path/to/output.pdf';
      
      await PDFGenerator.generateReport(reportData, outputPath);
      
      // ディレクトリ作成を確認
      expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/dir', { recursive: true });
    });
  });

  describe('レンダリングメソッド', () => {
    it('_renderPDFが各セクションを処理すること', () => {
      const doc = new (require('pdfkit'))();
      const data = {
        title: 'テストレポート',
        customerName: 'テスト顧客',
        reportPeriod: '2025年03月',
        reportDate: '2025-03-01',
        sections: [
          { title: '点検概要', type: 'summary', content: { inspectionCount: 1, date: '2025/03/01', inspectorNames: 'テスト担当者' } },
          { title: '結果テーブル', type: 'results_table', content: { rows: [{ device: 'テストデバイス', item: 'テスト項目', status: 'OK', remarks: '' }] } }
        ],
        footer: { text: 'テストフッター' }
      };
      
      // スパイを設定
      const renderHeaderSpy = jest.spyOn(PDFGenerator, '_renderHeader');
      const renderSectionSpy = jest.spyOn(PDFGenerator, '_renderSection');
      const renderFooterSpy = jest.spyOn(PDFGenerator, '_renderFooter');
      
      PDFGenerator._renderPDF(doc, data);
      
      // 各レンダリングメソッドが呼ばれることを確認
      expect(renderHeaderSpy).toHaveBeenCalledWith(doc, data);
      expect(renderSectionSpy).toHaveBeenCalledTimes(2);
      expect(renderFooterSpy).toHaveBeenCalledWith(doc, data.footer);
      
      // スパイをリストア
      renderHeaderSpy.mockRestore();
      renderSectionSpy.mockRestore();
      renderFooterSpy.mockRestore();
    });
    
    it('_renderSectionが各セクションタイプに応じたメソッドを呼び出すこと', () => {
      const doc = new (require('pdfkit'))();
      
      // 各セクションタイプのスパイを設定
      const renderSummarySpy = jest.spyOn(PDFGenerator, '_renderSummarySection').mockImplementation(() => {});
      const renderResultsTableSpy = jest.spyOn(PDFGenerator, '_renderResultsTableSection').mockImplementation(() => {});
      const renderIssuesSpy = jest.spyOn(PDFGenerator, '_renderIssuesSection').mockImplementation(() => {});
      const renderMonthlySummarySpy = jest.spyOn(PDFGenerator, '_renderMonthlySummarySection').mockImplementation(() => {});
      const renderDailyCountsSpy = jest.spyOn(PDFGenerator, '_renderDailyCountsSection').mockImplementation(() => {});
      const renderIssueDevicesSpy = jest.spyOn(PDFGenerator, '_renderIssueDevicesSection').mockImplementation(() => {});
      const renderIssueTrendsSpy = jest.spyOn(PDFGenerator, '_renderIssueTrendsSection').mockImplementation(() => {});
      const renderRecommendationsSpy = jest.spyOn(PDFGenerator, '_renderRecommendationsSection').mockImplementation(() => {});
      const renderNotesSpy = jest.spyOn(PDFGenerator, '_renderNotesSection').mockImplementation(() => {});
      
      // 各タイプのセクションでテスト
      PDFGenerator._renderSection(doc, { title: '点検概要', type: 'summary', content: {} });
      expect(renderSummarySpy).toHaveBeenCalled();
      
      PDFGenerator._renderSection(doc, { title: '結果テーブル', type: 'results_table', content: {} });
      expect(renderResultsTableSpy).toHaveBeenCalled();
      
      PDFGenerator._renderSection(doc, { title: '異常項目', type: 'issues', content: {} });
      expect(renderIssuesSpy).toHaveBeenCalled();
      
      PDFGenerator._renderSection(doc, { title: '月次概要', type: 'monthly_summary', content: {} });
      expect(renderMonthlySummarySpy).toHaveBeenCalled();
      
      PDFGenerator._renderSection(doc, { title: '日別点検数', type: 'daily_counts', content: {} });
      expect(renderDailyCountsSpy).toHaveBeenCalled();
      
      PDFGenerator._renderSection(doc, { title: '異常検出機器', type: 'issue_devices', content: {} });
      expect(renderIssueDevicesSpy).toHaveBeenCalled();
      
      PDFGenerator._renderSection(doc, { title: '異常項目の傾向', type: 'issue_trends', content: {} });
      expect(renderIssueTrendsSpy).toHaveBeenCalled();
      
      PDFGenerator._renderSection(doc, { title: '推奨メンテナンス', type: 'recommendations', content: {} });
      expect(renderRecommendationsSpy).toHaveBeenCalled();
      
      PDFGenerator._renderSection(doc, { title: '備考', type: 'notes', content: {} });
      expect(renderNotesSpy).toHaveBeenCalled();
      
      // 不明なタイプのセクション
      PDFGenerator._renderSection(doc, { title: '不明なセクション', type: 'unknown', content: {} });
      expect(doc.text).toHaveBeenCalled();
      
      // スパイをリストア
      renderSummarySpy.mockRestore();
      renderResultsTableSpy.mockRestore();
      renderIssuesSpy.mockRestore();
      renderMonthlySummarySpy.mockRestore();
      renderDailyCountsSpy.mockRestore();
      renderIssueDevicesSpy.mockRestore();
      renderIssueTrendsSpy.mockRestore();
      renderRecommendationsSpy.mockRestore();
      renderNotesSpy.mockRestore();
    });
  });
});