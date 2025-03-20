// src/utils/sortUtils.js

/**
 * 任意のデータ型の値に対応する汎用比較関数
 * @param {*} a 比較対象1
 * @param {*} b 比較対象2
 * @param {boolean} descending 降順かどうか
 * @returns {number} 比較結果（-1, 0, 1）
 */
export const compareValues = (a, b, descending = false) => {
  // nullやundefinedは常に最後に配置
  if (a === null || a === undefined) return descending ? -1 : 1;
  if (b === null || b === undefined) return descending ? 1 : -1;

  // 日付文字列の場合はDate型に変換して比較
  if (typeof a === 'string' && 
      (a.match(/^\d{4}-\d{2}-\d{2}/) || a.match(/^\d{4}\/\d{2}\/\d{2}/))) {
    const dateA = new Date(a);
    const dateB = new Date(b);
    if (!isNaN(dateA) && !isNaN(dateB)) {
      return descending 
        ? dateB.getTime() - dateA.getTime() 
        : dateA.getTime() - dateB.getTime();
    }
  }

  // 数値の場合は数値として比較
  if (!isNaN(a) && !isNaN(b)) {
    return descending ? b - a : a - b;
  }

  // 文字列の場合はロケール対応の比較
  if (typeof a === 'string' && typeof b === 'string') {
    return descending 
      ? b.localeCompare(a, 'ja') 
      : a.localeCompare(b, 'ja');
  }

  // その他の型（デフォルト）
  if (a < b) return descending ? 1 : -1;
  if (a > b) return descending ? -1 : 1;
  return 0;
};

/**
 * 配列をソートするヘルパー関数
 * @param {Array} array ソート対象の配列
 * @param {string} key ソートするプロパティ名
 * @param {boolean} descending 降順かどうか
 * @returns {Array} ソート済みの配列
 */
export const sortArrayByKey = (array, key, descending = false) => {
  if (!array || !Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const valueA = a[key];
    const valueB = b[key];
    return compareValues(valueA, valueB, descending);
  });
};