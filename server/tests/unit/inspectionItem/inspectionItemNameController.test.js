// server/tests/unit/inspectionItem/inspectionItemNameController.test.js
const httpMocks = require('node-mocks-http');
const { 
  getAllInspectionItemNames, 
  getInspectionItemNameById,
  createInspectionItemName,
  updateInspectionItemName
} = require('../../../controllers/inspectionItem/inspectionItemNameController');
const { InspectionItemName } = require('../../../models');

// モックの設定
jest.mock('../../../models', () => ({
  InspectionItemName: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  InspectionItem: {
    count: jest.fn(),
  }
}));

describe('点検項目名コントローラのテスト', () => {
  let req, res, next;

  beforeEach(() => {
    // リクエスト、レスポンス、nextミドルウェアのモックをリセット
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();

    // すべてのモックをリセット
    jest.clearAllMocks();
  });

  describe('getAllInspectionItemNames - 点検項目名一覧の取得', () => {
    describe('正常系: 点検項目名データを取得して表示できること', () => {
      it('点検項目名の一覧を取得し、200 OKレスポンスを返すこと', async () => {
        // モックデータの設定
        const mockItemNames = [
          {
            id: 1,
            name: 'CPU使用率',
            created_at: '2023-01-01T00:00:00.000Z',
            updated_at: '2023-01-01T00:00:00.000Z'
          },
          {
            id: 2,
            name: 'メモリ使用率',
            created_at: '2023-01-02T00:00:00.000Z',
            updated_at: '2023-01-02T00:00:00.000Z'
          },
          {
            id: 3,
            name: 'ディスク使用率',
            created_at: '2023-01-03T00:00:00.000Z',
            updated_at: '2023-01-03T00:00:00.000Z'
          }
        ];

        // findAllメソッドのモックを設定
        InspectionItemName.findAll.mockResolvedValue(mockItemNames);

        // コントローラ関数を呼び出し
        await getAllInspectionItemNames(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBeTruthy();
        expect(res._getJSONData()).toEqual(mockItemNames);

        // findAllが呼び出されたことを確認
        expect(InspectionItemName.findAll).toHaveBeenCalledWith({
          order: [['name', 'ASC']]
        });
      });

      it('空の配列が返された場合も正常に処理すること', async () => {
        // 空の配列を返すようにモックを設定
        InspectionItemName.findAll.mockResolvedValue([]);

        // コントローラ関数を呼び出し
        await getAllInspectionItemNames(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBeTruthy();
        expect(res._getJSONData()).toEqual([]);

        // findAllが呼び出されたことを確認
        expect(InspectionItemName.findAll).toHaveBeenCalledWith({
          order: [['name', 'ASC']]
        });
      });
    });

    describe('異常系: API呼び出しエラー時にエラーメッセージを表示できること', () => {
      it('データベースエラーが発生した場合は500エラーを返すこと', async () => {
        // データベースエラーをモック
        const dbError = new Error('データベース接続エラー');
        InspectionItemName.findAll.mockRejectedValue(dbError);

        // コントローラ関数を呼び出し
        await getAllInspectionItemNames(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(500);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('点検項目名の取得に失敗しました');
      });
    });
  });

  describe('getInspectionItemNameById - 個別の点検項目名取得', () => {
    beforeEach(() => {
      // IDパラメータを持つリクエストをセットアップ
      req = httpMocks.createRequest({
        params: {
          id: '1'
        }
      });
    });

    describe('正常系: IDによる点検項目名の取得', () => {
      it('存在するIDの点検項目名を取得し、200 OKレスポンスを返すこと', async () => {
        // モックデータの設定
        const mockItemName = {
          id: 1,
          name: 'CPU使用率',
          created_at: '2023-01-01T00:00:00.000Z',
          updated_at: '2023-01-01T00:00:00.000Z'
        };

        // findByPkメソッドのモックを設定
        InspectionItemName.findByPk.mockResolvedValue(mockItemName);

        // コントローラ関数を呼び出し
        await getInspectionItemNameById(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBeTruthy();
        expect(res._getJSONData()).toEqual(mockItemName);

        // findByPkが正しいIDで呼び出されたことを確認
        expect(InspectionItemName.findByPk).toHaveBeenCalledWith('1');
      });
    });

    describe('異常系: IDによる点検項目名の取得エラー', () => {
      it('存在しないIDの場合は404エラーを返すこと', async () => {
        // nullを返すようにモックを設定（存在しないID）
        InspectionItemName.findByPk.mockResolvedValue(null);

        // コントローラ関数を呼び出し
        await getInspectionItemNameById(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(404);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('点検項目名が見つかりません');
      });

      it('データベースエラーが発生した場合は500エラーを返すこと', async () => {
        // データベースエラーをモック
        const dbError = new Error('データベースエラー');
        InspectionItemName.findByPk.mockRejectedValue(dbError);

        // コントローラ関数を呼び出し
        await getInspectionItemNameById(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(500);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('データベースエラー');
      });
    });
  });

  describe('createInspectionItemName - 点検項目名の作成', () => {
    describe('正常系: 入力データを送信して新規点検項目名を作成できること', () => {
      it('有効なデータで点検項目名を作成し、201 Createdレスポンスを返すこと', async () => {
        // 有効なリクエストボディを持つリクエストをセットアップ
        req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/inspection-item-names',
          body: {
            name: '新規点検項目名'
          }
        });

        // 既存の点検項目名がないことを確認
        InspectionItemName.findOne.mockResolvedValue(null);

        // 作成された点検項目名のモックデータを設定
        const createdItemName = {
          id: 10,
          name: '新規点検項目名',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        InspectionItemName.create.mockResolvedValue(createdItemName);

        // コントローラ関数を呼び出し
        await createInspectionItemName(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(201);
        expect(res._isEndCalled()).toBeTruthy();
        expect(res._getJSONData()).toEqual(createdItemName);

        // findOneとcreateが正しく呼び出されたことを確認
        expect(InspectionItemName.findOne).toHaveBeenCalledWith({
          where: { name: '新規点検項目名' }
        });
        expect(InspectionItemName.create).toHaveBeenCalledWith({ name: '新規点検項目名' });
      });
    });

    describe('異常系: バリデーションエラーが適切に表示されること', () => {
      it('空の点検項目名の場合は400エラーを返すこと', async () => {
        // 空の名前を持つリクエストをセットアップ
        req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/inspection-item-names',
          body: {
            name: ''
          }
        });

        // コントローラ関数を呼び出し
        await createInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('点検項目名は必須です');
      });

      it('nameパラメータがない場合は400エラーを返すこと', async () => {
        // nameパラメータのないリクエストをセットアップ
        req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/inspection-item-names',
          body: {}
        });

        // コントローラ関数を呼び出し
        await createInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('点検項目名は必須です');
      });

      it('既に存在する点検項目名の場合は400エラーを返すこと', async () => {
        // 有効なリクエストボディを持つリクエストをセットアップ
        req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/inspection-item-names',
          body: {
            name: '既存点検項目名'
          }
        });

        // 既存の点検項目名があることをモックで設定
        InspectionItemName.findOne.mockResolvedValue({
          id: 1,
          name: '既存点検項目名'
        });

        // コントローラ関数を呼び出し
        await createInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('同じ点検項目名がすでに存在します');
      });

      it('Sequelizeのユニーク制約エラーを適切に処理すること', async () => {
        // 有効なリクエストボディを持つリクエストをセットアップ
        req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/inspection-item-names',
          body: {
            name: '別の既存点検項目名'
          }
        });

        // 既存のチェックをパスさせる（モックで設定）
        InspectionItemName.findOne.mockResolvedValue(null);

        // Sequelizeのユニーク制約エラーをモックで設定
        const uniqueError = new Error('SequelizeUniqueConstraintError');
        uniqueError.name = 'SequelizeUniqueConstraintError';
        InspectionItemName.create.mockRejectedValue(uniqueError);

        // コントローラ関数を呼び出し
        await createInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('同じ点検項目名がすでに存在します');
      });

      it('Sequelizeのバリデーションエラーを適切に処理すること', async () => {
        // 有効なリクエストボディを持つリクエストをセットアップ
        req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/inspection-item-names',
          body: {
            name: '長すぎる点検項目名'.repeat(100) // 非常に長い名前
          }
        });

        // 既存のチェックをパスさせる（モックで設定）
        InspectionItemName.findOne.mockResolvedValue(null);

        // Sequelizeのバリデーションエラーをモックで設定
        const validationError = new Error('SequelizeValidationError');
        validationError.name = 'SequelizeValidationError';
        validationError.errors = [
          { message: '点検項目名は255文字以内で入力してください' }
        ];
        InspectionItemName.create.mockRejectedValue(validationError);

        // コントローラ関数を呼び出し
        await createInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('点検項目名は255文字以内で入力してください');
      });

      it('その他のデータベースエラーを500エラーとして処理すること', async () => {
        // 有効なリクエストボディを持つリクエストをセットアップ
        req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/inspection-item-names',
          body: {
            name: '新規点検項目名'
          }
        });

        // 既存のチェックをパスさせる（モックで設定）
        InspectionItemName.findOne.mockResolvedValue(null);

        // データベースエラーをモックで設定
        const dbError = new Error('データベース接続エラー');
        InspectionItemName.create.mockRejectedValue(dbError);

        // コントローラ関数を呼び出し
        await createInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(500);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('データベース接続エラー');
      });
    });
  });

  describe('updateInspectionItemName - 点検項目名の更新', () => {
    beforeEach(() => {
      // IDパラメータを持つリクエストをセットアップ
      req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/inspection-item-names/1',
        params: {
          id: '1'
        },
        body: {
          name: '更新後の点検項目名'
        }
      });
    });

    describe('正常系: 既存点検項目名データを更新できること', () => {
      it('有効なデータで点検項目名を更新し、200 OKレスポンスを返すこと', async () => {
        // 更新対象の既存点検項目名をモックで設定
        const existingItemName = {
          id: 1,
          name: '更新前の点検項目名',
          save: jest.fn().mockResolvedValue(true)
        };
        InspectionItemName.findByPk.mockResolvedValue(existingItemName);

        // 同名の項目がないことを確認（自分以外）
        InspectionItemName.findOne.mockResolvedValue(null);

        // コントローラ関数を呼び出し
        await updateInspectionItemName(req, res, next);

        // レスポンスの検証
        expect(res.statusCode).toBe(200);
        expect(res._isEndCalled()).toBeTruthy();
        
        // saveメソッドはJSON化されないため、レスポンスデータにはsaveメソッドが含まれない
        const responseData = res._getJSONData();
        expect(responseData).toEqual({
          id: 1,
          name: '更新後の点検項目名'
        });
        
        // 属性が更新されていることを確認
        expect(existingItemName.name).toBe('更新後の点検項目名');
        
        // 必要なメソッドが呼ばれたことを確認
        expect(InspectionItemName.findByPk).toHaveBeenCalledWith('1');
        expect(InspectionItemName.findOne).toHaveBeenCalledWith({
          where: { 
            name: '更新後の点検項目名',
            id: { [require('sequelize').Op.ne]: '1' }
          }
        });
        expect(existingItemName.save).toHaveBeenCalled();
      });
    });

    describe('異常系: 不正なデータによる更新エラーが処理できること', () => {
      it('存在しないIDの場合は404エラーを返すこと', async () => {
        // 存在しない点検項目名IDをモックで設定
        InspectionItemName.findByPk.mockResolvedValue(null);

        // コントローラ関数を呼び出し
        await updateInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(404);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('更新対象の点検項目名が見つかりません');
      });

      it('空の点検項目名の場合は400エラーを返すこと', async () => {
        // 空の名前を持つリクエストをセットアップ
        req = httpMocks.createRequest({
          method: 'PUT',
          url: '/api/inspection-item-names/1',
          params: {
            id: '1'
          },
          body: {
            name: ''
          }
        });

        // コントローラ関数を呼び出し
        await updateInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('点検項目名は必須です');
      });

      it('同名の点検項目名が既に存在する場合は400エラーを返すこと', async () => {
        // 更新対象の既存点検項目名をモックで設定
        const existingItemName = {
          id: 1,
          name: '更新前の点検項目名',
          save: jest.fn().mockResolvedValue(true)
        };
        InspectionItemName.findByPk.mockResolvedValue(existingItemName);

        // 同名の項目が既に存在することをモックで設定
        InspectionItemName.findOne.mockResolvedValue({
          id: 2,
          name: '更新後の点検項目名'
        });

        // コントローラ関数を呼び出し
        await updateInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('同じ点検項目名がすでに存在します');
      });

      it('Sequelizeのユニーク制約エラーを適切に処理すること', async () => {
        // 更新対象の既存点検項目名をモックで設定
        const existingItemName = {
          id: 1,
          name: '更新前の点検項目名',
          save: jest.fn()
        };
        InspectionItemName.findByPk.mockResolvedValue(existingItemName);

        // 同名の項目がないことを確認（自分以外）
        InspectionItemName.findOne.mockResolvedValue(null);

        // Sequelizeのユニーク制約エラーをモックで設定
        const uniqueError = new Error('SequelizeUniqueConstraintError');
        uniqueError.name = 'SequelizeUniqueConstraintError';
        existingItemName.save.mockRejectedValue(uniqueError);

        // コントローラ関数を呼び出し
        await updateInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('同じ点検項目名がすでに存在します');
      });

      it('Sequelizeのバリデーションエラーを適切に処理すること', async () => {
        // 更新対象の既存点検項目名をモックで設定
        const existingItemName = {
          id: 1,
          name: '更新前の点検項目名',
          save: jest.fn()
        };
        InspectionItemName.findByPk.mockResolvedValue(existingItemName);

        // 同名の項目がないことを確認（自分以外）
        InspectionItemName.findOne.mockResolvedValue(null);

        // 非常に長い名前を持つリクエストをセットアップ
        req = httpMocks.createRequest({
          method: 'PUT',
          url: '/api/inspection-item-names/1',
          params: {
            id: '1'
          },
          body: {
            name: '長すぎる点検項目名'.repeat(100) // 非常に長い名前
          }
        });

        // Sequelizeのバリデーションエラーをモックで設定
        const validationError = new Error('SequelizeValidationError');
        validationError.name = 'SequelizeValidationError';
        validationError.errors = [
          { message: '点検項目名は255文字以内で入力してください' }
        ];
        existingItemName.save.mockRejectedValue(validationError);

        // コントローラ関数を呼び出し
        await updateInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('点検項目名は255文字以内で入力してください');
      });

      it('その他のデータベースエラーを500エラーとして処理すること', async () => {
        // 更新対象の既存点検項目名をモックで設定
        const existingItemName = {
          id: 1,
          name: '更新前の点検項目名',
          save: jest.fn()
        };
        InspectionItemName.findByPk.mockResolvedValue(existingItemName);

        // 同名の項目がないことを確認（自分以外）
        InspectionItemName.findOne.mockResolvedValue(null);

        // データベースエラーをモックで設定
        const dbError = new Error('データベース接続エラー');
        existingItemName.save.mockRejectedValue(dbError);

        // コントローラ関数を呼び出し
        await updateInspectionItemName(req, res, next);

        // エラーハンドリングの検証
        expect(res.statusCode).toBe(500);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toBe('データベース接続エラー');
      });
    });
  });
});