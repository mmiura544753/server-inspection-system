import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import InspectionItemNameForm from "../../../../components/inspectionItemNames/InspectionItemNameForm";
import { inspectionItemAPI } from "../../../../services/api";
import { mockInspectionItemNames } from "../../../mocks/mockData";

// モックナビゲート関数
const mockNavigate = jest.fn();

// React Router のモック
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// APIモック
jest.mock("../../../../services/api", () => ({
  inspectionItemAPI: {
    itemNames: {
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("InspectionItemNameForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("renders form with empty fields in create mode", () => {
      render(
        <MemoryRouter initialEntries={["/inspection-item-names/new"]}>
          <Routes>
            <Route path="/inspection-item-names/new" element={<InspectionItemNameForm />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("新規確認作業項目登録")).toBeInTheDocument();
      expect(screen.getByLabelText("確認作業項目")).toHaveValue("");
    });

    it("submits new inspection item name data and navigates on success", async () => {
      // 成功レスポンスを返すモック
      inspectionItemAPI.itemNames.create.mockResolvedValue({
        id: 3,
        name: "ディスク容量確認",
      });

      render(
        <MemoryRouter initialEntries={["/inspection-item-names/new"]}>
          <Routes>
            <Route path="/inspection-item-names/new" element={<InspectionItemNameForm />} />
          </Routes>
        </MemoryRouter>
      );

      // フォーム入力
      fireEvent.change(screen.getByLabelText("確認作業項目"), {
        target: { value: "ディスク容量確認" },
      });

      // フォーム送信
      const submitButton = screen.getByRole("button", { name: /登録/i });
      fireEvent.click(submitButton);

      // API呼び出しと画面遷移を確認
      await waitFor(() => {
        expect(inspectionItemAPI.itemNames.create).toHaveBeenCalledWith({
          name: "ディスク容量確認",
        });
        expect(mockNavigate).toHaveBeenCalledWith("/inspection-item-names");
      });
    });
  });

  describe("Edit Mode", () => {
    it("loads inspection item name data and displays it in the form", async () => {
      // 既存の確認作業項目名データを返すモック
      const mockItemName = mockInspectionItemNames[0];
      inspectionItemAPI.itemNames.getById.mockResolvedValue(mockItemName);

      render(
        <MemoryRouter initialEntries={["/inspection-item-names/edit/1"]}>
          <Routes>
            <Route path="/inspection-item-names/edit/:id" element={<InspectionItemNameForm />} />
          </Routes>
        </MemoryRouter>
      );

      // 初期ローディング表示を確認
      expect(screen.getAllByText("読み込み中...").length).toBeGreaterThan(0);

      // データロード後のフォーム表示を確認
      await waitFor(() => {
        expect(screen.getByText("確認作業項目の編集")).toBeInTheDocument();
      });

      expect(screen.getByLabelText("確認作業項目")).toHaveValue(
        mockItemName.name
      );
    });

    it("updates inspection item name data and navigates on success", async () => {
      // 既存の確認作業項目名データを返すモック
      const mockItemName = mockInspectionItemNames[0];
      inspectionItemAPI.itemNames.getById.mockResolvedValue(mockItemName);
      inspectionItemAPI.itemNames.update.mockResolvedValue({
        ...mockItemName,
        name: "更新済みCPUの状態確認",
      });

      render(
        <MemoryRouter initialEntries={["/inspection-item-names/edit/1"]}>
          <Routes>
            <Route path="/inspection-item-names/edit/:id" element={<InspectionItemNameForm />} />
          </Routes>
        </MemoryRouter>
      );

      // データロード後にフォーム入力
      await waitFor(() => {
        expect(screen.getByLabelText("確認作業項目")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("確認作業項目"), {
        target: { value: "更新済みCPUの状態確認" },
      });

      // フォーム送信
      const updateButton = screen.getByRole("button", { name: /更新/i });
      fireEvent.click(updateButton);

      // API呼び出しと画面遷移を確認
      await waitFor(() => {
        expect(inspectionItemAPI.itemNames.update).toHaveBeenCalledWith(
          "1",
          expect.objectContaining({
            name: "更新済みCPUの状態確認",
          })
        );
        expect(mockNavigate).toHaveBeenCalledWith("/inspection-item-names");
      });
    });
  });

  it("displays validation error for empty inspection item name", async () => {
    render(
      <MemoryRouter initialEntries={["/inspection-item-names/new"]}>
        <Routes>
          <Route path="/inspection-item-names/new" element={<InspectionItemNameForm />} />
        </Routes>
      </MemoryRouter>
    );

    // 空のまま送信
    const submitButton = screen.getByRole("button", { name: /登録/i });
    fireEvent.click(submitButton);

    // バリデーションエラーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("確認作業項目は必須です")).toBeInTheDocument();
    });

    // APIが呼ばれていないことを確認
    expect(inspectionItemAPI.itemNames.create).not.toHaveBeenCalled();
  });

  it("displays API error message when submission fails", async () => {
    // APIエラーを返すモック
    const error = new Error("API Error");
    error.response = { data: { message: "サーバーエラーが発生しました" } };
    inspectionItemAPI.itemNames.create.mockRejectedValue(error);

    render(
      <MemoryRouter initialEntries={["/inspection-item-names/new"]}>
        <Routes>
          <Route path="/inspection-item-names/new" element={<InspectionItemNameForm />} />
        </Routes>
      </MemoryRouter>
    );

    // フォーム入力
    fireEvent.change(screen.getByLabelText("確認作業項目"), {
      target: { value: "新規確認作業項目" },
    });

    // フォーム送信
    const submitButton = screen.getByRole("button", { name: /登録/i });
    fireEvent.click(submitButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      // Alert コンポーネントのテキストを探す
      const alertElement = screen.getByRole("alert");
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveTextContent("サーバーエラーが発生しました");
    });
  });

  it("validates input when too long value is entered", async () => {
    render(
      <MemoryRouter initialEntries={["/inspection-item-names/new"]}>
        <Routes>
          <Route path="/inspection-item-names/new" element={<InspectionItemNameForm />} />
        </Routes>
      </MemoryRouter>
    );

    // 255文字を超える文字列を入力
    const longText = "a".repeat(256);
    fireEvent.change(screen.getByLabelText("確認作業項目"), {
      target: { value: longText },
    });

    // フォーム送信
    const submitButton = screen.getByRole("button", { name: /登録/i });
    fireEvent.click(submitButton);

    // バリデーションエラーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("確認作業項目は255文字以内で入力してください")).toBeInTheDocument();
    });

    // APIが呼ばれていないことを確認
    expect(inspectionItemAPI.itemNames.create).not.toHaveBeenCalled();
  });

  it("redirects to list page when cancel button is clicked", () => {
    render(
      <MemoryRouter initialEntries={["/inspection-item-names/new"]}>
        <Routes>
          <Route path="/inspection-item-names/new" element={<InspectionItemNameForm />} />
        </Routes>
      </MemoryRouter>
    );

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole("button", { name: /キャンセル/i });
    fireEvent.click(cancelButton);

    // リスト画面への遷移を確認
    expect(mockNavigate).toHaveBeenCalledWith("/inspection-item-names");
  });
});