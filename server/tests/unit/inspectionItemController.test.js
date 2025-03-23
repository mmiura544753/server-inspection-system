/**
 * inspectionItemController.jsの単体テスト
 */
const {
  getInspectionItems,
  getInspectionItemById,
  getInspectionItemsByDeviceId
} = require('../../controllers/inspectionItem/inspectionItemController');
const {
  InspectionItem,
  Device,
  Customer,
  InspectionItemName
} = require('../../models');

// モックの設定
jest.mock('../../models', () => ({
  InspectionItem: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  Device: {
    findByPk: jest.fn()
  },
  Customer: {},
  InspectionItemName: {}
}));

describe('inspectionItemController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInspectionItems', () => {
    it('すべての点検項目を取得して整形された形式で返す', async () => {
      // モックデータ
      const mockItems = [
        {
          id: 1,
          item_name_id: 1,
          device_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
          item_name_master: {
            id: 1,
            name: 'CPUの状態確認'
          },
          device: {
            id: 1,
            device_name: 'サーバー1',
            customer_id: 1,
            rack_number: 5,
            unit_start_position: 10,
            unit_end_position: 12,
            model: 'Model-X',
            customer: {
              id: 1,
              customer_name: '顧客A'
            }
          }
        },
        {
          id: 2,
          item_name_id: 2,
          device_id: 2,
          created_at: new Date(),
          updated_at: new Date(),
          item_name_master: {
            id: 2,
            name: 'メモリの状態確認'
          },
          device: null // デバイスが関連付けられていない場合のテスト
        }
      ];
      
      // モック関数の戻り値を設定
      InspectionItem.findAll.mockResolvedValue(mockItems);
      
      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn()
      };
      
      // 関数を実行
      await getInspectionItems(req, res);
      
      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          item_name: 'CPUの状態確認',
          device_name: 'サーバー1',
          customer_name: '顧客A'
        }),
        expect.objectContaining({
          id: 2,
          item_name: 'メモリの状態確認',
          device_name: null,
          customer_name: null
        })
      ]));
    });
  });

  describe('getInspectionItemById', () => {
    it('存在する点検項目IDの場合、点検項目情報を整形された形式で返す', async () => {
      // モックデータ
      const mockItem = {
        id: 1,
        item_name_id: 1,
        device_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
        item_name_master: {
          id: 1,
          name: 'CPUの状態確認'
        },
        device: {
          id: 1,
          device_name: 'サーバー1',
          customer_id: 1,
          rack_number: 5,
          unit_start_position: 10,
          unit_end_position: 12,
          model: 'Model-X',
          customer: {
            id: 1,
            customer_name: '顧客A'
          }
        }
      };
      
      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);
      
      // リクエスト/レスポンスのモック
      const req = { params: { id: 1 } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      // 関数を実行
      await getInspectionItemById(req, res);
      
      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        item_name: 'CPUの状態確認',
        device_name: 'サーバー1',
        customer_name: '顧客A'
      }));
    });

    it('存在しない点検項目IDの場合、404エラーを返す', async () => {
      // モック関数の戻り値を設定（存在しない点検項目）
      InspectionItem.findByPk.mockResolvedValue(null);
      
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
        await getInspectionItemById(req, res, next);
      } catch (error) {
        expect(error.message).toBe('点検項目が見つかりません');
      }
      
      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getInspectionItemsByDeviceId', () => {
    it('存在する機器IDの場合、その機器に関連する点検項目を返す', async () => {
      // モックデータ
      const mockDevice = {
        id: 1,
        device_name: 'サーバー1',
        customer_id: 1,
        rack_number: 5,
        unit_start_position: 10,
        unit_end_position: 12,
        model: 'Model-X',
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };
      
      const mockItems = [
        {
          id: 1,
          item_name_id: 1,
          device_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
          item_name_master: {
            id: 1,
            name: 'CPUの状態確認'
          }
        },
        {
          id: 2,
          item_name_id: 2,
          device_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
          item_name_master: {
            id: 2,
            name: 'メモリの状態確認'
          }
        }
      ];
      
      // モック関数の戻り値を設定
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItem.findAll.mockResolvedValue(mockItems);
      
      // リクエスト/レスポンスのモック
      const req = { params: { deviceId: 1 } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      // 関数を実行
      await getInspectionItemsByDeviceId(req, res);
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(InspectionItem.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { device_id: 1 }
      }));
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          item_name: 'CPUの状態確認',
          device_name: 'サーバー1'
        }),
        expect.objectContaining({
          id: 2,
          item_name: 'メモリの状態確認',
          device_name: 'サーバー1'
        })
      ]));
    });

    it('存在しない機器IDの場合、404エラーを返す', async () => {
      // モック関数の戻り値を設定（存在しない機器）
      Device.findByPk.mockResolvedValue(null);
      
      // リクエスト/レスポンスのモック
      const req = { params: { deviceId: 999 } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      // エラーハンドリングのためのモック
      const next = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await getInspectionItemsByDeviceId(req, res, next);
      } catch (error) {
        expect(error.message).toBe('機器が見つかりません');
      }
      
      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(404);
      expect(InspectionItem.findAll).not.toHaveBeenCalled();
    });
  });
});