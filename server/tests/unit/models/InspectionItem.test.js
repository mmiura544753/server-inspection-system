// InspectionItem.test.js
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let InspectionItem;
let Device;
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
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rack_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    unit_start_position: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    unit_end_position: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true
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
      allowNull: false,
      validate: {
        notEmpty: { msg: '点検項目名は必須です' },
        len: { args: [1, 255], msg: '点検項目名は255文字以内で入力してください' }
      }
    }
  }, {
    tableName: 'inspection_item_names',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // InspectionItemの定義
  InspectionItem = sequelize.define('InspectionItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
    item_name_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'inspection_item_names',
        key: 'id'
      },
      validate: {
        notNull: { msg: '点検項目名IDは必須です' }
      }
    },
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'inspection_items',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['device_id', 'item_name_id'],
        name: 'device_item_name_unique_constraint'
      }
    ]
  });

  // リレーションシップの設定
  InspectionItem.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });
  Device.hasMany(InspectionItem, { foreignKey: 'device_id', as: 'inspection_items' });
  
  InspectionItem.belongsTo(InspectionItemName, { foreignKey: 'item_name_id', as: 'item_name_master' });
  InspectionItemName.hasMany(InspectionItem, { foreignKey: 'item_name_id', as: 'inspection_items' });

  // テスト用のテーブルを同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後にデータベース接続を閉じる
  return sequelize.close();
});

describe('InspectionItem Model', () => {
  let testDevice;
  let testItemName;

  beforeEach(async () => {
    // テスト用のデータをクリアして再作成
    await InspectionItem.destroy({ truncate: true, cascade: true });
    await Device.destroy({ truncate: true, cascade: true });
    await InspectionItemName.destroy({ truncate: true, cascade: true });

    // テスト用のデバイスと点検項目名を作成
    testDevice = await Device.create({
      device_name: 'テストサーバー',
      customer_id: 1,
      rack_number: 'R1',
      unit_start_position: 10,
      unit_end_position: 12,
      model: 'Model-X'
    });

    testItemName = await InspectionItemName.create({
      name: 'CPUの状態確認'
    });
  });

  it('点検項目を正常に作成できること', async () => {
    const itemData = {
      device_id: testDevice.id,
      item_name_id: testItemName.id
    };

    const item = await InspectionItem.create(itemData);
    
    expect(item).toBeTruthy();
    expect(item.id).toBe(1);
    expect(item.device_id).toBe(testDevice.id);
    expect(item.item_name_id).toBe(testItemName.id);
  });

  it('device_idがnullの場合はバリデーションエラーになること', async () => {
    const itemData = {
      device_id: null,
      item_name_id: testItemName.id
    };
    
    await expect(InspectionItem.create(itemData))
      .rejects.toThrow('機器IDは必須です');
  });

  it('item_name_idがnullの場合はバリデーションエラーになること', async () => {
    const itemData = {
      device_id: testDevice.id,
      item_name_id: null
    };
    
    await expect(InspectionItem.create(itemData))
      .rejects.toThrow('点検項目名IDは必須です');
  });

  it('同じdevice_idとitem_name_idの組み合わせで重複エラーになること', async () => {
    // 1つ目の点検項目を作成
    await InspectionItem.create({
      device_id: testDevice.id,
      item_name_id: testItemName.id
    });
    
    // 同じ組み合わせで2つ目を作成しようとするとエラー
    await expect(InspectionItem.create({
      device_id: testDevice.id,
      item_name_id: testItemName.id
    })).rejects.toThrow();
  });

  it('点検項目を更新できること', async () => {
    // テスト用の点検項目を作成
    const item = await InspectionItem.create({
      device_id: testDevice.id,
      item_name_id: testItemName.id,
      item_name: '古い名前'
    });
    
    // レガシーフィールドを更新
    item.item_name = '新しい名前';
    await item.save();
    
    // 更新後の点検項目を取得
    const updatedItem = await InspectionItem.findByPk(item.id);
    
    expect(updatedItem.item_name).toBe('新しい名前');
  });

  it('点検項目を削除できること', async () => {
    // テスト用の点検項目を作成
    const item = await InspectionItem.create({
      device_id: testDevice.id,
      item_name_id: testItemName.id
    });
    
    // 点検項目を削除
    await item.destroy();
    
    // 削除後に点検項目を検索
    const deletedItem = await InspectionItem.findByPk(item.id);
    
    expect(deletedItem).toBeNull();
  });

  it('デバイスとのリレーションシップが機能すること', async () => {
    // 点検項目を作成
    const item = await InspectionItem.create({
      device_id: testDevice.id,
      item_name_id: testItemName.id
    });
    
    // リレーションシップを含めて取得
    const itemWithDevice = await InspectionItem.findByPk(item.id, {
      include: [{ model: Device, as: 'device' }]
    });
    
    expect(itemWithDevice.device).toBeTruthy();
    expect(itemWithDevice.device.id).toBe(testDevice.id);
    expect(itemWithDevice.device.device_name).toBe('テストサーバー');
  });

  it('点検項目名とのリレーションシップが機能すること', async () => {
    // 点検項目を作成
    const item = await InspectionItem.create({
      device_id: testDevice.id,
      item_name_id: testItemName.id
    });
    
    // リレーションシップを含めて取得
    const itemWithItemName = await InspectionItem.findByPk(item.id, {
      include: [{ model: InspectionItemName, as: 'item_name_master' }]
    });
    
    expect(itemWithItemName.item_name_master).toBeTruthy();
    expect(itemWithItemName.item_name_master.id).toBe(testItemName.id);
    expect(itemWithItemName.item_name_master.name).toBe('CPUの状態確認');
  });
});