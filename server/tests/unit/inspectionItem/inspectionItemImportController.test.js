/**
 * inspectionItemImportController.jsの単体テスト
 */
const {
  importInspectionItemsFromCsv,
} = require("../../../controllers/inspectionItem/inspectionItemImportController");
const csvParse = require("csv-parse/sync");
const iconv = require("iconv-lite");

// モックの設定
jest.mock("../../../config/db", () => {
  return {
    sequelize: {
      transaction: jest.fn().mockImplementation(() => {
        return {
          commit: jest.fn().mockResolvedValue(true),
          rollback: jest.fn().mockResolvedValue(true),
        };
      }),
    },
  };
});

jest.mock("../../../models", () => {
  return {
    InspectionItem: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
    },
    Device: {
      findOne: jest.fn(),
      create: jest.fn(),
    },
    Customer: {
      findOne: jest.fn(),
      create: jest.fn(),
    },
    InspectionItemName: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    },
  };
});

// モジュールのモックをインポート
const {
  InspectionItem,
  Device,
  Customer,
  InspectionItemName,
} = require("../../../models");
const { sequelize } = require("../../../config/db");

jest.mock("csv-parse/sync", () => ({
  parse: jest.fn(),
}));

jest.mock("iconv-lite", () => ({
  decode: jest.fn(),
}));

