import { renderHook, act, waitFor } from '../../../tests/utils/test-utils';
import { useInspectionItemForm } from '../../../hooks/useInspectionItemForm';
import { inspectionItemAPI, deviceAPI, customerAPI } from '../../../services/api';

// モジュールをモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

jest.mock('../../../services/api', () => ({
  inspectionItemAPI: {
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  deviceAPI: {
    getAll: jest.fn(),
    getById: jest.fn()
  },
  customerAPI: {
    getAll: jest.fn()
  }
}));

// コンソールをモック
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('useInspectionItemForm', () => {
  // テスト用のモックデータ
  const mockCustomers = [
    { id: 1, customer_name: 'テスト顧客1' },
    { id: 2, customer_name: 'テスト顧客2' }
  ];

  const mockDevices = [
    { 
      id: 1, 
      customer_id: 1, 
      device_name: 'サーバー1', 
      model: 'モデルA', 
      device_type: 'ウェブサーバー',
      rack_number: 1
    },
    { 
      id: 2, 
      customer_id: 1, 
      device_name: 'サーバー2', 
      model: 'モデルB', 
      device_type: 'DBサーバー',
      rack_number: 1
    },
    { 
      id: 3, 
      customer_id: 2, 
      device_name: 'サーバー3', 
      model: 'モデルC', 
      device_type: 'アプリサーバー',
      rack_number: 2
    }
  ];

  const mockInspectionItem = {
    id: 1,
    device_id: 1,
    item_name: 'CPU使用率確認'
  };

  const mockDevice = {
    id: 1,
    customer_id: 1,
    device_name: 'サーバー1',
    model: 'モデルA',
    device_type: 'ウェブサーバー',
    rack_number: 1
  };

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // API呼び出しのモック設定
    customerAPI.getAll.mockResolvedValue(mockCustomers);
    deviceAPI.getAll.mockResolvedValue(mockDevices);
    deviceAPI.getById.mockResolvedValue(mockDevice);
    inspectionItemAPI.getById.mockResolvedValue(mockInspectionItem);
    inspectionItemAPI.create.mockResolvedValue({ id: 2, device_id: 1, item_name: '新規項目' });
    inspectionItemAPI.update.mockResolvedValue({ id: 1, device_id: 1, item_name: '更新済み項目' });
    
    // コンソール出力をモック
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    // 元のコンソール関数を復元
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('初期化と状態管理', () => {
    it('新規作成モードで初期化される', async () => {
      const { result } = renderHook(() => useInspectionItemForm());

      expect(result.current.isEditMode).toBe(false);
      expect(result.current.item).toEqual({
        customer_id: "",
        location: "",
        device_id: "",
        device_type: "",
        item_names: [],
      });
      
      // 非同期処理の完了を待つ（初期ロード中はtrueになっている）
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('編集モードで初期化される', async () => {
      const { result } = renderHook(() => useInspectionItemForm(1));

      expect(result.current.isEditMode).toBe(true);
      expect(result.current.loading).toBe(true);

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(inspectionItemAPI.getById).toHaveBeenCalledWith(1);
        expect(deviceAPI.getById).toHaveBeenCalledWith(1);
        expect(result.current.loading).toBe(false);
      });

      // 初期データが正しく設定されることを確認
      expect(result.current.item).toEqual({
        customer_id: 1,
        location: "1",
        device_id: 1,
        device_type: "ウェブサーバー",
        item_names: ["CPU使用率確認"],
      });
    });

    it('顧客データを正しく取得する', async () => {
      const { result } = renderHook(() => useInspectionItemForm());

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(customerAPI.getAll).toHaveBeenCalled();
        expect(result.current.customerOptions.length).toBe(2);
      });

      // 顧客選択肢が正しいフォーマットであることを確認
      expect(result.current.customerOptions).toEqual([
        { value: 1, label: 'テスト顧客1' },
        { value: 2, label: 'テスト顧客2' }
      ]);
    });

    it('機器データを正しく取得する', async () => {
      const { result } = renderHook(() => useInspectionItemForm());

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(deviceAPI.getAll).toHaveBeenCalled();
        expect(result.current.deviceTypeOptions.length).toBe(3);
      });

      // 機器種別選択肢が正しいフォーマットであることを確認
      expect(result.current.deviceTypeOptions).toEqual([
        { value: 'ウェブサーバー', label: 'ウェブサーバー' },
        { value: 'DBサーバー', label: 'DBサーバー' },
        { value: 'アプリサーバー', label: 'アプリサーバー' }
      ]);
    });
  });

  describe('エラー処理', () => {
    it('顧客データ取得時のエラーを処理する', async () => {
      // エラーをモック
      customerAPI.getAll.mockRejectedValue(new Error('顧客データ取得エラー'));
      
      const { result } = renderHook(() => useInspectionItemForm());

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(result.current.error).toBe('顧客データの取得に失敗しました。');
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('機器データ取得時のエラーを処理する', async () => {
      // エラーをモック
      deviceAPI.getAll.mockRejectedValue(new Error('機器データ取得エラー'));
      
      const { result } = renderHook(() => useInspectionItemForm());

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(result.current.error).toBe('機器データの取得に失敗しました。');
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('点検項目データ取得時のエラーを処理する', async () => {
      // エラーをモック
      inspectionItemAPI.getById.mockRejectedValue(new Error('点検項目データ取得エラー'));
      
      const { result } = renderHook(() => useInspectionItemForm(1));

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(result.current.error).toBe('点検項目データの取得に失敗しました。');
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('選択肢の更新', () => {
    it('updateLocationOptionsが顧客IDに基づいて設置場所選択肢を更新する', async () => {
      const { result } = renderHook(() => useInspectionItemForm());

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(deviceAPI.getAll).toHaveBeenCalled();
      });

      // updateLocationOptionsを呼び出す
      act(() => {
        result.current.updateLocationOptions('1');
      });

      // 設置場所選択肢が正しく更新されることを確認
      expect(result.current.locationOptions).toEqual([
        { value: '1', label: 'ラックNo.1' }
      ]);
    });

    it('updateDeviceOptionsが顧客ID、設置場所、機器種別に基づいて機器選択肢を更新する', async () => {
      const { result } = renderHook(() => useInspectionItemForm());

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(deviceAPI.getAll).toHaveBeenCalled();
      });

      // updateDeviceOptionsを呼び出す
      act(() => {
        result.current.updateDeviceOptions('1', '1', 'ウェブサーバー');
      });

      // 機器選択肢が正しく更新されることを確認
      expect(result.current.deviceOptions).toEqual([
        { value: 1, label: 'サーバー1 (モデルA)' }
      ]);
    });

    it('顧客IDが空の場合は空の選択肢を設定する', async () => {
      const { result } = renderHook(() => useInspectionItemForm());

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(deviceAPI.getAll).toHaveBeenCalled();
      });

      // updateLocationOptionsとupdateDeviceOptionsを空のIDで呼び出す
      act(() => {
        result.current.updateLocationOptions('');
        result.current.updateDeviceOptions('');
      });

      // 選択肢が空になることを確認
      expect(result.current.locationOptions).toEqual([]);
      expect(result.current.deviceOptions).toEqual([]);
    });
  });

  describe('フォーム送信処理', () => {
    it('新規作成モードで正しく送信する', async () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useInspectionItemForm());

      // モック関数
      const setSubmitting = jest.fn();

      // 送信値
      const values = {
        device_id: '1',
        item_names: ['新規点検項目1', '新規点検項目2']
      };

      // handleSubmitを呼び出す
      await act(async () => {
        await result.current.handleSubmit(values, { setSubmitting });
      });

      // APIが呼び出されたことを確認
      expect(inspectionItemAPI.create).toHaveBeenCalledTimes(2);
      expect(inspectionItemAPI.create).toHaveBeenCalledWith({
        device_id: 1,
        item_name: '新規点検項目1'
      });
      expect(inspectionItemAPI.create).toHaveBeenCalledWith({
        device_id: 1,
        item_name: '新規点検項目2'
      });

      // リダイレクトされたことを確認
      expect(mockNavigate).toHaveBeenCalledWith('/inspection-items');
      expect(setSubmitting).toHaveBeenCalledWith(false);
    });

    it('編集モードで正しく送信する', async () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useInspectionItemForm(1));

      // 非同期処理の完了を待つ
      await waitFor(() => {
        expect(inspectionItemAPI.getById).toHaveBeenCalledWith(1);
      });

      // モック関数
      const setSubmitting = jest.fn();

      // 送信値
      const values = {
        device_id: '1',
        item_names: ['更新済み項目']
      };

      // handleSubmitを呼び出す
      await act(async () => {
        await result.current.handleSubmit(values, { setSubmitting });
      });

      // APIが呼び出されたことを確認
      expect(inspectionItemAPI.update).toHaveBeenCalledWith(1, {
        device_id: 1,
        item_name: '更新済み項目'
      });

      // リダイレクトされたことを確認
      expect(mockNavigate).toHaveBeenCalledWith('/inspection-items');
      expect(setSubmitting).toHaveBeenCalledWith(false);
    });

    it('必須フィールドが不足している場合はエラーを表示する', async () => {
      const { result } = renderHook(() => useInspectionItemForm());

      // モック関数
      const setSubmitting = jest.fn();

      // 機器IDが不足している送信値
      const values1 = {
        device_id: '',
        item_names: ['テスト項目']
      };

      // handleSubmitを呼び出す
      await act(async () => {
        await result.current.handleSubmit(values1, { setSubmitting });
      });

      // エラーが設定されることを確認
      expect(result.current.submitError).toBe('機器の選択は必須です');
      expect(setSubmitting).toHaveBeenCalledWith(false);

      // 確認作業項目が不足している送信値
      const values2 = {
        device_id: '1',
        item_names: []
      };

      // handleSubmitを再度呼び出す
      await act(async () => {
        await result.current.handleSubmit(values2, { setSubmitting });
      });

      // エラーが設定されることを確認
      expect(result.current.submitError).toBe('少なくとも1つの確認作業項目を選択または入力してください');
      expect(setSubmitting).toHaveBeenCalledWith(false);
    });

    it('APIエラーを適切に処理する', async () => {
      // エラーをモック
      inspectionItemAPI.create.mockRejectedValue({
        response: {
          data: {
            message: 'サーバーエラーが発生しました'
          }
        }
      });

      const { result } = renderHook(() => useInspectionItemForm());

      // モック関数
      const setSubmitting = jest.fn();

      // 送信値
      const values = {
        device_id: '1',
        item_names: ['エラーテスト項目']
      };

      // handleSubmitを呼び出す
      await act(async () => {
        await result.current.handleSubmit(values, { setSubmitting });
      });

      // エラーが設定されることを確認
      expect(result.current.submitError).toBe('サーバーエラーが発生しました');
      expect(console.error).toHaveBeenCalled();
      expect(setSubmitting).toHaveBeenCalledWith(false);
    });

    it('重複エラーを適切に処理する', async () => {
      // 最初の呼び出しは成功、2番目の呼び出しは重複エラー
      inspectionItemAPI.create
        .mockResolvedValueOnce({ id: 2, device_id: 1, item_name: '項目1' })
        .mockRejectedValueOnce({
          response: {
            data: {
              message: '同じ機器に対して同じ点検項目名がすでに存在します'
            }
          }
        });

      // コンソールをスパイ
      jest.spyOn(console, 'warn');

      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useInspectionItemForm());

      // モック関数
      const setSubmitting = jest.fn();

      // 送信値
      const values = {
        device_id: '1',
        item_names: ['項目1', '重複項目']
      };

      // handleSubmitを呼び出す
      await act(async () => {
        await result.current.handleSubmit(values, { setSubmitting });
      });

      // 両方のAPIが呼び出されたことを確認
      expect(inspectionItemAPI.create).toHaveBeenCalledTimes(2);
      
      // 重複エラーが適切に処理され、ナビゲーションが実行されたことを確認
      expect(mockNavigate).toHaveBeenCalledWith('/inspection-items');
      expect(setSubmitting).toHaveBeenCalledWith(false);
    });
  });
});