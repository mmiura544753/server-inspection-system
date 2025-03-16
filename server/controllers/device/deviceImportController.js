// server/controllers/device/deviceImportController.js
const asyncHandler = require('express-async-handler');
const { parse } = require('fast-csv');
const { Device, Customer, sequelize } = require('../../models');

// @desc    CSVからの機器一覧のインポート
// @route   POST /api/devices/import
// @access  Public
const importDevicesFromCsv = asyncHandler(async (req, res) => {
  console.log('インポート処理開始: リクエスト受信');
  
  if (!req.file) {
    console.error('エラー: ファイルがアップロードされていません');
    res.status(400);
    throw new Error('CSVファイルが提供されていません');
  }
  
  // CSVファイルのバッファを取得
  const buffer = req.file.buffer;
  console.log(`アップロードされたファイルサイズ: ${buffer.length} バイト`);
  
  try {
    // Shift-JISエンコードされたファイルをデコード
    const iconv = require('iconv-lite');
    const fileContent = iconv.decode(buffer, 'Shift_JIS');
    console.log('ファイルのデコード完了');
    console.log('ファイルの先頭部分:', fileContent.substring(0, 200));
    
    // 結果を保存する変数
    const results = {
      totalRows: 0,
      importedRows: 0,
      errors: [],
      importedDevices: []
    };
    
    // CSVを解析して行を取得
    console.log('CSVの解析開始');
    const rows = await new Promise((resolve, reject) => {
      const rows = [];
      
      parse(fileContent, {
        headers: true,
        ignoreEmpty: true,
        trim: true,
        skipLines: 0 // ヘッダー行がある場合は0、ない場合は変更する
      })
        .on('error', error => {
          console.error('CSV解析エラー:', error);
          reject(error);
        })
        .on('data', row => {
          rows.push(row);
        })
        .on('end', () => {
          console.log(`CSV解析完了: ${rows.length}行のデータを検出`);
          console.log('最初の行のデータ例:', JSON.stringify(rows[0] || {}));
          resolve(rows);
        });
    });
    
    results.totalRows = rows.length;
    
    // データベース処理を開始
    if (sequelize) {
      console.log('データベース処理開始');
      // トランザクションを開始
      const t = await sequelize.transaction();
      
      try {
        // 各行を処理
        for (const row of rows) {
          try {
            // 必須フィールドの確認
            if (!row['機器名'] && !row['device_name']) {
              console.log('機器名が不足している行:', JSON.stringify(row));
              results.errors.push({
                row: row,
                error: '機器名が不足しています'
              });
              continue;
            }
            
            // データの取得
            const deviceName = row['機器名'] || row['device_name'] || '';
            const customerName = row['顧客名'] || row['customer_name'] || '';
            const model = row['モデル'] || row['model'] || '';
            const location = row['設置場所'] || row['location'] || '';
            const deviceType = row['機器種別'] || row['device_type'] || 'サーバ';
            const hardwareType = row['ハードウェアタイプ'] || row['hardware_type'] || '物理';
            
            console.log(`処理中の行: 機器名=${deviceName}, 顧客名=${customerName}`);
            
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
            console.log(`顧客を検索/作成: ${customerName}`);
            let customer;
            
            // 顧客名から顧客を検索
            customer = await Customer.findOne({
              where: { customer_name: customerName }
            });
            
            // 顧客が存在しない場合は新規作成
            if (!customer) {
              console.log(`新規顧客作成: ${customerName}`);
              customer = await Customer.create({
                customer_name: customerName
              }, { transaction: t });
            } else {
              console.log(`既存顧客を利用: ID=${customer.id}, 名前=${customer.customer_name}`);
            }
            
            const customerId = customer.id;
            
            // 既存のデバイスかどうかを確認 (IDで判断)
            let device;
            const deviceId = row['ID'] || row['id'];
            if (deviceId) {
              console.log(`デバイスIDが指定されています: ${deviceId}`);
              device = await Device.findByPk(deviceId);
              
              if (device) {
                console.log(`既存デバイスが見つかりました: ID=${device.id}`);
              } else {
                console.log(`指定されたID=${deviceId}のデバイスは見つかりませんでした`);
              }
            }
            
            // デバイスの作成または更新
            if (device) {
              // 既存のデバイスを更新
              console.log(`デバイスを更新: ID=${device.id}, 名前=${deviceName}`);
              device.customer_id = customerId;
              device.device_name = deviceName;
              device.model = model;
              device.location = location;
              device.device_type = normalizedDeviceType;
              device.hardware_type = normalizedHardwareType;
              
              await device.save({ transaction: t });
            } else {
              // 新規デバイスを作成
              console.log(`新規デバイスを作成: 名前=${deviceName}`);
              device = await Device.create({
                customer_id: customerId,
                device_name: deviceName,
                model: model,
                location: location,
                device_type: normalizedDeviceType,
                hardware_type: normalizedHardwareType
              }, { transaction: t });
              
              console.log(`デバイス作成完了: ID=${device.id}`);
            }
            
            results.importedDevices.push({
              id: device.id,
              device_name: device.device_name,
              customer_name: customer.customer_name,
              customer_id: device.customer_id
            });
            
            results.importedRows++;
          } catch (err) {
            console.error('行の処理中にエラー:', err);
            results.errors.push({
              row: row,
              error: err.message
            });
          }
        }
        
        // トランザクションをコミット
        await t.commit();
        console.log(`インポート処理完了: ${results.importedRows}/${results.totalRows}件を処理`);
        
        res.status(200).json({
          message: `${results.importedRows}/${results.totalRows} 件のデータをインポートしました`,
          data: {
            importedRows: results.importedRows,
            totalRows: results.totalRows,
            errors: results.errors.length > 0 ? results.errors : undefined,
            importedDevices: results.importedDevices
          }
        });
        
      } catch (error) {
        // エラーが発生した場合はロールバック
        console.error('トランザクションエラー:', error);
        await t.rollback();
        throw error;
      }
    } else {
      // sequelizeが初期化されていない場合
      console.error('エラー: データベース接続が初期化されていません');
      res.status(500);
      throw new Error('データベース接続が初期化されていません');
    }
    
  } catch (error) {
    console.error('CSVインポート処理中の重大なエラー:', error);
    res.status(500);
    throw new Error(`CSVのインポート中にエラーが発生しました: ${error.message}`);
  }
});

module.exports = {
  importDevicesFromCsv
};
