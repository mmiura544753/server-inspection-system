// tests/unit/report/services/templateEngine.test.js
const path = require('path');
const fs = require('fs');
const TemplateEngine = require('../../../../services/report/templateEngine');

// fsモジュールをモック化
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// pathモジュールのjoinをモック化
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn()
}));

describe('TemplateEngine', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadTemplate', () => {
    it('テンプレートファイルを正常に読み込むこと', () => {
      // モックの設定
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        name: 'テストテンプレート',
        type: 'daily',
        sections: [
          { title: '点検概要', type: 'summary' }
        ]
      }));

      const templatePath = '/path/to/template.json';
      const template = TemplateEngine.loadTemplate(templatePath);

      // 関数の呼び出しを確認
      expect(fs.existsSync).toHaveBeenCalledWith(templatePath);
      expect(fs.readFileSync).toHaveBeenCalledWith(templatePath, 'utf8');

      // 結果を確認
      expect(template).toEqual({
        name: 'テストテンプレート',
        type: 'daily',
        sections: [
          { title: '点検概要', type: 'summary' }
        ]
      });
    });

    it('テンプレートファイルが存在しない場合はエラーになること', () => {
      // ファイルが存在しないケース
      fs.existsSync.mockReturnValue(false);

      const templatePath = '/path/to/nonexistent.json';

      expect(() => {
        TemplateEngine.loadTemplate(templatePath);
      }).toThrow(`テンプレートファイルが見つかりません: ${templatePath}`);
    });

    it('無効なJSONの場合はエラーになること', () => {
      // 無効なJSONのケース
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');

      const templatePath = '/path/to/invalid.json';

      expect(() => {
        TemplateEngine.loadTemplate(templatePath);
      }).toThrow();
    });
  });

  describe('validateTemplate', () => {
    it('有効なテンプレートを検証できること', () => {
      const validTemplate = {
        name: 'テストテンプレート',
        type: 'daily',
        sections: [
          { title: '点検概要', type: 'summary' }
        ]
      };

      const result = TemplateEngine.validateTemplate(validTemplate);
      expect(result).toBe(true);
    });

    it('必須項目が欠けているテンプレートは無効と判定すること', () => {
      // 名前がない
      const missingName = {
        type: 'daily',
        sections: [
          { title: '点検概要', type: 'summary' }
        ]
      };
      expect(TemplateEngine.validateTemplate(missingName)).toBe(false);

      // タイプがない
      const missingType = {
        name: 'テストテンプレート',
        sections: [
          { title: '点検概要', type: 'summary' }
        ]
      };
      expect(TemplateEngine.validateTemplate(missingType)).toBe(false);

      // セクションがない
      const missingSections = {
        name: 'テストテンプレート',
        type: 'daily'
      };
      expect(TemplateEngine.validateTemplate(missingSections)).toBe(false);
    });

    it('無効なレポートタイプは無効と判定すること', () => {
      const invalidType = {
        name: 'テストテンプレート',
        type: 'invalid',
        sections: [
          { title: '点検概要', type: 'summary' }
        ]
      };

      expect(TemplateEngine.validateTemplate(invalidType)).toBe(false);
    });

    it('空のセクション配列は無効と判定すること', () => {
      const emptySections = {
        name: 'テストテンプレート',
        type: 'daily',
        sections: []
      };

      expect(TemplateEngine.validateTemplate(emptySections)).toBe(false);
    });

    it('必須項目が欠けているセクションは無効と判定すること', () => {
      // タイトルがないセクション
      const missingTitle = {
        name: 'テストテンプレート',
        type: 'daily',
        sections: [
          { type: 'summary' }
        ]
      };
      expect(TemplateEngine.validateTemplate(missingTitle)).toBe(false);

      // タイプがないセクション
      const missingType = {
        name: 'テストテンプレート',
        type: 'daily',
        sections: [
          { title: '点検概要' }
        ]
      };
      expect(TemplateEngine.validateTemplate(missingType)).toBe(false);
    });
  });

  describe('getDefaultTemplatePath', () => {
    it('日次レポートの正しいテンプレートパスを返すこと', () => {
      path.join.mockReturnValue('/path/to/templates/daily_template.json');

      const result = TemplateEngine.getDefaultTemplatePath('daily');

      expect(path.join).toHaveBeenCalledWith(expect.anything(), '../../templates/reports/daily_template.json');
      expect(result).toBe('/path/to/templates/daily_template.json');
    });

    it('月次レポートの正しいテンプレートパスを返すこと', () => {
      path.join.mockReturnValue('/path/to/templates/monthly_template.json');

      const result = TemplateEngine.getDefaultTemplatePath('monthly');

      expect(path.join).toHaveBeenCalledWith(expect.anything(), '../../templates/reports/monthly_template.json');
      expect(result).toBe('/path/to/templates/monthly_template.json');
    });

    it('無効なレポートタイプではエラーになること', () => {
      expect(() => {
        TemplateEngine.getDefaultTemplatePath('invalid');
      }).toThrow('無効なレポートタイプです');
    });
  });

  describe('mergeTemplateWithData', () => {
    it('テンプレートとデータを正しくマージすること', () => {
      // スパイを設定
      const processSectionDataSpy = jest.spyOn(TemplateEngine, '_processSectionData')
        .mockImplementation((section) => ({ processed: true, type: section.type }));

      const template = {
        name: 'テストテンプレート',
        type: 'daily',
        sections: [
          { title: '点検概要', type: 'summary' },
          { title: '点検結果', type: 'results_table' }
        ],
        footer: { text: 'カスタムフッター' }
      };

      const data = {
        customer: {
          customer_name: 'テスト顧客'
        },
        reportDate: '2025-03-01',
        reportPeriod: '2025年03月',
        inspections: []
      };

      const result = TemplateEngine.mergeTemplateWithData(template, data);

      // 基本データがマージされていることを確認
      expect(result.title).toBe('テストテンプレート');
      expect(result.type).toBe('daily');
      expect(result.customerName).toBe('テスト顧客');
      expect(result.reportDate).toBe('2025-03-01');
      expect(result.reportPeriod).toBe('2025年03月');
      expect(result.footer).toEqual({ text: 'カスタムフッター' });

      // セクション処理が呼ばれたことを確認
      expect(processSectionDataSpy).toHaveBeenCalledTimes(2);
      expect(result.sections.length).toBe(2);
      expect(result.sections[0]).toEqual({
        title: '点検概要',
        type: 'summary',
        content: { processed: true, type: 'summary' }
      });
      expect(result.sections[1]).toEqual({
        title: '点検結果',
        type: 'results_table',
        content: { processed: true, type: 'results_table' }
      });

      processSectionDataSpy.mockRestore();
    });

    it('フッターが指定されていない場合はデフォルト値を使用すること', () => {
      // _processSectionDataをモック化
      jest.spyOn(TemplateEngine, '_processSectionData')
        .mockImplementation(() => ({}));

      const template = {
        name: 'フッターなしテンプレート',
        type: 'daily',
        sections: [{ title: '点検概要', type: 'summary' }]
        // フッターなし
      };

      const data = {
        customer: { customer_name: 'テスト顧客' },
        reportDate: '2025-03-01',
        reportPeriod: '2025年03月'
      };

      const result = TemplateEngine.mergeTemplateWithData(template, data);

      // デフォルトフッターが設定されていることを確認
      expect(result.footer).toEqual({ text: "サーバー点検システム" });
    });
  });

  // セクションデータ処理のテストは複雑なため、コントローラーとの統合テストで行う場合が多い
});