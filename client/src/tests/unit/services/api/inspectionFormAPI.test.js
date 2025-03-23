import { inspectionFormAPI } from '../../../../services/api/inspectionFormAPI';
import api from '../../../../services/api/index';

// apiモジュールをモック化
jest.mock('../../../../services/api/index', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

describe('inspectionFormAPI', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getLatestInspection', () => {
    it('正常に顧客の最新点検データを取得する', async () => {
      // モックデータ
      const mockData = {
        id: 5,
        customer_id: 2,
        inspection_date: '2023-01-05',
        items: [
          { id: 1, name: '項目1', result: 'OK' },
          { id: 2, name: '項目2', result: 'NG' }
        ]
      };
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionFormAPI.getLatestInspection(2);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-results/latest?customerId=2');
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
      await expect(inspectionFormAPI.getLatestInspection(2)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-results/latest?customerId=2');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('saveInspectionResult', () => {
    it('正常に点検結果を保存する', async () => {
      // 入力データ
      const input = { 
        customer_id: 2,
        inspection_date: '2023-01-10',
        items: [
          { item_id: 1, result: 'OK', comment: '' },
          { item_id: 2, result: 'NG', comment: '故障中' }
        ]
      };
      
      // モックデータ（応答）
      const mockResponse = { 
        id: 6, 
        customer_id: 2,
        inspection_date: '2023-01-10',
        created_at: '2023-01-10T00:00:00.000Z',
        items: [
          { id: 11, inspection_id: 6, item_id: 1, result: 'OK', comment: '' },
          { id: 12, inspection_id: 6, item_id: 2, result: 'NG', comment: '故障中' }
        ]
      };
      
      // モック関数の戻り値を設定
      api.post.mockResolvedValueOnce({ data: mockResponse });
      
      // 関数を実行
      const result = await inspectionFormAPI.saveInspectionResult(input);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/inspection-results', input);
      expect(result).toEqual(mockResponse);
    });
    
    it('エラーが発生した場合、エラーをスローする', async () => {
      // 入力データ
      const input = { 
        customer_id: 2,
        inspection_date: '2023-01-10',
        items: []
      };
      
      // エラーを模擬
      const mockError = new Error('保存エラー');
      api.post.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 関数実行時にエラーをキャッチ
      await expect(inspectionFormAPI.saveInspectionResult(input)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/inspection-results', input);
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('getInspectionItemsByCustomer', () => {
    it('正常に顧客IDで点検項目を取得する', async () => {
      // モックデータ
      const mockData = [
        { id: 1, name: '点検項目1', customer_id: 2 },
        { id: 3, name: '点検項目3', customer_id: 2 }
      ];
      
      // モック関数の戻り値を設定
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // 関数を実行
      const result = await inspectionFormAPI.getInspectionItemsByCustomer(2);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items?customerId=2');
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
      await expect(inspectionFormAPI.getInspectionItemsByCustomer(2)).rejects.toThrow(mockError);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/inspection-items?customerId=2');
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
});