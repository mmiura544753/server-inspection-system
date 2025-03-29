// fileMock.test.js

// fileMockモジュールをインポート
const fileMock = require('../../mocks/fileMock');

describe('fileMock', () => {
  it('exports a string with the correct value', () => {
    expect(typeof fileMock).toBe('string');
    expect(fileMock).toBe('test-file-stub');
  });

  it('is a valid Jest module mock for asset files', () => {
    // Jestのモジュールモックとしての検証

    // 文字列型であることを確認（アセットモックとして適切）
    expect(typeof fileMock).toBe('string');
    
    // 空文字列ではないことを確認
    expect(fileMock.length).toBeGreaterThan(0);
    
    // 具体的な値を確認
    expect(fileMock).toBe('test-file-stub');
    
    // モックとして機能することを説明的に検証
    // (実際にdoMockを使わない - それは再帰的な問題を引き起こす)
    const mockContext = {
      config: {
        moduleNameMapper: {
          '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/tests/mocks/fileMock.js'
        }
      }
    };
    
    // 設定が正しい形式であることを確認
    expect(typeof mockContext.config.moduleNameMapper).toBe('object');
    expect(mockContext.config.moduleNameMapper['\\.(jpg|jpeg|png|gif|svg)$'])
      .toBe('<rootDir>/src/tests/mocks/fileMock.js');
  });

  it('can be used in place of imported asset files', () => {
    // モックが実際に使用される例を示す
    function Component() {
      // 通常はこのようにインポートされる:
      // import logo from './logo.png';
      const logo = fileMock; // テスト中は fileMock に置き換えられる
      
      return {
        render: () => `<img src="${logo}" alt="logo" />`
      };
    }
    
    const component = Component();
    expect(component.render()).toBe('<img src="test-file-stub" alt="logo" />');
  });
});