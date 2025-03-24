// server/models/ReportTemplate.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// レポートテンプレートモデル
const ReportTemplate = sequelize.define('ReportTemplate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'テンプレート名は必須です' },
      len: { args: [1, 100], msg: 'テンプレート名は100文字以内で入力してください' }
    }
  },
  type: {
    type: DataTypes.ENUM('monthly', 'daily'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['monthly', 'daily']],
        msg: '無効なレポートタイプです'
      }
    }
  },
  template_path: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'テンプレートパスは必須です' }
    }
  }
}, {
  tableName: 'report_templates',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ReportTemplate;