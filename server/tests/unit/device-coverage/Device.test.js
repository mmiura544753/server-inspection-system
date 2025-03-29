// server/tests/unit/device-coverage/Device.test.js

// テスト用に作成した実装を使用
const { sequelize, Device, Customer } = require('../../device-test-helpers/device-test');

beforeAll(async () => {
  // テストテーブルを同期
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // テスト後に接続を閉じる
  await sequelize.close();
});

describe('Device Model', () => {
  let testCustomer;

  beforeEach(async () => {
    // テスト用のテーブルをクリア
    await Device.destroy({ truncate: true, cascade: true });
    await Customer.destroy({ truncate: true, cascade: true });
    
    // テスト用の顧客を作成
    testCustomer = await Customer.create({ 
      customer_name: 'テスト顧客' 
    });
  });

  it('機器を正常に作成できること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      model: 'TEST-MODEL',
      rack_number: 1,
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 10,
      unit_end_position: 12
    };

    const device = await Device.create(deviceData);
    
    expect(device).toBeTruthy();
    expect(device.id).toBe(1);
    expect(device.device_name).toBe('テストサーバ');
    expect(device.model).toBe('TEST-MODEL');
    expect(device.rack_number).toBe(1);
    expect(device.device_type).toBe('サーバ');
    expect(device.hardware_type).toBe('物理');
    expect(device.unit_start_position).toBe(10);
    expect(device.unit_end_position).toBe(12);
  });

  it('必須フィールドが欠けている場合はエラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      // device_name が欠けている
      device_type: 'サーバ',
      hardware_type: '物理'
    };

    await expect(Device.create(deviceData))
      .rejects.toThrow();
  });

  it('機器名が空文字の場合はバリデーションエラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: '',
      device_type: 'サーバ',
      hardware_type: '物理'
    };
    
    await expect(Device.create(deviceData))
      .rejects.toThrow('Validation error: 機器名は必須です');
  });

  it('機器名が101文字以上の場合はバリデーションエラーになること', async () => {
    const longName = 'あ'.repeat(101);
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: longName,
      device_type: 'サーバ',
      hardware_type: '物理'
    };
    
    await expect(Device.create(deviceData))
      .rejects.toThrow('Validation error: 機器名は100文字以内で入力してください');
  });

  it('モデル名が51文字以上の場合はバリデーションエラーになること', async () => {
    const longModel = 'A'.repeat(51);
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      model: longModel,
      device_type: 'サーバ',
      hardware_type: '物理'
    };
    
    await expect(Device.create(deviceData))
      .rejects.toThrow('Validation error: モデル名は50文字以内で入力してください');
  });

  it('ラックNo.に負の値を指定するとバリデーションエラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      rack_number: -1,
      device_type: 'サーバ',
      hardware_type: '物理'
    };
    
    await expect(Device.create(deviceData))
      .rejects.toThrow('Validation error: ラックNo.は1以上の値を入力してください');
  });

  it('ラックNo.に小数を指定するとバリデーションエラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      rack_number: 1.5,
      device_type: 'サーバ',
      hardware_type: '物理'
    };
    
    await expect(Device.create(deviceData))
      .rejects.toThrow('Validation error: ラックNo.は整数で入力してください');
  });

  it('無効な機器種別を指定するとバリデーションエラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      device_type: '無効な種別',
      hardware_type: '物理'
    };
    
    await expect(Device.create(deviceData))
      .rejects.toThrow('Validation error: 無効な機器種別です');
  });

  it('無効なハードウェアタイプを指定するとバリデーションエラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      device_type: 'サーバ',
      hardware_type: '無効なタイプ'
    };
    
    await expect(Device.create(deviceData))
      .rejects.toThrow('Validation error: 無効なハードウェアタイプです');
  });

  it('ユニット開始位置に負の値を指定するとバリデーションエラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: -1
    };
    
    await expect(Device.create(deviceData))
      .rejects.toThrow('Validation error: ユニット開始位置は1以上の値を入力してください');
  });

  it('ユニット開始位置に100以上の値を指定するとバリデーションエラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 100
    };
    
    await expect(Device.create(deviceData))
      .rejects.toThrow('Validation error: ユニット開始位置は99以下の値を入力してください');
  });

  it('getUnitPositionDisplayメソッドが正しく動作すること（単一ユニット）', async () => {
    const device = await Device.create({
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 5,
      unit_end_position: 5
    });
    
    expect(device.getUnitPositionDisplay()).toBe('U5');
  });

  it('getUnitPositionDisplayメソッドが正しく動作すること（複数ユニット）', async () => {
    const device = await Device.create({
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 5,
      unit_end_position: 8
    });
    
    expect(device.getUnitPositionDisplay()).toBe('U5-U8');
  });

  it('getUnitPositionDisplayメソッドが正しく動作すること（終了位置がnull）', async () => {
    const device = await Device.create({
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 5,
      unit_end_position: null
    });
    
    expect(device.getUnitPositionDisplay()).toBe('U5');
  });

  it('getUnitPositionDisplayメソッドが正しく動作すること（開始位置がnull）', async () => {
    const device = await Device.create({
      customer_id: testCustomer.id,
      device_name: 'テストサーバ',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: null,
      unit_end_position: null
    });
    
    expect(device.getUnitPositionDisplay()).toBe('');
  });

  it('機器を更新できること', async () => {
    // テスト用の機器を作成
    const device = await Device.create({
      customer_id: testCustomer.id,
      device_name: '更新前サーバ',
      device_type: 'サーバ',
      hardware_type: '物理'
    });
    
    // 機器名を更新
    device.device_name = '更新後サーバ';
    await device.save();
    
    // 更新後の機器を取得
    const updatedDevice = await Device.findByPk(device.id);
    
    expect(updatedDevice.device_name).toBe('更新後サーバ');
  });

  it('機器を削除できること', async () => {
    // テスト用の機器を作成
    const device = await Device.create({
      customer_id: testCustomer.id,
      device_name: '削除用サーバ',
      device_type: 'サーバ',
      hardware_type: '物理'
    });
    
    // 機器を削除
    await device.destroy();
    
    // 削除後に機器を検索
    const deletedDevice = await Device.findByPk(device.id);
    
    expect(deletedDevice).toBeNull();
  });

  it('関連する顧客情報を取得できること', async () => {
    // テスト用の機器を作成
    const device = await Device.create({
      customer_id: testCustomer.id,
      device_name: 'リレーション確認サーバ',
      device_type: 'サーバ',
      hardware_type: '物理'
    });
    
    // 関連する顧客を含めて機器を取得
    const deviceWithCustomer = await Device.findByPk(device.id, {
      include: [{ model: Customer, as: 'customer' }]
    });
    
    expect(deviceWithCustomer.customer).toBeTruthy();
    expect(deviceWithCustomer.customer.customer_name).toBe('テスト顧客');
  });
});