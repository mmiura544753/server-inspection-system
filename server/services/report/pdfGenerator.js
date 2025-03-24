// server/services/report/pdfGenerator.js
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { 
  Customer, 
  Device, 
  Inspection, 
  InspectionResult, 
  InspectionItem, 
  InspectionItemName,
  ReportTemplate 
} = require('../../models');
const TemplateEngine = require('./templateEngine');
const opentype = require('opentype.js');

/**
 * PDFレポート生成サービス
 */
class PDFGenerator {
  /**
   * PDFレポートを生成する
   * @param {Object} reportData - レポートデータ
   * @param {string} outputPath - 出力パス
   * @returns {Promise<string>} - 生成されたファイルのパス
   */
  static async generateReport(reportData, outputPath) {
    const { 
      customerId, 
      reportType, 
      reportPeriod, 
      reportDate,
      title = '点検報告書',
      templateId = null
    } = reportData;

    try {
      // 顧客情報の取得
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new Error('顧客情報が見つかりません');
      }

      // テンプレート情報を取得
      let templatePath;
      if (templateId) {
        const templateRecord = await ReportTemplate.findByPk(templateId);
        if (!templateRecord) {
          throw new Error('指定されたテンプレートが見つかりません');
        }
        templatePath = templateRecord.template_path;
      } else {
        templatePath = TemplateEngine.getDefaultTemplatePath(reportType);
      }

      // テンプレートを読み込む
      const template = TemplateEngine.loadTemplate(templatePath);
      if (!TemplateEngine.validateTemplate(template)) {
        throw new Error('無効なテンプレート形式です');
      }

      // 日付から期間を特定
      let startDate, endDate;
      if (reportType === 'daily') {
        const date = new Date(reportDate);
        startDate = new Date(date.setHours(0, 0, 0, 0));
        endDate = new Date(date.setHours(23, 59, 59, 999));
      } else if (reportType === 'monthly') {
        // 期間から月を特定（例: 2025年03月 または 2025-03 形式）
        let year, month;
        
        if (reportPeriod.includes('年') && reportPeriod.includes('月')) {
          // 「2025年03月」形式
          const matched = reportPeriod.match(/(\d+)年(\d+)月/);
          if (matched) {
            year = parseInt(matched[1], 10);
            month = parseInt(matched[2], 10);
          }
        } else if (reportPeriod.includes('-')) {
          // 「2025-03」形式
          [year, month] = reportPeriod.split('-').map(num => parseInt(num, 10));
        }
        
        if (isNaN(year) || isNaN(month)) {
          throw new Error('無効な期間形式です。YYYY年MM月または YYYY-MM形式で指定してください');
        }
        
        startDate = new Date(year, month - 1, 1, 0, 0, 0);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
      } else {
        throw new Error('無効なレポートタイプです');
      }

      // 点検データの取得
      const inspections = await Inspection.findAll({
        where: {
          inspection_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: InspectionResult,
            as: 'results',
            include: [
              {
                model: Device,
                as: 'result_device'
              },
              {
                model: InspectionItem,
                as: 'inspection_item',
                include: [
                  {
                    model: InspectionItemName,
                    as: 'item_name_master'
                  }
                ]
              }
            ]
          }
        ],
        order: [['inspection_date', 'DESC']]
      });

