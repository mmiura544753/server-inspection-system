// server/controllers/inspectionItem/inspectionItemNameController.js
const asyncHandler = require('express-async-handler');
const { InspectionItemName, InspectionItem } = require('../../models');
const { sequelize } = require('../../config/db');
const { Op } = require('sequelize');

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

module.exports = {
  getAllInspectionItemNames,
  getInspectionItemNameById,
  createInspectionItemName,
  updateInspectionItemName,
  deleteInspectionItemName
};