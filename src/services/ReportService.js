/**
 * Report Service
 * 
 * Handles report generation, data aggregation, and formatting
 * for the Invoice Validation System reporting functionality.
 */

import { 
  DEFAULT_REPORT_TEMPLATES,
  REPORT_TYPES,
  SEVERITY_LEVELS 
} from '../types/reports.js';

class ReportService {
  /**
   * Generate report data based on template and filters
   * @param {Object} template - Report template
   * @param {Array} validationResults - Validation results data
   * @param {Object} validationSummary - Validation summary data
   * @param {Object} filters - Applied filters
   * @returns {Object} Generated report data
   */
  static async generateReportData(template, validationResults, validationSummary, filters) {
    try {
      // Apply filters to data
      const filteredResults = this.applyFilters(validationResults, filters);
      
      // Generate summary statistics
      const summary = this.generateSummaryStatistics(filteredResults, validationSummary);
      
      // Generate charts based on template type
      const charts = this.generateCharts(template, filteredResults, summary);
      
      // Generate aggregations
      const aggregations = this.generateAggregations(filteredResults);
      
      return {
        summary,
        records: filteredResults,
        charts,
        aggregations
      };
    } catch (error) {
      console.error('Error generating report data:', error);
      throw new Error(`Failed to generate report data: ${error.message}`);
    }
  }

  /**
   * Apply filters to validation results
   * @param {Array} results - Validation results
   * @param {Object} filters - Filters to apply
   * @returns {Array} Filtered results
   */
  static applyFilters(results, filters) {
    let filteredResults = [...results];

    // Date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredResults = filteredResults.filter(result => 
        new Date(result.validatedAt) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filteredResults = filteredResults.filter(result => 
        new Date(result.validatedAt) <= endDate
      );
    }

    // Severity filter
    if (filters.severityLevels && filters.severityLevels.length > 0) {
      filteredResults = filteredResults.filter(result => 
        filters.severityLevels.includes(result.severity)
      );
    }

    // Discrepancy amount filter
    if (filters.minDiscrepancyAmount > 0) {
      filteredResults = filteredResults.filter(result => 
        result.discrepancy >= filters.minDiscrepancyAmount
      );
    }

    if (filters.maxDiscrepancyAmount !== null && filters.maxDiscrepancyAmount !== undefined) {
      filteredResults = filteredResults.filter(result => 
        result.discrepancy <= filters.maxDiscrepancyAmount
      );
    }

    // Customer filter
    if (filters.customerIds && filters.customerIds.length > 0) {
      filteredResults = filteredResults.filter(result => {
        const customerId = result.recordId.split('_')[0];
        return filters.customerIds.includes(customerId);
      });
    }

    // Validation fields filter
    if (filters.validationFields && filters.validationFields.length > 0) {
      filteredResults = filteredResults.filter(result => 
        filters.validationFields.includes(result.field)
      );
    }

    // Record type filter
    if (!filters.includeValidRecords) {
      filteredResults = filteredResults.filter(result => 
        result.severity !== 'low' && result.discrepancy > 0
      );
    }

    if (!filters.includeInvalidRecords) {
      filteredResults = filteredResults.filter(result => 
        result.severity === 'low' || result.discrepancy === 0
      );
    }

