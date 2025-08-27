/**
 * Report System Type Definitions
 * 
 * This file contains all type definitions related to report generation,
 * filtering, and export functionality for the Invoice Validation System.
 */

/**
 * Report template definition
 * @typedef {Object} ReportTemplate
 * @property {string} id - Unique template identifier
 * @property {string} name - Display name of the report
 * @property {string} description - Description of what the report contains
 * @property {'summary' | 'detailed' | 'analysis' | 'audit' | 'custom'} type - Report type
 * @property {string[]} requiredFields - Fields required for this report
 * @property {ReportSection[]} sections - Sections included in the report
 * @property {boolean} isActive - Whether the template is active
 * @property {Date} createdAt - When the template was created
 * @property {Date} updatedAt - When the template was last updated
 */

/**
 * Report section configuration
 * @typedef {Object} ReportSection
 * @property {string} id - Section identifier
 * @property {string} title - Section title
 * @property {'table' | 'chart' | 'summary' | 'text'} type - Section type
 * @property {Object} config - Section-specific configuration
 * @property {number} order - Display order
 * @property {boolean} isRequired - Whether section is required
 */

/**
 * Report filters for data selection
 * @typedef {Object} ReportFilters
 * @property {string} startDate - Start date for date range (ISO string)
 * @property {string} endDate - End date for date range (ISO string)
 * @property {string[]} customerIds - Selected customer IDs
 * @property {string[]} invoiceNumbers - Selected invoice numbers
 * @property {string[]} validationStatuses - Selected validation statuses
 * @property {string[]} severityLevels - Selected severity levels
 * @property {number} minDiscrepancyAmount - Minimum discrepancy amount
 * @property {number} maxDiscrepancyAmount - Maximum discrepancy amount
 * @property {string[]} reportTypes - Selected report types
 * @property {boolean} includeValidRecords - Whether to include valid records
 * @property {boolean} includeInvalidRecords - Whether to include invalid records
 * @property {string} sortBy - Field to sort by
 * @property {'asc' | 'desc'} sortOrder - Sort order
 */

/**
 * Generated report instance
 * @typedef {Object} GeneratedReport
 * @property {string} id - Unique report identifier
 * @property {string} templateId - Template used for generation
 * @property {string} name - Report name
 * @property {ReportFilters} filters - Filters applied during generation
 * @property {ReportData} data - Generated report data
 * @property {ReportMetadata} metadata - Report metadata
 * @property {'generating' | 'completed' | 'failed'} status - Generation status
 * @property {Date} generatedAt - When the report was generated
 * @property {string} generatedBy - User who generated the report
 * @property {number} recordCount - Number of records in the report
 * @property {string} error - Error message if generation failed
 */

/**
 * Report data structure
 * @typedef {Object} ReportData
 * @property {ReportSummary} summary - Summary statistics
 * @property {Object[]} records - Detailed records data
 * @property {ChartData[]} charts - Chart data for visualizations
 * @property {Object} aggregations - Aggregated data by various dimensions
 */

/**
 * Report summary statistics
 * @typedef {Object} ReportSummary
 * @property {number} totalRecords - Total records processed
 * @property {number} validRecords - Number of valid records
 * @property {number} invalidRecords - Number of invalid records
 * @property {number} totalDiscrepancies - Total discrepancies found
 * @property {number} totalDiscrepancyAmount - Sum of all discrepancy amounts
 * @property {number} averageDiscrepancyAmount - Average discrepancy amount
 * @property {Object} severityBreakdown - Breakdown by severity level
 * @property {Object} customerBreakdown - Breakdown by customer
 * @property {Object} timeBreakdown - Breakdown by time period
 */

/**
 * Chart data for report visualizations
 * @typedef {Object} ChartData
 * @property {string} id - Chart identifier
 * @property {string} title - Chart title
 * @property {'bar' | 'line' | 'pie' | 'area'} type - Chart type
 * @property {Object[]} data - Chart data points
 * @property {Object} config - Chart configuration options
 */

/**
 * Report metadata
 * @typedef {Object} ReportMetadata
 * @property {string} version - Report format version
 * @property {Date} generatedAt - Generation timestamp
 * @property {string} generatedBy - User who generated the report
 * @property {ReportFilters} appliedFilters - Filters used
 * @property {number} processingTimeMs - Time taken to generate
 * @property {string} dataSource - Source of the data
 * @property {Object} systemInfo - System information at generation time
 */

