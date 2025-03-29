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
  
  return {
    container,
    // テスト用のヘルパー関数
    getByTestId: (id) => container.querySelector(`[data-testid="${id}"]`),
    getByText: (text) => {
      const elements = Array.from(container.querySelectorAll('*'))
        .filter(el => el.textContent.includes(text));
      if (elements.length === 0) throw new Error(`Element with text "${text}" not found`);
      return elements[0];
    },
    queryByText: (text) => {
      const elements = Array.from(container.querySelectorAll('*'))
        .filter(el => el.textContent.includes(text));
      return elements.length ? elements[0] : null;
    },
    getByRole: (role, options = {}) => {
      const elements = Array.from(container.querySelectorAll(`[role="${role}"], ${role}`))
        .filter(el => !options.name || el.textContent.match(options.name));
      if (elements.length === 0) throw new Error(`Element with role "${role}" not found`);
      return elements[0]; // 最初の一致を返す
    },
    // Testing Libraryからのその他のメソッド
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

// 必要な関数をエクスポート
export { render, screen, fireEvent, waitFor };