/**
 * deviceUpdateController.jsの単体テスト
 */
const { updateDevice } = require('../../../controllers/device/deviceUpdateController');
const { Device, Customer } = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  Device: {
    findByPk: jest.fn(),
  },
  Customer: {
    findByPk: jest.fn()
  }
}));

describe('deviceUpdateController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateDevice', () => {
    it('有効なリクエストボディで機器を更新する', async () => {
      // 更新データ
      const updateData = {
        customer_id: 1,
        device_name: '更新後サーバ',
        model: 'UPDATED-MODEL',
        rack_number: 2,
        unit_start_position: 15,
        unit_end_position: 18,
        device_type: 'サーバ',
        hardware_type: '物理'
      };
      
      // 既存デバイスのモック
      const mockDevice = {
        id: 1,
        customer_id: 1,
        device_name: '更新前サーバ',
        model: 'OLD-MODEL',
        rack_number: 1,
        unit_start_position: 10,
        unit_end_position: 12,
        device_type: 'サーバ',
        hardware_type: '物理',
        save: jest.fn().mockResolvedValue(true)
      };
      
      Device.findByPk.mockImplementation((id, options) => {
        if (!options) {
          return Promise.resolve(mockDevice);
        }
        
        // 2回目の呼び出し（include付き）
        return Promise.resolve({
          ...mockDevice,
          ...updateData,
          customer: {
            id: 1,
            customer_name: 'テスト顧客'
          },
          getUnitPositionDisplay: jest.fn().mockReturnValue('U15-U18')
        });
      });
      
      // リクエスト/レスポンスのモック
      const req = { 
        params: { id: 1 },
        body: updateData 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // 関数を実行
      await updateDevice(req, res);
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledTimes(2);
      expect(mockDevice.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('機器が存在しない場合、404エラーを返す', async () => {
      // 存在しない機器ID
      Device.findByPk.mockResolvedValue(null);
      
      // リクエスト/レスポンスのモック
      const req = { 
        params: { id: 999 },
        body: {} 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await updateDevice(req, res, next);
      } catch (error) {
        expect(error.message).toBe('機器が見つかりません');
      }
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    
    it('顧客IDが変更され、新しい顧客が存在しない場合、400エラーを返す', async () => {
      // 更新データ
      const updateData = {
        customer_id: 999, // 存在しない顧客ID
        device_name: '更新後サーバ'
      };
      
      // 既存デバイスのモック
      const mockDevice = {
        id: 1,
        customer_id: 1, // 元の顧客ID
        device_name: '更新前サーバ',
        model: 'OLD-MODEL',
        save: jest.fn()
      };
      
      Device.findByPk.mockResolvedValue(mockDevice);
      
      // 顧客存在確認モック
      Customer.findByPk.mockResolvedValue(null);
      
      // リクエスト/レスポンスのモック
      const req = { 
        params: { id: 1 },
        body: updateData 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await updateDevice(req, res, next);
      } catch (error) {
        expect(error.message).toBe('指定された顧客が存在しません');
      }
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(1);
      expect(Customer.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockDevice.save).not.toHaveBeenCalled();
    });
    
    it('バリデーションエラーの場合、400エラーを返す', async () => {
      // 更新データ
      const updateData = {
        device_name: '更新後サーバ'
      };
      
      // 既存デバイスのモック
      const mockDevice = {
        id: 1,
        customer_id: 1,
        device_name: '更新前サーバ',
        save: jest.fn().mockRejectedValue({
          name: 'SequelizeValidationError',
          errors: [{ message: '機器名は必須です' }]
        })
      };
      
      Device.findByPk.mockResolvedValue(mockDevice);
      
      // リクエスト/レスポンスのモック
      const req = { 
        params: { id: 1 },
        body: updateData 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await updateDevice(req, res, next);
      } catch (error) {
        expect(error.message).toBe('機器名は必須です');
      }
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(1);
      expect(mockDevice.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    it('nullの値が正しく更新されること', async () => {
      // 更新データ (nullの値を含む)
      const updateData = {
        model: null,
        rack_number: null,
        unit_start_position: null,
        unit_end_position: null
      };
      
      // 既存デバイスのモック
      const mockDevice = {
        id: 1,
        customer_id: 1,
        device_name: 'テストサーバ',
        model: 'OLD-MODEL',
        rack_number: 1,
        unit_start_position: 10,
        unit_end_position: 12,
        device_type: 'サーバ',
        hardware_type: '物理',
        save: jest.fn().mockResolvedValue(true)
      };
      
      Device.findByPk.mockImplementation((id, options) => {
        if (!options) {
          return Promise.resolve(mockDevice);
        }
        
        // 2回目の呼び出し（include付き）
        return Promise.resolve({
          ...mockDevice,
          ...updateData,
          customer: {
            id: 1,
            customer_name: 'テスト顧客'
          },
          getUnitPositionDisplay: jest.fn().mockReturnValue('')
        });
      });
      
      // リクエスト/レスポンスのモック
      const req = { 
        params: { id: 1 },
        body: updateData 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // 関数を実行
      await updateDevice(req, res);
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledTimes(2);
      expect(mockDevice.model).toBe(null);
      expect(mockDevice.rack_number).toBe(null);
      expect(mockDevice.unit_start_position).toBe(null);
      expect(mockDevice.unit_end_position).toBe(null);
      expect(mockDevice.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});