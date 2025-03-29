// server.test.js

// モックを作成
jest.mock('../../mocks/handlers', () => ({
  handlers: ['mockHandler1', 'mockHandler2']
}));

jest.mock('msw/node', () => ({
  setupServer: (...args) => ({
    args,
    listen: jest.fn(),
    close: jest.fn(),
    resetHandlers: jest.fn(),
    use: jest.fn()
  })
}));

// モックが適用された後にモジュールをインポート
const { server } = require('../../mocks/server');

describe('Mock Server', () => {
  it('exports a server object', () => {
    expect(server).toBeDefined();
  });

  it('server has expected methods', () => {
    expect(typeof server.listen).toBe('function');
    expect(typeof server.close).toBe('function');
    expect(typeof server.resetHandlers).toBe('function');
    expect(typeof server.use).toBe('function');
  });

  it('setupServer is called with handlers', () => {
    // args プロパティにハンドラーが渡されていることを確認
    expect(server.args).toEqual(['mockHandler1', 'mockHandler2']);
  });
});