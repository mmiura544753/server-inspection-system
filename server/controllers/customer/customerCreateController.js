// server/controllers/customer/customerCreateController.js
const asyncHandler = require('express-async-handler');
const { Customer } = require('../../models');

// @desc    新規顧客の作成
// @route   POST /api/customers
// @access  Public
const createCustomer = asyncHandler(async (req, res) => {
  const { customer_name } = req.body;
  
  if (!customer_name) {
    res.status(400);
    throw new Error('顧客名は必須です');
  }
  
  try {
    const customer = await Customer.create({
      customer_name
    });
    
    res.status(201).json(customer);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(400);
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
});

module.exports = {
  createCustomer
};
