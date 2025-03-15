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
  
  // Shift-JISエンコードされたファイルをデコード
  // iconv-liteを使用するため、先にrequireする
  const iconv = require('iconv-lite');
  const fileContent = iconv.decode(buffer, 'Shift_JIS');
  
  // 結果を保存する変数
  const results = {
    totalRows: 0,
    importedRows: 0,
    errors: [],
    importedDevices: []
  };
  
  // CSVを解析して行を取得
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
    
    // データベース処理を開始
    if (sequelize) {
      // トランザクションを開始
      const t = await sequelize.transaction();
      
      try {
        // 各行を処理
        for (const row of rows) {
          try {
            // 必須フィールドの確認
            if (!row['機器名'] && !row['@í¼']) {
              results.errors.push({
                row: row,
                error: '機器名が不足しています'
              });
              continue;
            }
            
            // データの取得 (Shift-JISで正しくデコードされているはず)
            const deviceName = row['機器名'] || '';
            const customerName = row['顧客名'] || '';
            const model = row['モデル'] || '';
            const location = row['設置場所'] || '';
            const deviceType = row['機器種別'] || 'サーバ';
            const hardwareType = row['ハードウェアタイプ'] || '物理';
            
            // 必須の値が不足している場合
            if (!deviceName) {
              results.errors.push({
                row: row,
                error: '機器名が不足しています'
              });
              continue;
            }
            
            if (!customerName) {
              results.errors.push({
                row: row,
                error: '顧客名が不足しています'
              });
              continue;
            }
            
            // 機器種別の検証
            const validDeviceTypes = ['サーバ', 'UPS', 'ネットワーク機器', 'その他'];
            const normalizedDeviceType = 
              validDeviceTypes.includes(deviceType) ? deviceType : 'サーバ';
            
            // ハードウェアタイプの検証
            const validHardwareTypes = ['物理', 'VM'];
            const normalizedHardwareType =
              validHardwareTypes.includes(hardwareType) ? hardwareType : '物理';
            
            // 顧客名から顧客IDを取得または新規作成
            let customer;
            
            // 顧客名から顧客を検索
            customer = await Customer.findOne({
              where: { customer_name: customerName }
            });
            
            // 顧客が存在しない場合は新規作成
            if (!customer) {
              customer = await Customer.create({
                customer_name: customerName
              }, { transaction: t });
            }
            
            const customerId = customer.id;
            
            // 既存のデバイスかどうかを確認 (IDで判断)
            let device;
            const deviceId = row['ID'] || row['id'];
            if (deviceId) {
              device = await Device.findByPk(deviceId);
            }
            
            // デバイスの作成または更新
            if (device) {
              // 既存のデバイスを更新
              device.customer_id = customerId;
              device.device_name = deviceName;
              device.model = model;
              device.location = location;
              device.device_type = normalizedDeviceType;
              device.hardware_type = normalizedHardwareType;
              
              await device.save({ transaction: t });
            } else {
              // 新規デバイスを作成
              device = await Device.create({
                customer_id: customerId,
                device_name: deviceName,
                model: model,
                location: location,
                device_type: normalizedDeviceType,
                hardware_type: normalizedHardwareType
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
        throw error;
      }
    } else {
      // sequelizeが初期化されていない場合
      res.status(500);
      throw new Error('データベース接続が初期化されていません');
    }
    
  } catch (error) {
    console.error('CSVインポートエラー:', error);
    res.status(500);
    throw new Error(`CSVのインポート中にエラーが発生しました: ${error.message}`);
  }
});

module.exports = {
  importDevicesFromCsv
};
