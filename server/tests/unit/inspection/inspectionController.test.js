// server/tests/unit/inspection/inspectionController.test.js
const httpMocks = require('node-mocks-http');
const { Op } = require('sequelize');
const { 
  getInspections, 
  getInspectionById,
  getInspectionsByDeviceId,
  getLatestInspectionByDeviceId
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
    findOne: jest.fn(),
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

      it('点検結果が空の場合も正常に処理すること', async () => {
        // 結果が空の点検データのモック
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
            results: [], // 空の結果配列
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
        expect(data).toHaveLength(1);
        expect(data[0].id).toBe(1);
        expect(data[0].customer_id).toBeNull();
        expect(data[0].customer_name).toBeNull();
      });

      it('デバイス情報がnullの場合も正常に処理すること', async () => {
        // デバイス情報がnullの点検結果を含む点検データのモック
        const mockInspectionResults = [
          {
            id: 1,
            inspection_item: {
              device: null, // デバイス情報がnull
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
        expect(data).toHaveLength(1);
        expect(data[0].id).toBe(1);
        expect(data[0].customer_id).toBeNull();
        expect(data[0].customer_name).toBeNull();
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

      it('結果のデバイス情報がnullの場合も正常に処理すること', async () => {
        // デバイス情報がnullの結果を含む点検データのモック
        const mockInspectionResults = [
          {
            id: 1,
            inspection_item_id: 1,
            check_item: 'CPU使用率',
            status: '正常',
            checked_at: new Date(),
            inspection_item: {
              device: null, // デバイス情報がnull
              id: 1,
              item_name_master: {
                id: 1,
                name: 'CPU使用率'
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
        expect(data.results).toHaveLength(1);
        expect(data.results[0].device_id).toBeNull();
        expect(data.results[0].device_name).toBeNull();
        expect(data.results[0].customer_id).toBeNull();
        expect(data.results[0].customer_name).toBeNull();
        expect(data.results[0].rack_number).toBeNull();
        expect(data.results[0].model).toBeNull();
      });

      it('結果のunit_start_positionとunit_end_positionが同じ場合のユニット表示を検証', async () => {
        // ユニット開始と終了が同じデバイス情報を持つ結果
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
                unit_end_position: 10, // 開始と終了が同じ
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
          inspector_name: 'テスト太郎',
          status: '完了',
          results: mockInspectionResults
        };

        // findByPkメソッドのモックを設定
        Inspection.findByPk.mockResolvedValue(mockInspection);

        // コントローラ関数を呼び出し
        await getInspectionById(req, res, next);

        // 取得したJSONデータを検証
        const data = res._getJSONData();
        expect(data.results[0].unit_position).toBe('U10');
      });

      it('結果のunit_end_positionがnullの場合のユニット表示を検証', async () => {
        // ユニット終了がnullのデバイス情報を持つ結果
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
                unit_end_position: null, // 終了位置がnull
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
          inspector_name: 'テスト太郎',
          status: '完了',
          results: mockInspectionResults
        };

        // findByPkメソッドのモックを設定
        Inspection.findByPk.mockResolvedValue(mockInspection);

        // コントローラ関数を呼び出し
        await getInspectionById(req, res, next);

        // 取得したJSONデータを検証
        const data = res._getJSONData();
        expect(data.results[0].unit_position).toBe('U10');
      });

      it('結果のunit_start_positionがnullの場合のユニット表示を検証', async () => {
        // ユニット開始がnullのデバイス情報を持つ結果
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
                unit_start_position: null, // 開始位置がnull
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
          inspector_name: 'テスト太郎',
          status: '完了',
          results: mockInspectionResults
        };

        // findByPkメソッドのモックを設定
        Inspection.findByPk.mockResolvedValue(mockInspection);

        // コントローラ関数を呼び出し
        await getInspectionById(req, res, next);

        // 取得したJSONデータを検証
        const data = res._getJSONData();
        expect(data.results[0].unit_position).toBe('U-U12');
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

  describe('getInspectionsByDeviceId - 機器IDによる点検一覧の取得', () => {
    beforeEach(() => {
      // deviceIdパラメータを持つリクエストをセットアップ
      req = httpMocks.createRequest({
        params: {
          deviceId: '1'
        }
      });
    });

    describe('正常系: 特定の機器IDに関連する点検データを取得して表示できること', () => {
      it('存在する機器IDの点検一覧を取得し、200 OKレスポンスを返すこと', async () => {
        // モックデータの設定
        const mockDevice = {
          id: 1,
          device_name: 'テストサーバー1',
          customer: {
            id: 1,
            customer_name: '株式会社テスト'
          }
        };

        const mockInspectionItems = [
          { id: 1 },
          { id: 2 }
        ];

        const mockInspectionResults = [
          { inspection_id: 1 },
          { inspection_id: 2 }
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
            updated_at: new Date('2023-12-01')
          },
          {
            id: 2,
            inspection_date: '2023-12-02',
            start_time: '14:00:00',
            end_time: '15:00:00',
            inspector_name: 'テスト次郎',
            status: '完了',
            created_at: new Date('2023-12-02'),
            updated_at: new Date('2023-12-02')
          }
        ];

        // モックメソッドの戻り値を設定
        Device.findByPk.mockResolvedValue(mockDevice);
        InspectionItem.findAll.mockResolvedValue(mockInspectionItems);
        InspectionResult.findAll.mockResolvedValue(mockInspectionResults);
        Inspection.findAll.mockResolvedValue(mockInspections);

        // コントローラ関数を呼び出し
        await getInspectionsByDeviceId(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBeTruthy();
        
        // 取得したJSONデータを検証
        const data = res._getJSONData();
        expect(data).toHaveLength(2);
        expect(data[0].id).toBe(1);
        expect(data[0].inspection_date).toBe('2023-12-01');
        expect(data[0].device_id).toBe(1);
        expect(data[0].device_name).toBe('テストサーバー1');
        expect(data[0].customer_id).toBe(1);
        expect(data[0].customer_name).toBe('株式会社テスト');

        // 各メソッドが正しく呼び出されたことを確認
        expect(Device.findByPk).toHaveBeenCalledWith('1', expect.anything());
        expect(InspectionItem.findAll).toHaveBeenCalledWith({ 
          where: { device_id: '1' }, 
          attributes: ['id'] 
        });
        expect(InspectionResult.findAll).toHaveBeenCalledWith({
          where: { inspection_item_id: { [Op.in]: [1, 2] } },
          attributes: ['inspection_id'],
          group: ['inspection_id'],
        });
        expect(Inspection.findAll).toHaveBeenCalledWith({
          attributes: expect.anything(),
          where: { id: { [Op.in]: [1, 2] } },
          order: [["inspection_date", "DESC"], ["created_at", "DESC"]],
        });
      });
    });

    describe('異常系: 存在しない機器IDによるエラー処理ができること', () => {
      it('存在しない機器IDの場合は404エラーを返すこと', async () => {
        // nullを返すようにモックを設定（存在しない機器ID）
        Device.findByPk.mockResolvedValue(null);

        // コントローラ関数を呼び出し
        await getInspectionsByDeviceId(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(404);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('機器が見つかりません');
      });

      it('データベースエラーが発生した場合はエラーを次のミドルウェアに渡すこと', async () => {
        // データベースエラーをモック
        const dbError = new Error('データベース接続エラー');
        Device.findByPk.mockRejectedValue(dbError);

        // コントローラ関数を呼び出し
        await getInspectionsByDeviceId(req, res, next);

        // エラーが次のミドルウェアに渡されたことを確認
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBe(dbError);
      });
    });
  });

  describe('getLatestInspectionByDeviceId - 機器IDによる最新点検の取得', () => {
    beforeEach(() => {
      // deviceIdパラメータを持つリクエストをセットアップ
      req = httpMocks.createRequest({
        params: {
          deviceId: '1'
        }
      });
    });

    describe('正常系: 特定の機器IDの最新点検データを取得して表示できること', () => {
      it('存在する機器IDの最新点検を取得し、200 OKレスポンスを返すこと', async () => {
        // モックデータの設定
        const mockDevice = {
          id: 1,
          device_name: 'テストサーバー1',
          customer: {
            id: 1,
            customer_name: '株式会社テスト'
          }
        };

        const mockInspectionItems = [
          { id: 1 },
          { id: 2 }
        ];

        const mockInspectionResults = [
          { inspection_id: 1 },
          { inspection_id: 2 }
        ];

        const mockLatestInspection = {
          id: 2,
          inspection_date: '2023-12-02',
          start_time: '14:00:00',
          end_time: '15:00:00',
          inspector_name: 'テスト次郎',
          status: '完了',
          created_at: new Date('2023-12-02'),
          updated_at: new Date('2023-12-02'),
          results: [
            {
              id: 3,
              inspection_item_id: 1,
              check_item: 'CPU使用率',
              status: '正常',
              checked_at: new Date('2023-12-02')
            },
            {
              id: 4,
              inspection_item_id: 2,
              check_item: 'メモリ使用率',
              status: '正常',
              checked_at: new Date('2023-12-02')
            }
          ]
        };

        // モックメソッドの戻り値を設定
        Device.findByPk.mockResolvedValue(mockDevice);
        InspectionItem.findAll.mockResolvedValue(mockInspectionItems);
        InspectionResult.findAll.mockResolvedValue(mockInspectionResults);
        Inspection.findOne.mockResolvedValue(mockLatestInspection);

        // コントローラ関数を呼び出し
        await getLatestInspectionByDeviceId(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBeTruthy();
        
        // 取得したJSONデータを検証
        const data = res._getJSONData();
        expect(data.id).toBe(2);
        expect(data.inspection_date).toBe('2023-12-02');
        expect(data.device_id).toBe(1);
        expect(data.device_name).toBe('テストサーバー1');
        expect(data.customer_id).toBe(1);
        expect(data.customer_name).toBe('株式会社テスト');
        expect(data.results).toHaveLength(2);
        expect(data.results[0].check_item).toBe('CPU使用率');
        expect(data.results[1].check_item).toBe('メモリ使用率');

        // 各メソッドが正しく呼び出されたことを確認
        expect(Device.findByPk).toHaveBeenCalledWith('1', expect.anything());
        expect(InspectionItem.findAll).toHaveBeenCalledWith({ 
          where: { device_id: '1' }, 
          attributes: ['id'] 
        });
        expect(InspectionResult.findAll).toHaveBeenCalledWith({
          where: { inspection_item_id: { [Op.in]: [1, 2] } },
          attributes: ['inspection_id'],
          group: ['inspection_id'],
        });
        expect(Inspection.findOne).toHaveBeenCalledWith(expect.objectContaining({
          where: { id: { [Op.in]: [1, 2] } },
          order: [["inspection_date", "DESC"], ["created_at", "DESC"]],
        }));
      });
    });

    describe('異常系: 存在しないデータによるエラー処理ができること', () => {
      it('存在しない機器IDの場合は404エラーを返すこと', async () => {
        // nullを返すようにモックを設定（存在しない機器ID）
        Device.findByPk.mockResolvedValue(null);

        // コントローラ関数を呼び出し
        await getLatestInspectionByDeviceId(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(404);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('機器が見つかりません');
      });

      it('点検データが存在しない場合は404エラーを返すこと', async () => {
        // モックの設定
        const mockDevice = {
          id: 1,
          device_name: 'テストサーバー1',
          customer: {
            id: 1,
            customer_name: '株式会社テスト'
          }
        };

        const mockInspectionItems = [
          { id: 1 },
          { id: 2 }
        ];

        const mockInspectionResults = [
          { inspection_id: 1 },
          { inspection_id: 2 }
        ];

        Device.findByPk.mockResolvedValue(mockDevice);
        InspectionItem.findAll.mockResolvedValue(mockInspectionItems);
        InspectionResult.findAll.mockResolvedValue(mockInspectionResults);
        // 点検データが見つからない
        Inspection.findOne.mockResolvedValue(null);

        // コントローラ関数を呼び出し
        await getLatestInspectionByDeviceId(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(404);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('点検データが見つかりません');
      });

      it('データベースエラーが発生した場合はエラーを次のミドルウェアに渡すこと', async () => {
        // データベースエラーをモック
        const dbError = new Error('データベース接続エラー');
        Device.findByPk.mockRejectedValue(dbError);

        // コントローラ関数を呼び出し
        await getLatestInspectionByDeviceId(req, res, next);

        // エラーが次のミドルウェアに渡されたことを確認
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBe(dbError);
      });
    });
  });
});