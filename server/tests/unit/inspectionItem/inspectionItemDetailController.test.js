/**
 * inspectionItemDetailController.jsの単体テスト
 */
const { getAllInspectionItemsWithDetails } = require('../../../controllers/inspectionItem/inspectionItemDetailController');
const { InspectionItem, Device, Customer, InspectionItemName } = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  InspectionItem: {
    findAll: jest.fn()
  },
  Device: {},
  Customer: {},
  InspectionItemName: {}
}));

describe('inspectionItemDetailController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllInspectionItemsWithDetails', () => {
    it('点検項目の詳細情報を正常に取得して階層化できる', async () => {
      // モックデータ
      const mockItems = [
        {
          id: 1,
          device: {
            id: 101,
            device_name: 'サーバー1',
            model: 'Model A',
            rack_number: '1',
            unit_start_position: 42,
            unit_end_position: 44,
            device_type: 'サーバー',
            customer: {
              id: 201,
              customer_name: '顧客A'
            }
          },
          item_name_master: {
            id: 301,
            name: 'CPU状態確認'
          }
        },
        {
          id: 2,
          device: {
            id: 102,
            device_name: 'サーバー2',
            model: 'Model B',
            rack_number: '1',
            unit_start_position: 38,
            unit_end_position: 38,
            device_type: 'サーバー',
            customer: {
              id: 201,
              customer_name: '顧客A'
            }
          },
          item_name_master: {
            id: 302,
            name: 'メモリ状態確認'
          }
        },
        {
          id: 3,
          device: {
            id: 103,
            device_name: 'ネットワーク機器1',
            model: 'Switch X',
            rack_number: '2',
            unit_start_position: 40,
            unit_end_position: 40,
            device_type: 'スイッチ',
            customer: {
              id: 202,
              customer_name: '顧客B'
            }
          },
          item_name_master: {
            id: 303,
            name: 'ポート状態確認'
          }
        }
      ];

      // findAllメソッドのモック実装
      InspectionItem.findAll.mockResolvedValue(mockItems);

      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await getAllInspectionItemsWithDetails(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
      
      // レスポンスの内容を詳細に検証
      const responseData = res.json.mock.calls[0][0].data;
      
      // ロケーションが正しくソートされているか確認
      expect(responseData.length).toBe(2);
      expect(responseData[0].locationName).toBe('ラックNo.1');
      expect(responseData[1].locationName).toBe('ラックNo.2');
      
      // サーバーがユニット位置で正しくソートされているか確認
      expect(responseData[0].servers.length).toBe(2);
      expect(responseData[0].servers[0].unit_start_position).toBe(42); // 降順なので大きい方が先
      expect(responseData[0].servers[1].unit_start_position).toBe(38);
    });

    it('ユニット位置が部分的に未設定の場合も正しく処理する', async () => {
      // モックデータ - 一部のサーバーにはユニット位置が設定されていない
      const mockItems = [
        {
          id: 1,
          device: {
            id: 101,
            device_name: 'サーバー1',
            model: 'Model A',
            rack_number: '1',
            unit_start_position: null, // 未設定
            unit_end_position: null,   // 未設定
            device_type: 'サーバー',
            customer: {
              id: 201,
              customer_name: '顧客A'
            }
          },
          item_name_master: {
            id: 301,
            name: 'CPU状態確認'
          }
        },
        {
          id: 2,
          device: {
            id: 102,
            device_name: 'サーバー2',
            model: 'Model B',
            rack_number: '1',
            unit_start_position: 10,
            unit_end_position: 10,
            device_type: 'サーバー',
            customer: {
              id: 201,
              customer_name: '顧客A'
            }
          },
          item_name_master: {
            id: 302,
            name: 'メモリ状態確認'
          }
        }
      ];

      // findAllメソッドのモック実装
      InspectionItem.findAll.mockResolvedValue(mockItems);

      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await getAllInspectionItemsWithDetails(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
      
      // ユニット位置の表示形式を検証
      const responseData = res.json.mock.calls[0][0].data;
      const servers = responseData[0].servers;
      
      // null/undefined のユニット位置は空文字列になっている
      expect(servers.find(s => s.device_id === 101).unit_position).toBe('');
      
      // 単一のユニット位置
      expect(servers.find(s => s.device_id === 102).unit_position).toBe('U10');
    });

    it('ラック番号が未設定の場合も正しく処理する', async () => {
      // モックデータ - ラック番号が未設定のデバイス
      const mockItems = [
        {
          id: 1,
          device: {
            id: 101,
            device_name: 'サーバー1',
            model: 'Model A',
            rack_number: null, // 未設定
            unit_start_position: 42,
            unit_end_position: 44,
            device_type: 'サーバー',
            customer: {
              id: 201,
              customer_name: '顧客A'
            }
          },
          item_name_master: {
            id: 301,
            name: 'CPU状態確認'
          }
        }
      ];

      // findAllメソッドのモック実装
      InspectionItem.findAll.mockResolvedValue(mockItems);

      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await getAllInspectionItemsWithDetails(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
      
      // ラック番号未設定の場合のロケーション名を検証
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.length).toBe(1);
      expect(responseData[0].locationName).toBe('未設定');
    });

    it('開始位置と終了位置が異なる場合のユニット表示を正しく処理する', async () => {
      // モックデータ - ユニット開始位置と終了位置が異なる
      const mockItems = [
        {
          id: 1,
          device: {
            id: 101,
            device_name: 'サーバー1',
            model: 'Model A',
            rack_number: '1',
            unit_start_position: 10,
            unit_end_position: 15, // 異なる終了位置
            device_type: 'サーバー',
            customer: {
              id: 201,
              customer_name: '顧客A'
            }
          },
          item_name_master: {
            id: 301,
            name: 'CPU状態確認'
          }
        }
      ];

      // findAllメソッドのモック実装
      InspectionItem.findAll.mockResolvedValue(mockItems);

      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await getAllInspectionItemsWithDetails(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      
      // ユニット位置の範囲表示を検証
      const responseData = res.json.mock.calls[0][0].data;
      const server = responseData[0].servers[0];
      expect(server.unit_position).toBe('U10-U15');
    });

    it('データベース取得時にエラーが発生した場合、エラーを適切に処理する', async () => {
      // データベースエラーのモック
      const mockError = new Error('データベースエラー');
      InspectionItem.findAll.mockRejectedValue(mockError);

      // リクエスト/レスポンスのモック
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数実行
      await getAllInspectionItemsWithDetails(req, res);

      // エラーハンドリングの検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: '点検項目データの取得中にエラーが発生しました。',
        error: 'データベースエラー'
      }));
    });
  });
});