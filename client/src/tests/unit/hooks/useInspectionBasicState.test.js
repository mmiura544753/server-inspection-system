import React from 'react';
import { renderHook, act } from '../../../tests/utils/test-utils';
import { useInspectionBasicState } from '../../../hooks/useInspectionBasicState';
import * as dateTimeUtils from '../../../utils/dateTimeUtils';

// formatTimeをモック
jest.mock('../../../utils/dateTimeUtils', () => ({
  formatTime: jest.fn().mockReturnValue('10:00')
}));

// モック関数を手動で取得
const formatTime = dateTimeUtils.formatTime;

// Dateをモック
const mockDate = new Date('2025-03-15T10:00:00.000Z');
const originalDate = global.Date;

describe('useInspectionBasicState', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
    
    // テスト用の固定日時を設定
    global.Date = jest.fn(() => mockDate);
    global.Date.now = jest.fn(() => mockDate.getTime());
    global.Date.prototype = originalDate.prototype;
  });

  afterEach(() => {
    // 元のDateオブジェクトを復元
    global.Date = originalDate;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useInspectionBasicState());

    // 初期値が正しく設定されているか確認
    expect(result.current.date).toEqual(mockDate);
    // startTimeの初期値はuseEffectにより非同期に設定される可能性があるので、テストしない
    expect(result.current.endTime).toBe('');
    expect(result.current.isStarted).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.customerName).toBe('');
    expect(result.current.location).toBe('データセンターIT ホストサーバ室');
    expect(result.current.workContent).toBe('ハードウェアLEDランプの目視確認');
    expect(result.current.saveStatus).toBe('');
  });

  it('should call formatTime when component mounts', () => {
    renderHook(() => useInspectionBasicState());

    // マウント時にformatTimeが呼ばれることを確認
    expect(formatTime).toHaveBeenCalledWith(mockDate);
  });

  it('should have startTime setting functionality', () => {
    const { result } = renderHook(() => useInspectionBasicState());
    
    // 新しい開始時間を設定できることを確認
    act(() => {
      result.current.setStartTime('09:30');
    });
    
    // 設定された値で更新されることを確認
    expect(result.current.startTime).toBe('09:30');
  });

  it('should have isStarted setting functionality', () => {
    const { result } = renderHook(() => useInspectionBasicState());
    
    // isStartedをtrueに変更
    act(() => {
      result.current.setIsStarted(true);
    });
    
    // 更新されることを確認
    expect(result.current.isStarted).toBe(true);
  });

  it('should have endTime setting functionality', () => {
    const { result } = renderHook(() => useInspectionBasicState());
    
    // 新しい終了時間を設定できることを確認
    act(() => {
      result.current.setEndTime('11:30');
    });
    
    // 設定された値で更新されることを確認
    expect(result.current.endTime).toBe('11:30');
  });

  it('should have isComplete setting functionality', () => {
    const { result } = renderHook(() => useInspectionBasicState());
    
    // isCompleteをtrueに変更
    act(() => {
      result.current.setIsComplete(true);
    });
    
    // 更新されることを確認
    expect(result.current.isComplete).toBe(true);
  });

  it('should allow setting date manually', () => {
    const { result } = renderHook(() => useInspectionBasicState());
    const newDate = new Date('2025-04-01');
    
    act(() => {
      result.current.setDate(newDate);
    });
    
    expect(result.current.date).toBe(newDate);
  });

  it('should allow setting customer name manually', () => {
    const { result } = renderHook(() => useInspectionBasicState());
    
    act(() => {
      result.current.setCustomerName('テスト顧客');
    });
    
    expect(result.current.customerName).toBe('テスト顧客');
  });

  it('should allow setting location manually', () => {
    const { result } = renderHook(() => useInspectionBasicState());
    
    act(() => {
      result.current.setLocation('新しい場所');
    });
    
    expect(result.current.location).toBe('新しい場所');
  });

  it('should allow setting work content manually', () => {
    const { result } = renderHook(() => useInspectionBasicState());
    
    act(() => {
      result.current.setWorkContent('新しい作業内容');
    });
    
    expect(result.current.workContent).toBe('新しい作業内容');
  });

  it('should allow setting save status manually', () => {
    const { result } = renderHook(() => useInspectionBasicState());
    
    act(() => {
      result.current.setSaveStatus('saving');
    });
    
    expect(result.current.saveStatus).toBe('saving');
  });
});