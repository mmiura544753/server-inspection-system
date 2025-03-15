// server/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customer');
const { getDevicesByCustomerId } = require('../controllers/device');

// /api/customers
router.route('/')
  .get(getCustomers)
  .post(createCustomer);

// /api/customers/:id
router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

// /api/customers/:customerId/devices
router.route('/:customerId/devices')
  .get(getDevicesByCustomerId);

module.exports = router;
