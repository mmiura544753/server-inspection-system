// server/controllers/device/index.js
const { getDevices, getDeviceById, getDevicesByCustomerId } = require('./deviceController');
const { createDevice } = require('./deviceCreateController');
const { updateDevice } = require('./deviceUpdateController');
const { deleteDevice } = require('./deviceDeleteController');

// 全ての機器コントローラー関数をエクスポート
module.exports = {
  getDevices,
  getDeviceById,
  getDevicesByCustomerId,
  createDevice,
  updateDevice,
  deleteDevice
};
