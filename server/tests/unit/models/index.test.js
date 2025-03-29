// index.test.js - モデル関連付けのテスト
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let Customer;
let Device;
let InspectionItemName;
let InspectionItem;
let Inspection;
let InspectionResult;

beforeAll(() => {
  // テスト用のインメモリ SQLite データベースを使用
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false // ロギングを無効化
  });

  // モデル定義
  Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

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

  InspectionResult = sequelize.define('InspectionResult', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    inspection_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    device_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inspection_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    check_item: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false
    }
  }, {
    tableName: 'inspection_results',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // リレーションシップの設定
  // Device と Customer
  Device.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  Customer.hasMany(Device, { foreignKey: 'customer_id', as: 'devices' });

  // InspectionItem と Device
  InspectionItem.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });
  Device.hasMany(InspectionItem, { foreignKey: 'device_id', as: 'inspection_items' });

  // InspectionItem と InspectionItemName
  InspectionItem.belongsTo(InspectionItemName, { foreignKey: 'item_name_id', as: 'item_name_master' });
  InspectionItemName.hasMany(InspectionItem, { foreignKey: 'item_name_id', as: 'inspection_items' });

  // InspectionResult と InspectionItem
  InspectionResult.belongsTo(InspectionItem, { foreignKey: 'inspection_item_id', as: 'inspection_item' });
  InspectionItem.hasMany(InspectionResult, { foreignKey: 'inspection_item_id', as: 'results' });

  // InspectionResult と Inspection
  InspectionResult.belongsTo(Inspection, { foreignKey: 'inspection_id', as: 'inspection' });
  Inspection.hasMany(InspectionResult, { foreignKey: 'inspection_id', as: 'results' });

  // InspectionResult と Device
  InspectionResult.belongsTo(Device, { foreignKey: 'device_id', as: 'result_device' });
  Device.hasMany(InspectionResult, { foreignKey: 'device_id', as: 'inspection_results' });

  // テスト用のテーブルを同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後にデータベース接続を閉じる
  return sequelize.close();
});

