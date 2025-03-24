// server/controllers/report/generatedReportDeleteController.js
const { GeneratedReport } = require('../../models');
const fs = require('fs');
const path = require('path');

// 生成されたレポートの削除
const deleteGeneratedReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // レポートの存在確認
    const report = await GeneratedReport.findByPk(id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'レポートが見つかりません'
      });
    }
    
    // ファイルが存在する場合は削除
    if (report.file_path) {
      const fullPath = path.join(__dirname, '../../../', report.file_path);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    
    // レポートを削除
    await report.destroy();
    
    res.status(200).json({
      success: true,
      message: 'レポートが正常に削除されました'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { deleteGeneratedReport };