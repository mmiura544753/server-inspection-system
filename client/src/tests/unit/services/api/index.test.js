import axios from 'axios';

// axiosをモック化
jest.mock('axios', () => {
  // デフォルトのモックインスタンス
  const mockInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };
  
  return {
    create: jest.fn(() => mockInstance)
  };
});

// 環境変数をモック
const originalEnv = process.env;

describe('API Client', () => {
  // 各テスト前にconsole関数をモック
  beforeEach(() => {
    // コンソールログとエラーをモック
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // 環境変数をモックするためのセットアップ
    process.env = { ...originalEnv };
  });
  
  // テスト後に環境を元に戻す
  afterEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    // 環境変数を元に戻す
    process.env = originalEnv;
  });
  
  it('環境変数からAPIのURLを設定する', () => {
    // 環境変数を設定
    process.env = { 
      ...originalEnv, 
      REACT_APP_API_URL: 'http://test-api.example.com/api' 
    };
    
    // モジュールを再インポート前にモックをクリア
    jest.clearAllMocks();
    
    // モック化されたaxiosインスタンス（インターセプター付き）
    axios.create.mockReturnValueOnce({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    });
    
    // モジュールを再インポート（環境変数の変更を反映するため）
    jest.isolateModules(() => {
      require('../../../../services/api/index');
    });
    
    // axiosの呼び出しを検証
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://test-api.example.com/api',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 120000
      })
    );
    
    // コンソールログが適切に呼ばれたか検証
    expect(console.log).toHaveBeenCalledWith('環境変数から読み込まれた API URL:', 'http://test-api.example.com/api');
    expect(console.log).toHaveBeenCalledWith('使用する API URL:', 'http://test-api.example.com/api');
  });
  
  it('環境変数がない場合デフォルトURLを使用する', () => {
    // 環境変数を設定（APIのURL環境変数は含まない）
    const envWithoutApiUrl = { ...originalEnv };
    delete envWithoutApiUrl.REACT_APP_API_URL;
    process.env = envWithoutApiUrl;
    
    // モジュールを再インポート前にモックをクリア
    jest.clearAllMocks();
    
    // モック化されたaxiosインスタンス（インターセプター付き）
    axios.create.mockReturnValueOnce({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    });
    
    // モジュールを再インポート
    jest.isolateModules(() => {
      require('../../../../services/api/index');
    });
    
    // axiosの呼び出しを検証
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://3.115.76.39:5000/api'
      })
    );
    
    // コンソールログが適切に呼ばれたか検証
    expect(console.log).toHaveBeenCalledWith('環境変数から読み込まれた API URL:', undefined);
    expect(console.log).toHaveBeenCalledWith('使用する API URL:', 'http://3.115.76.39:5000/api');
  });
  
  it('インターセプターが設定される', () => {
    // モジュールを再インポート前にモックをクリア
    jest.clearAllMocks();
    
    // axiosインスタンスのインターセプターメソッドをモック
    const mockInterceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    };
    
    // モック化されたaxiosインスタンス
    axios.create.mockReturnValueOnce({
      interceptors: mockInterceptors
    });
    
    // モジュールを再インポート
    jest.isolateModules(() => {
      require('../../../../services/api/index');
    });
    
    // インターセプターが設定されたことを検証
    expect(mockInterceptors.request.use).toHaveBeenCalledTimes(1);
    expect(mockInterceptors.response.use).toHaveBeenCalledTimes(1);
    
    // 各インターセプターが2つの関数を受け取ることを検証
    expect(mockInterceptors.request.use).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
    
    expect(mockInterceptors.response.use).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('リクエストインターセプターが正しく動作する', () => {
    // モジュールを再インポート前にモックをクリア
    jest.clearAllMocks();
    
    // axiosインスタンスのインターセプターメソッドをモック
    const mockRequestHandlers = {
      success: null,
      error: null
    };
    
    const mockInterceptors = {
      request: { 
        use: jest.fn((successFn, errorFn) => {
          mockRequestHandlers.success = successFn;
          mockRequestHandlers.error = errorFn;
        }) 
      },
      response: { use: jest.fn() }
    };
    
    // モック化されたaxiosインスタンス
    axios.create.mockReturnValueOnce({
      interceptors: mockInterceptors
    });
    
    // モジュールを再インポート
    jest.isolateModules(() => {
      require('../../../../services/api/index');
    });
    
    // リクエストオブジェクト
    const mockRequest = {
      url: '/test',
      method: 'GET'
    };
    
    // リクエスト成功ハンドラーを呼び出し
    const resultRequest = mockRequestHandlers.success(mockRequest);
    
    // 結果を検証
    expect(resultRequest).toBe(mockRequest);
    expect(console.log).toHaveBeenCalledWith('API リクエスト送信:', mockRequest);
    
    // リクエストエラーハンドラーのテスト
    const mockError = new Error('リクエストエラー');
    
    // catch用のPromiseオブジェクトをモック
    const mockRejectedPromise = {
      message: 'rejected promise'
    };
    jest.spyOn(Promise, 'reject').mockReturnValueOnce(mockRejectedPromise);
    
    // リクエストエラーハンドラーを呼び出し
    const resultError = mockRequestHandlers.error(mockError);
    
    // 結果を検証
    expect(resultError).toBe(mockRejectedPromise);
    expect(console.error).toHaveBeenCalledWith('API リクエストエラー:', mockError);
    expect(Promise.reject).toHaveBeenCalledWith(mockError);
  });
  
  it('レスポンスインターセプターが正しく動作する', () => {
    // モジュールを再インポート前にモックをクリア
    jest.clearAllMocks();
    
    // axiosインスタンスのインターセプターメソッドをモック
    const mockResponseHandlers = {
      success: null,
      error: null
    };
    
    const mockInterceptors = {
      request: { use: jest.fn() },
      response: { 
        use: jest.fn((successFn, errorFn) => {
          mockResponseHandlers.success = successFn;
          mockResponseHandlers.error = errorFn;
        }) 
      }
    };
    
    // モック化されたaxiosインスタンス
    axios.create.mockReturnValueOnce({
      interceptors: mockInterceptors
    });
    
    // モジュールを再インポート
    jest.isolateModules(() => {
      require('../../../../services/api/index');
    });
    
    // レスポンスオブジェクト
    const mockResponse = {
      data: { id: 1, name: 'テスト' },
      status: 200,
      statusText: 'OK'
    };
    
    // レスポンス成功ハンドラーを呼び出し
    const resultResponse = mockResponseHandlers.success(mockResponse);
    
    // 結果を検証
    expect(resultResponse).toBe(mockResponse);
    expect(console.log).toHaveBeenCalledWith('API レスポンス受信:', mockResponse);
    
    // レスポンスエラーハンドラーのテスト
    const mockError = new Error('レスポンスエラー');
    
    // catch用のPromiseオブジェクトをモック
    const mockRejectedPromise = {
      message: 'rejected promise'
    };
    jest.spyOn(Promise, 'reject').mockReturnValueOnce(mockRejectedPromise);
    
    // レスポンスエラーハンドラーを呼び出し
    const resultError = mockResponseHandlers.error(mockError);
    
    // 結果を検証
    expect(resultError).toBe(mockRejectedPromise);
    expect(console.error).toHaveBeenCalledWith('API レスポンスエラー:', mockError);
    expect(Promise.reject).toHaveBeenCalledWith(mockError);
  });
  
  it('APIクライアントが全てのAPIサービスをエクスポートする', () => {
    // モックモジュール
    jest.doMock('../../../../services/api/customerAPI', () => ({
      customerAPI: { mockCustomerAPI: true }
    }));
    
    jest.doMock('../../../../services/api/deviceAPI', () => ({
      deviceAPI: { mockDeviceAPI: true }
    }));
    
    jest.doMock('../../../../services/api/inspectionAPI', () => ({
      inspectionAPI: { mockInspectionAPI: true }
    }));
    
    jest.doMock('../../../../services/api/inspectionItemAPI', () => ({
      inspectionItemAPI: { mockInspectionItemAPI: true }
    }));
    
    jest.doMock('../../../../services/api/inspectionFormAPI', () => ({
      inspectionFormAPI: { mockInspectionFormAPI: true }
    }));
    
    // モジュールを再インポート前にモックをクリア
    jest.clearAllMocks();
    
    // axiosインスタンスをモック
    axios.create.mockReturnValueOnce({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    });
    
    // モジュールをインポート
    let apiModule;
    jest.isolateModules(() => {
      apiModule = require('../../../../services/api/index');
    });
    
    // エクスポートを検証
    expect(apiModule).toHaveProperty('default');
    expect(apiModule).toHaveProperty('customerAPI');
    expect(apiModule).toHaveProperty('deviceAPI');
    expect(apiModule).toHaveProperty('inspectionAPI');
    expect(apiModule).toHaveProperty('inspectionItemAPI');
    expect(apiModule).toHaveProperty('inspectionFormAPI');
  });
});