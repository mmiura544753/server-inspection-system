import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react';
import * as testingLibrary from '@testing-library/react';

// React Testing Library から必要なものをエクスポート
const { screen, fireEvent, waitFor } = testingLibrary;

// バックアップとして React DOM も直接使用できるようにする
const render = (ui, options = {}) => {
  // 既存のすべてのコンテナをクリーンアップ
  document.querySelectorAll('[data-testid="test-container"]').forEach(node => {
    node.remove();
  });
  
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'test-container');
  document.body.appendChild(container);
  
  // React DOMを使用して直接レンダリング
  act(() => {
    ReactDOM.render(ui, container);
  });
  
  // Testing Library のクエリ関数を取得
  const queries = testingLibrary.within(container);

  return {
    container,
    // Testing Library から取得したクエリ関数
    ...queries,
    // Testing Library からのその他のメソッド
    ...testingLibrary,
    // DOM操作のためのヘルパー
    unmount: () => {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    },
    rerender: (element) => {
      act(() => {
        ReactDOM.render(element, container);
      });
    }
  };
};

// カスタムフックをテストするためのユーティリティ
const renderHook = (hookFn) => {
  const result = { current: null };
  
  // テスト用のコンポーネント
  function TestComponent() {
    result.current = hookFn();
    return null;
  }
  
  const utils = render(<TestComponent />);
  
  return {
    result,
    ...utils
  };
};

// 必要な関数をエクスポート
export { render, screen, fireEvent, waitFor, renderHook, act };