/**
 * inspectionItemUpdateController.jsの単体テスト
 */
const { updateInspectionItem } = require('../../../controllers/inspectionItem/inspectionItemUpdateController');
const { InspectionItem, Device, Customer } = require('../../../models');
const Sequelize = require('sequelize');

// モックの設定
jest.mock('../../../models', () => ({
  InspectionItem: {
    findByPk: jest.fn(),
    findOne: jest.fn()
  },
  Device: {
    findByPk: jest.fn()
  },
  Customer: {}
}));

jest.mock('sequelize', () => {
  const actualSequelize = jest.requireActual('sequelize');
  return {
    ...actualSequelize,
    Op: {
      ne: Symbol('ne')
    }
  };
});

describe('inspectionItemUpdateController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateInspectionItem', () => {
    it('有効なリクエストボディで点検項目を更新する', async () => {
      // テストデータ
      const reqParams = { id: 1 };
      const reqBody = {
        device_id: 2,
        item_name: '更新された点検項目'
      };

      // 既存の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name: '元の点検項目',
        save: jest.fn().mockResolvedValue(true)
      };

      // 新しい機器データのモック
      const mockDevice = {
        id: 2,
        device_name: '新しい機器',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItem.findOne.mockResolvedValue(null); // 重複なし

      // リクエスト/レスポンスのモック
      const req = { params: reqParams, body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await updateInspectionItem(req, res);

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith(1);
      expect(Device.findByPk).toHaveBeenCalledWith(2, expect.any(Object));
      expect(InspectionItem.findOne).toHaveBeenCalledWith({
        where: {
          device_id: 2,
          item_name: '更新された点検項目',
          id: { [Sequelize.Op.ne]: 1 }
        }
      });
      expect(mockItem.device_id).toBe(2);
      expect(mockItem.item_name).toBe('更新された点検項目');
      expect(mockItem.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        item_name: '更新された点検項目',
        device_id: 2,
        device_name: '新しい機器',
        customer_id: 1,
        customer_name: '顧客A'
      }));
    });

    it('device_idのみを更新する', async () => {
      // テストデータ
      const reqParams = { id: 1 };
      const reqBody = {
        device_id: 2
        // item_nameは更新しない
      };

      // 既存の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name: '元の点検項目',
        save: jest.fn().mockResolvedValue(true)
      };

      // 新しい機器データのモック
      const mockDevice = {
        id: 2,
        device_name: '新しい機器',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItem.findOne.mockResolvedValue(null); // 重複なし

      // リクエスト/レスポンスのモック
      const req = { params: reqParams, body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await updateInspectionItem(req, res);

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith(1);
      expect(Device.findByPk).toHaveBeenCalledWith(2, expect.any(Object));
      expect(InspectionItem.findOne).toHaveBeenCalledWith({
        where: {
          device_id: 2,
          item_name: '元の点検項目',
          id: { [Sequelize.Op.ne]: 1 }
        }
      });
      expect(mockItem.device_id).toBe(2);
      expect(mockItem.item_name).toBe('元の点検項目'); // 変更なし
      expect(mockItem.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        item_name: '元の点検項目',
        device_id: 2
      }));
    });

    it('item_nameのみを更新する', async () => {
      // テストデータ
      const reqParams = { id: 1 };
      const reqBody = {
        // device_idは更新しない
        item_name: '更新された点検項目'
      };

      // 既存の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name: '元の点検項目',
        save: jest.fn().mockResolvedValue(true)
      };

      // 現在の機器データのモック
      const mockDevice = {
        id: 1,
        device_name: '元の機器',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItem.findOne.mockResolvedValue(null); // 重複なし

      // リクエスト/レスポンスのモック
      const req = { params: reqParams, body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await updateInspectionItem(req, res);

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith(1);
      expect(Device.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(InspectionItem.findOne).toHaveBeenCalledWith({
        where: {
          device_id: 1,
          item_name: '更新された点検項目',
          id: { [Sequelize.Op.ne]: 1 }
        }
      });
      expect(mockItem.device_id).toBe(1); // 変更なし
      expect(mockItem.item_name).toBe('更新された点検項目');
      expect(mockItem.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        item_name: '更新された点検項目',
        device_id: 1
      }));
    });

    it('点検項目が存在しない場合、404エラーを返す', async () => {
      // テストデータ
      const reqParams = { id: 999 }; // 存在しないID
      const reqBody = {
        device_id: 2,
        item_name: '更新された点検項目'
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(null); // 点検項目が存在しない

      // リクエスト/レスポンスのモック
      const req = { params: reqParams, body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await updateInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('点検項目が見つかりません');
      }

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(Device.findByPk).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('指定された機器が存在しない場合、400エラーを返す', async () => {
      // テストデータ
      const reqParams = { id: 1 };
      const reqBody = {
        device_id: 999, // 存在しないID
        item_name: '更新された点検項目'
      };

      // 既存の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name: '元の点検項目',
        save: jest.fn()
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);
      Device.findByPk.mockResolvedValue(null); // 機器が存在しない

      // リクエスト/レスポンスのモック
      const req = { params: reqParams, body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await updateInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('指定された機器が存在しません');
      }

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith(1);
      expect(Device.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockItem.save).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('同じ機器に対して同じ点検項目名が既に存在する場合、400エラーを返す', async () => {
      // テストデータ
      const reqParams = { id: 1 };
      const reqBody = {
        device_id: 2,
        item_name: '既存の点検項目'
      };

      // 既存の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name: '元の点検項目',
        save: jest.fn()
      };

      // 新しい機器データのモック
      const mockDevice = {
        id: 2,
        device_name: '新しい機器',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // 重複する点検項目のモック
      const mockExistingItem = {
        id: 2,
        device_id: 2,
        item_name: '既存の点検項目'
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItem.findOne.mockResolvedValue(mockExistingItem); // 重複あり

      // リクエスト/レスポンスのモック
      const req = { params: reqParams, body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await updateInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('同じ機器に対して同じ点検項目名がすでに存在します');
      }

      // 検証
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockItem.save).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('ユニーク制約違反エラーが発生した場合、400エラーを返す', async () => {
      // テストデータ
      const reqParams = { id: 1 };
      const reqBody = {
        device_id: 2,
        item_name: '更新された点検項目'
      };

      // 既存の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name: '元の点検項目',
        save: jest.fn().mockRejectedValue({
          name: 'SequelizeUniqueConstraintError',
          errors: [{ message: 'ユニーク制約違反' }]
        })
      };

      // 新しい機器データのモック
      const mockDevice = {
        id: 2,
        device_name: '新しい機器',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItem.findOne.mockResolvedValue(null); // 重複なし（事前チェックでは検出されない）

      // リクエスト/レスポンスのモック
      const req = { params: reqParams, body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await updateInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('同じ機器に対して同じ点検項目名がすでに存在します');
      }

      // 検証
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockItem.save).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('バリデーションエラーが発生した場合、400エラーを返す', async () => {
      // テストデータ
      const reqParams = { id: 1 };
      const reqBody = {
        device_id: 2,
        item_name: '更新された点検項目'
      };

      // 既存の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name: '元の点検項目',
        save: jest.fn().mockRejectedValue({
          name: 'SequelizeValidationError',
          errors: [{ message: '点検項目名は必須です' }]
        })
      };

      // 新しい機器データのモック
      const mockDevice = {
        id: 2,
        device_name: '新しい機器',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItem.findOne.mockResolvedValue(null); // 重複なし

      // リクエスト/レスポンスのモック
      const req = { params: reqParams, body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await updateInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('点検項目名は必須です');
      }

      // 検証
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockItem.save).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('その他のエラーが発生した場合、エラーをスローする', async () => {
      // テストデータ
      const reqParams = { id: 1 };
      const reqBody = {
        device_id: 2,
        item_name: '更新された点検項目'
      };

      // 既存の点検項目のモック
      const mockItem = {
        id: 1,
        device_id: 1,
        item_name: '元の点検項目',
        save: jest.fn().mockRejectedValue(new Error('予期せぬエラー'))
      };

      // 新しい機器データのモック
      const mockDevice = {
        id: 2,
        device_name: '新しい機器',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // モック関数の戻り値を設定
      InspectionItem.findByPk.mockResolvedValue(mockItem);
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItem.findOne.mockResolvedValue(null); // 重複なし

      // リクエスト/レスポンスのモック
      const req = { params: reqParams, body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーフラグ
      let errorThrown = false;

      try {
        await updateInspectionItem(req, res);
      } catch (error) {
        errorThrown = true;
        expect(error.message).toBe('予期せぬエラー');
      }

      // エラーが発生したことを確認
      expect(errorThrown).toBe(true);
      
      // 検証
      expect(mockItem.save).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});