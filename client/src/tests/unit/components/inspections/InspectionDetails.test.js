// src/tests/unit/components/inspections/InspectionDetails.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import '@testing-library/jest-dom';
import InspectionDetails from '../../../../components/inspections/InspectionDetails';
import { inspectionAPI } from '../../../../services/api';

// モックをセットアップ
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  Link: ({ to, children, className }) => (
    <a href={to} className={className} data-testid={`link-${to.replace(/\//g, '-').replace(/^\-/, '')}`}>
      {children}
    </a>
  ),
}));

jest.mock('../../../../services/api', () => ({
  inspectionAPI: {
    getById: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('react-icons/fa', () => ({
  FaEdit: () => <span data-testid="edit-icon">編集アイコン</span>,
  FaTrash: () => <span data-testid="trash-icon">削除アイコン</span>,
  FaArrowLeft: () => <span data-testid="arrow-left-icon">戻るアイコン</span>,
  FaCheckCircle: () => <span data-testid="check-icon">確認アイコン</span>,
  FaTimes: () => <span data-testid="times-icon">キャンセルアイコン</span>,
}));

describe('InspectionDetails', () => {
  const mockInspectionData = {
    id: 1,
    inspection_date: '2025-03-15T00:00:00.000Z',
    inspector_name: 'テスト点検者',
    start_time: '09:00',
    end_time: '11:00',
    results: [
      {
        id: 101,
        inspection_id: 1,
        rack_number: 'R01',
        unit_position: 'U01-U02',
        device_name: 'サーバA',
        model: 'モデルX',
        check_item: 'ファン動作確認',
        status: '正常',
        checked_at: '2025-03-15T09:30:00.000Z',
      },
      {
        id: 102,
        inspection_id: 1,
        rack_number: 'R01',
        unit_position: 'U01-U02',
        device_name: 'サーバA',
        model: 'モデルX',
        check_item: '温度確認',
        status: '異常',
        checked_at: '2025-03-15T09:35:00.000Z',
      },
      {
        id: 103,
        inspection_id: 1,
        rack_number: 'R02',
        unit_position: 'U03-U04',
        device_name: 'サーバB',
        model: 'モデルY',
        check_item: 'ディスク容量確認',
        status: '正常',
        checked_at: '2025-03-15T10:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    inspectionAPI.getById.mockResolvedValue(mockInspectionData);
    inspectionAPI.delete.mockResolvedValue({ success: true });

    // windowのlocation.hrefをモック
    delete window.location;
    window.location = { href: '' };
  });

  test('renders loading state initially', async () => {
    render(<InspectionDetails />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    await waitFor(() => expect(inspectionAPI.getById).toHaveBeenCalledWith('1'));
  });

  test('renders inspection details with fetched data', async () => {
    render(<InspectionDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('点検詳細')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // 基本情報の表示を確認
    expect(screen.getByText('基本情報')).toBeInTheDocument();
    expect(screen.getByText('点検日:')).toBeInTheDocument();
    expect(screen.getByText('2025/03/15')).toBeInTheDocument();
    expect(screen.getByText('点検者:')).toBeInTheDocument();
    expect(screen.getByText('テスト点検者')).toBeInTheDocument();
    expect(screen.getByText('開始時間:')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('終了時間:')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
    
    // 点検結果テーブルの表示を確認
    expect(screen.getAllByText('点検結果')[0]).toBeInTheDocument();
    expect(screen.getByText('ラックNo.R01')).toBeInTheDocument();
    expect(screen.getByText('ラックNo.R02')).toBeInTheDocument();
    expect(screen.getByText('U01-U02')).toBeInTheDocument();
    expect(screen.getByText('U03-U04')).toBeInTheDocument();
    expect(screen.getByText('サーバA')).toBeInTheDocument();
    expect(screen.getByText('サーバB')).toBeInTheDocument();
    expect(screen.getByText('モデルX')).toBeInTheDocument();
    expect(screen.getByText('モデルY')).toBeInTheDocument();
    expect(screen.getByText('ファン動作確認')).toBeInTheDocument();
    expect(screen.getByText('温度確認')).toBeInTheDocument();
    expect(screen.getByText('ディスク容量確認')).toBeInTheDocument();
    
    // ステータスの表示を確認
    const statusElements = screen.getAllByText(/正常|異常/);
    expect(statusElements.length).toBe(3);  // 合計3つの結果がある
    
    // 編集・削除ボタンの存在を確認
    expect(screen.getByText('編集')).toBeInTheDocument();
    expect(screen.getByText('削除')).toBeInTheDocument();
  });

  test('shows error message when data fetch fails', async () => {
    inspectionAPI.getById.mockRejectedValue(new Error('エラーが発生しました'));
    
    render(<InspectionDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('点検データの取得に失敗しました。')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('link-inspections')).toBeInTheDocument();
  });

  test('shows not found message when inspection is null', async () => {
    inspectionAPI.getById.mockResolvedValue(null);
    
    render(<InspectionDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('点検データが見つかりません。')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('link-inspections')).toBeInTheDocument();
  });

  test('shows delete confirmation modal when delete button is clicked', async () => {
    render(<InspectionDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('点検詳細')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // 削除ボタンをクリック
    await waitFor(() => {
      const deleteButton = screen.getByText('削除');
      fireEvent.click(deleteButton);
    }, { timeout: 2000 });
    
    // モーダルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('点検削除の確認')).toBeInTheDocument();
      expect(screen.getByText(/点検ID「1」の記録を削除してもよろしいですか？/)).toBeInTheDocument();
      expect(screen.getByText(/この操作は元に戻せません。/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('deletes inspection when confirmed in modal', async () => {
    render(<InspectionDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('点検詳細')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // 削除ボタンをクリック
    await waitFor(() => {
      const deleteButton = screen.getByText('削除');
      fireEvent.click(deleteButton);
    }, { timeout: 2000 });
    
    // 確認ボタンをクリック
    await waitFor(() => {
      const modalDialogue = screen.getByText('点検削除の確認');
      expect(modalDialogue).toBeInTheDocument();
      
      const confirmButton = screen.getByText('確認');
      fireEvent.click(confirmButton);
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(inspectionAPI.delete).toHaveBeenCalledWith('1');
      expect(window.location.href).toBe('/inspections');
    });
  });

  test('handles delete error correctly', async () => {
    inspectionAPI.delete.mockRejectedValue(new Error('削除エラー'));
    
    render(<InspectionDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('点検詳細')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // 削除ボタンをクリック
    await waitFor(() => {
      const deleteButton = screen.getByText('削除');
      fireEvent.click(deleteButton);
    }, { timeout: 2000 });
    
    // 確認ボタンをクリック
    await waitFor(() => {
      const modalDialogue = screen.getByText('点検削除の確認');
      expect(modalDialogue).toBeInTheDocument();
      
      const confirmButton = screen.getByText('確認');
      fireEvent.click(confirmButton);
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('点検の削除に失敗しました。')).toBeInTheDocument();
    });
  });

  test('formats date and time correctly', async () => {
    const customData = {
      ...mockInspectionData,
      inspection_date: '2025-12-31T00:00:00.000Z',
      start_time: '08:30',
      end_time: '17:45',
    };
    
    inspectionAPI.getById.mockResolvedValue(customData);
    
    render(<InspectionDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('点検詳細')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // フォーマットされた日付と時刻を確認
    expect(screen.getByText('2025/12/31')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('17:45')).toBeInTheDocument();
  });

  test('handles empty results array correctly', async () => {
    const emptyResultsData = {
      ...mockInspectionData,
      results: [],
    };
    
    inspectionAPI.getById.mockResolvedValue(emptyResultsData);
    
    render(<InspectionDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('点検詳細')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText('点検結果がありません。')).toBeInTheDocument();
  });
});