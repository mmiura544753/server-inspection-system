/**
 * レポートAPIの統合テスト
 * 注意: 実際のDBに接続する代わりにモックを使用
 */
const request = require('supertest');
// expressをモック
jest.mock('express', () => {
  const mockExpress = () => {
    const app = {
      use: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      post: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis()
    };
    return app;
  };
  
  mockExpress.json = jest.fn().mockReturnValue(jest.fn());
  
  return mockExpress;
});

const express = require('express');
const path = require('path');
const fs = require('fs');

// PDFGeneratorのモック化
jest.mock('../../services/report/pdfGenerator', () => ({
  generateReport: jest.fn().mockResolvedValue(true)
}));

// パス操作のモック化
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  relative: jest.fn().mockReturnValue('reports/customer_1/test_report.pdf'),
  basename: jest.fn().mockReturnValue('test_report.pdf')
}));

// ファイルシステム操作のモック化
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn().mockReturnValue(undefined),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('dummy pdf content'))
}));

// モデルのモック化
jest.mock('../../models', () => {
  // モックレポートテンプレートのヘルパー関数
  function mockReportTemplate(overrides = {}) {
    const defaults = {
      id: 1,
      name: 'テスト月次レポート',
      type: 'monthly',
      template_path: '/templates/monthly_report.handlebars',
      created_at: new Date(),
      updated_at: new Date()
    };
    return { ...defaults, ...overrides };
  }

  // モック生成レポートのヘルパー関数
  function mockGeneratedReport(overrides = {}) {
    const defaults = {
      id: 1,
      customer_id: 1,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      file_path: 'reports/customer_1/test_report.pdf',
      status: 'draft',
      template_id: 1,
      created_by: 1,
      created_at: new Date(),
      updated_at: new Date(),
      customer: {
        id: 1,
        customer_name: 'テスト顧客'
      },
      template: {
        id: 1,
        name: 'テスト月次レポート',
        type: 'monthly'
      },
      update: jest.fn().mockImplementation(function(data) {
        Object.assign(this, data);
        return Promise.resolve(this);
      }),
      destroy: jest.fn().mockResolvedValue(true)
    };
    return { ...defaults, ...overrides };
  }

  const ReportTemplateMock = {
    findAll: jest.fn().mockImplementation(({ where } = {}) => {
      if (where && where.type) {
        if (where.type === 'monthly') {
          return Promise.resolve([
            mockReportTemplate(),
            mockReportTemplate({ id: 3, name: 'テスト月次レポートB' })
          ]);
        } else if (where.type === 'daily') {
          return Promise.resolve([
            mockReportTemplate({ id: 2, name: 'テスト日次レポート', type: 'daily' })
          ]);
        }
      }
      return Promise.resolve([
        mockReportTemplate(),
        mockReportTemplate({ id: 2, name: 'テスト日次レポート', type: 'daily' }),
        mockReportTemplate({ id: 3, name: 'テスト月次レポートB' })
      ]);
    }),
    findByPk: jest.fn().mockImplementation((id) => {
      if (id == 1) {
        return Promise.resolve(mockReportTemplate());
      } else if (id == 2) {
        return Promise.resolve(mockReportTemplate({ 
          id: 2, 
          name: 'テスト日次レポート', 
          type: 'daily',
          template_path: '/templates/daily_report.handlebars'
        }));
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((data) => {
      // バリデーションチェック
      if (!data.name || !data.type || !data.template_path) {
        const error = new Error('テンプレート名、タイプ、パスは必須です');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: 'テンプレート名、タイプ、パスは必須です' }];
        return Promise.reject(error);
      }
      
      if (!['monthly', 'daily'].includes(data.type)) {
        const error = new Error('無効なレポートタイプです');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '無効なレポートタイプです' }];
        return Promise.reject(error);
      }
      
      return Promise.resolve({
        id: 99,
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      });
    })
  };

  const GeneratedReportMock = {
    findAll: jest.fn().mockImplementation(({ where } = {}) => {
      if (where && where.customer_id) {
        return Promise.resolve([
          mockGeneratedReport(),
          mockGeneratedReport({ id: 2, report_period: '2025年04月' })
        ]);
      } else if (where && where.report_type) {
        if (where.report_type === 'monthly') {
          return Promise.resolve([
            mockGeneratedReport(),
            mockGeneratedReport({ id: 2, report_period: '2025年04月' })
          ]);
        } else {
          return Promise.resolve([
            mockGeneratedReport({ 
              id: 3, 
              report_type: 'daily', 
              report_period: '2025年03月15日', 
              template_id: 2 
            })
          ]);
        }
      }
      return Promise.resolve([
        mockGeneratedReport(),
        mockGeneratedReport({ id: 2, report_period: '2025年04月' }),
        mockGeneratedReport({ 
          id: 3, 
          report_type: 'daily', 
          report_period: '2025年03月15日', 
          template_id: 2 
        })
      ]);
    }),
    findByPk: jest.fn().mockImplementation((id, options) => {
      if (id == 1) {
        const report = mockGeneratedReport();
        if (options && options.include) {
          // 既に関連データが設定済みなので何もしない
        }
        return Promise.resolve(report);
      } else if (id == 2) {
        const report = mockGeneratedReport({ 
          id: 2, 
          report_period: '2025年04月',
          file_path: null // ファイルパスがない場合
        });
        return Promise.resolve(report);
      } else if (id == 3) {
        const report = mockGeneratedReport({ 
          id: 3,
          report_type: 'daily',
          report_period: '2025年03月15日',
          template_id: 2
        });
        return Promise.resolve(report);
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((data) => {
      // バリデーションチェック
      if (!data.customer_id || !data.report_date || !data.report_period || !data.report_type || !data.template_id) {
        const error = new Error('必須フィールドが不足しています');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '必須フィールドが不足しています' }];
        return Promise.reject(error);
      }
      
      return Promise.resolve({
        id: 99,
        ...data,
        status: data.status || 'draft',
        created_at: new Date(),
        updated_at: new Date()
      });
    })
  };
  
  return {
    ReportTemplate: ReportTemplateMock,
    GeneratedReport: GeneratedReportMock,
    Customer: {
      findByPk: jest.fn().mockResolvedValue({
        id: 1,
        customer_name: 'テスト顧客'
      })
    }
  };
});

