// server/models/GeneratedReport.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Customer = require('./Customer');
const ReportTemplate = require('./ReportTemplate');

// 生成されたレポートモデル
const GeneratedReport = sequelize.define('GeneratedReport', {
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
  report_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: '有効な日付を入力してください' }
    }
  },
  report_period: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'レポート期間は必須です' }
    }
  },
  report_type: {
    type: DataTypes.ENUM('monthly', 'daily'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['monthly', 'daily']],
        msg: '無効なレポートタイプです'
      }
    }
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'processing', 'completed', 'failed'),
    defaultValue: 'draft',
    allowNull: false,
    validate: {
      isIn: {
        args: [['draft', 'processing', 'completed', 'failed']],
        msg: '無効なステータスです'
      }
    }
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ReportTemplate,
      key: 'id'
    },
    validate: {
      notNull: { msg: 'テンプレートIDは必須です' }
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'generated_reports',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// リレーションシップの定義
GeneratedReport.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
GeneratedReport.belongsTo(ReportTemplate, { foreignKey: 'template_id', as: 'template' });

module.exports = GeneratedReport;