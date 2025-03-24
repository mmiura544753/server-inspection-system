/**
 * reportTemplateController.jsの単体テスト
 */
const { 
  getReportTemplates, 
  getReportTemplateById, 
  getReportTemplatesByType 
} = require('../../../controllers/report/reportTemplateController');
const { ReportTemplate } = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  ReportTemplate: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  }
}));

describe('reportTemplateController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReportTemplates', () => {
    it('すべてのレポートテンプレートの一覧を返すこと', async () => {
      // モックデータ
      const mockTemplates = [
        {
          id: 1,
          name: '月次レポート',
          type: 'monthly',
          template_path: '/templates/monthly.handlebars',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: '日次レポート',
          type: 'daily',
          template_path: '/templates/daily.handlebars',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // モック関数の戻り値を設定
      ReportTemplate.findAll.mockResolvedValue(mockTemplates);
      
      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await getReportTemplates(req, res, next);
      
      // 検証
      expect(ReportTemplate.findAll).toHaveBeenCalledWith({
        order: [['created_at', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTemplates
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('エラーが発生した場合、nextにエラーを渡すこと', async () => {
      // エラーを発生させる
      const error = new Error('データベースエラー');
      ReportTemplate.findAll.mockRejectedValue(error);
      
      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await getReportTemplates(req, res, next);
      
      // 検証
      expect(ReportTemplate.findAll).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getReportTemplateById', () => {
    it('存在するテンプレートIDの場合、テンプレート情報を返すこと', async () => {
      // モックデータ
      const mockTemplate = {
        id: 1,
        name: '月次レポート',
        type: 'monthly',
        template_path: '/templates/monthly.handlebars',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // モック関数の戻り値を設定
      ReportTemplate.findByPk.mockResolvedValue(mockTemplate);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 1 } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await getReportTemplateById(req, res, next);
      
      // 検証
      expect(ReportTemplate.findByPk).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTemplate
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('存在しないテンプレートIDの場合、404エラーを返すこと', async () => {
      // モック関数の戻り値を設定（存在しないテンプレート）
      ReportTemplate.findByPk.mockResolvedValue(null);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 999 } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await getReportTemplateById(req, res, next);
      
      // 検証
      expect(ReportTemplate.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'テンプレートが見つかりません'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('エラーが発生した場合、nextにエラーを渡すこと', async () => {
      // エラーを発生させる
      const error = new Error('データベースエラー');
      ReportTemplate.findByPk.mockRejectedValue(error);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 1 } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await getReportTemplateById(req, res, next);
      
      // 検証
      expect(ReportTemplate.findByPk).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getReportTemplatesByType', () => {
    it('有効なタイプの場合、対応するテンプレート一覧を返すこと', async () => {
      // モックデータ
      const mockTemplates = [
        {
          id: 1,
          name: '月次レポートA',
          type: 'monthly',
          template_path: '/templates/monthly_a.handlebars',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: '月次レポートB',
          type: 'monthly',
          template_path: '/templates/monthly_b.handlebars',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // モック関数の戻り値を設定
      ReportTemplate.findAll.mockResolvedValue(mockTemplates);
      
      // リクエスト/レスポンスのモック
      const req = { params: { type: 'monthly' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await getReportTemplatesByType(req, res, next);
      
      // 検証
      expect(ReportTemplate.findAll).toHaveBeenCalledWith({
        where: { type: 'monthly' },
        order: [['created_at', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTemplates
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('無効なタイプの場合、400エラーを返すこと', async () => {
      // リクエスト/レスポンスのモック
      const req = { params: { type: 'invalid' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await getReportTemplatesByType(req, res, next);
      
      // 検証
      expect(ReportTemplate.findAll).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '無効なレポートタイプです'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('エラーが発生した場合、nextにエラーを渡すこと', async () => {
      // エラーを発生させる
      const error = new Error('データベースエラー');
      ReportTemplate.findAll.mockRejectedValue(error);
      
      // リクエスト/レスポンスのモック
      const req = { params: { type: 'daily' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await getReportTemplatesByType(req, res, next);
      
      // 検証
      expect(ReportTemplate.findAll).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});