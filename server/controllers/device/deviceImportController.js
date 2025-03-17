// server/controllers/device/deviceImportController.js
const asyncHandler = require('express-async-handler');
const csvParse = require('csv-parse/sync');
const { Device, Customer } = require('../../models');
const { sequelize } = require('../../config/db');

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
    // 明示的にShift-JISでデコード
    const fileContent = iconv.decode(buffer, 'Shift_JIS');
    console.log('ファイルのデコード完了');
    console.log('ファイルの先頭部分:', fileContent.substring(0, 200));
    
    // CSV文字列を直接パース (csv-parse/syncを使用)
    console.log('CSVの解析開始 (sync)');
    
    const records = csvParse.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      // カラム名に関する問題を軽減するため、relaxColumnCountを有効化
      relax_column_count: true
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
    
    // トランザクションを開始
    const t = await sequelize.transaction();
    console.log('トランザクション開始成功:', !!t);
    
    try {
      console.log(`${records.length}行の処理を開始`);
      
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        console.log(`行 ${i+1}/${records.length} の処理中...`);
        
        try {
          // カラム名のマッピング関数 - 様々な可能性を考慮
          const getColumnValue = (possibleNames) => {
            for (const name of possibleNames) {
              // カラム名の前後の空白を削除して比較
              const trimmedName = name.trim();
              
              for (const key of Object.keys(row)) {
                // CSVから取得したカラム名も前後の空白を削除して比較
                if (key.trim() === trimmedName) {
                  const value = row[key];
                  return value !== undefined ? value.toString().trim() : '';
                }
              }
            }
            return '';
          };
          
          // 機器名を取得 - 日本語と英語の両方のカラム名に対応
          const deviceName = getColumnValue(['機器名', 'device_name', '機器名', '@í¼']);
          const customerName = getColumnValue(['顧客名', 'customer_name', '顧客名', 'Úq¼']);
          const model = getColumnValue(['モデル', 'model', 'f']);
          
          // ラックナンバーの処理 - 数値に変換できるかチェック
          let rackNumber = null;
          const rackNumberInput = getColumnValue(['設置ラックNo', 'rack_number', 'ラックNo', '設置ラックNo.']);
          
          console.log(`ラックナンバー取得値(生): "${rackNumberInput}"`);
          
          if (rackNumberInput && rackNumberInput.toString().trim() !== '') {
            // 数値に変換
            const parsedValue = parseInt(rackNumberInput, 10);
            if (!isNaN(parsedValue)) {
              rackNumber = parsedValue; // 明示的に整数として保存
              console.log(`ラックナンバーを整数に変換: ${rackNumber}`);
            } else {
              console.log(`ラックナンバーの変換に失敗: "${rackNumberInput}" は整数に変換できません`);
            }
          }

          const unitPosition = getColumnValue(['ユニット位置', 'unit_position', 'jbgÊu']);
          const deviceType = getColumnValue(['機器種別', 'device_type', '@ííÊ']);
          const hardwareType = getColumnValue(['ハードウェアタイプ', 'hardware_type', 'n[hEFA^Cv']);
          
          // デバッグログを出力
          console.log(`処理中の行: 機器名="${deviceName}", 顧客名="${customerName}", モデル="${model}", ラックNo=${rackNumber}, ユニット位置="${unitPosition}"`);

          // CSVからIDを読み取る
          const deviceId = getColumnValue(['ID', 'id']);

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

          // IDが指定されている場合は更新、ない場合は新規作成
          if (deviceId && !isNaN(parseInt(deviceId))) {
            // 既存の機器を検索
            const existingDevice = await Device.findByPk(parseInt(deviceId));
            
            if (existingDevice) {
              // 存在する場合は更新
              console.log(`ID=${deviceId}の機器を更新します: ${deviceName}`);
              
              existingDevice.customer_id = customer.id;
              existingDevice.device_name = deviceName;
              existingDevice.model = model;
              existingDevice.rack_number = rackNumber;
              existingDevice.unit_position = unitPosition;
              existingDevice.device_type = normalizedDeviceType;
              existingDevice.hardware_type = normalizedHardwareType;
              
              await existingDevice.save({ transaction: t });
              
              console.log(`デバイス更新完了: ID=${existingDevice.id}, 名前=${deviceName}`);

              results.importedDevices.push({
                id: existingDevice.id,
                device_name: existingDevice.device_name,
                customer_name: customer.customer_name,
                customer_id: existingDevice.customer_id,
                updated: true // 更新されたことを示すフラグ
              });
              
              results.importedRows++;
            } else {
              // 指定されたIDが存在しない場合はエラー
              console.error(`指定されたID: ${deviceId}の機器が存在しません`);
              results.errors.push({
                row: row,
                error: `指定されたID: ${deviceId}の機器が存在しません`
              });
            }
          } else {
            // IDがない場合は新規作成の処理を実行
            // 既存の機器をチェック（顧客ID、機器名、設置場所、ユニット位置の組み合わせ）
            const existingDevice = await Device.findOne({
              where: { 
                customer_id: customer.id,
                device_name: deviceName,
                rack_number: rackNumber,
                unit_position: unitPosition || ''
              }
            });

            if (existingDevice) {
              // 既存デバイスがある場合はスキップ
              console.log(`重複機器のためスキップ: ${deviceName} (${customer.customer_name})`);
              results.errors.push({
                row: row,
                error: '同じ顧客で同じ機器名、設置場所、ユニット位置の組み合わせがすでに存在します'
              });
            } else {
              // 新規デバイスを作成
              try {
                console.log(`新規デバイス作成: 顧客=${customer.id}, 機器名=${deviceName}, モデル=${model}, ラックNo=${rackNumber}, ユニット位置=${unitPosition}`);
                
                const device = await Device.create({
                  customer_id: customer.id,
                  device_name: deviceName,
                  model: model || null,
                  rack_number: rackNumber, // 数値または null
                  unit_position: unitPosition || '',
                  device_type: normalizedDeviceType,
                  hardware_type: normalizedHardwareType,
                  location: '' // location フィールドを明示的に空文字で初期化
                }, { transaction: t });
                
                console.log(`デバイス作成完了: ID=${device.id}, 名前=${deviceName}`);
                
                results.importedDevices.push({
                  id: device.id,
                  device_name: device.device_name,
                  customer_name: customer.customer_name,
                  customer_id: device.customer_id,
                  created: true // 新規作成されたことを示すフラグ
                });
                
                results.importedRows++;
              } catch (createError) {
                console.error(`デバイス作成エラー:`, createError);
                results.errors.push({
                  row: row,
                  error: `デバイス作成エラー: ${createError.message}`
                });
              }
            }
          }
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