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
      return Promise.resolve({ id: 1, customer_name: 'ƹ�g�1' });
    }
    if (id == 2) {
      return Promise.resolve({ id: 2, customer_name: 'ƹ�g�2' });
    }
    return Promise.resolve(null);
  }),
  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where && where.customer_name === 'ƹ�g�1') {
      return Promise.resolve({ id: 1, customer_name: 'ƹ�g�1' });
    }
    if (where && where.customer_name === 'ƹ�g�2') {
      return Promise.resolve({ id: 2, customer_name: 'ƹ�g�2' });
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
        device_name: 'ƹȵ���1',
        customer_id: 1,
        customer: { id: 1, customer_name: 'ƹ�g�1' },
        model: 'Model-X',
        rack_number: 5,
        unit_start_position: 10,
        unit_end_position: 12,
        device_type: '���',
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
        device_name: 'ƹȵ���1',
        customer_id: 1,
        customer: { id: 1, customer_name: 'ƹ�g�1' },
        model: 'Model-X',
        rack_number: 5,
        unit_start_position: 10,
        unit_end_position: 12,
        device_type: '���',
        hardware_type: 'i',
        created_at: new Date(),
        updated_at: new Date(),
        getUnitPositionDisplay: function() {
          return 'U10-U12';
        }
      },
      {
        id: 2,
        device_name: 'ƹȵ���2',
        customer_id: 2,
        customer: { id: 2, customer_name: 'ƹ�g�2' },
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
        device_name: 'ƹȵ���1',
        customer_id: 1,
        customer: { id: 1, customer_name: 'ƹ�g�1' },
        model: 'Model-X',
        rack_number: 5,
        unit_start_position: 10,
        unit_end_position: 12,
        device_type: '���',
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
        device_name: 'ƹȵ���2',
        customer_id: 2,
        customer: { id: 2, customer_name: 'ƹ�g�2' },
        model: 'Model-Y',
        rack_number: 3,
        unit_start_position: 5,
        unit_end_position: 5,
        device_type: '���',
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
      if (customer_id === 1 && device_name === 'ƹȵ���1') {
        return Promise.resolve({
          id: 1,
          device_name: 'ƹȵ���1',
          customer_id: 1,
          model: 'Model-X',
          rack_number: 5,
          unit_start_position: 10,
          unit_end_position: 12,
          device_type: '���',
          hardware_type: 'i'
        });
      }
      if (customer_id === 2 && device_name === 'ƹȵ���2') {
        return Promise.resolve({
          id: 2,
          device_name: 'ƹȵ���2',
          customer_id: 2,
          model: 'Model-Y',
          rack_number: 3,
          unit_start_position: 5,
          unit_end_position: 5,
          device_type: '���',
          hardware_type: 'VM'
        });
      }
    }
    return Promise.resolve(null);
  }),
  
  create: jest.fn().mockImplementation((deviceData) => {
    // ���������ï�գ���	
    if (!deviceData.customer_id) {
      const error = new Error('g�IDo�gY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: 'g�IDo�gY' }];
      return Promise.reject(error);
    }
    if (!deviceData.device_name) {
      const error = new Error('_ho�gY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: '_ho�gY' }];
      return Promise.reject(error);
    }
    if (!deviceData.device_type) {
      const error = new Error('_h.%o�gY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: '_h.%o�gY' }];
      return Promise.reject(error);
    }
    if (!deviceData.hardware_type) {
      const error = new Error('��ɦ�����o�gY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: '��ɦ�����o�gY' }];
      return Promise.reject(error);
    }
    
    // device_typen�������
    if (!['���', 'UPS', '������_h', ']n�'].includes(deviceData.device_type)) {
      const error = new Error('!�j_h.%gY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: '!�j_h.%gY' }];
      return Promise.reject(error);
    }
    
    // hardware_typen�������
    if (!['i', 'VM'].includes(deviceData.hardware_type)) {
      const error = new Error('!�j��ɦ�����gY');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: '!�j��ɦ�����gY' }];
      return Promise.reject(error);
    }

    // \�
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