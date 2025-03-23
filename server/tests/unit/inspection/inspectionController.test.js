// server/tests/unit/inspection/inspectionController.test.js
const httpMocks = require('node-mocks-http');
const { 
  getInspections, 
  getInspectionById
} = require('../../../controllers/inspection/inspectionController');
const { 
  Inspection, 
  Device, 
  Customer, 
  InspectionResult, 
  InspectionItem,
  InspectionItemName 
} = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  Inspection: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Device: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  Customer: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  InspectionResult: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  InspectionItem: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  InspectionItemName: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  }
}));

describe('点検コントローラのテスト', () => {
  let req, res, next;

  beforeEach(() => {
    // リクエスト、レスポンス、nextミドルウェアのモックをリセット
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();

    // すべてのモックをリセット
    jest.clearAllMocks();
  });

  describe('getInspections - 点検一覧の取得', () => {
    describe('正常系: 点検データを取得して表示できること', () => {
      it('点検データの一覧を取得し、200 OKレスポンスを返すこと', async () => {
        // 点検データのモック
        const mockInspectionResults = [
          {
            id: 1,
            inspection_item: {
              device: {
                id: 1,
                device_name: 'サーバー1',
                customer: {
                  id: 1,
                  customer_name: '株式会社テスト'
                }
              },
              id: 1
            }
          }
        ];

        const mockInspections = [
          {
            id: 1,
            inspection_date: '2023-12-01',
            start_time: '09:00:00',
            end_time: '10:00:00',
            inspector_name: 'テスト太郎',
            status: '完了',
            created_at: new Date('2023-12-01'),
            updated_at: new Date('2023-12-01'),
            results: mockInspectionResults,
          },
          {
            id: 2,
            inspection_date: '2023-12-02',
            start_time: '14:00:00',
            end_time: '15:00:00',
            inspector_name: 'テスト次郎',
            status: '完了',
            created_at: new Date('2023-12-02'),
            updated_at: new Date('2023-12-02'),
            results: mockInspectionResults,
          }
        ];

        // findAllメソッドのモックを設定
        Inspection.findAll.mockResolvedValue(mockInspections);

        // コントローラ関数を呼び出し
        await getInspections(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBeTruthy();
        
        // 取得したJSONデータを検証
        const data = res._getJSONData();
        expect(data).toHaveLength(2);
        expect(data[0].id).toBe(1);
        expect(data[0].inspection_date).toBe('2023-12-01');
        expect(data[0].inspector_name).toBe('テスト太郎');
        expect(data[0].customer_id).toBe(1);
        expect(data[0].customer_name).toBe('株式会社テスト');

        // findAllが正しいオプションで呼び出されたことを確認
        expect(Inspection.findAll).toHaveBeenCalledWith(expect.objectContaining({
          order: [["inspection_date", "DESC"], ["created_at", "DESC"]]
        }));
      });

      it('点検データが空の場合も正常に処理すること', async () => {
        // 空配列を返すようにモックを設定
        Inspection.findAll.mockResolvedValue([]);

        // コントローラ関数を呼び出し
        await getInspections(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBeTruthy();
        expect(res._getJSONData()).toEqual([]);
      });
    });

    describe('異常系: API呼び出しエラー時にエラーメッセージを表示できること', () => {
      it('データベースエラーが発生した場合はエラーを次のミドルウェアに渡すこと', async () => {
        // データベースエラーをモック
        const dbError = new Error('データベース接続エラー');
        Inspection.findAll.mockRejectedValue(dbError);

        // コントローラ関数を呼び出し
        await getInspections(req, res, next);

        // エラーが次のミドルウェアに渡されたことを確認
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBe(dbError);
      });
    });
  });

  describe('getInspectionById - 点検詳細の取得', () => {
    beforeEach(() => {
      // IDパラメータを持つリクエストをセットアップ
      req = httpMocks.createRequest({
        params: {
          id: '1'
        }
      });
    });

    describe('正常系: 特定の点検IDの詳細データを取得して表示できること', () => {
      it('存在する点検IDの詳細を取得し、200 OKレスポンスを返すこと', async () => {
        // モックデータの設定
        const mockInspectionResults = [
          {
            id: 1,
            inspection_item_id: 1,
            check_item: 'CPU使用率',
            status: '正常',
            checked_at: new Date(),
            inspection_item: {
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
                  customer_name: '株式会社テスト'
                }
              }
            }
          }
        ];

        const mockInspection = {
          id: 1,
          inspection_date: '2023-12-01',
          start_time: '09:00:00',
          end_time: '10:00:00',
          inspector_name: 'テスト太郎',
          status: '完了',
          created_at: new Date('2023-12-01'),
          updated_at: new Date('2023-12-01'),
          results: mockInspectionResults
        };

        // findByPkメソッドのモックを設定
        Inspection.findByPk.mockResolvedValue(mockInspection);

        // コントローラ関数を呼び出し
        await getInspectionById(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBeTruthy();
        
        // 取得したJSONデータを検証
        const data = res._getJSONData();
        expect(data.id).toBe(1);
        expect(data.inspection_date).toBe('2023-12-01');
        expect(data.inspector_name).toBe('テスト太郎');
        expect(data.results).toHaveLength(1);
        expect(data.results[0].check_item).toBe('CPU使用率');
        expect(data.results[0].device_name).toBe('サーバー1');
        expect(data.results[0].customer_name).toBe('株式会社テスト');

        // findByPkが正しいIDで呼び出されたことを確認
        expect(Inspection.findByPk).toHaveBeenCalledWith('1', expect.anything());
      });
    });

    describe('異常系: 存在しないIDによるエラー処理ができること', () => {
      it('存在しない点検IDの場合は404エラーを返すこと', async () => {
        // nullを返すようにモックを設定（存在しないID）
        Inspection.findByPk.mockResolvedValue(null);

        // コントローラ関数を呼び出し
        await getInspectionById(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(404);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('点検が見つかりません');
      });

      it('データベースエラーが発生した場合はエラーを次のミドルウェアに渡すこと', async () => {
        // データベースエラーをモック
        const dbError = new Error('データベース接続エラー');
        Inspection.findByPk.mockRejectedValue(dbError);

        // コントローラ関数を呼び出し
        await getInspectionById(req, res, next);

        // エラーが次のミドルウェアに渡されたことを確認
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBe(dbError);
      });
    });
  });
});