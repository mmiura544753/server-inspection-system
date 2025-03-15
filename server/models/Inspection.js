// server/models/Inspection.js
const mongoose = require('mongoose');

// 点検結果のスキーマ
const inspectionResultSchema = mongoose.Schema({
  inspection_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InspectionItem',
    required: [true, '点検項目IDは必須です']
  },
  status: {
    type: String,
    required: [true, '結果ステータスは必須です'],
    enum: ['正常', '異常']
  },
  checked_at: {
    type: Date,
    default: Date.now
  }
});

// 点検スキーマ
const inspectionSchema = mongoose.Schema({
  inspection_date: {
    type: Date,
    required: [true, '点検日は必須です']
  },
  start_time: {
    type: String
  },
  end_time: {
    type: String
  },
  inspector_name: {
    type: String,
    required: [true, '点検者名は必須です'],
    trim: true,
    maxLength: [50, '点検者名は50文字以内で入力してください']
  },
  device_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, '機器IDは必須です']
  },
  status: {
    type: String,
    default: '完了',
    enum: ['準備中', '進行中', '完了']
  },
  results: [inspectionResultSchema]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Inspection = mongoose.model('Inspection', inspectionSchema);

module.exports = Inspection;
