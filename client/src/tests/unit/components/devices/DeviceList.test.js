import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import { MemoryRouter } from 'react-router-dom';
import DeviceList from '../../../../components/devices/DeviceList';
import { deviceAPI } from '../../../../services/api';
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

// URL.createObjectURLのモック
URL.createObjectURL = jest.fn(() => 'blob-url');
URL.revokeObjectURL = jest.fn();

describe('DeviceList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系: 機器データを取得して表示できること', () => {
    it('ローディング状態が初期表示される', () => {
      deviceAPI.getAll.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <MemoryRouter>
          <DeviceList />
        </MemoryRouter>
      );

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('APIからのデータが正常に表示される', async () => {
      deviceAPI.getAll.mockResolvedValue(mockDevices);

      render(
        <MemoryRouter>
          <DeviceList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('機器一覧')).toBeInTheDocument();
      });

      // 機器データが表示されていることを確認
      mockDevices.forEach(device => {
        expect(screen.getByText(device.device_name)).toBeInTheDocument();
        expect(screen.getByText(device.customer_name)).toBeInTheDocument();
        expect(screen.getByText(device.device_type)).toBeInTheDocument();
        expect(screen.getByText(device.hardware_type)).toBeInTheDocument();
      });

      // APIが正しく呼ばれたことを確認
      expect(deviceAPI.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('異常系: API呼び出しエラー時にエラーメッセージを表示できること', () => {
    it('API呼び出しエラー時にエラーメッセージが表示される', async () => {
      deviceAPI.getAll.mockRejectedValue(new Error('API Error'));

      render(
        <MemoryRouter>
          <DeviceList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('機器データの取得に失敗しました。')).toBeInTheDocument();
      });

      // APIが呼ばれたことを確認
      expect(deviceAPI.getAll).toHaveBeenCalledTimes(1);
    });
  });

  it('filters devices by search term', async () => {
    deviceAPI.getAll.mockResolvedValue(mockDevices);

    render(
      <MemoryRouter>
        <DeviceList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('機器一覧')).toBeInTheDocument();
    });

    // 検索ボックスに入力
    fireEvent.change(screen.getByPlaceholderText('機器名、顧客名、モデルで検索...'), {
      target: { value: 'サーバー1' },
    });

    // 「サーバー1」を含む機器のみが表示されていることを確認
    expect(screen.getByText('サーバー1')).toBeInTheDocument();
    expect(screen.queryByText('サーバー2')).not.toBeInTheDocument();
  });

  it('opens delete modal when delete button is clicked', async () => {
    deviceAPI.getAll.mockResolvedValue(mockDevices);

    render(
      <MemoryRouter>
        <DeviceList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTitle('削除')[0]).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    fireEvent.click(screen.getAllByTitle('削除')[0]);

    // 削除確認モーダルが表示されることを確認
    expect(screen.getByText('機器削除の確認')).toBeInTheDocument();
    expect(screen.getByText(/削除すると、この機器に関連するすべての点検データも削除されます/)).toBeInTheDocument();
  });

  it('deletes device when confirmed in modal', async () => {
    deviceAPI.getAll.mockResolvedValue(mockDevices);
    deviceAPI.delete.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <DeviceList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTitle('削除')[0]).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    fireEvent.click(screen.getAllByTitle('削除')[0]);

    // 確認ボタンをクリック
    fireEvent.click(screen.getByText('確認'));

    // 削除APIが呼ばれたことを確認
    await waitFor(() => {
      expect(deviceAPI.delete).toHaveBeenCalledWith(mockDevices[0].id);
    });
  });

  it('exports devices as CSV when export button is clicked', async () => {
    deviceAPI.getAll.mockResolvedValue(mockDevices);
    deviceAPI.exportData.mockResolvedValue(new Blob(['csv data'], { type: 'text/csv' }));
    
    // document.createElement と appendChild のモック
    const mockLink = {
      href: '',
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn()
    };
    document.createElement = jest.fn(() => mockLink);
    document.body.appendChild = jest.fn();

    render(
      <MemoryRouter>
        <DeviceList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CSVエクスポート')).toBeInTheDocument();
    });

    // エクスポートボタンをクリック
    fireEvent.click(screen.getByText('CSVエクスポート'));

    // エクスポートAPIが呼ばれ、ダウンロードリンクが作成されたことを確認
    await waitFor(() => {
      expect(deviceAPI.exportData).toHaveBeenCalledWith('csv', 'shift_jis');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  it('sorts devices when table header is clicked', async () => {
    deviceAPI.getAll.mockResolvedValue(mockDevices);

    render(
      <MemoryRouter>
        <DeviceList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('機器名')).toBeInTheDocument();
    });

    // 機器名でソート
    fireEvent.click(screen.getByText('機器名'));

    // ソートが適用されたことを確認
    expect(screen.getByText('機器名')).toHaveAttribute('aria-sort');
  });

  it('displays empty state message when no devices are found', async () => {
    deviceAPI.getAll.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <DeviceList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('機器データがありません。')).toBeInTheDocument();
    });
  });

  it('displays empty search results message when no devices match search', async () => {
    deviceAPI.getAll.mockResolvedValue(mockDevices);

    render(
      <MemoryRouter>
        <DeviceList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('機器名、顧客名、モデルで検索...')).toBeInTheDocument();
    });

    // 一致しない検索語を入力
    fireEvent.change(screen.getByPlaceholderText('機器名、顧客名、モデルで検索...'), {
      target: { value: 'XYZ' },
    });

    expect(screen.getByText('検索条件に一致する機器はありません。')).toBeInTheDocument();
  });
});