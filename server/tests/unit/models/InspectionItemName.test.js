// InspectionItemName.test.js
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let InspectionItemName;

beforeAll(() => {
  // テスト用のインメモリ SQLite データベースを使用
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false // ロギングを無効化
  });

  // モデル定義を再作成
  InspectionItemName = sequelize.define('InspectionItemName', {
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
        notEmpty: { msg: '点検項目名は必須です' },
        len: {
          args: [1, 255],
          msg: '点検項目名は255文字以内で入力してください',
        },
      },
    },
  }, {
    tableName: 'inspection_item_names',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // テスト用のテーブルを同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後にデータベース接続を閉じる
  return sequelize.close();
});

describe('InspectionItemName Model', () => {
  beforeEach(async () => {
    // 各テスト前にテーブルをクリア
    await InspectionItemName.destroy({ truncate: true });
  });

  it('点検項目名を正常に作成できること', async () => {
    const itemNameData = { name: 'CPU使用率確認' };
    const itemName = await InspectionItemName.create(itemNameData);
    
    expect(itemName).toBeTruthy();
    expect(itemName.id).toBe(1);
    expect(itemName.name).toBe('CPU使用率確認');
  });

  it('点検項目名が null の場合はバリデーションエラーになること', async () => {
    const itemNameData = { name: null };
    
    await expect(InspectionItemName.create(itemNameData))
      .rejects.toThrow();
  });

  it('点検項目名が空文字の場合はバリデーションエラーになること', async () => {
    const itemNameData = { name: '' };
    
    await expect(InspectionItemName.create(itemNameData))
      .rejects.toThrow('Validation error: 点検項目名は必須です');
  });

  it('点検項目名が256文字以上の場合はバリデーションエラーになること', async () => {
    const longName = 'あ'.repeat(256);
    const itemNameData = { name: longName };
    
    await expect(InspectionItemName.create(itemNameData))
      .rejects.toThrow('Validation error: 点検項目名は255文字以内で入力してください');
  });

  it('同じ名前の点検項目名を重複して作成できないこと', async () => {
    // 最初の作成は成功する
    await InspectionItemName.create({ name: 'メモリ使用率確認' });
    
    // 同じ名前での2回目の作成は失敗する
    await expect(InspectionItemName.create({ name: 'メモリ使用率確認' }))
      .rejects.toThrow();
  });

  it('点検項目名を更新できること', async () => {
    // テスト用の点検項目名を作成
    const itemName = await InspectionItemName.create({ name: '更新前項目名' });
    
    // 名前を更新
    itemName.name = '更新後項目名';
    await itemName.save();
    
    // 更新後の点検項目名を取得
    const updatedItemName = await InspectionItemName.findByPk(itemName.id);
    
    expect(updatedItemName.name).toBe('更新後項目名');
  });

  it('点検項目名を削除できること', async () => {
    // テスト用の点検項目名を作成
    const itemName = await InspectionItemName.create({ name: '削除用項目名' });
    
    // 点検項目名を削除
    await itemName.destroy();
    
    // 削除後に点検項目名を検索
    const deletedItemName = await InspectionItemName.findByPk(itemName.id);
    
    expect(deletedItemName).toBeNull();
  });

  it('すべての点検項目名を取得できること', async () => {
    // 複数の点検項目名を作成
    await InspectionItemName.create({ name: 'CPU使用率確認' });
    await InspectionItemName.create({ name: 'メモリ使用率確認' });
    await InspectionItemName.create({ name: 'ディスク使用率確認' });
    
    // すべての点検項目名を取得
    const itemNames = await InspectionItemName.findAll();
    
    expect(itemNames.length).toBe(3);
    expect(itemNames[0].name).toBe('CPU使用率確認');
    expect(itemNames[1].name).toBe('メモリ使用率確認');
    expect(itemNames[2].name).toBe('ディスク使用率確認');
  });
});