/**
 * inspectionItemCreateController.jsの単体テスト
 */
const { createInspectionItem } = require('../../../controllers/inspectionItem/inspectionItemCreateController');
const { InspectionItem, Device, Customer, InspectionItemName } = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  InspectionItem: {
    create: jest.fn(),
    findOne: jest.fn()
  },
  Device: {
    findByPk: jest.fn()
  },
  Customer: {},
  InspectionItemName: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

describe('inspectionItemCreateController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInspectionItem', () => {
    it('有効なリクエストボディで新規点検項目を作成する', async () => {
      // テストデータ
      const reqBody = {
        device_id: 1,
        item_name: 'CPUの状態確認'
      };

      // 機器データのモック
      const mockDevice = {
        id: 1,
        device_name: 'サーバー1',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // 点検項目名のモック
      const mockItemName = {
        id: 1,
        name: 'CPUの状態確認'
      };

      // 作成された点検項目のモック
      const mockCreatedItem = {
        id: 1,
        device_id: 1,
        item_name_id: 1,
        item_name: 'CPUの状態確認',
        created_at: new Date(),
        updated_at: new Date()
      };

      // モック関数の戻り値を設定
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItemName.findOne.mockResolvedValue(mockItemName);
      InspectionItem.findOne.mockResolvedValue(null); // 重複なし
      InspectionItem.create.mockResolvedValue(mockCreatedItem);

      // リクエスト/レスポンスのモック
      const req = { body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await createInspectionItem(req, res);

      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(InspectionItemName.findOne).toHaveBeenCalledWith({
        where: { name: 'CPUの状態確認' }
      });
      expect(InspectionItem.findOne).toHaveBeenCalledWith({
        where: {
          device_id: 1,
          item_name_id: 1
        }
      });
      expect(InspectionItem.create).toHaveBeenCalledWith({
        device_id: 1,
        item_name_id: 1,
        item_name: 'CPUの状態確認'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        item_name: 'CPUの状態確認',
        device_id: 1,
        device_name: 'サーバー1',
        customer_id: 1,
        customer_name: '顧客A'
      }));
    });

    it('点検項目名が存在しない場合、新しい点検項目名を作成する', async () => {
      // テストデータ
      const reqBody = {
        device_id: 1,
        item_name: '新しい点検項目'
      };

      // 機器データのモック
      const mockDevice = {
        id: 1,
        device_name: 'サーバー1',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // 新しく作成された点検項目名のモック
      const mockNewItemName = {
        id: 2,
        name: '新しい点検項目'
      };

      // 作成された点検項目のモック
      const mockCreatedItem = {
        id: 1,
        device_id: 1,
        item_name_id: 2,
        item_name: '新しい点検項目',
        created_at: new Date(),
        updated_at: new Date()
      };

      // モック関数の戻り値を設定
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItemName.findOne.mockResolvedValue(null); // 点検項目名が存在しない
      InspectionItemName.create.mockResolvedValue(mockNewItemName); // 新しい点検項目名を作成
      InspectionItem.findOne.mockResolvedValue(null); // 重複なし
      InspectionItem.create.mockResolvedValue(mockCreatedItem);

      // リクエスト/レスポンスのモック
      const req = { body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await createInspectionItem(req, res);

      // 検証
      expect(InspectionItemName.findOne).toHaveBeenCalledWith({
        where: { name: '新しい点検項目' }
      });
      expect(InspectionItemName.create).toHaveBeenCalledWith({
        name: '新しい点検項目'
      });
      expect(InspectionItem.create).toHaveBeenCalledWith({
        device_id: 1,
        item_name_id: 2,
        item_name: '新しい点検項目'
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('必須フィールドが不足している場合、400エラーを返す', async () => {
      // 不完全なリクエストデータ
      const reqBody = {
        // device_id が欠けている
        item_name: 'CPUの状態確認'
      };

      // リクエスト/レスポンスのモック
      const req = { body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await createInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('必須フィールドが不足しています');
      }

      // 検証
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Device.findByPk).not.toHaveBeenCalled();
      expect(InspectionItem.create).not.toHaveBeenCalled();
    });

    it('機器が存在しない場合、400エラーを返す', async () => {
      // テストデータ
      const reqBody = {
        device_id: 999, // 存在しないID
        item_name: 'CPUの状態確認'
      };

      // 機器データのモック
      Device.findByPk.mockResolvedValue(null); // 機器が存在しない

      // リクエスト/レスポンスのモック
      const req = { body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await createInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('指定された機器が存在しません');
      }

      // 検証
      expect(Device.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(400);
      expect(InspectionItem.create).not.toHaveBeenCalled();
    });

    it('点検項目名の処理でエラーが発生した場合、500エラーを返す', async () => {
      // テストデータ
      const reqBody = {
        device_id: 1,
        item_name: 'CPUの状態確認'
      };

      // 機器データのモック
      const mockDevice = {
        id: 1,
        device_name: 'サーバー1',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // モック関数の戻り値を設定
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItemName.findOne.mockRejectedValue(new Error('データベースエラー')); // 点検項目名の取得でエラー

      // リクエスト/レスポンスのモック
      const req = { body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await createInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('点検項目名の処理中にエラーが発生しました');
      }

      // 検証
      expect(res.status).toHaveBeenCalledWith(500);
      expect(InspectionItem.create).not.toHaveBeenCalled();
    });

    it('重複する点検項目が存在する場合、200ステータスで重複フラグを含むレスポンスを返す', async () => {
      // テストデータ
      const reqBody = {
        device_id: 1,
        item_name: 'CPUの状態確認'
      };

      // 機器データのモック
      const mockDevice = {
        id: 1,
        device_name: 'サーバー1',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // 点検項目名のモック
      const mockItemName = {
        id: 1,
        name: 'CPUの状態確認'
      };

      // 既存の点検項目のモック
      const mockExistingItem = {
        id: 1,
        device_id: 1,
        item_name_id: 1,
        item_name: 'CPUの状態確認',
        created_at: new Date(),
        updated_at: new Date()
      };

      // モック関数の戻り値を設定
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItemName.findOne.mockResolvedValue(mockItemName);
      InspectionItem.findOne.mockResolvedValue(mockExistingItem); // 重複あり

      // リクエスト/レスポンスのモック
      const req = { body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // 関数を実行
      await createInspectionItem(req, res);

      // 検証
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        duplicate: true
      }));
      expect(InspectionItem.create).not.toHaveBeenCalled();
    });

    it('ユニーク制約違反が発生した場合、400エラーを返す', async () => {
      // テストデータ
      const reqBody = {
        device_id: 1,
        item_name: 'CPUの状態確認'
      };

      // 機器データのモック
      const mockDevice = {
        id: 1,
        device_name: 'サーバー1',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // 点検項目名のモック
      const mockItemName = {
        id: 1,
        name: 'CPUの状態確認'
      };

      // ユニーク制約違反のエラー
      const uniqueConstraintError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ message: 'ユニーク制約違反' }]
      };

      // モック関数の戻り値を設定
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItemName.findOne.mockResolvedValue(mockItemName);
      InspectionItem.findOne.mockResolvedValue(null); // 重複チェックでは検出されない
      InspectionItem.create.mockRejectedValue(uniqueConstraintError); // 作成時にユニーク制約違反

      // リクエスト/レスポンスのモック
      const req = { body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await createInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('同じ機器に対して同じ点検項目名がすでに存在します');
      }

      // 検証
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('バリデーションエラーが発生した場合、400エラーを返す', async () => {
      // テストデータ
      const reqBody = {
        device_id: 1,
        item_name: 'CPUの状態確認'
      };

      // 機器データのモック
      const mockDevice = {
        id: 1,
        device_name: 'サーバー1',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // 点検項目名のモック
      const mockItemName = {
        id: 1,
        name: 'CPUの状態確認'
      };

      // バリデーションエラー
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [{ message: '点検項目名は必須です' }]
      };

      // モック関数の戻り値を設定
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItemName.findOne.mockResolvedValue(mockItemName);
      InspectionItem.findOne.mockResolvedValue(null);
      InspectionItem.create.mockRejectedValue(validationError); // 作成時にバリデーションエラー

      // リクエスト/レスポンスのモック
      const req = { body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await createInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('点検項目名は必須です');
      }

      // 検証
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('その他のエラーが発生した場合、エラーをスローする', async () => {
      // テストデータ
      const reqBody = {
        device_id: 1,
        item_name: 'CPUの状態確認'
      };

      // 機器データのモック
      const mockDevice = {
        id: 1,
        device_name: 'サーバー1',
        customer_id: 1,
        customer: {
          id: 1,
          customer_name: '顧客A'
        }
      };

      // 点検項目名のモック
      const mockItemName = {
        id: 1,
        name: 'CPUの状態確認'
      };

      // その他のエラー
      const otherError = new Error('予期せぬエラー');

      // モック関数の戻り値を設定
      Device.findByPk.mockResolvedValue(mockDevice);
      InspectionItemName.findOne.mockResolvedValue(mockItemName);
      InspectionItem.findOne.mockResolvedValue(null);
      InspectionItem.create.mockRejectedValue(otherError); // 作成時に予期せぬエラー

      // リクエスト/レスポンスのモック
      const req = { body: reqBody };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // エラーハンドリングのためのモック
      const next = jest.fn();

      // 関数実行時にエラーをキャッチ
      try {
        await createInspectionItem(req, res, next);
      } catch (error) {
        expect(error.message).toBe('予期せぬエラー');
      }
    });
  });
});