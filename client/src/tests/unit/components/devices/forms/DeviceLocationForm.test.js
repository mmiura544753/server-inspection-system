import React from 'react';
import { render, screen } from '../../../../utils/test-utils';
import { Formik, Form } from 'formik';
import DeviceLocationForm from '../../../../../components/devices/forms/DeviceLocationForm';

// FormikコンテキストなしではFieldコンポーネントが動作しないため、
// テスト用のラッパーを作成
const FormikWrapper = ({ children, initialValues = {} }) => (
  <Formik
    initialValues={initialValues}
    onSubmit={() => {}}
  >
    <Form>{children}</Form>
  </Formik>
);

describe('DeviceLocationForm Component', () => {
  it('renders all form fields correctly', () => {
    render(
      <FormikWrapper initialValues={{ 
        rack_number: '', 
        unit_start_position: '', 
        unit_end_position: '' 
      }}>
        <DeviceLocationForm />
      </FormikWrapper>
    );
    
    // 設置場所情報セクションのタイトルが表示されていることを確認
    expect(screen.getByText('設置場所情報')).toBeInTheDocument();
    
    // 設置ラックNo.フィールドの確認
    expect(screen.getByLabelText('設置ラックNo.')).toBeInTheDocument();
    expect(screen.getByTestId('rack-number-input')).toBeInTheDocument();
    expect(screen.getByText('設置されているラックの番号を入力してください')).toBeInTheDocument();
    
    // ユニット開始位置フィールドの確認
    expect(screen.getByLabelText('ユニット開始位置')).toBeInTheDocument();
    expect(screen.getByTestId('unit-start-position-input')).toBeInTheDocument();
    expect(screen.getByText('ラックの搭載開始位置を数値で入力してください（例: 1）')).toBeInTheDocument();
    
    // ユニット終了位置フィールドの確認
    expect(screen.getByLabelText('ユニット終了位置')).toBeInTheDocument();
    expect(screen.getByTestId('unit-end-position-input')).toBeInTheDocument();
    expect(screen.getByText('ラックの搭載終了位置を数値で入力してください（単一ユニットの場合は開始位置と同じ値を入力）')).toBeInTheDocument();
  });
  
  it('renders with preselected values when provided', () => {
    render(
      <FormikWrapper initialValues={{ 
        rack_number: '5', 
        unit_start_position: '10', 
        unit_end_position: '12' 
      }}>
        <DeviceLocationForm />
      </FormikWrapper>
    );
    
    // プリセットされた値の確認
    const rackNumberInput = screen.getByTestId('rack-number-input');
    expect(rackNumberInput).toHaveValue(5);
    
    const unitStartPositionInput = screen.getByTestId('unit-start-position-input');
    expect(unitStartPositionInput).toHaveValue(10);
    
    const unitEndPositionInput = screen.getByTestId('unit-end-position-input');
    expect(unitEndPositionInput).toHaveValue(12);
  });
  
  it('renders with empty values correctly', () => {
    render(
      <FormikWrapper initialValues={{ 
        rack_number: '', 
        unit_start_position: '', 
        unit_end_position: '' 
      }}>
        <DeviceLocationForm />
      </FormikWrapper>
    );
    
    // 空の入力フィールドの確認
    const rackNumberInput = screen.getByTestId('rack-number-input');
    expect(rackNumberInput).toHaveValue(null);
    
    const unitStartPositionInput = screen.getByTestId('unit-start-position-input');
    expect(unitStartPositionInput).toHaveValue(null);
    
    const unitEndPositionInput = screen.getByTestId('unit-end-position-input');
    expect(unitEndPositionInput).toHaveValue(null);
  });
  
  it('has correct min/max attributes on number inputs', () => {
    render(
      <FormikWrapper initialValues={{ 
        rack_number: '', 
        unit_start_position: '', 
        unit_end_position: '' 
      }}>
        <DeviceLocationForm />
      </FormikWrapper>
    );
    
    // ラック番号の最小値を確認
    const rackNumberInput = screen.getByTestId('rack-number-input');
    expect(rackNumberInput).toHaveAttribute('min', '1');
    
    // ユニット開始位置の最小値と最大値を確認
    const unitStartPositionInput = screen.getByTestId('unit-start-position-input');
    expect(unitStartPositionInput).toHaveAttribute('min', '1');
    expect(unitStartPositionInput).toHaveAttribute('max', '99');
    
    // ユニット終了位置の最小値と最大値を確認
    const unitEndPositionInput = screen.getByTestId('unit-end-position-input');
    expect(unitEndPositionInput).toHaveAttribute('min', '1');
    expect(unitEndPositionInput).toHaveAttribute('max', '99');
  });
  
  it('has correct placeholder text on inputs', () => {
    render(
      <FormikWrapper initialValues={{ 
        rack_number: '', 
        unit_start_position: '', 
        unit_end_position: '' 
      }}>
        <DeviceLocationForm />
      </FormikWrapper>
    );
    
    // プレースホルダーテキストの確認
    const rackNumberInput = screen.getByTestId('rack-number-input');
    expect(rackNumberInput).toHaveAttribute('placeholder', 'ラック番号を入力 (例: 8)');
    
    const unitStartPositionInput = screen.getByTestId('unit-start-position-input');
    expect(unitStartPositionInput).toHaveAttribute('placeholder', '例: 1');
    
    const unitEndPositionInput = screen.getByTestId('unit-end-position-input');
    expect(unitEndPositionInput).toHaveAttribute('placeholder', '例: 2');
  });
});