// tests/mocks/csv-mock.js
// Mock implementations for CSV-related utilities

const mockIconvDecode = jest.fn().mockImplementation((buffer, encoding) => {
  // ĞÃÕ¡’UTF-8‡WhWfÔYÆ¹È(koA	
  return buffer.toString('utf8');
});

/**
 * CSV‡W’Ñü¹WfLªÖ¸§¯ÈnM’ÔY
 * @param {string} csvContent - CSVn³óÆóÄ‡W
 * @param {object} options - Ñü¹ª×·çó
 * @returns {Array} - Ñü¹UŒ_LªÖ¸§¯ÈnM
 */
const mockCsvParse = jest.fn().mockImplementation((csvContent, options) => {
  try {
    // !eW_CSVÑü¹ŸÅ
    // ØÃÀüLh‹ŠnL’Q‹
    const lines = csvContent.split('\n');
    if (lines.length <= 1) {
      return [];
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = index < values.length ? values[index] : '';
      });
      
      result.push(row);
    }
    
    return result;
  } catch (error) {
    // Ñü¹¨éün4‹’¹íü
    if (csvContent.includes('!¹jCSV')) {
      throw new Error('CSVã¨éü');
    }
    return [];
  }
});

module.exports = {
  mockIconvDecode,
  mockCsvParse
};