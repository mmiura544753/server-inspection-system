// InspectionResult.test.js
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let InspectionResult;
let Inspection;
let Device;
let InspectionItem;
let InspectionItemName;

beforeAll(() => {
  // テスト用のインメモリ SQLite データベースを使用
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false // ロギングを無効化
  });

  // 依存モデルの定義
  Device = sequelize.define('Device', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    device_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'devices',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  InspectionItemName = sequelize.define('InspectionItemName', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'inspection_item_names',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  InspectionItem = sequelize.define('InspectionItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    device_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    item_name_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'inspection_items',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Inspection = sequelize.define('Inspection', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    inspection_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    inspector_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '完了'
    }
  }, {
    tableName: 'inspections',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // 点検結果モデルを定義
  InspectionResult = sequelize.define('InspectionResult', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    inspection_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'inspections',
        key: 'id'
      },
      validate: {
        notNull: { msg: '点検IDは必須です' }
      }
    },
    device_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id'
      },
      validate: {
        notNull: { msg: '機器IDは必須です' }
      }
    },
    inspection_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'inspection_items',
        key: 'id'
      }
    },
    check_item: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: '点検項目名は必須です' },
        len: { args: [1, 255], msg: '点検項目名は255文字以内で入力してください' }
      }
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: { msg: '結果ステータスは必須です' },
        isIn: {
          args: [['正常', '異常']],
          msg: '無効な結果ステータスです'
        }
      }
    },
    checked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'inspection_results',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // リレーションシップの設定
  InspectionResult.belongsTo(Inspection, { foreignKey: 'inspection_id', as: 'inspection' });
  Inspection.hasMany(InspectionResult, { foreignKey: 'inspection_id', as: 'results' });

  InspectionResult.belongsTo(Device, { foreignKey: 'device_id', as: 'result_device' });
  Device.hasMany(InspectionResult, { foreignKey: 'device_id', as: 'inspection_results' });

  InspectionResult.belongsTo(InspectionItem, { foreignKey: 'inspection_item_id', as: 'inspection_item' });
  InspectionItem.hasMany(InspectionResult, { foreignKey: 'inspection_item_id', as: 'results' });

  InspectionItem.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });
  InspectionItem.belongsTo(InspectionItemName, { foreignKey: 'item_name_id', as: 'item_name_master' });

  // テスト用のテーブルを同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後にデータベース接続を閉じる
  return sequelize.close();
});

