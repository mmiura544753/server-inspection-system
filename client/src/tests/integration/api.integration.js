// src/tests/integration/api.integration.js
import { customerAPI } from '../../services/api/customerAPI';
import { deviceAPI } from '../../services/api/deviceAPI';
import api from '../../services/api/index';

// APIモジュールをモック化
jest.mock('../../services/api/index', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

describe('API Integration Tests', () => {
  // 各テストの前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Customer API Integration', () => {
    it('getAll メソッドが正しくAPI呼び出しを行う', async () => {
      // モックデータ
      const mockData = [
        { id: 1, customer_name: 'テスト顧客1' },
        { id: 2, customer_name: 'テスト顧客2' }
      ];
      
      // APIレスポンスをモック
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // APIメソッド呼び出し
      const result = await customerAPI.getAll();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/customers');
      expect(result).toEqual(mockData);
    });
    
    it('create メソッドが正しくAPI呼び出しを行う', async () => {
      // 入力データ
      const inputData = { customer_name: '新規顧客' };
      
      // APIレスポンスをモック
      const mockResponse = { 
        id: 3, 
        customer_name: '新規顧客',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };
      
      api.post.mockResolvedValueOnce({ data: mockResponse });
      
      // APIメソッド呼び出し
      const result = await customerAPI.create(inputData);
      
      // 検証
      expect(api.post).toHaveBeenCalledWith('/customers', inputData);
      expect(result).toEqual(mockResponse);
    });
    
    it('update メソッドが正しくAPI呼び出しを行う', async () => {
      // 入力データ
      const inputData = { customer_name: '更新された顧客名' };
      const customerId = 1;
      
      // APIレスポンスをモック
      const mockResponse = { 
        id: customerId, 
        customer_name: '更新された顧客名',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      };
      
      api.put.mockResolvedValueOnce({ data: mockResponse });
      
      // APIメソッド呼び出し
      const result = await customerAPI.update(customerId, inputData);
      
      // 検証
      expect(api.put).toHaveBeenCalledWith(`/customers/${customerId}`, inputData);
      expect(result).toEqual(mockResponse);
    });
  });
  
  describe('Device API Integration', () => {
    it('getAll メソッドが正しくAPI呼び出しを行う', async () => {
      // モックデータ
      const mockData = [
        { 
          id: 1, 
          device_name: 'サーバー1',
          customer_id: 1,
          customer_name: 'テスト顧客1'
        },
        { 
          id: 2, 
          device_name: 'サーバー2',
          customer_id: 2,
          customer_name: 'テスト顧客2'
        }
      ];
      
      // APIレスポンスをモック
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // APIメソッド呼び出し
      const result = await deviceAPI.getAll();
      
      // 検証
      expect(api.get).toHaveBeenCalledWith('/devices');
      expect(result).toEqual(mockData);
    });
    
    it('getById メソッドが正しくAPI呼び出しを行う', async () => {
      // モックデータ
      const deviceId = 1;
      const mockData = { 
        id: deviceId, 
        device_name: 'サーバー1',
        customer_id: 1,
        customer_name: 'テスト顧客1'
      };
      
      // APIレスポンスをモック
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // APIメソッド呼び出し
      const result = await deviceAPI.getById(deviceId);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith(`/devices/${deviceId}`);
      expect(result).toEqual(mockData);
    });
    
    it('getByCustomerId メソッドが正しくAPI呼び出しを行う', async () => {
      // モックデータ
      const customerId = 1;
      const mockData = [
        { 
          id: 1, 
          device_name: 'サーバー1',
          customer_id: customerId,
          customer_name: 'テスト顧客1'
        }
      ];
      
      // APIレスポンスをモック
      api.get.mockResolvedValueOnce({ data: mockData });
      
      // APIメソッド呼び出し
      const result = await deviceAPI.getByCustomerId(customerId);
      
      // 検証
      expect(api.get).toHaveBeenCalledWith(`/customers/${customerId}/devices`);
      expect(result).toEqual(mockData);
    });
  });
  
  describe('エラーハンドリングの統合テスト', () => {
    it('API呼び出しエラー時に適切にエラーをスローする', async () => {
      // エラーをモック
      const mockError = new Error('ネットワークエラー');
      api.get.mockRejectedValueOnce(mockError);
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // API呼び出しとエラーのキャッチ
      await expect(customerAPI.getAll()).rejects.toThrow(mockError);
      
      // エラーログが記録されていることを確認
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
});