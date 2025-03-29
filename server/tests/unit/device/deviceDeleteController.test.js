/**
 * deviceDeleteController.jsの単体テスト
 */
const { deleteDevice } = require('../../../controllers/device/deviceDeleteController');
const { Device } = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  Device: {
    findByPk: jest.fn()
  }
}));

describe('deviceDeleteController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteDevice', () => {
    it('機器を正常に削除できること', async () => {
      // 既存デバイスのモック
      const mockDevice = {
        id: 1,
        device_name: 'テストサーバ',
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      Device.findByPk.mockResolvedValue(mockDevice);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 1 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // 関数を実行
      await deleteDevice(req, res);
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(1);
      expect(mockDevice.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: '機器を削除しました' });
    });

    it('機器が存在しない場合、404エラーを返す', async () => {
      // 存在しない機器ID
      Device.findByPk.mockResolvedValue(null);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 999 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await deleteDevice(req, res, next);
      } catch (error) {
        expect(error.message).toBe('機器が見つかりません');
      }
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    
    it('削除中にエラーが発生した場合、エラーをスローする', async () => {
      // 既存デバイスのモック
      const mockDevice = {
        id: 1,
        device_name: 'テストサーバ',
        destroy: jest.fn().mockRejectedValue(new Error('データベースエラー'))
      };
      
      Device.findByPk.mockResolvedValue(mockDevice);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 1 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await deleteDevice(req, res, next);
      } catch (error) {
        expect(error.message).toBe('データベースエラー');
      }
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(1);
      expect(mockDevice.destroy).toHaveBeenCalled();
    });
  });
});