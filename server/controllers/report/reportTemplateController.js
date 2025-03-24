// server/controllers/report/reportTemplateController.js
const asyncHandler = require('express-async-handler');
const { ReportTemplate } = require('../../models');
const fs = require('fs');
const path = require('path');

/**
 * @desc    全テンプレート取得
 * @route   GET /api/reports/templates
 * @access  Public
 */
const getAllTemplates = asyncHandler(async (req, res) => {
  const templates = await ReportTemplate.findAll({
    order: [['name', 'ASC']]
  });

  res.json(templates);
});

/**
 * @desc    テンプレート詳細取得
 * @route   GET /api/reports/templates/:id
 * @access  Public
 */
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await ReportTemplate.findByPk(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('テンプレートが見つかりません');
  }

  res.json(template);
});

/**
 * @desc    テンプレート作成
 * @route   POST /api/reports/templates
 * @access  Public
 */
const createTemplate = asyncHandler(async (req, res) => {
  const { name, type, template_content } = req.body;

  if (!name || !type || !template_content) {
    res.status(400);
    throw new Error('必須項目が不足しています');
  }

  // テンプレートの保存先を設定
  const templatesDir = path.join(__dirname, '../../templates/reports');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
  const filePath = path.join(templatesDir, fileName);

  // テンプレート内容をファイルに保存
  fs.writeFileSync(filePath, JSON.stringify(template_content, null, 2));

  // テンプレート情報をDBに保存
  const template = await ReportTemplate.create({
    name,
    type,
    template_path: `templates/reports/${fileName}`
  });

  res.status(201).json(template);
});

/**
 * @desc    テンプレート更新
 * @route   PUT /api/reports/templates/:id
 * @access  Public
 */
const updateTemplate = asyncHandler(async (req, res) => {
  const { name, type, template_content } = req.body;
  const template = await ReportTemplate.findByPk(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('テンプレートが見つかりません');
  }

  // 既存のテンプレートファイルパスを取得
  let templatePath = template.template_path;

  // 新しいテンプレート内容がある場合はファイルを更新
  if (template_content) {
    // 新しいファイル名を生成
    if (name && name !== template.name) {
      const templatesDir = path.join(__dirname, '../../templates/reports');
      const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
      templatePath = `templates/reports/${fileName}`;

      // 新しいファイルに内容を保存
      fs.writeFileSync(path.join(templatesDir, fileName), JSON.stringify(template_content, null, 2));

      // 古いファイルがあれば削除
      const oldFilePath = path.join(__dirname, '../../', template.template_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    } else {
      // 同じファイル名で上書き
      const filePath = path.join(__dirname, '../../', templatePath);
      fs.writeFileSync(filePath, JSON.stringify(template_content, null, 2));
    }
  }

  // テンプレート情報を更新
  await template.update({
    name: name || template.name,
    type: type || template.type,
    template_path: templatePath
  });

  res.json(template);
});

/**
 * @desc    テンプレート削除
 * @route   DELETE /api/reports/templates/:id
 * @access  Public
 */
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await ReportTemplate.findByPk(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('テンプレートが見つかりません');
  }

  // ファイルが存在する場合は削除
  const filePath = path.join(__dirname, '../../', template.template_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await template.destroy();

  res.json({ message: 'テンプレートが削除されました' });
});

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};