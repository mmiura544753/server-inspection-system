import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeviceDetails from '../../../../components/devices/DeviceDetails';
import { deviceAPI } from '../../../../services/api';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// APIモック
jest.mock('../../../../services/api', () => ({
  deviceAPI: {
    getById: jest.fn(),
    delete: jest.fn()
  }
}));

// react-router-domのuseParamsモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn()
}));

// モックデータ
const mockDevice = {
  id: 1,
  device_name: 'サーバー1',
  customer_id: 1,
  customer_name: 'テスト株式会社A',
  model: 'Model-X',
  rack_number: 5,
  unit_position: 'U10-U12',
  device_type: 'サーバ',
  hardware_type: '物理'
};

describe('DeviceDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deviceAPI.getById.mockReset();
    deviceAPI.delete.mockReset();
  });

  it('正常に機器データを取得して表示する', async () => {
    deviceAPI.getById.mockResolvedValue(mockDevice);

    render(
      <MemoryRouter>
        <DeviceDetails />
      </MemoryRouter>
    );

    // ローディング中の表示を確認
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // データ読み込み後の表示を確認
    await waitFor(() => {
      expect(screen.getByText('機器詳細')).toBeInTheDocument();
    });

    // 機器データの表示を確認
    expect(screen.getByText('サーバー1')).toBeInTheDocument();
    expect(screen.getByText('テスト株式会社A')).toBeInTheDocument();
    expect(screen.getByText('Model-X')).toBeInTheDocument();
  });

  it('データの取得に失敗した場合にエラーメッセージを表示する', async () => {
    deviceAPI.getById.mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <DeviceDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('機器データの取得に失敗しました。')).toBeInTheDocument();
    });
  });

  it('取得したデータがnullの場合に適切なメッセージを表示する', async () => {
    deviceAPI.getById.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <DeviceDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('機器が見つかりません。')).toBeInTheDocument();
    });
  });

  it('削除ボタンをクリックするとモーダルを表示する', async () => {
    deviceAPI.getById.mockResolvedValue(mockDevice);

    render(
      <MemoryRouter>
        <DeviceDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('機器詳細')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByText('削除').closest('button');
    fireEvent.click(deleteButton);

    // モーダルの表示を確認
    expect(screen.getByText('機器削除の確認')).toBeInTheDocument();
    expect(screen.getByText(/サーバー1.+を削除してもよろしいですか？/)).toBeInTheDocument();
  });
});