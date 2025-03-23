// tests/mocks/sequelize-mock.js
// A reusable mock for Sequelize and models for testing

// mockTransaction object
const mockTransaction = {
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true)
};

// Customer model mock
const CustomerMock = {
  findByPk: jest.fn().mockImplementation((id) => {
    if (id == 1) {
      return Promise.resolve({ id: 1, customer_name: 'Æ¹Èg¢1' });
    }
    if (id == 2) {
      return Promise.resolve({ id: 2, customer_name: 'Æ¹Èg¢2' });
    }
    return Promise.resolve(null);
  }),
  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where && where.customer_name === 'Æ¹Èg¢1') {
      return Promise.resolve({ id: 1, customer_name: 'Æ¹Èg¢1' });
    }
    if (where && where.customer_name === 'Æ¹Èg¢2') {
      return Promise.resolve({ id: 2, customer_name: 'Æ¹Èg¢2' });
    }
    return Promise.resolve(null);
  }),
  create: jest.fn().mockImplementation((customerData) => {
    return Promise.resolve({
      id: 99,
      ...customerData,
      created_at: new Date(),
      updated_at: new Date()
    });
  })
};

// Device model mock
const DeviceMock = {
  findAll: jest.fn().mockImplementation((options) => {
    if (options && options.where && options.where.customer_id === 1) {
      return Promise.resolve([{
        id: 1,
        device_name: 'Æ¹ÈµüĞü1',
        customer_id: 1,
        customer: { id: 1, customer_name: 'Æ¹Èg¢1' },
        model: 'Model-X',
        rack_number: 5,
        unit_start_position: 10,
        unit_end_position: 12,
        device_type: 'µüĞ',
        hardware_type: 'i',
        created_at: new Date(),
        updated_at: new Date(),
        getUnitPositionDisplay: function() {
          return 'U10-U12';
        }
      }]);
    }
    
    return Promise.resolve([
      {
        id: 1,
        device_name: 'Æ¹ÈµüĞü1',
        customer_id: 1,
        customer: { id: 1, customer_name: 'Æ¹Èg¢1' },
        model: 'Model-X',
        rack_number: 5,
        unit_start_position: 10,
        unit_end_position: 12,
        device_type: 'µüĞ',
        hardware_type: 'i',
        created_at: new Date(),
        updated_at: new Date(),
        getUnitPositionDisplay: function() {
          return 'U10-U12';
        }
      },
      {
        id: 2,
        device_name: 'Æ¹ÈµüĞü2',
        customer_id: 2,
        customer: { id: 2, customer_name: 'Æ¹Èg¢2' },
        model: 'Model-Y',
        rack_number: 3,
        unit_start_position: 5,
        unit_end_position: 5,
        created_at: new Date(),
        updated_at: new Date(),
        getUnitPositionDisplay: function() {
          return 'U5';
        }
      }
    ]);
  }),
  
  findByPk: jest.fn().mockImplementation((id, options) => {
    if (id == 1) {
      const device = {
        id: 1,
        device_name: 'Æ¹ÈµüĞü1',
        customer_id: 1,
        customer: { id: 1, customer_name: 'Æ¹Èg¢1' },
        model: 'Model-X',
        rack_number: 5,
        unit_start_position: 10,
        unit_end_position: 12,
        device_type: 'µüĞ',
        hardware_type: 'i',
        created_at: new Date(),
        updated_at: new Date(),
        getUnitPositionDisplay: function() {
          return 'U10-U12';
        },
        save: jest.fn().mockResolvedValue(true)
      };
      return Promise.resolve(device);
    }
    if (id == 2) {
      const device = {
        id: 2,
        device_name: 'Æ¹ÈµüĞü2',
        customer_id: 2,
        customer: { id: 2, customer_name: 'Æ¹Èg¢2' },
        model: 'Model-Y',
        rack_number: 3,
        unit_start_position: 5,
        unit_end_position: 5,
        device_type: 'µüĞ',
        hardware_type: 'VM',
        created_at: new Date(),
        updated_at: new Date(),
        getUnitPositionDisplay: function() {
          return 'U5';
        },
        save: jest.fn().mockResolvedValue(true)
      };
      return Promise.resolve(device);
    }
    return Promise.resolve(null);
  }),
  
  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where) {
      const { customer_id, device_name } = where;
      if (customer_id === 1 && device_name === 'Æ¹ÈµüĞü1') {
        return Promise.resolve({
          id: 1,
          device_name: 'Æ¹ÈµüĞü1',
          customer_id: 1,
          model: 'Model-X',
          rack_number: 5,
          unit_start_position: 10,
          unit_end_position: 12,
          device_type: 'µüĞ',
          hardware_type: 'i'
        });
      }
      if (customer_id === 2 && device_name === 'Æ¹ÈµüĞü2') {
        return Promise.resolve({
          id: 2,
          device_name: 'Æ¹ÈµüĞü2',
          customer_id: 2,
          model: 'Model-Y',
          rack_number: 3,
          unit_start_position: 5,
          unit_end_position: 5,
          device_type: 'µüĞ',
          hardware_type: 'VM'
        });
      }
    }
    return Promise.resolve(null);
  }),
  
  create: jest.fn().mockImplementation((deviceData) => {
    // ĞêÇü·çóÁ§Ã¯ÅÕ£üëÉ	
    if (!deviceData.customer_id) {
      const error = new Error('g¢IDoÅgY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: 'g¢IDoÅgY' }];
      return Promise.reject(error);
    }
    if (!deviceData.device_name) {
      const error = new Error('_hoÅgY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: '_hoÅgY' }];
      return Promise.reject(error);
    }
    if (!deviceData.device_type) {
      const error = new Error('_h.%oÅgY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: '_h.%oÅgY' }];
      return Promise.reject(error);
    }
    if (!deviceData.hardware_type) {
      const error = new Error('ÏüÉ¦§¢¿¤×oÅgY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: 'ÏüÉ¦§¢¿¤×oÅgY' }];
      return Promise.reject(error);
    }
    
    // device_typenĞêÇü·çó
    if (!['µüĞ', 'UPS', 'ÍÃÈïü¯_h', ']nÖ'].includes(deviceData.device_type)) {
      const error = new Error('!¹j_h.%gY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: '!¹j_h.%gY' }];
      return Promise.reject(error);
    }
    
    // hardware_typenĞêÇü·çó
    if (!['i', 'VM'].includes(deviceData.hardware_type)) {
      const error = new Error('!¹jÏüÉ¦§¢¿¤×gY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: '!¹jÏüÉ¦§¢¿¤×gY' }];
      return Promise.reject(error);
    }

    // \Ÿ
    return Promise.resolve({
      id: 100,
      ...deviceData,
      created_at: new Date(),
      updated_at: new Date()
    });
  }),
  
  belongsTo: jest.fn()
};

// Sequelize mock
const sequelizeMock = {
  sync: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  transaction: jest.fn().mockResolvedValue(mockTransaction),
  getQueryInterface: jest.fn().mockReturnValue({}),
  query: jest.fn().mockResolvedValue([]),
  authenticate: jest.fn().mockResolvedValue()
};

// Full models mock
const modelsMock = {
  Customer: CustomerMock,
  Device: DeviceMock,
  sequelize: sequelizeMock,
  Sequelize: {
    Op: {
      eq: Symbol('eq'),
      ne: Symbol('ne'),
      in: Symbol('in')
    }
  }
};

module.exports = {
  modelsMock,
  mockTransaction,
  CustomerMock,
  DeviceMock,
  sequelizeMock
};