      // 出力ディレクトリの確認・作成
      const dirPath = path.dirname(outputPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // レンダリングデータの作成
      const renderData = {
        title,
        customer,
        reportType,
        reportPeriod,
        reportDate,
        inspections
      };

      // テンプレートとデータを結合
      const mergedData = TemplateEngine.mergeTemplateWithData(template, renderData);

            // 日本語フォントのパスを取得
      const ipaexgPath = path.join(__dirname, '../../fonts/ipaexg.ttf');
      const ipaexmPath = path.join(__dirname, '../../fonts/ipaexm.ttf');
      
      // PDFドキュメントの作成
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: mergedData.title,
          Author: 'サーバー点検システム',
          Subject: `${reportType === 'daily' ? '日次' : '月次'}点検レポート`,
          Keywords: '点検,サーバー,レポート',
          CreationDate: new Date()
        }
      });
      
      // IPAexゴシックフォントを登録して使用
      if (fs.existsSync(ipaexgPath) && fs.existsSync(ipaexmPath)) {
        doc.registerFont('IPAexGothic', ipaexgPath);
        doc.registerFont('IPAexGothic-Bold', ipaexgPath);
        doc.registerFont('IPAexMincho', ipaexmPath);
        doc.font('IPAexGothic');
        console.log('IPAexフォントを使用します');
      } else {
        console.warn('IPAexフォントが見つかりません。デフォルトフォントを使用します。');
        doc.font('Helvetica');
      }
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);
      
      // レポートの生成
      await this._renderPDF(doc, mergedData);
      
      // ドキュメントの終了
      doc.end();
      
      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve(outputPath);
        });
        
        stream.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error('PDF生成エラー:', error);
      throw error;
    }
  }
  
  /**
   * PDFをレンダリングする
   * @param {PDFDocument} doc - PDFドキュメント
   * @param {Object} data - レンダリングデータ
   */
  static async _renderPDF(doc, data) {
    try {
      // ヘッダー
      this._renderHeader(doc, data);
      
      // セクション
      for (const section of data.sections) {
        // ページの残りスペースをチェック
        if (doc.y > doc.page.height - 150) {
          doc.addPage();
        }
        
        await this._renderSection(doc, section);
      }
      
      // フッター
      this._renderFooter(doc, data.footer);
    } catch (error) {
      console.error('レンダリングエラー:', error);
      throw error;
    }
  }
  
  /**
   * ヘッダーをレンダリングする
   * @param {PDFDocument} doc - PDFドキュメント
   * @param {Object} data - ヘッダーデータ
   */
  static _renderHeader(doc, data) {
    // タイトル
    doc.fontSize(20)
       .font('IPAexGothic-Bold')
       .text(data.title, { align: 'center' })
       .moveDown();
    
    // 顧客情報
    doc.fontSize(12)
       .font('IPAexGothic')
       .text(`顧客名: ${data.customerName}`)
       .text(`期間: ${data.reportPeriod}`)
       .text(`報告日: ${new Date(data.reportDate).toLocaleDateString('ja-JP')}`)
       .moveDown(2);
    
    // 区切り線
    doc.moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke()
       .moveDown();
  }
  
  /**
   * セクションをレンダリングする
   * @param {PDFDocument} doc - PDFドキュメント
   * @param {Object} section - セクションデータ
   */
  static async _renderSection(doc, section) {
    // セクションタイトル
    doc.fontSize(14)
       .font('IPAexGothic-Bold')
       .text(section.title, { underline: true })
       .moveDown();
    
    // セクションタイプに応じたレンダリング
    switch (section.type) {
      case 'summary':
        this._renderSummarySection(doc, section.content);
        break;
      
      case 'results_table':
        await this._renderResultsTableSection(doc, section.content);
        break;
      
      case 'issues':
        this._renderIssuesSection(doc, section.content);
        break;
      
      case 'monthly_summary':
        this._renderMonthlySummarySection(doc, section.content);
        break;
      
      case 'daily_counts':
        this._renderDailyCountsSection(doc, section.content);
        break;
        
      case 'issue_devices':
        this._renderIssueDevicesSection(doc, section.content);
        break;
        
      case 'issue_trends':
        this._renderIssueTrendsSection(doc, section.content);
        break;
      
      case 'recommendations':
        this._renderRecommendationsSection(doc, section.content);
        break;
        
      case 'notes':
        this._renderNotesSection(doc, section.content);
        break;
      
      default:
        doc.fontSize(12)
           .font('Courier')
           .text(`不明なセクションタイプ: ${section.type}`)
           .moveDown();
    }
    
    doc.moveDown(2);
  }
  
  /**
   * 点検概要セクションをレンダリング
   */
  static _renderSummarySection(doc, content) {
    doc.fontSize(12)
       .font('IPAexGothic')
       .text(`点検実施件数: ${content.inspectionCount}件`)
       .text(`点検実施日: ${content.date}`)
       .text(`点検担当者: ${content.inspectorNames}`)
       .moveDown();
  }
  
  /**
   * 結果テーブルセクションをレンダリング
   */
  static async _renderResultsTableSection(doc, content) {
    const { rows } = content;
    
    if (!rows || rows.length === 0) {
      doc.fontSize(12)
         .font('IPAexGothic')
         .text('点検結果データがありません')
         .moveDown();
      return;
    }
    
    // シンプルなテーブル描画
    let yPos = doc.y + 10;
    const xPos = [50, 170, 370, 430];
    const colWidths = [120, 200, 60, 120];
    
    // ヘッダー行
    doc.font('IPAexGothic-Bold').fontSize(10);
    doc.text('機器', xPos[0], yPos, { width: colWidths[0] });
    doc.text('点検項目', xPos[1], yPos, { width: colWidths[1] });
    doc.text('結果', xPos[2], yPos, { width: colWidths[2], align: 'center' });
    doc.text('備考', xPos[3], yPos, { width: colWidths[3] });
    
    // 区切り線
    yPos += 15;
    doc.moveTo(xPos[0], yPos).lineTo(xPos[0] + 500, yPos).stroke();
    yPos += 5;
    
    // データ行
    doc.font('IPAexGothic').fontSize(9);
    for (const row of rows) {
      try {
        // 固定の行の高さを使用
        const lineHeight = 15;
        const rowHeight = lineHeight * 2; // 2行分のスペース
        
        // 新しいページが必要かチェック
        if (yPos + rowHeight > doc.page.height - 50) {
          doc.addPage();
          yPos = 50;
          
          // 新しいページにヘッダーを追加
          doc.font('IPAexGothic-Bold').fontSize(10);
          doc.text('機器', xPos[0], yPos, { width: colWidths[0] });
          doc.text('点検項目', xPos[1], yPos, { width: colWidths[1] });
          doc.text('結果', xPos[2], yPos, { width: colWidths[2], align: 'center' });
          doc.text('備考', xPos[3], yPos, { width: colWidths[3] });
          
          // 区切り線
          yPos += 15;
          doc.moveTo(xPos[0], yPos).lineTo(xPos[0] + 500, yPos).stroke();
          yPos += 5;
          doc.font('IPAexGothic').fontSize(9);
        }
        
        // データをレンダリング
        doc.text(row.device || '不明', xPos[0], yPos, { width: colWidths[0] });
        doc.text(row.item || '不明', xPos[1], yPos, { width: colWidths[1] });
        doc.text(row.status || '不明', xPos[2], yPos, { width: colWidths[2], align: 'center' });
        doc.text(row.remarks || '', xPos[3], yPos, { width: colWidths[3] });
        
        // 次の行の位置
        yPos += rowHeight;
      } catch (error) {
        console.error('行のレンダリングエラー:', error);
        // エラーが発生しても続行
        yPos += 20;
      }
    }
  }
  
  /**
   * 異常項目セクションをレンダリング
   */
  static _renderIssuesSection(doc, content) {
    const { issues } = content;
    
    if (!issues || issues.length === 0) {
      doc.fontSize(12)
         .font('IPAexGothic')
         .text('異常項目はありません')
         .moveDown();
      return;
    }
    
    try {
      // テーブルのレイアウト調整
      const colStart = [50, 180, 330, 430];
      const colWidths = [120, 140, 90, 80];
      const lineHeight = 20;
      
      // ヘッダー行
      const tableTop = doc.y;
      doc.fontSize(10).font('IPAexGothic-Bold');
      doc.text('機器', colStart[0], tableTop);
      doc.text('点検項目', colStart[1], tableTop);
      doc.text('日時', colStart[2], tableTop);
      doc.text('点検者', colStart[3], tableTop);
      
      // 区切り線
      doc.y += 15;
      doc.moveTo(50, doc.y).lineTo(530, doc.y).stroke();
      doc.y += 10;
      
      // 結果行
      doc.fontSize(9).font('IPAexGothic');
      for (const issue of issues) {
        const startY = doc.y;
        
        // 各列のテキストを描画
        doc.text(issue.device || '不明', colStart[0], startY, { width: colWidths[0] });
        doc.text(issue.item || '不明', colStart[1], startY, { width: colWidths[1] });
        doc.text(issue.date || '不明', colStart[2], startY, { width: colWidths[2] });
        doc.text(issue.inspector || '不明', colStart[3], startY, { width: colWidths[3] });
        
        // 最大の高さを計算（heightOfStringが利用できない場合のフォールバック）
        let endY;
        try {
          endY = Math.max(
            startY + (doc.heightOfString ? doc.heightOfString(issue.device || '不明', { width: colWidths[0] }) : 15),
            startY + (doc.heightOfString ? doc.heightOfString(issue.item || '不明', { width: colWidths[1] }) : 15),
            startY + (doc.heightOfString ? doc.heightOfString(issue.date || '不明', { width: colWidths[2] }) : 15),
            startY + (doc.heightOfString ? doc.heightOfString(issue.inspector || '不明', { width: colWidths[3] }) : 15)
          );
        } catch (e) {
          // フォールバック値として固定高さを使用
          endY = startY + 25;
        }
        
        doc.y = endY + 5;
        
        // 備考がある場合
        if (issue.note && issue.note !== '---') {
          doc.text(`備考: ${issue.note}`, colStart[0] + 20, doc.y, { width: 460 });
          doc.y += 10;
        }
        
        // 項目間の区切り線
        doc.moveTo(50, doc.y).lineTo(530, doc.y).stroke().dash(1, { space: 1 });
        doc.y += 10;
        
        // ページの残りスペースをチェック
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          doc.fontSize(10).font('IPAexGothic-Bold')
            .text('異常項目 (続き):', 50, 50)
            .moveDown();
          doc.fontSize(9).font('IPAexGothic');
        }
      }
    } catch (error) {
      console.error('異常項目セクションエラー:', error);
      // エラーが発生してもとりあえず続行
      doc.font('IPAexGothic')
        .fontSize(10)
        .text('異常項目データの表示中にエラーが発生しました', { color: 'red' })
        .moveDown();
    }
  }
  
  /**
   * 月次概要セクションをレンダリング
   */
  static _renderMonthlySummarySection(doc, content) {
    doc.fontSize(12)
       .font('IPAexGothic')
       .text(`対象期間: ${content.period}`)
       .text(`点検合計件数: ${content.totalInspections}件`)
       .text(`検出された異常: ${content.totalIssues}件`)
       .moveDown();
    
    // 機器別サマリーがある場合
    if (content.deviceSummary && content.deviceSummary.length > 0) {
      doc.fontSize(11)
         .font('IPAexGothic-Bold')
         .text('機器別点検件数:')
         .moveDown(0.5);
      
      for (const item of content.deviceSummary) {
        doc.fontSize(10)
           .font('IPAexGothic')
           .text(`${item.device}: ${item.count}件`, { indent: 20 });
      }
      
      doc.moveDown();
    }
  }
  
  /**
   * 日別点検数セクションをレンダリング
   */
  static _renderDailyCountsSection(doc, content) {
    const { dailyCounts } = content;
    
    if (!dailyCounts || dailyCounts.length === 0) {
      doc.fontSize(12)
         .font('IPAexGothic')
         .text('日別点検データがありません')
         .moveDown();
      return;
    }
    
    // テーブルヘッダー
    const tableTop = doc.y;
    const tableLeft = 100;
    doc.fontSize(10);
    
    // ヘッダー行
    doc.font('IPAexGothic-Bold')
       .text('日付', tableLeft, tableTop)
       .text('点検数', tableLeft + 150, tableTop)
       .moveDown();
    
    // データ行
    let rowTop = doc.y;
    for (const item of dailyCounts) {
      // 日付を日本語表記に変換
      const dateObj = new Date(item.date);
      const japaneseDate = dateObj.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      doc.font('IPAexGothic')
         .text(japaneseDate, tableLeft, rowTop)
         .text(item.count.toString(), tableLeft + 150, rowTop);
      
      rowTop = doc.y + 5;
      
      // ページの残りスペースをチェック
      if (rowTop > doc.page.height - 100) {
        doc.addPage();
        doc.font('IPAexGothic-Bold')
           .text('日別点検数 (続き):', 50, 50)
           .moveDown();
        rowTop = doc.y;
      }
    }
  }
  
  /**
   * 異常検出機器セクションをレンダリング
   */
  static _renderIssueDevicesSection(doc, content) {
    const { issueDevices } = content;
    
    if (!issueDevices || issueDevices.length === 0) {
      doc.fontSize(12)
         .font('IPAexGothic')
         .text('異常検出機器データがありません')
         .moveDown();
      return;
    }
    
    // テーブルヘッダー
    const tableTop = doc.y;
    const tableLeft = 50;
    doc.fontSize(10);
    
    // ヘッダー行
    doc.font('IPAexGothic-Bold')
       .text('機器名', tableLeft, tableTop)
       .text('異常件数', tableLeft + 200, tableTop)
       .text('異常項目', tableLeft + 300, tableTop)
       .moveDown();
    
    // データ行
    let rowTop = doc.y;
    for (const device of issueDevices) {
      doc.font('IPAexGothic')
         .text(device.device, tableLeft, rowTop, { width: 190 })
         .text(device.count.toString(), tableLeft + 200, rowTop)
         .text(device.items, tableLeft + 300, rowTop, { width: 240 });
      
      rowTop = doc.y + 8;
      
      // ページの残りスペースをチェック
      if (rowTop > doc.page.height - 100) {
        doc.addPage();
        doc.font('IPAexGothic-Bold')
           .text('異常検出機器 (続き):', 50, 50)
           .moveDown();
        rowTop = doc.y;
      }
    }
  }
  
  /**
   * 異常傾向セクションをレンダリング
   */
  static _renderIssueTrendsSection(doc, content) {
    const { issueTrends } = content;
    
    if (!issueTrends || issueTrends.length === 0) {
      doc.fontSize(12)
         .font('IPAexGothic')
         .text('異常傾向データがありません')
         .moveDown();
      return;
    }
    
    // テーブルヘッダー
    const tableTop = doc.y;
    const tableLeft = 100;
    doc.fontSize(10);
    
    // ヘッダー行
    doc.font('IPAexGothic-Bold')
       .text('点検項目', tableLeft, tableTop)
       .text('異常件数', tableLeft + 250, tableTop)
       .moveDown();
    
    // データ行
    let rowTop = doc.y;
    for (const trend of issueTrends) {
      doc.font('IPAexGothic')
         .text(trend.item, tableLeft, rowTop, { width: 240 })
         .text(trend.count.toString(), tableLeft + 250, rowTop);
      
      rowTop = doc.y + 5;
      
      // ページの残りスペースをチェック
      if (rowTop > doc.page.height - 100) {
        doc.addPage();
        doc.font('IPAexGothic-Bold')
           .text('異常傾向 (続き):', 50, 50)
           .moveDown();
        rowTop = doc.y;
      }
    }
  }
  
  /**
   * 推奨メンテナンスセクションをレンダリング
   */
  static _renderRecommendationsSection(doc, content) {
    const { recommendations } = content;
    
    if (!recommendations || recommendations.length === 0) {
      doc.fontSize(12)
         .font('IPAexGothic')
         .text('推奨メンテナンス項目はありません')
         .moveDown();
      return;
    }
    
    doc.fontSize(11)
       .font('IPAexGothic')
       .text('以下のメンテナンスを推奨します:')
       .moveDown();
    
    let itemCount = 1;
    for (const rec of recommendations) {
      doc.fontSize(11)
         .font('IPAexGothic-Bold')
         .text(`${itemCount}. ${rec.target}`, { continued: true })
         .font('IPAexGothic')
         .text(` (${rec.type === 'device' ? '機器' : '点検項目'})`)
         .fontSize(10)
         .text(`原因: ${rec.reason}`, { indent: 20 })
         .text(`推奨: ${rec.recommendation}`, { indent: 20 })
         .moveDown();
      
      itemCount++;
      
      // ページの残りスペースをチェック
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
        doc.font('IPAexGothic-Bold')
           .text('推奨メンテナンス (続き):', 50, 50)
           .moveDown();
      }
    }
  }
  
  /**
   * 備考セクションをレンダリング
   */
  static _renderNotesSection(doc, content) {
    doc.fontSize(11)
       .font('IPAexGothic')
       .text(content.notes)
       .moveDown();
  }
  
  /**
   * フッターをレンダリングする
   * @param {PDFDocument} doc - PDFドキュメント
   * @param {Object} footer - フッターデータ
   */
  static _renderFooter(doc, footer) {
    const currentPage = doc.page.pageNumber;
    
    doc.fontSize(8)
       .font('IPAexGothic')
       .text(
         `${footer.text} - 作成日: ${new Date().toLocaleDateString('ja-JP')} - ページ ${currentPage}`,
         50,
         doc.page.height - 50,
         { align: 'center', width: doc.page.width - 100 }
       );
  }
}

module.exports = PDFGenerator;