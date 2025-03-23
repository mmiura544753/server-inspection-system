import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DeviceForm from '../../../../components/devices/DeviceForm';
import { deviceAPI, customerAPI } from '../../../../services/api';
import { mockDevices, mockCustomers } from '../../../mocks/mockData';

// モックナビゲート関数
const mockNavigate = jest.fn();

// React Router のモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// APIモック
jest.mock('../../../../services/api', () => ({
  deviceAPI: {
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  customerAPI: {
    getAll: jest.fn(),
  },
}));

describe('DeviceForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 顧客一覧を返すモック（全テストで共通）
    customerAPI.getAll.mockResolvedValue(mockCustomers);
  });

  describe('Create Mode', () => {
    it('renders form with default values in create mode', async () => {
      render(
        <MemoryRouter initialEntries={["/devices/new"]}>
          <Routes>
            <Route path="/devices/new" element={<DeviceForm />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('新規機器登録')).toBeInTheDocument();
      });

      // デフォルト値の確認
      expect(screen.getByLabelText('機器名')).toHaveValue('');
      expect(screen.getByLabelText('機器種別')).toHaveValue('サーバ');
      expect(screen.getByLabelText('ハードウェアタイプ')).toHaveValue('物理');
    });

    it('submits new device data and navigates on success', async () => {
      // 成功レスポンスを返すモック
      deviceAPI.create.mockResolvedValue({ id: 3, device_name: 'テストサーバー' });

      render(
        <MemoryRouter initialEntries={["/devices/new"]}>
          <Routes>
            <Route path="/devices/new" element={<DeviceForm />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('機器名')).toBeInTheDocument();
      });

      // フォーム入力
      fireEvent.change(screen.getByLabelText('機器名'), {
        target: { value: 'テストサーバー' },
      });

      // 顧客選択
      fireEvent.change(screen.getByLabelText('顧客'), {
        target: { value: '1' },
      });

      // フォーム送信
      fireEvent.click(screen.getByRole('button', { name: /保存する/i }));

      // API呼び出しと画面遷移を確認
      await waitFor(() => {
        expect(deviceAPI.create).toHaveBeenCalledWith(expect.objectContaining({
          device_name: 'テストサーバー',
          customer_id: '1',
          device_type: 'サーバ',
          hardware_type: '物理',
        }));
        expect(mockNavigate).toHaveBeenCalledWith('/devices');
      });
    });
  });

  describe('Edit Mode', () => {
    it('loads device data and displays it in the form', async () => {
      // 既存機器データを返すモック
      const mockDevice = mockDevices[0];
      deviceAPI.getById.mockResolvedValue(mockDevice);

      render(
        <MemoryRouter initialEntries={["/devices/edit/1"]}>
          <Routes>
            <Route path="/devices/edit/:id" element={<DeviceForm />} />
          </Routes>
        </MemoryRouter>
      );

      // 初期ローディング表示を確認
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();

      // データロード後のフォーム表示を確認
      await waitFor(() => {
        expect(screen.getByText('機器情報の編集')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('機器名')).toHaveValue(mockDevice.device_name);
      expect(screen.getByLabelText('機器種別')).toHaveValue(mockDevice.device_type);
      expect(screen.getByLabelText('ハードウェアタイプ')).toHaveValue(mockDevice.hardware_type);
    });

    it('updates device data and navigates on success', async () => {
      // 既存機器データを返すモック
      const mockDevice = mockDevices[0];
      deviceAPI.getById.mockResolvedValue(mockDevice);
      deviceAPI.update.mockResolvedValue({ ...mockDevice, device_name: '更新済みサーバー' });

      render(
        <MemoryRouter initialEntries={["/devices/edit/1"]}>
          <Routes>
            <Route path="/devices/edit/:id" element={<DeviceForm />} />
          </Routes>
        </MemoryRouter>
      );

      // データロード後にフォーム入力
      await waitFor(() => {
        expect(screen.getByLabelText('機器名')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('機器名'), {
        target: { value: '更新済みサーバー' },
      });

      // フォーム送信
      fireEvent.click(screen.getByRole('button', { name: /保存する/i }));

      // API呼び出しと画面遷移を確認
      await waitFor(() => {
        expect(deviceAPI.update).toHaveBeenCalledWith('1', expect.objectContaining({
          device_name: '更新済みサーバー',
        }));
        expect(mockNavigate).toHaveBeenCalledWith('/devices');
      });
    });
  });

  it('displays validation errors for required fields', async () => {
    render(
      <MemoryRouter initialEntries={["/devices/new"]}>
        <Routes>
          <Route path="/devices/new" element={<DeviceForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('機器名')).toBeInTheDocument();
    });

    // 機器名を入力せずに送信
    fireEvent.click(screen.getByRole('button', { name: /保存する/i }));

    // バリデーションエラーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('機器名は必須です')).toBeInTheDocument();
      expect(screen.getByText('顧客の選択は必須です')).toBeInTheDocument();
    });

    // APIが呼ばれていないことを確認
    expect(deviceAPI.create).not.toHaveBeenCalled();
  });

  it('displays API error message when submission fails', async () => {
    // APIエラーを返すモック
    deviceAPI.create.mockRejectedValue({
      response: {
        data: {
          message: '同じ顧客で同じ機器名、設置場所、ユニット位置の組み合わせがすでに存在します'
        }
      }
    });

    render(
      <MemoryRouter initialEntries={["/devices/new"]}>
        <Routes>
          <Route path="/devices/new" element={<DeviceForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('機器名')).toBeInTheDocument();
    });

    // フォーム入力
    fireEvent.change(screen.getByLabelText('機器名'), {
      target: { value: 'テストサーバー' },
    });

    // 顧客選択
    fireEvent.change(screen.getByLabelText('顧客'), {
      target: { value: '1' },
    });

    // フォーム送信
    fireEvent.click(screen.getByRole('button', { name: /保存する/i }));

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('同じ顧客で同じ機器名、設置場所、ユニット位置の組み合わせがすでに存在します')).toBeInTheDocument();
    });
  });
});