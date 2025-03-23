import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';

// テスト用の共通ラッパー
// Reactコンポーネントをテストする際に、BrowserRouterなどの必要なプロバイダーでラップする
const AllTheProviders = ({ children }) => {
  return (
    <Router>
      {children}
    </Router>
  );
};

// Testing Libraryのrenderを拡張したカスタムレンダー関数
const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Testing Libraryのすべてのものを再エクスポート
export * from '@testing-library/react';

// カスタムレンダー関数をデフォルトエクスポートとして上書き
export { customRender as render };