// server/tests/unit/inspection/inspectionDeleteController.test.js
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
    findByPk: jest.fn(),
    destroy: jest.fn()
  },
  InspectionResult: {
    destroy: jest.fn()
  },
  sequelize: require('../../../config/db').sequelize
}));

const { deleteInspection } = require('../../../controllers/inspection/inspectionDeleteController');
const { Inspection, InspectionResult } = require('../../../models');

describe('点検削除コントローラのテスト', () => {
  let req, res, next;

  beforeEach(() => {
    // リクエスト、レスポンス、nextミドルウェアのモックをリセット
    req = httpMocks.createRequest({
      method: 'DELETE',
      url: '/api/inspections/1',
      params: {
        id: '1'
      }
    });
    
    res = httpMocks.createResponse();
    next = jest.fn();

    // すべてのモックをリセット
    jest.clearAllMocks();
    
    // 既存の点検データモック
    const mockInspection = {
      id: 1,
      inspection_date: '2023-12-01',
      start_time: '09:00:00',
      end_time: '10:00:00',
      inspector_name: 'テスト太郎',
      status: '完了',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // findByPkメソッドのモックを設定
    Inspection.findByPk.mockImplementation((id) => {
      if (id === '1') {
        return Promise.resolve(mockInspection);
      }
      return Promise.resolve(null);
    });
    
    // 削除メソッドのモックを設定
    Inspection.destroy.mockResolvedValue(1); // 1行削除された
    InspectionResult.destroy.mockResolvedValue(2); // 2件の結果が削除された
  });

  describe('正常系: 点検データを削除できること', () => {
    it('有効な点検IDで削除し、成功メッセージを返すこと', async () => {
      // コントローラ関数を呼び出し
      await deleteInspection(req, res, next);

      // レスポンスの検証
      expect(res.statusCode).toBe(200);
      expect(res._isEndCalled()).toBeTruthy();
      expect(res._getJSONData()).toEqual({ message: '点検を削除しました' });
      
      // 結果が削除されたことを確認
      expect(InspectionResult.destroy).toHaveBeenCalledWith({
        where: { inspection_id: '1' },
        transaction: mockTransaction1
      });
      
      // 点検が削除されたことを確認
      expect(Inspection.destroy).toHaveBeenCalledWith({
        where: { id: '1' },
        transaction: mockTransaction1
      });
      
      // トランザクションがコミットされたことを確認
      expect(mockTransaction1.commit).toHaveBeenCalled();
      expect(mockTransaction1.rollback).not.toHaveBeenCalled();
    });
  });

  describe('異常系: 削除失敗時のエラー処理ができること', () => {
    it('存在しない点検IDの場合は404エラーを返すこと', async () => {
      // 存在しない点検ID
      req.params.id = '999';
      Inspection.findByPk.mockResolvedValue(null);
      
      // コントローラ関数を呼び出し
      await deleteInspection(req, res, next);

      // エラーハンドリングの検証
      expect(res.statusCode).toBe(404);
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('点検が見つかりません');
    });

    it('データベースエラーが発生した場合はロールバックされること', async () => {
      // InspectionResult.destroyがエラーを投げるようにモック
      InspectionResult.destroy.mockRejectedValue(new Error('データベースエラー'));
      
      // コントローラ関数を呼び出し
      await deleteInspection(req, res, next);

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