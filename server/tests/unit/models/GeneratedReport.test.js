// GeneratedReport.test.js
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let Customer;
let ReportTemplate;
let GeneratedReport;

beforeAll(() => {
  // テスト用のインメモリ SQLite データベースを使用
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false // ロギングを無効化
  });

  // テスト用の Customer モデル定義
  Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // テスト用の ReportTemplate モデル定義
  ReportTemplate = sequelize.define('ReportTemplate', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('monthly', 'daily'),
      allowNull: false
    },
    template_path: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'report_templates',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // テスト用の GeneratedReport モデル定義
  GeneratedReport = sequelize.define('GeneratedReport', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
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
      type: DataTypes.ENUM('draft', 'completed'),
      defaultValue: 'draft',
      allowNull: false,
      validate: {
        isIn: {
          args: [['draft', 'completed']],
          msg: '無効なステータスです'
        }
      }
    },
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'report_templates',
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

  // テスト用のテーブルを同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後にデータベース接続を閉じる
  return sequelize.close();
});

describe('GeneratedReport Model', () => {
  let customer;
  let template;

  beforeEach(async () => {
    // テスト用のデータをセットアップ
    await GeneratedReport.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await ReportTemplate.destroy({ where: {} });

    // テスト用の顧客を作成
    customer = await Customer.create({ customer_name: 'テスト顧客' });

    // テスト用のテンプレートを作成
    template = await ReportTemplate.create({ 
      name: 'テスト月次レポート', 
      type: 'monthly', 
      template_path: '/templates/monthly_report.handlebars' 
    });
  });

  it('生成レポートを正常に作成できること', async () => {
    const reportData = { 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      file_path: '/reports/customer1_2025_03.pdf',
      status: 'draft',
      template_id: template.id,
      created_by: 1
    };
    const report = await GeneratedReport.create(reportData);
    
    expect(report).toBeTruthy();
    expect(report.id).toBe(1);
    expect(report.customer_id).toBe(customer.id);
    expect(report.template_id).toBe(template.id);
    expect(report.report_type).toBe('monthly');
    expect(report.status).toBe('draft');
    expect(new Date(report.report_date).toISOString().split('T')[0]).toBe('2025-03-01');
    expect(report.report_period).toBe('2025年03月');
  });

  it('顧客IDがnullの場合はバリデーションエラーになること', async () => {
    const reportData = { 
      customer_id: null,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    };
    
    await expect(GeneratedReport.create(reportData))
      .rejects.toThrow('notNull Violation: 顧客IDは必須です');
  });

  it('レポート日付がnullの場合はバリデーションエラーになること', async () => {
    const reportData = { 
      customer_id: customer.id,
      report_date: null,
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    };
    
    await expect(GeneratedReport.create(reportData))
      .rejects.toThrow();
  });

  it('無効な日付の場合はバリデーションエラーになること', async () => {
    const reportData = { 
      customer_id: customer.id,
      report_date: 'invalid-date',
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    };
    
    await expect(GeneratedReport.create(reportData))
      .rejects.toThrow();
  });

  it('レポート期間が空の場合はバリデーションエラーになること', async () => {
    const reportData = { 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    };
    
    await expect(GeneratedReport.create(reportData))
      .rejects.toThrow('Validation error: レポート期間は必須です');
  });

  it('無効なレポートタイプの場合はバリデーションエラーになること', async () => {
    const reportData = { 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'invalid',
      status: 'draft',
      template_id: template.id
    };
    
    await expect(GeneratedReport.create(reportData))
      .rejects.toThrow();
  });

  it('無効なステータスの場合はバリデーションエラーになること', async () => {
    const reportData = { 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'invalid',
      template_id: template.id
    };
    
    await expect(GeneratedReport.create(reportData))
      .rejects.toThrow();
  });

  it('テンプレートIDがnullの場合はバリデーションエラーになること', async () => {
    const reportData = { 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: null
    };
    
    await expect(GeneratedReport.create(reportData))
      .rejects.toThrow('notNull Violation: テンプレートIDは必須です');
  });

  it('file_pathはnullでも許容されること', async () => {
    const reportData = { 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      file_path: null,
      status: 'draft',
      template_id: template.id
    };
    
    const report = await GeneratedReport.create(reportData);
    expect(report).toBeTruthy();
    expect(report.file_path).toBeNull();
  });

  it('created_byはnullでも許容されること', async () => {
    const reportData = { 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id,
      created_by: null
    };
    
    const report = await GeneratedReport.create(reportData);
    expect(report).toBeTruthy();
    expect(report.created_by).toBeNull();
  });

  it('生成レポートを更新できること', async () => {
    // テスト用のレポートを作成
    const report = await GeneratedReport.create({ 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    });
    
    // レポート情報を更新
    report.status = 'completed';
    report.file_path = '/reports/customer1_2025_03_final.pdf';
    await report.save();
    
    // 更新後のレポートを取得
    const updatedReport = await GeneratedReport.findByPk(report.id);
    
    expect(updatedReport.status).toBe('completed');
    expect(updatedReport.file_path).toBe('/reports/customer1_2025_03_final.pdf');
  });

  it('生成レポートを削除できること', async () => {
    // テスト用のレポートを作成
    const report = await GeneratedReport.create({ 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    });
    
    // レポートを削除
    await report.destroy();
    
    // 削除後にレポートを検索
    const deletedReport = await GeneratedReport.findByPk(report.id);
    
    expect(deletedReport).toBeNull();
  });

  it('顧客IDでレポートをフィルタリングできること', async () => {
    // 2人目の顧客を作成
    const customer2 = await Customer.create({ customer_name: '顧客B' });
    
    // 複数のレポートを作成
    await GeneratedReport.create({ 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    });
    await GeneratedReport.create({ 
      customer_id: customer.id,
      report_date: new Date('2025-04-01'),
      report_period: '2025年04月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    });
    await GeneratedReport.create({ 
      customer_id: customer2.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    });
    
    // 顧客IDでフィルタリング
    const customer1Reports = await GeneratedReport.findAll({
      where: { customer_id: customer.id }
    });
    
    const customer2Reports = await GeneratedReport.findAll({
      where: { customer_id: customer2.id }
    });
    
    expect(customer1Reports.length).toBe(2);
    expect(customer2Reports.length).toBe(1);
  });

  it('レポートタイプでレポートをフィルタリングできること', async () => {
    // 日次レポート用のテンプレートを作成
    const dailyTemplate = await ReportTemplate.create({ 
      name: 'テスト日次レポート', 
      type: 'daily', 
      template_path: '/templates/daily_report.handlebars' 
    });
    
    // 複数のレポートを作成
    await GeneratedReport.create({ 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    });
    await GeneratedReport.create({ 
      customer_id: customer.id,
      report_date: new Date('2025-03-15'),
      report_period: '2025年03月15日',
      report_type: 'daily',
      status: 'draft',
      template_id: dailyTemplate.id
    });
    await GeneratedReport.create({ 
      customer_id: customer.id,
      report_date: new Date('2025-03-16'),
      report_period: '2025年03月16日',
      report_type: 'daily',
      status: 'draft',
      template_id: dailyTemplate.id
    });
    
    // レポートタイプでフィルタリング
    const monthlyReports = await GeneratedReport.findAll({
      where: { report_type: 'monthly' }
    });
    
    const dailyReports = await GeneratedReport.findAll({
      where: { report_type: 'daily' }
    });
    
    expect(monthlyReports.length).toBe(1);
    expect(dailyReports.length).toBe(2);
  });

  it('関連するCustomerとReportTemplateを含めてレポートを取得できること', async () => {
    // レポートを作成
    await GeneratedReport.create({ 
      customer_id: customer.id,
      report_date: new Date('2025-03-01'),
      report_period: '2025年03月',
      report_type: 'monthly',
      status: 'draft',
      template_id: template.id
    });
    
    // リレーションを含めて取得
    const report = await GeneratedReport.findOne({
      include: [
        { model: Customer, as: 'customer' },
        { model: ReportTemplate, as: 'template' }
      ]
    });
    
    expect(report).toBeTruthy();
    expect(report.customer).toBeTruthy();
    expect(report.template).toBeTruthy();
    expect(report.customer.customer_name).toBe('テスト顧客');
    expect(report.template.name).toBe('テスト月次レポート');
  });
});