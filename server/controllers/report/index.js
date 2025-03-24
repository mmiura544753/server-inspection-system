// server/controllers/report/index.js
const generatedReportController = require('./generatedReportController');
const reportGenerationController = require('./reportGenerationController');
const reportTemplateController = require('./reportTemplateController');

module.exports = {
  generatedReportController,
  reportGenerationController,
  reportTemplateController
};