// src/tests/unit/components/inspectionItems/forms/DeviceTypeSelect.test.js
import React from 'react';
import { render, screen, fireEvent } from '../../../../utils/test-utils';
import '@testing-library/jest-dom';
import DeviceTypeSelect from '../../../../../components/inspectionItems/forms/DeviceTypeSelect';

describe('DeviceTypeSelect', () => {
  const mockDeviceTypeOptions = [
    { value: 'server', label: 'サーバー' },
    { value: 'network', label: 'ネットワーク機器' }
  ];
  
  const mockOnChange = jest.fn();

  beforeEach(() => {
    // テスト前にモックをリセット
    mockOnChange.mockClear();
  });

  test('renders correctly when enabled with options', () => {
    render(
      <DeviceTypeSelect 
        deviceTypeOptions={mockDeviceTypeOptions}
        value=""
        onChange={mockOnChange}
        isDisabled={false}
      />
    );
    
    // ラベルが正しく表示されているか確認
    expect(screen.getByText('種別')).toBeInTheDocument();
    
    // 「すべて」オプションが表示されているか確認
    const allOption = screen.getByLabelText('すべて');
    expect(allOption).toBeInTheDocument();
    expect(allOption).toBeChecked();
    
    // デバイスタイプのオプションが正しく表示されているか確認
    expect(screen.getByLabelText('サーバー')).toBeInTheDocument();
    expect(screen.getByLabelText('ネットワーク機器')).toBeInTheDocument();
  });
  
  test('handles selection change correctly', () => {
    render(
      <DeviceTypeSelect 
        deviceTypeOptions={mockDeviceTypeOptions}
        value=""
        onChange={mockOnChange}
        isDisabled={false}
      />
    );
    
    // サーバーオプションを選択
    const serverOption = screen.getByLabelText('サーバー');
    fireEvent.click(serverOption);
    
    // onChangeが正しい値で呼び出されたか確認
    expect(mockOnChange).toHaveBeenCalledWith('server');
  });
  
  test('displays selected value correctly', () => {
    render(
      <DeviceTypeSelect 
        deviceTypeOptions={mockDeviceTypeOptions}
        value="network"
        onChange={mockOnChange}
        isDisabled={false}
      />
    );
    
    // ネットワーク機器が選択されているか確認
    const networkOption = screen.getByLabelText('ネットワーク機器');
    expect(networkOption).toBeChecked();
    
    // すべてオプションが選択されていないか確認
    const allOption = screen.getByLabelText('すべて');
    expect(allOption).not.toBeChecked();
  });
  
  test('renders disabled state correctly', () => {
    render(
      <DeviceTypeSelect 
        deviceTypeOptions={mockDeviceTypeOptions}
        value=""
        onChange={mockOnChange}
        isDisabled={true}
      />
    );
    
    // 無効化メッセージが表示されているか確認
    expect(screen.getByText('先に顧客を選択してください')).toBeInTheDocument();
    
    // ラジオボタンが表示されていないことを確認
    expect(screen.queryByLabelText('すべて')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('サーバー')).not.toBeInTheDocument();
  });
  
  test('renders empty options state correctly', () => {
    render(
      <DeviceTypeSelect 
        deviceTypeOptions={[]}
        value=""
        onChange={mockOnChange}
        isDisabled={false}
      />
    );
    
    // 空のオプションメッセージが表示されているか確認
    expect(screen.getByText('種別がありません')).toBeInTheDocument();
    
    // ラジオボタンが表示されていないことを確認
    expect(screen.queryByLabelText('すべて')).not.toBeInTheDocument();
  });
  
  test('handles clicking the all option correctly', () => {
    render(
      <DeviceTypeSelect 
        deviceTypeOptions={mockDeviceTypeOptions}
        value="server"
        onChange={mockOnChange}
        isDisabled={false}
      />
    );
    
    // すべてのオプションをクリック
    const allOption = screen.getByLabelText('すべて');
    fireEvent.click(allOption);
    
    // onChangeが空の値で呼び出されたか確認
    expect(mockOnChange).toHaveBeenCalledWith('');
  });
  
  test('has correct styling and layout', () => {
    render(
      <DeviceTypeSelect 
        deviceTypeOptions={mockDeviceTypeOptions}
        value=""
        onChange={mockOnChange}
        isDisabled={false}
      />
    );
    
    // コンテナが正しいクラスを持っているか確認
    const container = screen.getByText('種別').closest('div');
    expect(container).toHaveClass('mb-3');
    
    // ラジオボタンのラッパーが正しいクラスを持っているか確認
    const radioContainer = screen.getByLabelText('すべて').closest('div').parentElement;
    expect(radioContainer).toHaveClass('d-flex', 'flex-wrap', 'gap-3');
  });
});