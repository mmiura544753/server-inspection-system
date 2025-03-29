/**
 * inspectionItemExportController.jsの単体テスト
 */
const { exportInspectionItemsToCsv } = require('../../../controllers/inspectionItem/inspectionItemExportController');
const { InspectionItem, Device, Customer, InspectionItemName } = require('../../../models');
const { Parser } = require('json2csv');
const iconv = require('iconv-lite');

// モックの設定
jest.mock('../../../models', () => ({
  InspectionItem: {
    findAll: jest.fn()
  },
  Device: {},
  Customer: {},
  InspectionItemName: {}
}));

jest.mock('json2csv', () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockImplementation(data => 'mock-csv-content')
  }))
}));

jest.mock('iconv-lite', () => ({
  encode: jest.fn().mockImplementation((str, encoding) => Buffer.from(`encoded-${str}-with-${encoding}`))
}));

describe('inspectionItemExportController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportInspectionItemsToCsv', () => {
    it('デフォルトのShift_JISエンコーディングで点検項目をCSVにエクスポートできる', async () => {
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
            customer_id: 201,
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
            unit_end_position: null,
            customer_id: 201,
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

      // 現在の日付を固定して予測可能なファイル名をテスト
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => ({
        getFullYear: () => 2025,
        getMonth: () => 2, // 3月 (0-indexed)
        getDate: () => 29,
        toString: () => '2025-03-29'
      }));

      // リクエスト/レスポンスのモック
      const req = {
        query: {} // デフォルトのエンコーディングを使用
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };

      // 関数を実行
      await exportInspectionItemsToCsv(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      expect(Parser).toHaveBeenCalledWith(expect.objectContaining({
        fields: expect.arrayContaining([
          { label: "ID", value: "id" },
          { label: "ラックNo.", value: "rack_number" },
          { label: "ユニット", value: "unit_position" },
          { label: "サーバ名", value: "device_name" },
          { label: "機種", value: "model" },
          { label: "点検項目", value: "item_name" }
        ])
      }));

      // エンコーディングの検証
      expect(iconv.encode).toHaveBeenCalledWith('mock-csv-content', 'Shift_JIS');
      
      // レスポンスヘッダーの検証
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=Shift_JIS');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition', 
        'attachment; filename=inspection_items_export_20250329.csv'
      );
      
      // 送信されたデータの検証
      expect(res.send).toHaveBeenCalled();

      // Date のモックを復元
      dateSpy.mockRestore();
    });

    it('UTF-8エンコーディングで点検項目をCSVにエクスポートできる', async () => {
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
            customer_id: 201,
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

      // 現在の日付を固定して予測可能なファイル名をテスト
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => ({
        getFullYear: () => 2025,
        getMonth: () => 2, // 3月 (0-indexed)
        getDate: () => 29,
        toString: () => '2025-03-29'
      }));

      // リクエスト/レスポンスのモック - UTF-8を指定
      const req = {
        query: {
          encoding: 'utf-8'
        }
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };

      // 関数を実行
      await exportInspectionItemsToCsv(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      
      // UTF-8の場合はiconvを使用しない
      expect(iconv.encode).not.toHaveBeenCalled();
      
      // レスポンスヘッダーの検証
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition', 
        'attachment; filename=inspection_items_export_20250329.csv'
      );
      
      // 送信されたデータの検証
      expect(res.send).toHaveBeenCalledWith('mock-csv-content');

      // Date のモックを復元
      dateSpy.mockRestore();
    });

    it('空のデータセットでも正常に処理できる', async () => {
      // 空のデータセット
      InspectionItem.findAll.mockResolvedValue([]);

      // リクエスト/レスポンスのモック
      const req = {
        query: {}
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };

      // 関数を実行
      await exportInspectionItemsToCsv(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      expect(Parser).toHaveBeenCalled();
      // 空のデータセットでもCSVは生成される
      expect(res.send).toHaveBeenCalled();
    });

    it('様々なユニット位置のパターンを正しく処理できる', async () => {
      // モックデータ - 様々なユニット位置パターン
      const mockItems = [
        {
          id: 1,
          device: {
            id: 101,
            device_name: 'サーバー1',
            model: 'Model A',
            rack_number: '1',
            unit_start_position: 42,
            unit_end_position: 44, // 範囲設定
            customer_id: 201,
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
            unit_end_position: null, // 単一値
            customer_id: 201,
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
            device_name: 'サーバー3',
            model: 'Model C',
            rack_number: '2',
            unit_start_position: null,
            unit_end_position: null, // 設定なし
            customer_id: 202,
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
      const req = {
        query: {}
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };
      
      // Parserの振る舞いをより詳細に制御して、データ変換をテスト
      let capturedItems;
      Parser.mockImplementation(() => ({
        parse: (items) => {
          capturedItems = items;
          return 'mock-csv-content';
        }
      }));

      // 関数を実行
      await exportInspectionItemsToCsv(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      
      // 変換されたデータの検証
      expect(capturedItems).toBeDefined();
      expect(capturedItems.length).toBe(3);
      
      // ユニット位置の書式設定を検証
      expect(capturedItems[0].unit_position).toBe('42～44'); // 範囲表示
      expect(capturedItems[1].unit_position).toBe('38');     // 単一値
      expect(capturedItems[2].unit_position).toBe('');       // 空文字列
      
      expect(res.send).toHaveBeenCalled();
    });

    it('SJISエンコーディングパラメータも正しく処理できる', async () => {
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
            customer_id: 201,
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

      // リクエスト/レスポンスのモック - 'sjis'を指定
      const req = {
        query: {
          encoding: 'sjis'
        }
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };

      // 関数を実行
      await exportInspectionItemsToCsv(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      
      // 'sjis'も'shift_jis'として処理される
      expect(iconv.encode).toHaveBeenCalledWith('mock-csv-content', 'Shift_JIS');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=Shift_JIS');
      expect(res.send).toHaveBeenCalled();
    });

    it('null値のitem_name_masterを持つアイテムも正しく処理できる', async () => {
      // モックデータ - item_name_masterがnullのケース
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
            customer_id: 201,
            customer: {
              id: 201,
              customer_name: '顧客A'
            }
          },
          item_name_master: null // NULL関連
        }
      ];

      // findAllメソッドのモック実装
      InspectionItem.findAll.mockResolvedValue(mockItems);

      // リクエスト/レスポンスのモック
      const req = {
        query: {}
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };
      
      // Parserの振る舞いをより詳細に制御して、NULL処理をテスト
      let capturedItems;
      Parser.mockImplementation(() => ({
        parse: (items) => {
          capturedItems = items;
          return 'mock-csv-content';
        }
      }));

      // 関数を実行
      await exportInspectionItemsToCsv(req, res);

      // 検証
      expect(InspectionItem.findAll).toHaveBeenCalled();
      
      // NULL処理の検証
      expect(capturedItems).toBeDefined();
      expect(capturedItems.length).toBe(1);
      expect(capturedItems[0].item_name).toBe(''); // NULL値からは空文字列になる
      
      expect(res.send).toHaveBeenCalled();
    });
  });
});