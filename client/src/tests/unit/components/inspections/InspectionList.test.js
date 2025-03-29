import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../../../utils/test-utils';
import { BrowserRouter } from 'react-router-dom';
import InspectionList from '../../../../components/inspections/InspectionList';
import { inspectionAPI } from '../../../../services/api';
import { mockInspections } from '../../../mocks/mockData';
import { sortArrayByKey } from '../../../../utils/sortUtils';

// inspectionAPIのモック化
jest.mock('../../../../services/api', () => ({
  inspectionAPI: {
    getAll: jest.fn()
  }
}));

// sortUtilsのモック化
jest.mock('../../../../utils/sortUtils', () => ({
  sortArrayByKey: jest.fn(arr => arr)
}));

// 日付フォーマット関数のモック化
jest.mock('../../../../utils/dateTimeUtils', () => ({
  formatDate: jest.fn(date => '2025/03/29'),
  formatTime: jest.fn(time => '10:00')
}));

describe('InspectionList Component', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    inspectionAPI.getAll.mockResolvedValue([...mockInspections]);
    sortArrayByKey.mockImplementation((array, key, descending) => {
      return [...array]; // 簡易的なソート実装（テスト用）
    });
  });

  it('コンポーネントが正しくレンダリングされる', async () => {
    render(
      <BrowserRouter>
        <InspectionList />
      </BrowserRouter>
    );

    // ローディング表示が最初に表示される
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // データが読み込まれた後に表示される要素をチェック
    await waitFor(() => {
      expect(screen.getByText('点検結果一覧')).toBeInTheDocument();
    });

    // テーブルヘッダーが表示されることを確認
    expect(screen.getByText('点検日')).toBeInTheDocument();
    expect(screen.getByText('点検者名')).toBeInTheDocument();
    expect(screen.getByText('点検時間')).toBeInTheDocument();
    expect(screen.getByText('顧客名')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();

    // 新規点検ボタンが表示されることを確認
    expect(screen.getByText('新規点検')).toBeInTheDocument();
    
    // API呼び出しが行われたことを確認
    expect(inspectionAPI.getAll).toHaveBeenCalledTimes(1);
  });

  it('データがない場合はメッセージが表示される', async () => {
    // 空配列を返すようにAPIモックを設定
    inspectionAPI.getAll.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <InspectionList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('点検データがありません')).toBeInTheDocument();
    });
  });

  it('APIエラーが発生した場合はエラーメッセージが表示される', async () => {
    // エラーを返すようにAPIモックを設定
    inspectionAPI.getAll.mockRejectedValue(new Error('API error'));

    render(
      <BrowserRouter>
        <InspectionList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('点検データの読み込みに失敗しました。')).toBeInTheDocument();
    });
  });

  it('「点検日」ヘッダーをクリックするとソートが変更される', async () => {
    render(
      <BrowserRouter>
        <InspectionList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('点検日')).toBeInTheDocument();
    });

    // 点検日ヘッダーをクリック
    fireEvent.click(screen.getByText('点検日'));

    // ソート関数が呼ばれたことを確認（初期状態は降順になっているはずなので昇順に変更される）
    expect(sortArrayByKey).toHaveBeenCalledWith(
      expect.any(Array),
      'inspection_date',
      false
    );

    // もう一度クリックして降順に戻る
    fireEvent.click(screen.getByText('点検日'));
    expect(sortArrayByKey).toHaveBeenCalledWith(
      expect.any(Array),
      'inspection_date',
      true
    );
  });

  it('点検データが表示される', async () => {
    const enhancedMockInspections = mockInspections.map(inspection => ({
      ...inspection,
      customer_name: `顧客${inspection.id}`
    }));
    
    inspectionAPI.getAll.mockResolvedValue(enhancedMockInspections);

    render(
      <BrowserRouter>
        <InspectionList />
      </BrowserRouter>
    );

    await waitFor(() => {
      // 各点検者の名前が表示されるか確認
      expect(screen.getByText('点検者1')).toBeInTheDocument();
      expect(screen.getByText('点検者2')).toBeInTheDocument();
      
      // 顧客名が表示されるか確認
      expect(screen.getByText('顧客1')).toBeInTheDocument();
      expect(screen.getByText('顧客2')).toBeInTheDocument();
    });

    // 詳細ボタンと編集ボタンが表示されることを確認
    const detailButtons = screen.getAllByText('詳細');
    const editButtons = screen.getAllByText('編集');

    expect(detailButtons.length).toBe(2);
    expect(editButtons.length).toBe(2);

    // 操作ボタンのリンク先が正しいか確認
    expect(detailButtons[0].closest('a')).toHaveAttribute('href', '/inspections/1');
    expect(editButtons[0].closest('a')).toHaveAttribute('href', '/inspections/edit/1');
    expect(detailButtons[1].closest('a')).toHaveAttribute('href', '/inspections/2');
    expect(editButtons[1].closest('a')).toHaveAttribute('href', '/inspections/edit/2');
  });

  it('時間が未記録の場合に適切なメッセージが表示される', async () => {
    const inspectionsWithoutTime = [
      {
        ...mockInspections[0],
        start_time: null,
        end_time: null
      }
    ];
    
    inspectionAPI.getAll.mockResolvedValue(inspectionsWithoutTime);

    render(
      <BrowserRouter>
        <InspectionList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('時間未記録')).toBeInTheDocument();
    });
  });

  it('新規点検ボタンのリンク先が正しい', async () => {
    render(
      <BrowserRouter>
        <InspectionList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const newInspectionButton = screen.getByText('新規点検');
      expect(newInspectionButton).toBeInTheDocument();
      expect(newInspectionButton.closest('a')).toHaveAttribute('href', '/inspections/new');
    });
  });
});