import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import { MemoryRouter } from "react-router-dom";
import CustomerList from "../../../../components/customers/CustomerList";
import { customerAPI } from "../../../../services/api";
import { mockCustomers } from "../../../mocks/mockData";

// APIモック
jest.mock("../../../../services/api", () => ({
  customerAPI: {
    getAll: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("CustomerList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    customerAPI.getAll.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    //    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders customer list when API returns data", async () => {
    customerAPI.getAll.mockResolvedValue(mockCustomers);

    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    // データロード後の表示をテスト
    await waitFor(() => {
      expect(screen.getByText("顧客一覧")).toBeInTheDocument();
    });

    // 顧客データが表示されていることを確認
    mockCustomers.forEach((customer) => {
      expect(screen.getByText(customer.customer_name)).toBeInTheDocument();
    });
  });

  it("shows error message when API call fails", async () => {
    customerAPI.getAll.mockRejectedValue(new Error("API Error"));

    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText("顧客データの取得に失敗しました。")
      ).toBeInTheDocument();
    });
  });

  it("filters customers by search term", async () => {
    customerAPI.getAll.mockResolvedValue(mockCustomers);

    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("顧客一覧")).toBeInTheDocument();
    });

    // 検索ボックスに入力
    fireEvent.change(screen.getByPlaceholderText("顧客名で検索..."), {
      target: { value: "A" },
    });

    // 'A'を含む顧客のみが表示されていることを確認
    expect(screen.getByText("テスト株式会社A")).toBeInTheDocument();
    expect(screen.queryByText("テスト株式会社B")).not.toBeInTheDocument();
  });

  it("opens delete modal when delete button is clicked", async () => {
    customerAPI.getAll.mockResolvedValue(mockCustomers);

    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTitle("削除")[0]).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    fireEvent.click(screen.getAllByTitle("削除")[0]);

    // 削除確認モーダルが表示されることを確認
    expect(screen.getByText("顧客削除の確認")).toBeInTheDocument();
    expect(
      screen.getByText(
        /削除すると、この顧客に関連するすべての機器データも削除されます/
      )
    ).toBeInTheDocument();
  });

  it("deletes customer when confirmed in modal", async () => {
    customerAPI.getAll.mockResolvedValue(mockCustomers);
    customerAPI.delete.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTitle("削除")[0]).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    fireEvent.click(screen.getAllByTitle("削除")[0]);

    // 確認ボタンをクリック
    fireEvent.click(screen.getByText("確認"));

    // 削除APIが呼ばれたことを確認
    await waitFor(() => {
      expect(customerAPI.delete).toHaveBeenCalledWith(mockCustomers[0].id);
    });
  });

  it("sorts customers when table header is clicked", async () => {
    customerAPI.getAll.mockResolvedValue(mockCustomers);

    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("顧客名")).toBeInTheDocument();
    });

    // 顧客名でソート
    fireEvent.click(screen.getByText("顧客名"));

    // ソートが適用されたことを確認（実際のソート結果のテストはsortUtils.jsのテストで行う）
    expect(screen.getByRole("columnheader", { name: /顧客名/ })).toHaveAttribute("aria-sort");
  });

  it("displays empty state message when no customers are found", async () => {
    customerAPI.getAll.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("顧客データがありません。")).toBeInTheDocument();
    });
  });

  it("displays empty search results message when no customers match search", async () => {
    customerAPI.getAll.mockResolvedValue(mockCustomers);

    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("顧客名で検索...")
      ).toBeInTheDocument();
    });

    // 一致しない検索語を入力
    fireEvent.change(screen.getByPlaceholderText("顧客名で検索..."), {
      target: { value: "XYZ" },
    });

    expect(
      screen.getByText("検索条件に一致する顧客はありません。")
    ).toBeInTheDocument();
  });
});
