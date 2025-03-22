// server/controllers/inspectionItem/inspectionItemNameController.js
const asyncHandler = require('express-async-handler');
const { InspectionItemName, InspectionItem } = require('../../models');
const { sequelize } = require('../../config/db');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const iconv = require('iconv-lite');

// @desc    点検項目名一覧の取得
// @route   GET /api/inspection-item-names
// @access  Public
const getAllInspectionItemNames = asyncHandler(async (req, res) => {
  try {
    const itemNames = await InspectionItemName.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json(itemNames);
  } catch (error) {
    console.error('点検項目名取得エラー:', error);
    res.status(500);
    throw new Error('点検項目名の取得に失敗しました');
  }
});

// @desc    IDによる点検項目名の取得
// @route   GET /api/inspection-item-names/:id
// @access  Public
const getInspectionItemNameById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  
  try {
    const itemName = await InspectionItemName.findByPk(id);
    
    if (!itemName) {
      res.status(404);
      throw new Error('点検項目名が見つかりません');
    }
    
    res.json(itemName);
  } catch (error) {
    console.error(`点検項目名ID:${id}の取得エラー:`, error);
    
    if (res.statusCode === 200) {
      res.status(500);
    }
    
    throw error;
  }
});

// @desc    点検項目名の新規作成
// @route   POST /api/inspection-item-names
// @access  Public
const createInspectionItemName = asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  // 入力バリデーション
  if (!name || name.trim() === '') {
    res.status(400);
    throw new Error('点検項目名は必須です');
  }
  
  try {
    // 既存チェック
    const existingName = await InspectionItemName.findOne({
      where: { name }
    });
    
    if (existingName) {
      res.status(400);
      throw new Error('同じ点検項目名がすでに存在します');
    }
    
    // 点検項目名を作成
    const newItemName = await InspectionItemName.create({ name });
    
    res.status(201).json(newItemName);
  } catch (error) {
    console.error('点検項目名作成エラー:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400);
      throw new Error('同じ点検項目名がすでに存在します');
    }
    
    if (error.name === 'SequelizeValidationError') {
      res.status(400);
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    
    if (res.statusCode === 200) {
      res.status(500);
    }
    
    throw error;
  }
});

// @desc    点検項目名の更新
// @route   PUT /api/inspection-item-names/:id
// @access  Public
const updateInspectionItemName = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  
  // 入力バリデーション
  if (!name || name.trim() === '') {
    res.status(400);
    throw new Error('点検項目名は必須です');
  }
  
  try {
    // 対象の点検項目名を取得
    const itemName = await InspectionItemName.findByPk(id);
    
    if (!itemName) {
      res.status(404);
      throw new Error('更新対象の点検項目名が見つかりません');
    }
    
    // 同名の項目がないか確認（自分自身は除外）
    const existingName = await InspectionItemName.findOne({
      where: { 
        name,
        id: { [Op.ne]: id }
      }
    });
    
    if (existingName) {
      res.status(400);
      throw new Error('同じ点検項目名がすでに存在します');
    }
    
    // 更新
    itemName.name = name;
    await itemName.save();
    
    res.json(itemName);
  } catch (error) {
    console.error(`点検項目名ID:${id}の更新エラー:`, error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400);
      throw new Error('同じ点検項目名がすでに存在します');
    }
    
    if (error.name === 'SequelizeValidationError') {
      res.status(400);
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    
    if (res.statusCode === 200) {
      res.status(500);
    }
    
    throw error;
  }
});

// @desc    点検項目名の削除
// @route   DELETE /api/inspection-item-names/:id
// @access  Public
const deleteInspectionItemName = asyncHandler(async (req, res) => {
  const id = req.params.id;
  
  try {
    // 対象の点検項目名を取得
    const itemName = await InspectionItemName.findByPk(id);
    
    if (!itemName) {
      res.status(404);
      throw new Error('削除対象の点検項目名が見つかりません');
    }
    
    // 使用中チェック
    const usageCount = await InspectionItem.count({
      where: { item_name_id: id }
    });
    
    if (usageCount > 0) {
      res.status(400);
      throw new Error(`この点検項目名は${usageCount}件の点検項目で使用されているため削除できません`);
    }
    
    // 削除
    await itemName.destroy();
    
    res.json({ message: '点検項目名を削除しました', id });
  } catch (error) {
    console.error(`点検項目名ID:${id}の削除エラー:`, error);
    
    if (res.statusCode === 200) {
      res.status(500);
    }
    
    throw error;
  }
});

