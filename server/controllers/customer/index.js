// server/controllers/customer/index.js
const { getCustomers, getCustomerById } = require('./customerController');
const { createCustomer } = require('./customerCreateController');
const { updateCustomer } = require('./customerUpdateController');
const { deleteCustomer } = require('./customerDeleteController');

// 全ての顧客コントローラー関数をエクスポート
module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
