// Customer.test.js
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

// テスト用の分離された Sequelize インスタンスを作成
let sequelize;
let Customer;

beforeAll(() => {
  // テスト用のインメモリ SQLite データベースを使用
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false // ロギングを無効化
  });

  // モデル定義を再作成
  Customer = sequelize.define('Customer', {
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

  // テスト用のテーブルを同期
  return sequelize.sync({ force: true });
});

afterAll(() => {
  // テスト後にデータベース接続を閉じる
  return sequelize.close();
});

describe('Customer Model', () => {
  it('顧客を正常に作成できること', async () => {
    const customerData = { customer_name: 'テスト顧客' };
    const customer = await Customer.create(customerData);
    
    expect(customer).toBeTruthy();
    expect(customer.id).toBe(1);
    expect(customer.customer_name).toBe('テスト顧客');
  });

  it('顧客名が null の場合はバリデーションエラーになること', async () => {
    const customerData = { customer_name: null };
    
    await expect(Customer.create(customerData))
      .rejects.toThrow();
  });

  it('顧客名が空文字の場合はバリデーションエラーになること', async () => {
    const customerData = { customer_name: '' };
    
    await expect(Customer.create(customerData))
      .rejects.toThrow('Validation error: 顧客名は必須です');
  });

  it('顧客名が101文字以上の場合はバリデーションエラーになること', async () => {
    const longName = 'あ'.repeat(101);
    const customerData = { customer_name: longName };
    
    await expect(Customer.create(customerData))
      .rejects.toThrow('Validation error: 顧客名は100文字以内で入力してください');
  });

  it('顧客を更新できること', async () => {
    // テスト用の顧客を作成
    const customer = await Customer.create({ customer_name: '更新前顧客' });
    
    // 顧客名を更新
    customer.customer_name = '更新後顧客';
    await customer.save();
    
    // 更新後の顧客を取得
    const updatedCustomer = await Customer.findByPk(customer.id);
    
    expect(updatedCustomer.customer_name).toBe('更新後顧客');
  });

  it('顧客を削除できること', async () => {
    // テスト用の顧客を作成
    const customer = await Customer.create({ customer_name: '削除用顧客' });
    
    // 顧客を削除
    await customer.destroy();
    
    // 削除後に顧客を検索
    const deletedCustomer = await Customer.findByPk(customer.id);
    
    expect(deletedCustomer).toBeNull();
  });

  it('すべての顧客を取得できること', async () => {
    // テスト用のテーブルをクリア
    await Customer.destroy({ truncate: true });
    
    // 複数の顧客を作成
    await Customer.create({ customer_name: '顧客A' });
    await Customer.create({ customer_name: '顧客B' });
    await Customer.create({ customer_name: '顧客C' });
    
    // すべての顧客を取得
    const customers = await Customer.findAll();
    
    expect(customers.length).toBe(3);
    expect(customers[0].customer_name).toBe('顧客A');
    expect(customers[1].customer_name).toBe('顧客B');
    expect(customers[2].customer_name).toBe('顧客C');
  });
});