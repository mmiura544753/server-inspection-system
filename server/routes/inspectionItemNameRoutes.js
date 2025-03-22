// server/routes/inspectionItemNameRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllInspectionItemNames,
  getInspectionItemNameById,
  createInspectionItemName,
  updateInspectionItemName,
  deleteInspectionItemName
} = require('../controllers/inspectionItem/inspectionItemNameController');

// /api/inspection-item-names
router.route('/')
  .get(getAllInspectionItemNames)
  .post(createInspectionItemName);

// /api/inspection-item-names/:id
router.route('/:id')
  .get(getInspectionItemNameById)
  .put(updateInspectionItemName)
  .delete(deleteInspectionItemName);

module.exports = router;