import { renderHook, act } from '../../../tests/utils/test-utils';
import { useInspectionAPI } from '../../../hooks/useInspectionAPI';
import { inspectionAPI } from '../../../services/api';
import { formatDateForAPI } from '../../../utils/dateTimeUtils';

// モックの設定
jest.mock('../../../services/api', () => ({
  inspectionAPI: {
    getInspectionItems: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../../../utils/dateTimeUtils', () => ({
  formatDateForAPI: jest.fn().mockImplementation(date => {
    if (date instanceof Date) {
      return '2025-03-15';
    }
    return date;
  })
}));

// コンソールの警告・エラーをスパイ
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

describe('useInspectionAPI', () => {
  // モックの引数
  const mockInspectionItems = [
    {
      servers: [
        {
          device_id: 1,
          items: [{ id: 101 }, { id: 102 }],
          results: [true, false],
          id: 1
        }
      ]
    }
  ];
  const mockSetInspectionItems = jest.fn();
  const mockSetCustomerName = jest.fn();
  const mockDate = new Date('2025-03-15');
  const mockStartTime = '09:00';
  const mockEndTime = '10:00';
  const mockSetSaveStatus = jest.fn();
  const mockSetError = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
    
    // コンソール出力をモック
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    // 元のコンソール関数を復元
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useInspectionAPI(
      mockInspectionItems,
      mockSetInspectionItems,
      mockSetCustomerName,
      mockDate,
      mockStartTime,
      mockEndTime,
      mockSetSaveStatus,
      mockSetError
    ));

    // 初期状態がロード中になっているか確認
    expect(result.current.loading).toBe(true);
    expect(typeof result.current.fetchInspectionItems).toBe('function');
    expect(typeof result.current.loadPreviousData).toBe('function');
    expect(typeof result.current.saveInspectionResults).toBe('function');
  });

  describe('fetchInspectionItems', () => {
    it('should fetch inspection items successfully', async () => {
      // API成功レスポンスをモック
      const mockResponse = {
        data: {
          data: [
            { 
              customer_name: 'テスト顧客',
              servers: [{ id: 1, name: 'サーバー1' }]
            }
          ]
        }
      };
      inspectionAPI.getInspectionItems.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useInspectionAPI(
        mockInspectionItems,
        mockSetInspectionItems,
        mockSetCustomerName,
        mockDate,
        mockStartTime,
        mockEndTime,
        mockSetSaveStatus,
        mockSetError
      ));

      // 関数を実行
      await act(async () => {
        await result.current.fetchInspectionItems();
      });

      // API呼び出しを確認
      expect(inspectionAPI.getInspectionItems).toHaveBeenCalled();

      // 状態更新を確認
      expect(mockSetCustomerName).toHaveBeenCalledWith('テスト顧客');
      expect(mockSetInspectionItems).toHaveBeenCalledWith(mockResponse.data.data);
      expect(mockSetError).toHaveBeenCalledWith(null);
      
      // ローディング状態が更新されるか確認
      expect(result.current.loading).toBe(false);
    });

    it('should handle empty data', async () => {
      // 空のレスポンスをモック
      const mockResponse = { data: { data: [] } };
      inspectionAPI.getInspectionItems.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useInspectionAPI(
        mockInspectionItems,
        mockSetInspectionItems,
        mockSetCustomerName,
        mockDate,
        mockStartTime,
        mockEndTime,
        mockSetSaveStatus,
        mockSetError
      ));

      // 関数を実行
      await act(async () => {
        await result.current.fetchInspectionItems();
      });

      // 空配列が設定されることを確認
      expect(mockSetInspectionItems).toHaveBeenCalledWith([]);
      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(result.current.loading).toBe(false);
    });

    it('should handle errors when fetching items', async () => {
      // APIエラーをモック
      const error = new Error('テストエラー');
      inspectionAPI.getInspectionItems.mockRejectedValue(error);

      const { result } = renderHook(() => useInspectionAPI(
        mockInspectionItems,
        mockSetInspectionItems,
        mockSetCustomerName,
        mockDate,
        mockStartTime,
        mockEndTime,
        mockSetSaveStatus,
        mockSetError
      ));

      // 関数を実行
      await act(async () => {
        await result.current.fetchInspectionItems();
      });

      // エラーハンドリングを確認
      expect(console.error).toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith('点検データの読み込みに失敗しました。');
      expect(mockSetInspectionItems).toHaveBeenCalledWith([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('loadPreviousData', () => {
    it('should load previous inspection data', async () => {
      const { result } = renderHook(() => useInspectionAPI(
        mockInspectionItems,
        mockSetInspectionItems,
        mockSetCustomerName,
        mockDate,
        mockStartTime,
        mockEndTime,
        mockSetSaveStatus,
        mockSetError
      ));

      // 関数を実行
      await act(async () => {
        await result.current.loadPreviousData();
      });

      // インスペクション項目が更新されていることを確認
      expect(mockSetInspectionItems).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('should handle errors when loading previous data', async () => {
      // 明示的にエラーを発生させる
      const mockEmptyItems = null; // インスペクション項目を操作する際にエラーを発生させる
      
      const { result } = renderHook(() => useInspectionAPI(
        mockEmptyItems,
        mockSetInspectionItems,
        mockSetCustomerName,
        mockDate,
        mockStartTime,
        mockEndTime,
        mockSetSaveStatus,
        mockSetError
      ));

      // 関数を実行
      await act(async () => {
        await result.current.loadPreviousData();
      });

      // エラーハンドリングを確認
      expect(console.error).toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith('前回の点検データの読み込みに失敗しました。');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('saveInspectionResults', () => {
    it('should save inspection results successfully', async () => {
      // API成功レスポンスをモック
      const mockResponse = { 
        id: 1,
        message: '保存成功'
      };
      inspectionAPI.create.mockResolvedValue(mockResponse);

      // タイマーをモック
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useInspectionAPI(
        mockInspectionItems,
        mockSetInspectionItems,
        mockSetCustomerName,
        mockDate,
        mockStartTime,
        mockEndTime,
        mockSetSaveStatus,
        mockSetError
      ));

      // 関数を実行
      await act(async () => {
        await result.current.saveInspectionResults(mockNavigate);
      });

      // API呼び出しを確認
      expect(inspectionAPI.create).toHaveBeenCalled();
      
      // 引数の型を確認
      const callArg = inspectionAPI.create.mock.calls[0][0];
      expect(callArg).toBeDefined();
      expect(typeof callArg).toBe('object');
      expect(callArg).toHaveProperty('results');
      expect(Array.isArray(callArg.results)).toBe(true);
      
      // formatDateForAPIが呼ばれたことを確認
      expect(formatDateForAPI).toHaveBeenCalledWith(mockDate);

      // 状態更新を確認
      expect(mockSetSaveStatus).toHaveBeenCalledWith('saving');
      expect(mockSetSaveStatus).toHaveBeenCalledWith('success');
      
      // タイマー完了後の処理を確認
      act(() => {
        jest.runAllTimers();
      });
      
      expect(mockSetSaveStatus).toHaveBeenCalledWith('');
      expect(mockNavigate).toHaveBeenCalledWith('/inspections');
      
      // タイマーをリセット
      jest.useRealTimers();
    });

    it('should handle missing inspection items', async () => {
      const emptyItems = [];
      
      const { result } = renderHook(() => useInspectionAPI(
        emptyItems,
        mockSetInspectionItems,
        mockSetCustomerName,
        mockDate,
        mockStartTime,
        mockEndTime,
        mockSetSaveStatus,
        mockSetError
      ));

      // 関数を実行
      await act(async () => {
        await result.current.saveInspectionResults(mockNavigate);
      });

      // エラーハンドリングを確認
      expect(console.error).toHaveBeenCalled();
      expect(mockSetSaveStatus).toHaveBeenCalledWith('saving');
      expect(mockSetSaveStatus).toHaveBeenCalledWith('error');
      expect(mockSetError).toHaveBeenCalled();
      
      // API呼び出しがされないことを確認
      expect(inspectionAPI.create).not.toHaveBeenCalled();
    });

    it('should handle API errors when saving results', async () => {
      // APIエラーをモック
      const error = new Error('保存エラー');
      error.response = { data: { message: 'サーバーエラー' } };
      inspectionAPI.create.mockRejectedValue(error);
      
      const { result } = renderHook(() => useInspectionAPI(
        mockInspectionItems,
        mockSetInspectionItems,
        mockSetCustomerName,
        mockDate,
        mockStartTime,
        mockEndTime,
        mockSetSaveStatus,
        mockSetError
      ));

      // 関数を実行
      await act(async () => {
        await result.current.saveInspectionResults(mockNavigate);
      });

      // エラーハンドリングを確認
      expect(console.error).toHaveBeenCalled();
      expect(mockSetSaveStatus).toHaveBeenCalledWith('saving');
      expect(mockSetSaveStatus).toHaveBeenCalledWith('error');
      expect(mockSetError).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});