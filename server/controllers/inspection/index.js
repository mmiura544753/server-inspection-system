// server/controllers/inspection/index.js
const {
  getInspections,
  getInspectionById,
  getInspectionsByDeviceId,
  getLatestInspectionByDeviceId,
} = require("./inspectionController");
const { createInspection } = require("./inspectionCreateController");
const { updateInspection } = require("./inspectionUpdateController");
const { deleteInspection } = require("./inspectionDeleteController");

// 全ての点検コントローラー関数をエクスポート
module.exports = {
  getInspections,
  getInspectionById,
  getInspectionsByDeviceId,
  getLatestInspectionByDeviceId,
  createInspection,
  updateInspection,
  deleteInspection,
};
