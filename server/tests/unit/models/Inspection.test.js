// Inspection.test.js
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let Inspection;

beforeAll(() => {
  // テスト用のインメモリ SQLite データベースを使用
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false // ロギングを無効化
  });

  // Inspectionモデルの定義
  Inspection = sequelize.define('Inspection', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
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
    status: {
      type: DataTypes.STRING(10),
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

  // テスト用のテーブルを同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後にデータベース接続を閉じる
  return sequelize.close();
});

describe('Inspection Model', () => {
  beforeEach(async () => {
    // テスト用のデータをクリア
    await Inspection.destroy({ truncate: true });
  });

  it('点検を正常に作成できること', async () => {
    const inspectionData = {
      inspection_date: '2025-03-15',
      inspector_name: 'テスト点検者',
      status: '完了'
    };

    const inspection = await Inspection.create(inspectionData);
    
    expect(inspection).toBeTruthy();
    expect(inspection.id).toBe(1);
    expect(inspection.inspection_date).toBe('2025-03-15');
    expect(inspection.inspector_name).toBe('テスト点検者');
    expect(inspection.status).toBe('完了');
  });

  it('inspection_dateがnullの場合はバリデーションエラーになること', async () => {
    const inspectionData = {
      inspection_date: null,
      inspector_name: 'テスト点検者',
      status: '完了'
    };
    
    await expect(Inspection.create(inspectionData))
      .rejects.toThrow('点検日は必須です');
  });

  it('inspector_nameがnullの場合はバリデーションエラーになること', async () => {
    const inspectionData = {
      inspection_date: '2025-03-15',
      inspector_name: null,
      status: '完了'
    };
    
    await expect(Inspection.create(inspectionData))
      .rejects.toThrow();
  });

  it('inspector_nameが空文字の場合はバリデーションエラーになること', async () => {
    const inspectionData = {
      inspection_date: '2025-03-15',
      inspector_name: '',
      status: '完了'
    };
    
    await expect(Inspection.create(inspectionData))
      .rejects.toThrow('Validation error: 点検者名は必須です');
  });

  it('inspector_nameが51文字以上の場合はバリデーションエラーになること', async () => {
    const longName = 'あ'.repeat(51);
    const inspectionData = {
      inspection_date: '2025-03-15',
      inspector_name: longName,
      status: '完了'
    };
    
    await expect(Inspection.create(inspectionData))
      .rejects.toThrow('Validation error: 点検者名は50文字以内で入力してください');
  });

  it('statusが無効な値の場合はバリデーションエラーになること', async () => {
    const inspectionData = {
      inspection_date: '2025-03-15',
      inspector_name: 'テスト点検者',
      status: '不明'
    };
    
    await expect(Inspection.create(inspectionData))
      .rejects.toThrow('Validation error: 無効な点検ステータスです');
  });

  it('statusを指定しない場合はデフォルト値が設定されること', async () => {
    const inspectionData = {
      inspection_date: '2025-03-15',
      inspector_name: 'テスト点検者'
    };

    const inspection = await Inspection.create(inspectionData);
    
    expect(inspection.status).toBe('完了');
  });

  it('start_timeとend_timeがnullでも作成できること', async () => {
    const inspectionData = {
      inspection_date: '2025-03-15',
      inspector_name: 'テスト点検者',
      start_time: null,
      end_time: null,
      status: '完了'
    };

    const inspection = await Inspection.create(inspectionData);
    
    expect(inspection).toBeTruthy();
    expect(inspection.start_time).toBeNull();
    expect(inspection.end_time).toBeNull();
  });

  it('点検を更新できること', async () => {
    // テスト用の点検を作成
    const inspection = await Inspection.create({
      inspection_date: '2025-03-15',
      inspector_name: '更新前担当者',
      status: '準備中'
    });
    
    // 点検情報を更新
    inspection.inspector_name = '更新後担当者';
    inspection.status = '完了';
    await inspection.save();
    
    // 更新後の点検を取得
    const updatedInspection = await Inspection.findByPk(inspection.id);
    
    expect(updatedInspection.inspector_name).toBe('更新後担当者');
    expect(updatedInspection.status).toBe('完了');
  });

  it('点検を削除できること', async () => {
    // テスト用の点検を作成
    const inspection = await Inspection.create({
      inspection_date: '2025-03-15',
      inspector_name: '削除用点検者',
      status: '完了'
    });
    
    // 点検を削除
    await inspection.destroy();
    
    // 削除後に点検を検索
    const deletedInspection = await Inspection.findByPk(inspection.id);
    
    expect(deletedInspection).toBeNull();
  });

  it('日付範囲で点検を検索できること', async () => {
    // 複数の点検を作成
    await Inspection.create({
      inspection_date: '2025-03-01',
      inspector_name: '点検者A',
      status: '完了'
    });
    
    await Inspection.create({
      inspection_date: '2025-03-15',
      inspector_name: '点検者B',
      status: '完了'
    });
    
    await Inspection.create({
      inspection_date: '2025-03-30',
      inspector_name: '点検者C',
      status: '完了'
    });
    
    // 日付範囲で検索
    const inspections = await Inspection.findAll({
      where: {
        inspection_date: {
          [Sequelize.Op.between]: ['2025-03-10', '2025-03-20']
        }
      }
    });
    
    expect(inspections.length).toBe(1);
    expect(inspections[0].inspection_date).toBe('2025-03-15');
    expect(inspections[0].inspector_name).toBe('点検者B');
  });

  it('ステータスで点検を検索できること', async () => {
    // 複数の点検を作成
    await Inspection.create({
      inspection_date: '2025-03-01',
      inspector_name: '点検者A',
      status: '準備中'
    });
    
    await Inspection.create({
      inspection_date: '2025-03-15',
      inspector_name: '点検者B',
      status: '進行中'
    });
    
    await Inspection.create({
      inspection_date: '2025-03-30',
      inspector_name: '点検者C',
      status: '完了'
    });
    
    // ステータスで検索
    const inspections = await Inspection.findAll({
      where: {
        status: '進行中'
      }
    });
    
    expect(inspections.length).toBe(1);
    expect(inspections[0].inspection_date).toBe('2025-03-15');
    expect(inspections[0].inspector_name).toBe('点検者B');
  });
});