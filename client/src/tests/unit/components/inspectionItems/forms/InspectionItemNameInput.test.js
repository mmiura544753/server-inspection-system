// src/tests/unit/components/inspectionItems/forms/InspectionItemNameInput.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../../../../utils/test-utils';
import '@testing-library/jest-dom';
import { Formik, Form } from 'formik';
import InspectionItemNameInput from '../../../../../components/inspectionItems/forms/InspectionItemNameInput';
import { inspectionItemAPI } from '../../../../../services/api';

// モックを作成
jest.mock('../../../../../services/api', () => ({
  inspectionItemAPI: {
    itemNames: {
      getAll: jest.fn(),
    }
  }
}));

// react-iconsのモック
jest.mock('react-icons/fa', () => ({
  FaCheck: () => <span data-testid="check-icon">✓</span>,
}));

// テスト用のラッパー
const TestFormikWrapper = ({ children, initialValues = { item_names: [] } }) => (
  <Formik initialValues={initialValues} onSubmit={jest.fn()}>
    <Form>
      {children}
    </Form>
  </Formik>
);

describe('InspectionItemNameInput', () => {
  const mockItemNames = [
    { id: 1, name: '電源状態確認' },
    { id: 2, name: 'ファン動作確認' },
    { id: 3, name: '温度確認' },
    { id: 4, name: 'ディスク容量確認' }
  ];

  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    // デフォルトのモックレスポンスを設定
    inspectionItemAPI.itemNames.getAll.mockResolvedValue(mockItemNames);
  });

  test('renders loading state initially', async () => {
    render(
      <TestFormikWrapper>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // ローディングスピナーが表示されていることを確認
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('確認作業項目を読み込み中...')).toBeInTheDocument();
    
    // APIが呼ばれたことを確認
    expect(inspectionItemAPI.itemNames.getAll).toHaveBeenCalledTimes(1);
  });

  test('renders item options after loading', async () => {
    render(
      <TestFormikWrapper>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // データが読み込まれるまで待機
    await waitFor(() => {
      expect(screen.queryByText('確認作業項目を読み込み中...')).not.toBeInTheDocument();
    });
    
    // 項目が表示されていることを確認
    mockItemNames.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  test('shows message when no item names are available', async () => {
    // 空の配列を返すようにモックを設定
    inspectionItemAPI.itemNames.getAll.mockResolvedValue([]);
    
    render(
      <TestFormikWrapper>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // データが読み込まれるまで待機
    await waitFor(() => {
      expect(screen.queryByText('確認作業項目を読み込み中...')).not.toBeInTheDocument();
    });
    
    // メッセージが表示されていることを確認
    expect(screen.getByText('確認作業項目が登録されていません。カスタム入力でデータを追加してください。')).toBeInTheDocument();
  });

  test('toggles between list and custom input', async () => {
    render(
      <TestFormikWrapper>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // データが読み込まれるまで待機
    await waitFor(() => {
      expect(screen.queryByText('確認作業項目を読み込み中...')).not.toBeInTheDocument();
    });
    
    // 初期状態ではリスト表示になっていることを確認
    expect(screen.getByText('電源状態確認')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/確認作業項目を入力/)).not.toBeInTheDocument();
    
    // カスタム入力にトグル
    const customCheckbox = screen.getByLabelText('カスタム確認作業項目を入力');
    fireEvent.click(customCheckbox);
    
    // テキストエリアが表示され、リストが非表示になっていることを確認
    expect(screen.getByPlaceholderText(/確認作業項目を入力/)).toBeInTheDocument();
    expect(screen.queryByText('電源状態確認')).not.toBeInTheDocument();
    
    // リスト表示に戻す
    fireEvent.click(customCheckbox);
    
    // リストが表示され、テキストエリアが非表示になっていることを確認
    await waitFor(() => {
      expect(screen.getByText('電源状態確認')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/確認作業項目を入力/)).not.toBeInTheDocument();
    });
  });

  test('selects item when clicked', async () => {
    render(
      <TestFormikWrapper>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // データが読み込まれるまで待機
    await waitFor(() => {
      expect(screen.queryByText('確認作業項目を読み込み中...')).not.toBeInTheDocument();
    });
    
    // 項目をクリック
    const item = screen.getByText('電源状態確認');
    fireEvent.click(item);
    
    // 選択された項目にチェックマークが表示されていることを確認
    await waitFor(() => {
      const selectedItems = screen.queryAllByTestId('check-icon');
      expect(selectedItems.length).toBe(1);
    });
    
    // 選択件数が表示されていることを確認
    expect(screen.getByText('1個の項目が選択されています')).toBeInTheDocument();
  });

  test('selects and deselects items', async () => {
    render(
      <TestFormikWrapper>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // データが読み込まれるまで待機
    await waitFor(() => {
      expect(screen.queryByText('確認作業項目を読み込み中...')).not.toBeInTheDocument();
    });
    
    // 項目1をクリック
    const item1 = screen.getByText('電源状態確認');
    fireEvent.click(item1);
    
    // 項目2をクリック
    const item2 = screen.getByText('ファン動作確認');
    fireEvent.click(item2);
    
    // 2つの項目が選択されていることを確認
    await waitFor(() => {
      const selectedItems = screen.queryAllByTestId('check-icon');
      expect(selectedItems.length).toBe(2);
    });
    
    // 選択件数が表示されていることを確認
    expect(screen.getByText('2個の項目が選択されています')).toBeInTheDocument();
    
    // 項目1を再度クリックして選択解除
    fireEvent.click(item1);
    
    // 1つの項目だけが選択されていることを確認
    await waitFor(() => {
      const selectedItems = screen.queryAllByTestId('check-icon');
      expect(selectedItems.length).toBe(1);
    });
    
    // 選択件数が更新されていることを確認
    expect(screen.getByText('1個の項目が選択されています')).toBeInTheDocument();
  });

  test('selects all items with select all button', async () => {
    render(
      <TestFormikWrapper>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // データが読み込まれるまで待機
    await waitFor(() => {
      expect(screen.queryByText('確認作業項目を読み込み中...')).not.toBeInTheDocument();
    });
    
    // 全て選択ボタンをクリック
    const selectAllButton = screen.getByText('全て選択');
    fireEvent.click(selectAllButton);
    
    // 全ての項目が選択されていることを確認
    await waitFor(() => {
      const selectedItems = screen.queryAllByTestId('check-icon');
      expect(selectedItems.length).toBe(4);
    });
    
    // 選択件数が表示されていることを確認
    expect(screen.getByText('4個の項目が選択されています')).toBeInTheDocument();
  });

  test('deselects all items with deselect all button', async () => {
    // 初期値として全て選択された状態から始める
    const initialValues = {
      item_names: mockItemNames.map(item => item.name)
    };
    
    render(
      <TestFormikWrapper initialValues={initialValues}>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // データが読み込まれるまで待機
    await waitFor(() => {
      expect(screen.queryByText('確認作業項目を読み込み中...')).not.toBeInTheDocument();
    });
    
    // 全ての項目が選択されていることを確認
    await waitFor(() => {
      const selectedItems = screen.queryAllByTestId('check-icon');
      expect(selectedItems.length).toBe(4);
    });
    
    // 全て解除ボタンをクリック
    const deselectAllButton = screen.getByText('全て解除');
    fireEvent.click(deselectAllButton);
    
    // 全ての項目の選択が解除されていることを確認
    await waitFor(() => {
      const selectedItems = screen.queryAllByTestId('check-icon');
      expect(selectedItems.length).toBe(0);
    });
    
    // 選択件数が表示されていないことを確認
    expect(screen.queryByText(/個の項目が選択されています/)).not.toBeInTheDocument();
  });

  test('handles custom input text area', async () => {
    render(
      <TestFormikWrapper>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // データが読み込まれるまで待機
    await waitFor(() => {
      expect(screen.queryByText('確認作業項目を読み込み中...')).not.toBeInTheDocument();
    });
    
    // カスタム入力にトグル
    const customCheckbox = screen.getByLabelText('カスタム確認作業項目を入力');
    fireEvent.click(customCheckbox);
    
    // テキストエリアが表示されていることを確認
    const textarea = screen.getByPlaceholderText(/確認作業項目を入力/);
    expect(textarea).toBeInTheDocument();
    
    // テキストエリアに入力
    const inputText = '項目A\n項目B\n項目C';
    fireEvent.change(textarea, { target: { value: inputText } });
    
    // フォームの値が更新されていることを確認
    // テキストエリアの値の存在確認のみに変更（厳密な改行コードの比較は回避）
    expect(textarea).toHaveValue(inputText);
    
    // 別の方法として、個別のテキストが含まれているかも確認
    expect(textarea.value).toContain('項目A');
    expect(textarea.value).toContain('項目B');
    expect(textarea.value).toContain('項目C');
  });

  test('handles API error', async () => {
    // APIエラーをシミュレート
    inspectionItemAPI.itemNames.getAll.mockRejectedValue(new Error('API Error'));
    
    // コンソールエラーをモック
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    render(
      <TestFormikWrapper>
        <InspectionItemNameInput />
      </TestFormikWrapper>
    );
    
    // APIが呼ばれたことを確認
    await waitFor(() => {
      expect(inspectionItemAPI.itemNames.getAll).toHaveBeenCalledTimes(1);
    });
    
    // エラーがコンソールに出力されたことを確認
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("確認作業項目の取得エラー:", expect.any(Error));
    });
    
    // ローディング状態が終了していることを確認
    await waitFor(() => {
      expect(screen.queryByText('確認作業項目を読み込み中...')).not.toBeInTheDocument();
    });
    
    // 片付け
    console.error = originalConsoleError;
  });
});