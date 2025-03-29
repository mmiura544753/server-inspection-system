import { formatTime, formatDate, formatDateForAPI } from '../../../utils/dateTimeUtils';

// コンソールエラーをモック
const originalConsoleError = console.error;

describe('dateTimeUtils', () => {
  beforeEach(() => {
    // コンソール出力をモック
    console.error = jest.fn();
  });

  afterEach(() => {
    // 元のコンソール関数を復元
    console.error = originalConsoleError;
  });

  describe('formatTime', () => {
    it('should return "-" for null or undefined input', () => {
      expect(formatTime(null)).toBe('-');
      expect(formatTime(undefined)).toBe('-');
      expect(formatTime('')).toBe('-');
    });

    it('should return first 5 characters for string input', () => {
      expect(formatTime('12:34:56')).toBe('12:34');
      expect(formatTime('09:45')).toBe('09:45');
      expect(formatTime('12345678')).toBe('12345');
    });

    it('should format Date object correctly', () => {
      // テスト用に固定時間のDateオブジェクトを作成
      const testDate = new Date('2025-03-15T14:30:45');
      
      // Dateのtoからのsliceを'14:30'のようにするモック
      const result = formatTime(testDate);
      
      // 結果は時間部分の先頭5文字（HH:MM形式）
      expect(result.length).toBe(5);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should return "-" for other input types', () => {
      expect(formatTime(123)).toBe('-');
      expect(formatTime({})).toBe('-');
      expect(formatTime([])).toBe('-');
    });
  });

  describe('formatDate', () => {
    it('should return "-" for null or undefined input', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate('')).toBe('-');
    });

    it('should format valid date string correctly', () => {
      expect(formatDate('2025-03-15')).toBe('2025/03/15');
      expect(formatDate('2025/01/01')).toBe('2025/01/01');
    });

    it('should handle Date object input', () => {
      const date = new Date('2025-03-15');
      expect(formatDate(date)).toBe('2025/03/15');
    });

    it('should return "-" for invalid date inputs', () => {
      expect(formatDate('invalid-date')).toBe('-');
      expect(formatDate('2025-99-99')).toBe('-');
    });

    it('should handle errors and log them', () => {
      // テスト用にDate関数をモック
      const originalDate = global.Date;
      
      // Dateコンストラクタを一時的にエラーを投げる関数に差し替え
      global.Date = function() {
        throw new Error('Date parsing error');
      };
      global.Date.prototype = originalDate.prototype;
      
      // エラーハンドリングをテスト
      expect(formatDate('2025-03-15')).toBe('-');
      expect(console.error).toHaveBeenCalled();
      
      // 元のDate関数を復元
      global.Date = originalDate;
    });
  });

  describe('formatDateForAPI', () => {
    it('should format Date object correctly for API', () => {
      const date = new Date('2025-03-15');
      expect(formatDateForAPI(date)).toBe('2025-03-15');
    });

    it('should handle date object with year, month, day properties', () => {
      const dateObj = { year: '2025', month: '03', day: '15' };
      expect(formatDateForAPI(dateObj)).toBe('2025-03-15');
    });

    it('should handle date string by returning it unchanged', () => {
      expect(formatDateForAPI('2025-03-15')).toBe('2025-03-15');
    });

    it('should handle null or undefined by returning them unchanged', () => {
      expect(formatDateForAPI(null)).toBe(null);
      expect(formatDateForAPI(undefined)).toBe(undefined);
    });

    it('should pad single-digit month and day with leading zeros', () => {
      const date = new Date('2025-1-5'); // January 5, 2025
      expect(formatDateForAPI(date)).toBe('2025-01-05');
    });
  });
});