// server/tests/unit/inspection/inspectionUpdateController.test.js
const httpMocks = require('node-mocks-http');
const { mockTransaction1 } = require('../../mocks/sequelize');

// sequelizeのトランザクションをモック
jest.mock('../../../config/db', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction1)
  }
}));

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
  },
  sequelize: require('../../../config/db').sequelize
}));

const { updateInspection } = require('../../../controllers/inspection/inspectionUpdateController');
const { 
  Inspection, 
  Device, 
  Customer, 
  InspectionResult, 
  InspectionItem,
  InspectionItemName 
} = require('../../../models');

describe('点検更新コントローラのテスト', () => {
  let req, res, next;
  let mockInspection;

  beforeEach(() => {
    // リクエスト、レスポンス、nextミドルウェアのモックをリセット
    req = httpMocks.createRequest({
      method: 'PUT',
      url: '/api/inspections/1',
      params: {
        id: '1'
      },
      body: {
        inspection_date: '2023-12-02', // 更新後の日付
        inspector_name: 'テスト次郎', // 更新後の点検者名
        results: [
          {
            inspection_item_id: 1,
            status: '正常'
          },
          {
            inspection_item_id: 2,
            status: '異常'
          }
        ]
      }
    });
    
    res = httpMocks.createResponse();
    next = jest.fn();

    // すべてのモックをリセット
    jest.clearAllMocks();
    
    // 既存の点検データモック
    mockInspection = {
      id: 1,
      inspection_date: '2023-12-01',
      start_time: '09:00:00',
      end_time: '10:00:00',
      inspector_name: 'テスト太郎',
      status: '完了',
      created_at: new Date(),
      updated_at: new Date(),
      update: jest.fn().mockImplementation(function(data) {
        // thisオブジェクトの各フィールドを更新
        Object.assign(this, data);
        return Promise.resolve(this);
      })
    };
    
    // findByPkメソッドのモックを設定
    Inspection.findByPk.mockImplementation((id, options) => {
      if (id === '1') {
        // 2回目の呼び出し（更新後のデータ取得）の場合
        if (options && options.include) {
          return Promise.resolve({
            ...mockInspection,
            results: [
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
            ]
          });
        }
        return Promise.resolve(mockInspection);
      }
      return Promise.resolve(null);
    });
    
    // 点検項目のモック
    InspectionItem.findByPk.mockImplementation((id) => {
      if (id === 1 || id === 2) {
        return Promise.resolve({
          id: id,
          device: {
            id: 1,
            device_name: 'サーバー1'
          },
          item_name_master: {
            id: id,
            name: id === 1 ? 'CPU使用率' : 'メモリ使用率'
          }
        });
      }
      return Promise.resolve(null);
    });
    
    // InspectionResultの作成モック
    InspectionResult.create.mockImplementation((data) => {
      return Promise.resolve({
        id: data.inspection_item_id,
        inspection_id: data.inspection_id,
        inspection_item_id: data.inspection_item_id,
        device_id: data.device_id,
        check_item: data.check_item,
        status: data.status,
        checked_at: data.checked_at || new Date()
      });
    });
    
    // findOneメソッドのモック
    InspectionResult.findOne.mockResolvedValue({
      id: 1,
      inspection_item: {
        device: {
          id: 1,
          device_name: 'サーバー1',
          customer: {
            id: 1,
            customer_name: '株式会社テスト'
          }
        }
      }
    });
  });

  describe('正常系: 既存点検データを更新できること', () => {
    it('有効なデータで点検情報を更新し、200 OKレスポンスを返すこと', async () => {
      // コントローラ関数を呼び出し
      await updateInspection(req, res, next);

      // レスポンスの検証
      expect(res.statusCode).toBe(200);
      expect(res._isEndCalled()).toBeTruthy();
      
      // 更新が呼ばれたことを確認
      expect(mockInspection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          inspection_date: '2023-12-02',
          inspector_name: 'テスト次郎'
        }),
        { transaction: mockTransaction1 }
      );
      
      // 古い結果が削除されたことを確認
      expect(InspectionResult.destroy).toHaveBeenCalled();
      
      // 新しい結果が作成されたことを確認
      expect(InspectionResult.create).toHaveBeenCalledTimes(2);
      
      // トランザクションがコミットされたことを確認
      expect(mockTransaction1.commit).toHaveBeenCalled();
      expect(mockTransaction1.rollback).not.toHaveBeenCalled();
    });

    it('結果なしの更新も正常に処理されること', async () => {
      // 結果なしの更新リクエスト
      req.body.results = undefined;
      
      // コントローラ関数を呼び出し
      await updateInspection(req, res, next);

      // レスポンスの検証
      expect(res.statusCode).toBe(200);
      expect(res._isEndCalled()).toBeTruthy();
      
      // 更新が呼ばれたことを確認
      expect(mockInspection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          inspection_date: '2023-12-02',
          inspector_name: 'テスト次郎'
        }),
        { transaction: mockTransaction1 }
      );
      
      // 結果が削除されていないことを確認
      expect(InspectionResult.destroy).not.toHaveBeenCalled();
      
      // トランザクションがコミットされたことを確認
      expect(mockTransaction1.commit).toHaveBeenCalled();
      expect(mockTransaction1.rollback).not.toHaveBeenCalled();
    });
  });

  describe('異常系: 不正なデータによる更新エラーが処理できること', () => {
    it('存在しない点検IDの場合は404エラーを返すこと', async () => {
      // 存在しない点検ID
      req.params.id = '999';
      Inspection.findByPk.mockResolvedValue(null);
      
      // コントローラ関数を呼び出し
      await updateInspection(req, res, next);

      // エラーハンドリングの検証
      expect(res.statusCode).toBe(404);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('点検が見つかりません');
    });

    it('存在しない点検項目IDの場合は400エラーを返すこと', async () => {
      // 結果に存在しない点検項目ID
      req.body.results[0].inspection_item_id = 999;
      InspectionItem.findByPk.mockImplementation((id) => {
        if (id === 999) {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          id: id,
          device: { id: 1 },
          item_name_master: { id: id, name: 'テスト項目' }
        });
      });
      
      // コントローラ関数を呼び出し
      await updateInspection(req, res, next);

      // エラーハンドリングの検証
      expect(res.statusCode).toBe(400);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toContain('点検項目ID 999 が存在しません');
    });

    it('無効なステータス値の場合は400エラーを返すこと', async () => {
      // 無効なステータス値
      req.body.results[0].status = '無効な値';
      
      // コントローラ関数を呼び出し
      await updateInspection(req, res, next);

      // エラーハンドリングの検証
      expect(res.statusCode).toBe(400);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toContain('点検結果ステータスは"正常"または"異常"である必要があります');
    });

    it('データベースエラーが発生した場合はロールバックされること', async () => {
      // mockInspection.updateがエラーを投げるようにモック
      mockInspection.update.mockRejectedValue(new Error('データベースエラー'));
      
      // コントローラ関数を呼び出し
      await updateInspection(req, res, next);

      // エラーが次のミドルウェアに渡されたことを確認
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('データベースエラー');
      
      // トランザクションがロールバックされたことを確認
      expect(mockTransaction1.rollback).toHaveBeenCalled();
      expect(mockTransaction1.commit).not.toHaveBeenCalled();
    });
  });
});