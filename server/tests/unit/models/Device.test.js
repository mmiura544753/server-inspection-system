// Device.test.js
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let Customer;
let Device;

beforeAll(() => {
  // テスト用のインメモリ SQLite データベースを使用
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false // ロギングを無効化
  });

  // Customer モデル定義
  Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: '顧客名は必須です' },
        len: { args: [1, 100], msg: '顧客名は100文字以内で入力してください' }
      }
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Device モデル定義
  Device = sequelize.define('Device', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
      validate: {
        notNull: { msg: '顧客IDは必須です' },
      },
    },
    device_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: '機器名は必須です' },
        len: { args: [1, 100], msg: '機器名は100文字以内で入力してください' },
      },
    },
    model: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: { args: [0, 50], msg: 'モデル名は50文字以内で入力してください' },
      },
    },
    rack_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        isValidRackNumber(value) {
          if (value === null || value === undefined) {
            return;
          }
          if (!Number.isInteger(value)) {
            throw new Error('ラックNo.は整数で入力してください');
          }
          if (value < 1) {
            throw new Error('ラックNo.は1以上の値を入力してください');
          }
        },
      },
    },
    device_type: {
      type: DataTypes.ENUM('サーバ', 'UPS', 'ネットワーク機器', 'その他'),
      allowNull: false,
      validate: {
        notEmpty: { msg: '機器種別は必須です' },
        isIn: {
          args: [['サーバ', 'UPS', 'ネットワーク機器', 'その他']],
          msg: '無効な機器種別です',
        },
      },
    },
    hardware_type: {
      type: DataTypes.ENUM('物理', 'VM'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'ハードウェアタイプは必須です' },
        isIn: {
          args: [['物理', 'VM']],
          msg: '無効なハードウェアタイプです',
        },
      },
    },
    unit_start_position: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: null,
      comment: 'ユニット開始位置（数値）',
      validate: {
        isInt: { msg: 'ユニット開始位置は整数で入力してください' },
        min: {
          args: [1],
          msg: 'ユニット開始位置は1以上の値を入力してください',
        },
        max: {
          args: [99],
          msg: 'ユニット開始位置は99以下の値を入力してください',
        },
      },
    },
    unit_end_position: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: null,
      comment: 'ユニット終了位置（数値）',
      validate: {
        isInt: { msg: 'ユニット終了位置は整数で入力してください' },
        min: {
          args: [1],
          msg: 'ユニット終了位置は1以上の値を入力してください',
        },
        max: {
          args: [99],
          msg: 'ユニット終了位置は99以下の値を入力してください',
        },
      },
    }
  }, {
    tableName: 'devices',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // ユニット位置表示のゲッター追加
  Device.prototype.getUnitPositionDisplay = function () {
    if (this.unit_start_position === null) return '';
    if (
      this.unit_end_position === null ||
      this.unit_start_position === this.unit_end_position
    ) {
      return `U${this.unit_start_position}`;
    }
    return `U${this.unit_start_position}-U${this.unit_end_position}`;
  };

  // リレーションシップの定義
  Device.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  Customer.hasMany(Device, { foreignKey: 'customer_id', as: 'devices' });

  // テーブルの同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後に接続を閉じる
  return sequelize.close();
});

