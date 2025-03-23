// モックデータの定義

// 顧客データのモック
export const mockCustomers = [
  {
    id: 1,
    customer_name: 'テスト株式会社A',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    customer_name: 'テスト株式会社B',
    created_at: '2023-01-02T00:00:00.000Z',
    updated_at: '2023-01-02T00:00:00.000Z'
  }
];

// 機器データのモック
export const mockDevices = [
  {
    id: 1,
    device_name: 'サーバー1',
    customer_id: 1,
    customer_name: 'テスト株式会社A',
    model: 'Model-X',
    rack_number: 5,
    unit_start_position: 10,
    unit_end_position: 12,
    unit_position: 'U10-U12',
    device_type: 'サーバ',
    hardware_type: '物理',
    created_at: '2023-02-01T00:00:00.000Z',
    updated_at: '2023-02-01T00:00:00.000Z'
  },
  {
    id: 2,
    device_name: 'サーバー2',
    customer_id: 2,
    customer_name: 'テスト株式会社B',
    model: 'Model-Y',
    rack_number: 3,
    unit_start_position: 5,
    unit_end_position: 5,
    unit_position: 'U5',
    device_type: 'サーバ',
    hardware_type: 'VM',
    created_at: '2023-02-02T00:00:00.000Z',
    updated_at: '2023-02-02T00:00:00.000Z'
  }
];

// 点検項目名のモック
export const mockInspectionItemNames = [
  {
    id: 1,
    name: 'CPUの状態確認',
    created_at: '2023-03-01T00:00:00.000Z',
    updated_at: '2023-03-01T00:00:00.000Z'
  },
  {
    id: 2,
    name: 'メモリの状態確認',
    created_at: '2023-03-02T00:00:00.000Z',
    updated_at: '2023-03-02T00:00:00.000Z'
  }
];

// 点検項目のモック
export const mockInspectionItems = [
  {
    id: 1,
    device_id: 1,
    device_name: 'サーバー1',
    item_name_id: 1,
    item_name: 'CPUの状態確認',
    customer_id: 1,
    customer_name: 'テスト株式会社A',
    rack_number: 5,
    unit_start_position: 10,
    unit_end_position: 12,
    model: 'Model-X',
    created_at: '2023-04-01T00:00:00.000Z',
    updated_at: '2023-04-01T00:00:00.000Z'
  },
  {
    id: 2,
    device_id: 2,
    device_name: 'サーバー2',
    item_name_id: 2,
    item_name: 'メモリの状態確認',
    customer_id: 2,
    customer_name: 'テスト株式会社B',
    rack_number: 3,
    unit_start_position: 5,
    unit_end_position: 5,
    model: 'Model-Y',
    created_at: '2023-04-02T00:00:00.000Z',
    updated_at: '2023-04-02T00:00:00.000Z'
  }
];

// 点検のモック
export const mockInspections = [
  {
    id: 1,
    inspection_date: '2023-05-01',
    start_time: '10:00:00',
    end_time: '11:00:00',
    inspector_name: '点検者1',
    status: '完了',
    created_at: '2023-05-01T00:00:00.000Z',
    updated_at: '2023-05-01T00:00:00.000Z'
  },
  {
    id: 2,
    inspection_date: '2023-05-02',
    start_time: '14:00:00',
    end_time: '15:00:00',
    inspector_name: '点検者2',
    status: '完了',
    created_at: '2023-05-02T00:00:00.000Z',
    updated_at: '2023-05-02T00:00:00.000Z'
  }
];

// 点検結果のモック
export const mockInspectionResults = [
  {
    id: 1,
    inspection_id: 1,
    device_id: 1,
    inspection_item_id: 1,
    check_item: 'CPUの状態確認',
    status: '正常',
    checked_at: '2023-05-01T10:30:00.000Z',
    created_at: '2023-05-01T10:30:00.000Z',
    updated_at: '2023-05-01T10:30:00.000Z'
  },
  {
    id: 2,
    inspection_id: 2,
    device_id: 2,
    inspection_item_id: 2,
    check_item: 'メモリの状態確認',
    status: '異常',
    checked_at: '2023-05-02T14:30:00.000Z',
    created_at: '2023-05-02T14:30:00.000Z',
    updated_at: '2023-05-02T14:30:00.000Z'
  }
];