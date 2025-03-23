import { inspectionItemAPI } from '../../../../services/api/inspectionItemAPI';
import api from '../../../../services/api/index';

// apiモジュールをモック化
jest.mock('../../../../services/api/index', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

describe('inspectionItemAPI', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getAllItemNames', () => {
    it('正常に確認作業項目一覧を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, name: '確認作業項目1' },
        { id: 2, name: '確認作業項目2' }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionItemAPI.getAllItemNames();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-item-names');
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
      await expect(inspectionItemAPI.getAllItemNames()).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-item-names');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('itemNames.getAll', () => {
    it('正常に確認作業項目一覧を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, name: '確認作業項目1' },
        { id: 2, name: '確認作業項目2' }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionItemAPI.itemNames.getAll();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-item-names');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('確認作業項目一覧取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.itemNames.getAll()).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-item-names');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('itemNames.getById', () => {
    it('正常に確認作業項目詳細を取得する', async () => {
      // モックデータ
      const mockData = { id: 1, name: '確認作業項目1' };
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionItemAPI.itemNames.getById(1);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-item-names/1');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('確認作業項目詳細取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.itemNames.getById(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-item-names/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('itemNames.create', () => {
    it('正常に確認作業項目を作成する', async () => {
      // 入力データ
      const input = { name: '新規確認作業項目' };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 3, 
        name: '新規確認作業項目',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };
      
      // モック関数の戻り値を設定
      api.post.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await inspectionItemAPI.itemNames.create(input);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/inspection-item-names', input);
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // 入力データ
      const input = { name: '無効な確認作業項目' };
      
      // エラーを模擬
      const mockError = new Error('確認作業項目作成エラー');
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.itemNames.create(input)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/inspection-item-names', input);
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('itemNames.update', () => {
    it('正常に確認作業項目を更新する', async () => {
      // 入力データ
      const input = { name: '更新された確認作業項目' };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 1, 
        name: '更新された確認作業項目',
        updated_at: '2023-01-02T00:00:00.000Z'
      };
      
      // モック関数の戻り値を設定
      api.put.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await inspectionItemAPI.itemNames.update(1, input);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/inspection-item-names/1', input);
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // 入力データ
      const input = { name: '更新エラー' };
      
      // エラーを模擬
      const mockError = new Error('確認作業項目更新エラー');
      api.put.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.itemNames.update(1, input)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/inspection-item-names/1', input);
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('itemNames.delete', () => {
    it('正常に確認作業項目を削除する', async () => {
      // モック応答
      const mockResponse = { message: '確認作業項目が削除されました' };
      
      // モック関数の戻り値を設定
      api.delete.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await inspectionItemAPI.itemNames.delete(1);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/inspection-item-names/1');
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('確認作業項目削除エラー');
      api.delete.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.itemNames.delete(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/inspection-item-names/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('itemNames.exportToCsv', () => {
    it('正常に確認作業項目をCSVエクスポートする', async () => {
      // モックBlobデータ
      const mockBlob = new Blob(['サンプルCSVデータ'], { type: 'text/csv' });
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockBlob });
      
      // コンソールログをモック
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // 関数を実行
      const result = await inspectionItemAPI.itemNames.exportToCsv('utf-8');
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-item-names/export', {
        params: { encoding: 'utf-8' },
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
      const result = await inspectionItemAPI.itemNames.exportToCsv();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-item-names/export', {
        params: { encoding: 'shift_jis' },
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
      await expect(inspectionItemAPI.itemNames.exportToCsv()).rejects.toThrow('エクスポートエラー');
      
      // 検証
      expect(api.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      global.Response = originalResponse;
    });
    
    it('レスポンスがない場合、元のエラーをスローする', async () => {
      // 通常のエラー（responseなし）
      const mockError = new Error('ネットワークエラー');
      
      // モック関数の戻り値を設定
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.itemNames.exportToCsv()).rejects.toThrow('ネットワークエラー');
      
      // 検証
      expect(api.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
  });
  
  describe('itemNames.importFromCsv', () => {
    it('正常に確認作業項目をCSVからインポートする', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'inspection_item_names.csv', { type: 'text/csv' });
      
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
      const result = await inspectionItemAPI.itemNames.importFromCsv(mockFile);
      
      // 検証
      expect(mockFormData.append).toHaveBeenCalledWith('file', mockFile);
      expect(api.post).toHaveBeenCalledWith('/inspection-item-names/import', mockFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });
      expect(result).toEqual(mockResponse.data);
      expect(console.log).toHaveBeenCalled();
      
      // コンソールログを元に戻す
      console.log = originalConsoleLog;
    });
    
    it('Blobエラーレスポンスを適切に処理する', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'inspection_item_names.csv', { type: 'text/csv' });
      
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
      await expect(inspectionItemAPI.itemNames.importFromCsv(mockFile)).rejects.toThrow('CSVフォーマットエラー');
      
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
      const mockFile = new File(['サンプルCSVデータ'], 'inspection_item_names.csv', { type: 'text/csv' });
      
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
      await expect(inspectionItemAPI.itemNames.importFromCsv(mockFile)).rejects.toThrow('無効なCSVファイルです');
      
      // 検証
      expect(api.post).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
    
    it('レスポンスがない場合、元のエラーをスローする', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'inspection_item_names.csv', { type: 'text/csv' });
      
      // モックFormData
      const mockFormData = new FormData();
      global.FormData = jest.fn(() => mockFormData);
      mockFormData.append = jest.fn();
      
      // 通常のエラー（responseなし）
      const mockError = new Error('ネットワークエラー');
      
      // モック関数の戻り値を設定
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.itemNames.importFromCsv(mockFile)).rejects.toThrow('ネットワークエラー');
      
      // 検証
      expect(api.post).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
  });
  
  describe('getAll', () => {
    it('正常に点検項目一覧を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, name: '点検項目1', item_name_id: 1 },
        { id: 2, name: '点検項目2', item_name_id: 2 }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionItemAPI.getAll();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('点検項目一覧取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.getAll()).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('getById', () => {
    it('正常に点検項目詳細を取得する', async () => {
      // モックデータ
      const mockData = { id: 1, name: '点検項目1', item_name_id: 1 };
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionItemAPI.getById(1);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items/1');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('点検項目詳細取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.getById(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('getByDeviceId', () => {
    it('正常に機器ごとの点検項目を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, name: '点検項目1', device_id: 1 },
        { id: 3, name: '点検項目3', device_id: 1 }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionItemAPI.getByDeviceId(1);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/1/inspection-items');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('機器ごとの点検項目取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.getByDeviceId(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/1/inspection-items');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('create', () => {
    it('正常に点検項目を作成する', async () => {
      // 入力データ
      const input = { 
        device_id: 1,
        item_name_id: 2
      };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 5, 
        device_id: 1,
        item_name_id: 2,
        created_at: '2023-01-01T00:00:00.000Z'
      };
      
      // モック関数の戻り値を設定
      api.post.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await inspectionItemAPI.create(input);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/inspection-items', input);
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // 入力データ
      const input = { 
        device_id: 999, // 存在しない機器ID
        item_name_id: 2
      };
      
      // エラーを模擬
      const mockError = new Error('点検項目作成エラー');
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.create(input)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/inspection-items', input);
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('update', () => {
    it('正常に点検項目を更新する', async () => {
      // 入力データ
      const input = { item_name_id: 3 };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 1, 
        device_id: 1,
        item_name_id: 3,
        updated_at: '2023-01-02T00:00:00.000Z'
      };
      
      // モック関数の戻り値を設定
      api.put.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await inspectionItemAPI.update(1, input);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/inspection-items/1', input);
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // 入力データ
      const input = { item_name_id: 999 }; // 存在しない項目名ID
      
      // エラーを模擬
      const mockError = new Error('点検項目更新エラー');
      api.put.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.update(1, input)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/inspection-items/1', input);
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('delete', () => {
    it('正常に点検項目を削除する', async () => {
      // モック応答
      const mockResponse = { message: '点検項目が削除されました' };
      
      // モック関数の戻り値を設定
      api.delete.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await inspectionItemAPI.delete(1);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/inspection-items/1');
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('点検項目削除エラー');
      api.delete.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.delete(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/inspection-items/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });

  describe('exportData', () => {
    it('正常に点検項目をエクスポートする', async () => {
      // モックBlobデータ
      const mockBlob = new Blob(['サンプルCSVデータ'], { type: 'text/csv' });
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockBlob });
      
      // コンソールログをモック
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // 関数を実行
      const result = await inspectionItemAPI.exportData('excel', 'utf-8');
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items/export', {
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
      const result = await inspectionItemAPI.exportData();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items/export', {
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
      await expect(inspectionItemAPI.exportData()).rejects.toThrow('エクスポートエラー');
      
      // 検証
      expect(api.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      global.Response = originalResponse;
    });
    
    it('レスポンスがない場合、元のエラーをスローする', async () => {
      // 通常のエラー（responseなし）
      const mockError = new Error('ネットワークエラー');
      
      // モック関数の戻り値を設定
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.exportData()).rejects.toThrow('ネットワークエラー');
      
      // 検証
      expect(api.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
  });
  
  describe('importData', () => {
    it('正常に点検項目をインポートする', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'inspection_items.csv', { type: 'text/csv' });
      
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
      const result = await inspectionItemAPI.importData(mockFile);
      
      // 検証
      expect(mockFormData.append).toHaveBeenCalledWith('file', mockFile);
      expect(api.post).toHaveBeenCalledWith('/inspection-items/import', mockFormData, {
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
      const mockFile = new File(['サンプルCSVデータ'], 'inspection_items.csv', { type: 'text/csv' });
      
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
      await expect(inspectionItemAPI.importData(mockFile)).rejects.toThrow('リクエストがタイムアウトしました');
      
      // 検証
      expect(api.post).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
    
    it('Blobエラーレスポンスを適切に処理する', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'inspection_items.csv', { type: 'text/csv' });
      
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
      await expect(inspectionItemAPI.importData(mockFile)).rejects.toThrow('CSVフォーマットエラー');
      
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
      const mockFile = new File(['サンプルCSVデータ'], 'inspection_items.csv', { type: 'text/csv' });
      
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
      await expect(inspectionItemAPI.importData(mockFile)).rejects.toThrow('無効なCSVファイルです');
      
      // 検証
      expect(api.post).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
    
    it('レスポンスがない場合、元のエラーをスローする', async () => {
      // モックファイル
      const mockFile = new File(['サンプルCSVデータ'], 'inspection_items.csv', { type: 'text/csv' });
      
      // モックFormData
      const mockFormData = new FormData();
      global.FormData = jest.fn(() => mockFormData);
      mockFormData.append = jest.fn();
      
      // 通常のエラー（responseなし）
      const mockError = new Error('ネットワークエラー');
      
      // モック関数の戻り値を設定
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールエラーとログをモック
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionItemAPI.importData(mockFile)).rejects.toThrow('ネットワークエラー');
      
      // 検証
      expect(api.post).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // モックを元に戻す
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    });
  });
});