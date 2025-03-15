// server/controllers/customer/customerUpdateController.js
const asyncHandler = require('express-async-handler');
const { Customer } = require('../../models');

// @desc    顧客情報の更新
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = asyncHandler(async (req, res) => {
  const { customer_name } = req.body;
  
  const customer = await Customer.findByPk(req.params.id);
  
  if (customer) {
    try {
      customer.customer_name = customer_name || customer.customer_name;
      
      await customer.save();
      res.json(customer);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        res.status(400);
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  } else {
    res.status(404);
    throw new Error('顧客が見つかりません');
  }
});

module.exports = {
  updateCustomer
};
