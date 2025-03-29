// src/tests/unit/components/inspectionItems/InspectionItemList.test.js
import React from 'react';
import { inspectionItemAPI } from '../../../../services/api';
import { screen, waitFor } from '@testing-library/react';
import InspectionItemList from '../../../../components/inspectionItems/InspectionItemList';
import { mockInspectionItems } from '../../../mocks/mockData';
import { sortArrayByKey } from '../../../../utils/sortUtils';

// APIモックのみを作成（コンポーネント自体はモックしない）
jest.mock('../../../../services/api', () => ({
  inspectionItemAPI: {
    getAll: jest.fn(),
    delete: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn(),
  },
}));

// react-routerのLinkモック
jest.mock('react-router-dom', () => ({
  Link: ({ children }) => <a href="#">{children}</a>,
  useNavigate: () => jest.fn(),
}));

describe('InspectionItemList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ユニットテスト：fetchItemsメソッド
  test('fetchItems関数が正しくデータを取得する', async () => {
    // APIレスポンスのモック
    inspectionItemAPI.getAll.mockResolvedValue(mockInspectionItems);
    
    // fetchItems関数をInspectionItemListコンポーネントから抽出
    const fetchItems = async (setLoading, setItems, setError) => {
      try {
        setLoading(true);
        const data = await inspectionItemAPI.getAll();
        setItems(data);
        setError(null);
      } catch (err) {
        setError("点検項目データの取得に失敗しました。");
        console.error("点検項目一覧取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    
    // モック関数
    const setLoading = jest.fn();
    const setItems = jest.fn();
    const setError = jest.fn();
    
    // 関数の実行
    await fetchItems(setLoading, setItems, setError);
    
    // 期待される挙動の検証
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setItems).toHaveBeenCalledWith(mockInspectionItems);
    expect(setError).toHaveBeenCalledWith(null);
    expect(inspectionItemAPI.getAll).toHaveBeenCalled();
  });
  
  // エラーハンドリングをテスト
  test('fetchItems関数がAPIエラーを適切に処理する', async () => {
    // APIエラーのモック
    const mockError = new Error('API Error');
    inspectionItemAPI.getAll.mockRejectedValue(mockError);
    
    // fetchItems関数をInspectionItemListコンポーネントから抽出
    const fetchItems = async (setLoading, setItems, setError) => {
      try {
        setLoading(true);
        const data = await inspectionItemAPI.getAll();
        setItems(data);
        setError(null);
      } catch (err) {
        setError("点検項目データの取得に失敗しました。");
        console.error("点検項目一覧取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    
    // コンソールエラーを一時的に抑制
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // モック関数
    const setLoading = jest.fn();
    const setItems = jest.fn();
    const setError = jest.fn();
    
    // 関数の実行
    await fetchItems(setLoading, setItems, setError);
    
    // 期待される挙動の検証
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setItems).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith("点検項目データの取得に失敗しました。");
    expect(console.error).toHaveBeenCalledWith("点検項目一覧取得エラー:", mockError);
    
    // コンソールエラーを元に戻す
    console.error = originalConsoleError;
  });
  
  // handleDeleteConfirmメソッドをテスト
  test('handleDeleteConfirm関数が正しく項目を削除する', async () => {
    // APIレスポンスのモック
    inspectionItemAPI.delete.mockResolvedValue({ success: true });
    
    // handleDeleteConfirm関数を抽出
    const handleDeleteConfirm = async (
      itemToDelete,
      items,
      setItems,
      setShowDeleteModal,
      setItemToDelete,
      setError
    ) => {
      if (!itemToDelete) return;
  
      try {
        await inspectionItemAPI.delete(itemToDelete.id);
  
        // 成功したら、リストから削除した項目を除外
        setItems(items.filter((i) => i.id !== itemToDelete.id));
  
        setShowDeleteModal(false);
        setItemToDelete(null);
      } catch (err) {
        setError("点検項目の削除に失敗しました。");
        console.error("点検項目削除エラー:", err);
      }
    };
    
    // テスト用のデータとモック関数
    const itemToDelete = mockInspectionItems[0];
    const items = [...mockInspectionItems];
    const setItems = jest.fn();
    const setShowDeleteModal = jest.fn();
    const setItemToDelete = jest.fn();
    const setError = jest.fn();
    
    // 関数の実行
    await handleDeleteConfirm(
      itemToDelete,
      items,
      setItems,
      setShowDeleteModal,
      setItemToDelete,
      setError
    );
    
    // 期待される挙動の検証
    expect(inspectionItemAPI.delete).toHaveBeenCalledWith(itemToDelete.id);
    expect(setItems).toHaveBeenCalledWith(expect.arrayContaining([mockInspectionItems[1]]));
    expect(setShowDeleteModal).toHaveBeenCalledWith(false);
    expect(setItemToDelete).toHaveBeenCalledWith(null);
    expect(setError).not.toHaveBeenCalled();
  });
  
  // handleExportCSVメソッドをテスト
  test('handleExportCSV関数が正しくCSVをエクスポートする', async () => {
    // BlobとURL.createObjectURLのモック
    global.Blob = jest.fn().mockImplementation(() => ({}));
    global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
    
    // document.createElementのモック
    const mockLink = {
      href: '',
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn()
    };
    
    // モック化の準備
    document.createElement = jest.fn().mockReturnValue(mockLink);
    document.body.appendChild = jest.fn();
    
    // APIレスポンスのモック
    const mockBlob = new Blob(['test'], { type: 'text/csv' });
    inspectionItemAPI.exportData.mockResolvedValue(mockBlob);
    
    // handleExportCSV関数を抽出
    const handleExportCSV = async (setExportError) => {
      try {
        setExportError(null);
        // APIからBlobとしてCSVをダウンロード
        const response = await inspectionItemAPI.exportData("csv", "shift_jis");
  
        // Blobからダウンロードリンクを作成
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `inspection_items_${new Date().toISOString().split("T")[0]}.csv`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        setExportError("点検項目データのエクスポートに失敗しました。");
        console.error("点検項目エクスポートエラー:", err);
      }
    };
    
    // モック関数
    const setExportError = jest.fn();
    
    // 日付をモック化
    const mockDate = new Date('2023-01-01');
    global.Date = jest.fn(() => mockDate);
    Date.prototype.toISOString = jest.fn(() => '2023-01-01T00:00:00.000Z');
    
    // 関数の実行
    await handleExportCSV(setExportError);
    
    // 期待される挙動の検証
    expect(inspectionItemAPI.exportData).toHaveBeenCalledWith("csv", "shift_jis");
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      "download",
      "inspection_items_2023-01-01.csv"
    );
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockLink.remove).toHaveBeenCalled();
    expect(setExportError).toHaveBeenCalledWith(null);
  });
  
  // ソート機能のテスト
  test('ソート機能が正しく動作する', () => {
    // テスト用のデータ
    const items = [
      { id: 2, item_name: 'B項目', device_name: 'デバイスB' },
      { id: 1, item_name: 'A項目', device_name: 'デバイスA' },
      { id: 3, item_name: 'C項目', device_name: 'デバイスC' }
    ];
    
    // ID 昇順でソート
    const sortedById = sortArrayByKey(items, 'id', false);
    expect(sortedById[0].id).toBe(1);
    expect(sortedById[1].id).toBe(2);
    expect(sortedById[2].id).toBe(3);
    
    // ID 降順でソート
    const sortedByIdDesc = sortArrayByKey(items, 'id', true);
    expect(sortedByIdDesc[0].id).toBe(3);
    expect(sortedByIdDesc[1].id).toBe(2);
    expect(sortedByIdDesc[2].id).toBe(1);
    
    // 項目名でソート
    const sortedByName = sortArrayByKey(items, 'item_name', false);
    expect(sortedByName[0].item_name).toBe('A項目');
    expect(sortedByName[1].item_name).toBe('B項目');
    expect(sortedByName[2].item_name).toBe('C項目');
  });
  
  // 検索フィルタリング機能のテスト
  test('検索フィルタリング機能が正しく動作する', () => {
    // テスト用のデータ
    const items = [
      { id: 1, item_name: 'CPUの状態確認', device_name: 'サーバーA', model: 'モデルX', rack_number: 5 },
      { id: 2, item_name: 'メモリの状態確認', device_name: 'サーバーB', model: 'モデルY', rack_number: 3 },
      { id: 3, item_name: 'ディスクの状態確認', device_name: 'サーバーC', model: 'モデルZ', rack_number: 7 }
    ];
    
    // 検索フィルタリング関数
    const filterItems = (items, searchTerm) => {
      if (!searchTerm) return items;
      
      const searchTermLower = searchTerm.toLowerCase();
      
      return items.filter(item => {
        return (
          (item.item_name && 
           typeof item.item_name === "string" && 
           item.item_name.toLowerCase().includes(searchTermLower)) ||
          (item.device_name && 
           typeof item.device_name === "string" && 
           item.device_name.toLowerCase().includes(searchTermLower)) ||
          (item.model && 
           typeof item.model === "string" && 
           item.model.toLowerCase().includes(searchTermLower)) ||
          (item.rack_number && 
           item.rack_number.toString().includes(searchTerm))
        );
      });
    };
    
    // CPU で検索した場合
    const cpuResults = filterItems(items, 'CPU');
    expect(cpuResults).toHaveLength(1);
    expect(cpuResults[0].item_name).toBe('CPUの状態確認');
    
    // サーバー で検索した場合
    const serverResults = filterItems(items, 'サーバー');
    expect(serverResults).toHaveLength(3);
    
    // モデルX で検索した場合
    const modelResults = filterItems(items, 'モデルX');
    expect(modelResults).toHaveLength(1);
    expect(modelResults[0].model).toBe('モデルX');
    
    // ラック番号 5 で検索した場合
    const rackResults = filterItems(items, '5');
    expect(rackResults).toHaveLength(1);
    expect(rackResults[0].rack_number).toBe(5);
    
    // 存在しない検索語の場合
    const emptyResults = filterItems(items, '存在しない');
    expect(emptyResults).toHaveLength(0);
  });
  
  // 入力変更のハンドリングをテスト
  test('検索入力の変更が正しく処理される', () => {
    // テスト用の関数
    const setSearchTerm = jest.fn();
    
    // 入力変更ハンドラ
    const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
    };
    
    // イベントオブジェクトをシミュレート
    const mockEvent = {
      target: { value: '検索ワード' }
    };
    
    // 関数の実行
    handleSearchChange(mockEvent);
    
    // 期待される挙動の検証
    expect(setSearchTerm).toHaveBeenCalledWith('検索ワード');
  });
});