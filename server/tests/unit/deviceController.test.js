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

    it('無効なIDフォーマット（数値でない）の場合、400エラーを返す', async () => {
      // リクエスト/レスポンスのモック（無効なID）
      const req = { params: { id: 'invalid_id' } };
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
        expect(error.message).toBe('無効な機器IDです。数値を指定してください。');
      }
      
      // 検証
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Device.findByPk).not.toHaveBeenCalled();
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

    it('顧客関連付けがないデバイスも適切に処理される', async () => {
      // 顧客情報がnullのデバイスデータ
      const mockDevices = [
        {
          id: 3,
          device_name: '関連付けなしデバイス',
          customer: null,
          customer_id: null,
          model: 'Model-Z',
          rack_number: 1,
          unit_start_position: 1,
          unit_end_position: 2,
          getUnitPositionDisplay: jest.fn().mockReturnValue('U1-U2'),
          device_type: 'スイッチ',
          hardware_type: '物理',
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
      
      // レスポンスの検証（customer_nameがnullであることを確認）
      const responseData = res.json.mock.calls[0][0];
      expect(responseData[0]).toHaveProperty('customer_name', null);
    });
  });

  describe('getDevicesByCustomerId', () => {
    it('有効な顧客IDで機器リストを取得できる', async () => {
      // モック顧客データ
      const mockCustomer = {
        id: 1,
        customer_name: 'テスト顧客1'
      };
      
      // モックデバイスデータ
      const mockDevices = [
        {
          id: 1,
          device_name: 'テストサーバ1',
          customer_id: 1,
          model: 'MODEL-A',
          rack_number: 1,
          unit_start_position: 10,
          unit_end_position: 12,
          device_type: 'サーバ',
          hardware_type: '物理',
          created_at: new Date(),
          updated_at: new Date(),
          getUnitPositionDisplay: jest.fn().mockReturnValue('U10-U12')
        },
        {
          id: 2,
          device_name: 'テストサーバ2',
          customer_id: 1,
          model: 'MODEL-B',
          rack_number: 2,
          unit_start_position: 5,
          unit_end_position: 7,
          device_type: 'ストレージ',
          hardware_type: '物理',
          created_at: new Date(),
          updated_at: new Date(),
          getUnitPositionDisplay: jest.fn().mockReturnValue('U5-U7')
        }
      ];
      
      // モックの設定
      Customer.findByPk.mockResolvedValue(mockCustomer);
      Device.findAll.mockResolvedValue(mockDevices);
      
      // リクエスト/レスポンスのモック
      const req = {
        params: {
          customerId: 1
        }
      };
      const res = {
        json: jest.fn()
      };
      
      // 関数実行
      await getDevicesByCustomerId(req, res);
      
      // 検証
      expect(Customer.findByPk).toHaveBeenCalledWith(1);
      expect(Device.findAll).toHaveBeenCalledWith({
        where: { customer_id: 1 },
        order: [["device_name", "ASC"]],
      });
      expect(res.json).toHaveBeenCalled();
      
      // レスポンスの内容を検証
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toHaveLength(2);
      expect(responseData[0]).toHaveProperty('id', 1);
      expect(responseData[0]).toHaveProperty('device_name', 'テストサーバ1');
      expect(responseData[0]).toHaveProperty('customer_name', 'テスト顧客1');
      expect(responseData[0]).toHaveProperty('unit_position', 'U10-U12');
    });

    it('存在しない顧客IDの場合、404エラーを返す', async () => {
      // 顧客が見つからない場合のモック
      Customer.findByPk.mockResolvedValue(null);
      
      // リクエスト/レスポンスのモック
      const req = {
        params: {
          customerId: 999 // 存在しない顧客ID
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await getDevicesByCustomerId(req, res, next);
      } catch (error) {
        expect(error.message).toBe('顧客が見つかりません');
      }
      
      // 検証
      expect(Customer.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(Device.findAll).not.toHaveBeenCalled();
    });
  });
});