    // Apply sorting
    filteredResults.sort((a, b) => {
      const aValue = this.getSortValue(a, filters.sortBy);
      const bValue = this.getSortValue(b, filters.sortBy);

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredResults;
  }

  /**
   * Get sort value for a field
   * @param {Object} result - Validation result
   * @param {string} sortBy - Field to sort by
   * @returns {any} Sort value
   */
  static getSortValue(result, sortBy) {
    switch (sortBy) {
      case 'validatedAt':
        return new Date(result.validatedAt);
      case 'discrepancy':
        return result.discrepancy;
      case 'severity':
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        return severityOrder[result.severity] || 0;
      case 'field':
        return result.field;
      case 'recordId':
        return result.recordId;
      default:
        return result[sortBy] || '';
    }
  }

  /**
   * Generate summary statistics
   * @param {Array} filteredResults - Filtered validation results
   * @param {Object} originalSummary - Original validation summary
   * @returns {Object} Summary statistics
   */
  static generateSummaryStatistics(filteredResults, originalSummary) {
    const totalRecords = filteredResults.length;
    const validRecords = filteredResults.filter(r => r.severity === 'low' || r.discrepancy === 0).length;
    const invalidRecords = totalRecords - validRecords;
    const totalDiscrepancyAmount = filteredResults.reduce((sum, r) => sum + r.discrepancy, 0);

    const severityBreakdown = {
      low: filteredResults.filter(r => r.severity === 'low').length,
      medium: filteredResults.filter(r => r.severity === 'medium').length,
      high: filteredResults.filter(r => r.severity === 'high').length,
      critical: filteredResults.filter(r => r.severity === 'critical').length
    };

    const customerBreakdown = this.groupByCustomer(filteredResults);
    const timeBreakdown = this.groupByTimeperiod(filteredResults);

    return {
      totalRecords,
      validRecords,
      invalidRecords,
      totalDiscrepancies: totalRecords,
      totalDiscrepancyAmount,
      averageDiscrepancyAmount: totalRecords > 0 ? totalDiscrepancyAmount / totalRecords : 0,
      maxDiscrepancyAmount: totalRecords > 0 ? Math.max(...filteredResults.map(r => r.discrepancy)) : 0,
      severityBreakdown,
      customerBreakdown,
      timeBreakdown,
      validationStartTime: originalSummary?.validationStartTime || new Date().toISOString(),
      validationEndTime: originalSummary?.validationEndTime || new Date().toISOString(),
      processingTimeMs: originalSummary?.processingTimeMs || 0,
      batchId: originalSummary?.batchId || 'unknown'
    };
  }

  /**
   * Generate charts for the report
   * @param {Object} template - Report template
   * @param {Array} filteredResults - Filtered results
   * @param {Object} summary - Summary statistics
   * @returns {Array} Chart data
   */
  static generateCharts(template, filteredResults, summary) {
    const charts = [];

    // Always include severity distribution for analysis and summary reports
    if (template.type === 'summary' || template.type === 'analysis') {
      charts.push({
        id: 'severity-distribution',
        title: 'Discrepancies by Severity Level',
        type: 'pie',
        data: [
          { 
            name: 'Low', 
            value: summary.severityBreakdown.low, 
            color: '#10b981',
            percentage: summary.totalRecords > 0 ? (summary.severityBreakdown.low / summary.totalRecords * 100).toFixed(1) : 0
          },
          { 
            name: 'Medium', 
            value: summary.severityBreakdown.medium, 
            color: '#f59e0b',
            percentage: summary.totalRecords > 0 ? (summary.severityBreakdown.medium / summary.totalRecords * 100).toFixed(1) : 0
          },
          { 
            name: 'High', 
            value: summary.severityBreakdown.high, 
            color: '#ef4444',
            percentage: summary.totalRecords > 0 ? (summary.severityBreakdown.high / summary.totalRecords * 100).toFixed(1) : 0
          },
          { 
            name: 'Critical', 
            value: summary.severityBreakdown.critical, 
            color: '#dc2626',
            percentage: summary.totalRecords > 0 ? (summary.severityBreakdown.critical / summary.totalRecords * 100).toFixed(1) : 0
          }
        ],
        config: {
          showLegend: true,
          showLabels: true,
          showPercentages: true
        }
      });
    }

    // Discrepancy amount distribution
    if (template.type === 'analysis' || template.type === 'detailed') {
      const topDiscrepancies = filteredResults
        .sort((a, b) => b.discrepancy - a.discrepancy)
        .slice(0, 10);

      charts.push({
        id: 'top-discrepancies',
        title: 'Top 10 Discrepancies by Amount',
        type: 'bar',
        data: topDiscrepancies.map((r, index) => ({
          name: `${r.recordId.substring(0, 8)}...`,
          value: r.discrepancy,
          field: r.field,
          severity: r.severity,
          rank: index + 1
        })),
        config: {
          xAxisLabel: 'Records',
          yAxisLabel: 'Discrepancy Amount ($)',
          showGrid: true,
          showValues: true
        }
      });
    }

    // Field distribution chart
    if (template.type === 'analysis') {
      const fieldBreakdown = this.groupByField(filteredResults);
      const fieldData = Object.entries(fieldBreakdown)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8);

      charts.push({
        id: 'field-distribution',
        title: 'Discrepancies by Field Type',
        type: 'bar',
        data: fieldData.map(([field, data]) => ({
          name: field.replace(/([A-Z])/g, ' $1').trim(),
          value: data.count,
          totalAmount: data.totalDiscrepancy,
          averageAmount: data.averageDiscrepancy
        })),
        config: {
          xAxisLabel: 'Field Types',
          yAxisLabel: 'Number of Discrepancies',
          showGrid: true,
          showValues: true
        }
      });
    }

    // Time trend chart for audit reports
    if (template.type === 'audit') {
      const timeData = Object.entries(summary.timeBreakdown)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .slice(-7); // Last 7 days

      charts.push({
        id: 'time-trend',
        title: 'Validation Activity Over Time',
        type: 'line',
        data: timeData.map(([date, data]) => ({
          name: new Date(date).toLocaleDateString(),
          value: data.count,
          totalAmount: data.totalDiscrepancy
        })),
        config: {
          xAxisLabel: 'Date',
          yAxisLabel: 'Number of Validations',
          showGrid: true,
          showPoints: true
        }
      });
    }

    return charts;
  }

