/**
 * customerController.jsの単体テスト
 */
const { getCustomerById, getCustomers } = require('../../controllers/customer/customerController');
const { Customer } = require('../../models');

// モックの設定
jest.mock('../../models', () => ({
  Customer: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  }
}));

describe('customerController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomerById', () => {
    it('存在する顧客IDの場合、顧客情報をJSON形式で返す', async () => {
      // モックデータ
      const mockCustomer = {
        id: 1,
        customer_name: 'テスト顧客',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // モック関数の戻り値を設定
      Customer.findByPk.mockResolvedValue(mockCustomer);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 1 } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      // 関数を実行
      await getCustomerById(req, res);
      
      // 検証
      expect(Customer.findByPk).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockCustomer);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('存在しない顧客IDの場合、404エラーを返す', async () => {
      // モック関数の戻り値を設定（存在しない顧客）
      Customer.findByPk.mockResolvedValue(null);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 999 } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await getCustomerById(req, res, next);
      } catch (error) {
        expect(error.message).toBe('顧客が見つかりません');
      }
      
      // 検証
      expect(Customer.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getCustomers', () => {
    it('すべての顧客の一覧を返す', async () => {
      // モックデータ
      const mockCustomers = [
        {
          id: 1,
          customer_name: '顧客A',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          customer_name: '顧客B',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // モック関数の戻り値を設定
      Customer.findAll.mockResolvedValue(mockCustomers);
      
      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn()
      };
      
      // 関数を実行
      await getCustomers(req, res);
      
      // 検証
      expect(Customer.findAll).toHaveBeenCalledWith({
        order: [['customer_name', 'ASC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockCustomers);
    });
  });
});