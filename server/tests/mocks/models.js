// server/tests/mocks/models.js
/**
 * モデルのモック
 */

// ヘルパー関数: モックデバイスを生成
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
    },
    save: jest.fn().mockImplementation(function() { return Promise.resolve(this); })
  };
  return { ...defaults, ...overrides };
}

// ヘルパー関数: モック顧客を生成
function mockCustomer(overrides = {}) {
  const defaults = {
    id: 1,
    customer_name: 'テスト顧客1',
    created_at: new Date(),
    updated_at: new Date(),
    save: jest.fn().mockImplementation(function() { return Promise.resolve(this); })
  };
  return { ...defaults, ...overrides };
}

// Device モデルのモック
const Device = {
  findAll: jest.fn().mockResolvedValue([mockDevice()]),
  findOne: jest.fn().mockResolvedValue(mockDevice()),
  findByPk: jest.fn().mockImplementation((id) => Promise.resolve(id == 1 ? mockDevice({ id }) : null)),
  create: jest.fn().mockImplementation((data) => Promise.resolve(mockDevice(data))),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  count: jest.fn().mockResolvedValue(1),
  belongsTo: jest.fn()
};

// Customer モデルのモック
const Customer = {
  findAll: jest.fn().mockResolvedValue([mockCustomer()]),
  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where && where.customer_name === 'テスト顧客1') {
      return Promise.resolve(mockCustomer());
    }
    return Promise.resolve(null);
  }),
  findByPk: jest.fn().mockImplementation((id) => Promise.resolve(id == 1 ? mockCustomer({ id }) : null)),
  create: jest.fn().mockImplementation((data) => Promise.resolve(mockCustomer(data))),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  hasMany: jest.fn()
};

// InspectionItemName モデルのモック
const InspectionItemName = {
  findAll: jest.fn().mockResolvedValue([{ id: 1, name: 'CPU使用率' }]),
  findOne: jest.fn().mockResolvedValue({ id: 1, name: 'CPU使用率' }),
  findByPk: jest.fn().mockImplementation((id) => Promise.resolve(id == 1 ? { id: 1, name: 'CPU使用率' } : null)),
  create: jest.fn().mockResolvedValue({ id: 1, name: 'CPU使用率' }),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1)
};

// InspectionItem モデルのモック
const InspectionItem = {
  findAll: jest.fn().mockResolvedValue([{ id: 1, item_name_id: 1, expected_value: '< 80%' }]),
  findOne: jest.fn().mockResolvedValue({ id: 1, item_name_id: 1, expected_value: '< 80%' }),
  findByPk: jest.fn().mockImplementation((id) => Promise.resolve(id == 1 ? { id: 1, item_name_id: 1, expected_value: '< 80%' } : null)),
  create: jest.fn().mockResolvedValue({ id: 1, item_name_id: 1, expected_value: '< 80%' }),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  count: jest.fn().mockResolvedValue(1)
};

module.exports = {
  mockDevice,
  mockCustomer,
  Device,
  Customer,
  InspectionItemName,
  InspectionItem
};