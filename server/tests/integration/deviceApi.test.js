/**
 * デバイスAPIの統合テスト
 * 注意: 実際のDBに接続する代わりにモックを使用
 */
const request = require('supertest');
const express = require('express');

// モックデバイスのヘルパー関数
function mockDevice(overrides = {}) {
  const defaults = {
    id: 1,
    device_name: 'テストサーバー1',
    customer_id: 1,
    customer: { id: 1, customer_name: 'テスト顧客1' },
    model: 'Model-X',
    rack_number: 5,
    unit_start_position: 10,
    unit_end_position: 12,
    device_type: 'サーバ',
    hardware_type: '物理',
    created_at: new Date(),
    updated_at: new Date(),
    getUnitPositionDisplay: function() {
      if (this.unit_start_position === null) return "";
      if (this.unit_end_position === null || this.unit_start_position === this.unit_end_position) {
        return `U${this.unit_start_position}`;
      }
      return `U${this.unit_start_position}-U${this.unit_end_position}`;
    }
  };
  return { ...defaults, ...overrides };
}

// モジュールのモック化
jest.mock('../../models', () => {
  // モックデバイスのヘルパー関数をモック内部で再定義
  function mockDeviceInternal(overrides = {}) {
    const defaults = {
      id: 1,
      device_name: 'テストサーバー1',
      customer_id: 1,
      customer: { id: 1, customer_name: 'テスト顧客1' },
      model: 'Model-X',
      rack_number: 5,
      unit_start_position: 10,
      unit_end_position: 12,
      device_type: 'サーバ',
      hardware_type: '物理',
      created_at: new Date(),
      updated_at: new Date(),
      getUnitPositionDisplay: function() {
        if (this.unit_start_position === null) return "";
        if (this.unit_end_position === null || this.unit_start_position === this.unit_end_position) {
          return `U${this.unit_start_position}`;
        }
        return `U${this.unit_start_position}-U${this.unit_end_position}`;
      }
    };
    return { ...defaults, ...overrides };
  }

  // 保存メソッドを持つデバイスインスタンスを作成するヘルパー関数
  function createMockDeviceInternal(overrides = {}) {
    const device = mockDeviceInternal(overrides);
    
    // saveメソッドを追加
    device.save = jest.fn().mockImplementation(function() {
      // バリデーションチェック
      if (this.device_type && !['サーバ', 'UPS', 'ネットワーク機器', 'その他'].includes(this.device_type)) {
        const error = new Error('無効な機器種別です');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '無効な機器種別です' }];
        return Promise.reject(error);
      }
      
      if (this.hardware_type && !['物理', 'VM'].includes(this.hardware_type)) {
        const error = new Error('無効なハードウェアタイプです');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '無効なハードウェアタイプです' }];
        return Promise.reject(error);
      }
      
      // 更新成功
      this.updated_at = new Date();
      return Promise.resolve(this);
    });
    
    return device;
  }

  const CustomerMock = {
    findByPk: jest.fn().mockImplementation((id) => {
      if (id == 1) {
        return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
      }
      return Promise.resolve(null);
    }),
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where && where.customer_name === 'テスト顧客1') {
        return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
      }
      if (where && where.customer_name === 'テスト顧客2') {
        return Promise.resolve({ id: 2, customer_name: 'テスト顧客2' });
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((customerData) => {
      return Promise.resolve({
        id: 99,
        ...customerData,
        created_at: new Date(),
        updated_at: new Date()
      });
    })
  };
  
  const DeviceMock = {
    findAll: jest.fn().mockImplementation((options) => {
      if (options && options.where && options.where.customer_id === 1) {
        return Promise.resolve([mockDeviceInternal()]);
      }
      
      return Promise.resolve([
        mockDeviceInternal(),
        mockDeviceInternal({
          id: 2,
          device_name: 'テストサーバー2',
          customer_id: 2,
          customer: { id: 2, customer_name: 'テスト顧客2' },
          model: 'Model-Y',
          rack_number: 3,
          unit_start_position: 5,
          unit_end_position: 5
        })
      ]);
    }),
    
    findByPk: jest.fn().mockImplementation((id, options) => {
      if (id == 1) {
        if (options && options.include) {
          // 詳細表示用（顧客情報を含む）
          return Promise.resolve(createMockDeviceInternal());
        }
        return Promise.resolve(createMockDeviceInternal());
      }
      if (id == 2) {
        if (options && options.include) {
          return Promise.resolve(createMockDeviceInternal({
            id: 2,
            device_name: 'テストサーバー2',
            customer_id: 2,
            customer: { id: 2, customer_name: 'テスト顧客2' },
            model: 'Model-Y',
            rack_number: 3,
            unit_start_position: 5,
            unit_end_position: 5
          }));
        }
        return Promise.resolve(createMockDeviceInternal({
          id: 2,
          device_name: 'テストサーバー2',
          customer_id: 2,
          customer: { id: 2, customer_name: 'テスト顧客2' },
          model: 'Model-Y',
          rack_number: 3,
          unit_start_position: 5,
          unit_end_position: 5
        }));
      }
      return Promise.resolve(null);
    }),
    
    findOne: jest.fn().mockImplementation((options) => {
      // 重複チェック用
      if (options && options.where) {
        const { customer_id, device_name } = options.where;
        if (customer_id === 1 && device_name === 'テストサーバー1') {
          return Promise.resolve(mockDeviceInternal());
        }
        if (customer_id === 2 && device_name === 'テストサーバー2') {
          return Promise.resolve(mockDeviceInternal({
            id: 2,
            device_name: 'テストサーバー2',
            customer_id: 2
          }));
        }
      }
      return Promise.resolve(null);
    }),
    
    create: jest.fn().mockImplementation((deviceData) => {
      // 必須フィールドのバリデーション
      if (!deviceData.customer_id) {
        const error = new Error('顧客IDは必須です');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '顧客IDは必須です' }];
        return Promise.reject(error);
      }
      if (!deviceData.device_name) {
        const error = new Error('機器名は必須です');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '機器名は必須です' }];
        return Promise.reject(error);
      }
      if (!deviceData.device_type) {
        const error = new Error('機器種別は必須です');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '機器種別は必須です' }];
        return Promise.reject(error);
      }
      if (!deviceData.hardware_type) {
        const error = new Error('ハードウェアタイプは必須です');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: 'ハードウェアタイプは必須です' }];
        return Promise.reject(error);
      }
      
      // device_typeのバリデーション
      if (!['サーバ', 'UPS', 'ネットワーク機器', 'その他'].includes(deviceData.device_type)) {
        const error = new Error('無効な機器種別です');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '無効な機器種別です' }];
        return Promise.reject(error);
      }
      
      // hardware_typeのバリデーション
      if (!['物理', 'VM'].includes(deviceData.hardware_type)) {
        const error = new Error('無効なハードウェアタイプです');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '無効なハードウェアタイプです' }];
        return Promise.reject(error);
      }

      // 作成成功の場合
      return Promise.resolve({
        id: 3,
        ...deviceData,
        created_at: new Date(),
        updated_at: new Date()
      });
    }),
    
    belongsTo: jest.fn()
  };

  // トランザクションオブジェクト
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true)
  };
  
  return {
    Customer: CustomerMock,
    Device: DeviceMock,
    sequelize: {
      sync: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
      transaction: jest.fn().mockResolvedValue(mockTransaction)
    },
    Sequelize: {
      Op: {
        eq: Symbol('eq'),
        ne: Symbol('ne'),
        in: Symbol('in')
      }
    }
  };
});

