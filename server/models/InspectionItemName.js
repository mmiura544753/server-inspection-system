// server/models/InspectionItemName.js
<<<<<<< HEAD
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// 点検項目名マスタモデル
const InspectionItemName = sequelize.define('InspectionItemName', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
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
=======
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// 点検項目名マスタモデル
const InspectionItemName = sequelize.define(
  "InspectionItemName",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "点検項目名は必須です" },
        len: {
          args: [1, 255],
          msg: "点検項目名は255文字以内で入力してください",
        },
      },
    },
  },
  {
    tableName: "inspection_item_names",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
>>>>>>> bdc93a9f1ee51b732c8d8dd1ada738d03390718b

module.exports = InspectionItemName;