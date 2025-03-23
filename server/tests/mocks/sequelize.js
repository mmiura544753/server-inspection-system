// server/tests/mocks/sequelize.js
/**
 * Sequelizeのモック
 */

// mockTransaction オブジェクト
const mockTransaction1 = {
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true)
};

// mockSequelize オブジェクト
const mockSequelize = {
  define: jest.fn().mockImplementation((modelName, attributes) => {
    // 単純なモックモデルを返す
    return { name: modelName, attributes };
  }),
  transaction: jest.fn().mockImplementation(() => {
    return Promise.resolve(mockTransaction1);
  }),
  sync: jest.fn().mockResolvedValue(true),
  authenticate: jest.fn().mockResolvedValue(true)
};

// モックOperators
const Op = {
  eq: Symbol('eq'),
  ne: Symbol('ne'),
  in: Symbol('in'),
  gt: Symbol('gt'),
  lt: Symbol('lt'),
  gte: Symbol('gte'),
  lte: Symbol('lte'),
  like: Symbol('like'),
  notLike: Symbol('notLike'),
  or: Symbol('or'),
  and: Symbol('and')
};

// モックデータ型
const DataTypes = {
  STRING: 'STRING',
  TEXT: 'TEXT',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  FLOAT: 'FLOAT',
  DECIMAL: 'DECIMAL',
  ENUM: (...values) => ({ type: 'ENUM', values })
};

module.exports = {
  mockSequelize,
  mockTransaction1,
  Op,
  DataTypes
};