// tests/mocks/csv-mock.js
// Mock implementations for CSV-related utilities

const mockIconvDecode = jest.fn().mockImplementation((buffer, encoding) => {
  // ��ա�UTF-8�WhWf�Yƹ�(koA	
  return buffer.toString('utf8');
});

/**
 * CSV�W����WfL�ָ���nM��Y
 * @param {string} csvContent - CSVn����ćW
 * @param {object} options - ����׷��
 * @returns {Array} - ���U�_L�ָ���nM
 */
const mockCsvParse = jest.fn().mockImplementation((csvContent, options) => {
  try {
    // !eW_CSV�����
    // ����Lh��nL�Q�
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
    // ������n4�����
    if (csvContent.includes('!�jCSV')) {
      throw new Error('CSV㐨��');
    }
    return [];
  }
});

module.exports = {
  mockIconvDecode,
  mockCsvParse
};