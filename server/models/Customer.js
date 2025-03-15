// server/models/Customer.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// 顧客モデル
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
  // テーブル名をcustomersに指定
  tableName: 'customers',
  // created_atとupdated_atカラムを自動生成
  timestamps: true,
  // カラム名をスネークケースに変換
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Customer;
