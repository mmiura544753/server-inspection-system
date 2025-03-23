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
      
      // 関数を実行
      const result = await customerAPI.create(input);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/customers', input);
      expect(result).toEqual(mockResponse);
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
  });
});