// config/db.jsのモック - このモジュールがコントローラー内で直接参照されている
jest.mock('../../config/db', () => {
  // トランザクションオブジェクト
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true)
  };
  
  return {
    sequelize: {
      sync: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
      transaction: jest.fn().mockResolvedValue(mockTransaction)
    }
  };
});

// iconv-liteのモック化
jest.mock('iconv-lite', () => ({
  decode: jest.fn().mockImplementation((buffer, encoding) => {
    // バッファをUTF-8文字列として返す（テスト用には十分）
    return buffer.toString('utf8');
  })
}));

// csv-parse/syncのモック化
jest.mock('csv-parse/sync', () => ({
  parse: jest.fn().mockImplementation((csvContent, options) => {
    // 簡略化したCSVパース実装
    // ヘッダー行と残りの行を分ける
    const lines = csvContent.split('\n');
    if (lines.length <= 1) {
      return [];
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = index < values.length ? values[index] : '';
      });
      
      result.push(row);
    }
    
    return result;
  })
}));

// multerのアップロードをモック化
jest.mock('../../middleware/upload', () => {
  // より実用的なmulterモック
  const multerMock = () => ({
    single: jest.fn().mockImplementation(() => {
      return (req, res, next) => {
        // req.fileはテスト内でセットするのでここではセットしない
        next();
      };
    })
  });
  
  // モジュールとしての戻り値を設定
  multerMock.single = jest.fn().mockImplementation(() => {
    return (req, res, next) => {
      // req.fileはテスト内でセットするのでここではセットしない
      next();
    };
  });
  
  return multerMock;
});

const deviceRoutes = require('../../routes/deviceRoutes');
const { errorHandler, notFound } = require('../../middleware/errorHandler');

// モジュールのインポート
const customerRoutes = require('../../routes/customerRoutes');

// 統合テスト用にExpress appを作成
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/devices', deviceRoutes);
  app.use('/api/customers', customerRoutes);  // 顧客関連のルートも追加
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

// リクエスト用のテストアプリ
const app = createTestApp();

