import React from 'react';
import { render } from '@testing-library/react';

// テスト用の共通ラッパー
// Router依存を避けるため、基本的なレンダリングのみ提供
const AllTheProviders = ({ children }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

// Testing Libraryのrenderを拡張したカスタムレンダー関数
const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Testing Libraryのすべてのものを再エクスポート
export * from '@testing-library/react';

// カスタムレンダー関数をデフォルトエクスポートとして上書き
export { customRender as render };