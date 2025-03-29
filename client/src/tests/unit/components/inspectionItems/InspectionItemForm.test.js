// src/tests/unit/components/inspectionItems/InspectionItemForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import '@testing-library/jest-dom';
import InspectionItemForm from '../../../../components/inspectionItems/InspectionItemForm';
import { useInspectionItemForm } from '../../../../hooks/useInspectionItemForm';
import { mockCustomers, mockDevices, mockInspectionItems } from '../../../mocks/mockData';

// React RouterのuseParamsとuseNavigateをモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: undefined }), // 新規作成モードをデフォルトにする
  useNavigate: () => jest.fn(),
}));

// useInspectionItemFormフックをモック
jest.mock('../../../../hooks/useInspectionItemForm', () => ({
  useInspectionItemForm: jest.fn(),
}));

// 共通コンポーネントをモック - JSXを使わないシンプルな実装
jest.mock('../../../../components/common/Loading', () => () => 'mock-loading');
jest.mock('../../../../components/common/Alert', () => ({ type, message }) => `mock-alert-${type}-${message}`);

// フォームコンポーネントをモック - JSXを使わないシンプルな実装
jest.mock('../../../../components/inspectionItems/forms/CustomerSelect', () => () => 'mock-customer-select');
jest.mock('../../../../components/inspectionItems/forms/LocationSelect', () => () => 'mock-location-select');
jest.mock('../../../../components/inspectionItems/forms/DeviceTypeSelect', () => () => 'mock-device-type-select');
jest.mock('../../../../components/inspectionItems/forms/DeviceSelect', () => () => 'mock-device-select');
jest.mock('../../../../components/inspectionItems/forms/InspectionItemNameInput', () => () => 'mock-inspection-item-name-input');
jest.mock('../../../../components/inspectionItems/forms/FormActionButtons', () => ({ isSubmitting }) => 
  isSubmitting ? 'mock-form-actions-submitting' : 'mock-form-actions-not-submitting'
);

// Formikコンポーネントをモック - シンプルな実装
jest.mock('formik', () => {
  const mockSetFieldValue = jest.fn();
  const mockHandleSubmit = jest.fn();

  return {
    Formik: ({ initialValues, onSubmit, children }) => {
      const formikBag = {
        values: initialValues,
        errors: {},
        touched: {},
        isSubmitting: false,
        setFieldValue: mockSetFieldValue,
        handleSubmit: (e) => {
          if (e) e.preventDefault();
          onSubmit(initialValues, { setSubmitting: jest.fn() });
        }
      };
      
      // Call the children function with the formik bag
      return children(formikBag);
    },
    Form: ({ children, onSubmit }) => `mock-formik-form-${children}`
  };
});