describe('デバイスAPI統合テスト', () => {
  beforeAll(() => {
    // モックの準備
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    // モックのリセット
    jest.restoreAllMocks();
  });
  
  describe('GET /api/devices', () => {
    describe('正常系: 機器データを取得して表示できること', () => {
      it('すべてのデバイスの一覧を取得できる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/devices')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('device_name');
        expect(response.body[0]).toHaveProperty('customer_name');
        expect(response.body[0]).toHaveProperty('device_type');
        expect(response.body[0]).toHaveProperty('hardware_type');
      });
    });

    describe('異常系: API呼び出しエラー時にエラーメッセージを表示できること', () => {
      it('API呼び出しエラー時に500エラーを返す', async () => {
        // findAllメソッドを一時的にエラーを返すようにオーバーライド
        const origFindAll = require('../../models').Device.findAll;
        require('../../models').Device.findAll = jest.fn().mockRejectedValue(new Error('DB接続エラー'));
        
        // テスト実行
        const response = await request(app)
          .get('/api/devices');
        
        // レスポンスの検証
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
        
        // モックを元に戻す
        require('../../models').Device.findAll = origFindAll;
      });
    });
  });
  
  describe('GET /api/devices/:id', () => {
    describe('正常系: 特定の機器IDの詳細データを取得して表示できること', () => {
      it('存在するデバイスIDで機器詳細を取得できる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/devices/1')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', 1);
        expect(response.body).toHaveProperty('device_name', 'テストサーバー1');
      });
    });
    
    describe('異常系: 存在しないIDによるエラー処理ができること', () => {
      it('存在しないデバイスIDで404エラーを返す', async () => {
        const response = await request(app)
          .get('/api/devices/999');
        
        // レスポンスの検証
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('見つかりません');
      });
    });
  });
  
  describe('GET /api/customers/:customerId/devices', () => {
    describe('正常系: 特定顧客IDに属する機器データを取得して表示できること', () => {
      it('存在する顧客IDで機器一覧を取得できる', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/customers/1/devices')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('customer_id', 1);
        expect(response.body[0]).toHaveProperty('device_name');
        expect(response.body[0]).toHaveProperty('customer_name');
        expect(response.body[0]).toHaveProperty('device_type');
        expect(response.body[0]).toHaveProperty('hardware_type');
        expect(response.body[0]).toHaveProperty('unit_position');
      });
    });

    describe('異常系: 顧客IDが無効な場合のエラー処理ができること', () => {
      it('存在しない顧客IDで404エラーを返す', async () => {
        // テスト実行
        const response = await request(app)
          .get('/api/customers/999/devices');
        
        // レスポンスの検証
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('顧客が見つかりません');
      });

      it('無効な形式の顧客IDでエラーハンドリングができる', async () => {
        // カスタマーモックを一時的にオーバーライド
        const origFindByPk = require('../../models').Customer.findByPk;
        require('../../models').Customer.findByPk = jest.fn().mockRejectedValue(new Error('無効なIDです'));
        
        // テスト実行
        const response = await request(app)
          .get('/api/customers/invalid/devices');
        
        // レスポンスの検証
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
        
        // モックを元に戻す
        require('../../models').Customer.findByPk = origFindByPk;
      });
    });
  });

  describe('POST /api/devices', () => {
    describe('正常系: 入力データを送信して新規機器を作成できること', () => {
      it('有効なデータで新規機器を作成できる', async () => {
        // テスト用の機器データ
        const newDeviceData = {
          customer_id: 1,
          device_name: 'テスト新規機器',
          model: 'テストモデル',
          rack_number: 10,
          unit_start_position: 15,
          unit_end_position: 16,
          device_type: 'サーバ',
          hardware_type: '物理'
        };

        // 作成後のデータモック設定
        const origFindByPk = require('../../models').Device.findByPk;
        require('../../models').Device.findByPk = jest.fn().mockImplementation((id, options) => {
          if (id === 3) {
            return Promise.resolve({
              ...newDeviceData,
              id: 3,
              created_at: new Date(),
              updated_at: new Date(),
              customer: { id: 1, customer_name: 'テスト顧客1' },
              getUnitPositionDisplay: function() {
                return 'U15-U16';
              }
            });
          }
          return origFindByPk(id, options);
        });

        // テスト実行
        const response = await request(app)
          .post('/api/devices')
          .send(newDeviceData)
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('device_name', 'テスト新規機器');
        expect(response.body).toHaveProperty('customer_name');
        expect(response.body).toHaveProperty('device_type', 'サーバ');
        expect(response.body).toHaveProperty('hardware_type', '物理');
        expect(response.body).toHaveProperty('unit_position');
        
        // モックを元に戻す
        require('../../models').Device.findByPk = origFindByPk;
      });
    });

    describe('異常系: バリデーションエラーが適切に表示されること', () => {
      it('必須フィールドが不足している場合にエラーを返す', async () => {
        // 必須フィールドが不足しているデータ
        const invalidData = {
          customer_id: 1,
          // device_nameが不足
          model: 'テストモデル',
          rack_number: 10,
          // device_typeが不足
          hardware_type: '物理'
        };

        // テスト実行
        const response = await request(app)
          .post('/api/devices')
          .send(invalidData);
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('必須フィールド');
      });

      it('無効な機器種別を指定するとエラーを返す', async () => {
        // 無効な機器種別を含むデータ
        const invalidData = {
          customer_id: 1,
          device_name: 'テスト機器',
          model: 'テストモデル',
          rack_number: 10,
          device_type: '無効な種別', // 無効な値
          hardware_type: '物理'
        };

        // テスト実行
        const response = await request(app)
          .post('/api/devices')
          .send(invalidData);
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('存在しない顧客IDを指定するとエラーを返す', async () => {
        // 存在しない顧客IDを含むデータ
        const invalidData = {
          customer_id: 999, // 存在しない顧客ID
          device_name: 'テスト機器',
          model: 'テストモデル',
          rack_number: 10,
          device_type: 'サーバ',
          hardware_type: '物理'
        };

        // テスト実行
        const response = await request(app)
          .post('/api/devices')
          .send(invalidData);
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('顧客が存在しません');
      });

      it('重複する機器データを登録するとエラーを返す', async () => {
        // 既存の機器と重複するデータ
        const duplicateData = {
          customer_id: 1,
          device_name: 'テストサーバー1', // 既存のデータと重複
          model: 'テストモデル',
          rack_number: 5,
          unit_start_position: 10,
          unit_end_position: 12,
          device_type: 'サーバ',
          hardware_type: '物理'
        };

        // テスト実行
        const response = await request(app)
          .post('/api/devices')
          .send(duplicateData);
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('同じ顧客で同じ機器名');
      });
    });
  });

  describe('PUT /api/devices/:id', () => {
    describe('正常系: 既存機器データを更新できること', () => {
      it('有効なデータで機器情報を更新できる', async () => {
        // テスト用の更新データ
        const updateData = {
          device_name: '更新後の機器名',
          model: '更新後のモデル',
          rack_number: 15,
          unit_start_position: 20,
          unit_end_position: 22,
          device_type: 'UPS', // 変更
          hardware_type: '物理'
        };

        // モックのfindByPkをオーバーライド
        const origFindByPk = require('../../models').Device.findByPk;
        require('../../models').Device.findByPk = jest.fn().mockImplementation((id, options) => {
          if (id == 1) {
            // includeオプションがある場合（2回目の呼び出し）は更新後のデータを返す
            if (options && options.include) {
              return Promise.resolve({
                id: 1,
                ...updateData,
                customer_id: 1,
                customer: { id: 1, customer_name: 'テスト顧客1' },
                created_at: new Date(),
                updated_at: new Date(),
                getUnitPositionDisplay: function() {
                  return 'U20-U22';
                }
              });
            }
            // 1回目の呼び出しでは、更新可能なデバイスを返す
            const device = {
              id: 1,
              device_name: 'テストサーバー1',
              customer_id: 1,
              customer: { id: 1, customer_name: 'テスト顧客1' },
              model: 'Model-X',
              rack_number: 5,
              unit_start_position: 10,
              unit_end_position: 12,
              device_type: 'サーバ',
              hardware_type: '物理',
              created_at: new Date(),
              updated_at: new Date(),
              getUnitPositionDisplay: function() {
                return 'U10-U12';
              },
              save: jest.fn().mockResolvedValue({})
            };
            return Promise.resolve(device);
          }
          return Promise.resolve(null);
        });

        // テスト実行
        const response = await request(app)
          .put('/api/devices/1')
          .send(updateData)
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', 1);
        expect(response.body).toHaveProperty('device_name', '更新後の機器名');
        expect(response.body).toHaveProperty('model', '更新後のモデル');
        expect(response.body).toHaveProperty('device_type', 'UPS');
        expect(response.body).toHaveProperty('hardware_type', '物理');
        expect(response.body).toHaveProperty('rack_number', 15);
        expect(response.body).toHaveProperty('unit_position');
        
        // モックを元に戻す
        require('../../models').Device.findByPk = origFindByPk;
      });

      it('顧客IDを変更できる', async () => {
        // テスト用の更新データ（顧客ID変更）
        const updateData = {
          customer_id: 2, // 別の顧客IDに変更
          device_name: 'テストサーバー1'
        };

        // モックの設定
        const origDeviceFindByPk = require('../../models').Device.findByPk;
        const origCustomerFindByPk = require('../../models').Customer.findByPk;

        // Customerモックを設定（顧客ID 2が存在するようにする）
        require('../../models').Customer.findByPk = jest.fn().mockImplementation((id) => {
          if (id == 1) {
            return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
          }
          if (id == 2) {
            return Promise.resolve({ id: 2, customer_name: 'テスト顧客2' });
          }
          return Promise.resolve(null);
        });

        // Deviceモックを設定
        require('../../models').Device.findByPk = jest.fn().mockImplementation((id, options) => {
          if (id == 1) {
            // includeオプションがある場合（2回目の呼び出し）は更新後のデータを返す
            if (options && options.include) {
              return Promise.resolve({
                id: 1,
                device_name: 'テストサーバー1',
                customer_id: 2,
                customer: { id: 2, customer_name: 'テスト顧客2' },
                model: 'Model-X',
                rack_number: 5,
                unit_start_position: 10,
                unit_end_position: 12,
                device_type: 'サーバ',
                hardware_type: '物理',
                created_at: new Date(),
                updated_at: new Date(),
                getUnitPositionDisplay: function() {
                  return 'U10-U12';
                }
              });
            }
            // 1回目の呼び出しでは、更新可能なデバイスを返す
            const device = {
              id: 1,
              device_name: 'テストサーバー1',
              customer_id: 1,
              customer: { id: 1, customer_name: 'テスト顧客1' },
              model: 'Model-X',
              rack_number: 5,
              unit_start_position: 10,
              unit_end_position: 12,
              device_type: 'サーバ',
              hardware_type: '物理',
              created_at: new Date(),
              updated_at: new Date(),
              getUnitPositionDisplay: function() {
                return 'U10-U12';
              },
              save: jest.fn().mockResolvedValue({})
            };
            return Promise.resolve(device);
          }
          return Promise.resolve(null);
        });

        // テスト実行
        const response = await request(app)
          .put('/api/devices/1')
          .send(updateData)
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', 1);
        expect(response.body).toHaveProperty('customer_id', 2);
        expect(response.body).toHaveProperty('customer_name', 'テスト顧客2');
        
        // モックを元に戻す
        require('../../models').Device.findByPk = origDeviceFindByPk;
        require('../../models').Customer.findByPk = origCustomerFindByPk;
      });
    });

    describe('異常系: 不正なデータによる更新エラーが処理できること', () => {
      it('存在しない機器IDを指定するとエラーを返す', async () => {
        // テスト用の更新データ
        const updateData = {
          device_name: '更新後の機器名'
        };

        // テスト実行
        const response = await request(app)
          .put('/api/devices/999') // 存在しないID
          .send(updateData);
        
        // レスポンスの検証
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('見つかりません');
      });

      it('無効な機器種別を指定するとエラーを返す', async () => {
        // テスト用の無効な更新データ
        const invalidData = {
          device_type: '無効な種別' // 無効な値
        };

        // モックのfindByPkをオーバーライド
        const origFindByPk = require('../../models').Device.findByPk;
        require('../../models').Device.findByPk = jest.fn().mockImplementation((id) => {
          if (id == 1) {
            const device = {
              id: 1,
              device_name: 'テストサーバー1',
              customer_id: 1,
              customer: { id: 1, customer_name: 'テスト顧客1' },
              model: 'Model-X',
              rack_number: 5,
              unit_start_position: 10,
              unit_end_position: 12,
              device_type: 'サーバ',
              hardware_type: '物理',
              created_at: new Date(),
              updated_at: new Date(),
              getUnitPositionDisplay: function() {
                return 'U10-U12';
              },
              save: jest.fn().mockImplementation(() => {
                const error = new Error('無効な機器種別です');
                error.name = 'SequelizeValidationError';
                error.errors = [{ message: '無効な機器種別です' }];
                return Promise.reject(error);
              })
            };
            return Promise.resolve(device);
          }
          return Promise.resolve(null);
        });

        // テスト実行
        const response = await request(app)
          .put('/api/devices/1')
          .send(invalidData);
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('無効な機器種別です');
        
        // モックを元に戻す
        require('../../models').Device.findByPk = origFindByPk;
      });

      it('存在しない顧客IDを指定するとエラーを返す', async () => {
        // テスト用の無効な更新データ
        const invalidData = {
          customer_id: 999 // 存在しない顧客ID
        };

        // テスト実行
        const response = await request(app)
          .put('/api/devices/1')
          .send(invalidData);
        
        // レスポンスの検証
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('顧客が存在しません');
      });
    });
  });

  describe('DELETE /api/devices/:id', () => {
    describe('正常系: 機器データを削除できること', () => {
      it('存在する機器IDで削除処理が成功する', async () => {
        // モックのfindByPkをオーバーライド
        const origFindByPk = require('../../models').Device.findByPk;
        require('../../models').Device.findByPk = jest.fn().mockImplementation((id) => {
          if (id == 1) {
            return Promise.resolve({
              id: 1,
              device_name: 'テストサーバー1',
              customer_id: 1,
              destroy: jest.fn().mockResolvedValue(true) // destroy メソッドを追加
            });
          }
          return Promise.resolve(null);
        });

        // テスト実行
        const response = await request(app)
          .delete('/api/devices/1')
          .expect('Content-Type', /json/);
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('削除しました');
        
        // モックを元に戻す
        require('../../models').Device.findByPk = origFindByPk;
      });
    });

    describe('異常系: 削除失敗時のエラー処理ができること', () => {
      it('存在しない機器IDを指定するとエラーを返す', async () => {
        // テスト実行
        const response = await request(app)
          .delete('/api/devices/999'); // 存在しないID
        
        // レスポンスの検証
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('見つかりません');
      });

      it('データベースエラー発生時にエラー処理ができる', async () => {
        // モックのfindByPkをオーバーライド
        const origFindByPk = require('../../models').Device.findByPk;
        require('../../models').Device.findByPk = jest.fn().mockImplementation((id) => {
          if (id == 1) {
            return Promise.resolve({
              id: 1,
              device_name: 'テストサーバー1',
              customer_id: 1,
              // destroyメソッドがエラーを投げるようにモック
              destroy: jest.fn().mockRejectedValue(new Error('データベース接続エラー'))
            });
          }
          return Promise.resolve(null);
        });

        // テスト実行
        const response = await request(app)
          .delete('/api/devices/1');
        
        // レスポンスの検証
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
        
        // モックを元に戻す
        require('../../models').Device.findByPk = origFindByPk;
      });

      // 削除に関連してエラーが発生するケース（参照整合性制約違反など）
      it('参照整合性制約違反時にエラーを適切に処理できる', async () => {
        // モックのfindByPkをオーバーライド
        const origFindByPk = require('../../models').Device.findByPk;
        require('../../models').Device.findByPk = jest.fn().mockImplementation((id) => {
          if (id == 1) {
            return Promise.resolve({
              id: 1,
              device_name: 'テストサーバー1',
              customer_id: 1,
              // 外部キー制約違反エラーをシミュレート
              destroy: jest.fn().mockImplementation(() => {
                const error = new Error('関連する点検データが存在するため削除できません');
                error.name = 'SequelizeForeignKeyConstraintError';
                return Promise.reject(error);
              })
            });
          }
          return Promise.resolve(null);
        });

        // テスト実行
        const response = await request(app)
          .delete('/api/devices/1');
        
        // レスポンスの検証
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
        
        // モックを元に戻す
        require('../../models').Device.findByPk = origFindByPk;
      });
    });
  });

  describe('GET /api/devices/export', () => {
    describe('正常系: 機器データをCSV形式でエクスポートできること', () => {
      it('デフォルトエンコーディング(shift_jis)でCSVをエクスポートできる', async () => {
        // モックのfindAllをオーバーライド
        const origFindAll = require('../../models').Device.findAll;
        require('../../models').Device.findAll = jest.fn().mockResolvedValue([
          {
            id: 1,
            device_name: 'テストサーバー1',
            customer_id: 1,
            customer: { id: 1, customer_name: 'テスト顧客1' },
            model: 'Model-X',
            rack_number: 5,
            unit_start_position: 10,
            unit_end_position: 12,
            device_type: 'サーバ',
            hardware_type: '物理'
          },
          {
            id: 2,
            device_name: 'テストサーバー2',
            customer_id: 2,
            customer: { id: 2, customer_name: 'テスト顧客2' },
            model: 'Model-Y',
            rack_number: 3,
            unit_start_position: 5,
            unit_end_position: 5,
            device_type: 'サーバ',
            hardware_type: 'VM'
          }
        ]);

        // console.logをモック
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // テスト実行
        const response = await request(app)
          .get('/api/devices/export');
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/csv');
        expect(response.headers['content-disposition']).toContain('attachment; filename=devices_export_');
        expect(response.headers['content-disposition']).toContain('.csv');
        
        // レスポンスボディが存在することを確認（型チェックではなく内容の有無を確認）
        expect(response.body).toBeTruthy();
        
        // モックを元に戻す
        require('../../models').Device.findAll = origFindAll;
        consoleSpy.mockRestore();
      });

      it('UTF-8エンコーディングでCSVをエクスポートできる', async () => {
        // モックのfindAllをオーバーライド
        const origFindAll = require('../../models').Device.findAll;
        require('../../models').Device.findAll = jest.fn().mockResolvedValue([
          {
            id: 1,
            device_name: 'テストサーバー1',
            customer_id: 1,
            customer: { id: 1, customer_name: 'テスト顧客1' },
            model: 'Model-X',
            rack_number: 5,
            unit_start_position: 10,
            unit_end_position: 12,
            device_type: 'サーバ',
            hardware_type: '物理'
          }
        ]);

        // console.logをモック
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // テスト実行 - UTF-8エンコーディングを指定
        const response = await request(app)
          .get('/api/devices/export?encoding=utf-8');
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/csv; charset=utf-8');
        expect(response.headers['content-disposition']).toContain('attachment; filename=devices_export_');
        
        // モックを元に戻す
        require('../../models').Device.findAll = origFindAll;
        consoleSpy.mockRestore();
      });

      it('CSVファイルに必要なヘッダーとデータが含まれていること', async () => {
        // テスト用のデバイスデータ
        const testDevices = [
          {
            id: 1,
            device_name: 'テストサーバー1',
            customer_id: 1,
            customer: { id: 1, customer_name: 'テスト顧客1' },
            model: 'Model-X',
            rack_number: 5,
            unit_start_position: 10,
            unit_end_position: 12,
            device_type: 'サーバ',
            hardware_type: '物理'
          }
        ];

        // モックのfindAllをオーバーライド
        const origFindAll = require('../../models').Device.findAll;
        require('../../models').Device.findAll = jest.fn().mockResolvedValue(testDevices);

        // console.logをモック
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // テスト実行 - UTF-8エンコーディングを指定してデコードしやすくする
        const response = await request(app)
          .get('/api/devices/export?encoding=utf-8');
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        
        // CSVの内容を確認（UTF-8の場合は文字列として取得可能）
        const csvContent = response.text;
        
        // ヘッダー行が存在するか確認（CSV形式に合わせて二重引用符を含む）
        expect(csvContent).toContain('"ID","機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"');
        
        // データ行が含まれているか確認（CSV形式に合わせて文字列フィールドは二重引用符で囲まれる）
        expect(csvContent).toContain('1,"テストサーバー1","テスト顧客1","Model-X",5,10,12,"サーバ","物理"');
        
        // モックを元に戻す
        require('../../models').Device.findAll = origFindAll;
        consoleSpy.mockRestore();
      });
    });

    describe('異常系: エクスポート失敗時のエラー処理ができること', () => {
      it('データベースエラー発生時に適切なエラーレスポンスを返す', async () => {
        // モックのfindAllをエラーを返すように設定
        const origFindAll = require('../../models').Device.findAll;
        require('../../models').Device.findAll = jest.fn().mockRejectedValue(
          new Error('データベース接続エラー')
        );

        // console.logをモック
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // テスト実行
        const response = await request(app)
          .get('/api/devices/export');
        
        // レスポンスの検証
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
        
        // モックを元に戻す
        require('../../models').Device.findAll = origFindAll;
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      });

      it('無効なエンコーディングパラメータでも処理ができる', async () => {
        // モックのfindAllをオーバーライド
        const origFindAll = require('../../models').Device.findAll;
        require('../../models').Device.findAll = jest.fn().mockResolvedValue([
          {
            id: 1,
            device_name: 'テストサーバー1',
            customer_id: 1,
            customer: { id: 1, customer_name: 'テスト顧客1' },
            model: 'Model-X',
            rack_number: 5,
            unit_start_position: 10,
            unit_end_position: 12,
            device_type: 'サーバ',
            hardware_type: '物理'
          }
        ]);

        // console.logをモック
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // テスト実行 - 無効なエンコーディングを指定
        const response = await request(app)
          .get('/api/devices/export?encoding=invalid_encoding');
        
        // レスポンスの検証 - UTF-8で返ってくるはず（無効なエンコーディングはコントローラ内で処理）
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/csv; charset=utf-8');
        
        // モックを元に戻す
        require('../../models').Device.findAll = origFindAll;
        consoleSpy.mockRestore();
      });

      it('データが空の場合でも正常にCSVをエクスポートできる', async () => {
        // モックのfindAllを空の配列を返すように設定
        const origFindAll = require('../../models').Device.findAll;
        require('../../models').Device.findAll = jest.fn().mockResolvedValue([]);

        // console.logをモック
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // テスト実行
        const response = await request(app)
          .get('/api/devices/export?encoding=utf-8');
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/csv');
        
        // CSVの内容を確認 - ヘッダー行のみが含まれているはず
        const csvContent = response.text;
        expect(csvContent).toContain('"ID","機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"');
        
        // モックを元に戻す
        require('../../models').Device.findAll = origFindAll;
        consoleSpy.mockRestore();
      });
    });
  });

  describe('POST /api/devices/import', () => {
    describe('正常系: CSVファイルから機器データをインポートできること', () => {
      it('有効なCSVファイルをインポートできる', async () => {
        // テスト用のCSV内容
        const validCsvContent = 
          '"機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"\n' +
          '"インポートテスト機器1","テスト顧客1","TestModel-1","7","20","22","サーバ","物理"\n' +
          '"インポートテスト機器2","テスト顧客2","TestModel-2","8","25","27","ネットワーク機器","物理"';

        // コントローラーと依存関係を直接インポート
        const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
        const { Customer, Device } = require('../../models');
        
        // HTTPリクエスト/レスポンスのモック
        const req = {
          file: {
            originalname: 'test_import.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(validCsvContent),
            size: validCsvContent.length
          }
        };
        
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        const next = jest.fn();

        // デバイス作成をモック
        let createdDevices = [];
        const mockCreate = jest.fn().mockImplementation((deviceData, transaction) => {
          const newDevice = {
            id: 100 + createdDevices.length,
            ...deviceData,
            created_at: new Date(),
            updated_at: new Date()
          };
          createdDevices.push(newDevice);
          return Promise.resolve(newDevice);
        });

        // 必要なモックを設定
        jest.spyOn(Customer, 'findOne').mockImplementation(({ where }) => {
          if (where && where.customer_name === 'テスト顧客1') {
            return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
          }
          if (where && where.customer_name === 'テスト顧客2') {
            return Promise.resolve({ id: 2, customer_name: 'テスト顧客2' });
          }
          return Promise.resolve(null);
        });

        jest.spyOn(Device, 'findOne').mockImplementation(({ where }) => {
          return Promise.resolve(null); // 重複なしの場合
        });

        jest.spyOn(Device, 'create').mockImplementation(mockCreate);

        // コントローラを直接呼び出す
        await importDevicesFromCsv(req, res, next);

        // レスポンスの検証
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
        
        const responseData = res.json.mock.calls[0][0];
        expect(responseData).toHaveProperty('message');
        expect(responseData).toHaveProperty('data');
        expect(responseData.data).toHaveProperty('importedRows', 2);
        expect(responseData.data).toHaveProperty('totalRows', 2);
        expect(responseData.data).toHaveProperty('importedDevices');
        expect(responseData.data.importedDevices).toHaveLength(2);
        expect(responseData.data.importedDevices[0]).toHaveProperty('created', true);
        expect(responseData.data.importedDevices[0]).toHaveProperty('customer_name', 'テスト顧客1');
        expect(responseData.data.importedDevices[1]).toHaveProperty('created', true);
        expect(responseData.data.importedDevices[1]).toHaveProperty('customer_name', 'テスト顧客2');
        
        // Device.createが2回呼ばれたことを確認
        expect(mockCreate).toHaveBeenCalledTimes(2);
        
        // 1つ目のデバイス作成の引数を検証
        expect(mockCreate.mock.calls[0][0]).toMatchObject({
          device_name: 'インポートテスト機器1',
          customer_id: 1,
          model: 'TestModel-1',
          rack_number: 7,
          unit_start_position: 20,
          unit_end_position: 22,
          device_type: 'サーバ',
          hardware_type: '物理'
        });
        
        // 2つ目のデバイス作成の引数を検証
        expect(mockCreate.mock.calls[1][0]).toMatchObject({
          device_name: 'インポートテスト機器2',
          customer_id: 2,
          model: 'TestModel-2',
          rack_number: 8,
          unit_start_position: 25,
          unit_end_position: 27,
          device_type: 'ネットワーク機器',
          hardware_type: '物理'
        });
      });

      it('既存の機器データを更新できる', async () => {
        // テスト用のCSV内容 (IDを含める)
        const validCsvContent = 
          '"ID","機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"\n' +
          '"1","更新テスト機器","テスト顧客1","更新モデル","9","30","32","UPS","物理"';

        // コントローラーと依存関係を直接インポート
        const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
        const { Customer, Device } = require('../../models');
        
        // HTTPリクエスト/レスポンスのモック
        const req = {
          file: {
            originalname: 'test_update.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(validCsvContent),
            size: validCsvContent.length
          }
        };
        
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        const next = jest.fn();

        // テスト用のモックデバイス (プロパティの変更を追跡するため)
        const mockDevice = {
          id: 1,
          device_name: 'テストサーバー1',
          customer_id: 1,
          model: 'Model-X',
          rack_number: 5,
          unit_start_position: 10,
          unit_end_position: 12,
          device_type: 'サーバ',
          hardware_type: '物理',
          save: jest.fn().mockImplementation(function() {
            // saveが呼ばれたときに、現在のオブジェクトの状態をそのまま返す
            return Promise.resolve(this);
          })
        };

        // 必要なモックを設定
        jest.spyOn(Customer, 'findOne').mockImplementation(({ where }) => {
          if (where && where.customer_name === 'テスト顧客1') {
            return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
          }
          return Promise.resolve(null);
        });

        jest.spyOn(Device, 'findByPk').mockImplementation((id) => {
          if (id === 1) {
            return Promise.resolve(mockDevice);
          }
          return Promise.resolve(null);
        });

        // コントローラを直接呼び出す
        await importDevicesFromCsv(req, res, next);

        // レスポンスの検証
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
        
        const responseData = res.json.mock.calls[0][0];
        expect(responseData).toHaveProperty('message');
        expect(responseData).toHaveProperty('data');
        expect(responseData.data).toHaveProperty('importedRows', 1);
        expect(responseData.data).toHaveProperty('totalRows', 1);
        expect(responseData.data).toHaveProperty('importedDevices');
        expect(responseData.data.importedDevices).toHaveLength(1);
        expect(responseData.data.importedDevices[0]).toHaveProperty('updated', true);
        expect(responseData.data.importedDevices[0]).toHaveProperty('customer_name', 'テスト顧客1');
        expect(responseData.data.importedDevices[0]).toHaveProperty('id', 1);
        
        // saveメソッドが呼ばれたことを確認
        expect(mockDevice.save).toHaveBeenCalledTimes(1);
        
        // モックデバイスのプロパティが正しく更新されたことを検証
        expect(mockDevice.device_name).toBe('更新テスト機器');
        expect(mockDevice.model).toBe('更新モデル');
        expect(mockDevice.rack_number).toBe(9);
        expect(mockDevice.unit_start_position).toBe(30);
        expect(mockDevice.unit_end_position).toBe(32);
        expect(mockDevice.device_type).toBe('UPS');
        expect(mockDevice.hardware_type).toBe('物理');
      });

      it('インポート時に存在しない顧客が指定された場合は新規顧客を作成できる', async () => {
        // テスト用のCSV内容
        const validCsvContent = 
          '"機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"\n' +
          '"新規テスト機器","新規顧客","TestModel-New","10","35","37","サーバ","物理"';

        // コントローラーと依存関係を直接インポート
        const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
        const { Customer, Device } = require('../../models');
        
        // HTTPリクエスト/レスポンスのモック
        const req = {
          file: {
            originalname: 'test_new_customer.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(validCsvContent),
            size: validCsvContent.length
          }
        };
        
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        const next = jest.fn();

        // 顧客作成のモック
        const mockCreateCustomer = jest.fn().mockImplementation((customerData, transaction) => {
          return Promise.resolve({
            id: 100,
            customer_name: customerData.customer_name,
            created_at: new Date(),
            updated_at: new Date()
          });
        });

        // デバイス作成のモック
        const mockCreateDevice = jest.fn().mockImplementation((deviceData, transaction) => {
          return Promise.resolve({
            id: 500,
            ...deviceData,
            created_at: new Date(),
            updated_at: new Date()
          });
        });

        // 顧客検索のモック - 新規顧客は存在しないと返す
        jest.spyOn(Customer, 'findOne').mockImplementation(({ where }) => {
          if (where && where.customer_name === '新規顧客') {
            return Promise.resolve(null); // 顧客が存在しない
          }
          return Promise.resolve(null);
        });
        
        // 顧客作成のモック
        jest.spyOn(Customer, 'create').mockImplementation(mockCreateCustomer);
        
        // 重複デバイスチェックのモック
        jest.spyOn(Device, 'findOne').mockImplementation(({ where }) => {
          return Promise.resolve(null); // 重複なし
        });
        
        // デバイス作成のモック
        jest.spyOn(Device, 'create').mockImplementation(mockCreateDevice);

        // コントローラを直接呼び出す
        await importDevicesFromCsv(req, res, next);

        // レスポンスの検証
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
        
        const responseData = res.json.mock.calls[0][0];
        expect(responseData).toHaveProperty('message');
        expect(responseData).toHaveProperty('data');
        expect(responseData.data).toHaveProperty('importedRows', 1);
        expect(responseData.data).toHaveProperty('totalRows', 1);
        expect(responseData.data).toHaveProperty('importedDevices');
        expect(responseData.data.importedDevices).toHaveLength(1);
        expect(responseData.data.importedDevices[0]).toHaveProperty('created', true);
        expect(responseData.data.importedDevices[0]).toHaveProperty('customer_name', '新規顧客');
        
        // 新規顧客が作成されたことを確認
        expect(mockCreateCustomer).toHaveBeenCalledTimes(1);
        expect(mockCreateCustomer.mock.calls[0][0]).toMatchObject({
          customer_name: '新規顧客'
        });
        
        // デバイスが作成されたことを確認
        expect(mockCreateDevice).toHaveBeenCalledTimes(1);
        expect(mockCreateDevice.mock.calls[0][0]).toMatchObject({
          customer_id: 100, // 新規作成された顧客ID
          device_name: '新規テスト機器',
          model: 'TestModel-New',
          rack_number: 10,
          unit_start_position: 35,
          unit_end_position: 37,
          device_type: 'サーバ',
          hardware_type: '物理'
        });
      });
    });

    describe('異常系: インポート処理の異常系のエラー処理ができること', () => {
      it('ファイルがアップロードされていない場合にエラーを返す', async () => {
        // コントローラーを直接インポート
        const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
        
        // HTTPリクエスト/レスポンスのモック
        const req = {
          file: null // ファイルなし
        };
        
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        const next = jest.fn();

        // コントローラを直接呼び出す
        await importDevicesFromCsv(req, res, next);

        // エラーレスポンスの検証
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toContain('CSVファイルが提供されていません');
      });

      it('無効なCSV形式でエラーを返す', async () => {
        // 無効なCSV内容のモック作成
        const invalidCsvContent = 
          'これは無効なCSVです、カンマが含まれていません\n' +
          '二行目もただのテキスト';

        // コントローラーを直接インポート
        const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');

        // HTTPリクエスト/レスポンスのモック
        const req = {
          file: {
            originalname: 'invalid.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(invalidCsvContent),
            size: invalidCsvContent.length
          }
        };
        
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        const next = jest.fn();

        // csvparse モックをエラーを返すようにオーバーライド
        const csvParse = require('csv-parse/sync');
        csvParse.parse.mockImplementationOnce(() => {
          throw new Error('CSV解析エラー');
        });

        // コントローラを直接呼び出す
        await importDevicesFromCsv(req, res, next);

        // エラーレスポンスの検証
        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(next.mock.calls[0][0].message).toContain('CSVのインポート中にエラー');
      });

      it('Shift-JISエンコーディングでのCSVインポートが正常に処理される', async () => {
        // Shift-JIS形式を模したCSV内容のモック (実際には UTF-8だがモックでShift-JISと見なす)
        const shiftJisContent = 
          '"機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"\n' +
          '"日本語名機器","日本語顧客","日本語モデル","10","40","42","サーバ","物理"';
        
        // コントローラーと依存関係を直接インポート
        const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
        const { Customer, Device } = require('../../models');
        
        // HTTPリクエスト/レスポンスのモック
        const req = {
          file: {
            originalname: 'shift_jis_test.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(shiftJisContent),
            size: shiftJisContent.length
          }
        };
        
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        const next = jest.fn();

        // iconv-liteのデコードをモック
        const iconv = require('iconv-lite');
        const originalDecode = iconv.decode;
        iconv.decode = jest.fn().mockImplementation((buffer, encoding) => {
          expect(encoding).toBe('Shift_JIS'); // Shift-JISでのデコードが試みられることを確認
          return shiftJisContent; // UTF-8のままを返す (テスト用)
        });

        // CSVパースモック
        const csvParse = require('csv-parse/sync');
        csvParse.parse.mockImplementationOnce((content, options) => {
          return [
            {
              '機器名': '日本語名機器',
              '顧客名': '日本語顧客',
              'モデル': '日本語モデル',
              '設置ラックNo': '10',
              'ユニット開始位置': '40',
              'ユニット終了位置': '42',
              '機器種別': 'サーバ',
              'ハードウェアタイプ': '物理'
            }
          ];
        });
        
        // 顧客検索のモック - 新規顧客用
        jest.spyOn(Customer, 'findOne').mockImplementation(({ where }) => {
          if (where && where.customer_name === '日本語顧客') {
            return Promise.resolve({ id: 10, customer_name: '日本語顧客' });
          }
          return Promise.resolve(null);
        });
        
        // デバイス重複チェックのモック
        jest.spyOn(Device, 'findOne').mockImplementation(({ where }) => {
          return Promise.resolve(null); // 重複なし
        });
        
        // デバイス作成のモック
        const mockCreate = jest.fn().mockImplementation((deviceData, options) => {
          return Promise.resolve({
            id: 200,
            ...deviceData,
            created_at: new Date(),
            updated_at: new Date()
          });
        });
        
        jest.spyOn(Device, 'create').mockImplementation(mockCreate);

        // コントローラを直接呼び出す
        await importDevicesFromCsv(req, res, next);

        // レスポンスの検証
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
        
        const responseData = res.json.mock.calls[0][0];
        expect(responseData).toHaveProperty('message');
        expect(responseData).toHaveProperty('data');
        expect(responseData.data).toHaveProperty('importedRows', 1);
        expect(responseData.data).toHaveProperty('totalRows', 1);
        expect(responseData.data).toHaveProperty('importedDevices');
        expect(responseData.data.importedDevices).toHaveLength(1);
        expect(responseData.data.importedDevices[0]).toHaveProperty('device_name', '日本語名機器');
        expect(responseData.data.importedDevices[0]).toHaveProperty('customer_name', '日本語顧客');
        
        // デバイス作成が呼ばれたことを確認
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockCreate.mock.calls[0][0]).toMatchObject({
          customer_id: 10,
          device_name: '日本語名機器',
          model: '日本語モデル',
          rack_number: 10,
          unit_start_position: 40,
          unit_end_position: 42,
          device_type: 'サーバ',
          hardware_type: '物理'
        });
        
        // iconv-liteが正しく呼ばれたことを確認
        expect(iconv.decode).toHaveBeenCalledTimes(1);
        
        // モックを元に戻す
        iconv.decode = originalDecode;
      });

      it('必須フィールドが不足しているCSVでエラーハンドリングができる', async () => {
        // 必須フィールド不足のCSV内容のモック作成
        const invalidCsvContent = 
          '"機器名","顧客名"\n' +
          '"インポートテスト機器1",""'; // 顧客名が空
          
        // リクエストによるアップロードをシミュレート
        const app = express();
        app.use(express.json());
        app.post('/test-missing-fields', (req, res, next) => {
          // ファイルをマニュアルでセット
          req.file = {
            originalname: 'missing_fields.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(invalidCsvContent),
            size: invalidCsvContent.length
          };
          req.app = app;

          // インポートコントローラを直接呼び出す
          const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
          importDevicesFromCsv(req, res, next);
        });
        
        app.use(errorHandler);

        // テスト実行
        const response = await request(app).post('/test-missing-fields');
        
        // レスポンスの検証 - 必須フィールドのエラーが処理されるはず
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('errors');
        expect(response.body.data.errors.length).toBeGreaterThan(0);
      });

      it('存在しないIDを指定した場合にエラーを報告する', async () => {
        // 存在しないIDを含むCSV内容のモック作成
        const csvContent = 
          '"ID","機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"\n' +
          '"999","更新テスト機器","テスト顧客1","更新モデル","9","30","32","サーバ","物理"';
          
        // リクエストによるアップロードをシミュレート
        const app = express();
        app.use(express.json());
        app.post('/test-nonexisting-id', (req, res, next) => {
          // ファイルをマニュアルでセット
          req.file = {
            originalname: 'non_existing_id.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(csvContent),
            size: csvContent.length
          };
          req.app = app;

          // インポートコントローラを直接呼び出す
          const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
          importDevicesFromCsv(req, res, next);
        });
        
        app.use(errorHandler);

        // 必要なモックを設定
        const originalModels = jest.requireActual('../../models');
        jest.spyOn(originalModels.Customer, 'findOne').mockImplementation(({ where }) => {
          if (where && where.customer_name === 'テスト顧客1') {
            return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
          }
          return Promise.resolve(null);
        });

        jest.spyOn(originalModels.Device, 'findByPk').mockImplementation((id) => {
          return Promise.resolve(null); // IDが見つからない
        });

        // テスト実行
        const response = await request(app).post('/test-nonexisting-id');
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('errors');
        expect(response.body.data.errors.length).toBeGreaterThan(0);
        expect(response.body.data.errors[0].error).toContain('指定されたID');
      });

      it('データベースエラーが発生した場合に適切なエラーレスポンスを返す', async () => {
        // CSV内容のモック作成
        const csvContent = 
          '"機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"\n' +
          '"インポートテスト機器1","テスト顧客1","TestModel-1","7","20","22","サーバ","物理"';
          
        // リクエストによるアップロードをシミュレート
        const app = express();
        app.use(express.json());
        app.post('/test-db-error', (req, res, next) => {
          // ファイルをマニュアルでセット
          req.file = {
            originalname: 'test_db_error.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(csvContent),
            size: csvContent.length
          };
          req.app = app;

          // インポートコントローラを直接呼び出す
          const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
          importDevicesFromCsv(req, res, next);
        });
        
        app.use(errorHandler);

        // 必要なモックを設定
        const originalModels = jest.requireActual('../../models');
        jest.spyOn(originalModels.Customer, 'findOne').mockImplementation(() => {
          throw new Error('データベース接続エラー');
        });

        // テスト実行
        const response = await request(app).post('/test-db-error');
        
        // レスポンスの検証
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('エラー');
      });

      it('トランザクションのロールバックが適切に行われることを確認', async () => {
        // 複数行のCSV内容のモック作成 (エラーが発生する行を含む)
        const csvContent = 
          '"機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"\n' +
          '"正常機器1","テスト顧客1","Model-1","7","20","22","サーバ","物理"\n' +
          '"正常機器2","テスト顧客1","Model-2","8","25","27","サーバ","物理"\n' +
          '"エラー機器","テスト顧客1","Model-ERR","9","30","32","無効な種別","物理"'; // 無効な機器種別
          
        // リクエストによるアップロードをシミュレート
        const app = express();
        app.use(express.json());
        app.post('/test-transaction', (req, res, next) => {
          // ファイルをマニュアルでセット
          req.file = {
            originalname: 'test_transaction.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(csvContent),
            size: csvContent.length
          };
          req.app = app;

          // インポートコントローラを直接呼び出す
          const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
          importDevicesFromCsv(req, res, next);
        });
        
        app.use(errorHandler);

        // モックトランザクション
        const mockTransaction = {
          commit: jest.fn().mockResolvedValue(true),
          rollback: jest.fn().mockResolvedValue(true)
        };

        // 必要なモックを設定
        const originalModels = jest.requireActual('../../models');
        
        // sequelize.transactionのモック
        jest.spyOn(require('../../config/db').sequelize, 'transaction').mockResolvedValue(mockTransaction);
        
        // 顧客検索のモック
        jest.spyOn(originalModels.Customer, 'findOne').mockImplementation(({ where }) => {
          if (where && where.customer_name === 'テスト顧客1') {
            return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
          }
          return Promise.resolve(null);
        });
        
        // デバイス重複チェックのモック
        jest.spyOn(originalModels.Device, 'findOne').mockImplementation(({ where }) => {
          return Promise.resolve(null); // 重複なし
        });
        
        // デバイス作成のモック - 3行目でエラーを発生させる
        const mockCreate = jest.fn()
          .mockImplementationOnce((deviceData, options) => {
            // 1行目は成功
            return Promise.resolve({
              id: 101,
              ...deviceData,
              created_at: new Date(),
              updated_at: new Date()
            });
          })
          .mockImplementationOnce((deviceData, options) => {
            // 2行目も成功
            return Promise.resolve({
              id: 102,
              ...deviceData,
              created_at: new Date(),
              updated_at: new Date()
            });
          })
          .mockImplementationOnce((deviceData, options) => {
            // 3行目でエラー発生 (無効な機器種別)
            const error = new Error('無効な機器種別です');
            error.name = 'SequelizeValidationError';
            error.errors = [{ message: '無効な機器種別です' }];
            return Promise.reject(error);
          });
        
        jest.spyOn(originalModels.Device, 'create').mockImplementation(mockCreate);

        // テスト実行
        const response = await request(app).post('/test-transaction');
        
        // レスポンスの検証 - 部分成功として処理される
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('importedRows', 2); // 2件成功
        expect(response.body.data).toHaveProperty('totalRows', 3);    // 合計3件
        expect(response.body.data).toHaveProperty('errors');
        expect(response.body.data.errors).toHaveLength(1);  // 1件エラー
        expect(response.body.data.errors[0].error).toContain('無効な機器種別');
        
        // Device.createが3回呼ばれたことを確認
        expect(mockCreate).toHaveBeenCalledTimes(3);
        
        // トランザクションのコミットが呼ばれたことを確認 (部分成功時はコミットする)
        expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
        expect(mockTransaction.rollback).not.toHaveBeenCalled();
      });
      
      it('致命的なエラーが発生した場合トランザクションがロールバックされる', async () => {
        // CSV内容のモック作成
        const csvContent = 
          '"機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"\n' +
          '"インポートテスト機器1","テスト顧客1","TestModel-1","7","20","22","サーバ","物理"';
          
        // リクエストによるアップロードをシミュレート
        const app = express();
        app.use(express.json());
        app.post('/test-rollback', (req, res, next) => {
          // ファイルをマニュアルでセット
          req.file = {
            originalname: 'test_rollback.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(csvContent),
            size: csvContent.length
          };
          req.app = app;

          // インポートコントローラを直接呼び出す
          const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
          importDevicesFromCsv(req, res, next);
        });
        
        app.use(errorHandler);

        // モックトランザクション
        const mockTransaction = {
          commit: jest.fn().mockResolvedValue(true),
          rollback: jest.fn().mockResolvedValue(true)
        };

        // 必要なモックを設定
        // sequelize.transactionのモック
        jest.spyOn(require('../../config/db').sequelize, 'transaction').mockResolvedValue(mockTransaction);
        
        // Customer.findOneが処理中に例外を投げるようにモック
        const originalModels = jest.requireActual('../../models');
        jest.spyOn(originalModels.Customer, 'findOne').mockImplementation(() => {
          throw new Error('致命的なデータベースエラー');
        });

        // テスト実行
        const response = await request(app).post('/test-rollback');
        
        // レスポンスの検証
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('エラー');
        
        // トランザクションのロールバックが呼ばれたことを確認
        expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
        expect(mockTransaction.commit).not.toHaveBeenCalled();
      });

      it('重複データを含むCSVを適切に処理できる', async () => {
        // 重複データを含むCSV内容のモック作成
        const csvContent = 
          '"機器名","顧客名","モデル","設置ラックNo","ユニット開始位置","ユニット終了位置","機器種別","ハードウェアタイプ"\n' +
          '"テストサーバー1","テスト顧客1","Model-X","5","10","12","サーバ","物理"\n' + // 重複データ
          '"新規テスト機器","テスト顧客1","New-Model","6","15","17","サーバ","物理"';
          
        // リクエストによるアップロードをシミュレート
        const app = express();
        app.use(express.json());
        app.post('/test-duplicate', (req, res, next) => {
          // ファイルをマニュアルでセット
          req.file = {
            originalname: 'duplicate_data.csv',
            mimetype: 'text/csv',
            buffer: Buffer.from(csvContent),
            size: csvContent.length
          };
          req.app = app;

          // インポートコントローラを直接呼び出す
          const { importDevicesFromCsv } = require('../../controllers/device/deviceImportController');
          importDevicesFromCsv(req, res, next);
        });
        
        app.use(errorHandler);

        // デバイス作成をモック
        const mockCreate = jest.fn().mockImplementation((deviceData, transaction) => {
          return Promise.resolve({
            id: 200,
            ...deviceData,
            created_at: new Date(),
            updated_at: new Date()
          });
        });

        // 必要なモックを設定
        const originalModels = jest.requireActual('../../models');
        jest.spyOn(originalModels.Customer, 'findOne').mockImplementation(({ where }) => {
          if (where && where.customer_name === 'テスト顧客1') {
            return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
          }
          return Promise.resolve(null);
        });

        jest.spyOn(originalModels.Device, 'findOne').mockImplementation(({ where }) => {
          if (where && where.customer_id === 1 && where.device_name === 'テストサーバー1') {
            // 重複データをシミュレート
            return Promise.resolve({
              id: 1,
              device_name: 'テストサーバー1',
              customer_id: 1,
              model: 'Model-X',
              rack_number: 5,
              unit_start_position: 10,
              unit_end_position: 12,
              device_type: 'サーバ',
              hardware_type: '物理'
            });
          }
          return Promise.resolve(null);
        });

        jest.spyOn(originalModels.Device, 'create').mockImplementation(mockCreate);

        // テスト実行
        const response = await request(app).post('/test-duplicate');
        
        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('errors');
        expect(response.body.data.errors.length).toBeGreaterThan(0); // 重複エラーがあるはず
        expect(mockCreate).toHaveBeenCalledTimes(1); // 新規データのみ作成されるはず
      });
    });
  });
});