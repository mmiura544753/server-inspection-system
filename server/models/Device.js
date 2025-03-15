// server/models/Device.js
const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, '顧客IDは必須です']
  },
  device_name: {
    type: String,
    required: [true, '機器名は必須です'],
    trim: true,
    maxLength: [100, '機器名は100文字以内で入力してください']
  },
  model: {
    type: String,
    trim: true,
    maxLength: [50, 'モデル名は50文字以内で入力してください']
  },
  location: {
    type: String,
    trim: true,
    maxLength: [100, '設置場所は100文字以内で入力してください']
  },
  device_type: {
    type: String,
    required: [true, '機器種別は必須です'],
    enum: ['サーバ', 'UPS', 'ネットワーク機器', 'その他']
  },
  hardware_type: {
    type: String,
    required: [true, 'ハードウェアタイプは必須です'],
    enum: ['物理', 'VM']
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
