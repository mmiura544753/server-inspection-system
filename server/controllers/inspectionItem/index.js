// server/controllers/inspectionItem/index.js
const { 
  getInspectionItems, 
  getInspectionItemById, 
  getInspectionItemsByDeviceId 
} = require('./inspectionItemController');
const { createInspectionItem } = require('./inspectionItemCreateController');
const { updateInspectionItem } = require('./inspectionItemUpdateController');
const { deleteInspectionItem } = require('./inspectionItemDeleteController');
const { exportInspectionItemsToCsv } = require('./inspectionItemExportController');
const { importInspectionItemsFromCsv } = require('./inspectionItemImportController');
const { getAllInspectionItemNames } = require('./inspectionItemNameController');

// 全ての点検項目コントローラー関数をエクスポート
module.exports = {
  getInspectionItems,
  getInspectionItemById,
  getInspectionItemsByDeviceId,
  createInspectionItem,
  updateInspectionItem,
  deleteInspectionItem,
  exportInspectionItemsToCsv,
  importInspectionItemsFromCsv,
  getAllInspectionItemNames
};
