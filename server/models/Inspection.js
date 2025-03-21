// server/models/Inspection.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Device = require('./Device');

// 点検モデル
const Inspection = sequelize.define('Inspection', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Device,
      key: 'id'
    }
  },
  // server_idカラムは削除されました
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
  },
  // status フィールドを再追加（データベースに追加されたため）
  status: {
    type: DataTypes.ENUM('準備中', '進行中', '完了'),
    allowNull: false,
    defaultValue: '完了',
    validate: {
      isIn: {
        args: [['準備中', '進行中', '完了']],
        msg: '無効な点検ステータスです'
      }
    }
  }
}, {
  tableName: 'inspections',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// リレーションシップはindex.jsで一元管理します
// 循環参照を避けるため、InspectionResultの直接参照を削除

module.exports = Inspection;