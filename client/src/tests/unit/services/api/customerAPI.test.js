import { customerAPI } from '../../../../services/api/customerAPI';
import api from '../../../../services/api/index';

// apiモジュールをモック化
jest.mock('../../../../services/api/index', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

describe('customerAPI', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getAll', () => {
    it('正常に顧客一覧を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, customer_name: 'テスト顧客1' },
        { id: 2, customer_name: 'テスト顧客2' }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await customerAPI.getAll();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/customers');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('ネットワークエラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(customerAPI.getAll()).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/customers');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('getById', () => {
    it('正常に顧客詳細を取得する', async () => {
      // モックデータ
      const mockData = { id: 1, customer_name: 'テスト顧客1' };
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await customerAPI.getById(1);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/customers/1');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('顧客詳細取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(customerAPI.getById(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/customers/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('create', () => {
    it('正常に顧客を作成する', async () => {
      // 入力データ
      const input = { customer_name: '新規顧客' };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 3, 
        customer_name: '新規顧客',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };
      
      // モック関数の戻り値を設定
      api.post.mockResolvedValueOnce({ data: mockResponse });
      
      // コンソールログをモック
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // 関数を実行
      const result = await customerAPI.create(input);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/customers', input);
      expect(result).toEqual(mockResponse);
      expect(console.log).toHaveBeenCalledWith('API呼び出し - 顧客作成:', input);
      
      // コンソールログを元に戻す
      console.log = originalConsoleLog;
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // 入力データ
      const input = { customer_name: '' };
      
      // サーバーエラーレスポンス
      const errorResponse = {
        data: { message: '顧客名は必須です' },
        status: 400
      };
      
      // エラーを模擬
      const mockError = new Error('顧客作成エラー');
      mockError.response = errorResponse;
      
      // モック関数の戻り値を設定
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールログとエラーをモック
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(customerAPI.create(input)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/customers', input);
      expect(console.error).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('API呼び出し - 顧客作成:', input);
      
      // コンソールログとエラーを元に戻す
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    });
  });
  
  describe('update', () => {
    it('正常に顧客を更新する', async () => {
      // 入力データ
      const input = { customer_name: '更新顧客' };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 1, 
        customer_name: '更新顧客',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      };
      
      // モック関数の戻り値を設定
      api.put.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await customerAPI.update(1, input);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/customers/1', input);
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // 入力データ
      const input = { customer_name: '更新できない顧客' };
      
      // エラーを模擬
      const mockError = new Error('顧客更新エラー');
      api.put.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(customerAPI.update(1, input)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/customers/1', input);
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('delete', () => {
    it('正常に顧客を削除する', async () => {
      // モック応答
      const mockResponse = { message: '顧客が削除されました' };
      
      // モック関数の戻り値を設定
      api.delete.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await customerAPI.delete(1);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/customers/1');
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('顧客削除エラー');
      api.delete.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(customerAPI.delete(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/customers/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('exportData', () => {
    it('正常に顧客データをエクスポートする', async () => {
      // モックBlobデータ
      const mockBlob = new Blob(['サンプルCSVデータ'], { type: 'text/csv' });
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockBlob });
      
      // コンソールログをモック
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // 関数を実行
      const result = await customerAPI.exportData('excel');
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/customers/export', {
        params: { format: 'excel' },
        responseType: 'blob'
      });
      expect(result).toEqual(mockBlob);
      expect(console.log).toHaveBeenCalledWith('顧客エクスポート開始: 形式=excel');
      
      // コンソールログを元に戻す
      console.log = originalConsoleLog;
    });
    
    it('デフォルトパラメータでエクスポートする', async () => {
      // モックBlobデータ
      const mockBlob = new Blob(['サンプルCSVデータ'], { type: 'text/csv' });
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockBlob });
      
      // コンソールログをモック
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // 関数を実行（パラメータなし）
      const result = await customerAPI.exportData();
      
      // 検証（デフォルトパラメータが使われていることを確認）
      expect(api.get).toHaveBeenCalledWith('/customers/export', {
        params: { format: 'csv' },
        responseType: 'blob'
      });
      expect(result).toEqual(mockBlob);
      
      // コンソールログを元に戻す
      console.log = originalConsoleLog;
    });
    
    it('エクスポート中にエラーが発生した場合、適切に処理する', async () => {
      // モックエラーレスポンス
      const errorBlob = new Blob(['{"error":"エクスポートエラー"}'], { type: 'application/json' });
      const mockError = new Error('Request failed');
      mockError.response = { data: errorBlob };
      
      // モック関数の戻り値を設定
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // Blobからテキストを読み込む処理をモック
      const originalResponse = global.Response;
      global.Response = jest.fn().mockImplementation(() => ({
        text: jest.fn().mockResolvedValue('{"error":"エクスポートエラー"}')
      }));
      
      // 関数実行時にエラーをキャッチ
      await expect(customerAPI.exportData()).rejects.toThrow('エクスポートエラー');
      
      // 検証
      expect(api.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      global.Response = originalResponse;
    });
    
    it('レスポンスがない場合のエラー処理', async () => {
      // モックエラーレスポンス（response.dataなし）
      const mockError = new Error('Network Error');
      
      // モック関数の戻り値を設定
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(customerAPI.exportData()).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
  });
});