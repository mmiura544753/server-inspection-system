// server/tests/unit/device/deviceImportTest.js
const httpMocks = require('node-mocks-http');
const { importDevicesFromCsv } = require('../../../controllers/device/deviceImportController');
const { Device, Customer } = require('../../../models');
const { sequelize } = require('../../../config/db');
const csvParse = require('csv-parse/sync');
const iconv = require('iconv-lite');

// モックの設定
jest.mock('../../../models', () => ({
  Device: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Customer: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  sequelize: require('../../../config/db').sequelize
}));

jest.mock('../../../config/db', () => {
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true)
  };
  
  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
      Sequelize: {
        Op: {
          eq: Symbol('eq'),
          ne: Symbol('ne'),
          in: Symbol('in')
        }
      }
    }
  };
});

jest.mock('csv-parse/sync', () => ({
  parse: jest.fn(),
}));

jest.mock('iconv-lite', () => ({
  decode: jest.fn(),
}));

describe('デバイスCSVインポートテスト', () => {
  let req, res, next;
  let mockTransaction;

  beforeEach(() => {
    // リクエスト、レスポンス、nextミドルウェアのモックをリセット
    req = {
      file: {
        buffer: Buffer.from('test csv content'),
        originalname: 'test.csv',
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    next = jest.fn();

    // トランザクションモックを直接設定
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true)
    };
    
    // トランザクション関数のモックを設定
    require('../../../config/db').sequelize.transaction.mockResolvedValue(mockTransaction);

    // すべてのモックをリセット
    jest.clearAllMocks();
    
    // iconv-liteモックの設定
    iconv.decode.mockReturnValue('decoded csv content');
  });

  describe('重複データを含むCSVのインポート', () => {
    it('重複データを含むCSVを適切に処理できる', async () => {
      // CSVパースの結果を設定
      const mockDevices = [
        {
          '機器名': 'テストサーバー1',
          '顧客名': 'テスト顧客1',
          'モデル': 'Model-X',
          '設置ラックNo': '5',
          'ユニット開始位置': '10',
          'ユニット終了位置': '12',
          '機器種別': 'サーバ',
          'ハードウェアタイプ': '物理',
        },
        {
          '機器名': '新規テスト機器',
          '顧客名': 'テスト顧客1',
          'モデル': 'New-Model',
          '設置ラックNo': '6',
          'ユニット開始位置': '15',
          'ユニット終了位置': '17',
          '機器種別': 'サーバ',
          'ハードウェアタイプ': '物理',
        },
      ];
      
      csvParse.parse.mockReturnValue(mockDevices);

      // Customer.findOneをモック
      Customer.findOne.mockImplementation(({ where }) => {
        if (where && where.customer_name === 'テスト顧客1') {
          return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
        }
        return Promise.resolve(null);
      });

      // Device.findOneをモック（重複チェック）
      Device.findOne.mockImplementation(({ where }) => {
        if (where && where.customer_id === 1 && where.device_name === 'テストサーバー1') {
          // 重複データをシミュレート
          return Promise.resolve({
            id: 1,
            device_name: 'テストサーバー1',
            customer_id: 1
          });
        }
        return Promise.resolve(null);
      });

      // Device.createをモック
      Device.create.mockImplementation((data) => {
        return Promise.resolve({
          id: 100,
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        });
      });

      // コントローラ関数を呼び出し
      await importDevicesFromCsv(req, res, next);

      // レスポンスの検証
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('1/2 件のデータをインポートしました'),
          data: expect.objectContaining({
            importedRows: 1,
            totalRows: 2,
            errors: expect.arrayContaining([
              expect.objectContaining({
                error: expect.stringContaining('同じ顧客で同じ機器名、設置場所、ユニット位置の組み合わせがすでに存在します'),
              }),
            ]),
          }),
        })
      );

      // Deviceの作成が新規機器に対してのみ呼ばれたことを確認
      expect(Device.create).toHaveBeenCalledTimes(1);
      expect(Device.create).toHaveBeenCalledWith(
        expect.objectContaining({
          device_name: '新規テスト機器'
        }),
        expect.anything()
      );

      // トランザクションの検証
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });
  });
});