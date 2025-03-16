// server/controllers/device/deviceImportController.js - sequelize問題修正版

const asyncHandler = require('express-async-handler');
const csvParse = require('csv-parse/sync');
const { Device, Customer } = require('../../models');
const { sequelize } = require('../../config/db'); // 正しくsequelizeをインポート

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
    
    // CSV文字列を直接パース (csv-parse/syncを使用)
    console.log('CSVの解析開始 (sync)');
    
    const records = csvParse.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`CSV解析完了: ${records.length}行のデータを検出`);
    
    if (records.length > 0) {
      console.log('最初の行のデータ例:', JSON.stringify(records[0]));
      console.log('使用可能なカラム:', Object.keys(records[0]).join(', '));
    }
    
    // 結果を保存する変数
    const results = {
      totalRows: records.length,
      importedRows: 0,
      errors: [],
      importedDevices: []
    };
    
    // 顧客キャッシュ (顧客名 -> 顧客オブジェクト)
    const customerCache = {};
    
    // トランザクション確認
    if (!sequelize) {
      console.error('sequelizeオブジェクトが初期化されていません');
      res.status(500);
      throw new Error('データベース接続が初期化されていません');
    }
    
    console.log('sequelizeオブジェクト状態:', {
      availableInModels: !!Device.sequelize,
      importedDirectly: !!sequelize
    });
    
    // トランザクションを開始
    const t = await sequelize.transaction();
    console.log('トランザクション開始成功:', !!t);
    
    try {
      console.log(`${records.length}行の処理を開始`);
      
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        console.log(`行 ${i+1}/${records.length} の処理中...`);
        
        try {
          // 機器名を取得 (様々なカラム名に対応)
          const deviceName = row['機器名'] || row['device_name'] || '';
          const customerName = row['顧客名'] || row['customer_name'] || '';
          const model = row['モデル'] || row['model'] || '';
          const location = row['設置場所'] || row['location'] || '';
          const deviceType = row['機器種別'] || row['device_type'] || 'サーバ';
          const hardwareType = row['ハードウェアタイプ'] || row['hardware_type'] || '物理';
          
          console.log(`処理中の行: 機器名="${deviceName}", 顧客名="${customerName}"`);
          
          // 必須フィールドの確認
          if (!deviceName) {
            throw new Error('機器名が不足しています');
          }
          if (!customerName) {
            throw new Error('顧客名が不足しています');
          }
          
          // 機器種別の検証
          const validDeviceTypes = ['サーバ', 'UPS', 'ネットワーク機器', 'その他'];
          const normalizedDeviceType = validDeviceTypes.includes(deviceType) ? deviceType : 'サーバ';
          
          // ハードウェアタイプの検証
          const validHardwareTypes = ['物理', 'VM'];
          const normalizedHardwareType = validHardwareTypes.includes(hardwareType) ? hardwareType : '物理';
          
          // 顧客を取得または作成
          let customer;
          
          // キャッシュから顧客を取得
          if (customerCache[customerName]) {
            customer = customerCache[customerName];
            console.log(`キャッシュから顧客を使用: ${customerName}`);
          } else {
            // データベースから顧客を検索
            customer = await Customer.findOne({
              where: { customer_name: customerName }
            });
            
            // 顧客が存在しない場合は新規作成
            if (!customer) {
              console.log(`新規顧客作成: ${customerName}`);
              customer = await Customer.create({
                customer_name: customerName
              }, { transaction: t });
            }
            
            // キャッシュに顧客を保存
            customerCache[customerName] = customer;
          }
          
          // 新規デバイスを作成
          const device = await Device.create({
            customer_id: customer.id,
            device_name: deviceName,
            model: model,
            location: location,
            device_type: normalizedDeviceType,
            hardware_type: normalizedHardwareType
          }, { transaction: t });
          
          console.log(`デバイス作成完了: ID=${device.id}, 名前=${deviceName}`);
          
          results.importedDevices.push({
            id: device.id,
            device_name: device.device_name,
            customer_name: customer.customer_name,
            customer_id: device.customer_id
          });
          
          results.importedRows++;
          
        } catch (err) {
          console.error(`行 ${i+1} の処理中にエラー:`, err.message);
          results.errors.push({
            row: row,
            error: err.message
          });
        }
      }
      
      // 全ての処理が完了したらコミット
      console.log('トランザクションをコミット');
      await t.commit();
      
      console.log(`インポート完了: ${results.importedRows}/${results.totalRows}行をインポート`);
      
      // 成功レスポンスを送信
      return res.status(200).json({
        message: `${results.importedRows}/${results.totalRows} 件のデータをインポートしました`,
        data: {
          importedRows: results.importedRows,
          totalRows: results.totalRows,
          errors: results.errors.length > 0 ? results.errors : undefined,
          importedDevices: results.importedDevices
        }
      });
      
    } catch (error) {
      // トランザクションエラーの場合はロールバック
      console.error('トランザクションエラーによりロールバック:', error);
      await t.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('CSVインポート処理中の致命的なエラー:', error);
    res.status(500);
    throw new Error(`CSVのインポート中にエラーが発生しました: ${error.message}`);
  }
});

module.exports = {
  importDevicesFromCsv
};
