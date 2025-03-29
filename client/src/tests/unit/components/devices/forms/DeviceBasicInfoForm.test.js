import React from 'react';
import { render, screen } from '../../../../utils/test-utils';
import { Formik, Form } from 'formik';
import DeviceBasicInfoForm from '../../../../../components/devices/forms/DeviceBasicInfoForm';

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

// テスト用の顧客データ
const mockCustomers = [
  { id: 1, customer_name: 'テスト株式会社A' },
  { id: 2, customer_name: 'テスト株式会社B' }
];

describe('DeviceBasicInfoForm Component', () => {
  it('renders all form fields correctly', () => {
    render(
      <FormikWrapper initialValues={{ customer_id: '', device_name: '', model: '' }}>
        <DeviceBasicInfoForm customers={mockCustomers} />
      </FormikWrapper>
    );
    
    // 基本情報セクションのタイトルが表示されていることを確認
    expect(screen.getByText('基本情報')).toBeInTheDocument();
    
    // 顧客選択フィールドの確認
    expect(screen.getByLabelText('顧客')).toBeInTheDocument();
    expect(screen.getByTestId('customer-select')).toBeInTheDocument();
    
    // 機器名入力フィールドの確認
    expect(screen.getByLabelText('機器名')).toBeInTheDocument();
    expect(screen.getByTestId('device-name-input')).toBeInTheDocument();
    
    // モデル入力フィールドの確認
    expect(screen.getByLabelText('モデル')).toBeInTheDocument();
    expect(screen.getByTestId('model-input')).toBeInTheDocument();
    
    // ヘルプテキストの確認
    expect(screen.getByText('具体的な製品名やモデル番号を入力してください')).toBeInTheDocument();
  });
  
  it('renders customer options correctly', () => {
    render(
      <FormikWrapper initialValues={{ customer_id: '', device_name: '', model: '' }}>
        <DeviceBasicInfoForm customers={mockCustomers} />
      </FormikWrapper>
    );
    
    // デフォルトオプションの確認
    expect(screen.getByText('顧客を選択してください')).toBeInTheDocument();
    
    // 顧客オプションの確認
    expect(screen.getByText('テスト株式会社A')).toBeInTheDocument();
    expect(screen.getByText('テスト株式会社B')).toBeInTheDocument();
  });
  
  it('renders with preselected values when provided', () => {
    render(
      <FormikWrapper initialValues={{ 
        customer_id: '2', 
        device_name: 'テストサーバー', 
        model: 'Model-X' 
      }}>
        <DeviceBasicInfoForm customers={mockCustomers} />
      </FormikWrapper>
    );
    
    // プリセットされた値の確認
    const customerSelect = screen.getByTestId('customer-select');
    expect(customerSelect).toHaveValue('2');
    
    const deviceNameInput = screen.getByTestId('device-name-input');
    expect(deviceNameInput).toHaveValue('テストサーバー');
    
    const modelInput = screen.getByTestId('model-input');
    expect(modelInput).toHaveValue('Model-X');
  });
  
  it('renders without error messages initially', () => {
    render(
      <FormikWrapper initialValues={{ customer_id: '', device_name: '', model: '' }}>
        <DeviceBasicInfoForm customers={mockCustomers} />
      </FormikWrapper>
    );
    
    // Formikによるエラーメッセージは初期状態では表示されない
    // 注: 「顧客を選択してください」はオプションのテキストなのでエラーではない
    expect(screen.queryByText(/必須です/i)).not.toBeInTheDocument();
  });
  
  it('renders required label markers correctly', () => {
    render(
      <FormikWrapper initialValues={{ customer_id: '', device_name: '', model: '' }}>
        <DeviceBasicInfoForm customers={mockCustomers} />
      </FormikWrapper>
    );
    
    // 必須フィールドのラベルスタイルを確認
    const customerLabel = screen.getByText('顧客').closest('label');
    expect(customerLabel).toHaveClass('required-label');
    
    const deviceNameLabel = screen.getByText('機器名').closest('label');
    expect(deviceNameLabel).toHaveClass('required-label');
    
    // モデルは任意フィールドなのでrequired-labelクラスがない
    const modelLabel = screen.getByText('モデル').closest('label');
    expect(modelLabel).not.toHaveClass('required-label');
  });
  
  it('handles empty customers array', () => {
    render(
      <FormikWrapper initialValues={{ customer_id: '', device_name: '', model: '' }}>
        <DeviceBasicInfoForm customers={[]} />
      </FormikWrapper>
    );
    
    // 顧客選択オプションにデフォルトオプションのみが表示される
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('顧客を選択してください');
  });
});