describe('InspectionResult Model', () => {
  let testInspection;
  let testDevice;
  let testInspectionItem;

  beforeEach(async () => {
    // テスト用のデータをクリア
    await InspectionResult.destroy({ truncate: true });
    await Inspection.destroy({ truncate: true });
    await InspectionItem.destroy({ truncate: true });
    await Device.destroy({ truncate: true });
    await InspectionItemName.destroy({ truncate: true });

    // テスト用のデータを作成
    testDevice = await Device.create({
      device_name: 'テストサーバー'
    });

    const testItemName = await InspectionItemName.create({
      name: 'CPUの状態確認'
    });

    testInspectionItem = await InspectionItem.create({
      device_id: testDevice.id,
      item_name_id: testItemName.id
    });

    testInspection = await Inspection.create({
      inspection_date: '2025-03-15',
      inspector_name: 'テスト点検者',
      status: '完了'
    });
  });

  it('点検結果を正常に作成できること', async () => {
    const resultData = {
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '正常',
      checked_at: new Date()
    };

    const result = await InspectionResult.create(resultData);
    
    expect(result).toBeTruthy();
    expect(result.id).toBe(1);
    expect(result.inspection_id).toBe(testInspection.id);
    expect(result.device_id).toBe(testDevice.id);
    expect(result.inspection_item_id).toBe(testInspectionItem.id);
    expect(result.check_item).toBe('CPUの状態確認');
    expect(result.status).toBe('正常');
  });

  it('inspection_idがnullの場合はバリデーションエラーになること', async () => {
    const resultData = {
      inspection_id: null,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '正常'
    };
    
    await expect(InspectionResult.create(resultData))
      .rejects.toThrow('点検IDは必須です');
  });

  it('device_idがnullの場合はバリデーションエラーになること', async () => {
    const resultData = {
      inspection_id: testInspection.id,
      device_id: null,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '正常'
    };
    
    await expect(InspectionResult.create(resultData))
      .rejects.toThrow('機器IDは必須です');
  });

  it('check_itemが空文字の場合はバリデーションエラーになること', async () => {
    const resultData = {
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: '',
      status: '正常'
    };
    
    await expect(InspectionResult.create(resultData))
      .rejects.toThrow('Validation error: 点検項目名は必須です');
  });

  it('check_itemが256文字以上の場合はバリデーションエラーになること', async () => {
    const longCheckItem = 'あ'.repeat(256);
    const resultData = {
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: longCheckItem,
      status: '正常'
    };
    
    await expect(InspectionResult.create(resultData))
      .rejects.toThrow('Validation error: 点検項目名は255文字以内で入力してください');
  });

  it('statusが無効な値の場合はバリデーションエラーになること', async () => {
    const resultData = {
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '不明'
    };
    
    await expect(InspectionResult.create(resultData))
      .rejects.toThrow('Validation error: 無効な結果ステータスです');
  });

  it('点検結果を更新できること', async () => {
    // テスト用の点検結果を作成
    const result = await InspectionResult.create({
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '正常',
      checked_at: new Date()
    });
    
    // ステータスを更新
    result.status = '異常';
    await result.save();
    
    // 更新後の点検結果を取得
    const updatedResult = await InspectionResult.findByPk(result.id);
    
    expect(updatedResult.status).toBe('異常');
  });

  it('点検結果を削除できること', async () => {
    // テスト用の点検結果を作成
    const result = await InspectionResult.create({
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '正常',
      checked_at: new Date()
    });
    
    // 点検結果を削除
    await result.destroy();
    
    // 削除後に点検結果を検索
    const deletedResult = await InspectionResult.findByPk(result.id);
    
    expect(deletedResult).toBeNull();
  });

  it('点検とのリレーションシップが機能すること', async () => {
    // 点検結果を作成
    const result = await InspectionResult.create({
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '正常',
      checked_at: new Date()
    });
    
    // リレーションシップを含めて取得
    const resultWithInspection = await InspectionResult.findByPk(result.id, {
      include: [{ model: Inspection, as: 'inspection' }]
    });
    
    expect(resultWithInspection.inspection).toBeTruthy();
    expect(resultWithInspection.inspection.id).toBe(testInspection.id);
    expect(resultWithInspection.inspection.inspector_name).toBe('テスト点検者');
  });

  it('機器とのリレーションシップが機能すること', async () => {
    // 点検結果を作成
    const result = await InspectionResult.create({
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '正常',
      checked_at: new Date()
    });
    
    // リレーションシップを含めて取得
    const resultWithDevice = await InspectionResult.findByPk(result.id, {
      include: [{ model: Device, as: 'result_device' }]
    });
    
    expect(resultWithDevice.result_device).toBeTruthy();
    expect(resultWithDevice.result_device.id).toBe(testDevice.id);
    expect(resultWithDevice.result_device.device_name).toBe('テストサーバー');
  });

  it('点検項目とのリレーションシップが機能すること', async () => {
    // 点検結果を作成
    const result = await InspectionResult.create({
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '正常',
      checked_at: new Date()
    });
    
    // リレーションシップを含めて取得
    const resultWithItem = await InspectionResult.findByPk(result.id, {
      include: [{ model: InspectionItem, as: 'inspection_item' }]
    });
    
    expect(resultWithItem.inspection_item).toBeTruthy();
    expect(resultWithItem.inspection_item.id).toBe(testInspectionItem.id);
  });
});