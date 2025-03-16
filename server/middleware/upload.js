// server/middleware/upload.js - 修正版
const multer = require('multer');
const path = require('path');

// メモリストレージの設定（ファイルをメモリに保存）
const storage = multer.memoryStorage();

// CSVファイルのみ許可するフィルター - MIMEタイプチェックを緩和
const csvFilter = (req, file, cb) => {
  console.log('アップロードされたファイル情報:', {
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  // .csvファイル、またはtext/csvとtext/plain MIMEタイプを許可
  if (ext === '.csv' || file.mimetype === 'text/csv' || file.mimetype === 'text/plain' || file.mimetype === 'application/vnd.ms-excel') {
    console.log('CSVファイル形式として受け入れます');
    return cb(null, true);
  }
  
  console.log('CSVファイルではないため拒否します');
  return cb(new Error('CSVファイルのみアップロードできます'), false);
};

// アップロードの設定
const upload = multer({
  storage: storage,
  fileFilter: csvFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB制限に増やす
  }
});

module.exports = upload;
