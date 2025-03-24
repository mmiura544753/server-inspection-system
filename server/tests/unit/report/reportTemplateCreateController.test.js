/**
 * reportTemplateCreateController.jsの単体テスト
 */
const { createReportTemplate } = require('../../../controllers/report/reportTemplateCreateController');
const { ReportTemplate } = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  ReportTemplate: {
    create: jest.fn()
  }
}));

describe('reportTemplateCreateController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReportTemplate', () => {
    it('正常なデータの場合、レポートテンプレートを作成して201を返すこと', async () => {
      // モックデータ
      const mockTemplate = {
        id: 1,
        name: '新規月次レポート',
        type: 'monthly',
        template_path: '/templates/new_monthly.handlebars',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // モック関数の戻り値を設定
      ReportTemplate.create.mockResolvedValue(mockTemplate);
      
      // リクエスト/レスポンスのモック
      const req = {
        body: {
          name: '新規月次レポート',
          type: 'monthly',
          template_path: '/templates/new_monthly.handlebars'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await createReportTemplate(req, res, next);
      
      // 検証
      expect(ReportTemplate.create).toHaveBeenCalledWith({
        name: '新規月次レポート',
        type: 'monthly',
        template_path: '/templates/new_monthly.handlebars'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTemplate
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('必須フィールドが欠けている場合、400エラーを返すこと - 名前が欠けている', async () => {
      // リクエスト/レスポンスのモック
      const req = {
        body: {
          // nameが欠けている
          type: 'monthly',
          template_path: '/templates/new_monthly.handlebars'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await createReportTemplate(req, res, next);
      
      // 検証
      expect(ReportTemplate.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'テンプレート名、タイプ、パスは必須です'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('必須フィールドが欠けている場合、400エラーを返すこと - タイプが欠けている', async () => {
      // リクエスト/レスポンスのモック
      const req = {
        body: {
          name: '新規レポート',
          // typeが欠けている
          template_path: '/templates/new_report.handlebars'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await createReportTemplate(req, res, next);
      
      // 検証
      expect(ReportTemplate.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'テンプレート名、タイプ、パスは必須です'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('必須フィールドが欠けている場合、400エラーを返すこと - テンプレートパスが欠けている', async () => {
      // リクエスト/レスポンスのモック
      const req = {
        body: {
          name: '新規レポート',
          type: 'daily'
          // template_pathが欠けている
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await createReportTemplate(req, res, next);
      
      // 検証
      expect(ReportTemplate.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'テンプレート名、タイプ、パスは必須です'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('無効なタイプの場合、400エラーを返すこと', async () => {
      // リクエスト/レスポンスのモック
      const req = {
        body: {
          name: '新規レポート',
          type: 'invalid', // 無効なタイプ
          template_path: '/templates/new_report.handlebars'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await createReportTemplate(req, res, next);
      
      // 検証
      expect(ReportTemplate.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '無効なレポートタイプです。monthly または daily を指定してください'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('SequelizeValidationErrorの場合、400エラーを返すこと', async () => {
      // バリデーションエラーを作成
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [
          { message: 'テンプレート名は100文字以内で入力してください' }
        ]
      };
      ReportTemplate.create.mockRejectedValue(validationError);
      
      // リクエスト/レスポンスのモック
      const req = {
        body: {
          name: '新規レポート'.repeat(50), // 長すぎる名前
          type: 'monthly',
          template_path: '/templates/new_monthly.handlebars'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await createReportTemplate(req, res, next);
      
      // 検証
      expect(ReportTemplate.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: ['テンプレート名は100文字以内で入力してください']
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('その他のエラーが発生した場合、nextにエラーを渡すこと', async () => {
      // エラーを発生させる
      const error = new Error('データベースエラー');
      ReportTemplate.create.mockRejectedValue(error);
      
      // リクエスト/レスポンスのモック
      const req = {
        body: {
          name: '新規レポート',
          type: 'monthly',
          template_path: '/templates/new_monthly.handlebars'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      // 関数を実行
      await createReportTemplate(req, res, next);
      
      // 検証
      expect(ReportTemplate.create).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});