// src/tests/unit/components/inspectionItems/forms/CustomerSelect.test.js
import React from 'react';
import { render, screen, fireEvent } from '../../../../utils/test-utils';
import '@testing-library/jest-dom';
import CustomerSelect from '../../../../../components/inspectionItems/forms/CustomerSelect';

// react-selectコンポーネントのモック
jest.mock('react-select', () => ({ options, value, onChange, placeholder, isSearchable, isClearable, noOptionsMessage, classNamePrefix, styles, inputId, name }) => {
  // スタイルとクラス名のプレフィックスは無視して単純なセレクトボックスとしてレンダリング
  function handleChange(event) {
    const option = options.find(option => option.value === event.target.value);
    onChange(option);
  }
  
  // プレースホルダーを処理
  const placeholderText = placeholder || 'Select...';
  
  return (
    <div className="mock-react-select" data-testid="mock-react-select">
      <select 
        id={inputId}
        name={name}
        data-testid="select"
        onChange={handleChange}
        value={value ? value.value : ''}
        className={classNamePrefix ? `${classNamePrefix}-container` : ''}
      >
        <option value="" disabled={!isClearable}>
          {placeholderText}
        </option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* モック内の状態を表示するための隠し入力 */}
      <input 
        type="hidden" 
        data-testid="is-searchable" 
        value={isSearchable ? 'true' : 'false'} 
      />
      <input 
        type="hidden" 
        data-testid="is-clearable" 
        value={isClearable ? 'true' : 'false'} 
      />
      {/* noOptionsMessageが関数かどうかをチェック */}
      {noOptionsMessage && (
        <input 
          type="hidden" 
          data-testid="no-options-message" 
          value={typeof noOptionsMessage === 'function' ? noOptionsMessage() : noOptionsMessage} 
        />
      )}
    </div>
  );
});

describe('CustomerSelect', () => {
  const mockCustomerOptions = [
    { value: 'customer1', label: '顧客A' },
    { value: 'customer2', label: '顧客B' },
    { value: 'customer3', label: '顧客C' }
  ];
  
  const mockOnChange = jest.fn();

  beforeEach(() => {
    // テスト前にモックをリセット
    mockOnChange.mockClear();
  });

  test('renders correctly with options', () => {
    render(
      <CustomerSelect 
        customerOptions={mockCustomerOptions}
        value={null}
        onChange={mockOnChange}
        errors={null}
        touched={false}
      />
    );
    
    // ラベルが正しく表示されているか確認
    expect(screen.getByText('顧客名')).toBeInTheDocument();
    
    // react-selectコンポーネントがレンダリングされているか確認
    expect(screen.getByTestId('mock-react-select')).toBeInTheDocument();
    
    // プレースホルダーテキストが正しいか確認
    const select = screen.getByTestId('select');
    expect(select.options[0].text).toBe('顧客を選択してください');
    
    // 顧客オプションが正しく表示されているか確認
    expect(select.options[1].text).toBe('顧客A');
    expect(select.options[2].text).toBe('顧客B');
    expect(select.options[3].text).toBe('顧客C');
  });
  
  test('handles selection change correctly', () => {
    render(
      <CustomerSelect 
        customerOptions={mockCustomerOptions}
        value={null}
        onChange={mockOnChange}
        errors={null}
        touched={false}
      />
    );
    
    // セレクトの値を変更
    const select = screen.getByTestId('select');
    fireEvent.change(select, { target: { value: 'customer2' } });
    
    // onChangeが正しい値で呼び出されたか確認
    expect(mockOnChange).toHaveBeenCalledWith(mockCustomerOptions[1]);
  });
  
  test('displays selected value correctly', () => {
    render(
      <CustomerSelect 
        customerOptions={mockCustomerOptions}
        value={mockCustomerOptions[2]} // 顧客Cを選択
        onChange={mockOnChange}
        errors={null}
        touched={false}
      />
    );
    
    // セレクトに正しい値が設定されているか確認
    const select = screen.getByTestId('select');
    expect(select.value).toBe('customer3');
  });
  
  test('is searchable and clearable', () => {
    render(
      <CustomerSelect 
        customerOptions={mockCustomerOptions}
        value={null}
        onChange={mockOnChange}
        errors={null}
        touched={false}
      />
    );
    
    // 検索可能か確認
    const isSearchable = screen.getByTestId('is-searchable');
    expect(isSearchable.value).toBe('true');
    
    // クリア可能か確認
    const isClearable = screen.getByTestId('is-clearable');
    expect(isClearable.value).toBe('true');
  });
  
  test('displays custom no options message', () => {
    render(
      <CustomerSelect 
        customerOptions={mockCustomerOptions}
        value={null}
        onChange={mockOnChange}
        errors={null}
        touched={false}
      />
    );
    
    // オプションがない場合のメッセージが正しいか確認
    const noOptionsMessage = screen.getByTestId('no-options-message');
    expect(noOptionsMessage.value).toBe('該当する顧客がありません');
  });
  
  test('renders error message when there are errors and the field is touched', () => {
    render(
      <CustomerSelect 
        customerOptions={mockCustomerOptions}
        value={null}
        onChange={mockOnChange}
        errors="顧客を選択してください"
        touched={true}
      />
    );
    
    // クラスでエラーメッセージを識別して確認
    const errorElement = document.querySelector('.text-danger');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.textContent).toBe('顧客を選択してください');
  });
  
  test('does not show error message when there are errors but the field is not touched', () => {
    render(
      <CustomerSelect 
        customerOptions={mockCustomerOptions}
        value={null}
        onChange={mockOnChange}
        errors="顧客を選択してください"
        touched={false}
      />
    );
    
    // エラーメッセージが表示されていないことを確認
    const errorElement = document.querySelector('.text-danger');
    expect(errorElement).toBeNull();
  });
  
  test('has correct label with required indicator', () => {
    render(
      <CustomerSelect 
        customerOptions={mockCustomerOptions}
        value={null}
        onChange={mockOnChange}
        errors={null}
        touched={false}
      />
    );
    
    // ラベルが正しいクラスを持っているか確認
    const label = screen.getByText('顧客名').closest('label');
    expect(label).toHaveClass('form-label', 'required-label');
    expect(label).toHaveAttribute('for', 'customer_id');
  });
  
  test('renders correctly with empty options', () => {
    render(
      <CustomerSelect 
        customerOptions={[]}
        value={null}
        onChange={mockOnChange}
        errors={null}
        touched={false}
      />
    );
    
    // セレクトがレンダリングされているか確認
    const select = screen.getByTestId('select');
    
    // オプションが1つだけ（プレースホルダー）であることを確認
    expect(select.options.length).toBe(1);
    expect(select.options[0].text).toBe('顧客を選択してください');
  });
});