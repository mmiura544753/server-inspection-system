// handlers.test.js

// 依存関係をモック化
jest.mock('msw', () => ({
  rest: {
    get: (url, resolver) => ({ type: 'GET', url, resolver }),
    post: (url, resolver) => ({ type: 'POST', url, resolver }),
    put: (url, resolver) => ({ type: 'PUT', url, resolver }),
    delete: (url, resolver) => ({ type: 'DELETE', url, resolver }),
  }
}));

jest.mock('../../mocks/mockData', () => ({
  mockCustomers: [{ id: 1, customer_name: 'テスト顧客1' }],
  mockDevices: [{ id: 1, device_name: 'テスト機器1' }],
  mockInspectionItems: [{ id: 1, name: 'テスト項目1' }],
  mockInspectionItemNames: [{ id: 1, name: 'テスト項目名1' }],
  mockInspections: [{ id: 1, inspection_date: '2025-01-01' }]
}));

// モック化後にhandlersをインポート
const { handlers } = require('../../mocks/handlers');

describe('API Mock Handlers', () => {
  it('exports an array of handlers', () => {
    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);
  });

  it('has correct endpoint handlers', () => {
    // ハンドラーのエンドポイントURLをチェック
    const endpoints = handlers.map(h => ({ type: h.type, url: h.url }));
    
    // 必要なエンドポイントがすべて含まれていることを確認
    const expectedEndpoints = [
      { type: 'GET', url: 'http://localhost:5000/api/customers' },
      { type: 'GET', url: 'http://localhost:5000/api/customers/:id' },
      { type: 'POST', url: 'http://localhost:5000/api/customers' },
      { type: 'GET', url: 'http://localhost:5000/api/devices' },
      { type: 'GET', url: 'http://localhost:5000/api/devices/:id' },
      { type: 'GET', url: 'http://localhost:5000/api/inspection-items' },
      { type: 'GET', url: 'http://localhost:5000/api/inspection-item-names' },
      { type: 'GET', url: 'http://localhost:5000/api/inspections' }
    ];
    
    expectedEndpoints.forEach(expected => {
      expect(endpoints).toContainEqual(expected);
    });
  });

  // 顧客一覧ハンドラー（最初のハンドラー）のテスト
  it('handles GET /customers request correctly', () => {
    const customersHandler = handlers.find(h => 
      h.type === 'GET' && h.url === 'http://localhost:5000/api/customers'
    );
    
    expect(customersHandler).toBeDefined();
    
    // ハンドラーの動作をテスト
    // モックレスポンスとコンテキスト
    const req = {};
    const res = jest.fn(ctx => ctx);
    const ctx = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    // ハンドラーを実行
    const result = customersHandler.resolver(req, res, ctx);
    
    // レスポンスが正しい形式で返されることを確認
    expect(ctx.status).toHaveBeenCalledWith(200);
    expect(ctx.json).toHaveBeenCalledWith([{ id: 1, customer_name: 'テスト顧客1' }]);
    expect(res).toHaveBeenCalled();
  });

  // 顧客詳細ハンドラーのテスト
  it('handles GET /customers/:id request correctly', () => {
    const customerDetailHandler = handlers.find(h => 
      h.type === 'GET' && h.url === 'http://localhost:5000/api/customers/:id'
    );
    
    expect(customerDetailHandler).toBeDefined();
    
    // 正常なリクエスト
    const req = { params: { id: '1' } };
    const res = jest.fn(ctx => ctx);
    const ctx = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    customerDetailHandler.resolver(req, res, ctx);
    
    // 顧客が見つかる場合のレスポンス
    expect(ctx.status).toHaveBeenCalledWith(200);
    expect(ctx.json).toHaveBeenCalledWith({ id: 1, customer_name: 'テスト顧客1' });
    
    // 存在しない顧客IDの場合
    const reqNotFound = { params: { id: '999' } };
    const resNotFound = jest.fn(ctx => ctx);
    const ctxNotFound = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    customerDetailHandler.resolver(reqNotFound, resNotFound, ctxNotFound);
    
    // 顧客が見つからない場合のレスポンス
    expect(ctxNotFound.status).toHaveBeenCalledWith(404);
    expect(ctxNotFound.json).toHaveBeenCalledWith({ message: '顧客が見つかりません' });
  });

  // 顧客作成ハンドラーのテスト
  it('handles POST /customers request correctly', () => {
    const customerCreateHandler = handlers.find(h => 
      h.type === 'POST' && h.url === 'http://localhost:5000/api/customers'
    );
    
    expect(customerCreateHandler).toBeDefined();
    
    // 正常なリクエスト
    const req = { 
      json: jest.fn().mockResolvedValue({ customer_name: '新しい顧客' }) 
    };
    const res = jest.fn(ctx => ctx);
    const ctx = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    // 非同期ハンドラーなのでasyncでラップ
    return customerCreateHandler.resolver(req, res, ctx).then(() => {
      expect(ctx.status).toHaveBeenCalledWith(201);
      expect(ctx.json).toHaveBeenCalled();
      // レスポンスが新しい顧客オブジェクトを含むことを確認
      const responseData = ctx.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('customer_name', '新しい顧客');
      expect(responseData).toHaveProperty('created_at');
      expect(responseData).toHaveProperty('updated_at');
    });
  });

  // バリデーションエラーのテスト
  it('handles validation error in POST /customers', () => {
    const customerCreateHandler = handlers.find(h => 
      h.type === 'POST' && h.url === 'http://localhost:5000/api/customers'
    );
    
    // 不正なリクエスト（顧客名なし）
    const req = { 
      json: jest.fn().mockResolvedValue({}) // 顧客名がない
    };
    const res = jest.fn(ctx => ctx);
    const ctx = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    return customerCreateHandler.resolver(req, res, ctx).then(() => {
      expect(ctx.status).toHaveBeenCalledWith(400);
      expect(ctx.json).toHaveBeenCalledWith({ message: '顧客名は必須です' });
    });
  });

  // 機器一覧ハンドラーのテスト
  it('handles GET /devices request correctly', () => {
    const devicesHandler = handlers.find(h => 
      h.type === 'GET' && h.url === 'http://localhost:5000/api/devices'
    );
    
    expect(devicesHandler).toBeDefined();
    
    // ハンドラーの動作をテスト
    const req = {};
    const res = jest.fn(ctx => ctx);
    const ctx = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    // ハンドラーを実行
    const result = devicesHandler.resolver(req, res, ctx);
    
    // レスポンスが正しい形式で返されることを確認
    expect(ctx.status).toHaveBeenCalledWith(200);
    expect(ctx.json).toHaveBeenCalledWith([{ id: 1, device_name: 'テスト機器1' }]);
    expect(res).toHaveBeenCalled();
  });

  // 機器詳細ハンドラーのテスト
  it('handles GET /devices/:id request correctly', () => {
    const deviceDetailHandler = handlers.find(h => 
      h.type === 'GET' && h.url === 'http://localhost:5000/api/devices/:id'
    );
    
    expect(deviceDetailHandler).toBeDefined();
    
    // 正常なリクエスト
    const req = { params: { id: '1' } };
    const res = jest.fn(ctx => ctx);
    const ctx = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    deviceDetailHandler.resolver(req, res, ctx);
    
    // 機器が見つかる場合のレスポンス
    expect(ctx.status).toHaveBeenCalledWith(200);
    expect(ctx.json).toHaveBeenCalledWith({ id: 1, device_name: 'テスト機器1' });
    
    // 存在しない機器IDの場合
    const reqNotFound = { params: { id: '999' } };
    const resNotFound = jest.fn(ctx => ctx);
    const ctxNotFound = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    deviceDetailHandler.resolver(reqNotFound, resNotFound, ctxNotFound);
    
    // 機器が見つからない場合のレスポンス
    expect(ctxNotFound.status).toHaveBeenCalledWith(404);
    expect(ctxNotFound.json).toHaveBeenCalledWith({ message: '機器が見つかりません' });
  });

  // 点検項目一覧ハンドラーのテスト
  it('handles GET /inspection-items request correctly', () => {
    const inspectionItemsHandler = handlers.find(h => 
      h.type === 'GET' && h.url === 'http://localhost:5000/api/inspection-items'
    );
    
    expect(inspectionItemsHandler).toBeDefined();
    
    // ハンドラーの動作をテスト
    const req = {};
    const res = jest.fn(ctx => ctx);
    const ctx = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    // ハンドラーを実行
    const result = inspectionItemsHandler.resolver(req, res, ctx);
    
    // レスポンスが正しい形式で返されることを確認
    expect(ctx.status).toHaveBeenCalledWith(200);
    expect(ctx.json).toHaveBeenCalledWith([{ id: 1, name: 'テスト項目1' }]);
    expect(res).toHaveBeenCalled();
  });

  // 点検項目名一覧ハンドラーのテスト
  it('handles GET /inspection-item-names request correctly', () => {
    const inspectionItemNamesHandler = handlers.find(h => 
      h.type === 'GET' && h.url === 'http://localhost:5000/api/inspection-item-names'
    );
    
    expect(inspectionItemNamesHandler).toBeDefined();
    
    // ハンドラーの動作をテスト
    const req = {};
    const res = jest.fn(ctx => ctx);
    const ctx = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    // ハンドラーを実行
    const result = inspectionItemNamesHandler.resolver(req, res, ctx);
    
    // レスポンスが正しい形式で返されることを確認
    expect(ctx.status).toHaveBeenCalledWith(200);
    expect(ctx.json).toHaveBeenCalledWith([{ id: 1, name: 'テスト項目名1' }]);
    expect(res).toHaveBeenCalled();
  });

  // 点検一覧ハンドラーのテスト
  it('handles GET /inspections request correctly', () => {
    const inspectionsHandler = handlers.find(h => 
      h.type === 'GET' && h.url === 'http://localhost:5000/api/inspections'
    );
    
    expect(inspectionsHandler).toBeDefined();
    
    // ハンドラーの動作をテスト
    const req = {};
    const res = jest.fn(ctx => ctx);
    const ctx = {
      status: jest.fn(code => ({ status: code })),
      json: jest.fn(data => ({ json: data }))
    };
    
    // ハンドラーを実行
    const result = inspectionsHandler.resolver(req, res, ctx);
    
    // レスポンスが正しい形式で返されることを確認
    expect(ctx.status).toHaveBeenCalledWith(200);
    expect(ctx.json).toHaveBeenCalledWith([{ id: 1, inspection_date: '2025-01-01' }]);
    expect(res).toHaveBeenCalled();
  });
});