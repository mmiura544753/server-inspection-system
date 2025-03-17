// server/models/Device.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Customer = require('./Customer');

// 機器モデル
const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Customer,
      key: 'id'
    },
    validate: {
      notNull: { msg: '顧客IDは必須です' }
    }
  },
  device_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: '機器名は必須です' },
      len: { args: [1, 100], msg: '機器名は100文字以内で入力してください' }
    }
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: { args: [0, 50], msg: 'モデル名は50文字以内で入力してください' }
    }
  },
  rack_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    validate: {
      // isIntまたはnullの検証
      isValidRackNumber(value) {
        // nullまたはundefinedの場合は検証をスキップ
        if (value === null || value === undefined) {
          return;
        }
        
        // 整数かどうかを検証
        if (!Number.isInteger(value)) {
          throw new Error('ラックNo.は整数で入力してください');
        }
        
        // 正の数かどうかを検証
        if (value < 1) {
          throw new Error('ラックNo.は1以上の値を入力してください');
        }
      }
    }
  },
  unit_position: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: '',
    comment: 'ラックの搭載ユニット位置',
    validate: {
      len: { args: [0, 20], msg: 'ユニット位置は20文字以内で入力してください' }
    }
  },
  device_type: {
    type: DataTypes.ENUM('サーバ', 'UPS', 'ネットワーク機器', 'その他'),
    allowNull: false,
    validate: {
      notEmpty: { msg: '機器種別は必須です' },
      isIn: {
        args: [['サーバ', 'UPS', 'ネットワーク機器', 'その他']],
        msg: '無効な機器種別です'
      }
    }
  },
  hardware_type: {
    type: DataTypes.ENUM('物理', 'VM'),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'ハードウェアタイプは必須です' },
      isIn: {
        args: [['物理', 'VM']],
        msg: '無効なハードウェアタイプです'
      }
    }
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '',
    comment: '設置場所（ロケーション）の自由記述',
    validate: {
      len: { args: [0, 100], msg: '設置場所は100文字以内で入力してください' }
    }
  }
}, {
  tableName: 'devices',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // ユニーク制約を追加
  indexes: [
    {
      unique: true,
      fields: ['customer_id', 'device_name', 'location', 'unit_position'],
      name: 'devices_unique_constraint'
    }
  ]
});

// リレーションシップの定義
Device.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Device, { foreignKey: 'customer_id', as: 'devices' });

module.exports = Device;