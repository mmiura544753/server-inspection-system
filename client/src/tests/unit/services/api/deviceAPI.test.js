import { deviceAPI } from '../../../../services/api/deviceAPI';
import api from '../../../../services/api/index';

// apiモジュールをモック化
jest.mock('../../../../services/api/index', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

describe('deviceAPI', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getAll', () => {
    it('正常に機器一覧を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, device_name: '機器1', customer_id: 1 },
        { id: 2, device_name: '機器2', customer_id: 2 }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await deviceAPI.getAll();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices');
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
      await expect(deviceAPI.getAll()).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('getById', () => {
    it('正常に機器詳細を取得する', async () => {
      // モックデータ
      const mockData = { 
        id: 1, 
        device_name: '機器1',
        model_number: 'ABC-123', 
        customer_id: 1 
      };
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await deviceAPI.getById(1);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/1');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('機器詳細取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(deviceAPI.getById(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('getByCustomerId', () => {
    it('正常に顧客に紐づく機器一覧を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, device_name: '機器1', customer_id: 1 },
        { id: 3, device_name: '機器3', customer_id: 1 }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await deviceAPI.getByCustomerId(1);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/customers/1/devices');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('顧客の機器一覧取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(deviceAPI.getByCustomerId(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/customers/1/devices');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('create', () => {
    it('正常に機器を作成する', async () => {
      // 入力データ
      const input = { 
        device_name: '新規機器',
        model_number: 'XYZ-789',
        customer_id: 2
      };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 5, 
        device_name: '新規機器',
        model_number: 'XYZ-789',
        customer_id: 2,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };
      
      // モック関数の戻り値を設定
      api.post.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await deviceAPI.create(input);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/devices', input);
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーレスポンスがある場合、カスタムエラーメッセージをセットする', async () => {
      // 入力データ
      const input = { 
        device_name: '重複機器',
        customer_id: 1
      };
      
      // エラーレスポンス
      const errorResponse = {
        response: {
          data: {
            message: '同じ名前の機器が既に存在します'
          }
        }
      };
      const mockError = new Error();
      Object.assign(mockError, errorResponse);
      
      // モック関数の戻り値を設定
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await deviceAPI.create(input);
        fail('エラーがスローされませんでした');
      } catch (error) {
        expect(error.message).toBe('同じ名前の機器が既に存在します');
      }
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/devices', input);
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('update', () => {
    it('正常に機器を更新する', async () => {
      // 入力データ
      const input = { 
        device_name: '更新機器',
        model_number: 'UPD-123'
      };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 1, 
        device_name: '更新機器',
        model_number: 'UPD-123',
        customer_id: 1,
        updated_at: '2023-01-02T00:00:00.000Z'
      };
      
      // モック関数の戻り値を設定
      api.put.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await deviceAPI.update(1, input);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/devices/1', input);
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーレスポンスがある場合、カスタムエラーメッセージをセットする', async () => {
      // 入力データ
      const input = { 
        device_name: '無効な機器名',
      };
      
      // エラーレスポンス
      const errorResponse = {
        response: {
          data: {
            message: '無効な機器データです'
          }
        }
      };
      const mockError = new Error();
      Object.assign(mockError, errorResponse);
      
      // モック関数の戻り値を設定
      api.put.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      try {
        await deviceAPI.update(1, input);
        fail('エラーがスローされませんでした');
      } catch (error) {
        expect(error.message).toBe('無効な機器データです');
      }
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/devices/1', input);
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('delete', () => {
    it('正常に機器を削除する', async () => {
      // モック応答
      const mockResponse = { message: '機器が削除されました' };
      
      // モック関数の戻り値を設定
      api.delete.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await deviceAPI.delete(1);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/devices/1');
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('機器削除エラー');
      api.delete.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(deviceAPI.delete(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/devices/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('exportData', () => {
    it('正常に機器をエクスポートする', async () => {
      // モックBlobデータ
      const mockBlob = new Blob(['サンプルCSVデータ'], { type: 'text/csv' });
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockBlob });
      
      // コンソールログをモック
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // 関数を実行
      const result = await deviceAPI.exportData('excel', 'utf-8');
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/export', {
        params: { format: 'excel', encoding: 'utf-8' },
        responseType: 'blob'
      });
      expect(result).toEqual(mockBlob);
      expect(console.log).toHaveBeenCalled();
      
      // コンソールログを元に戻す
      console.log = originalConsoleLog;
    });
    
    it('デフォルトパラメータで適切にエクスポートする', async () => {
      // モックBlobデータ
      const mockBlob = new Blob(['サンプルCSVデータ'], { type: 'text/csv' });
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockBlob });
      
      // コンソールログをモック
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // デフォルトパラメータで関数を実行
      const result = await deviceAPI.exportData();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/export', {
        params: { format: 'csv', encoding: 'shift_jis' },
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
      await expect(deviceAPI.exportData()).rejects.toThrow('エクスポートエラー');
      
      // 検証
      expect(api.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      global.Response = originalResponse;
    });
    
    it('Blob以外のエラーレスポンスを適切に処理する', async () => {
      // 通常の（Blobでない）エラーレスポンス
      const mockError = new Error('Request failed');
      mockError.response = null;
      
      // モック関数の戻り値を設定
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(deviceAPI.exportData()).rejects.toThrow('Request failed');
      
      // 検証
      expect(api.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
  });
  
  describe('importData', () => {
    it('正常に機器をインポートする', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'devices.csv', { type: 'text/csv' });
      
      // モックFormData
      const mockFormData = new FormData();
      global.FormData = jest.fn(() => mockFormData);
      mockFormData.append = jest.fn();
      
      // モックレスポンス
      const mockResponse = {
        data: {
          success: true,
          imported: 5,
          errors: []
        }
      };
      
      // モック関数の戻り値を設定
      api.post.mockResolvedValueOnce(mockResponse);
      
      // コンソールログをモック
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // 関数を実行
      const result = await deviceAPI.importData(mockFile);
      
      // 検証
      expect(mockFormData.append).toHaveBeenCalledWith('file', mockFile);
      expect(api.post).toHaveBeenCalledWith('/devices/import', mockFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 180000
      });
      expect(result).toEqual(mockResponse.data);
      expect(console.log).toHaveBeenCalled();
      
      // コンソールログを元に戻す
      console.log = originalConsoleLog;
    });
    
    it('タイムアウトエラーを適切に処理する', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'devices.csv', { type: 'text/csv' });
      
      // モックFormData
      const mockFormData = new FormData();
      global.FormData = jest.fn(() => mockFormData);
      mockFormData.append = jest.fn();
      
      // タイムアウトエラー
      const mockError = new Error('タイムアウト');
      mockError.code = 'ECONNABORTED';
      
      // モック関数の戻り値を設定
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(deviceAPI.importData(mockFile)).rejects.toThrow('リクエストがタイムアウトしました');
      
      // 検証
      expect(api.post).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
    
    it('Blobエラーレスポンスを適切に処理する', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'devices.csv', { type: 'text/csv' });
      
      // モックFormData
      const mockFormData = new FormData();
      global.FormData = jest.fn(() => mockFormData);
      mockFormData.append = jest.fn();
      
      // Blobエラーレスポンス
      const errorBlob = new Blob(['{"error":"CSVフォーマットエラー"}'], { type: 'application/json' });
      const mockError = new Error('Request failed');
      mockError.response = {
        status: 400,
        data: errorBlob
      };
      
      // モック関数の戻り値を設定
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // Blobからテキストを読み込む処理をモック
      const originalResponse = global.Response;
      global.Response = jest.fn().mockImplementation(() => ({
        text: jest.fn().mockResolvedValue('{"error":"CSVフォーマットエラー"}')
      }));
      
      // 関数実行時にエラーをキャッチ
      await expect(deviceAPI.importData(mockFile)).rejects.toThrow('CSVフォーマットエラー');
      
      // 検証
      expect(api.post).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      global.Response = originalResponse;
    });
    
    it('通常のエラーレスポンスを適切に処理する', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'devices.csv', { type: 'text/csv' });
      
      // モックFormData
      const mockFormData = new FormData();
      global.FormData = jest.fn(() => mockFormData);
      mockFormData.append = jest.fn();
      
      // 通常のエラーレスポンス
      const mockError = new Error('Request failed');
      mockError.response = {
        status: 400,
        data: {
          message: '無効なCSVファイルです'
        }
      };
      
      // モック関数の戻り値を設定
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(deviceAPI.importData(mockFile)).rejects.toThrow('無効なCSVファイルです');
      
      // 検証
      expect(api.post).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
  });
});