import React from 'react';
import { render, screen } from '../../../utils/test-utils';
import ServerInspectionSheet from '../../../../components/inspections/ServerInspectionSheet';
import { useInspection } from '../../../../hooks/useInspection';
import { useNavigate } from 'react-router-dom';

// useInspectionフックをモック化
jest.mock('../../../../hooks/useInspection');

// useNavigateをモック化
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

// 子コンポーネントをモック化
jest.mock('../../../../components/inspections/InspectionHeader', () => {
  return function MockInspectionHeader(props) {
    return (
      <div data-testid="header-component">
        Header: {props.customerName || 'No Customer'}
        {props.error && <div data-testid="error-message">{props.error}</div>}
      </div>
    );
  };
});

jest.mock('../../../../components/inspections/InspectionForm', () => {
  return function MockInspectionForm(props) {
    return <div data-testid="form-component">Form</div>;
  };
});

jest.mock('../../../../components/inspections/InspectionTable', () => {
  return function MockInspectionTable(props) {
    return <div data-testid="table-component">Table</div>;
  };
});

jest.mock('../../../../components/inspections/InspectionActions', () => {
  return function MockInspectionActions(props) {
    return (
      <div data-testid="actions-component">
        <button onClick={props.saveInspectionResults}>保存</button>
        <button onClick={props.loadPreviousData}>読み込み</button>
      </div>
    );
  };
});

jest.mock('../../../../components/common/Loading', () => {
  return function MockLoading() {
    return <div data-testid="loading-component">Loading...</div>;
  };
});

