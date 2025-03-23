/**
 * DeviceImportController Unit Tests
 * 
 * These tests verify the CSV import functionality for devices. The tests cover:
 * 1. Error handling for missing files
 * 2. Error handling for invalid CSV content
 * 3. Successful import of new devices
 * 4. Updates to existing devices when IDs are provided
 * 5. Creation of new customers when they don't exist
 * 6. Error handling for non-existent device IDs
 * 7. Validation of required fields
 * 8. Transaction rollback on errors
 */
const httpMocks = require('node-mocks-http');

// Create a shared mock transaction for better test control
const mockTransaction = {
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true)
};

// First mock the config/db.js
jest.mock('../../../config/db', () => {
  const mockSequelize = {
    transaction: jest.fn().mockResolvedValue(mockTransaction)
  };

  return {
    sequelize: mockSequelize
  };
});

// Mock models directly
jest.mock('../../../models', () => {
  const mockCustomer = {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  };

  const mockDevice = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    belongsTo: jest.fn()
  };

  return {
    Customer: mockCustomer,
    Device: mockDevice,
    sequelize: require('../../../config/db').sequelize,
    Sequelize: {
      Op: {
        eq: Symbol('eq'),
        ne: Symbol('ne'),
        in: Symbol('in')
      }
    }
  };
});

// Mock iconv-lite
jest.mock('iconv-lite', () => ({
  decode: jest.fn().mockImplementation((buffer, encoding) => {
    return buffer.toString('utf8');
  })
}));

// Mock csv-parse/sync
jest.mock('csv-parse/sync', () => ({
  parse: jest.fn().mockImplementation((csvContent, options) => {
    if (csvContent.includes('invalid')) {
      throw new Error('CSV parse error');
    }

    const lines = csvContent.split('\n');
    const headers = lines[0].replace(/"/g, '').split(',');
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].replace(/"/g, '').split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      rows.push(row);
    }

    return rows;
  })
}));

// Import controller and models after mocking
const { importDevicesFromCsv } = require('../../../controllers/device/deviceImportController');
const models = require('../../../models');
const db = require('../../../config/db');