describe('Device Model', () => {
  let testCustomer;

  beforeEach(async () => {
    // テスト前にテーブルをクリアし、テスト用の顧客を作成
    await Device.destroy({ truncate: true, cascade: true });
    await Customer.destroy({ truncate: true, cascade: true });
    
    testCustomer = await Customer.create({ customer_name: 'テスト顧客' });
  });

  it('有効なデータで機器を作成できること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      model: 'TestModel-1',
      rack_number: 5,
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 10,
      unit_end_position: 12
    };

    const device = await Device.create(deviceData);
    
    expect(device).toBeTruthy();
    expect(device.id).toBe(1);
    expect(device.device_name).toBe('テストサーバー');
    expect(device.rack_number).toBe(5);
    expect(device.getUnitPositionDisplay()).toBe('U10-U12');
  });

  it('顧客IDが未設定の場合エラーになること', async () => {
    const deviceData = {
      device_name: 'テストサーバー',
      device_type: 'サーバ',
      hardware_type: '物理'
    };

    await expect(Device.create(deviceData))
      .rejects.toThrow();
  });

  it('機器名が未設定の場合エラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_type: 'サーバ',
      hardware_type: '物理'
    };

    await expect(Device.create(deviceData))
      .rejects.toThrow('Device.device_name cannot be null');
  });

  it('機器種別が無効な値の場合エラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      device_type: '無効な種別',
      hardware_type: '物理'
    };

    await expect(Device.create(deviceData))
      .rejects.toThrow('無効な機器種別です');
  });

  it('ハードウェアタイプが無効な値の場合エラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      device_type: 'サーバ',
      hardware_type: '無効なタイプ'
    };

    await expect(Device.create(deviceData))
      .rejects.toThrow('無効なハードウェアタイプです');
  });

  it('ラックナンバーが整数以外の場合エラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      rack_number: 'A',
      device_type: 'サーバ',
      hardware_type: '物理'
    };

    await expect(Device.create(deviceData))
      .rejects.toThrow('ラックNo.は整数で入力してください');
  });

  it('ラックナンバーに0以下の値を設定した場合エラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      rack_number: 0,
      device_type: 'サーバ',
      hardware_type: '物理'
    };

    await expect(Device.create(deviceData))
      .rejects.toThrow('ラックNo.は1以上の値を入力してください');
  });

  it('ユニット開始位置が範囲外の場合エラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 0
    };

    await expect(Device.create(deviceData))
      .rejects.toThrow('ユニット開始位置は1以上の値を入力してください');
  });

  it('ユニット終了位置が範囲外の場合エラーになること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 10,
      unit_end_position: 100
    };

    await expect(Device.create(deviceData))
      .rejects.toThrow('ユニット終了位置は99以下の値を入力してください');
  });

  it('ユニット位置表示が正しく生成されること（開始のみ）', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 5
    };

    const device = await Device.create(deviceData);
    expect(device.getUnitPositionDisplay()).toBe('U5');
  });

  it('ユニット位置表示が正しく生成されること（開始と終了が同じ）', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 5,
      unit_end_position: 5
    };

    const device = await Device.create(deviceData);
    expect(device.getUnitPositionDisplay()).toBe('U5');
  });

  it('ユニット位置表示が正しく生成されること（開始と終了が異なる）', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      device_type: 'サーバ',
      hardware_type: '物理',
      unit_start_position: 5,
      unit_end_position: 7
    };

    const device = await Device.create(deviceData);
    expect(device.getUnitPositionDisplay()).toBe('U5-U7');
  });

  it('ユニット位置が設定されていない場合、空文字が返されること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      device_type: 'サーバ',
      hardware_type: '物理'
    };

    const device = await Device.create(deviceData);
    expect(device.getUnitPositionDisplay()).toBe('');
  });

  it('機器と顧客の関連付けが取得できること', async () => {
    const deviceData = {
      customer_id: testCustomer.id,
      device_name: 'テストサーバー',
      device_type: 'サーバ',
      hardware_type: '物理'
    };

    const device = await Device.create(deviceData);
    
    // 関連する顧客を取得
    const customer = await device.getCustomer();
    
    expect(customer).toBeTruthy();
    expect(customer.id).toBe(testCustomer.id);
    expect(customer.customer_name).toBe('テスト顧客');
  });

  it('顧客から関連する機器のリストを取得できること', async () => {
    // 複数の機器を作成
    await Device.create({
      customer_id: testCustomer.id,
      device_name: 'サーバA',
      device_type: 'サーバ',
      hardware_type: '物理'
    });
    
    await Device.create({
      customer_id: testCustomer.id,
      device_name: 'サーバB',
      device_type: 'サーバ',
      hardware_type: 'VM'
    });

    // 顧客に関連する機器を取得
    const devices = await testCustomer.getDevices();
    
    expect(devices).toBeTruthy();
    expect(devices.length).toBe(2);
    expect(devices[0].device_name).toBe('サーバA');
    expect(devices[1].device_name).toBe('サーバB');
  });
});