/**
 * Export options for reports
 * @typedef {Object} ExportOptions
 * @property {'pdf' | 'excel' | 'csv' | 'json'} format - Export format
 * @property {string} filename - Desired filename (without extension)
 * @property {boolean} includeCharts - Whether to include charts in export
 * @property {boolean} includeMetadata - Whether to include metadata
 * @property {boolean} includeRawData - Whether to include raw data
 * @property {Object} formatOptions - Format-specific options
 */

/**
 * Export progress tracking
 * @typedef {Object} ExportProgress
 * @property {string} exportId - Unique export identifier
 * @property {'preparing' | 'exporting' | 'completed' | 'failed'} status - Export status
 * @property {number} progressPercentage - Progress as percentage (0-100)
 * @property {string} currentStep - Description of current step
 * @property {Date} startTime - When export started
 * @property {Date} estimatedEndTime - Estimated completion time
 * @property {string} downloadUrl - URL for downloading completed export
 * @property {string} error - Error message if export failed
 */

// Default report templates
export const DEFAULT_REPORT_TEMPLATES = [
  {
    id: 'validation-summary',
    name: 'Validation Summary Report',
    description: 'Overview of all validation activities and results',
    type: 'summary',
    requiredFields: ['totalRecords', 'validRecords', 'invalidRecords', 'discrepancies'],
    sections: [
      { id: 'summary', title: 'Executive Summary', type: 'summary', order: 1, isRequired: true },
      { id: 'charts', title: 'Visual Analysis', type: 'chart', order: 2, isRequired: false },
      { id: 'details', title: 'Detailed Results', type: 'table', order: 3, isRequired: true }
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'discrepancy-analysis',
    name: 'Discrepancy Analysis Report',
    description: 'Detailed analysis of found discrepancies and patterns',
    type: 'analysis',
    requiredFields: ['discrepancies', 'severityLevels', 'patterns'],
    sections: [
      { id: 'overview', title: 'Discrepancy Overview', type: 'summary', order: 1, isRequired: true },
      { id: 'severity', title: 'Severity Analysis', type: 'chart', order: 2, isRequired: true },
      { id: 'patterns', title: 'Pattern Analysis', type: 'chart', order: 3, isRequired: false },
      { id: 'details', title: 'Detailed Discrepancies', type: 'table', order: 4, isRequired: true }
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'audit-trail',
    name: 'Audit Trail Report',
    description: 'Complete audit trail of system activities',
    type: 'audit',
    requiredFields: ['activities', 'users', 'timestamps'],
    sections: [
      { id: 'summary', title: 'Activity Summary', type: 'summary', order: 1, isRequired: true },
      { id: 'timeline', title: 'Activity Timeline', type: 'chart', order: 2, isRequired: false },
      { id: 'details', title: 'Detailed Activities', type: 'table', order: 3, isRequired: true }
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Default report filters
export const DEFAULT_REPORT_FILTERS = {
  startDate: '',
  endDate: '',
  customerIds: [],
  invoiceNumbers: [],
  validationStatuses: [],
  severityLevels: [],
  minDiscrepancyAmount: 0,
  maxDiscrepancyAmount: null,
  reportTypes: [],
  includeValidRecords: true,
  includeInvalidRecords: true,
  sortBy: 'date',
  sortOrder: 'desc'
};

// Export format options
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json'
};

// Report types
export const REPORT_TYPES = {
  SUMMARY: 'summary',
  DETAILED: 'detailed',
  ANALYSIS: 'analysis',
  AUDIT: 'audit',
  CUSTOM: 'custom'
};

// Severity levels for filtering
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Create an empty report filters object
 * @returns {ReportFilters}
 */
export const createEmptyReportFilters = () => ({
  ...DEFAULT_REPORT_FILTERS
});

/**
 * Create an empty generated report
 * @param {string} templateId - Template ID
 * @param {string} name - Report name
 * @returns {GeneratedReport}
 */
export const createEmptyGeneratedReport = (templateId, name) => ({
  id: '',
  templateId,
  name,
  filters: createEmptyReportFilters(),
  data: {
    summary: {},
    records: [],
    charts: [],
    aggregations: {}
  },
  metadata: {
    version: '1.0',
    generatedAt: new Date(),
    generatedBy: '',
    appliedFilters: createEmptyReportFilters(),
    processingTimeMs: 0,
    dataSource: 'validation-system',
    systemInfo: {}
  },
  status: 'generating',
  generatedAt: new Date(),
  generatedBy: '',
  recordCount: 0,
  error: ''
});