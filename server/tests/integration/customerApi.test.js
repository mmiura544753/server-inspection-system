/**
 * 顧客APIの統合テスト
 * 注意: 実際のDBに接続する代わりにモックを使用
 */
const request = require('supertest');
const express = require('express');

// モジュールのモック化
jest.mock('../../models', () => {
  // モック顧客のヘルパー関数をモック内部で定義
  function mockCustomer(overrides = {}) {
    const defaults = {
      id: 1,
      customer_name: 'テスト顧客1',
      created_at: new Date(),
      updated_at: new Date(),
      save: jest.fn().mockImplementation(function() {
        // バリデーションチェック
        if (!this.customer_name) {
          const error = new Error('顧客名は必須です');
          error.name = 'SequelizeValidationError';
          error.errors = [{ message: '顧客名は必須です' }];
          return Promise.reject(error);
        }
        return Promise.resolve(this);
      }),
      destroy: jest.fn().mockImplementation(function() {
        if (this.id === 3) { // ID=3 の顧客は削除失敗するシナリオ
          return Promise.reject(new Error('削除に失敗しました'));
        }
        return Promise.resolve();
      })
    };
    return { ...defaults, ...overrides };
  }
  
  const CustomerMock = {
    findAll: jest.fn().mockImplementation(() => {
      return Promise.resolve([
        mockCustomer(),
        mockCustomer({
          id: 2,
          customer_name: 'テスト顧客2'
        })
      ]);
    }),
    
    findByPk: jest.fn().mockImplementation((id) => {
      if (id == 1) {
        return Promise.resolve(mockCustomer());
      } else if (id == 3) {
        return Promise.resolve(mockCustomer({
          id: 3,
          customer_name: '削除失敗テスト顧客'
        }));
      }
      return Promise.resolve(null);
    }),
    
    create: jest.fn().mockImplementation((data) => {
      // バリデーションチェック
      if (!data.customer_name) {
        const error = new Error('顧客名は必須です');
        error.name = 'SequelizeValidationError';
        error.errors = [{ message: '顧客名は必須です' }];
        return Promise.reject(error);
      }
      
      return Promise.resolve({
        id: 99,
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      });
    })
  };
  
  return {
    Customer: CustomerMock,
    Device: {
      findAll: jest.fn().mockResolvedValue([]),
      belongsTo: jest.fn()
    },
    sequelize: {
      sync: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true)
    }
  };
});

// モジュールのインポート
const customerRoutes = require('../../routes/customerRoutes');
const { errorHandler, notFound } = require('../../middleware/errorHandler');

// 統合テスト用にExpress appを作成
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/customers', customerRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

// リクエスト用のテストアプリ
const app = createTestApp();

describe('顧客API統合テスト', () => {
  beforeAll(() => {
    // モックの準備
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    // モックのリセット
    jest.restoreAllMocks();
  });
  
  describe('GET /api/customers', () => {
    it('すべての顧客の一覧を取得できる', async () => {
      // テスト実行
      const response = await request(app)
        .get('/api/customers')
        .expect('Content-Type', /json/);
      
      // レスポンスの検証
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('customer_name');
    });
  });
  
  describe('GET /api/customers/:id', () => {
    it('存在する顧客IDで顧客詳細を取得できる', async () => {
      // テスト実行
      const response = await request(app)
        .get('/api/customers/1')
        .expect('Content-Type', /json/);
      
      // レスポンスの検証
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('customer_name', 'テスト顧客1');
    });
    
    it('存在しない顧客IDで404エラーを返す', async () => {
      const response = await request(app)
        .get('/api/customers/999');
      
      // レスポンスの検証
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('見つかりません');
    });
  });
  
  describe('POST /api/customers', () => {
    it('有効なデータで新規顧客を作成できる', async () => {
      // テスト実行
      const response = await request(app)
        .post('/api/customers')
        .send({ customer_name: '新規テスト顧客' })
        .expect('Content-Type', /json/);
      
      // レスポンスの検証
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('customer_name', '新規テスト顧客');
    });
    
    it('顧客名がない場合に400エラーを返す', async () => {
      // テスト実行
      const response = await request(app)
        .post('/api/customers')
        .send({})
        .expect('Content-Type', /json/);
      
      // レスポンスの検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('顧客名は必須です');
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('有効なデータで既存顧客を更新できる', async () => {
      // テスト実行
      const response = await request(app)
        .put('/api/customers/1')
        .send({ customer_name: '更新テスト顧客' })
        .expect('Content-Type', /json/);
      
      // レスポンスの検証
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('customer_name', '更新テスト顧客');
    });
    
    it('更新後の名前が顧客モデルのバリデーションに引っかかる場合に400エラーを返す', async () => {
      // モックを一時的に上書きして無効な更新をシミュレート
      const { Customer } = jest.requireMock('../../models');
      const originalFindByPk = Customer.findByPk;
      
      // findByPkをオーバーライドして、saveメソッドがエラーを投げる顧客オブジェクトを返すようにする
      Customer.findByPk = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          id: 1,
          customer_name: 'テスト顧客1',
          save: jest.fn().mockImplementation(() => {
            const error = new Error('顧客名は必須です');
            error.name = 'SequelizeValidationError';
            error.errors = [{ message: '顧客名は必須です' }];
            return Promise.reject(error);
          })
        });
      });
      
      // テスト実行
      const response = await request(app)
        .put('/api/customers/1')
        .send({ customer_name: '' });
      
      // モックを元に戻す
      Customer.findByPk = originalFindByPk;
      
      // レスポンスの検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('顧客名は必須です');
    });

    it('存在しない顧客IDで404エラーを返す', async () => {
      const response = await request(app)
        .put('/api/customers/999')
        .send({ customer_name: '更新テスト顧客' });
      
      // レスポンスの検証
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('見つかりません');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('既存顧客を削除できる', async () => {
      // テスト実行
      const response = await request(app)
        .delete('/api/customers/1')
        .expect('Content-Type', /json/);
      
      // レスポンスの検証
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('削除');
    });
    
    it('存在しない顧客IDで404エラーを返す', async () => {
      const response = await request(app)
        .delete('/api/customers/999');
      
      // レスポンスの検証
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('見つかりません');
    });

    it('削除に失敗した場合にエラーを返す', async () => {
      const response = await request(app)
        .delete('/api/customers/3');
      
      // レスポンスの検証
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('失敗');
    });
  });
});