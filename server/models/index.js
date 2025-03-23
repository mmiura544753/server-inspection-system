// server/models/index.js
const Customer = require('./Customer');
const Device = require('./Device');
const InspectionItemName = require('./InspectionItemName');
const InspectionItem = require('./InspectionItem');
const Inspection = require('./Inspection');
const InspectionResult = require('./InspectionResult');

// リレーションシップの定義
// Device と Customer のリレーションシップは Device.js で既に定義されているので、ここではスキップ

// InspectionItem と Device
InspectionItem.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });
Device.hasMany(InspectionItem, { foreignKey: 'device_id', as: 'inspection_items' });

// InspectionItem と InspectionItemName
InspectionItem.belongsTo(InspectionItemName, { foreignKey: 'item_name_id', as: 'item_name_master' });
InspectionItemName.hasMany(InspectionItem, { foreignKey: 'item_name_id', as: 'inspection_items' });

// Inspection と Device の関連付けは行わない
// 点検と機器の関連は inspection_results テーブルを通じて行う

// InspectionResult と InspectionItem
InspectionResult.belongsTo(InspectionItem, { foreignKey: 'inspection_item_id', as: 'inspection_item' });
InspectionItem.hasMany(InspectionResult, { foreignKey: 'inspection_item_id', as: 'results' });

// InspectionResult と Inspection
InspectionResult.belongsTo(Inspection, { foreignKey: 'inspection_id', as: 'inspection' });
Inspection.hasMany(InspectionResult, { foreignKey: 'inspection_id', as: 'results' });

// InspectionResult と Device - エイリアス名を変更
InspectionResult.belongsTo(Device, { foreignKey: 'device_id', as: 'result_device' });
Device.hasMany(InspectionResult, { foreignKey: 'device_id', as: 'inspection_results' });

// すべてのモデルをエクスポート
module.exports = {
  Customer,
  Device,
  InspectionItemName,
  InspectionItem,
  Inspection,
  InspectionResult
};