// server/middleware/upload.js
const multer = require('multer');
const path = require('path');

// メモリストレージの設定（ファイルをメモリに保存）
const storage = multer.memoryStorage();

// CSVファイルのみ許可するフィルター
const csvFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.csv') {
    return cb(new Error('CSVファイルのみアップロードできます'), false);
  }
  cb(null, true);
};

// アップロードの設定
const upload = multer({
  storage: storage,
  fileFilter: csvFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB制限
  }
});

module.exports = upload;
