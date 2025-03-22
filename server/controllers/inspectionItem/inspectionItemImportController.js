// server/controllers/inspectionItem/inspectionItemImportController.js
const asyncHandler = require('express-async-handler');
const csvParse = require('csv-parse/sync');
const { InspectionItem, Device, Customer, InspectionItemName } = require('../../models');
const { sequelize } = require('../../config/db');

// @desc    CSVからの点検項目一覧のインポート
// @route   POST /api/inspection-items/import
// @access  Public
const importInspectionItemsFromCsv = asyncHandler(async (req, res) => {
  console.log('点検項目インポート処理開始: リクエスト受信');
  
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
    
    // CSV文字列を直接パース
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
      importedItems: []
    };
    
    // デバイス、カスタマー、点検項目名のキャッシュ 
    const deviceCache = {}; // デバイス名 -> デバイスオブジェクト
    const customerCache = {}; // 顧客名 -> 顧客オブジェクト
    const itemNameCache = {}; // 点検項目名 -> 点検項目名マスタオブジェクト
    
    // 事前に全点検項目名マスタを取得してキャッシュ
    console.log('点検項目名マスタを取得中...');
    const allItemNames = await InspectionItemName.findAll();
    allItemNames.forEach(itemName => {
      itemNameCache[itemName.name] = itemName;
    });
    console.log(`${allItemNames.length}件の点検項目名マスタをキャッシュしました`);
    
    // トランザクションを開始
    const t = await sequelize.transaction();
    console.log('トランザクション開始成功:', !!t);
    
    try {
      console.log(`${records.length}行の処理を開始`);
      
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        console.log(`行 ${i+1}/${records.length} の処理中...`);
        
        try {
          // 点検項目名、機器名、顧客名を取得 (様々なカラム名に対応)
          const itemName = row['点検項目名'] || row['item_name'] || '';
          const deviceName = row['機器名'] || row['device_name'] || '';
          const customerName = row['顧客名'] || row['customer_name'] || '';
          // CSVからIDを読み取る
          const itemId = row['ID'] || row['id'] || null;
          
          console.log(`処理中の行: 項目名="${itemName}", 機器名="${deviceName}", 顧客名="${customerName}", ID=${itemId}`);
          
          // 必須フィールドの確認
          if (!itemName) {
            throw new Error('点検項目名が不足しています');
          }
          if (!deviceName) {
            throw new Error('機器名が不足しています');
          }
          if (!customerName) {
            throw new Error('顧客名が不足しています');
          }
          
          // 点検項目名からitem_name_idを取得
          let itemNameMaster;
          if (itemNameCache[itemName]) {
            // キャッシュから点検項目名マスタを取得
            itemNameMaster = itemNameCache[itemName];
            console.log(`キャッシュから点検項目名マスタを使用: ${itemName} (ID: ${itemNameMaster.id})`);
          } else {
            // データベースから点検項目名マスタを検索
            itemNameMaster = await InspectionItemName.findOne({
              where: { name: itemName }
            });
            
            // 点検項目名マスタが存在しない場合は新規作成
            if (!itemNameMaster) {
              console.log(`新規点検項目名マスタ作成: ${itemName}`);
              itemNameMaster = await InspectionItemName.create({
                name: itemName
              }, { transaction: t });
            }
            
            // キャッシュに点検項目名マスタを保存
            itemNameCache[itemName] = itemNameMaster;
          }
          
          // まず顧客を取得または作成
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
          
          // 次に、顧客に紐づく機器を取得または作成
          let device;
          // 複合キーでキャッシュを検索
          const deviceCacheKey = `${deviceName}_${customer.id}`;
          
          if (deviceCache[deviceCacheKey]) {
            device = deviceCache[deviceCacheKey];
            console.log(`キャッシュから機器を使用: ${deviceName}`);
          } else {
            // データベースから機器を検索
            device = await Device.findOne({
              where: { 
                device_name: deviceName,
                customer_id: customer.id
              }
            });
            
            // 機器が存在しない場合は新規作成
            if (!device) {
              console.log(`新規機器作成: ${deviceName}`);
              device = await Device.create({
                customer_id: customer.id,
                device_name: deviceName,
                device_type: 'サーバ', // デフォルト値
                hardware_type: '物理' // デフォルト値
              }, { transaction: t });
            }
            
            // キャッシュに機器を保存
            deviceCache[deviceCacheKey] = device;
          }

          // IDが指定されている場合は更新、ない場合は新規作成
          if (itemId) {
            // 既存の点検項目を検索
            const existingItem = await InspectionItem.findByPk(itemId);
            
            if (existingItem) {
              // 存在する場合は更新
              console.log(`ID=${itemId}の点検項目を更新します: ${itemName}`);
              
              existingItem.device_id = device.id;
              existingItem.item_name_id = itemNameMaster.id; // 点検項目名マスタIDを設定
              existingItem.item_name = itemName; // 旧フィールド互換性のため
              
              await existingItem.save({ transaction: t });
              
              console.log(`点検項目更新完了: ID=${existingItem.id}, 名前=${itemName}`);

              // 更新後の点検項目を結果に追加
              results.importedItems.push({
                id: existingItem.id,
                item_name: existingItem.item_name,
                device_name: device.device_name,
                customer_name: customer.customer_name,
                updated: true // 更新されたことを示すフラグ
              });
              
              results.importedRows++;
            } else {
              // 指定されたIDが存在しない場合はエラー
              console.error(`指定されたID: ${itemId}の点検項目が存在しません`);
              results.errors.push({
                row: row,
                error: `指定されたID: ${itemId}の点検項目が存在しません`
              });
            }
          } else {
            // IDがない場合は新規作成 - 重複チェック(device_id + item_name_id)を行う
            const existingItem = await InspectionItem.findOne({
              where: {
                device_id: device.id,
                item_name_id: itemNameMaster.id
              }
            });

            if (existingItem) {
              // 既存項目がある場合はスキップ
              console.log(`重複点検項目のためスキップ: ${itemName} (${device.device_name})`);
              results.errors.push({
                row: row,
                error: '同じ機器に対して同じ点検項目名がすでに存在します'
              });
            } else {
              // 最後に、点検項目を作成
              const inspectionItem = await InspectionItem.create({
                device_id: device.id,
                item_name_id: itemNameMaster.id, // 点検項目名マスタIDを設定
                item_name: itemName // 旧フィールド互換性のため
              }, { transaction: t });
              
              console.log(`点検項目作成完了: ID=${inspectionItem.id}, 名前=${itemName}`);
              
              results.importedItems.push({
                id: inspectionItem.id,
                item_name: inspectionItem.item_name,
                device_name: device.device_name,
                customer_name: customer.customer_name,
                created: true // 新規作成されたことを示すフラグ
              });
              
              results.importedRows++;
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
          importedItems: results.importedItems
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
  importInspectionItemsFromCsv
};