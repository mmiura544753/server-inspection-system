// server/routes/inspectionRoutesSQL.js
const express = require("express");
const router = express.Router();
const {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
  getLatestInspectionByDeviceId,
} = require("../controllers/inspection/indexSQL");

// /api/inspections
router.route("/")
  .get(getInspections)
  .post(createInspection);

// /api/inspections/:id
router.route("/:id")
  .get(getInspectionById)
  .put(updateInspection)
  .delete(deleteInspection);

// /api/devices/:deviceId/latest-inspection
router.route("/devices/:deviceId/latest")
  .get(getLatestInspectionByDeviceId);

module.exports = router;
