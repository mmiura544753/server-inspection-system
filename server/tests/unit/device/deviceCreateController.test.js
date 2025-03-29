/**
 * deviceCreateController.jsの単体テスト
 */
const { createDevice } = require('../../../controllers/device/deviceCreateController');
const { Device, Customer } = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  Device: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn()
  },
  Customer: {
    findByPk: jest.fn()
  }
}));

describe('deviceCreateController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDevice', () => {
    it('有効なリクエストボディで新規機器を作成する', async () => {
      // テストデータ
      const deviceData = {
        customer_id: 1,
        device_name: 'テストサーバ',
        model: 'TEST-MODEL',
        rack_number: 1,
        unit_start_position: 10,
        unit_end_position: 12,
        device_type: 'サーバ',
        hardware_type: '物理'
      };
      
      // 顧客存在確認モック
      Customer.findByPk.mockResolvedValue({
        id: 1,
        customer_name: 'テスト顧客'
      });
      
      // 重複確認モック
      Device.findOne.mockResolvedValue(null);
      
      // 作成モック
      const mockCreatedDevice = {
        id: 1,
        ...deviceData,
        created_at: new Date(),
        updated_at: new Date()
      };
      Device.create.mockResolvedValue(mockCreatedDevice);
      
      // 取得モック
      const mockPopulatedDevice = {
        ...mockCreatedDevice,
        customer: {
          id: 1,
          customer_name: 'テスト顧客'
        },
        getUnitPositionDisplay: jest.fn().mockReturnValue('U10-U12')
      };
      Device.findByPk.mockResolvedValue(mockPopulatedDevice);
      
      // リクエスト/レスポンスのモック
      const req = { body: deviceData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // 関数を実行
      await createDevice(req, res);
      
      // 検証
      expect(Customer.findByPk).toHaveBeenCalledWith(deviceData.customer_id);
      expect(Device.findOne).toHaveBeenCalled();
      expect(Device.create).toHaveBeenCalled();
      expect(Device.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it('必須フィールドが欠けている場合、400エラーを返す', async () => {
      // 不完全なデータ
      const deviceData = {
        customer_id: 1,
        // device_name が欠けている
        device_type: 'サーバ',
        hardware_type: '物理'
      };
      
      // リクエスト/レスポンスのモック
      const req = { body: deviceData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await createDevice(req, res, next);
      } catch (error) {
        expect(error.message).toBe('必須フィールドが不足しています');
      }
      
      // 検証
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Device.create).not.toHaveBeenCalled();
    });
    
    it('顧客が存在しない場合、400エラーを返す', async () => {
      // テストデータ
      const deviceData = {
        customer_id: 999, // 存在しないID
        device_name: 'テストサーバ',
        device_type: 'サーバ',
        hardware_type: '物理'
      };
      
      // 顧客存在確認モック
      Customer.findByPk.mockResolvedValue(null);
      
      // リクエスト/レスポンスのモック
      const req = { body: deviceData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await createDevice(req, res, next);
      } catch (error) {
        expect(error.message).toBe('指定された顧客が存在しません');
      }
      
      // 検証
      expect(Customer.findByPk).toHaveBeenCalledWith(deviceData.customer_id);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Device.create).not.toHaveBeenCalled();
    });
    
    it('同一データが既に存在する場合、400エラーを返す', async () => {
      // テストデータ
      const deviceData = {
        customer_id: 1,
        device_name: 'テストサーバ',
        device_type: 'サーバ',
        hardware_type: '物理'
      };
      
      // 顧客存在確認モック
      Customer.findByPk.mockResolvedValue({
        id: 1,
        customer_name: 'テスト顧客'
      });
      
      // 重複確認モック - 同一データが存在
      Device.findOne.mockResolvedValue({
        id: 1,
        ...deviceData
      });
      
      // リクエスト/レスポンスのモック
      const req = { body: deviceData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await createDevice(req, res, next);
      } catch (error) {
        expect(error.message).toContain('同じ顧客で同じ機器名');
      }
      
      // 検証
      expect(Customer.findByPk).toHaveBeenCalledWith(deviceData.customer_id);
      expect(Device.findOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Device.create).not.toHaveBeenCalled();
    });
    
    it('Sequelizeバリデーションエラーの場合、400エラーを返す', async () => {
      // テストデータ
      const deviceData = {
        customer_id: 1,
        device_name: 'テストサーバ',
        device_type: 'サーバ',
        hardware_type: '物理'
      };
      
      // 顧客存在確認モック
      Customer.findByPk.mockResolvedValue({
        id: 1,
        customer_name: 'テスト顧客'
      });
      
      // 重複確認モック
      Device.findOne.mockResolvedValue(null);
      
      // バリデーションエラーの模擬
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [
          { message: '機器名は必須です' }
        ]
      };
      Device.create.mockRejectedValue(validationError);
      
      // リクエスト/レスポンスのモック
      const req = { body: deviceData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await createDevice(req, res, next);
      } catch (error) {
        expect(error.message).toBe('機器名は必須です');
      }
      
      // 検証
      expect(Customer.findByPk).toHaveBeenCalledWith(deviceData.customer_id);
      expect(Device.findOne).toHaveBeenCalled();
      expect(Device.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    it('ユニーク制約エラーの場合、400エラーを返す', async () => {
      // テストデータ
      const deviceData = {
        customer_id: 1,
        device_name: 'テストサーバ',
        device_type: 'サーバ',
        hardware_type: '物理'
      };
      
      // 顧客存在確認モック
      Customer.findByPk.mockResolvedValue({
        id: 1,
        customer_name: 'テスト顧客'
      });
      
      // 重複確認モック
      Device.findOne.mockResolvedValue(null);
      
      // ユニーク制約エラーの模擬
      const uniqueError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [
          { message: 'Validation error' }
        ]
      };
      Device.create.mockRejectedValue(uniqueError);
      
      // リクエスト/レスポンスのモック
      const req = { body: deviceData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await createDevice(req, res, next);
      } catch (error) {
        expect(error.message).toContain('同じ顧客で同じ機器名');
      }
      
      // 検証
      expect(Customer.findByPk).toHaveBeenCalledWith(deviceData.customer_id);
      expect(Device.findOne).toHaveBeenCalled();
      expect(Device.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});