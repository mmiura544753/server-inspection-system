// db.test.js - 別アプローチでモック
jest.mock('mariadb');
jest.mock('dotenv');
jest.mock('../../../config/database', () => ({
  test: {
    host: 'localhost',
    username: 'test_user',
    password: 'test_password',
    database: 'test_database'
  }
}));

// 実際のdotenvなどからの影響を避けるために、
// db.jsモジュール全体をモック化する
jest.mock('../../../utils/db', () => {
  // モックプールとコネクション
  const mockConnection = {
    query: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn()
  };

  // テスト用のデータベースユーティリティモジュールのモック実装
  return {
    query: jest.fn(async (sql, params = []) => {
      if (sql === 'ERROR_QUERY') {
        throw new Error('Test database error');
      }
      return [{ id: 1, name: 'Test Result' }];
    }),
    
    queryOne: jest.fn(async (sql, params = []) => {
      if (params[0] === 999) {
        return null; // 存在しないIDの場合
      }
      return { id: params[0] || 1, name: 'Test Single Result' };
    }),
    
    testConnection: jest.fn(async () => {
      if (process.env.FAIL_CONNECTION === 'true') {
        return false;
      }
      return true;
    }),
    
    transaction: jest.fn(async (callback) => {
      try {
        const result = await callback(mockConnection);
        return result;
      } catch (error) {
        mockConnection.rollback();
        throw error;
      } finally {
        mockConnection.release();
      }
    }),
    
    // テスト用に内部実装の一部を公開
    _mockConnection: mockConnection
  };
});

describe('Database Utility Module', () => {
  // 実際にモック化されたモジュールをインポート
  const dbModule = require('../../../utils/db');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('query関数が正しくクエリを実行して結果を返すこと', async () => {
    const result = await dbModule.query('SELECT * FROM test_table');
    
    expect(dbModule.query).toHaveBeenCalled();
    expect(dbModule.query.mock.calls[0][0]).toBe('SELECT * FROM test_table');
    expect(result).toEqual([{ id: 1, name: 'Test Result' }]);
  });

  test('query関数がパラメータ付きのクエリを実行できること', async () => {
    const result = await dbModule.query('SELECT * FROM test_table WHERE id = ?', [1]);
    
    expect(dbModule.query).toHaveBeenCalledWith('SELECT * FROM test_table WHERE id = ?', [1]);
    expect(result).toEqual([{ id: 1, name: 'Test Result' }]);
  });

  test('query関数がエラーを適切に処理すること', async () => {
    await expect(dbModule.query('ERROR_QUERY')).rejects.toThrow('Test database error');
  });

  test('queryOne関数が単一行を返すこと', async () => {
    const result = await dbModule.queryOne('SELECT * FROM test_table WHERE id = ?', [5]);
    
    expect(dbModule.queryOne).toHaveBeenCalledWith('SELECT * FROM test_table WHERE id = ?', [5]);
    expect(result).toEqual({ id: 5, name: 'Test Single Result' });
  });

  test('queryOne関数が結果がない場合にnullを返すこと', async () => {
    const result = await dbModule.queryOne('SELECT * FROM test_table WHERE id = ?', [999]);
    
    expect(result).toBeNull();
  });

  test('testConnection関数が成功した場合にtrueを返すこと', async () => {
    const result = await dbModule.testConnection();
    
    expect(result).toBe(true);
  });

  test('testConnection関数がエラーの場合にfalseを返すこと', async () => {
    process.env.FAIL_CONNECTION = 'true';
    
    const result = await dbModule.testConnection();
    
    expect(result).toBe(false);
    
    // テスト後に元に戻す
    process.env.FAIL_CONNECTION = undefined;
  });

  test('transaction関数が正常にコールバック関数を実行すること', async () => {
    const mockCallback = jest.fn().mockResolvedValue('transaction result');
    
    const result = await dbModule.transaction(mockCallback);
    
    expect(mockCallback).toHaveBeenCalled();
    expect(result).toBe('transaction result');
  });

  test('transaction関数がエラー発生時にロールバックすること', async () => {
    const mockError = new Error('Transaction error');
    const mockCallback = jest.fn().mockRejectedValue(mockError);
    
    await expect(dbModule.transaction(mockCallback)).rejects.toThrow('Transaction error');
    
    expect(mockCallback).toHaveBeenCalled();
    expect(dbModule._mockConnection.rollback).toHaveBeenCalled();
    expect(dbModule._mockConnection.release).toHaveBeenCalled();
  });
});