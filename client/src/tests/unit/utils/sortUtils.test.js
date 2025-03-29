import { compareValues, sortArrayByKey } from '../../../utils/sortUtils';

describe('sortUtils', () => {
  describe('compareValues', () => {
    it('should handle null and undefined values', () => {
      // null/undefined 値は昇順で最後に配置
      expect(compareValues(null, 'value')).toBe(1);
      expect(compareValues(undefined, 'value')).toBe(1);
      expect(compareValues('value', null)).toBe(-1);
      expect(compareValues('value', undefined)).toBe(-1);
      
      // null/undefined 値は降順で最初に配置
      expect(compareValues(null, 'value', true)).toBe(-1);
      expect(compareValues(undefined, 'value', true)).toBe(-1);
      expect(compareValues('value', null, true)).toBe(1);
      expect(compareValues('value', undefined, true)).toBe(1);
    });

    it('should compare date strings correctly', () => {
      // ISO形式の日付文字列（YYYY-MM-DD）
      expect(compareValues('2025-03-15', '2025-03-10')).toBeGreaterThan(0);
      expect(compareValues('2025-03-10', '2025-03-15')).toBeLessThan(0);
      expect(compareValues('2025-03-15', '2025-03-15')).toBe(0);
      
      // スラッシュ形式の日付文字列（YYYY/MM/DD）
      expect(compareValues('2025/03/15', '2025/03/10')).toBeGreaterThan(0);
      expect(compareValues('2025/03/10', '2025/03/15')).toBeLessThan(0);
      expect(compareValues('2025/03/15', '2025/03/15')).toBe(0);
      
      // 降順でのソート
      expect(compareValues('2025-03-15', '2025-03-10', true)).toBeLessThan(0);
      expect(compareValues('2025-03-10', '2025-03-15', true)).toBeGreaterThan(0);
    });

    it('should compare numbers correctly', () => {
      // 数値の昇順比較
      expect(compareValues(5, 10)).toBeLessThan(0);
      expect(compareValues(10, 5)).toBeGreaterThan(0);
      expect(compareValues(10, 10)).toBe(0);
      
      // 数値の降順比較
      expect(compareValues(5, 10, true)).toBeGreaterThan(0);
      expect(compareValues(10, 5, true)).toBeLessThan(0);
      expect(compareValues(10, 10, true)).toBe(0);
      
      // 数値と数値文字列
      expect(compareValues(5, '10')).toBeLessThan(0);
      expect(compareValues('10', 5)).toBeGreaterThan(0);
    });

    it('should compare strings correctly', () => {
      // 文字列の昇順比較
      expect(compareValues('apple', 'banana')).toBeLessThan(0);
      expect(compareValues('banana', 'apple')).toBeGreaterThan(0);
      expect(compareValues('apple', 'apple')).toBe(0);
      
      // 文字列の降順比較
      expect(compareValues('apple', 'banana', true)).toBeGreaterThan(0);
      expect(compareValues('banana', 'apple', true)).toBeLessThan(0);
      
      // 日本語の文字列（ロケール対応）
      expect(compareValues('あいう', 'かきく')).toBeLessThan(0);
      expect(compareValues('かきく', 'あいう')).toBeGreaterThan(0);
    });

    it('should fall back to default comparison for other types', () => {
      // オブジェクト（参照値の比較）
      const obj1 = { value: 1 };
      const obj2 = { value: 2 };
      
      // 実装依存の結果になるため、厳密な値ではなく方向性のみチェック
      const result = compareValues(obj1, obj2);
      expect(typeof result).toBe('number');
      
      // 同一オブジェクト
      expect(compareValues(obj1, obj1)).toBe(0);
    });
  });

  describe('sortArrayByKey', () => {
    // テスト用のサンプルデータ
    const testData = [
      { id: 2, name: 'banana', date: '2025-03-10' },
      { id: 1, name: 'apple', date: '2025-03-15' },
      { id: 3, name: 'cherry', date: '2025-03-05' },
      { id: 4, name: null, date: null }
    ];

    it('should return empty array for invalid inputs', () => {
      // 無効な入力に対して空配列を返す
      expect(sortArrayByKey(null, 'id')).toEqual([]);
      expect(sortArrayByKey(undefined, 'id')).toEqual([]);
      expect(sortArrayByKey('not an array', 'id')).toEqual([]);
    });

    it('should sort array by numeric key', () => {
      // idによる昇順ソート
      const sortedById = sortArrayByKey(testData, 'id');
      expect(sortedById[0].id).toBe(1);
      expect(sortedById[1].id).toBe(2);
      expect(sortedById[2].id).toBe(3);
      expect(sortedById[3].id).toBe(4); // null値は最後に配置
      
      // idによる降順ソート
      const sortedByIdDesc = sortArrayByKey(testData, 'id', true);
      expect(sortedByIdDesc[0].id).toBe(4); // null値は降順で最初に配置
      expect(sortedByIdDesc[1].id).toBe(3);
      expect(sortedByIdDesc[2].id).toBe(2);
      expect(sortedByIdDesc[3].id).toBe(1);
    });

    it('should sort array by string key', () => {
      // nameによる昇順ソート
      const sortedByName = sortArrayByKey(testData, 'name');
      expect(sortedByName[0].name).toBe('apple');
      expect(sortedByName[1].name).toBe('banana');
      expect(sortedByName[2].name).toBe('cherry');
      expect(sortedByName[3].name).toBe(null); // null値は最後に配置
      
      // nameによる降順ソート
      const sortedByNameDesc = sortArrayByKey(testData, 'name', true);
      expect(sortedByNameDesc[0].name).toBe(null); // null値は降順で最初に配置
      expect(sortedByNameDesc[1].name).toBe('cherry');
      expect(sortedByNameDesc[2].name).toBe('banana');
      expect(sortedByNameDesc[3].name).toBe('apple');
    });

    it('should sort array by date key', () => {
      // dateによる昇順ソート
      const sortedByDate = sortArrayByKey(testData, 'date');
      expect(sortedByDate[0].date).toBe('2025-03-05');
      expect(sortedByDate[1].date).toBe('2025-03-10');
      expect(sortedByDate[2].date).toBe('2025-03-15');
      expect(sortedByDate[3].date).toBe(null); // null値は最後に配置
      
      // dateによる降順ソート
      const sortedByDateDesc = sortArrayByKey(testData, 'date', true);
      expect(sortedByDateDesc[0].date).toBe(null); // null値は降順で最初に配置
      expect(sortedByDateDesc[1].date).toBe('2025-03-15');
      expect(sortedByDateDesc[2].date).toBe('2025-03-10');
      expect(sortedByDateDesc[3].date).toBe('2025-03-05');
    });

    it('should not modify the original array', () => {
      // 元の配列が変更されないことを確認
      const originalData = [...testData];
      sortArrayByKey(testData, 'id');
      expect(testData).toEqual(originalData);
    });
  });
});