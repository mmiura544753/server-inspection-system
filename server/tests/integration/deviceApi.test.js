/**
 * デバイスAPIの統合テスト
 * 注意: 実際のDBに接続する代わりにモックを使用
 */
const request = require('supertest');
const express = require('express');

// Sequelizeとモデルのモックをセットアップ
jest.mock('../../config/db', () => {
  return {
    sequelize: {
      transaction: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          commit: jest.fn().mockResolvedValue(true),
          rollback: jest.fn().mockResolvedValue(true)
        });
      }),
      sync: jest.fn().mockResolvedValue(true),
      authenticate: jest.fn().mockResolvedValue(true)
    },
    Sequelize: {
      Op: {
        eq: Symbol('eq'),
        ne: Symbol('ne'),
        in: Symbol('in')
      },
      DataTypes: {
        STRING: String,
        INTEGER: Number,
        BOOLEAN: Boolean,
        DATE: Date,
        ENUM: (...values) => ({ type: 'ENUM', values })
      }
    }
  };
});

// デバイスモデルのモック
const mockDevice = {
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

jest.mock('../../models', () => {
  return {
    Device: {
      findAll: jest.fn().mockResolvedValue([
        { ...mockDevice },
        { ...mockDevice, id: 2, device_name: 'テストサーバー2' }
      ]),
      findByPk: jest.fn().mockImplementation((id) => {
        if (id == 1) {
          return Promise.resolve({ ...mockDevice });
        }
        return Promise.resolve(null);
      }),
      belongsTo: jest.fn()
    },
    Customer: {
      findAll: jest.fn().mockResolvedValue([
        { id: 1, customer_name: 'テスト顧客1' },
        { id: 2, customer_name: 'テスト顧客2' }
      ])
    }
  };
});

// モジュールのインポート
const deviceRoutes = require('../../routes/deviceRoutes');
const { errorHandler, notFound } = require('../../middleware/errorHandler');

// 統合テスト用にExpress appを作成
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/devices', deviceRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe('デバイスAPI', () => {
  describe('GET /api/devices', () => {
    it('デバイス一覧を取得できる', async () => {
      const app = createTestApp();
      const response = await request(app).get('/api/devices');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/devices/:id', () => {
    it('存在するIDのデバイスを取得できる', async () => {
      const app = createTestApp();
      const response = await request(app).get('/api/devices/1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
    });

    it('存在しないIDの場合404エラーが返る', async () => {
      const app = createTestApp();
      const response = await request(app).get('/api/devices/999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
});