// server/models/InspectionItem.js
const mongoose = require('mongoose');

const inspectionItemSchema = mongoose.Schema({
  device_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, '機器IDは必須です']
  },
  item_name: {
    type: String,
    required: [true, '点検項目名は必須です'],
    trim: true,
    maxLength: [255, '点検項目名は255文字以内で入力してください']
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const InspectionItem = mongoose.model('InspectionItem', inspectionItemSchema);

module.exports = InspectionItem;
