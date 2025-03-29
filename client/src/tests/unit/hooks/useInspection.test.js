import { renderHook, act } from '../../../tests/utils/test-utils';
import { useInspection } from '../../../hooks/useInspection';
import { useInspectionBasicState } from '../../../hooks/useInspectionBasicState';
import { useInspectionItems } from '../../../hooks/useInspectionItems';
import { useInspectionAPI } from '../../../hooks/useInspectionAPI';
import { formatTime } from '../../../utils/dateTimeUtils';

// モック
jest.mock('../../../hooks/useInspectionBasicState');
jest.mock('../../../hooks/useInspectionItems');
jest.mock('../../../hooks/useInspectionAPI');
jest.mock('../../../utils/dateTimeUtils', () => ({
  formatTime: jest.fn().mockImplementation(time => {
    if (time instanceof Date) return '10:00';
    return time;
  })
}));

describe('useInspection', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    
    // useInspectionBasicStateのモック実装
    useInspectionBasicState.mockReturnValue({
      date: new Date('2025-03-15'),
      setDate: jest.fn(),
      startTime: '09:00',
      setStartTime: jest.fn(),
      endTime: '10:00',
      setEndTime: jest.fn(),
      isStarted: false,
      setIsStarted: jest.fn(),
      isComplete: false,
      setIsComplete: jest.fn(),
      customerName: 'テスト顧客',
      setCustomerName: jest.fn(),
      location: 'テスト場所',
      setLocation: jest.fn(),
      workContent: 'テスト作業内容',
      setWorkContent: jest.fn(),
      saveStatus: '',
      setSaveStatus: jest.fn()
    });

    // useInspectionItemsのモック実装
    useInspectionItems.mockReturnValue({
      inspectionItems: [],
      setInspectionItems: jest.fn(),
      updateResult: jest.fn(),
      calculateCompletionRate: jest.fn().mockReturnValue(50),
      hasAnyResults: jest.fn().mockReturnValue(true),
      allItemsChecked: jest.fn().mockReturnValue(false)
    });

    // useInspectionAPIのモック実装
    useInspectionAPI.mockReturnValue({
      loading: false,
      fetchInspectionItems: jest.fn(),
      loadPreviousData: jest.fn(),
      saveInspectionResults: jest.fn()
    });
  });

  it('should initialize with correct values and fetch inspection items', () => {
    const { result } = renderHook(() => useInspection());

    // APIから点検項目を取得するメソッドが呼ばれることを確認
    expect(useInspectionAPI().fetchInspectionItems).toHaveBeenCalledTimes(1);

    // 各状態が正しく初期化されていることを確認
    expect(result.current.date).toEqual(new Date('2025-03-15'));
    expect(result.current.startTime).toBe('09:00');
    expect(result.current.endTime).toBe('10:00');
    expect(result.current.isStarted).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.customerName).toBe('テスト顧客');
    expect(result.current.calculateCompletionRate()).toBe(50);
    expect(result.current.loading).toBe(false);
  });

  it('should return updateResult function from useInspectionItems', () => {
    const { result } = renderHook(() => useInspection());
    const updateResultMock = useInspectionItems().updateResult;
    
    // メソッドが正しく返されることを確認
    expect(result.current.updateResult).toBe(updateResultMock);
    
    // メソッドを呼び出してみる
    act(() => {
      result.current.updateResult(0, 0, 0, true);
    });
    
    // モックメソッドが正しく呼ばれたかを確認
    expect(updateResultMock).toHaveBeenCalledWith(0, 0, 0, true);
  });

  it('should return saveInspectionResults function from useInspectionAPI', () => {
    const { result } = renderHook(() => useInspection());
    const mockNavigate = jest.fn();
    const saveInspectionResultsMock = useInspectionAPI().saveInspectionResults;
    
    // メソッドが正しく返されることを確認
    expect(result.current.saveInspectionResults).toBe(saveInspectionResultsMock);
    
    // メソッドを呼び出してみる
    act(() => {
      result.current.saveInspectionResults(mockNavigate);
    });
    
    // モックメソッドが正しく呼ばれたかを確認
    expect(saveInspectionResultsMock).toHaveBeenCalledWith(mockNavigate);
  });

  it('should return loadPreviousData function from useInspectionAPI', () => {
    const { result } = renderHook(() => useInspection());
    const loadPreviousDataMock = useInspectionAPI().loadPreviousData;
    
    // メソッドが正しく返されることを確認
    expect(result.current.loadPreviousData).toBe(loadPreviousDataMock);
    
    // メソッドを呼び出してみる
    act(() => {
      result.current.loadPreviousData();
    });
    
    // モックメソッドが正しく呼ばれたかを確認
    expect(loadPreviousDataMock).toHaveBeenCalled();
  });

  it('should handle error state correctly', () => {
    const { result } = renderHook(() => useInspection());
    
    // 初期状態ではエラーがない
    expect(result.current.error).toBeNull();
    
    // エラーを設定する場合はactで囲む必要がある
    // ここではエラー状態のチェックのみを行う
  });

  it('should return formatTime function from dateTimeUtils', () => {
    const { result } = renderHook(() => useInspection());
    const formatTimeMock = formatTime;
    
    // 関数が正しく返されていることを確認
    expect(result.current.formatTime).toBe(formatTimeMock);
    
    // 関数を使ってみる
    result.current.formatTime(new Date());
    
    // モック関数が呼ばれたことを確認
    expect(formatTimeMock).toHaveBeenCalled();
  });
});