describe('DeviceImportController Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an error when no file is provided', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/devices/import',
      file: null
    });
    
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    await importDevicesFromCsv(req, res, next);
    
    expect(res.statusCode).toBe(400);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('CSVファイルが提供されていません');
  });

  it('should handle CSV parsing errors', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/devices/import',
      file: {
        originalname: 'invalid.csv',
        mimetype: 'text/csv',
        buffer: Buffer.from('invalid content'),
        size: 'invalid content'.length
      }
    });
    
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    await importDevicesFromCsv(req, res, next);
    
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('CSVのインポート中にエラー');
  });

  it('should successfully import new devices from CSV', async () => {
    // Mock CSV content for new device
    const csvContent = '機器名,顧客名,モデル,設置ラックNo,ユニット開始位置,ユニット終了位置,機器種別,ハードウェアタイプ\n' +
                       'テスト機器1,テスト顧客1,Model-X,5,10,12,サーバ,物理\n' +
                       'テスト機器2,テスト顧客2,Model-Y,3,5,6,ネットワーク機器,VM';
    
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/devices/import',
      file: {
        originalname: 'devices.csv',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length
      }
    });
    
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    // Mock customer and device interactions
    models.Customer.findOne.mockImplementation((params) => {
      if (params.where.customer_name === 'テスト顧客1') {
        return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
      }
      return Promise.resolve(null); // Customer not found
    });
    
    models.Customer.create.mockImplementation((data) => {
      return Promise.resolve({
        id: 99,
        ...data
      });
    });
    
    models.Device.findOne.mockResolvedValue(null); // No duplicates
    
    models.Device.create.mockImplementation((data) => {
      return Promise.resolve({
        id: data.customer_id === 1 ? 100 : 101,
        ...data
      });
    });
    
    await importDevicesFromCsv(req, res, next);
    
    // Verify response
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toHaveProperty('message');
    expect(res._getJSONData()).toHaveProperty('data');
    expect(res._getJSONData().data.importedRows).toBe(2);
    expect(res._getJSONData().data.totalRows).toBe(2);
    
    // Verify transaction was committed
    expect(db.sequelize.transaction).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    
    // Verify device creates were called correctly
    expect(models.Device.create).toHaveBeenCalledTimes(2);
    expect(models.Customer.create).toHaveBeenCalledTimes(1); // for the new customer only
    
    // Verify first create call device attributes
    const firstCreateCall = models.Device.create.mock.calls[0][0];
    expect(firstCreateCall).toHaveProperty('device_name', 'テスト機器1');
    expect(firstCreateCall).toHaveProperty('customer_id', 1);
    expect(firstCreateCall).toHaveProperty('model', 'Model-X');
    expect(firstCreateCall).toHaveProperty('rack_number', 5);
    expect(firstCreateCall).toHaveProperty('device_type', 'サーバ');
    expect(firstCreateCall).toHaveProperty('hardware_type', '物理');
  });

  it('should update an existing device when ID is provided', async () => {
    // Mock CSV content for updating an existing device
    const csvContent = 'ID,機器名,顧客名,モデル,設置ラックNo,ユニット開始位置,ユニット終了位置,機器種別,ハードウェアタイプ\n' +
                       '1,更新機器1,テスト顧客1,Updated-Model,6,11,13,サーバ,物理';
    
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/devices/import',
      file: {
        originalname: 'updates.csv',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length
      }
    });
    
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    // Mock customer search results
    models.Customer.findOne.mockResolvedValue({ id: 1, customer_name: 'テスト顧客1' });
    
    // Mock the existing device with a save method
    const mockDevice = {
      id: 1,
      device_name: '元の機器名',
      customer_id: 1,
      model: 'Old-Model',
      rack_number: 5,
      unit_start_position: 10,
      unit_end_position: 12,
      device_type: 'サーバ',
      hardware_type: '物理',
      save: jest.fn().mockResolvedValue(true)
    };
    models.Device.findByPk.mockResolvedValue(mockDevice);
    
    await importDevicesFromCsv(req, res, next);
    
    // Verify response
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().data.importedRows).toBe(1);
    
    // Verify device update
    expect(mockDevice.device_name).toBe('更新機器1');
    expect(mockDevice.model).toBe('Updated-Model');
    expect(mockDevice.rack_number).toBe(6);
    expect(mockDevice.unit_start_position).toBe(11);
    expect(mockDevice.unit_end_position).toBe(13);
    expect(mockDevice.save).toHaveBeenCalled();
    
    // Verify transaction was committed
    expect(db.sequelize.transaction).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should create a new customer when it does not exist', async () => {
    // Mock CSV content with a new customer
    const csvContent = '機器名,顧客名,モデル,設置ラックNo,ユニット開始位置,ユニット終了位置,機器種別,ハードウェアタイプ\n' +
                       'テスト機器3,新規顧客,Model-Z,7,15,16,サーバ,物理';
    
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/devices/import',
      file: {
        originalname: 'new_customer.csv',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length
      }
    });
    
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    // Mock customer not found
    models.Customer.findOne.mockResolvedValue(null);
    
    // Mock customer creation
    models.Customer.create.mockResolvedValue({
      id: 100,
      customer_name: '新規顧客'
    });
    
    // Mock device check and creation
    models.Device.findOne.mockResolvedValue(null); // No duplicate
    models.Device.create.mockResolvedValue({
      id: 200,
      device_name: 'テスト機器3',
      customer_id: 100,
      model: 'Model-Z',
      rack_number: 7,
      unit_start_position: 15,
      unit_end_position: 16,
      device_type: 'サーバ',
      hardware_type: '物理'
    });
    
    await importDevicesFromCsv(req, res, next);
    
    // Verify response
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().data.importedRows).toBe(1);
    
    // Verify customer creation
    expect(models.Customer.create).toHaveBeenCalledWith(
      { customer_name: '新規顧客' },
      { transaction: expect.anything() }
    );
    
    // Verify device creation with the new customer
    expect(models.Device.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: 100,
        device_name: 'テスト機器3'
      }),
      { transaction: expect.anything() }
    );
  });

  it('should handle and report errors for non-existent device IDs', async () => {
    // Mock CSV content with non-existent ID
    const csvContent = 'ID,機器名,顧客名,モデル,設置ラックNo,ユニット開始位置,ユニット終了位置,機器種別,ハードウェアタイプ\n' +
                       '999,存在しない機器,テスト顧客1,Model-X,5,10,12,サーバ,物理';
    
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/devices/import',
      file: {
        originalname: 'invalid_id.csv',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length
      }
    });
    
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    // Mock customer search
    models.Customer.findOne.mockResolvedValue({ id: 1, customer_name: 'テスト顧客1' });
    
    // Mock device not found
    models.Device.findByPk.mockResolvedValue(null);
    
    await importDevicesFromCsv(req, res, next);
    
    // Verify response
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().data.importedRows).toBe(0);
    expect(res._getJSONData().data.errors).toHaveLength(1);
    expect(res._getJSONData().data.errors[0].error).toContain('指定されたID: 999の機器が存在しません');
    
    // Verify transaction was committed
    expect(db.sequelize.transaction).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('should handle missing required fields in CSV', async () => {
    // Mock CSV content with missing required fields
    const csvContent = '機器名,顧客名,モデル,設置ラックNo,ユニット開始位置,ユニット終了位置,機器種別,ハードウェアタイプ\n' +
                       ',テスト顧客1,Model-X,5,10,12,サーバ,物理\n' +  // Missing 機器名
                       'テスト機器4,,Model-Y,3,5,6,ネットワーク機器,VM';  // Missing 顧客名
    
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/devices/import',
      file: {
        originalname: 'missing_fields.csv',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length
      }
    });
    
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    // Mock customer search
    models.Customer.findOne.mockImplementation(({ where }) => {
      if (where.customer_name === 'テスト顧客1') {
        return Promise.resolve({ id: 1, customer_name: 'テスト顧客1' });
      }
      return Promise.resolve(null);
    });
    
    await importDevicesFromCsv(req, res, next);
    
    // Verify response
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().data.importedRows).toBe(0);
    expect(res._getJSONData().data.errors).toHaveLength(2);
    expect(res._getJSONData().data.errors[0].error).toContain('機器名が不足しています');
    expect(res._getJSONData().data.errors[1].error).toContain('顧客名が不足しています');
  });

  it('should roll back the transaction when critical errors occur', async () => {
    // Mock CSV content
    const csvContent = '機器名,顧客名,モデル,設置ラックNo,ユニット開始位置,ユニット終了位置,機器種別,ハードウェアタイプ\n' +
                       'テスト機器5,テスト顧客1,Model-X,5,10,12,サーバ,物理';
    
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/devices/import',
      file: {
        originalname: 'transaction_error.csv',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length
      }
    });
    
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    // Set up mocks for successful customer lookup but transaction commit failure
    models.Customer.findOne.mockResolvedValue({ id: 1, customer_name: 'テスト顧客1' });
    models.Device.findOne.mockResolvedValue(null);
    
    // Make the commit throw an error (this will trigger rollback in the catch block)
    mockTransaction.commit.mockRejectedValue(new Error('Transaction commit failed'));
    
    await importDevicesFromCsv(req, res, next);
    
    // Verify transaction rollback was called
    expect(db.sequelize.transaction).toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalled();
    
    // Verify error was passed to next middleware
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('CSVのインポート中にエラー');
  });
});