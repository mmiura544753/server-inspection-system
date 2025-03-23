// server/routes/inspectionItemNameRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllInspectionItemNames,
  getInspectionItemNameById,
  createInspectionItemName,
  updateInspectionItemName,
  deleteInspectionItemName,
  exportInspectionItemNamesToCsv,
  importInspectionItemNamesFromCsv
} = require('../controllers/inspectionItem/inspectionItemNameController');
const upload = require('../middleware/upload');

// /api/inspection-item-names
router.route('/')
  .get(getAllInspectionItemNames)
  .post(createInspectionItemName);

// /api/inspection-item-names/export - CSVエクスポート
router.route('/export')
  .get(exportInspectionItemNamesToCsv);

// /api/inspection-item-names/import - CSVインポート
router.route('/import')
  .post(upload.single('file'), importInspectionItemNamesFromCsv);

// /api/inspection-item-names/:id
router.route('/:id')
  .get(getInspectionItemNameById)
  .put(updateInspectionItemName)
  .delete(deleteInspectionItemName);

module.exports = router;