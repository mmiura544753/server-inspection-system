/**
 * inspectionItemDeleteController.jsの単体テスト
 */
const { deleteInspectionItem } = require('../../../controllers/inspectionItem/inspectionItemDeleteController');
const { InspectionItem } = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  InspectionItem: {
    findByPk: jest.fn(),
    destroy: jest.fn()
  }
}));

describe('inspectionItemDeleteController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteInspectionItem', () => {
    it('存在する点検項目を正常に削除できる', async () => {
      // 削除対象の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name_id: 1,
        item_name: 'CPUの状態確認',
        destroy: jest.fn().mockResolvedValue(true)
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);

      // リクエスト/レスポンスのモック
      const req = {
        params: {
          id: '1'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await deleteInspectionItem(req, res);

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith('1');
      expect(mockItem.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: '点検項目を削除しました' });
    });

    it('存在しない点検項目IDの場合、404エラーを返す', async () => {
      // 点検項目が存在しない場合のモック
      InspectionItem.findByPk.mockResolvedValue(null);

      // リクエスト/レスポンスのモック
      const req = {
        params: {
          id: '999' // 存在しないID
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await deleteInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('点検項目が見つかりません');
      }

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('削除処理中にエラーが発生した場合、エラーをスローする', async () => {
      // 削除対象の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name_id: 1,
        item_name: 'CPUの状態確認',
        destroy: jest.fn().mockRejectedValue(new Error('データベースエラー'))
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);

      // リクエスト/レスポンスのモック
      const req = {
        params: {
          id: '1'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await deleteInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('データベースエラー');
      }

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith('1');
      expect(mockItem.destroy).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('数値以外のIDが指定された場合も正しく処理する', async () => {
      // 削除対象の点検項目のモック（文字列IDの場合）
      const mockItem = {
        id: 'abc',
        device_id: 1,
        item_name_id: 1,
        item_name: 'CPUの状態確認',
        destroy: jest.fn().mockResolvedValue(true)
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);

      // リクエスト/レスポンスのモック
      const req = {
        params: {
          id: 'abc' // 数値以外のID
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await deleteInspectionItem(req, res);

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith('abc');
      expect(mockItem.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: '点検項目を削除しました' });
    });

    it('IDパラメータが指定されていない場合も正しく処理する', async () => {
      // モック関数の戻り値を設定（IDがundefinedの場合）
      InspectionItem.findByPk.mockResolvedValue(null);

      // リクエスト/レスポンスのモック（IDなし）
      const req = {
        params: {}
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await deleteInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('点検項目が見つかりません');
      }

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});