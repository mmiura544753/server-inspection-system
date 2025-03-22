// server/models/InspectionResult.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

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
  // 点検項目IDへの参照
  inspection_item_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'inspection_items',
      key: 'id'
    }
  },
  // 点検時点の項目名を直接保存
  check_item: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: '点検項目名は必須です' },
      len: { args: [1, 255], msg: '点検項目名は255文字以内で入力してください' }
    }
  },
  // 点検結果を直接保存
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

// リレーションシップの定義は index.js で行います
// 循環参照を避けるため、ここではInspectionItemをrequireしません

module.exports = InspectionResult;