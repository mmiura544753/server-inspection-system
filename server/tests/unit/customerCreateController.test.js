/**
 * customerCreateController.jsの単体テスト
 */
const { createCustomer } = require('../../controllers/customer/customerCreateController');
const { Customer } = require('../../models');

// モックの設定
jest.mock('../../models', () => ({
  Customer: {
    create: jest.fn()
  }
}));

describe('customerCreateController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('有効なリクエストボディで新規顧客を作成する', async () => {
      // テストデータ
      const customerData = {
        customer_name: 'テスト顧客'
      };
      
      // モック関数の戻り値を設定
      const mockCreatedCustomer = {
        id: 1,
        ...customerData,
        created_at: new Date(),
        updated_at: new Date()
      };
      Customer.create.mockResolvedValue(mockCreatedCustomer);
      
      // リクエスト/レスポンスのモック
      const req = { body: customerData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // 関数を実行
      await createCustomer(req, res);
      
      // 検証
      expect(Customer.create).toHaveBeenCalledWith(customerData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreatedCustomer);
    });

    it('顧客名が未入力の場合、400エラーを返す', async () => {
      // リクエスト/レスポンスのモック
      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await createCustomer(req, res, next);
      } catch (error) {
        expect(error.message).toBe('顧客名は必須です');
      }
      
      // 検証
      expect(Customer.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    it('バリデーションエラーの場合、400エラーを返す', async () => {
      // テストデータ
      const customerData = {
        customer_name: 'テスト顧客'
      };
      
      // バリデーションエラーの模擬
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [
          { message: '顧客名は必須です' }
        ]
      };
      Customer.create.mockRejectedValue(validationError);
      
      // リクエスト/レスポンスのモック
      const req = { body: customerData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await createCustomer(req, res, next);
      } catch (error) {
        expect(error.message).toBe('顧客名は必須です');
      }
      
      // 検証
      expect(Customer.create).toHaveBeenCalledWith(customerData);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});