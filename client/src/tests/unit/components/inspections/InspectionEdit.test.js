// src/tests/unit/components/inspections/InspectionEdit.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../../../utils/test-utils';
import '@testing-library/jest-dom';
import InspectionEdit from '../../../../components/inspections/InspectionEdit';
import { inspectionAPI } from '../../../../services/api';

// モックをセットアップ
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../../services/api', () => ({
  inspectionAPI: {
    getById: jest.fn(),
    update: jest.fn(),
  },
}));

// DatePickerをモック
jest.mock('react-datepicker', () => {
  const DatePickerMock = ({ selected, onChange }) => (
    <input 
      data-testid="date-picker"
      type="text" 
      value={selected ? selected.toISOString() : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  );
  return DatePickerMock;
});

describe('InspectionEdit', () => {
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
        status: '正常',
        checked_at: '2025-03-15T09:35:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    inspectionAPI.getById.mockResolvedValue(mockInspectionData);
    inspectionAPI.update.mockResolvedValue({ success: true });
  });

  test('renders loading state initially', async () => {
    render(<InspectionEdit />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    await waitFor(() => expect(inspectionAPI.getById).toHaveBeenCalledWith('1'));
  });

  test('renders inspection form with fetched data', async () => {
    render(<InspectionEdit />);
    
    await waitFor(() => {
      expect(screen.getAllByText('点検結果の編集')[0]).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText('点検基本情報')).toBeInTheDocument();
    expect(screen.getByText('点検日')).toBeInTheDocument();
    expect(screen.getByText('点検者名')).toBeInTheDocument();
    expect(screen.getByText('開始時間')).toBeInTheDocument();
    expect(screen.getByText('終了時間')).toBeInTheDocument();
    
    // 点検結果セクション
    expect(screen.getByText('ラックNo.')).toBeInTheDocument();
    expect(screen.getByText('ラックNo.R01')).toBeInTheDocument();
    expect(screen.getByText('U01-U02')).toBeInTheDocument();
    expect(screen.getByText('サーバA')).toBeInTheDocument();
    expect(screen.getByText('モデルX')).toBeInTheDocument();
    expect(screen.getByText('ファン動作確認')).toBeInTheDocument();
    expect(screen.getByText('温度確認')).toBeInTheDocument();
    
    // 正常ボタンが選択されているか
    const normalButtons = screen.getAllByText('正常');
    expect(normalButtons.length).toBe(2);
    normalButtons.forEach(button => {
      expect(button.closest('label')).toHaveClass('bg-green-500');
    });
  });

  test('shows error message when data fetch fails', async () => {
    inspectionAPI.getById.mockRejectedValue(new Error('エラーが発生しました'));
    
    render(<InspectionEdit />);
    
    await waitFor(() => {
      expect(screen.getByText(/点検データの読み込みに失敗しました/i)).toBeInTheDocument();
    });
  });

  test('updates form values when user edits', async () => {
    render(<InspectionEdit />);
    
    await waitFor(() => {
      expect(screen.getAllByText('点検結果の編集')[0]).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // 点検者名を変更
    await waitFor(() => {
      const inspectorNameField = screen.getByDisplayValue('テスト点検者');
      fireEvent.change(inspectorNameField, { target: { value: '新しい点検者名' } });
    }, { timeout: 2000 });
    
    // 点検結果の状態を「異常」に変更
    await waitFor(() => {
      const abnormalButtons = screen.getAllByText('異常');
      fireEvent.click(abnormalButtons[0]);
    }, { timeout: 2000 });
    
    // 変更が反映されているか確認
    await waitFor(() => {
      const updatedField = screen.getByDisplayValue('新しい点検者名');
      expect(updatedField).toBeInTheDocument();
      
      const abnormalLabels = screen.getAllByText('異常');
      expect(abnormalLabels[0].closest('label')).toHaveClass('bg-red-500');
    }, { timeout: 2000 });
  });

  test('submits form with updated data', async () => {
    render(<InspectionEdit />);
    
    await waitFor(() => {
      expect(screen.getAllByText('点検結果の編集')[0]).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // 点検者名を変更
    await waitFor(() => {
      const inspectorNameField = screen.getByDisplayValue('テスト点検者');
      fireEvent.change(inspectorNameField, { target: { value: '新しい点検者名' } });
    }, { timeout: 2000 });
    
    // フォームを送信
    await waitFor(() => {
      const submitButton = screen.getByText('保存');
      fireEvent.click(submitButton);
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(inspectionAPI.update).toHaveBeenCalledTimes(1);
      expect(inspectionAPI.update).toHaveBeenCalledWith('1', expect.objectContaining({
        inspector_name: '新しい点検者名',
      }));
    });
  });

  test('shows error message when update fails', async () => {
    inspectionAPI.update.mockRejectedValue(new Error('更新エラー'));
    
    render(<InspectionEdit />);
    
    await waitFor(() => {
      expect(screen.getAllByText('点検結果の編集')[0]).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // フォームを送信
    await waitFor(() => {
      const submitButton = screen.getByText('保存');
      fireEvent.click(submitButton);
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText(/点検データの更新に失敗しました/i)).toBeInTheDocument();
    });
  });
});