describe('ServerInspectionSheet Component', () => {
  // デフォルトのモックデータとモック関数
  const mockDate = new Date('2025-03-29');
  const mockStartTime = '09:00';
  const mockEndTime = '17:00';
  const mockLocation = 'テスト場所';
  const mockWorkContent = '定期点検';
  const mockCustomerName = 'テスト顧客';
  const mockInspectionItems = [
    {
      id: 1,
      location_name: 'サーバールーム1',
      servers: [
        {
          id: 101,
          device_name: 'サーバー1',
          items: [
            { id: 1001, name: '状態確認' },
            { id: 1002, name: 'ランプ確認' }
          ],
          results: [true, false]
        }
      ]
    }
  ];
  
  const mockUpdateResult = jest.fn();
  const mockCalculateCompletionRate = jest.fn().mockReturnValue(50);
  const mockLoadPreviousData = jest.fn();
  const mockSaveInspectionResults = jest.fn();
  const mockSetDate = jest.fn();
  const mockSetStartTime = jest.fn();
  const mockSetEndTime = jest.fn();
  const mockSetLocation = jest.fn();
  const mockSetWorkContent = jest.fn();
  
  const mockNavigate = jest.fn();
  
  // 各テスト前の準備
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // useNavigateのモック設定
    useNavigate.mockReturnValue(mockNavigate);
    
    // useInspectionのモック設定
    useInspection.mockReturnValue({
      loading: false,
      error: null,
      date: mockDate,
      setDate: mockSetDate,
      startTime: mockStartTime,
      setStartTime: mockSetStartTime,
      endTime: mockEndTime,
      setEndTime: mockSetEndTime,
      customerName: mockCustomerName,
      location: mockLocation,
      setLocation: mockSetLocation,
      workContent: mockWorkContent,
      setWorkContent: mockSetWorkContent,
      inspectionItems: mockInspectionItems,
      saveStatus: '',
      updateResult: mockUpdateResult,
      calculateCompletionRate: mockCalculateCompletionRate,
      loadPreviousData: mockLoadPreviousData,
      saveInspectionResults: mockSaveInspectionResults
    });
  });
  
  it('renders loading component when loading is true', () => {
    // loadingがtrueの場合の設定
    useInspection.mockReturnValue({
      loading: true,
      error: null
    });
    
    render(<ServerInspectionSheet />);
    
    // Loadingコンポーネントが表示されていることを確認
    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    
    // 他のコンポーネントが表示されていないことを確認
    expect(screen.queryByTestId('header-component')).not.toBeInTheDocument();
    expect(screen.queryByTestId('form-component')).not.toBeInTheDocument();
    expect(screen.queryByTestId('table-component')).not.toBeInTheDocument();
    expect(screen.queryByTestId('actions-component')).not.toBeInTheDocument();
  });
  
  it('renders all inspection components when loading is false', () => {
    // 通常の状態を設定
    useInspection.mockReturnValue({
      loading: false,
      error: null,
      date: mockDate,
      setDate: mockSetDate,
      startTime: mockStartTime,
      setStartTime: mockSetStartTime,
      endTime: mockEndTime,
      setEndTime: mockSetEndTime,
      customerName: mockCustomerName,
      location: mockLocation,
      setLocation: mockSetLocation,
      workContent: mockWorkContent,
      setWorkContent: mockSetWorkContent,
      inspectionItems: mockInspectionItems,
      saveStatus: '',
      updateResult: mockUpdateResult,
      calculateCompletionRate: mockCalculateCompletionRate,
      loadPreviousData: mockLoadPreviousData,
      saveInspectionResults: mockSaveInspectionResults
    });
    
    render(<ServerInspectionSheet />);
    
    // 各コンポーネントが表示されていることを確認
    expect(screen.getByTestId('header-component')).toBeInTheDocument();
    expect(screen.getByTestId('form-component')).toBeInTheDocument();
    expect(screen.getByTestId('table-component')).toBeInTheDocument();
    expect(screen.getByTestId('actions-component')).toBeInTheDocument();
    
    // Loadingコンポーネントが表示されていないことを確認
    expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
  });
  
  it('passes customerName to InspectionHeader', () => {
    // 通常の状態を設定
    useInspection.mockReturnValue({
      loading: false,
      error: null,
      date: mockDate,
      setDate: mockSetDate,
      startTime: mockStartTime,
      setStartTime: mockSetStartTime,
      endTime: mockEndTime,
      setEndTime: mockSetEndTime,
      customerName: mockCustomerName,
      location: mockLocation,
      setLocation: mockSetLocation,
      workContent: mockWorkContent,
      setWorkContent: mockSetWorkContent,
      inspectionItems: mockInspectionItems,
      saveStatus: '',
      updateResult: mockUpdateResult,
      calculateCompletionRate: mockCalculateCompletionRate,
      loadPreviousData: mockLoadPreviousData,
      saveInspectionResults: mockSaveInspectionResults
    });
    
    render(<ServerInspectionSheet />);
    
    // customerNameが表示されていることを確認
    expect(screen.getByText(`Header: ${mockCustomerName}`)).toBeInTheDocument();
  });
  
  it('calls saveInspectionResults with navigate when save button is clicked', () => {
    // モックナビゲート関数
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    
    // 通常の状態を設定
    useInspection.mockReturnValue({
      loading: false,
      error: null,
      date: mockDate,
      setDate: mockSetDate,
      startTime: mockStartTime,
      setStartTime: mockSetStartTime,
      endTime: mockEndTime,
      setEndTime: mockSetEndTime,
      customerName: mockCustomerName,
      location: mockLocation,
      setLocation: mockSetLocation,
      workContent: mockWorkContent,
      setWorkContent: mockSetWorkContent,
      inspectionItems: mockInspectionItems,
      saveStatus: '',
      updateResult: mockUpdateResult,
      calculateCompletionRate: mockCalculateCompletionRate,
      loadPreviousData: mockLoadPreviousData,
      saveInspectionResults: mockSaveInspectionResults
    });
    
    render(<ServerInspectionSheet />);
    
    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    saveButton.click();
    
    // saveInspectionResultsが呼ばれたことを確認
    expect(mockSaveInspectionResults).toHaveBeenCalledTimes(1);
    expect(mockSaveInspectionResults).toHaveBeenCalledWith(mockNavigate);
  });
  
  it('calls loadPreviousData when load button is clicked', () => {
    // 通常の状態を設定
    useInspection.mockReturnValue({
      loading: false,
      error: null,
      date: mockDate,
      setDate: mockSetDate,
      startTime: mockStartTime,
      setStartTime: mockSetStartTime,
      endTime: mockEndTime,
      setEndTime: mockSetEndTime,
      customerName: mockCustomerName,
      location: mockLocation,
      setLocation: mockSetLocation,
      workContent: mockWorkContent,
      setWorkContent: mockSetWorkContent,
      inspectionItems: mockInspectionItems,
      saveStatus: '',
      updateResult: mockUpdateResult,
      calculateCompletionRate: mockCalculateCompletionRate,
      loadPreviousData: mockLoadPreviousData,
      saveInspectionResults: mockSaveInspectionResults
    });
    
    render(<ServerInspectionSheet />);
    
    // 読み込みボタンをクリック
    const loadButton = screen.getByText('読み込み');
    loadButton.click();
    
    // loadPreviousDataが呼ばれたことを確認
    expect(mockLoadPreviousData).toHaveBeenCalledTimes(1);
  });
  
  it('displays error message when error is present', () => {
    // エラーメッセージ
    const errorMessage = 'テストエラー';
    
    // エラーがある場合の状態を設定
    useInspection.mockReturnValue({
      loading: false,
      error: errorMessage,
      date: mockDate,
      setDate: mockSetDate,
      startTime: mockStartTime,
      setStartTime: mockSetStartTime,
      endTime: mockEndTime,
      setEndTime: mockSetEndTime,
      customerName: mockCustomerName,
      location: mockLocation,
      setLocation: mockSetLocation,
      workContent: mockWorkContent,
      setWorkContent: mockSetWorkContent,
      inspectionItems: mockInspectionItems,
      saveStatus: '',
      updateResult: mockUpdateResult,
      calculateCompletionRate: mockCalculateCompletionRate,
      loadPreviousData: mockLoadPreviousData,
      saveInspectionResults: mockSaveInspectionResults
    });
    
    render(<ServerInspectionSheet />);
    
    // エラーメッセージが表示されていることを確認
    const errorElement = screen.getByTestId('error-message');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent(errorMessage);
  });
});