// @desc    点検項目名一覧をCSVエクスポート
// @route   GET /api/inspection-item-names/export
// @access  Public
const exportInspectionItemNamesToCsv = asyncHandler(async (req, res) => {
  const encoding = req.query.encoding || 'shift_jis';
  
  try {
    // すべての点検項目名を取得（作成日時と更新日時は明示的に除外）
    const itemNames = await InspectionItemName.findAll({
      attributes: ['id', 'name'], // 明示的に必要なカラムのみを指定
      order: [['id', 'ASC']]
    });
    
    // CSVヘッダーとデータを設定（作成日時と更新日時は明示的に除外）
    const csvStringifier = createCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: '点検項目名' }
        // created_atとupdated_atは意図的に除外
      ]
    });
    
    // データをCSV形式に変換（作成日時と更新日時は除外）
    const records = itemNames.map(item => ({
      id: item.id,
      name: item.name
      // created_atとupdated_atは意図的に除外
    }));
    
    // 最初のレコードをログ出力（デバッグ用）
    if (records.length > 0) {
      console.log('エクスポートする最初のレコード:', records[0]);
      console.log('元のデータ（参考）:', {
        id: itemNames[0].id,
        name: itemNames[0].name,
        created_at: itemNames[0].created_at,
        updated_at: itemNames[0].updated_at
      });
    }
    
    // CSVデータを生成
    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    
    // エンコーディング処理
    const outputBuffer = iconv.encode(csvContent, encoding);
    
    // ファイル名を設定
    const fileName = `inspection_item_names_${new Date().toISOString().split('T')[0]}.csv`;
    
    // レスポンスヘッダーを設定してダウンロード
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(outputBuffer);

  } catch (error) {
    console.error('点検項目名エクスポートエラー:', error);
    res.status(500);
    throw new Error('点検項目名のエクスポートに失敗しました');
  }
});

// @desc    CSVファイルから点検項目名をインポート
// @route   POST /api/inspection-item-names/import
// @access  Public
const importInspectionItemNamesFromCsv = asyncHandler(async (req, res) => {
  console.log("点検項目名インポート処理開始: リクエスト受信");
  
  if (!req.file) {
    console.error("エラー: ファイルがアップロードされていません");
    res.status(400);
    throw new Error('CSVファイルを選択してください');
  }
  
  // CSVファイルのバッファを取得
  const buffer = req.file.buffer;
  console.log(`アップロードされたファイルサイズ: ${buffer.length} バイト`);
  
  try {
    // トランザクション開始
    const t = await sequelize.transaction();
    
    try {
      // Shift-JISエンコードされたファイルをデコード
      const fileContent = iconv.decode(buffer, 'shift_jis');
      console.log("ファイルのデコード完了");
      
      // 一時的なCSVパース処理
      // csvParse = require('csv-parse/sync') のように使える場合
      let csvData;
      try {
        const csvParse = require('csv-parse/sync');
        csvData = csvParse.parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true
        });
        console.log(`CSV解析完了: ${csvData.length}行のデータを検出`);
      } catch (parseError) {
        console.error("csv-parse/syncが利用できないため、代替手段を使用します", parseError);
        
        // csv-parserを使った代替処理
        const { Readable } = require('stream');
        const parser = csv({
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
        
        const parsePromise = new Promise((resolve, reject) => {
          const rows = [];
          parser.on('data', (data) => rows.push(data));
          parser.on('end', () => resolve(rows));
          parser.on('error', (error) => reject(error));
        });
        
        // 文字列からストリームを作成してパース
        const readableStream = Readable.from([fileContent]);
        readableStream.pipe(parser);
        
        csvData = await parsePromise;
        console.log(`CSV解析完了(代替手段): ${csvData.length}行のデータを検出`);
      }
      
      // インサート/アップデート用のカウンター
      let created = 0;
      let updated = 0;
      let errors = 0;
      
      // 各行を処理
      for (const row of csvData) {
        // データを抽出
        const id = row.ID || row.id;
        const name = row['点検項目名'] || row.name;
        
        if (!name || name.trim() === '') {
          errors++;
          continue;
        }
        
        // IDがある場合は更新、ない場合は新規作成
        if (id) {
          const itemName = await InspectionItemName.findByPk(id, { transaction: t });
          
          if (itemName) {
            // 同名チェック（自分以外）
            const duplicate = await InspectionItemName.findOne({
              where: {
                name,
                id: { [Op.ne]: id }
              },
              transaction: t
            });
            
            if (duplicate) {
              errors++;
              continue;
            }
            
            // 更新
            itemName.name = name;
            await itemName.save({ transaction: t });
            updated++;
          } else {
            // 指定IDが存在しない場合は新規作成
            const duplicate = await InspectionItemName.findOne({
              where: { name },
              transaction: t
            });
            
            if (duplicate) {
              errors++;
              continue;
            }
            
            await InspectionItemName.create({ name }, { transaction: t });
            created++;
          }
        } else {
          // 同名チェック
          const duplicate = await InspectionItemName.findOne({
            where: { name },
            transaction: t
          });
          
          if (duplicate) {
            errors++;
            continue;
          }
          
          // 新規作成
          await InspectionItemName.create({ name }, { transaction: t });
          created++;
        }
      }
      
      // コミット (一時ファイル削除は不要になった)
      await t.commit();
      
      // レスポンスを返す
      res.json({
        message: 'CSVインポートが完了しました',
        importedRows: created + updated,
        created,
        updated,
        errors
      });
      
    } catch (error) {
      // エラー時はロールバック
      await t.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('点検項目名インポートエラー:', error);
    res.status(500);
    throw new Error('点検項目名のインポートに失敗しました: ' + error.message);
  } // finallyブロックを削除 (メモリバッファを使用するため、ファイル削除は不要)
});

module.exports = {
  getAllInspectionItemNames,
  getInspectionItemNameById,
  createInspectionItemName,
  updateInspectionItemName,
  deleteInspectionItemName,
  exportInspectionItemNamesToCsv,
  importInspectionItemNamesFromCsv
};