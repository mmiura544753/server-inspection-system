// tests/unit/report/reportGenerationController.test.js
const { generateReportPDF, downloadReportPDF } = require('../../../controllers/report/reportGenerationController');
const { GeneratedReport, ReportTemplate, Customer } = require('../../../models');
const PDFGenerator = require('../../../services/report/pdfGenerator');
const path = require('path');
const fs = require('fs');

// モックの設定
jest.mock('../../../models', () => {
  const mockReport = {
    id: 1,
    customer_id: 1,
    report_type: 'daily',
    report_period: '2025年03月01日',
    report_date: '2025-03-01',
    file_path: null,
    template_id: 1,
    status: 'draft',
    update: jest.fn().mockResolvedValue(true)
  };
  
  return {
    GeneratedReport: {
      findByPk: jest.fn().mockResolvedValue(mockReport)
    },
    ReportTemplate: {},
    Customer: {}
  };
});

jest.mock('../../../services/report/pdfGenerator', () => ({
  generateReport: jest.fn().mockResolvedValue('/path/to/generated/report.pdf')
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((a, b, c) => `${a}/${b}/${c}`),
  dirname: jest.fn(path => path.substring(0, path.lastIndexOf('/'))),
  relative: jest.fn((from, to) => to),
  basename: jest.fn(path => path.substring(path.lastIndexOf('/') + 1))
}));

describe('reportGenerationController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // リクエスト、レスポンス、ネクストのモック
    req = {
      params: { reportId: '1' },
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      download: jest.fn()
    };

    next = jest.fn();

    // ディレクトリの存在確認
    fs.existsSync.mockReturnValue(true);
  });

  describe('generateReportPDF', () => {
    it('正常にPDFレポートを生成できること', async () => {
      await generateReportPDF(req, res, next);

      // レポート情報の取得を確認
      expect(GeneratedReport.findByPk).toHaveBeenCalledWith('1', expect.any(Object));

      // ディレクトリの作成確認
      expect(fs.existsSync).toHaveBeenCalled();

      // PDFGeneratorの呼び出しを確認
      expect(PDFGenerator.generateReport).toHaveBeenCalled();
      expect(PDFGenerator.generateReport.mock.calls[0][0]).toEqual(expect.objectContaining({
        customerId: 1,
        reportType: 'daily',
        reportPeriod: '2025年03月01日',
        reportDate: '2025-03-01'
      }));

      // レポートの更新を確認
      const mockReport = GeneratedReport.findByPk.mock.results[0].value;
      expect(mockReport.update).toHaveBeenCalledWith(expect.objectContaining({
        file_path: expect.any(String),
        status: 'completed'
      }));

      // レスポンスを確認
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 1,
          status: 'completed'
        })
      }));
    });

    it('リクエストボディにnotesがある場合、PDFGeneratorに渡されること', async () => {
      req.body = { notes: 'テスト備考' };

      await generateReportPDF(req, res, next);

      // notesがPDFGeneratorに渡されることを確認
      expect(PDFGenerator.generateReport.mock.calls[0][0]).toEqual(expect.objectContaining({
        notes: 'テスト備考'
      }));
    });

    it('レポートが見つからない場合は404エラーを返すこと', async () => {
      // レポートが見つからないケース
      GeneratedReport.findByPk.mockResolvedValueOnce(null);

      await generateReportPDF(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'レポートが見つかりません'
      }));
    });

    it('出力ディレクトリが存在しない場合は作成すること', async () => {
      // ディレクトリが存在しないケース
      fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);

      await generateReportPDF(req, res, next);

      // ディレクトリ作成を確認
      expect(fs.mkdirSync).toHaveBeenCalledTimes(2);
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('エラーが発生した場合はnext関数に渡すこと', async () => {
      // エラーを発生させる
      const error = new Error('テストエラー');
      GeneratedReport.findByPk.mockRejectedValueOnce(error);

      await generateReportPDF(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('downloadReportPDF', () => {
    it('正常にPDFファイルをダウンロードできること', async () => {
      // ファイルパスのあるレポート
      const reportWithFile = {
        id: 1,
        file_path: '/path/to/report.pdf'
      };
      GeneratedReport.findByPk.mockResolvedValueOnce(reportWithFile);

      await downloadReportPDF(req, res, next);

      // レポート情報の取得を確認
      expect(GeneratedReport.findByPk).toHaveBeenCalledWith('1');

      // ファイルの存在確認
      expect(fs.existsSync).toHaveBeenCalled();

      // ダウンロードを確認
      expect(res.download).toHaveBeenCalled();
      expect(res.download.mock.calls[0][0]).toContain('/path/to/report.pdf');
    });

    it('レポートが見つからない場合は404エラーを返すこと', async () => {
      // レポートが見つからないケース
      GeneratedReport.findByPk.mockResolvedValueOnce(null);

      await downloadReportPDF(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'レポートが見つかりません'
      }));
    });

    it('ファイルパスがない場合は400エラーを返すこと', async () => {
      // ファイルパスのないレポート
      const reportWithoutFile = {
        id: 1,
        file_path: null
      };
      GeneratedReport.findByPk.mockResolvedValueOnce(reportWithoutFile);

      await downloadReportPDF(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'レポートファイルが生成されていません'
      }));
    });

    it('ファイルが存在しない場合は404エラーを返すこと', async () => {
      // ファイルパスのあるレポート
      const reportWithFile = {
        id: 1,
        file_path: '/path/to/report.pdf'
      };
      GeneratedReport.findByPk.mockResolvedValueOnce(reportWithFile);

      // ファイルが存在しないケース
      fs.existsSync.mockReturnValueOnce(false);

      await downloadReportPDF(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'レポートファイルが見つかりません'
      }));
    });

    it('ダウンロード中にエラーが発生した場合はnext関数に渡すこと', async () => {
      // ファイルパスのあるレポート
      const reportWithFile = {
        id: 1,
        file_path: '/path/to/report.pdf'
      };
      GeneratedReport.findByPk.mockResolvedValueOnce(reportWithFile);

      // ダウンロード時にエラーを発生させる
      const error = new Error('ダウンロードエラー');
      res.download.mockImplementationOnce((path, filename, callback) => {
        callback(error);
      });

      await downloadReportPDF(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});