import {
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatRelativeTime,
  formatFileSize,
  formatDateForInput,
  parseDateFromInput
} from '../utils/formatters';

describe('Date Formatting', () => {
  const testDate = new Date('2025-01-15T14:30:00Z');

  it('formatDate works for different locales', () => {
    const enResult = formatDate(testDate, 'en');
    const thResult = formatDate(testDate, 'th');
    
    expect(enResult).toContain('January');
    expect(enResult).toContain('15');
    expect(enResult).toContain('2025');
    
    expect(thResult).toContain('มกราคม');
    expect(thResult).toContain('15');
    expect(thResult).toContain('2025');
  });

  it('formatTime works for different locales', () => {
    const enResult = formatTime(testDate, 'en');
    const thResult = formatTime(testDate, 'th');
    
    expect(enResult).toMatch(/\d{1,2}:\d{2}/);
    expect(thResult).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formatDateTime combines date and time', () => {
    const result = formatDateTime(testDate, 'en');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('handles invalid dates gracefully', () => {
    expect(formatDate('invalid-date', 'en')).toBe('');
    expect(formatTime(null, 'en')).toBe('');
    expect(formatDateTime(undefined, 'en')).toBe('');
  });

  it('formatDateForInput returns ISO format', () => {
    const result = formatDateForInput(testDate);
    expect(result).toBe('2025-01-15');
  });

  it('parseDateFromInput parses ISO format', () => {
    const result = parseDateFromInput('2025-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0); // January is 0
    expect(result.getDate()).toBe(15);
  });
});

describe('Number Formatting', () => {
  it('formatNumber works for different locales', () => {
    const number = 1234567.89;
    
    const enResult = formatNumber(number, 'en');
    const thResult = formatNumber(number, 'th');
    
    expect(enResult).toContain('1,234,567.89');
    expect(thResult).toContain('1,234,567.89');
  });

  it('formatCurrency works with default currencies', () => {
    const amount = 1234.56;
    
    const enResult = formatCurrency(amount, 'en');
    const thResult = formatCurrency(amount, 'th');
    
    expect(enResult).toContain('$');
    expect(enResult).toContain('1,234.56');
    
    expect(thResult).toContain('฿');
    expect(thResult).toContain('1,234.56');
  });

  it('formatCurrency works with custom currency', () => {
    const amount = 1000;
    const result = formatCurrency(amount, 'en', 'EUR');
    
    expect(result).toContain('€');
    expect(result).toContain('1,000');
  });

  it('formatPercentage works correctly', () => {
    expect(formatPercentage(0.1234, 'en')).toContain('12.34%');
    expect(formatPercentage(0.5, 'en')).toContain('50%');
    expect(formatPercentage(1, 'en')).toContain('100%');
  });

  it('handles invalid numbers gracefully', () => {
    expect(formatNumber(null, 'en')).toBe('');
    expect(formatNumber(undefined, 'en')).toBe('');
    expect(formatNumber('invalid', 'en')).toBe('');
    
    expect(formatCurrency(null, 'en')).toBe('');
    expect(formatPercentage(undefined, 'en')).toBe('');
  });
});

describe('File Size Formatting', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('formats with decimals', () => {
    expect(formatFileSize(1536, 'en', 1)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024 * 1.5, 'en', 2)).toBe('1.50 MB');
  });

  it('handles invalid input', () => {
    expect(formatFileSize(null)).toBe('');
    expect(formatFileSize(undefined)).toBe('');
    expect(formatFileSize('invalid')).toBe('');
  });
});

describe('Relative Time Formatting', () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  it('formats past times', () => {
    const result = formatRelativeTime(oneHourAgo, 'en');
    expect(result).toMatch(/(hour|ago)/i);
  });

  it('formats future times', () => {
    const result = formatRelativeTime(oneDayFromNow, 'en');
    expect(result).toMatch(/(day|in)/i);
  });

  it('handles invalid dates', () => {
    expect(formatRelativeTime('invalid', 'en')).toBe('');
    expect(formatRelativeTime(null, 'en')).toBe('');
  });
});

describe('Error Handling', () => {
  it('formatters handle unsupported locales gracefully', () => {
    // These should not throw errors, but fall back to default behavior
    expect(() => formatDate(new Date(), 'unsupported')).not.toThrow();
    expect(() => formatNumber(1234, 'unsupported')).not.toThrow();
    expect(() => formatCurrency(1234, 'unsupported')).not.toThrow();
  });

  it('formatters handle edge cases', () => {
    // Very large numbers
    expect(formatNumber(Number.MAX_SAFE_INTEGER, 'en')).toBeTruthy();
    
    // Very small numbers
    expect(formatNumber(0.000001, 'en')).toBeTruthy();
    
    // Negative numbers
    expect(formatNumber(-1234, 'en')).toContain('-');
    expect(formatCurrency(-100, 'en')).toContain('-');
  });
});