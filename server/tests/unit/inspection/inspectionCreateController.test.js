// server/tests/unit/inspection/inspectionCreateController.test.js
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

const { createInspection } = require('../../../controllers/inspection/inspectionCreateController');
const { 
  Inspection, 
  Device, 
  Customer, 
  InspectionResult, 
  InspectionItem,
  InspectionItemName 
} = require('../../../models');

describe('点検作成コントローラのテスト', () => {
  let req, res, next;

  beforeEach(() => {
    // リクエスト、レスポンス、nextミドルウェアのモックをリセット
    req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/inspections',
      body: {
        inspection_date: '2023-12-01',
        start_time: '09:00:00',
        end_time: '10:00:00',
        inspector_name: 'テスト太郎',
        device_id: 1,
        results: [
          {
            inspection_item_id: 1,
            status: '正常'
          },
          {
            inspection_item_id: 2,
            status: '正常'
          }
        ]
      }
    });
    
    res = httpMocks.createResponse();
    next = jest.fn();

    // すべてのモックをリセット
    jest.clearAllMocks();
    
    // デフォルトのモック値を設定
    Device.findByPk.mockResolvedValue({
      id: 1,
      device_name: 'サーバー1',
      customer: {
        id: 1,
        customer_name: '株式会社テスト'
      }
    });
    
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
    
    // Inspectionの作成モック
    Inspection.create.mockResolvedValue({
      id: 1,
      inspection_date: '2023-12-01',
      start_time: '09:00:00',
      end_time: '10:00:00',
      inspector_name: 'テスト太郎',
      status: '完了',
      created_at: new Date(),
      updated_at: new Date()
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
  });

  describe('正常系: 入力データを送信して新規点検を作成できること', () => {
    it('有効なデータで点検を作成し、201 Createdレスポンスを返すこと', async () => {
      // コントローラ関数を呼び出し
      await createInspection(req, res, next);

      // レスポンスの検証
      expect(res.statusCode).toBe(201);
      expect(res._isEndCalled()).toBeTruthy();
      
      // 取得したJSONデータを検証
      const data = res._getJSONData();
      expect(data.id).toBe(1);
      expect(data.inspection_date).toBe('2023-12-01');
      expect(data.inspector_name).toBe('テスト太郎');
      expect(data.status).toBe('完了');
      expect(data.results).toHaveLength(2);

      // 必要なメソッドが呼ばれたことを確認
      expect(Inspection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          inspection_date: '2023-12-01',
          inspector_name: 'テスト太郎'
        }),
        { transaction: mockTransaction1 }
      );
      
      expect(InspectionResult.create).toHaveBeenCalledTimes(2);
      
      // トランザクションがコミットされたことを確認
      expect(mockTransaction1.commit).toHaveBeenCalled();
      expect(mockTransaction1.rollback).not.toHaveBeenCalled();
    });
  });

  describe('異常系: バリデーションエラーが適切に表示されること', () => {
    it('必須フィールドが不足している場合は400エラーを返すこと', async () => {
      // inspection_dateがないリクエスト
      req.body.inspection_date = undefined;
      
      // コントローラ関数を呼び出し
      await createInspection(req, res, next);

      // エラーハンドリングの検証
      expect(res.statusCode).toBe(400);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toContain('必須フィールドが不足しています');
    });

    it('device_idが無効な場合は400エラーを返すこと', async () => {
      // 存在しない機器ID
      req.body.device_id = 999;
      Device.findByPk.mockResolvedValue(null);
      
      // コントローラ関数を呼び出し
      await createInspection(req, res, next);

      // エラーハンドリングの検証
      expect(res.statusCode).toBe(400);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('指定された機器が存在しません');
    });

    it('点検結果がない場合は400エラーを返すこと', async () => {
      // 結果がない
      req.body.results = [];
      
      // コントローラ関数を呼び出し
      await createInspection(req, res, next);

      // エラーハンドリングの検証
      expect(res.statusCode).toBe(400);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toContain('少なくとも1つの点検結果が必要です');
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
      await createInspection(req, res, next);

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
      await createInspection(req, res, next);

      // エラーハンドリングの検証
      expect(res.statusCode).toBe(400);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toContain('点検結果ステータスは"正常"または"異常"である必要があります');
    });

    it('データベースエラーが発生した場合はロールバックされること', async () => {
      // Inspection.createがエラーを投げるようにモック
      Inspection.create.mockRejectedValue(new Error('データベースエラー'));
      
      // コントローラ関数を呼び出し
      await createInspection(req, res, next);

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