// server/models/Inspection.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Device = require('./Device');
const InspectionResult = require('./InspectionResult');

// 点検モデル
const Inspection = sequelize.define('Inspection', {
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
  inspection_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notNull: { msg: '点検日は必須です' }
    }
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
    allowNull: false,
    validate: {
      notEmpty: { msg: '点検者名は必須です' },
      len: { args: [1, 50], msg: '点検者名は50文字以内で入力してください' }
    }
  }
  // statusフィールドはデータベースに存在しないため削除
  // 後で追加する場合は ALTER TABLE inspections ADD COLUMN status ENUM('準備中', '進行中', '完了') NOT NULL DEFAULT '完了' を実行
}, {
  tableName: 'inspections',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// リレーションシップの定義
Inspection.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });
Device.hasMany(Inspection, { foreignKey: 'device_id', as: 'inspections' });

// 点検結果との関連付け
Inspection.hasMany(InspectionResult, { foreignKey: 'inspection_id', as: 'results' });
InspectionResult.belongsTo(Inspection, { foreignKey: 'inspection_id', as: 'inspection' });

module.exports = Inspection;
