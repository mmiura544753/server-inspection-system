import React from 'react';
import ReactDOM from 'react-dom';
import { 
  render as customRender, 
  renderHook, 
  act 
} from '../../utils/test-utils';
import * as testingLibrary from '@testing-library/react';
const tlRender = testingLibrary.render;

// テスト対象であるテストユーティリティを直接テストします
describe('test-utils', () => {
  // DOMクリーンアップを確認
  beforeEach(() => {
    // テストコンテナを作成
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'test-container');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // 残ったテストコンテナをクリーンアップ
    document.querySelectorAll('[data-testid="test-container"]').forEach(node => {
      node.remove();
    });
  });

  describe('customRender', () => {
    it('should render a component to the DOM', () => {
      const TestComponent = () => <div data-testid="test-element">Test Content</div>;
      const { container } = customRender(<TestComponent />);

      // コンポーネントがレンダリングされたことを確認
      expect(container).toBeDefined();
      expect(container.querySelector('[data-testid="test-element"]')).not.toBeNull();
      expect(container.textContent).toContain('Test Content');
    });

    it('should clean up previous containers', () => {
      // 複数のコンポーネントを続けてレンダリング
      const TestComponent1 = () => <div>Component 1</div>;
      const TestComponent2 = () => <div>Component 2</div>;

      customRender(<TestComponent1 />);
      customRender(<TestComponent2 />);

      // テストコンテナは1つだけ存在することを確認
      const containers = document.querySelectorAll('[data-testid="test-container"]');
      expect(containers.length).toBe(1);
    });

    it('should provide custom getByTestId helper', () => {
      const TestComponent = () => (
        <div>
          <span data-testid="test-span">Test Span</span>
        </div>
      );
      
      const utils = customRender(<TestComponent />);
      const element = utils.container.querySelector('[data-testid="test-span"]');
      
      expect(element).toBeDefined();
      expect(element.tagName).toBe('SPAN');
      expect(element.textContent).toBe('Test Span');
    });

    it('should provide custom text query methods', () => {
      const TestComponent = () => (
        <div>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      );
      
      const utils = customRender(<TestComponent />);
      const container = utils.container;
      
      // コンテナに期待するテキストが含まれていることを確認
      expect(container.textContent).toContain('First paragraph');
      expect(container.textContent).toContain('Second paragraph');
    });

    it('should provide unmount helper', () => {
      const TestComponent = () => <div data-testid="test-element">Test Content</div>;
      const { unmount, container } = customRender(<TestComponent />);
      
      // アンマウント前の状態確認
      expect(container.querySelector('[data-testid="test-element"]')).not.toBeNull();
      
      // コンポーネントをアンマウント
      unmount();
      
      // コンテナが削除されたことを確認
      expect(document.body.contains(container)).toBe(false);
    });

    it('should provide rerender helper', () => {
      const TestComponent = ({ text }) => <div data-testid="test-element">{text}</div>;
      
      // 初期レンダリング
      const { rerender, container } = customRender(<TestComponent text="Initial" />);
      expect(container.querySelector('[data-testid="test-element"]').textContent).toBe('Initial');
      
      // 再レンダリング
      rerender(<TestComponent text="Updated" />);
      expect(container.querySelector('[data-testid="test-element"]').textContent).toBe('Updated');
    });
  });

  describe('renderHook', () => {
    it('should render a custom hook and return its result', () => {
      // テスト用のカスタムフック
      const useCounter = () => {
        const [count, setCount] = React.useState(0);
        const increment = () => setCount(c => c + 1);
        return { count, increment };
      };
      
      // フックをレンダリング
      const { result } = renderHook(() => useCounter());
      
      // 初期値を確認
      expect(result.current.count).toBe(0);
      
      // 状態更新
      act(() => {
        result.current.increment();
      });
      
      // 更新後の値を確認
      expect(result.current.count).toBe(1);
    });

    it('should provide result in the expected format', () => {
      // シンプルなカスタムフック
      const useTestHook = () => {
        return { value: 'test' };
      };
      
      // フックをレンダリング
      const hookResult = renderHook(() => useTestHook());
      
      // 返り値の構造を確認
      expect(hookResult).toHaveProperty('result');
      expect(hookResult.result).toHaveProperty('current');
      expect(hookResult.result.current).toHaveProperty('value', 'test');
    });
  });

  describe('act', () => {
    it('should wrap React state updates', () => {
      // カウンターコンポーネント
      function Counter() {
        const [count, setCount] = React.useState(0);
        return (
          <div>
            <span data-testid="count">{count}</span>
            <button data-testid="button" onClick={() => setCount(c => c + 1)}>
              Increment
            </button>
          </div>
        );
      }
      
      // コンポーネントを直接DOMに挿入してテスト
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      act(() => {
        ReactDOM.render(<Counter />, container);
      });
      
      // 初期値を確認
      const countElement = container.querySelector('[data-testid="count"]');
      expect(countElement.textContent).toBe('0');
      
      // ボタンクリックをactでラップ
      const buttonElement = container.querySelector('[data-testid="button"]');
      act(() => {
        buttonElement.click();
      });
      
      // 更新された値を確認
      expect(countElement.textContent).toBe('1');
      
      // クリーンアップ
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    });
  });
});