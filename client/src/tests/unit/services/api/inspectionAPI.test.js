import { inspectionAPI } from '../../../../services/api/inspectionAPI';
import api from '../../../../services/api/index';

// apiモジュールをモック化
jest.mock('../../../../services/api/index', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

describe('inspectionAPI', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getAll', () => {
    it('正常に点検一覧を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, inspection_date: '2023-01-01', device_id: 1 },
        { id: 2, inspection_date: '2023-01-02', device_id: 2 }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionAPI.getAll();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspections');
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
      await expect(inspectionAPI.getAll()).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspections');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('getById', () => {
    it('正常に点検詳細を取得する', async () => {
      // モックデータ
      const mockData = { 
        id: 1, 
        inspection_date: '2023-01-01', 
        device_id: 1,
        inspection_items: [
          { id: 1, name: '項目1', result: 'OK' },
          { id: 2, name: '項目2', result: 'NG' }
        ]
      };
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionAPI.getById(1);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspections/1');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('点検データ取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionAPI.getById(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspections/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });

  describe('getByDeviceId', () => {
    it('正常に機器ごとの点検履歴を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, inspection_date: '2023-01-01', device_id: 1 },
        { id: 3, inspection_date: '2023-01-03', device_id: 1 }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionAPI.getByDeviceId(1);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/1/inspections');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('点検履歴取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionAPI.getByDeviceId(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/1/inspections');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });

  describe('getLatestByDeviceId', () => {
    it('正常に機器の最新点検結果を取得する', async () => {
      // モックデータ
      const mockData = { 
        id: 3, 
        inspection_date: '2023-01-03', 
        device_id: 1,
        is_latest: true
      };
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionAPI.getLatestByDeviceId(1);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/1/inspections/latest');
      expect(result).toEqual(mockData);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーを模擬
      const mockError = new Error('最新点検取得エラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionAPI.getLatestByDeviceId(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices/1/inspections/latest');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('create', () => {
    it('正常に点検を作成する', async () => {
      // 入力データ
      const input = { 
        inspection_date: '2023-01-04', 
        device_id: 2,
        inspection_items: [
          { item_id: 1, result: 'OK', comment: '' },
          { item_id: 2, result: 'NG', comment: '不具合あり' }
        ]
      };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 4, 
        inspection_date: '2023-01-04', 
        device_id: 2,
        created_at: '2023-01-04T00:00:00.000Z',
        updated_at: '2023-01-04T00:00:00.000Z',
        inspection_items: [
          { id: 7, inspection_id: 4, item_id: 1, result: 'OK', comment: '' },
          { id: 8, inspection_id: 4, item_id: 2, result: 'NG', comment: '不具合あり' }
        ]
      };
      
      // モック関数の戻り値を設定
      api.post.mockResolvedValueOnce({ data: mockResponse });
      
      // コンソールログをモック
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // 関数を実行
      const result = await inspectionAPI.create(input);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/inspections', input);
      expect(result).toEqual(mockResponse);
      expect(console.log).toHaveBeenCalled();
      
      // コンソールログを元に戻す
      console.log = originalConsoleLog;
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // 入力データ
      const input = { 
        inspection_date: '2023-01-04',
        device_id: 2,
        inspection_items: []
      };
      
      // エラーレスポンス
      const mockError = new Error('点検作成エラー');
      mockError.response = {
        data: {
          message: '点検項目が指定されていません'
        }
      };
      
      // モック関数の戻り値を設定
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールログとエラーをモック
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionAPI.create(input)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/inspections', input);
      expect(console.log).toHaveBeenCalledWith('APIに送信する点検データ:', expect.any(String));
      expect(console.error).toHaveBeenCalled();
      
      // コンソールログとエラーを元に戻す
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    });
  });
  
  describe('update', () => {
    it('正常に点検を更新する', async () => {
      // 入力データ
      const input = { 
        inspection_date: '2023-01-01', 
        inspection_items: [
          { item_id: 1, result: 'OK', comment: '修正済み' }
        ]
      };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 1, 
        inspection_date: '2023-01-01',
        device_id: 1,
        updated_at: '2023-01-05T00:00:00.000Z',
        inspection_items: [
          { id: 1, inspection_id: 1, item_id: 1, result: 'OK', comment: '修正済み' }
        ]
      };
      
      // モック関数の戻り値を設定
      api.put.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await inspectionAPI.update(1, input);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/inspections/1', input);
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // 入力データ
      const input = { 
        inspection_date: '2023-01-01',
        inspection_items: []
      };
      
      // エラーレスポンス
      const mockError = new Error('点検更新エラー');
      
      // モック関数の戻り値を設定
      api.put.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionAPI.update(1, input)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith('/inspections/1', input);
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('delete', () => {
    it('正常に点検を削除する', async () => {
      // モック応答
      const mockResponse = { message: '点検記録が削除されました' };
      
      // モック関数の戻り値を設定
      api.delete.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await inspectionAPI.delete(1);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/inspections/1');
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーレスポンス
      const mockError = new Error('点検削除エラー');
      
      // モック関数の戻り値を設定
      api.delete.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionAPI.delete(1)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.delete).toHaveBeenCalledWith('/inspections/1');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });

  describe('getInspectionItems', () => {
    it('正常に点検項目一覧を取得する', async () => {
      // モックデータ
      const mockResponse = {
        data: [
          { id: 1, name: '点検項目1', category: 'カテゴリA' },
          { id: 2, name: '点検項目2', category: 'カテゴリB' }
        ]
      };
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce(mockResponse);
      
      // 関数を実行
      const result = await inspectionAPI.getInspectionItems();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items/all-with-details');
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // エラーレスポンス
      const mockError = new Error('点検項目一覧取得エラー');
      
      // モック関数の戻り値を設定
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionAPI.getInspectionItems()).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items/all-with-details');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
});