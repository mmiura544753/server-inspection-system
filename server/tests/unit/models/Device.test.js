// Device.test.js
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let Device;
let Customer;

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
        notNull: { msg: "顧客IDは必須です" },
      },
    },
    device_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "機器名は必須です" },
        len: { args: [1, 100], msg: "機器名は100文字以内で入力してください" },
      },
    },
    model: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: { args: [0, 50], msg: "モデル名は50文字以内で入力してください" },
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
            throw new Error("ラックNo.は整数で入力してください");
          }
          if (value < 1) {
            throw new Error("ラックNo.は1以上の値を入力してください");
          }
        },
      },
    },
    device_type: {
      type: DataTypes.ENUM("サーバ", "UPS", "ネットワーク機器", "その他"),
      allowNull: false,
      validate: {
        notEmpty: { msg: "機器種別は必須です" },
        isIn: {
          args: [["サーバ", "UPS", "ネットワーク機器", "その他"]],
          msg: "無効な機器種別です",
        },
      },
    },
    hardware_type: {
      type: DataTypes.ENUM("物理", "VM"),
      allowNull: false,
      validate: {
        notEmpty: { msg: "ハードウェアタイプは必須です" },
        isIn: {
          args: [["物理", "VM"]],
          msg: "無効なハードウェアタイプです",
        },
      },
    },
    unit_start_position: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: null,
      validate: {
        isInt: { msg: "ユニット開始位置は整数で入力してください" },
        min: {
          args: [1],
          msg: "ユニット開始位置は1以上の値を入力してください",
        },
        max: {
          args: [99],
          msg: "ユニット開始位置は99以下の値を入力してください",
        },
      },
    },
    unit_end_position: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: null,
      validate: {
        isInt: { msg: "ユニット終了位置は整数で入力してください" },
        min: {
          args: [1],
          msg: "ユニット終了位置は1以上の値を入力してください",
        },
        max: {
          args: [99],
          msg: "ユニット終了位置は99以下の値を入力してください",
        },
      },
    },
  }, {
    tableName: 'devices',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // リレーションシップの定義
  Device.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
  Customer.hasMany(Device, { foreignKey: "customer_id", as: "devices" });

  // getUnitPositionDisplay メソッドの追加
  Device.prototype.getUnitPositionDisplay = function () {
    if (this.unit_start_position === null) return "";
    if (
      this.unit_end_position === null ||
      this.unit_start_position === this.unit_end_position
    ) {
      return `U${this.unit_start_position}`;
    }
    return `U${this.unit_start_position}-U${this.unit_end_position}`;
  };

  // テスト用のテーブルを同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後にデータベース接続を閉じる
  return sequelize.close();
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