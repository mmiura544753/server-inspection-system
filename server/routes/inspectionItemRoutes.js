// server/routes/inspectionItemRoutes.js
const express = require('express');
const router = express.Router();
const {
  getInspectionItems,
  getInspectionItemById,
  createInspectionItem,
  updateInspectionItem,
  deleteInspectionItem
} = require('../controllers/inspectionItem');

// /api/inspection-items
router.route('/')
  .get(getInspectionItems)
  .post(createInspectionItem);

// /api/inspection-items/:id
router.route('/:id')
  .get(getInspectionItemById)
  .put(updateInspectionItem)
  .delete(deleteInspectionItem);

module.exports = router;
