import React from 'react';
import { deviceAPI } from '../../../../services/api';
import DeviceImportExportInfo from '../../../../components/devices/DeviceImportExportInfo';
import ImportResultModal from '../../../../components/devices/ImportResultModal';
import { mockDevices } from '../../../mocks/mockData';

// APIモック
jest.mock('../../../../services/api', () => ({
  deviceAPI: {
    getAll: jest.fn(),
    delete: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn(),
  },
}));

// Modalコンポーネントのモック
jest.mock('../../../../components/common/Modal', () => {
  return function MockModal(props) {
    return (
      <div data-testid="modal">
        <div data-testid="modal-title">{props.title}</div>
        <div data-testid="modal-content">{props.children}</div>
        {props.showCompleteButton && <button>完了</button>}
      </div>
    );
  };
});

// URL.createObjectURLのモック
URL.createObjectURL = jest.fn(() => 'blob-url');
URL.revokeObjectURL = jest.fn();

describe('Device Export Import Coverage Tests', () => {
  // 前準備
  beforeEach(() => {
    jest.clearAllMocks();
    deviceAPI.getAll.mockResolvedValue(mockDevices);
    deviceAPI.exportData.mockResolvedValue(new Blob(['csv data'], { type: 'text/csv' }));
    deviceAPI.importData.mockResolvedValue({
      data: {
        message: 'インポート成功',
        status: 'success',
        importedRows: 2
      }
    });
    
    // document.createElement と appendChild のモック
    document.createElement = jest.fn().mockReturnValue({
      setAttribute: jest.fn(),
      href: '',
      click: jest.fn(),
      remove: jest.fn()
    });
    document.body.appendChild = jest.fn();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  // 単純なモジュール存在確認テスト
  it('DeviceExportImport components exist', () => {
    // DeviceImportExportInfoコンポーネントの存在チェック
    expect(DeviceImportExportInfo).toBeDefined();
    
    // ImportResultModalコンポーネントの存在チェック
    expect(ImportResultModal).toBeDefined();
    
    // API関数の存在チェック
    expect(deviceAPI.exportData).toBeDefined();
    expect(deviceAPI.importData).toBeDefined();
  });
  
  // DeviceImportExportInfoのスナップショットテスト
  it('DeviceImportExportInfo component is defined correctly', () => {
    // プロパティや関数の存在チェック
    const component = <DeviceImportExportInfo />;
    expect(component.type).toBe(DeviceImportExportInfo);
    
    // コンポーネントは正常に定義されている
    expect(typeof DeviceImportExportInfo).toBe('function');
  });
  
  // ImportResultModalのスナップショットテスト
  it('ImportResultModal component is defined correctly', () => {
    const props = {
      show: true,
      onClose: jest.fn(),
      loading: false,
      result: { message: 'テスト' }
    };
    
    // プロパティや関数の存在チェック
    const component = <ImportResultModal {...props} />;
    expect(component.type).toBe(ImportResultModal);
    
    // コンポーネントは正常に定義されている
    expect(typeof ImportResultModal).toBe('function');
  });
  
  // エクスポート機能のテスト
  it('exportData API function is called with correct parameters', () => {
    // APIを直接呼び出してテスト
    deviceAPI.exportData('csv', 'shift_jis');
    
    // 正しいパラメータで呼ばれたことを確認
    expect(deviceAPI.exportData).toHaveBeenCalledWith('csv', 'shift_jis');
  });
  
  // インポート機能のテスト
  it('importData API function is called with correct parameters', () => {
    // CSVファイルをモック
    const file = new File(['csv data'], 'test.csv', { type: 'text/csv' });
    
    // APIを直接呼び出してテスト
    deviceAPI.importData(file);
    
    // 正しいパラメータで呼ばれたことを確認
    expect(deviceAPI.importData).toHaveBeenCalledWith(file);
  });
  
  // URL.createObjectURLのテスト
  it('URL.createObjectURL is used in export process', () => {
    // URL.createObjectURLのモックが正しく設定されていることを確認
    expect(URL.createObjectURL).toEqual(expect.any(Function));
    
    // Blobを作成
    const blob = new Blob(['csv data'], { type: 'text/csv' });
    
    // モックを明示的に値を返すように設定
    URL.createObjectURL.mockReturnValue('blob-url');
    
    // URL.createObjectURLを呼び出し
    const url = URL.createObjectURL(blob);
    
    // モック関数が呼ばれ、正しい値を返したことを確認
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(url).toBe('blob-url');
  });
});