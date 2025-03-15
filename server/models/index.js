// server/models/index.js
const Customer = require('./Customer');
const Device = require('./Device');
const InspectionItem = require('./InspectionItem');
const Inspection = require('./Inspection');
const InspectionResult = require('./InspectionResult');

// すべてのモデルをエクスポート
module.exports = {
  Customer,
  Device,
  InspectionItem,
  Inspection,
  InspectionResult
};
