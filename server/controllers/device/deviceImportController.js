// server/controllers/device/deviceImportController.js
const asyncHandler = require('express-async-handler');
const { parse } = require('fast-csv');
const { Device, Customer, sequelize } = require('../../models');

// @desc    CSVからの機器一覧のインポート
// @route   POST /api/devices/import
// @access  Public
const importDevicesFromCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('CSVファイルが提供されていません');
  }
  
  // CSVファイルのバッファを取得
  const buffer = req.file.buffer;
  const fileContent = buffer.toString();
  
  // 結果を保存する変数
  const results = {
    totalRows: 0,
    importedRows: 0,
    errors: [],
    importedDevices: []
  };
  
  // トランザクションを開始
  const t = await sequelize.transaction();
  
  try {
    // CSVを解析し、行ごとに処理
    const rows = await new Promise((resolve, reject) => {
      const rows = [];
      
      parse(fileContent, {
        headers: true,
        ignoreEmpty: true,
        trim: true,
        skipLines: 0 // ヘッダー行がある場合は0、ない場合は変更する
      })
        .on('error', error => reject(error))
        .on('data', row => rows.push(row))
        .on('end', () => resolve(rows));
    });
    
    results.totalRows = rows.length;
    
    // 各行を処理
    for (const row of rows) {
      try {
        // 必須フィールドの確認
        if (!row['機器名'] || !row['顧客名'] || !row['機器種別'] || !row['ハードウェアタイプ']) {
          results.errors.push({
            row: row,
            error: '必須フィールドが不足しています: 機器名、顧客名、機器種別、ハードウェアタイプ'
          });
          continue;
        }
        
        // 顧客名から顧客IDを取得または新規作成
        let customerId = row['顧客ID'];
        let customer;
        
        // 顧客IDが指定されている場合はその顧客を使用
        if (customerId) {
          customer = await Customer.findByPk(customerId);
          if (!customer) {
            results.errors.push({
              row: row,
              error: `指定された顧客ID: ${customerId} が存在しません`
            });
            continue;
          }
        } else {
          // 顧客名から顧客を検索
          customer = await Customer.findOne({
            where: { customer_name: row['顧客名'] }
          });
          
          // 顧客が存在しない場合は新規作成
          if (!customer) {
            customer = await Customer.create({
              customer_name: row['顧客名']
            }, { transaction: t });
          }
          
          customerId = customer.id;
        }
        
        // 既存のデバイスかどうかを確認
        let device;
        if (row['ID']) {
          device = await Device.findByPk(row['ID']);
        }
        
        // デバイスの作成または更新
        if (device) {
          // 既存のデバイスを更新
          device.customer_id = customerId;
          device.device_name = row['機器名'];
          device.model = row['モデル'] || '';
          device.location = row['設置場所'] || '';
          device.device_type = row['機器種別'];
          device.hardware_type = row['ハードウェアタイプ'];
          
          await device.save({ transaction: t });
        } else {
          // 新規デバイスを作成
          device = await Device.create({
            customer_id: customerId,
            device_name: row['機器名'],
            model: row['モデル'] || '',
            location: row['設置場所'] || '',
            device_type: row['機器種別'],
            hardware_type: row['ハードウェアタイプ']
          }, { transaction: t });
        }
        
        results.importedDevices.push({
          id: device.id,
          device_name: device.device_name,
          customer_name: customer.customer_name,
          customer_id: device.customer_id
        });
        
        results.importedRows++;
      } catch (err) {
        results.errors.push({
          row: row,
          error: err.message
        });
      }
    }
    
    // トランザクションをコミット
    await t.commit();
    
    res.status(200).json({
      message: `${results.importedRows}/${results.totalRows} 件のデータをインポートしました`,
      importedRows: results.importedRows,
      totalRows: results.totalRows,
      errors: results.errors.length > 0 ? results.errors : undefined,
      importedDevices: results.importedDevices
    });
    
  } catch (error) {
    // エラーが発生した場合はロールバック
    await t.rollback();
    res.status(500);
    throw new Error(`CSVのインポート中にエラーが発生しました: ${error.message}`);
  }
});

module.exports = {
  importDevicesFromCsv
};