// console.logをモック化して出力を抑制
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe("inspectionItemImportController", () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    // コンソール出力を抑制
    console.log = jest.fn();
    console.error = jest.fn();
  });

  // テスト後に元のコンソール関数を復元
  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe("importInspectionItemsFromCsv", () => {
    it("CSVファイルから点検項目を正常にインポートできる", async () => {
      // モックデータの設定
      const mockFile = {
        buffer: Buffer.from("mockCSVContent"),
      };

      const mockCSVContent =
        "点検項目,サーバ名,ラックNo.,ユニット,機種,顧客名\nCPU状態確認,サーバー1,1,42～44,Model A,顧客A\nメモリ状態確認,サーバー2,1,38,Model B,顧客A";

      // CSVパースのモック実装
      const mockParsedCSV = [
        {
          点検項目: "CPU状態確認",
          サーバ名: "サーバー1",
          "ラックNo.": "1",
          ユニット: "42～44",
          機種: "Model A",
          顧客名: "顧客A",
        },
        {
          点検項目: "メモリ状態確認",
          サーバ名: "サーバー2",
          "ラックNo.": "1",
          ユニット: "38",
          機種: "Model B",
          顧客名: "顧客A",
        },
      ];

      // モック実装の設定
      iconv.decode.mockReturnValue(mockCSVContent);
      csvParse.parse.mockReturnValue(mockParsedCSV);

      // 点検項目名マスタの検索結果
      InspectionItemName.findAll.mockResolvedValue([]);
      InspectionItemName.findOne.mockResolvedValue(null); // ないので create される

      // 顧客と機器の検索結果（最初の行）
      const mockCustomer = { id: 201, customer_name: "顧客A" };
      const mockDevice1 = {
        id: 101,
        device_name: "サーバー1",
        customer_id: 201,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockDevice2 = {
        id: 102,
        device_name: "サーバー2",
        customer_id: 201,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockItemName1 = { id: 301, name: "CPU状態確認" };
      const mockItemName2 = { id: 302, name: "メモリ状態確認" };
      const mockInspectionItem1 = {
        id: 1,
        device_id: 101,
        item_name_id: 301,
        item_name: "CPU状態確認",
      };
      const mockInspectionItem2 = {
        id: 2,
        device_id: 102,
        item_name_id: 302,
        item_name: "メモリ状態確認",
      };

      // キャッシュを使用することを想定したモック実装
      Customer.findOne.mockResolvedValueOnce(mockCustomer); // 顧客検索（1回目）
      Device.findOne.mockResolvedValueOnce(mockDevice1); // 1行目の機器検索
      Device.findOne.mockResolvedValueOnce(mockDevice2); // 2行目の機器検索
      InspectionItemName.findOne.mockResolvedValueOnce(mockItemName1); // 1行目の点検項目名
      InspectionItemName.findOne.mockResolvedValueOnce(mockItemName2); // 2行目の点検項目名
      InspectionItem.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null); // 重複チェック（2回）
      InspectionItem.create
        .mockResolvedValueOnce(mockInspectionItem1)
        .mockResolvedValueOnce(mockInspectionItem2); // 点検項目作成（2回）

      // リクエスト/レスポンスのモック
      const req = {
        file: mockFile,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // 関数を実行
      await importInspectionItemsFromCsv(req, res);

      // 検証
      expect(iconv.decode).toHaveBeenCalledWith(mockFile.buffer, "Shift_JIS");
      expect(csvParse.parse).toHaveBeenCalledWith(
        mockCSVContent,
        expect.any(Object)
      );
      expect(InspectionItemName.findAll).toHaveBeenCalled();
      expect(sequelize.transaction).toHaveBeenCalled();

      // 顧客と機器の検索/作成
      expect(Customer.findOne).toHaveBeenCalledTimes(1); // キャッシュを考慮
      expect(Device.findOne).toHaveBeenCalledTimes(2);

      // 点検項目の作成
      expect(InspectionItem.create).toHaveBeenCalledTimes(2);

      // トランザクションがコミットされたことを確認
      // 注: sequelize.transaction()の戻り値は配列内で参照できないため、直接確認する
      const mockTransaction = sequelize.transaction.mock.results[0].value;
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();

      // レスポンス
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            "2/2 件のデータをインポートしました"
          ),
          data: expect.objectContaining({
            importedRows: 2,
            totalRows: 2,
          }),
        })
      );
    });

    it("ファイルがアップロードされていない場合はエラーを返す", async () => {
      // ファイルなしのリクエスト
      const req = {
        file: null,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // エラーをキャッチするためのnext関数をセットアップ
      const next = jest.fn((error) => {
        expect(error.message).toBe("CSVファイルが提供されていません");
      });

      // 関数を実行
      await importInspectionItemsFromCsv(req, res, next);

      // 検証
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalled();
    });

    it("既存の点検項目をIDに基づいて更新できる", async () => {
      // モックデータの設定
      const mockFile = {
        buffer: Buffer.from("mockCSVContent"),
      };

      const mockCSVContent =
        "ID,点検項目,サーバ名,ラックNo.,ユニット,機種,顧客名\n1,CPU状態確認,サーバー1,1,42～44,Model A,顧客A";

      // CSVパースのモック実装
      const mockParsedCSV = [
        {
          ID: "1",
          点検項目: "CPU状態確認",
          サーバ名: "サーバー1",
          "ラックNo.": "1",
          ユニット: "42～44",
          機種: "Model A",
          顧客名: "顧客A",
        },
      ];

      // モック実装の設定
      iconv.decode.mockReturnValue(mockCSVContent);
      csvParse.parse.mockReturnValue(mockParsedCSV);

      // 点検項目名マスタの検索結果
      InspectionItemName.findAll.mockResolvedValue([]);

      // 顧客と機器の検索結果
      const mockCustomer = { id: 201, customer_name: "顧客A" };
      const mockDevice = {
        id: 101,
        device_name: "サーバー1",
        customer_id: 201,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockItemName = { id: 301, name: "CPU状態確認" };

      // 既存の点検項目
      const mockExistingItem = {
        id: 1,
        device_id: 101,
        item_name_id: 301,
        item_name: "CPU状態確認",
        save: jest.fn().mockResolvedValue(true),
      };

      // モックの設定
      Customer.findOne.mockResolvedValueOnce(mockCustomer);
      Device.findOne.mockResolvedValueOnce(mockDevice);
      InspectionItemName.findOne.mockResolvedValueOnce(mockItemName);
      InspectionItem.findByPk.mockResolvedValueOnce(mockExistingItem);

      // リクエスト/レスポンスのモック
      const req = {
        file: mockFile,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // 関数を実行
      await importInspectionItemsFromCsv(req, res);

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith("1");
      expect(mockExistingItem.save).toHaveBeenCalled();

      // レスポンス
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            importedRows: 1,
            totalRows: 1,
          }),
        })
      );
    });

    it("存在しないIDを指定した場合はエラーを記録する", async () => {
      // モックデータの設定
      const mockFile = {
        buffer: Buffer.from("mockCSVContent"),
      };

      const mockCSVContent =
        "ID,点検項目,サーバ名,ラックNo.,ユニット,機種,顧客名\n999,CPU状態確認,サーバー1,1,42～44,Model A,顧客A";

      // CSVパースのモック実装
      const mockParsedCSV = [
        {
          ID: "999", // 存在しないID
          点検項目: "CPU状態確認",
          サーバ名: "サーバー1",
          "ラックNo.": "1",
          ユニット: "42～44",
          機種: "Model A",
          顧客名: "顧客A",
        },
      ];

      // モック実装の設定
      iconv.decode.mockReturnValue(mockCSVContent);
      csvParse.parse.mockReturnValue(mockParsedCSV);

      // 点検項目名マスタの検索結果
      InspectionItemName.findAll.mockResolvedValue([]);

      // 顧客と機器の検索結果
      const mockCustomer = { id: 201, customer_name: "顧客A" };
      const mockDevice = {
        id: 101,
        device_name: "サーバー1",
        customer_id: 201,
      };
      const mockItemName = { id: 301, name: "CPU状態確認" };

      // モックの設定
      Customer.findOne.mockResolvedValueOnce(mockCustomer);
      Device.findOne.mockResolvedValueOnce(mockDevice);
      InspectionItemName.findOne.mockResolvedValueOnce(mockItemName);
      InspectionItem.findByPk.mockResolvedValueOnce(null); // 存在しないID

      // リクエスト/レスポンスのモック
      const req = {
        file: mockFile,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // 関数を実行
      await importInspectionItemsFromCsv(req, res);

      // 検証
      expect(InspectionItem.findByPk).toHaveBeenCalledWith("999");

      // レスポンス - エラーが記録されたが処理は続行される
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            importedRows: 0,
            totalRows: 1,
            errors: expect.arrayContaining([
              expect.objectContaining({
                error: expect.stringContaining(
                  "指定されたID: 999の点検項目が存在しません"
                ),
              }),
            ]),
          }),
        })
      );
    });

    it("重複する点検項目はスキップされエラーが記録される", async () => {
      // モックデータの設定
      const mockFile = {
        buffer: Buffer.from("mockCSVContent"),
      };

      const mockCSVContent =
        "点検項目,サーバ名,ラックNo.,ユニット,機種,顧客名\nCPU状態確認,サーバー1,1,42～44,Model A,顧客A";

      // CSVパースのモック実装
      const mockParsedCSV = [
        {
          点検項目: "CPU状態確認",
          サーバ名: "サーバー1",
          "ラックNo.": "1",
          ユニット: "42～44",
          機種: "Model A",
          顧客名: "顧客A",
        },
      ];

      // モック実装の設定
      iconv.decode.mockReturnValue(mockCSVContent);
      csvParse.parse.mockReturnValue(mockParsedCSV);

      // 点検項目名マスタの検索結果
      InspectionItemName.findAll.mockResolvedValue([]);

      // 顧客と機器の検索結果
      const mockCustomer = { id: 201, customer_name: "顧客A" };
      const mockDevice = {
        id: 101,
        device_name: "サーバー1",
        customer_id: 201,
      };
      const mockItemName = { id: 301, name: "CPU状態確認" };

      // 既存の点検項目（重複）
      const mockExistingItem = {
        id: 1,
        device_id: 101,
        item_name_id: 301,
        item_name: "CPU状態確認",
      };

      // モックの設定
      Customer.findOne.mockResolvedValueOnce(mockCustomer);
      Device.findOne.mockResolvedValueOnce(mockDevice);
      InspectionItemName.findOne.mockResolvedValueOnce(mockItemName);
      InspectionItem.findOne.mockResolvedValueOnce(mockExistingItem); // 重複項目あり

      // リクエスト/レスポンスのモック
      const req = {
        file: mockFile,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // 関数を実行
      await importInspectionItemsFromCsv(req, res);

      // 検証
      expect(InspectionItem.findOne).toHaveBeenCalledWith({
        where: {
          device_id: 101,
          item_name_id: 301,
        },
      });

      // 重複のため新規作成されていない
      expect(InspectionItem.create).not.toHaveBeenCalled();

      // レスポンス
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            importedRows: 0,
            totalRows: 1,
            errors: expect.arrayContaining([
              expect.objectContaining({
                error: "同じ機器に対して同じ点検項目名がすでに存在します",
              }),
            ]),
          }),
        })
      );
    });

    it("CSVパース中にエラーが発生した場合はエラーを返す", async () => {
      // モックデータの設定
      const mockFile = {
        buffer: Buffer.from("mockCSVContent"),
      };

      // CSVパースでエラーが発生
      iconv.decode.mockReturnValue("Invalid CSV Content");
      csvParse.parse.mockImplementation(() => {
        throw new Error("CSVのパースに失敗しました");
      });

      // リクエスト/レスポンスのモック
      const req = {
        file: mockFile,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // エラーをキャッチするためのnext関数をセットアップ
      const next = jest.fn((error) => {
        expect(error.message).toContain(
          "CSVのインポート中にエラーが発生しました"
        );
      });

      // 関数を実行
      await importInspectionItemsFromCsv(req, res, next);

      // 検証
      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).toHaveBeenCalled();
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it("トランザクションが予期せぬエラーで中断した場合にロールバックする", async () => {
      // モックデータの設定
      const mockFile = {
        buffer: Buffer.from("mockCSVContent"),
      };

      const mockCSVContent =
        "点検項目,サーバ名,ラックNo.,ユニット,機種,顧客名\nCPU状態確認,サーバー1,1,42～44,Model A,顧客A";

      // CSVパースのモック実装
      const mockParsedCSV = [
        {
          点検項目: "CPU状態確認",
          サーバ名: "サーバー1",
          "ラックNo.": "1",
          ユニット: "42～44",
          機種: "Model A",
          顧客名: "顧客A",
        },
      ];

      // モック実装の設定
      iconv.decode.mockReturnValue(mockCSVContent);
      csvParse.parse.mockReturnValue(mockParsedCSV);

      // リクエスト/レスポンスのモック
      const req = {
        file: mockFile,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // エラーをキャッチするためのnext関数をセットアップ
      const next = jest.fn();

      // トランザクションをシミュレート
      const mockTransaction = {
        commit: jest.fn().mockRejectedValue(new Error("コミットエラー")),
        rollback: jest.fn().mockResolvedValue(true),
      };
      sequelize.transaction.mockReturnValueOnce(mockTransaction);

      // トランザクション内ループを正常に通過するためのモック設定
      // 顧客と機器の検索結果
      const mockCustomer = { id: 201, customer_name: "顧客A" };
      Customer.findOne.mockResolvedValue(mockCustomer);
      
      const mockDevice = { 
        id: 101, 
        device_name: "サーバー1", 
        customer_id: 201 
      };
      Device.findOne.mockResolvedValue(mockDevice);
      
      const mockItemName = { 
        id: 301, 
        name: "CPU状態確認" 
      };
      InspectionItemName.findOne.mockResolvedValue(mockItemName);
      
      InspectionItem.findOne.mockResolvedValue(null); // 重複なし
      
      // 正常に点検項目を作成
      const mockInspectionItem = {
        id: 1,
        device_id: 101,
        item_name_id: 301,
        item_name: "CPU状態確認",
      };
      InspectionItem.create.mockResolvedValue(mockInspectionItem);
      
      // ここでトランザクションのコミット時にエラーが発生する
      
      // 関数を実行
      await importInspectionItemsFromCsv(req, res, next);
      
      // コミットエラーに対してロールバックが呼ばれることを確認
      expect(mockTransaction.rollback).toHaveBeenCalled();
      // next関数にエラーが渡されることを確認
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
