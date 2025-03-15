// server/controllers/customerController.js
const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');

// @desc    全顧客情報の取得
// @route   GET /api/customers
// @access  Public
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({}).sort({ customer_name: 1 });
  res.json(customers);
});

// @desc    顧客IDによる顧客情報の取得
// @route   GET /api/customers/:id
// @access  Public
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  
  if (customer) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('顧客が見つかりません');
  }
});

// @desc    新規顧客の作成
// @route   POST /api/customers
// @access  Public
const createCustomer = asyncHandler(async (req, res) => {
  const { customer_name } = req.body;
  
  if (!customer_name) {
    res.status(400);
    throw new Error('顧客名は必須です');
  }
  
  const customer = await Customer.create({
    customer_name
  });
  
  if (customer) {
    res.status(201).json(customer);
  } else {
    res.status(400);
    throw new Error('無効な顧客データです');
  }
});

// @desc    顧客情報の更新
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = asyncHandler(async (req, res) => {
  const { customer_name } = req.body;
  
  const customer = await Customer.findById(req.params.id);
  
  if (customer) {
    customer.customer_name = customer_name || customer.customer_name;
    
    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } else {
    res.status(404);
    throw new Error('顧客が見つかりません');
  }
});

// @desc    顧客の削除
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  
  if (customer) {
    await customer.deleteOne();
    res.json({ message: '顧客を削除しました' });
  } else {
    res.status(404);
    throw new Error('顧客が見つかりません');
  }
});

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
