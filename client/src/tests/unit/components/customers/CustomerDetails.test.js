import React from 'react';
import { render, screen, waitFor } from '../../../utils/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CustomerDetails from '../../../../components/customers/CustomerDetails';
import { customerAPI } from '../../../../services/api';
import { mockCustomers } from '../../../mocks/mockData';

// APIモック
jest.mock('../../../../services/api', () => ({
  customerAPI: {
    getById: jest.fn(),
  },
}));

describe('CustomerDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // APIレスポンス前の表示をテスト
    customerAPI.getById.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <MemoryRouter initialEntries={["/customers/1"]}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders customer details when API returns data', async () => {
    // 顧客データを返すモック
    const mockCustomer = mockCustomers[0];
    customerAPI.getById.mockResolvedValue(mockCustomer);

    render(
      <MemoryRouter initialEntries={["/customers/1"]}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // データロード後の表示をテスト
    await waitFor(() => {
      expect(screen.getByText('顧客詳細')).toBeInTheDocument();
    });

    expect(screen.getByText('顧客ID')).toBeInTheDocument();
    expect(screen.getByText(mockCustomer.id.toString())).toBeInTheDocument();
    expect(screen.getByText('顧客名')).toBeInTheDocument();
    expect(screen.getByText(mockCustomer.customer_name)).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    // エラーを返すモック
    customerAPI.getById.mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter initialEntries={["/customers/1"]}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // エラー表示をテスト
    await waitFor(() => {
      expect(screen.getByText('顧客データの取得に失敗しました。')).toBeInTheDocument();
    });

    expect(screen.getByText('顧客一覧に戻る')).toBeInTheDocument();
  });

  it('renders not found state when API returns null', async () => {
    // nullを返すモック
    customerAPI.getById.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/customers/999"]}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // 顧客が見つからない表示をテスト
    await waitFor(() => {
      expect(screen.getByText('顧客が見つかりません。')).toBeInTheDocument();
    });
  });

  it('opens delete modal when delete button is clicked', async () => {
    // 顧客データを返すモック
    const mockCustomer = mockCustomers[0];
    customerAPI.getById.mockResolvedValue(mockCustomer);

    render(
      <MemoryRouter initialEntries={["/customers/1"]}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // データロード後の削除ボタンをクリック
    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    screen.getByText('削除').click();

    // モーダルが表示されることを確認
    expect(screen.getByText('顧客削除の確認')).toBeInTheDocument();
    expect(screen.getByText(`顧客「${mockCustomer.customer_name}」を削除してもよろしいですか？`)).toBeInTheDocument();
  });
});