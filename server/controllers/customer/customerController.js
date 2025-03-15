// server/controllers/customer/customerController.js
const asyncHandler = require('express-async-handler');
const { Customer } = require('../../models');

// @desc    全顧客情報の取得
// @route   GET /api/customers
// @access  Public
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.findAll({
    order: [['customer_name', 'ASC']]
  });
  res.json(customers);
});

// @desc    顧客IDによる顧客情報の取得
// @route   GET /api/customers/:id
// @access  Public
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  
  if (customer) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('顧客が見つかりません');
  }
});

module.exports = {
  getCustomers,
  getCustomerById
};
