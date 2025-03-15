// server/routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice
} = require('../controllers/deviceController');
const { 
  getInspectionItemsByDeviceId 
} = require('../controllers/inspectionItemController');
const {
  getInspectionsByDeviceId
} = require('../controllers/inspectionController');

// /api/devices
router.route('/')
  .get(getDevices)
  .post(createDevice);

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
