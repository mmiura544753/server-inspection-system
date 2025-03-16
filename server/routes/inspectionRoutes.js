// server/routes/inspectionRoutes.js
const express = require("express");
const router = express.Router();
const {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
  getLatestInspectionByDeviceId,
} = require("../controllers/inspection");

// /api/inspections
router.route("/").get(getInspections).post(createInspection);

// /api/inspections/:id
router
  .route("/:id")
  .get(getInspectionById)
  .put(updateInspection)
  .delete(deleteInspection);

router
  .route("/devices/:deviceId/inspections/latest")
  .get(getLatestInspectionByDeviceId);

module.exports = router;