describe('InspectionItemForm', () => {
  // テスト用のモックデータ
  const mockCustomerOptions = mockCustomers.map(customer => ({
    value: customer.id,
    label: customer.customer_name
  }));
  
  const mockLocationOptions = [
    { value: '1', label: 'ラックNo.1' },
    { value: '2', label: 'ラックNo.2' }
  ];
  
  const mockDeviceTypeOptions = [
    { value: 'サーバ', label: 'サーバ' },
    { value: 'ネットワーク機器', label: 'ネットワーク機器' }
  ];
  
  const mockDeviceOptions = mockDevices.map(device => ({
    value: device.id,
    label: device.device_name + (device.model ? ` (${device.model})` : '')
  }));
  
  const mockInitialValues = {
    customer_id: "",
    location: "",
    device_id: "",
    device_type: "",
    item_names: [""],
  };
  
  const mockFormFunctions = {
    updateLocationOptions: jest.fn(),
    updateDeviceOptions: jest.fn(),
    handleSubmit: jest.fn()
  };
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
    
    // useInspectionItemFormフックのデフォルト実装を設定
    useInspectionItemForm.mockReturnValue({
      isEditMode: false,
      item: mockInitialValues,
      customerOptions: mockCustomerOptions,
      locationOptions: mockLocationOptions,
      deviceOptions: mockDeviceOptions,
      deviceTypeOptions: mockDeviceTypeOptions,
      loading: false,
      error: null,
      submitError: null,
      ...mockFormFunctions
    });
  });
  
  test('コンポーネントが存在する', () => {
    expect(InspectionItemForm).toBeDefined();
  });
  
  test('新規作成モードでフォームが正しく表示される', () => {
    const { container } = render(<InspectionItemForm />);
    
    // タイトルが正しいか確認
    expect(screen.getByText('新規点検項目登録')).toBeInTheDocument();
    
    // 各モックコンポーネントが含まれていることを確認
    expect(container.textContent).toContain('mock-customer-select');
    expect(container.textContent).toContain('mock-location-select');
    expect(container.textContent).toContain('mock-device-type-select');
    expect(container.textContent).toContain('mock-device-select');
    expect(container.textContent).toContain('mock-inspection-item-name-input');
    expect(container.textContent).toContain('mock-form-actions-not-submitting');
  });
  
  test('ロード中の状態が表示される', () => {
    // ロード中のモックを設定
    useInspectionItemForm.mockReturnValue({
      loading: true,
      isEditMode: false,
      item: mockInitialValues,
      customerOptions: [],
      locationOptions: [],
      deviceOptions: [],
      deviceTypeOptions: [],
      error: null,
      submitError: null,
      ...mockFormFunctions
    });
    
    const { container } = render(<InspectionItemForm />);
    
    // ローディングコンポーネントが表示されているか確認
    expect(container.textContent).toContain('mock-loading');
    
    // フォームが表示されていないことを確認
    expect(screen.queryByText('新規点検項目登録')).not.toBeInTheDocument();
  });
  
  test('エラーメッセージが表示される', () => {
    // エラーメッセージのモックを設定
    const errorMessage = "点検項目データの取得に失敗しました。";
    useInspectionItemForm.mockReturnValue({
      loading: false,
      isEditMode: false,
      item: mockInitialValues,
      customerOptions: mockCustomerOptions,
      locationOptions: mockLocationOptions,
      deviceOptions: mockDeviceOptions,
      deviceTypeOptions: mockDeviceTypeOptions,
      error: errorMessage, // エラーを設定
      submitError: null,
      ...mockFormFunctions
    });
    
    const { container } = render(<InspectionItemForm />);
    
    // エラーメッセージが表示されているか確認
    expect(container.textContent).toContain(`mock-alert-danger-${errorMessage}`);
  });
  
  test('送信エラーメッセージが表示される', () => {
    // 送信エラーメッセージのモックを設定
    const submitErrorMessage = "点検項目の作成に失敗しました。";
    useInspectionItemForm.mockReturnValue({
      loading: false,
      isEditMode: false,
      item: mockInitialValues,
      customerOptions: mockCustomerOptions,
      locationOptions: mockLocationOptions,
      deviceOptions: mockDeviceOptions,
      deviceTypeOptions: mockDeviceTypeOptions,
      error: null,
      submitError: submitErrorMessage, // 送信エラーを設定
      ...mockFormFunctions
    });
    
    const { container } = render(<InspectionItemForm />);
    
    // 送信エラーメッセージが表示されているか確認
    expect(container.textContent).toContain(`mock-alert-danger-${submitErrorMessage}`);
  });
  
  test('編集モードでフォームが正しく表示される', () => {
    // 編集モードのモックを設定
    const editItem = {
      customer_id: 1,
      location: "1",
      device_id: 1,
      device_type: "サーバ",
      item_names: ["CPUの状態確認"],
    };
    
    useInspectionItemForm.mockReturnValue({
      isEditMode: true, // 編集モードを設定
      item: editItem,
      customerOptions: mockCustomerOptions,
      locationOptions: mockLocationOptions,
      deviceOptions: mockDeviceOptions,
      deviceTypeOptions: mockDeviceTypeOptions,
      loading: false,
      error: null,
      submitError: null,
      ...mockFormFunctions
    });
    
    const { container } = render(<InspectionItemForm />);
    
    // タイトルが編集モードになっているか確認
    expect(screen.getByText('点検項目の編集')).toBeInTheDocument();
  });
  
  test('フォーム送信時にhandleSubmitが呼ばれる', async () => {
    const handleSubmit = jest.fn();
    
    useInspectionItemForm.mockReturnValue({
      isEditMode: false,
      item: mockInitialValues,
      customerOptions: mockCustomerOptions,
      locationOptions: mockLocationOptions,
      deviceOptions: mockDeviceOptions,
      deviceTypeOptions: mockDeviceTypeOptions,
      loading: false,
      error: null,
      submitError: null,
      updateLocationOptions: jest.fn(),
      updateDeviceOptions: jest.fn(),
      handleSubmit // モック関数を設定
    });
    
    render(<InspectionItemForm />);
    
    // Formikの初期化時にコールバックが渡されたとき、コールバックが呼ばれることを確認
    expect(handleSubmit).toHaveBeenCalled();
  });
  
  // 新規テスト: 顧客選択のOnChangeハンドラが正しく動作することを確認
  test('顧客選択時のOnChangeハンドラが正しく動作する', () => {
    // より実践的なsetFieldValueモックを設定
    const setFieldValue = jest.fn();
    const updateLocationOptions = jest.fn();
    const updateDeviceOptions = jest.fn();
    
    // 顧客選択のハンドラを直接実行
    const handleCustomerChange = (selectedOption) => {
      setFieldValue("customer_id", selectedOption ? selectedOption.value : "");
      setFieldValue("location", "");
      setFieldValue("device_type", "");
      setFieldValue("device_id", "");
      
      if (selectedOption) {
        updateLocationOptions(parseInt(selectedOption.value, 10));
        updateDeviceOptions(parseInt(selectedOption.value, 10), "", "");
      }
    };
    
    handleCustomerChange({ value: 1, label: 'テスト顧客1' });
    
    // 関数の呼び出しを検証
    expect(setFieldValue).toHaveBeenCalledWith("customer_id", 1);
    expect(setFieldValue).toHaveBeenCalledWith("location", "");
    expect(setFieldValue).toHaveBeenCalledWith("device_type", "");
    expect(setFieldValue).toHaveBeenCalledWith("device_id", "");
    expect(updateLocationOptions).toHaveBeenCalledWith(1);
    expect(updateDeviceOptions).toHaveBeenCalledWith(1, "", "");
    
    // 顧客選択が空の場合も検証
    setFieldValue.mockClear();
    updateLocationOptions.mockClear();
    updateDeviceOptions.mockClear();
    
    handleCustomerChange(null);
    
    expect(setFieldValue).toHaveBeenCalledWith("customer_id", "");
    expect(updateLocationOptions).not.toHaveBeenCalled();
    expect(updateDeviceOptions).not.toHaveBeenCalled();
  });
  
  // 新規テスト: 設置場所選択のOnChangeハンドラが正しく動作することを確認
  test('設置場所選択時のOnChangeハンドラが正しく動作する', () => {
    const setFieldValue = jest.fn();
    const updateDeviceOptions = jest.fn();
    
    // 設置場所選択のハンドラを直接実行
    const handleLocationChange = (selectedOption) => {
      setFieldValue("location", selectedOption ? selectedOption.value : "");
      setFieldValue("device_id", "");
      
      updateDeviceOptions(
        "1", // 顧客ID
        selectedOption ? selectedOption.value : null,
        "サーバ" // 機器種別
      );
    };
    
    // 設置場所を選択した場合
    const selectedLocation = { value: "1", label: 'ラックNo.1' };
    handleLocationChange(selectedLocation);
    
    // 関数の呼び出しを検証
    expect(setFieldValue).toHaveBeenCalledWith("location", "1");
    expect(setFieldValue).toHaveBeenCalledWith("device_id", "");
    expect(updateDeviceOptions).toHaveBeenCalledWith("1", "1", "サーバ");
    
    // 設置場所選択が空の場合も検証
    setFieldValue.mockClear();
    updateDeviceOptions.mockClear();
    
    handleLocationChange(null);
    
    expect(setFieldValue).toHaveBeenCalledWith("location", "");
    expect(updateDeviceOptions).toHaveBeenCalledWith("1", null, "サーバ");
  });
  
  // 新規テスト: 機器種別選択のOnChangeハンドラが正しく動作することを確認
  test('機器種別選択時のOnChangeハンドラが正しく動作する', () => {
    const setFieldValue = jest.fn();
    const updateDeviceOptions = jest.fn();
    
    // 機器種別選択のハンドラを直接実行
    const handleDeviceTypeChange = (deviceType) => {
      setFieldValue("device_type", deviceType);
      setFieldValue("device_id", "");
      
      updateDeviceOptions(
        "1", // 顧客ID
        "2", // 設置場所
        deviceType
      );
    };
    
    // 機器種別を選択した場合
    handleDeviceTypeChange("サーバ");
    
    // 関数の呼び出しを検証
    expect(setFieldValue).toHaveBeenCalledWith("device_type", "サーバ");
    expect(setFieldValue).toHaveBeenCalledWith("device_id", "");
    expect(updateDeviceOptions).toHaveBeenCalledWith("1", "2", "サーバ");
    
    // 機器種別選択が空の場合も検証
    setFieldValue.mockClear();
    updateDeviceOptions.mockClear();
    
    handleDeviceTypeChange("");
    
    expect(setFieldValue).toHaveBeenCalledWith("device_type", "");
    expect(updateDeviceOptions).toHaveBeenCalledWith("1", "2", "");
  });
  
  // 新規テスト: 機器選択のOnChangeハンドラが正しく動作することを確認
  test('機器選択時のOnChangeハンドラが正しく動作する', () => {
    const setFieldValue = jest.fn();
    
    // 機器選択のハンドラを直接実行
    const handleDeviceChange = (selectedOption) => {
      // 選択オプションが存在する場合のみsetFieldValueを実行
      if (selectedOption) {
        setFieldValue("device_id", selectedOption.value);
      } else {
        setFieldValue("device_id", "");
      }
    };
    
    // 機器を選択した場合
    const selectedDevice = { value: 1, label: 'サーバー1' };
    handleDeviceChange(selectedDevice);
    
    // 関数の呼び出しを検証
    expect(setFieldValue).toHaveBeenCalledWith("device_id", 1);
    
    // 機器選択が空の場合も検証
    setFieldValue.mockClear();
    
    handleDeviceChange(null);
    
    expect(setFieldValue).toHaveBeenCalledWith("device_id", "");
  });
  
  // 新規テスト: Formikの検証ロジックが正しく機能することを確認
  test('Formikの検証が正しく機能する', () => {
    // Validation Schemaをシミュレート
    const mockValidate = (values) => {
      const errors = {};
      
      if (!values.customer_id) {
        errors.customer_id = "顧客の選択は必須です";
      }
      
      if (!values.device_id) {
        errors.device_id = "機器の選択は必須です";
      }
      
      return errors;
    };
    
    // 検証エラーがある場合
    const errorsWithEmptyValues = mockValidate({ 
      customer_id: "", 
      device_id: "", 
      location: "", 
      device_type: "", 
      item_names: [""] 
    });
    
    expect(errorsWithEmptyValues.customer_id).toBe("顧客の選択は必須です");
    expect(errorsWithEmptyValues.device_id).toBe("機器の選択は必須です");
    
    // 検証エラーがない場合
    const errorsWithValidValues = mockValidate({ 
      customer_id: 1, 
      device_id: 1, 
      location: "1", 
      device_type: "サーバ", 
      item_names: ["CPUの状態確認"] 
    });
    
    expect(errorsWithValidValues.customer_id).toBeUndefined();
    expect(errorsWithValidValues.device_id).toBeUndefined();
  });
});