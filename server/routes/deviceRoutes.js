// server/routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  exportDevicesToCsv,
  importDevicesFromCsv
} = require('../controllers/device');
const { 
  getInspectionItemsByDeviceId 
} = require('../controllers/inspectionItem');
const {
  getInspectionsByDeviceId
} = require('../controllers/inspection');
const upload = require('../middleware/upload');

// /api/devices
router.route('/')
  .get(getDevices)
  .post(createDevice);

// /api/devices/export - CSVエクスポート
router.route('/export')
  .get(exportDevicesToCsv);

// /api/devices/import - CSVインポート
router.route('/import')
  .post(upload.single('file'), importDevicesFromCsv);

// /api/devices/:id
router.route('/:id')
  .get(getDeviceById)
  .put(updateDevice)
  .delete(deleteDevice);

// /api/devices/:deviceId/inspection-items
router.route('/:deviceId/inspection-items')
  .get(getInspectionItemsByDeviceId);

// /api/devices/:deviceId/inspections
router.route('/:deviceId/inspections')
  .get(getInspectionsByDeviceId);

module.exports = router;
