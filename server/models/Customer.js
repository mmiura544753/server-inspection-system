// server/models/Customer.js
const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
  customer_name: {
    type: String,
    required: [true, '顧客名は必須です'],
    trim: true,
    maxLength: [100, '顧客名は100文字以内で入力してください']
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
