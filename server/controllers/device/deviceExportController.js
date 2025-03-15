// server/controllers/device/deviceExportController.js
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const { Device, Customer } = require('../../models');

// @desc    機器一覧のCSVエクスポート
// @route   GET /api/devices/export
// @access  Public
const exportDevicesToCsv = asyncHandler(async (req, res) => {
  // 全ての機器情報を取得（顧客情報も含む）
  const devices = await Device.findAll({
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'customer_name']
      }
    ],
    order: [['device_name', 'ASC']]
  });
  
  // レスポンス形式を調整（CSVに適した形式に変換）
  const formattedDevices = devices.map(device => {
    return {
      id: device.id,
      device_name: device.device_name,
      customer_name: device.customer ? device.customer.customer_name : '',
      customer_id: device.customer_id,
      model: device.model || '',
      location: device.location || '',
      device_type: device.device_type,
      hardware_type: device.hardware_type,
      created_at: device.created_at,
      updated_at: device.updated_at
    };
  });
  
  // CSVフィールドの設定
  const fields = [
    { label: 'ID', value: 'id' },
    { label: '機器名', value: 'device_name' },
    { label: '顧客名', value: 'customer_name' },
    { label: '顧客ID', value: 'customer_id' },
    { label: 'モデル', value: 'model' },
    { label: '設置場所', value: 'location' },
    { label: '機器種別', value: 'device_type' },
    { label: 'ハードウェアタイプ', value: 'hardware_type' },
    { label: '作成日時', value: 'created_at' },
    { label: '更新日時', value: 'updated_at' }
  ];
  
  // JSON to CSV Parserの設定
  const json2csvParser = new Parser({ fields });
  
  // CSVに変換
  const csv = json2csvParser.parse(formattedDevices);
  
  // ファイル名の設定
  const date = new Date();
  const filename = `devices_export_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.csv`;
  
  // ヘッダーの設定
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  
  // CSVデータを送信
  res.send(csv);
});

module.exports = {
  exportDevicesToCsv
};
