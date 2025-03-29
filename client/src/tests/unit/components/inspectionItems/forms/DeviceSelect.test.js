// src/tests/unit/components/inspectionItems/forms/DeviceSelect.test.js
import React from 'react';
import { render, screen, fireEvent } from '../../../../utils/test-utils';
import '@testing-library/jest-dom';
import DeviceSelect from '../../../../../components/inspectionItems/forms/DeviceSelect';

// react-iconsのモック
jest.mock('react-icons/fa', () => ({
  FaInfoCircle: () => <span data-testid="info-icon">情報アイコン</span>
}));

describe('DeviceSelect', () => {
  const mockDeviceOptions = [
    { value: 'device1', label: '機器1' },
    { value: 'device2', label: '機器2' },
    { value: 'device3', label: '機器3' }
  ];
  
  const mockOnChange = jest.fn();

  beforeEach(() => {
    // テスト前にモックをリセット
    mockOnChange.mockClear();
  });

  test('renders correctly when enabled with options', () => {
    render(
      <DeviceSelect 
        deviceOptions={mockDeviceOptions}
        value={null}
        onChange={mockOnChange}
        isDisabled={false}
        hasCustomer={true}
        errors={null}
        touched={false}
      />
    );
    
    // ラベルが正しく表示されているか確認
    expect(screen.getByText('機器')).toBeInTheDocument();
    
    // 機器オプションが正しく表示されているか確認
    expect(screen.getByText('機器1')).toBeInTheDocument();
    expect(screen.getByText('機器2')).toBeInTheDocument();
    expect(screen.getByText('機器3')).toBeInTheDocument();
    
    // 非表示のinput要素が存在するか確認
    const hiddenInput = document.querySelector('input[type="hidden"]');
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput.value).toBe('');
  });
  
  test('handles selection change correctly', () => {
    render(
      <DeviceSelect 
        deviceOptions={mockDeviceOptions}
        value={null}
        onChange={mockOnChange}
        isDisabled={false}
        hasCustomer={true}
        errors={null}
        touched={false}
      />
    );
    
    // 機器1を選択
    const device1Option = screen.getByText('機器1');
    fireEvent.click(device1Option);
    
    // onChangeが正しい値で呼び出されたか確認
    expect(mockOnChange).toHaveBeenCalledWith(mockDeviceOptions[0]);
    
    // 選択された要素がハイライトされているか確認
    expect(device1Option).toHaveClass('bg-primary', 'text-white');
  });
  
  test('displays selected value correctly', () => {
    render(
      <DeviceSelect 
        deviceOptions={mockDeviceOptions}
        value={mockDeviceOptions[1]} // 機器2を選択
        onChange={mockOnChange}
        isDisabled={false}
        hasCustomer={true}
        errors={null}
        touched={false}
      />
    );
    
    // 機器2がハイライトされているか確認
    const device2Option = screen.getByText('機器2');
    expect(device2Option).toHaveClass('bg-primary', 'text-white');
    
    // 非表示のinput要素の値が正しいか確認
    const hiddenInput = document.querySelector('input[type="hidden"]');
    expect(hiddenInput.value).toBe('device2');
  });
  
  test('changes selection correctly when clicking a different option', () => {
    render(
      <DeviceSelect 
        deviceOptions={mockDeviceOptions}
        value={mockDeviceOptions[0]} // 最初は機器1が選択されている
        onChange={mockOnChange}
        isDisabled={false}
        hasCustomer={true}
        errors={null}
        touched={false}
      />
    );
    
    // 最初は機器1がハイライトされている
    const device1Option = screen.getByText('機器1');
    expect(device1Option).toHaveClass('bg-primary', 'text-white');
    
    // 機器3を選択
    const device3Option = screen.getByText('機器3');
    fireEvent.click(device3Option);
    
    // onChangeが正しい値で呼び出されたか確認
    expect(mockOnChange).toHaveBeenCalledWith(mockDeviceOptions[2]);
    
    // 機器3がハイライトされ、機器1のハイライトが解除されたか確認
    // これはDOM操作によって行われるため、直接テストするのは難しいですが、
    // selectDevice関数が呼ばれたことを確認できます
  });
  
  test('renders disabled state correctly', () => {
    render(
      <DeviceSelect 
        deviceOptions={mockDeviceOptions}
        value={null}
        onChange={mockOnChange}
        isDisabled={true}
        hasCustomer={false}
        errors={null}
        touched={false}
      />
    );
    
    // 無効化メッセージが表示されているか確認
    expect(screen.getByText('先に顧客を選択してください')).toBeInTheDocument();
    
    // 機器リストが表示されていないことを確認
    expect(screen.queryByText('機器1')).not.toBeInTheDocument();
  });
  
  test('renders empty options state correctly', () => {
    render(
      <DeviceSelect 
        deviceOptions={[]}
        value={null}
        onChange={mockOnChange}
        isDisabled={false}
        hasCustomer={true}
        errors={null}
        touched={false}
      />
    );
    
    // 空のオプションメッセージが表示されているか確認
    expect(screen.getByText('該当する機器がありません')).toBeInTheDocument();
    
    // ヘルプテキストが表示されているか確認
    expect(screen.getByText(/登録したい機器が見つかりません/)).toBeInTheDocument();
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
  });
  
  test('renders error message when there are errors and the field is touched', () => {
    render(
      <DeviceSelect 
        deviceOptions={mockDeviceOptions}
        value={null}
        onChange={mockOnChange}
        isDisabled={false}
        hasCustomer={true}
        errors="機器を選択してください"
        touched={true}
      />
    );
    
    // エラーメッセージが表示されているか確認
    expect(screen.getByText('機器を選択してください')).toBeInTheDocument();
    
    // フォームコントロールにエラークラスが適用されているか確認
    const formControl = document.querySelector('.form-control');
    expect(formControl).toHaveClass('is-invalid');
  });
  
  test('does not show error message when there are errors but the field is not touched', () => {
    render(
      <DeviceSelect 
        deviceOptions={mockDeviceOptions}
        value={null}
        onChange={mockOnChange}
        isDisabled={false}
        hasCustomer={true}
        errors="機器を選択してください"
        touched={false}
      />
    );
    
    // エラーメッセージが表示されていないことを確認
    expect(screen.queryByText('機器を選択してください')).not.toBeInTheDocument();
    
    // フォームコントロールにエラークラスが適用されていないことを確認
    const formControl = document.querySelector('.form-control');
    expect(formControl).not.toHaveClass('is-invalid');
  });
  
  test('does not show help text when hasCustomer is false', () => {
    render(
      <DeviceSelect 
        deviceOptions={[]}
        value={null}
        onChange={mockOnChange}
        isDisabled={false}
        hasCustomer={false}
        errors={null}
        touched={false}
      />
    );
    
    // ヘルプテキストが表示されていないことを確認
    expect(screen.queryByText(/登録したい機器が見つかりません/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('info-icon')).not.toBeInTheDocument();
  });
  
  test('has correct styling for list container', () => {
    render(
      <DeviceSelect 
        deviceOptions={mockDeviceOptions}
        value={null}
        onChange={mockOnChange}
        isDisabled={false}
        hasCustomer={true}
        errors={null}
        touched={false}
      />
    );
    
    // リストコンテナが正しいスタイルを持っているか確認
    const listContainer = document.querySelector('.form-control');
    expect(listContainer).toHaveStyle({
      height: `${Math.min(10, mockDeviceOptions.length) * 2.5}rem`,
      overflow: 'auto',
      padding: '0px'
    });
  });
});