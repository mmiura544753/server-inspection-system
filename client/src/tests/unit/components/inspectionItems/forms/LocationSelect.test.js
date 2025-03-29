// src/tests/unit/components/inspectionItems/forms/LocationSelect.test.js
import React from 'react';
import { render, screen, fireEvent } from '../../../../utils/test-utils';
import '@testing-library/jest-dom';
import LocationSelect from '../../../../../components/inspectionItems/forms/LocationSelect';

describe('LocationSelect', () => {
  // テスト用のロケーションオプション
  const mockLocationOptions = [
    { value: 'r01', label: 'ラックR01' },
    { value: 'r02', label: 'ラックR02' },
    { value: 'r03', label: 'ラックR03' }
  ];

  // 基本的なプロップ
  const defaultProps = {
    locationOptions: mockLocationOptions,
    value: null,
    onChange: jest.fn(),
    isDisabled: false
  };

  test('renders with location options', () => {
    render(<LocationSelect {...defaultProps} />);
    
    // ラベルが正しく表示されるか確認
    expect(screen.getByText('設置ラックNo.')).toBeInTheDocument();
    
    // セレクトボックスが表示されるか確認
    const selectElement = screen.getByRole('listbox');
    expect(selectElement).toBeInTheDocument();
    
    // オプションが正しく表示されるか確認
    mockLocationOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  test('displays message when no options are available', () => {
    const props = {
      ...defaultProps,
      locationOptions: []
    };
    
    render(<LocationSelect {...props} />);
    
    // オプションがない場合のメッセージを確認
    expect(screen.getByText('設置場所がありません')).toBeInTheDocument();
    
    // セレクトボックスが表示されないことを確認
    const selectElement = screen.queryByRole('listbox');
    expect(selectElement).not.toBeInTheDocument();
  });

  test('displays message when disabled', () => {
    const props = {
      ...defaultProps,
      isDisabled: true
    };
    
    render(<LocationSelect {...props} />);
    
    // 無効時のメッセージを確認
    expect(screen.getByText('先に顧客を選択してください')).toBeInTheDocument();
    
    // セレクトボックスが表示されないことを確認
    const selectElement = screen.queryByRole('listbox');
    expect(selectElement).not.toBeInTheDocument();
  });

  test('selects value correctly', () => {
    // 選択された値を持つプロップ
    const props = {
      ...defaultProps,
      value: mockLocationOptions[1] // r02が選択されている
    };
    
    render(<LocationSelect {...props} />);
    
    // セレクトボックスの値が正しいか確認
    const selectElement = screen.getByRole('listbox');
    expect(selectElement).toHaveValue('r02');
  });

  test('calls onChange when selection changes', () => {
    const onChangeMock = jest.fn();
    const props = {
      ...defaultProps,
      onChange: onChangeMock
    };
    
    render(<LocationSelect {...props} />);
    
    // セレクトボックスの値を変更
    const selectElement = screen.getByRole('listbox');
    fireEvent.change(selectElement, { target: { value: 'r02' } });
    
    // onChangeが正しく呼ばれたか確認
    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock).toHaveBeenCalledWith(mockLocationOptions[1]);
  });

  test('sets correct size attribute', () => {
    // 多数のオプションを持つプロップ
    const manyOptions = Array.from({ length: 15 }, (_, i) => ({
      value: `r${i+1}`.padStart(3, '0'),
      label: `ラックR${i+1}`.padStart(3, '0')
    }));
    
    const props = {
      ...defaultProps,
      locationOptions: manyOptions
    };
    
    render(<LocationSelect {...props} />);
    
    // sizeが最大10に制限されていることを確認
    const selectElement = screen.getByRole('listbox');
    expect(selectElement).toHaveAttribute('size', '10');
  });

  test('sets correct size attribute with few options', () => {
    // 少数のオプションを持つプロップ
    const fewOptions = mockLocationOptions.slice(0, 2);
    
    const props = {
      ...defaultProps,
      locationOptions: fewOptions
    };
    
    render(<LocationSelect {...props} />);
    
    // sizeがオプション数と同じであることを確認
    const selectElement = screen.getByRole('listbox');
    expect(selectElement).toHaveAttribute('size', '2');
  });
});