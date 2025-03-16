// server/routes/inspectionItemRoutes.js
const express = require('express');
const router = express.Router();
const {
  getInspectionItems,
  getInspectionItemById,
  createInspectionItem,
  updateInspectionItem,
  deleteInspectionItem,
  exportInspectionItemsToCsv,
  importInspectionItemsFromCsv
} = require('../controllers/inspectionItem');
const upload = require('../middleware/upload');

// /api/inspection-items
router.route('/')
  .get(getInspectionItems)
  .post(createInspectionItem);

// /api/inspection-items/export - CSVエクスポート
router.route('/export')
  .get(exportInspectionItemsToCsv);

// /api/inspection-items/import - CSVインポート
router.route('/import')
  .post(upload.single('file'), importInspectionItemsFromCsv);

// /api/inspection-items/:id
router.route('/:id')
  .get(getInspectionItemById)
  .put(updateInspectionItem)
  .delete(deleteInspectionItem);

module.exports = router;
