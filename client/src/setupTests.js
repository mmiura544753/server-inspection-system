// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { act } from 'react'; // React から act をインポート

// React 18のテスト互換性設定
// React 18のcreateRootをモック
jest.mock('react-dom/client', () => {
  return {
    createRoot: jest.fn((container) => {
      return {
        render: jest.fn((element) => {
          // React 17互換のrenderを使用
          const ReactDOM = require('react-dom');
          ReactDOM.render(element, container);
        }),
        unmount: jest.fn(() => {
          // React 17互換のunmountComponentAtNodeを使用
          const ReactDOM = require('react-dom');
          return ReactDOM.unmountComponentAtNode(container);
        })
      };
    })
  };
});

// ReactDOM.createPortal をモック (モーダルなどに使用)
jest.mock('react-dom', () => {
  const originalReactDOM = jest.requireActual('react-dom');
  return {
    ...originalReactDOM,
    createPortal: (node) => node,
  };
});

// コンソールエラーを抑制（Actの警告など）
const originalConsoleError = console.error;
console.error = (...args) => {
  // React 関連の警告を抑制
  if (
    args[0] && 
    typeof args[0] === 'string' && 
    (
      (args[0].includes('Warning: An update to') && args[0].includes('inside a test was not wrapped in act')) ||
      args[0].includes('Warning: ReactDOM.render is no longer supported in React 18') ||
      args[0].includes('Warning: `ReactDOMTestUtils.act` is deprecated')
    )
  ) {
    return;
  }

  // その他のエラーは通常通り表示
  originalConsoleError(...args);
};

// axiosモジュールをモック - 名前はmockで始める必要がある
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    },
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: {},
  })),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  },
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  defaults: {},
}));

// 一部のテストで問題になるfetch APIをモック
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    statusText: 'OK'
  })
);

// テスト環境のセットアップ
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// タイマーをモック
jest.useFakeTimers();
