import React from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import InspectionTable from '../../../../components/inspections/InspectionTable';

// モック
jest.mock('../../../../utils/sortUtils', () => ({
  sortArrayByKey: jest.fn((array) => array),
  compareValues: jest.fn()
}));

// コンソールログをモック化
console.log = jest.fn();

describe('InspectionTable Component', () => {
  // テスト用のデータと関数
  const mockUpdateResult = jest.fn();
  
  // 階層構造のデータ
  const hierarchicalItems = [
    {
      id: 1,
      locationName: 'テストロケーション1',
      servers: [
        {
          id: 'サーバー1',
          device_name: 'サーバー1',
          model: 'テストモデル1',
          unit_position: 'U1',
          items: ['項目1', '項目2'],
          results: [true, null]
        },
        {
          id: 'サーバー2',
          device_name: 'サーバー2',
          model: 'テストモデル2',
          unit_position: 'U2',
          items: ['項目1'],
          results: [false]
        }
      ]
    }
  ];
  
  // フラット構造のデータ
  const flatItems = [
    {
      id: 'フラットアイテム1',
      device_name: 'テストデバイス1',
      model: 'テストモデル',
      rack_number: '1',
      locationName: 'テストロケーション',
      unit_position: 'U1',
      item_name: 'テスト項目',
      result: true
    },
    {
      id: 'フラットアイテム2',
      device_name: 'テストデバイス2',
      model: 'テストモデル',
      rack_number: '2',
      locationName: 'テストロケーション2',
      unit_position: 'U2',
      item_name: 'テスト項目2',
      result: false
    }
  ];
  
  // 各テスト前にリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('表示すべきデータがない場合にメッセージを表示する', () => {
    render(<InspectionTable inspectionItems={[]} updateResult={mockUpdateResult} />);
    
    // 警告メッセージが表示されることを確認
    expect(screen.getByText(/点検項目がありません/)).toBeInTheDocument();
  });
  
  it('階層構造のデータを正しく表示する', () => {
    render(<InspectionTable inspectionItems={hierarchicalItems} updateResult={mockUpdateResult} />);
    
    // テーブルヘッダーが表示されることを確認
    expect(screen.getByText('ラックNo')).toBeInTheDocument();
    expect(screen.getByText('ユニット')).toBeInTheDocument();
    expect(screen.getByText('サーバ名')).toBeInTheDocument();
    expect(screen.getByText('機種')).toBeInTheDocument();
    expect(screen.getByText('点検項目')).toBeInTheDocument();
    expect(screen.getByText('点検結果')).toBeInTheDocument();
    
    // ロケーション名が表示されることを確認
    expect(screen.getByText('テストロケーション1')).toBeInTheDocument();
    
    // サーバーの情報が表示されることを確認
    expect(screen.getByText('サーバー1')).toBeInTheDocument();
    expect(screen.getByText('サーバー2')).toBeInTheDocument();
    expect(screen.getByText('テストモデル1')).toBeInTheDocument();
    expect(screen.getByText('テストモデル2')).toBeInTheDocument();
    expect(screen.getByText('U1')).toBeInTheDocument();
    expect(screen.getByText('U2')).toBeInTheDocument();
    
    // 点検項目が表示されることを確認
    expect(screen.getAllByText('項目1').length).toBe(2);
    expect(screen.getByText('項目2')).toBeInTheDocument();
    
    // 結果ボタンが複数存在することを確認
    const normalButtons = screen.getAllByText('正常');
    const abnormalButtons = screen.getAllByText('異常');
    expect(normalButtons.length).toBeGreaterThanOrEqual(3);
    expect(abnormalButtons.length).toBeGreaterThanOrEqual(3);
    
    // 「全て正常」ボタンが表示されていることを確認
    expect(screen.getByText('全て正常')).toBeInTheDocument();
  });
  
  it('フラット構造のデータを正しく表示する', () => {
    render(<InspectionTable inspectionItems={flatItems} updateResult={mockUpdateResult} />);
    
    // フラット構造のアイテムが表示されていることを確認
    expect(screen.getByText('テストロケーション')).toBeInTheDocument();
    expect(screen.getByText('テストロケーション2')).toBeInTheDocument();
    expect(screen.getByText('テストデバイス1')).toBeInTheDocument();
    expect(screen.getByText('テストデバイス2')).toBeInTheDocument();
    expect(screen.getByText('テスト項目')).toBeInTheDocument();
    expect(screen.getByText('テスト項目2')).toBeInTheDocument();
    
    // 「全て正常」ボタンが2つ表示されていることを確認
    const allNormalButtons = screen.getAllByText('全て正常');
    expect(allNormalButtons.length).toBe(2);
  });
  
  it('正常/異常ボタンをクリックするとupdateResult関数が呼ばれる', () => {
    render(<InspectionTable inspectionItems={hierarchicalItems} updateResult={mockUpdateResult} />);
    
    // 正常ボタンをクリック
    const normalButtons = screen.getAllByText('正常');
    fireEvent.click(normalButtons[0]);
    
    // updateResult関数が正しい引数で呼ばれたことを確認
    expect(mockUpdateResult).toHaveBeenCalledWith(0, 0, 0, true);
    
    // 異常ボタンをクリック
    const abnormalButtons = screen.getAllByText('異常');
    fireEvent.click(abnormalButtons[0]);
    
    // updateResult関数が正しい引数で呼ばれたことを確認
    expect(mockUpdateResult).toHaveBeenCalledWith(0, 0, 0, false);
  });
  
  it('「全て正常」ボタンをクリックすると全ての項目に対してupdateResultが呼ばれる', () => {
    render(<InspectionTable inspectionItems={hierarchicalItems} updateResult={mockUpdateResult} />);
    
    // 「全て正常」ボタンをクリック
    const allNormalButton = screen.getByText('全て正常');
    fireEvent.click(allNormalButton);
    
    // 全ての項目に対してupdateResultが呼ばれたことを確認
    // hierarchicalItemsには2つのサーバーに計3つの項目がある
    expect(mockUpdateResult).toHaveBeenCalledTimes(3);
    expect(mockUpdateResult).toHaveBeenCalledWith(0, 0, 0, true);
    expect(mockUpdateResult).toHaveBeenCalledWith(0, 0, 1, true);
    expect(mockUpdateResult).toHaveBeenCalledWith(0, 1, 0, true);
  });
  
  it('結果の状態に応じてボタンのスタイルが変わる', () => {
    render(<InspectionTable inspectionItems={hierarchicalItems} updateResult={mockUpdateResult} />);
    
    // 結果がtrueのボタンはアクティブ表示になる
    const normalButtons = screen.getAllByText('正常');
    expect(normalButtons[0].className).toContain('bg-green-500');
    
    // 結果がfalseのボタンはアクティブ表示になる
    const abnormalButtons = screen.getAllByText('異常');
    const activeAbnormalButton = abnormalButtons.find(button => 
      button.className.includes('bg-red-500')
    );
    expect(activeAbnormalButton).toBeDefined();
    
    // 結果がnullのボタンは非アクティブ表示になる
    const inactiveButtons = Array.from(normalButtons).concat(Array.from(abnormalButtons))
      .filter(button => button.className.includes('bg-gray-200'));
    expect(inactiveButtons.length).toBeGreaterThan(0);
  });
  
  it('フラット構造のデータで正常/異常ボタンをクリックするとupdateResult関数が呼ばれる', () => {
    render(<InspectionTable inspectionItems={flatItems} updateResult={mockUpdateResult} />);
    
    // 正常ボタンをクリック
    const normalButtons = screen.getAllByText('正常');
    fireEvent.click(normalButtons[0]);
    
    // updateResult関数が呼ばれたことを確認
    expect(mockUpdateResult).toHaveBeenCalledWith(0, 0, 0, true);
    
    // 異常ボタンをクリック
    const abnormalButtons = screen.getAllByText('異常');
    fireEvent.click(abnormalButtons[0]);
    
    // updateResult関数が呼ばれたことを確認
    expect(mockUpdateResult).toHaveBeenCalledWith(0, 0, 0, false);
  });
});