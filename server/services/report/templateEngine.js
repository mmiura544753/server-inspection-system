// server/services/report/templateEngine.js
const fs = require('fs');
const path = require('path');

/**
 * レポートテンプレートエンジン
 * テンプレートJSONからレポート構造を読み込み、データと組み合わせる
 */
class TemplateEngine {
  /**
   * テンプレートを読み込む
   * @param {string} templatePath - テンプレートのパス
   * @returns {Object} - テンプレートオブジェクト
   */
  static loadTemplate(templatePath) {
    try {
      // テンプレートファイルが存在するか確認
      if (!fs.existsSync(templatePath)) {
        throw new Error(`テンプレートファイルが見つかりません: ${templatePath}`);
      }
      
      // テンプレートファイルを読み込む
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const template = JSON.parse(templateContent);
      
      return template;
    } catch (error) {
      console.error('テンプレート読み込みエラー:', error);
      throw error;
    }
  }
  
  /**
   * テンプレートを検証する
   * @param {Object} template - テンプレートオブジェクト
   * @returns {boolean} - 検証結果
   */
  static validateTemplate(template) {
    // 必須項目の確認
    if (!template.name || !template.type || !template.sections) {
      return false;
    }
    
    // レポートタイプの確認
    if (!['daily', 'monthly'].includes(template.type)) {
      return false;
    }
    
    // セクションの確認
    if (!Array.isArray(template.sections) || template.sections.length === 0) {
      return false;
    }
    
    // 各セクションの確認
    for (const section of template.sections) {
      if (!section.title || !section.type) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * デフォルトテンプレートのパスを取得する
   * @param {string} reportType - レポートタイプ (daily/monthly)
   * @returns {string} - テンプレートのパス
   */
  static getDefaultTemplatePath(reportType) {
    if (!['daily', 'monthly'].includes(reportType)) {
      throw new Error('無効なレポートタイプです');
    }
    
    return path.join(__dirname, `../../templates/reports/${reportType}_template.json`);
  }
  
  /**
   * テンプレートとデータを組み合わせる
   * @param {Object} template - テンプレートオブジェクト
   * @param {Object} data - レポートデータ
   * @returns {Object} - レンダリング用のデータ
   */
  static mergeTemplateWithData(template, data) {
    const mergedData = {
      title: template.name,
      type: template.type,
      sections: [],
      footer: template.footer || { text: "サーバー点検システム" }
    };
    
    // 基本データをマージ
    Object.assign(mergedData, {
      customerName: data.customer.customer_name,
      reportDate: data.reportDate,
      reportPeriod: data.reportPeriod
    });
    
    // セクションごとにデータを処理
    for (const section of template.sections) {
      const sectionData = {
        title: section.title,
        type: section.type,
        content: this._processSectionData(section, data)
      };
      
      mergedData.sections.push(sectionData);
    }
    
    return mergedData;
  }
  
  /**
   * セクションタイプに応じたデータ処理
   * @param {Object} section - セクション定義
   * @param {Object} data - レポートデータ
   * @returns {Object} - セクション用データ
   */
  static _processSectionData(section, data) {
    switch (section.type) {
      case 'summary':
        return this._processSummarySection(data);
      
      case 'results_table':
        return this._processResultsTableSection(data);
      
      case 'issues':
        return this._processIssuesSection(data);
      
      case 'monthly_summary':
        return this._processMonthlySection(data);
      
      case 'daily_counts':
        return this._processDailyCountsSection(data);
        
      case 'issue_devices':
        return this._processIssueDevicesSection(data);
        
      case 'issue_trends':
        return this._processIssueTrendsSection(data);
      
      case 'recommendations':
        return this._processRecommendationsSection(data);
        
      case 'notes':
        return this._processNotesSection(data);
      
      default:
        return { message: `不明なセクションタイプ: ${section.type}` };
    }
  }
  
  /**
   * 点検概要セクション処理
   */
  static _processSummarySection(data) {
    const { inspections } = data;
    
    return {
      inspectionCount: inspections ? inspections.length : 0,
      date: new Date(data.reportDate).toLocaleDateString('ja-JP'),
      inspectorNames: inspections 
        ? [...new Set(inspections.map(i => i.inspector_name))].join(', ')
        : '---'
    };
  }
  
  /**
   * 結果テーブルセクション処理
   */
  static _processResultsTableSection(data) {
    const { inspections } = data;
    if (!inspections || inspections.length === 0) {
      return { rows: [] };
    }
    
    const rows = [];
    for (const inspection of inspections) {
      const results = inspection.results || [];
      
      for (const result of results) {
        const deviceName = result.result_device ? result.result_device.name : 'Unknown';
        const itemName = result.inspection_item && result.inspection_item.item_name_master 
          ? result.inspection_item.item_name_master.name 
          : 'Unknown';
        
        rows.push({
          device: deviceName,
          item: itemName,
          status: result.check_result ? 'OK' : 'NG',
          remarks: result.note || ''
        });
      }
    }
    
    return { rows };
  }
  
  /**
   * 異常項目セクション処理
   */
  static _processIssuesSection(data) {
    const { inspections } = data;
    if (!inspections || inspections.length === 0) {
      return { issues: [] };
    }
    
    const issues = [];
    for (const inspection of inspections) {
      const results = inspection.results || [];
      
      for (const result of results) {
        if (!result.check_result) {  // NGの場合
          const deviceName = result.result_device ? result.result_device.name : 'Unknown';
          const itemName = result.inspection_item && result.inspection_item.item_name_master 
            ? result.inspection_item.item_name_master.name 
            : 'Unknown';
          
          issues.push({
            device: deviceName,
            item: itemName,
            date: new Date(inspection.inspection_date).toLocaleString('ja-JP'),
            inspector: inspection.inspector_name,
            note: result.note || '---'
          });
        }
      }
    }
    
    return { issues };
  }
  
  /**
   * 月次概要セクション処理
   */
  static _processMonthlySection(data) {
    const { inspections } = data;
    
    const totalCount = inspections ? inspections.length : 0;
    
    // 機器ごとの点検数
    const deviceCounts = {};
    let totalIssues = 0;
    
    if (inspections && inspections.length > 0) {
      for (const inspection of inspections) {
        const results = inspection.results || [];
        
        for (const result of results) {
          if (result.result_device) {
            const deviceName = result.result_device.name;
            deviceCounts[deviceName] = (deviceCounts[deviceName] || 0) + 1;
            
            if (!result.check_result) {
              totalIssues++;
            }
          }
        }
      }
    }
    
    return {
      totalInspections: totalCount,
      totalIssues,
      period: data.reportPeriod,
      deviceSummary: Object.entries(deviceCounts).map(([device, count]) => ({ device, count }))
    };
  }
  
  /**
   * 日別点検数セクション処理
   */
  static _processDailyCountsSection(data) {
    const { inspections } = data;
    if (!inspections || inspections.length === 0) {
      return { dailyCounts: [] };
    }
    
    const dailyCounts = {};
    for (const inspection of inspections) {
      const dateStr = new Date(inspection.inspection_date).toISOString().split('T')[0];
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    }
    
    const counts = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return { dailyCounts: counts };
  }
  
  /**
   * 異常検出機器セクション処理
   */
  static _processIssueDevicesSection(data) {
    const { inspections } = data;
    if (!inspections || inspections.length === 0) {
      return { issueDevices: [] };
    }
    
    const deviceIssues = {};
    for (const inspection of inspections) {
      const results = inspection.results || [];
      
      for (const result of results) {
        if (!result.check_result) {  // NG結果
          const deviceId = result.device_id;
          const deviceName = result.result_device ? result.result_device.name : `Device ${deviceId}`;
          
          if (!deviceIssues[deviceName]) {
            deviceIssues[deviceName] = { count: 0, items: [] };
          }
          
          deviceIssues[deviceName].count++;
          
          if (result.inspection_item && result.inspection_item.item_name_master) {
            deviceIssues[deviceName].items.push(result.inspection_item.item_name_master.name);
          }
        }
      }
    }
    
    const issueDevices = Object.entries(deviceIssues).map(([device, data]) => ({
      device,
      count: data.count,
      items: [...new Set(data.items)].join(', ')
    }));
    
    // 問題の多い順に並べ替え
    issueDevices.sort((a, b) => b.count - a.count);
    
    return { issueDevices };
  }
  
  /**
   * 異常傾向セクション処理
   */
  static _processIssueTrendsSection(data) {
    const { inspections } = data;
    if (!inspections || inspections.length === 0) {
      return { issueTrends: [] };
    }
    
    const itemIssues = {};
    for (const inspection of inspections) {
      const results = inspection.results || [];
      
      for (const result of results) {
        if (!result.check_result) {  // NG結果
          if (result.inspection_item && result.inspection_item.item_name_master) {
            const itemName = result.inspection_item.item_name_master.name;
            itemIssues[itemName] = (itemIssues[itemName] || 0) + 1;
          }
        }
      }
    }
    
    const issueTrends = Object.entries(itemIssues)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count);
    
    return { issueTrends };
  }
  
  /**
   * 推奨メンテナンスセクション処理
   * 異常が多い項目から推奨メンテナンス項目を生成
   */
  static _processRecommendationsSection(data) {
    const { inspections } = data;
    if (!inspections || inspections.length === 0) {
      return { recommendations: [] };
    }
    
    // 異常の多い項目・機器を特定
    const itemIssues = {};
    const deviceIssues = {};
    
    for (const inspection of inspections) {
      const results = inspection.results || [];
      
      for (const result of results) {
        if (!result.check_result) {  // NG結果
          if (result.inspection_item && result.inspection_item.item_name_master) {
            const itemName = result.inspection_item.item_name_master.name;
            itemIssues[itemName] = (itemIssues[itemName] || 0) + 1;
          }
          
          if (result.result_device) {
            const deviceName = result.result_device.name;
            deviceIssues[deviceName] = (deviceIssues[deviceName] || 0) + 1;
          }
        }
      }
    }
    
    // 推奨メンテナンス項目を生成
    const recommendations = [];
    
    // アイテム系の推奨
    Object.entries(itemIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)  // 上位3つ
      .forEach(([item, count]) => {
        if (count >= 2) {  // 2回以上NGになった項目のみ
          recommendations.push({
            type: 'item',
            target: item,
            reason: `${count}件の異常が検出されました`,
            recommendation: `${item}の定期的な点検をお勧めします`
          });
        }
      });
    
    // 機器系の推奨
    Object.entries(deviceIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)  // 上位3つ
      .forEach(([device, count]) => {
        if (count >= 3) {  // 3回以上NGになった機器のみ
          recommendations.push({
            type: 'device',
            target: device,
            reason: `${count}件の異常が検出されました`,
            recommendation: `${device}の総合メンテナンスをお勧めします`
          });
        }
      });
    
    return { recommendations };
  }
  
  /**
   * 備考セクション処理
   */
  static _processNotesSection(data) {
    return {
      notes: data.notes || '特記事項なし'
    };
  }
}

module.exports = TemplateEngine;