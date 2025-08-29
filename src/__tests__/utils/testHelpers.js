import { CsvParser } from '../../utils/CsvParser';

/**
 * Simple CSV parsing utility for tests
 * @param {string} csvContent - CSV content as string
 * @returns {Promise<Array>} - Array of parsed records
 */
export async function parseCSV(csvContent) {
  const parser = new CsvParser();
  const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
  const result = await parser.parseFile(mockFile);
  return result.records;
}

/**
 * Generate test CSV content
 * @param {number} rows - Number of rows to generate
 * @returns {string} - CSV content
 */
export function generateTestCSV(rows) {
  let csv = 'Invoice Number,Date,Customer,Amount,Tax,Total\n';
  for (let i = 1; i <= rows; i++) {
    const amount = (Math.random() * 1000).toFixed(2);
    const tax = (amount * 0.2).toFixed(2);
    const total = (parseFloat(amount) + parseFloat(tax)).toFixed(2);
    csv += `INV-${i.toString().padStart(6, '0')},2024-01-${((i % 28) + 1)
      .toString()
      .padStart(2, '0')},Customer ${i % 100},${amount},${tax},${total}\n`;
  }
  return csv;
}

/**
 * Create mock file object for testing
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} type - MIME type
 * @returns {File} - Mock file object
 */
export function createMockFile(content, filename = 'test.csv', type = 'text/csv') {
  return new File([content], filename, { type });
}