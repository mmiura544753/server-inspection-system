import React from 'react';
import { render, screen } from '../../../../utils/test-utils';
import { Formik, Form } from 'formik';
import DeviceTypeForm from '../../../../../components/devices/forms/DeviceTypeForm';

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

describe('DeviceTypeForm Component', () => {
  it('renders all form fields correctly', () => {
    render(
      <FormikWrapper initialValues={{ 
        device_type: 'サーバ', 
        hardware_type: '物理' 
      }}>
        <DeviceTypeForm />
      </FormikWrapper>
    );
    
    // 機器タイプセクションのタイトルが表示されていることを確認
    expect(screen.getByText('機器タイプ')).toBeInTheDocument();
    
    // 機器種別フィールドの確認
    expect(screen.getByLabelText('機器種別')).toBeInTheDocument();
    expect(screen.getByTestId('device-type-select')).toBeInTheDocument();
    
    // ハードウェアタイプフィールドの確認
    expect(screen.getByLabelText('ハードウェアタイプ')).toBeInTheDocument();
    expect(screen.getByTestId('hardware-type-select')).toBeInTheDocument();
    expect(screen.getByText('物理マシンか仮想マシンかを選択してください')).toBeInTheDocument();
  });
  
  it('renders all device type options correctly', () => {
    render(
      <FormikWrapper initialValues={{ 
        device_type: 'サーバ', 
        hardware_type: '物理' 
      }}>
        <DeviceTypeForm />
      </FormikWrapper>
    );
    
    // 機器種別の選択肢を確認
    expect(screen.getByRole('option', { name: 'サーバ' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'UPS' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ネットワーク機器' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'その他' })).toBeInTheDocument();
  });
  
  it('renders all hardware type options correctly', () => {
    render(
      <FormikWrapper initialValues={{ 
        device_type: 'サーバ', 
        hardware_type: '物理' 
      }}>
        <DeviceTypeForm />
      </FormikWrapper>
    );
    
    // ハードウェアタイプの選択肢を確認
    expect(screen.getByRole('option', { name: '物理' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '仮想マシン (VM)' })).toBeInTheDocument();
  });
  
  it('renders with preselected values when provided', () => {
    render(
      <FormikWrapper initialValues={{ 
        device_type: 'ネットワーク機器', 
        hardware_type: 'VM' 
      }}>
        <DeviceTypeForm />
      </FormikWrapper>
    );
    
    // プリセットされた値の確認
    const deviceTypeSelect = screen.getByTestId('device-type-select');
    expect(deviceTypeSelect).toHaveValue('ネットワーク機器');
    
    const hardwareTypeSelect = screen.getByTestId('hardware-type-select');
    expect(hardwareTypeSelect).toHaveValue('VM');
  });
  
  it('applies required-label class to both select fields', () => {
    render(
      <FormikWrapper initialValues={{ 
        device_type: 'サーバ', 
        hardware_type: '物理' 
      }}>
        <DeviceTypeForm />
      </FormikWrapper>
    );
    
    // 必須フィールドのラベルスタイルを確認
    const deviceTypeLabel = screen.getByText('機器種別').closest('label');
    expect(deviceTypeLabel).toHaveClass('required-label');
    
    const hardwareTypeLabel = screen.getByText('ハードウェアタイプ').closest('label');
    expect(hardwareTypeLabel).toHaveClass('required-label');
  });
  
  it('renders form select elements with correct CSS classes', () => {
    render(
      <FormikWrapper initialValues={{ 
        device_type: 'サーバ', 
        hardware_type: '物理' 
      }}>
        <DeviceTypeForm />
      </FormikWrapper>
    );
    
    // フォーム要素のCSSクラスを確認
    const deviceTypeSelect = screen.getByTestId('device-type-select');
    expect(deviceTypeSelect).toHaveClass('form-select');
    
    const hardwareTypeSelect = screen.getByTestId('hardware-type-select');
    expect(hardwareTypeSelect).toHaveClass('form-select');
  });
});