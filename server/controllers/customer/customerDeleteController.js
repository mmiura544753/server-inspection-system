// server/controllers/customer/customerDeleteController.js
const asyncHandler = require('express-async-handler');
const { Customer } = require('../../models');

// @desc    顧客の削除
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  
  if (customer) {
    await customer.destroy();
    res.json({ message: '顧客を削除しました' });
  } else {
    res.status(404);
    throw new Error('顧客が見つかりません');
  }
});

module.exports = {
  deleteCustomer
};
