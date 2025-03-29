import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CustomerForm from "../../../../components/customers/CustomerForm";
import { customerAPI } from "../../../../services/api";
import { mockCustomers } from "../../../mocks/mockData";

// モックナビゲート関数
const mockNavigate = jest.fn();

// React Router のモック
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// APIモック
jest.mock("../../../../services/api", () => ({
  customerAPI: {
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

describe("CustomerForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("renders form with empty fields in create mode", () => {
      render(
        <MemoryRouter initialEntries={["/customers/new"]}>
          <Routes>
            <Route path="/customers/new" element={<CustomerForm />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("新規顧客登録")).toBeInTheDocument();
      expect(screen.getByLabelText("顧客名")).toHaveValue("");
    });

    it("submits new customer data and navigates on success", async () => {
      // 成功レスポンスを返すモック
      customerAPI.create.mockResolvedValue({
        id: 3,
        customer_name: "テスト顧客C",
      });

      render(
        <MemoryRouter initialEntries={["/customers/new"]}>
          <Routes>
            <Route path="/customers/new" element={<CustomerForm />} />
          </Routes>
        </MemoryRouter>
      );

      // フォーム入力
      fireEvent.change(screen.getByLabelText("顧客名"), {
        target: { value: "テスト顧客C" },
      });

      // フォーム送信
      const saveButton = screen.getByText("保存する");
      fireEvent.click(saveButton);

      // API呼び出しと画面遷移を確認
      await waitFor(() => {
        expect(customerAPI.create).toHaveBeenCalledWith({
          customer_name: "テスト顧客C",
        });
        expect(mockNavigate).toHaveBeenCalledWith("/customers");
      });
    });
  });

  describe("Edit Mode", () => {
    it("loads customer data and displays it in the form", async () => {
      // 既存顧客データを返すモック
      const mockCustomer = mockCustomers[0];
      customerAPI.getById.mockResolvedValue(mockCustomer);

      render(
        <MemoryRouter initialEntries={["/customers/edit/1"]}>
          <Routes>
            <Route path="/customers/edit/:id" element={<CustomerForm />} />
          </Routes>
        </MemoryRouter>
      );

      // 初期ローディング表示を確認
      // expect(screen.getByText('読み込み中...')).toBeInTheDocument();
      expect(screen.getAllByText("読み込み中...").length).toBeGreaterThan(0);

      // データロード後のフォーム表示を確認
      await waitFor(() => {
        expect(screen.getByText("顧客情報の編集")).toBeInTheDocument();
      });

      expect(screen.getByLabelText("顧客名")).toHaveValue(
        mockCustomer.customer_name
      );
    });

    it("updates customer data and navigates on success", async () => {
      // 既存顧客データを返すモック
      const mockCustomer = mockCustomers[0];
      customerAPI.getById.mockResolvedValue(mockCustomer);
      customerAPI.update.mockResolvedValue({
        ...mockCustomer,
        customer_name: "更新済み顧客A",
      });

      render(
        <MemoryRouter initialEntries={["/customers/edit/1"]}>
          <Routes>
            <Route path="/customers/edit/:id" element={<CustomerForm />} />
          </Routes>
        </MemoryRouter>
      );

      // データロード後にフォーム入力
      await waitFor(() => {
        expect(screen.getByLabelText("顧客名")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("顧客名"), {
        target: { value: "更新済み顧客A" },
      });

      // フォーム送信
      const saveButton = screen.getByText("保存する");
      fireEvent.click(saveButton);

      // API呼び出しと画面遷移を確認
      await waitFor(() => {
        // expect(customerAPI.update).toHaveBeenCalledWith('1', {
        //   customer_name: '更新済み顧客A',
        // });
        expect(customerAPI.update).toHaveBeenCalledWith(
          "1",
          expect.objectContaining({
            customer_name: "更新済み顧客A",
          })
        );
        expect(mockNavigate).toHaveBeenCalledWith("/customers");
      });
    });
  });

  it("displays validation error for empty customer name", async () => {
    render(
      <MemoryRouter initialEntries={["/customers/new"]}>
        <Routes>
          <Route path="/customers/new" element={<CustomerForm />} />
        </Routes>
      </MemoryRouter>
    );

    // 空のまま送信
    const saveButton = screen.getByText("保存する");
    fireEvent.click(saveButton);

    // バリデーションエラーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("顧客名は必須です")).toBeInTheDocument();
    });

    // APIが呼ばれていないことを確認
    expect(customerAPI.create).not.toHaveBeenCalled();
  });

  it("displays API error message when submission fails", async () => {
    // APIエラーを返すモック
    customerAPI.create.mockRejectedValue(new Error("API Error"));

    render(
      <MemoryRouter initialEntries={["/customers/new"]}>
        <Routes>
          <Route path="/customers/new" element={<CustomerForm />} />
        </Routes>
      </MemoryRouter>
    );

    // フォーム入力
    fireEvent.change(screen.getByLabelText("顧客名"), {
      target: { value: "テスト顧客C" },
    });

    // フォーム送信 - テキストで直接ボタンを見つける
    const saveButton = screen.getByText("保存する");
    fireEvent.click(saveButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/顧客の作成に失敗しました/)).toBeInTheDocument();
    });
  });
});
