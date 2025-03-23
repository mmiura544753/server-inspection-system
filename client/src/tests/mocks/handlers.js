// API リクエストのモックハンドラー
// NOTE: このファイルはMSW (Mock Service Worker) を使用する場合の設定例です
// MSWを使用するには別途インストールが必要です: npm install msw --save-dev

import { rest } from 'msw';
import { mockCustomers, mockDevices, mockInspectionItems, mockInspectionItemNames, mockInspections } from './mockData';

// APIのベースURL
const baseUrl = 'http://localhost:5000/api';

export const handlers = [
  // 顧客一覧の取得
  rest.get(`${baseUrl}/customers`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockCustomers)
    );
  }),

  // 顧客IDによる取得
  rest.get(`${baseUrl}/customers/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const customer = mockCustomers.find(c => c.id === parseInt(id));
    
    if (customer) {
      return res(ctx.status(200), ctx.json(customer));
    } else {
      return res(ctx.status(404), ctx.json({ message: '顧客が見つかりません' }));
    }
  }),

  // 顧客の作成
  rest.post(`${baseUrl}/customers`, async (req, res, ctx) => {
    const body = await req.json();
    
    if (!body.customer_name) {
      return res(
        ctx.status(400),
        ctx.json({ message: '顧客名は必須です' })
      );
    }
    
    const newCustomer = {
      id: mockCustomers.length + 1,
      customer_name: body.customer_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return res(
      ctx.status(201),
      ctx.json(newCustomer)
    );
  }),

  // 機器一覧の取得
  rest.get(`${baseUrl}/devices`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockDevices)
    );
  }),

  // 機器IDによる取得
  rest.get(`${baseUrl}/devices/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const device = mockDevices.find(d => d.id === parseInt(id));
    
    if (device) {
      return res(ctx.status(200), ctx.json(device));
    } else {
      return res(ctx.status(404), ctx.json({ message: '機器が見つかりません' }));
    }
  }),

  // 点検項目一覧の取得
  rest.get(`${baseUrl}/inspection-items`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockInspectionItems)
    );
  }),

  // 点検項目名一覧の取得
  rest.get(`${baseUrl}/inspection-item-names`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockInspectionItemNames)
    );
  }),

  // 点検一覧の取得
  rest.get(`${baseUrl}/inspections`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockInspections)
    );
  }),
];