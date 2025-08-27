import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  DEFAULT_REPORT_TEMPLATES, 
  DEFAULT_REPORT_FILTERS,
  createEmptyReportFilters,
  createEmptyGeneratedReport
} from '../../types/reports.js';

// Async thunks for report operations
export const generateReport = createAsyncThunk(
  'reports/generateReport',
  async ({ templateId, filters, name }, { getState, rejectWithValue }) => {
    try {
      const startTime = Date.now();
      
      // Get validation data from state
      const { validation } = getState();
      const { results, summary } = validation;
      
      // Apply filters to validation data
      const filteredResults = applyFiltersToData(results, filters);
      
      // Generate report data based on template
      const template = DEFAULT_REPORT_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const reportData = await generateReportData(template, filteredResults, summary, filters);
      
      const processingTime = Date.now() - startTime;
      
      const report = {
        ...createEmptyGeneratedReport(templateId, name),
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: reportData,
        metadata: {
          version: '1.0',
          generatedAt: new Date(),
          generatedBy: getState().auth.user?.name || 'System',
          appliedFilters: filters,
          processingTimeMs: processingTime,
          dataSource: 'validation-system',
          systemInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        },
        status: 'completed',
        generatedAt: new Date(),
        generatedBy: getState().auth.user?.name || 'System',
        recordCount: filteredResults.length
      };
      
      return report;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const exportReport = createAsyncThunk(
  'reports/exportReport',
  async ({ reportId, exportOptions, onProgress }, { getState, rejectWithValue }) => {
    try {
      const { reports } = getState();
      const report = reports.generated.find(r => r.id === reportId);
      
      if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
      }
      
      // Generate export based on format with progress tracking
      const exportResult = await generateExport(report, exportOptions, onProgress);
      
      return {
        exportId: exportResult.exportId,
        reportId,
        exportOptions,
        downloadUrl: exportResult.downloadUrl,
        filename: exportResult.filename,
        size: exportResult.size,
        type: exportResult.type,
        processingTimeMs: exportResult.processingTimeMs,
        metadata: exportResult.metadata,
        status: 'completed',
        completedAt: new Date()
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper functions
const applyFiltersToData = (results, filters) => {
  let filteredResults = [...results];
  
  // Apply date range filter
  if (filters.startDate) {
    filteredResults = filteredResults.filter(result => 
      new Date(result.validatedAt) >= new Date(filters.startDate)
    );
  }
  
  if (filters.endDate) {
    filteredResults = filteredResults.filter(result => 
      new Date(result.validatedAt) <= new Date(filters.endDate)
    );
  }
  
  // Apply severity filter
  if (filters.severityLevels.length > 0) {
    filteredResults = filteredResults.filter(result => 
      filters.severityLevels.includes(result.severity)
    );
  }
  
  // Apply discrepancy amount filter
  if (filters.minDiscrepancyAmount > 0) {
    filteredResults = filteredResults.filter(result => 
      result.discrepancy >= filters.minDiscrepancyAmount
    );
  }
  
  if (filters.maxDiscrepancyAmount !== null) {
    filteredResults = filteredResults.filter(result => 
      result.discrepancy <= filters.maxDiscrepancyAmount
    );
  }
  
  // Apply sorting
  filteredResults.sort((a, b) => {
    const aValue = a[filters.sortBy];
    const bValue = b[filters.sortBy];
    
    if (filters.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return filteredResults;
};

const generateReportData = async (template, filteredResults, summary, filters) => {
  const reportSummary = {
    totalRecords: filteredResults.length,
    validRecords: filteredResults.filter(r => r.severity === 'low' || r.discrepancy === 0).length,
    invalidRecords: filteredResults.filter(r => r.severity !== 'low' && r.discrepancy > 0).length,
    totalDiscrepancies: filteredResults.length,
    totalDiscrepancyAmount: filteredResults.reduce((sum, r) => sum + r.discrepancy, 0),
    averageDiscrepancyAmount: filteredResults.length > 0 
      ? filteredResults.reduce((sum, r) => sum + r.discrepancy, 0) / filteredResults.length 
      : 0,
    severityBreakdown: {
      low: filteredResults.filter(r => r.severity === 'low').length,
      medium: filteredResults.filter(r => r.severity === 'medium').length,
      high: filteredResults.filter(r => r.severity === 'high').length,
      critical: filteredResults.filter(r => r.severity === 'critical').length
    },
    customerBreakdown: {},
    timeBreakdown: {}
  };
  
  // Generate charts based on template type
  const charts = [];
  
  if (template.type === 'summary' || template.type === 'analysis') {
    // Severity distribution chart
    charts.push({
      id: 'severity-distribution',
      title: 'Discrepancies by Severity',
      type: 'pie',
      data: [
        { name: 'Low', value: reportSummary.severityBreakdown.low, color: '#10b981' },
        { name: 'Medium', value: reportSummary.severityBreakdown.medium, color: '#f59e0b' },
        { name: 'High', value: reportSummary.severityBreakdown.high, color: '#ef4444' },
        { name: 'Critical', value: reportSummary.severityBreakdown.critical, color: '#dc2626' }
      ],
      config: {
        showLegend: true,
        showLabels: true
      }
    });
    
    // Discrepancy amount trend
    charts.push({
      id: 'discrepancy-trend',
      title: 'Discrepancy Amount Trend',
      type: 'bar',
      data: filteredResults.slice(0, 10).map(r => ({
        name: r.recordId.substring(0, 8),
        value: r.discrepancy,
        field: r.field
      })),
      config: {
        xAxisLabel: 'Records',
        yAxisLabel: 'Discrepancy Amount',
        showGrid: true
      }
    });
  }
  
  return {
    summary: reportSummary,
    records: filteredResults,
    charts,
    aggregations: {
      byField: groupByField(filteredResults),
      bySeverity: reportSummary.severityBreakdown,
      byDate: groupByDate(filteredResults)
    }
  };
};

const groupByField = (results) => {
  return results.reduce((acc, result) => {
    if (!acc[result.field]) {
      acc[result.field] = {
        count: 0,
        totalDiscrepancy: 0,
        averageDiscrepancy: 0
      };
    }
    acc[result.field].count++;
    acc[result.field].totalDiscrepancy += result.discrepancy;
    acc[result.field].averageDiscrepancy = acc[result.field].totalDiscrepancy / acc[result.field].count;
    return acc;
  }, {});
};

const groupByDate = (results) => {
  return results.reduce((acc, result) => {
    const date = new Date(result.validatedAt).toDateString();
    if (!acc[date]) {
      acc[date] = {
        count: 0,
        totalDiscrepancy: 0
      };
    }
    acc[date].count++;
    acc[date].totalDiscrepancy += result.discrepancy;
    return acc;
  }, {});
};

const generateExport = async (report, exportOptions, onProgress) => {
  // Import ExportService dynamically to avoid circular dependencies
  const { default: ExportService } = await import('../../services/ExportService.js');
  
  // Use the actual ExportService to generate the export with progress tracking
  return await ExportService.exportReport(report, exportOptions, onProgress);
};

// Initial state
const initialState = {
  templates: DEFAULT_REPORT_TEMPLATES,
  generated: [],
  filters: createEmptyReportFilters(),
  isGenerating: false,
  isExporting: false,
  exports: [],
  error: null,
  selectedTemplate: null,
  previewData: null
};

// Reports slice
const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = createEmptyReportFilters();
    },
    setSelectedTemplate: (state, action) => {
      state.selectedTemplate = action.payload;
    },
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
    },
    setPreviewData: (state, action) => {
      state.previewData = action.payload;
    },
    clearPreviewData: (state) => {
      state.previewData = null;
    },
    deleteReport: (state, action) => {
      state.generated = state.generated.filter(report => report.id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Generate report
      .addCase(generateReport.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generated.unshift(action.payload);
        state.error = null;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload;
      })
      // Export report
      .addCase(exportReport.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportReport.fulfilled, (state, action) => {
        state.isExporting = false;
        state.exports.unshift(action.payload);
        state.error = null;
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload;
      });
  }
});

export const {
  setFilters,
  clearFilters,
  setSelectedTemplate,
  clearSelectedTemplate,
  setPreviewData,
  clearPreviewData,
  deleteReport,
  clearError
} = reportsSlice.actions;

export default reportsSlice.reducer;