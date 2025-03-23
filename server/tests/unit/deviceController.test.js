/**
 * deviceController.jsの単体テスト
 */
const { getDeviceById, getDevices, getDevicesByCustomerId } = require('../../controllers/device/deviceController');
const { Device, Customer } = require('../../models');

// モックの設定
jest.mock('../../models', () => ({
  Device: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  Customer: {
    findByPk: jest.fn()
  }
}));

describe('deviceController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeviceById', () => {
    it('存在するデバイスIDの場合、デバイス情報をJSON形式で返す', async () => {
      // モックデータ
      const mockDevice = {
        id: 1,
        device_name: 'テストサーバー',
        customer_id: 1,
        customer: { id: 1, customer_name: 'テスト顧客' },
        model: 'Model-X',
        rack_number: 5,
        unit_start_position: 10,
        unit_end_position: 12,
        getUnitPositionDisplay: jest.fn().mockReturnValue('U10-U12'),
        device_type: 'サーバ',
        hardware_type: '物理',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // モック関数の戻り値を設定
      Device.findByPk.mockResolvedValue(mockDevice);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 1 } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      // 関数を実行
      await getDeviceById(req, res);
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        device_name: 'テストサーバー',
        unit_position: 'U10-U12'
      }));
      expect(res.status).not.toHaveBeenCalled();
    });

    it('存在しないデバイスIDの場合、404エラーを返す', async () => {
      // モック関数の戻り値を設定（存在しないデバイス）
      Device.findByPk.mockResolvedValue(null);
      
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
        await getDeviceById(req, res, next);
      } catch (error) {
        expect(error.message).toBe('機器が見つかりません');
      }
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  // getDevices関数のテストも同様に実装できます
  describe('getDevices', () => {
    it('すべてのデバイスの一覧を返す', async () => {
      // モックデータ
      const mockDevices = [
        {
          id: 1,
          device_name: 'サーバー1',
          customer: { id: 1, customer_name: '顧客A' },
          customer_id: 1,
          model: 'Model-X',
          rack_number: 5,
          unit_start_position: 10,
          unit_end_position: 12,
          getUnitPositionDisplay: jest.fn().mockReturnValue('U10-U12'),
          device_type: 'サーバ',
          hardware_type: '物理',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          device_name: 'サーバー2',
          customer: { id: 2, customer_name: '顧客B' },
          customer_id: 2,
          model: 'Model-Y',
          rack_number: 3,
          unit_start_position: 5,
          unit_end_position: 5,
          getUnitPositionDisplay: jest.fn().mockReturnValue('U5'),
          device_type: 'サーバ',
          hardware_type: 'VM',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // モック関数の戻り値を設定
      Device.findAll.mockResolvedValue(mockDevices);
      
      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn()
      };
      
      // 関数を実行
      await getDevices(req, res);
      
      // 検証
      expect(Device.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          device_name: 'サーバー1'
        }),
        expect.objectContaining({
          id: 2,
          device_name: 'サーバー2'
        })
      ]));
    });
  });
});