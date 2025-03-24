// ReportTemplate.test.js
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let ReportTemplate;

beforeAll(() => {
  // テスト用のインメモリ SQLite データベースを使用
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false // ロギングを無効化
  });

  // モデル定義を再作成
  ReportTemplate = sequelize.define('ReportTemplate', {
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

  // テスト用のテーブルを同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後にデータベース接続を閉じる
  return sequelize.close();
});

describe('ReportTemplate Model', () => {
  it('レポートテンプレートを正常に作成できること', async () => {
    const templateData = { 
      name: 'テスト月次レポート', 
      type: 'monthly', 
      template_path: '/templates/monthly_report.handlebars' 
    };
    const template = await ReportTemplate.create(templateData);
    
    expect(template).toBeTruthy();
    expect(template.id).toBe(1);
    expect(template.name).toBe('テスト月次レポート');
    expect(template.type).toBe('monthly');
    expect(template.template_path).toBe('/templates/monthly_report.handlebars');
  });

  it('テンプレート名が null の場合はバリデーションエラーになること', async () => {
    const templateData = { 
      name: null, 
      type: 'daily', 
      template_path: '/templates/daily_report.handlebars' 
    };
    
    await expect(ReportTemplate.create(templateData))
      .rejects.toThrow();
  });

  it('テンプレート名が空文字の場合はバリデーションエラーになること', async () => {
    const templateData = { 
      name: '', 
      type: 'daily', 
      template_path: '/templates/daily_report.handlebars' 
    };
    
    await expect(ReportTemplate.create(templateData))
      .rejects.toThrow('Validation error: テンプレート名は必須です');
  });

  it('テンプレート名が101文字以上の場合はバリデーションエラーになること', async () => {
    const longName = 'あ'.repeat(101);
    const templateData = { 
      name: longName, 
      type: 'daily', 
      template_path: '/templates/daily_report.handlebars' 
    };
    
    await expect(ReportTemplate.create(templateData))
      .rejects.toThrow('Validation error: テンプレート名は100文字以内で入力してください');
  });

  it('不正なタイプの場合はバリデーションエラーになること', async () => {
    const templateData = { 
      name: 'テストレポート', 
      type: 'invalid', 
      template_path: '/templates/test_report.handlebars' 
    };
    
    await expect(ReportTemplate.create(templateData))
      .rejects.toThrow();
  });

  it('テンプレートパスが null の場合はバリデーションエラーになること', async () => {
    const templateData = { 
      name: 'テストレポート', 
      type: 'daily', 
      template_path: null 
    };
    
    await expect(ReportTemplate.create(templateData))
      .rejects.toThrow();
  });

  it('テンプレートパスが空の場合はバリデーションエラーになること', async () => {
    const templateData = { 
      name: 'テストレポート', 
      type: 'daily', 
      template_path: '' 
    };
    
    await expect(ReportTemplate.create(templateData))
      .rejects.toThrow('Validation error: テンプレートパスは必須です');
  });

  it('レポートテンプレートを更新できること', async () => {
    // テスト用のテンプレートを作成
    const template = await ReportTemplate.create({ 
      name: '更新前テンプレート', 
      type: 'daily', 
      template_path: '/templates/old.handlebars' 
    });
    
    // テンプレート情報を更新
    template.name = '更新後テンプレート';
    template.template_path = '/templates/new.handlebars';
    await template.save();
    
    // 更新後のテンプレートを取得
    const updatedTemplate = await ReportTemplate.findByPk(template.id);
    
    expect(updatedTemplate.name).toBe('更新後テンプレート');
    expect(updatedTemplate.template_path).toBe('/templates/new.handlebars');
  });

  it('レポートテンプレートを削除できること', async () => {
    // テスト用のテンプレートを作成
    const template = await ReportTemplate.create({ 
      name: '削除用テンプレート', 
      type: 'monthly', 
      template_path: '/templates/delete.handlebars' 
    });
    
    // テンプレートを削除
    await template.destroy();
    
    // 削除後にテンプレートを検索
    const deletedTemplate = await ReportTemplate.findByPk(template.id);
    
    expect(deletedTemplate).toBeNull();
  });

  it('すべてのレポートテンプレートを取得できること', async () => {
    // テスト用のテーブルをクリア
    await ReportTemplate.destroy({ truncate: true });
    
    // 複数のテンプレートを作成
    await ReportTemplate.create({ 
      name: '日次レポートA', 
      type: 'daily', 
      template_path: '/templates/daily_a.handlebars' 
    });
    await ReportTemplate.create({ 
      name: '日次レポートB', 
      type: 'daily', 
      template_path: '/templates/daily_b.handlebars' 
    });
    await ReportTemplate.create({ 
      name: '月次レポート', 
      type: 'monthly', 
      template_path: '/templates/monthly.handlebars' 
    });
    
    // すべてのテンプレートを取得
    const templates = await ReportTemplate.findAll();
    
    expect(templates.length).toBe(3);
    expect(templates[0].name).toBe('日次レポートA');
    expect(templates[1].name).toBe('日次レポートB');
    expect(templates[2].name).toBe('月次レポート');
  });

  it('タイプでレポートテンプレートをフィルタリングできること', async () => {
    // テスト用のテーブルをクリア
    await ReportTemplate.destroy({ truncate: true });
    
    // 複数のテンプレートを作成
    await ReportTemplate.create({ 
      name: '日次レポートA', 
      type: 'daily', 
      template_path: '/templates/daily_a.handlebars' 
    });
    await ReportTemplate.create({ 
      name: '日次レポートB', 
      type: 'daily', 
      template_path: '/templates/daily_b.handlebars' 
    });
    await ReportTemplate.create({ 
      name: '月次レポートA', 
      type: 'monthly', 
      template_path: '/templates/monthly_a.handlebars' 
    });
    await ReportTemplate.create({ 
      name: '月次レポートB', 
      type: 'monthly', 
      template_path: '/templates/monthly_b.handlebars' 
    });
    
    // タイプでフィルタリング
    const dailyTemplates = await ReportTemplate.findAll({
      where: { type: 'daily' }
    });
    
    const monthlyTemplates = await ReportTemplate.findAll({
      where: { type: 'monthly' }
    });
    
    expect(dailyTemplates.length).toBe(2);
    expect(monthlyTemplates.length).toBe(2);
    expect(dailyTemplates[0].type).toBe('daily');
    expect(dailyTemplates[1].type).toBe('daily');
    expect(monthlyTemplates[0].type).toBe('monthly');
    expect(monthlyTemplates[1].type).toBe('monthly');
  });
});