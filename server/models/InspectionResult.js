// server/models/InspectionResult.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const InspectionItem = require('./InspectionItem');

// 点検結果モデル
const InspectionResult = sequelize.define('InspectionResult', {
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
  inspection_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: InspectionItem,
      key: 'id'
    },
    validate: {
      notNull: { msg: '点検項目IDは必須です' }
    }
  },
  status: {
    type: DataTypes.ENUM('正常', '異常'),
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

// リレーションシップの定義
InspectionResult.belongsTo(InspectionItem, { foreignKey: 'inspection_item_id', as: 'inspection_item' });

module.exports = InspectionResult;
