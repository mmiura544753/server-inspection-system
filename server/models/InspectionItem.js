// server/models/InspectionItem.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Device = require('./Device');
const InspectionItemName = require('./InspectionItemName');

// 点検項目モデル
const InspectionItem = sequelize.define('InspectionItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Device,
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
      model: InspectionItemName,
      key: 'id'
    },
    validate: {
      notNull: { msg: '点検項目名IDは必須です' }
    }
  }
}, {
  tableName: 'inspection_items',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // ユニーク制約を追加
  indexes: [
    {
      unique: true,
      fields: ['device_id', 'item_name_id'],
      name: 'device_item_name_unique_constraint'
    }
  ]
});

// リレーションシップの定義
InspectionItem.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });
Device.hasMany(InspectionItem, { foreignKey: 'device_id', as: 'inspection_items' });

InspectionItem.belongsTo(InspectionItemName, { foreignKey: 'item_name_id', as: 'item_name_master' });
InspectionItemName.hasMany(InspectionItem, { foreignKey: 'item_name_id', as: 'inspection_items' });

module.exports = InspectionItem;