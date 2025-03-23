import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../utils/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DeviceDetails from '../../../../components/devices/DeviceDetails';
import { deviceAPI } from '../../../../services/api';
import { mockDevices } from '../../../mocks/mockData';

// APIモック
jest.mock('../../../../services/api', () => ({
  deviceAPI: {
    getById: jest.fn(),
    delete: jest.fn()
  }
}));

// useParamsモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn().mockReturnValue({ id: '1' })
}));

describe('DeviceDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系: 特定の機器IDの詳細データを取得して表示できること', () => {
    it('機器詳細データを正常に表示する', async () => {
      // APIモックの設定
      deviceAPI.getById.mockResolvedValue(mockDevices[0]);

      // コンポーネントをレンダリング
      render(
        <MemoryRouter initialEntries={['/devices/1']}>
          <Routes>
            <Route path="/devices/:id" element={<DeviceDetails />} />
          </Routes>
        </MemoryRouter>
      );

      // ローディング表示の確認
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();

      // データが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText('機器詳細')).toBeInTheDocument();
      });

      // APIが正しく呼ばれたことを確認
      expect(deviceAPI.getById).toHaveBeenCalledWith('1');

      // 機器詳細データが表示されていることを確認
      expect(screen.getByText('機器ID')).toBeInTheDocument();
      expect(screen.getByText('サーバー1')).toBeInTheDocument();
      expect(screen.getByText('テスト株式会社A')).toBeInTheDocument();
      expect(screen.getByText('Model-X')).toBeInTheDocument();
      expect(screen.getByText('U10-U12')).toBeInTheDocument();
      expect(screen.getByText('サーバ')).toBeInTheDocument();
      expect(screen.getByText('物理')).toBeInTheDocument();
    });

    it('すべての必要なフィールドが表示されている', async () => {
      // モックデータの設定
      const mockDevice = {
        ...mockDevices[0],
        // 追加のフィールドがある場合はここに設定
      };
      
      deviceAPI.getById.mockResolvedValue(mockDevice);

      // コンポーネントをレンダリング
      render(
        <MemoryRouter initialEntries={['/devices/1']}>
          <Routes>
            <Route path="/devices/:id" element={<DeviceDetails />} />
          </Routes>
        </MemoryRouter>
      );

      // データが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText('機器詳細')).toBeInTheDocument();
      });

      // すべての必要なフィールドラベルが表示されていることを確認
      const requiredFields = [
        '機器ID', '機器名', '顧客', 'モデル', 
        '設置場所', 'ユニット位置', '機器種別', 'ハードウェアタイプ'
      ];
      
      requiredFields.forEach(field => {
        expect(screen.getByText(field)).toBeInTheDocument();
      });
    });
  });

  describe('異常系: 存在しないIDによるエラー処理ができること', () => {
    it('API呼び出しエラー時にエラーメッセージを表示する', async () => {
      // APIエラーモックの設定
      deviceAPI.getById.mockRejectedValue(new Error('API Error'));

      // コンポーネントをレンダリング
      render(
        <MemoryRouter initialEntries={['/devices/999']}>
          <Routes>
            <Route path="/devices/:id" element={<DeviceDetails />} />
          </Routes>
        </MemoryRouter>
      );

      // ローディング表示の確認
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();

      // エラーメッセージが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText('機器データの取得に失敗しました。')).toBeInTheDocument();
      });

      // 戻るボタンが表示されていることを確認
      expect(screen.getByText('機器一覧に戻る')).toBeInTheDocument();
    });

    it('存在しない機器IDの場合に適切なメッセージを表示する', async () => {
      // 存在しない機器IDの場合はnullを返す
      deviceAPI.getById.mockResolvedValue(null);

      // コンポーネントをレンダリング
      render(
        <MemoryRouter initialEntries={['/devices/999']}>
          <Routes>
            <Route path="/devices/:id" element={<DeviceDetails />} />
          </Routes>
        </MemoryRouter>
      );

      // データが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText('機器が見つかりません。')).toBeInTheDocument();
      });

      // 戻るボタンが表示されていることを確認
      expect(screen.getByText('機器一覧に戻る')).toBeInTheDocument();
    });
  });
});