// モジュールのインポート
const reportRoutes = require('../../routes/reportRoutes');
const { errorHandler, notFound } = require('../../middleware/errorHandler');

// 統合テスト用にExpress appを作成
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/reports', reportRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

// リクエスト用のテストアプリ
const app = createTestApp();

describe('レポートAPI統合テスト', () => {
  beforeAll(() => {
    // モックの準備
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    // モックのリセット
    jest.restoreAllMocks();
  });
  
  describe('レポートテンプレートAPI', () => {
    describe('GET /api/reports/templates', () => {
      it('すべてのレポートテンプレートの一覧を取得できる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/reports/templates')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(3);
        expect(response.body.data[0]).toHaveProperty('name', 'テスト月次レポート');
      });
    });
    
    describe('GET /api/reports/templates/:id', () => {
      it('存在するテンプレートIDでテンプレート詳細を取得できる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/reports/templates/1')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', 1);
        expect(response.body.data).toHaveProperty('name', 'テスト月次レポート');
        expect(response.body.data).toHaveProperty('type', 'monthly');
      });
      
      it('存在しないテンプレートIDで404エラーを返す', async () => {
        const response = await request(app)
          .get('/api/reports/templates/999');
        
        // レスポンスの検証
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'テンプレートが見つかりません');
      });
    });
    
    describe('GET /api/reports/templates/type/:type', () => {
      it('月次タイプのテンプレート一覧を取得できる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/reports/templates/type/monthly')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0]).toHaveProperty('type', 'monthly');
      });

      it('日次タイプのテンプレート一覧を取得できる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/reports/templates/type/daily')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('type', 'daily');
      });
      
      it('無効なタイプで400エラーを返す', async () => {
        const response = await request(app)
          .get('/api/reports/templates/type/invalid');
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', '無効なレポートタイプです');
      });
    });
    
    describe('POST /api/reports/templates', () => {
      it('有効なデータで新規テンプレートを作成できる', async () => {
        // テスト実行
        const response = await request(app)
          .post('/api/reports/templates')
          .send({
            name: '新規テストテンプレート',
            type: 'monthly',
            template_path: '/templates/new_test.handlebars'
          })
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name', '新規テストテンプレート');
      });
      
      it('必須フィールドが欠けている場合に400エラーを返す', async () => {
        // テスト実行
        const response = await request(app)
          .post('/api/reports/templates')
          .send({
            name: '不完全なテンプレート',
            // type が欠けている
            template_path: '/templates/incomplete.handlebars'
          })
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'テンプレート名、タイプ、パスは必須です');
      });
      
      it('無効なタイプで400エラーを返す', async () => {
        // テスト実行
        const response = await request(app)
          .post('/api/reports/templates')
          .send({
            name: '無効なタイプのテンプレート',
            type: 'invalid',
            template_path: '/templates/invalid.handlebars'
          })
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', '無効なレポートタイプです。monthly または daily を指定してください');
      });
    });
  });
  
  describe('生成されたレポートAPI', () => {
    describe('GET /api/reports/generated', () => {
      it('すべての生成されたレポート一覧を取得できる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/reports/generated')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(3);
      });
    });
    
    describe('GET /api/reports/generated/:id', () => {
      it('存在するレポートIDでレポート詳細を取得できる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/reports/generated/1')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', 1);
        expect(response.body.data).toHaveProperty('report_period', '2025年03月');
      });
      
      it('存在しないレポートIDで404エラーを返す', async () => {
        const response = await request(app)
          .get('/api/reports/generated/999');
        
        // レスポンスの検証
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'レポートが見つかりません');
      });
    });
    
    describe('GET /api/reports/generated/customer/:customerId', () => {
      it('顧客IDでレポート一覧をフィルタリングできる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/reports/generated/customer/1')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0]).toHaveProperty('customer_id', 1);
      });
    });
    
    describe('GET /api/reports/generated/type/:type', () => {
      it('レポートタイプでレポート一覧をフィルタリングできる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/reports/generated/type/monthly')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0]).toHaveProperty('report_type', 'monthly');
      });
      
      it('無効なレポートタイプで400エラーを返す', async () => {
        const response = await request(app)
          .get('/api/reports/generated/type/invalid');
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', '無効なレポートタイプです');
      });
    });
    
    describe('POST /api/reports/generated', () => {
      it('有効なデータで新規レポートを作成できる', async () => {
        // テスト実行
        const response = await request(app)
          .post('/api/reports/generated')
          .send({
            customer_id: 1,
            report_date: '2025-03-15',
            report_period: '2025年03月',
            report_type: 'monthly',
            template_id: 1,
            created_by: 1
          })
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('report_period', '2025年03月');
      });
      
      it('必須フィールドが欠けている場合に400エラーを返す', async () => {
        // テスト実行
        const response = await request(app)
          .post('/api/reports/generated')
          .send({
            customer_id: 1,
            // report_date が欠けている
            report_period: '2025年03月',
            report_type: 'monthly',
            template_id: 1
          })
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });
  });
  
  describe('レポート生成API', () => {
    describe('POST /api/reports/generate/:reportId', () => {
      it('存在するレポートIDでPDFを生成できる', async () => {
        // テスト実行
        const response = await request(app)
          .post('/api/reports/generate/1')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', 1);
        expect(response.body.data).toHaveProperty('file_path');
        expect(response.body.data).toHaveProperty('status', 'completed');
      });
      
      it('存在しないレポートIDで404エラーを返す', async () => {
        const response = await request(app)
          .post('/api/reports/generate/999');
        
        // レスポンスの検証
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'レポートが見つかりません');
      });
    });
    
    describe('GET /api/reports/download/:reportId', () => {
      it('存在するレポートIDでファイルをダウンロードできる', async () => {
        // モックレスポンスを使用
        const mockRes = {
          download: jest.fn((path, filename, callback) => {
            callback();
            return {
              status: 200,
              type: 'application/pdf'
            };
          }),
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        // Expressのrequestオブジェクトをモック
        const req = { params: { reportId: 1 } };
        
        // レポートダウンロードコントローラーを直接呼び出し
        const { downloadReportPDF } = require('../../controllers/report/reportGenerationController');
        await downloadReportPDF(req, mockRes);
        
        // 検証
        expect(mockRes.download).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockRes.json).not.toHaveBeenCalled();
      });
      
      it('ファイルパスがないレポートIDで400エラーを返す', async () => {
        const response = await request(app)
          .get('/api/reports/download/2');
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'レポートファイルが生成されていません');
      });
      
      it('存在しないレポートIDで404エラーを返す', async () => {
        const response = await request(app)
          .get('/api/reports/download/999');
        
        // レスポンスの検証
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'レポートが見つかりません');
      });
    });
  });
});