// device-test.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// テスト専用のSequelizeインスタンスを作成
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false
});

// 顧客モデルを定義
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: '顧客名は必須です' },
      len: { args: [1, 100], msg: '顧客名は100文字以内で入力してください' }
    }
  }
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// デバイスモデルを定義
const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id',
    },
    validate: {
      notNull: { msg: "顧客IDは必須です" },
    },
  },
  device_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: "機器名は必須です" },
      len: { args: [1, 100], msg: "機器名は100文字以内で入力してください" },
    },
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: { args: [0, 50], msg: "モデル名は50文字以内で入力してください" },
    },
  },
  rack_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    validate: {
      isValidRackNumber(value) {
        if (value === null || value === undefined) {
          return;
        }
        if (!Number.isInteger(value)) {
          throw new Error("ラックNo.は整数で入力してください");
        }
        if (value < 1) {
          throw new Error("ラックNo.は1以上の値を入力してください");
        }
      },
    },
  },
  device_type: {
    type: DataTypes.ENUM("サーバ", "UPS", "ネットワーク機器", "その他"),
    allowNull: false,
    validate: {
      notEmpty: { msg: "機器種別は必須です" },
      isIn: {
        args: [["サーバ", "UPS", "ネットワーク機器", "その他"]],
        msg: "無効な機器種別です",
      },
    },
  },
  hardware_type: {
    type: DataTypes.ENUM("物理", "VM"),
    allowNull: false,
    validate: {
      notEmpty: { msg: "ハードウェアタイプは必須です" },
      isIn: {
        args: [["物理", "VM"]],
        msg: "無効なハードウェアタイプです",
      },
    },
  },
  unit_start_position: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    defaultValue: null,
    validate: {
      isInt: { msg: "ユニット開始位置は整数で入力してください" },
      min: {
        args: [1],
        msg: "ユニット開始位置は1以上の値を入力してください",
      },
      max: {
        args: [99],
        msg: "ユニット開始位置は99以下の値を入力してください",
      },
    },
  },
  unit_end_position: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    defaultValue: null,
    validate: {
      isInt: { msg: "ユニット終了位置は整数で入力してください" },
      min: {
        args: [1],
        msg: "ユニット終了位置は1以上の値を入力してください",
      },
      max: {
        args: [99],
        msg: "ユニット終了位置は99以下の値を入力してください",
      },
    },
  },
}, {
  tableName: 'devices',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// getUnitPositionDisplay メソッドを追加
Device.prototype.getUnitPositionDisplay = function () {
  if (this.unit_start_position === null) return "";
  if (
    this.unit_end_position === null ||
    this.unit_start_position === this.unit_end_position
  ) {
    return `U${this.unit_start_position}`;
  }
  return `U${this.unit_start_position}-U${this.unit_end_position}`;
};

// リレーションシップを設定
Device.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
Customer.hasMany(Device, { foreignKey: "customer_id", as: "devices" });

// モデルとSequelizeインスタンスをエクスポート
module.exports = {
  sequelize,
  Device,
  Customer
};