  /**
   * Generate data aggregations
   * @param {Array} filteredResults - Filtered results
   * @returns {Object} Aggregated data
   */
  static generateAggregations(filteredResults) {
    return {
      byField: this.groupByField(filteredResults),
      bySeverity: this.groupBySeverity(filteredResults),
      byCustomer: this.groupByCustomer(filteredResults),
      byDate: this.groupByTimeperiod(filteredResults)
    };
  }

  /**
   * Group results by field
   * @param {Array} results - Validation results
   * @returns {Object} Grouped data
   */
  static groupByField(results) {
    return results.reduce((acc, result) => {
      if (!acc[result.field]) {
        acc[result.field] = {
          count: 0,
          totalDiscrepancy: 0,
          averageDiscrepancy: 0,
          maxDiscrepancy: 0,
          records: []
        };
      }
      
      acc[result.field].count++;
      acc[result.field].totalDiscrepancy += result.discrepancy;
      acc[result.field].maxDiscrepancy = Math.max(acc[result.field].maxDiscrepancy, result.discrepancy);
      acc[result.field].averageDiscrepancy = acc[result.field].totalDiscrepancy / acc[result.field].count;
      acc[result.field].records.push(result);
      
      return acc;
    }, {});
  }

  /**
   * Group results by severity
   * @param {Array} results - Validation results
   * @returns {Object} Grouped data
   */
  static groupBySeverity(results) {
    return results.reduce((acc, result) => {
      if (!acc[result.severity]) {
        acc[result.severity] = {
          count: 0,
          totalDiscrepancy: 0,
          averageDiscrepancy: 0,
          records: []
        };
      }
      
      acc[result.severity].count++;
      acc[result.severity].totalDiscrepancy += result.discrepancy;
      acc[result.severity].averageDiscrepancy = acc[result.severity].totalDiscrepancy / acc[result.severity].count;
      acc[result.severity].records.push(result);
      
      return acc;
    }, {});
  }

  /**
   * Group results by customer
   * @param {Array} results - Validation results
   * @returns {Object} Grouped data
   */
  static groupByCustomer(results) {
    return results.reduce((acc, result) => {
      const customerId = result.recordId.split('_')[0];
      
      if (!acc[customerId]) {
        acc[customerId] = {
          count: 0,
          totalDiscrepancy: 0,
          averageDiscrepancy: 0,
          records: []
        };
      }
      
      acc[customerId].count++;
      acc[customerId].totalDiscrepancy += result.discrepancy;
      acc[customerId].averageDiscrepancy = acc[customerId].totalDiscrepancy / acc[customerId].count;
      acc[customerId].records.push(result);
      
      return acc;
    }, {});
  }

  /**
   * Group results by time period
   * @param {Array} results - Validation results
   * @returns {Object} Grouped data
   */
  static groupByTimeperiod(results) {
    return results.reduce((acc, result) => {
      const date = new Date(result.validatedAt).toDateString();
      
      if (!acc[date]) {
        acc[date] = {
          count: 0,
          totalDiscrepancy: 0,
          averageDiscrepancy: 0,
          records: []
        };
      }
      
      acc[date].count++;
      acc[date].totalDiscrepancy += result.discrepancy;
      acc[date].averageDiscrepancy = acc[date].totalDiscrepancy / acc[date].count;
      acc[date].records.push(result);
      
      return acc;
    }, {});
  }

  /**
   * Validate report template
   * @param {Object} template - Template to validate
   * @returns {Object} Validation result
   */
  static validateTemplate(template) {
    const errors = [];
    
    if (!template.id) {
      errors.push('Template ID is required');
    }
    
    if (!template.name) {
      errors.push('Template name is required');
    }
    
    if (!template.type || !Object.values(REPORT_TYPES).includes(template.type)) {
      errors.push('Valid template type is required');
    }
    
    if (!template.sections || !Array.isArray(template.sections)) {
      errors.push('Template sections are required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available report templates
   * @returns {Array} Available templates
   */
  static getAvailableTemplates() {
    return DEFAULT_REPORT_TEMPLATES.filter(template => template.isActive);
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Object|null} Template or null if not found
   */
  static getTemplateById(templateId) {
    return DEFAULT_REPORT_TEMPLATES.find(template => template.id === templateId) || null;
  }
}

export default ReportService;