describe('Model Relationships', () => {
  let testCustomer;
  let testDevice;
  let testItemName;
  let testInspectionItem;
  let testInspection;
  let testInspectionResult;

  beforeEach(async () => {
    // テスト用のデータをクリア
    await InspectionResult.destroy({ truncate: true, cascade: true });
    await InspectionItem.destroy({ truncate: true, cascade: true });
    await Inspection.destroy({ truncate: true, cascade: true });
    await Device.destroy({ truncate: true, cascade: true });
    await InspectionItemName.destroy({ truncate: true, cascade: true });
    await Customer.destroy({ truncate: true, cascade: true });

    // テスト用のデータを作成
    testCustomer = await Customer.create({
      customer_name: 'テスト顧客'
    });

    testDevice = await Device.create({
      device_name: 'テストサーバー',
      customer_id: testCustomer.id,
      rack_number: 'R1',
      unit_start_position: 10,
      unit_end_position: 12,
      model: 'Model-X'
    });

    testItemName = await InspectionItemName.create({
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

    testInspectionResult = await InspectionResult.create({
      inspection_id: testInspection.id,
      device_id: testDevice.id,
      inspection_item_id: testInspectionItem.id,
      check_item: 'CPUの状態確認',
      status: '正常'
    });
  });

  it('Device と Customer の関連付けが正しく機能すること', async () => {
    const deviceWithCustomer = await Device.findByPk(testDevice.id, {
      include: [{ model: Customer, as: 'customer' }]
    });

    expect(deviceWithCustomer.customer).toBeTruthy();
    expect(deviceWithCustomer.customer.id).toBe(testCustomer.id);
    expect(deviceWithCustomer.customer.customer_name).toBe('テスト顧客');
    
    // 逆方向のリレーションシップも確認
    const customerWithDevices = await Customer.findByPk(testCustomer.id, {
      include: [{ model: Device, as: 'devices' }]
    });
    
    expect(customerWithDevices.devices).toBeTruthy();
    expect(customerWithDevices.devices.length).toBe(1);
    expect(customerWithDevices.devices[0].id).toBe(testDevice.id);
    expect(customerWithDevices.devices[0].device_name).toBe('テストサーバー');
  });

  it('InspectionItem と Device の関連付けが正しく機能すること', async () => {
    const itemWithDevice = await InspectionItem.findByPk(testInspectionItem.id, {
      include: [{ model: Device, as: 'device' }]
    });

    expect(itemWithDevice.device).toBeTruthy();
    expect(itemWithDevice.device.id).toBe(testDevice.id);
    expect(itemWithDevice.device.device_name).toBe('テストサーバー');
    
    // 逆方向のリレーションシップも確認
    const deviceWithItems = await Device.findByPk(testDevice.id, {
      include: [{ model: InspectionItem, as: 'inspection_items' }]
    });
    
    expect(deviceWithItems.inspection_items).toBeTruthy();
    expect(deviceWithItems.inspection_items.length).toBe(1);
    expect(deviceWithItems.inspection_items[0].id).toBe(testInspectionItem.id);
  });

  it('InspectionItem と InspectionItemName の関連付けが正しく機能すること', async () => {
    const itemWithItemName = await InspectionItem.findByPk(testInspectionItem.id, {
      include: [{ model: InspectionItemName, as: 'item_name_master' }]
    });

    expect(itemWithItemName.item_name_master).toBeTruthy();
    expect(itemWithItemName.item_name_master.id).toBe(testItemName.id);
    expect(itemWithItemName.item_name_master.name).toBe('CPUの状態確認');
    
    // 逆方向のリレーションシップも確認
    const itemNameWithItems = await InspectionItemName.findByPk(testItemName.id, {
      include: [{ model: InspectionItem, as: 'inspection_items' }]
    });
    
    expect(itemNameWithItems.inspection_items).toBeTruthy();
    expect(itemNameWithItems.inspection_items.length).toBe(1);
    expect(itemNameWithItems.inspection_items[0].id).toBe(testInspectionItem.id);
  });

  it('InspectionResult と Inspection の関連付けが正しく機能すること', async () => {
    const resultWithInspection = await InspectionResult.findByPk(testInspectionResult.id, {
      include: [{ model: Inspection, as: 'inspection' }]
    });

    expect(resultWithInspection.inspection).toBeTruthy();
    expect(resultWithInspection.inspection.id).toBe(testInspection.id);
    expect(resultWithInspection.inspection.inspector_name).toBe('テスト点検者');
    
    // 逆方向のリレーションシップも確認
    const inspectionWithResults = await Inspection.findByPk(testInspection.id, {
      include: [{ model: InspectionResult, as: 'results' }]
    });
    
    expect(inspectionWithResults.results).toBeTruthy();
    expect(inspectionWithResults.results.length).toBe(1);
    expect(inspectionWithResults.results[0].id).toBe(testInspectionResult.id);
    expect(inspectionWithResults.results[0].check_item).toBe('CPUの状態確認');
  });

  it('InspectionResult と Device の関連付けが正しく機能すること', async () => {
    const resultWithDevice = await InspectionResult.findByPk(testInspectionResult.id, {
      include: [{ model: Device, as: 'result_device' }]
    });

    expect(resultWithDevice.result_device).toBeTruthy();
    expect(resultWithDevice.result_device.id).toBe(testDevice.id);
    expect(resultWithDevice.result_device.device_name).toBe('テストサーバー');
    
    // 逆方向のリレーションシップも確認
    const deviceWithResults = await Device.findByPk(testDevice.id, {
      include: [{ model: InspectionResult, as: 'inspection_results' }]
    });
    
    expect(deviceWithResults.inspection_results).toBeTruthy();
    expect(deviceWithResults.inspection_results.length).toBe(1);
    expect(deviceWithResults.inspection_results[0].id).toBe(testInspectionResult.id);
    expect(deviceWithResults.inspection_results[0].check_item).toBe('CPUの状態確認');
  });

  it('InspectionResult と InspectionItem の関連付けが正しく機能すること', async () => {
    const resultWithItem = await InspectionResult.findByPk(testInspectionResult.id, {
      include: [{ model: InspectionItem, as: 'inspection_item' }]
    });

    expect(resultWithItem.inspection_item).toBeTruthy();
    expect(resultWithItem.inspection_item.id).toBe(testInspectionItem.id);
    
    // 逆方向のリレーションシップも確認
    const itemWithResults = await InspectionItem.findByPk(testInspectionItem.id, {
      include: [{ model: InspectionResult, as: 'results' }]
    });
    
    expect(itemWithResults.results).toBeTruthy();
    expect(itemWithResults.results.length).toBe(1);
    expect(itemWithResults.results[0].id).toBe(testInspectionResult.id);
    expect(itemWithResults.results[0].check_item).toBe('CPUの状態確認');
  });

  it('複数階層のリレーションシップが正しく機能すること', async () => {
    // 点検 -> 点検結果 -> 点検項目 -> 点検項目名のリレーションシップを確認
    const inspection = await Inspection.findByPk(testInspection.id, {
      include: [{
        model: InspectionResult,
        as: 'results',
        include: [{
          model: InspectionItem,
          as: 'inspection_item',
          include: [{
            model: InspectionItemName,
            as: 'item_name_master'
          }]
        }]
      }]
    });

    expect(inspection.results).toBeTruthy();
    expect(inspection.results.length).toBe(1);
    expect(inspection.results[0].inspection_item).toBeTruthy();
    expect(inspection.results[0].inspection_item.item_name_master).toBeTruthy();
    expect(inspection.results[0].inspection_item.item_name_master.name).toBe('CPUの状態確認');
    
    // デバイス -> 点検項目 -> 点検結果のリレーションシップを確認
    const device = await Device.findByPk(testDevice.id, {
      include: [{
        model: InspectionItem,
        as: 'inspection_items',
        include: [{
          model: InspectionResult,
          as: 'results'
        }]
      }]
    });
    
    expect(device.inspection_items).toBeTruthy();
    expect(device.inspection_items.length).toBe(1);
    expect(device.inspection_items[0].results).toBeTruthy();
    expect(device.inspection_items[0].results.length).toBe(1);
    expect(device.inspection_items[0].results[0].check_item).toBe('CPUの状態確認');
  });
});