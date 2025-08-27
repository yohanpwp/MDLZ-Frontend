/**
 * Export Service
 *
 * Handles report export functionality including PDF, Excel, CSV, and JSON formats
 * for the Invoice Validation System reporting functionality.
 */

import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

class ExportService {
  // Static property to track active exports
  static activeExports = new Map();
  static exportListeners = new Map();

  /**
   * Export report to specified format with progress tracking
   * @param {Object} report - Report data to export
   * @param {Object} exportOptions - Export configuration options
   * @param {Function} onProgress - Progress callback function
   * @returns {Object} Export result with download URL and filename
   */
  static async exportReport(report, exportOptions, onProgress = null) {
    const exportId = `export_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const startTime = Date.now();

    try {
      const {
        format,
        filename,
        includeCharts,
        includeMetadata,
        includeRawData,
        formatOptions,
      } = exportOptions;

      // Initialize progress tracking
      this.updateProgress(
        exportId,
        {
          status: "preparing",
          progress: 0,
          currentStep: "Initializing export...",
          startTime: new Date(startTime),
          estimatedEndTime: null,
        },
        onProgress
      );

      // Add metadata to export options
      const enhancedOptions = {
        ...exportOptions,
        exportMetadata: {
          exportId,
          exportedAt: new Date(),
          exportedBy: report.generatedBy || "System",
          originalReportId: report.id,
          appliedFilters: report.filters || {},
          systemInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            format,
            includeCharts,
            includeMetadata,
            includeRawData,
          },
        },
      };

      let blob;
      let finalFilename = `${filename}.${format}`;

      this.updateProgress(
        exportId,
        {
          status: "exporting",
          progress: 25,
          currentStep: `Generating ${format.toUpperCase()} export...`,
        },
        onProgress
      );

      switch (format) {
        case "pdf":
          blob = await this.exportToPDF(report, enhancedOptions, (progress) => {
            this.updateProgress(
              exportId,
              {
                progress: 25 + progress * 0.6,
                currentStep: "Generating PDF content...",
              },
              onProgress
            );
          });
          break;
        case "excel":
          blob = await this.exportToExcel(
            report,
            enhancedOptions,
            (progress) => {
              this.updateProgress(
                exportId,
                {
                  progress: 25 + progress * 0.6,
                  currentStep: "Generating Excel workbook...",
                },
                onProgress
              );
            }
          );
          break;
        case "csv":
          blob = await this.exportToCSV(report, enhancedOptions, (progress) => {
            this.updateProgress(
              exportId,
              {
                progress: 25 + progress * 0.6,
                currentStep: "Generating CSV data...",
              },
              onProgress
            );
          });
          break;
        case "json":
          blob = await this.exportToJSON(
            report,
            enhancedOptions,
            (progress) => {
              this.updateProgress(
                exportId,
                {
                  progress: 25 + progress * 0.6,
                  currentStep: "Generating JSON data...",
                },
                onProgress
              );
            }
          );
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      this.updateProgress(
        exportId,
        {
          progress: 90,
          currentStep: "Finalizing export...",
        },
        onProgress
      );

      // Create download URL
      const downloadUrl = URL.createObjectURL(blob);

      const processingTime = Date.now() - startTime;

      this.updateProgress(
        exportId,
        {
          status: "completed",
          progress: 100,
          currentStep: "Export completed successfully",
          downloadUrl,
          processingTimeMs: processingTime,
        },
        onProgress
      );

      // Clean up progress tracking after a delay
      setTimeout(() => {
        this.activeExports.delete(exportId);
        this.exportListeners.delete(exportId);
      }, 30000); // Clean up after 30 seconds

      return {
        exportId,
        downloadUrl,
        filename: finalFilename,
        size: blob.size,
        type: blob.type,
        processingTimeMs: processingTime,
        metadata: enhancedOptions.exportMetadata,
      };
    } catch (error) {
      console.error("Export error:", error);
      this.updateProgress(
        exportId,
        {
          status: "failed",
          progress: 0,
          currentStep: "Export failed",
          error: error.message,
        },
        onProgress
      );
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Update export progress and notify listeners
   * @param {string} exportId - Export ID
   * @param {Object} progressData - Progress data
   * @param {Function} onProgress - Progress callback
   */
  static updateProgress(exportId, progressData, onProgress = null) {
    const currentProgress = this.activeExports.get(exportId) || {};
    const updatedProgress = {
      ...currentProgress,
      ...progressData,
      exportId,
      lastUpdated: new Date(),
    };

    this.activeExports.set(exportId, updatedProgress);

    // Call progress callback if provided
    if (onProgress && typeof onProgress === "function") {
      onProgress(updatedProgress);
    }

    // Notify any registered listeners
    const listeners = this.exportListeners.get(exportId) || [];
    listeners.forEach((listener) => {
      try {
        listener(updatedProgress);
      } catch (error) {
        console.error("Error in export progress listener:", error);
      }
    });
  }

  /**
   * Export report to PDF format
   * @param {Object} report - Report data
   * @param {Object} options - Export options
   * @param {Function} onProgress - Progress callback
   * @returns {Blob} PDF blob
   */
  static async exportToPDF(report, options, onProgress = null) {
    const {
      formatOptions = {},
      includeMetadata,
      includeCharts,
      exportMetadata,
    } = options;
    const { pageSize = "a4", orientation = "portrait" } = formatOptions;

    // Create PDF document
    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: pageSize,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Report progress
    if (onProgress) onProgress(10);

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text(report.name, margin, yPosition);
    yPosition += 15;

    // Metadata section
    if (includeMetadata) {
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text(
        `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
        margin,
        yPosition
      );
      yPosition += 7;
      doc.text(`Generated by: ${report.generatedBy}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Records: ${report.recordCount}`, margin, yPosition);
      yPosition += 7;

      // Export metadata
      if (exportMetadata) {
        doc.text(
          `Exported: ${new Date(exportMetadata.exportedAt).toLocaleString()}`,
          margin,
          yPosition
        );
        yPosition += 7;
        doc.text(
          `Exported by: ${exportMetadata.exportedBy}`,
          margin,
          yPosition
        );
        yPosition += 7;
        doc.text(`Export ID: ${exportMetadata.exportId}`, margin, yPosition);
        yPosition += 7;
      }
      yPosition += 8;
    }

    // Report progress
    if (onProgress) onProgress(30);

    // Summary section
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("Summary", margin, yPosition);
    yPosition += 10;

    const summaryData = [
      ["Total Records", report.data.summary.totalRecords.toString()],
      ["Valid Records", report.data.summary.validRecords.toString()],
      ["Invalid Records", report.data.summary.invalidRecords.toString()],
      [
        "Total Discrepancy Amount",
        `$${report.data.summary.totalDiscrepancyAmount.toFixed(2)}`,
      ],
      [
        "Average Discrepancy",
        `$${report.data.summary.averageDiscrepancyAmount.toFixed(2)}`,
      ],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: margin, right: margin },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Report progress
    if (onProgress) onProgress(50);

    // Severity breakdown
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Severity Breakdown", margin, yPosition);
    yPosition += 10;

    const severityData = Object.entries(
      report.data.summary.severityBreakdown
    ).map(([severity, count]) => [
      severity.charAt(0).toUpperCase() + severity.slice(1),
      count.toString(),
      `${((count / report.data.summary.totalRecords) * 100).toFixed(1)}%`,
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [["Severity", "Count", "Percentage"]],
      body: severityData,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: margin, right: margin },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Report progress
    if (onProgress) onProgress(70);

    // Detailed results table
    if (report.data.records.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Detailed Results", margin, yPosition);
      yPosition += 10;

      const detailsData = report.data.records
        .slice(0, 50)
        .map((record) => [
          record.recordId.substring(0, 12) + "...",
          record.field,
          record.originalValue.toString(),
          record.calculatedValue.toString(),
          `$${record.discrepancy.toFixed(2)}`,
          record.severity,
        ]);

      doc.autoTable({
        startY: yPosition,
        head: [
          [
            "Record ID",
            "Field",
            "Original",
            "Calculated",
            "Discrepancy",
            "Severity",
          ],
        ],
        body: detailsData,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 15 },
        },
      });

      if (report.data.records.length > 50) {
        yPosition = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont(undefined, "italic");
        doc.text(
          `Note: Showing first 50 of ${report.data.records.length} records`,
          margin,
          yPosition
        );
      }
    }

    // Report progress
    if (onProgress) onProgress(90);

    // Footer with export metadata
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin - 20,
        pageHeight - 10
      );

      // Add export metadata to footer if available
      if (exportMetadata && i === pageCount) {
        doc.text(
          `Export ID: ${exportMetadata.exportId}`,
          margin,
          pageHeight - 10
        );
      }
    }

    // Report final progress
    if (onProgress) onProgress(100);

    return new Blob([doc.output("blob")], { type: "application/pdf" });
  }

  /**
   * Export report to Excel format
   * @param {Object} report - Report data
   * @param {Object} options - Export options
   * @param {Function} onProgress - Progress callback
   * @returns {Blob} Excel blob
   */
  static async exportToExcel(report, options, onProgress = null) {
    const { formatOptions = {}, includeMetadata, exportMetadata } = options;
    const { separateSheets = false, includeFormulas = false } = formatOptions;

    const workbook = XLSX.utils.book_new();

    // Report progress
    if (onProgress) onProgress(10);

    // Summary sheet
    const summaryData = [
      ["Metric", "Value"],
      ["Report Name", report.name],
      ["Generated Date", new Date(report.generatedAt).toLocaleString()],
      ["Generated By", report.generatedBy],
      ["Total Records", report.data.summary.totalRecords],
      ["Valid Records", report.data.summary.validRecords],
      ["Invalid Records", report.data.summary.invalidRecords],
      ["Total Discrepancy Amount", report.data.summary.totalDiscrepancyAmount],
      [
        "Average Discrepancy Amount",
        report.data.summary.averageDiscrepancyAmount,
      ],
      ["Max Discrepancy Amount", report.data.summary.maxDiscrepancyAmount || 0],
      [],
    ];

    // Add export metadata if available
    if (includeMetadata && exportMetadata) {
      summaryData.push(
        ["Export Information", ""],
        ["Export Date", new Date(exportMetadata.exportedAt).toLocaleString()],
        ["Exported By", exportMetadata.exportedBy],
        ["Export ID", exportMetadata.exportId],
        []
      );
    }

    summaryData.push(
      ["Severity Breakdown", ""],
      ["Low", report.data.summary.severityBreakdown.low],
      ["Medium", report.data.summary.severityBreakdown.medium],
      ["High", report.data.summary.severityBreakdown.high],
      ["Critical", report.data.summary.severityBreakdown.critical]
    );

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Report progress
    if (onProgress) onProgress(30);

    // Detailed results sheet
    if (report.data.records.length > 0) {
      const detailsHeaders = [
        "Record ID",
        "Field",
        "Original Value",
        "Calculated Value",
        "Discrepancy",
        "Discrepancy %",
        "Severity",
        "Validated At",
        "Message",
      ];

      const detailsData = [
        detailsHeaders,
        ...report.data.records.map((record) => [
          record.recordId,
          record.field,
          record.originalValue,
          record.calculatedValue,
          record.discrepancy,
          record.discrepancyPercentage ||
            ((record.discrepancy / record.originalValue) * 100).toFixed(2),
          record.severity,
          new Date(record.validatedAt || new Date()).toLocaleString(),
          record.message || "",
        ]),
      ];

      const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);

      // Add formulas if requested
      if (includeFormulas) {
        // Add a formula to calculate total discrepancy
        const totalRow = report.data.records.length + 2;
        XLSX.utils.sheet_add_aoa(
          detailsSheet,
          [
            [
              "Total Discrepancy:",
              { f: `SUM(E2:E${report.data.records.length + 1})` },
            ],
          ],
          { origin: `D${totalRow}` }
        );
      }

      XLSX.utils.book_append_sheet(workbook, detailsSheet, "Detailed Results");

      // Report progress
      if (onProgress) onProgress(60);
    }

    // Field aggregation sheet (if separate sheets enabled)
    if (separateSheets && report.data.aggregations.byField) {
      const fieldHeaders = [
        "Field",
        "Count",
        "Total Discrepancy",
        "Average Discrepancy",
        "Max Discrepancy",
      ];
      const fieldData = [
        fieldHeaders,
        ...Object.entries(report.data.aggregations.byField).map(
          ([field, data]) => [
            field,
            data.count,
            data.totalDiscrepancy,
            data.averageDiscrepancy,
            data.maxDiscrepancy || 0,
          ]
        ),
      ];

      const fieldSheet = XLSX.utils.aoa_to_sheet(fieldData);
      XLSX.utils.book_append_sheet(workbook, fieldSheet, "By Field");
    }

    // Customer aggregation sheet (if separate sheets enabled)
    if (separateSheets && report.data.aggregations.byCustomer) {
      const customerHeaders = [
        "Customer",
        "Count",
        "Total Discrepancy",
        "Average Discrepancy",
      ];
      const customerData = [
        customerHeaders,
        ...Object.entries(report.data.aggregations.byCustomer).map(
          ([customer, data]) => [
            customer,
            data.count,
            data.totalDiscrepancy,
            data.averageDiscrepancy,
          ]
        ),
      ];

      const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
      XLSX.utils.book_append_sheet(workbook, customerSheet, "By Customer");
    }

    // Report progress
    if (onProgress) onProgress(90);

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Report final progress
    if (onProgress) onProgress(100);

    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  /**
   * Export report to CSV format
   * @param {Object} report - Report data
   * @param {Object} options - Export options
   * @param {Function} onProgress - Progress callback
   * @returns {Blob} CSV blob
   */
  static async exportToCSV(report, options, onProgress = null) {
    const { includeMetadata, exportMetadata } = options;

    let csvContent = "";

    // Report progress
    if (onProgress) onProgress(10);

    // Add metadata if requested
    if (includeMetadata) {
      csvContent += `Report Name,${report.name}\n`;
      csvContent += `Generated Date,${new Date(
        report.generatedAt
      ).toLocaleString()}\n`;
      csvContent += `Generated By,${report.generatedBy}\n`;
      csvContent += `Total Records,${report.recordCount}\n`;

      // Add export metadata if available
      if (exportMetadata) {
        csvContent += `Export Date,${new Date(
          exportMetadata.exportedAt
        ).toLocaleString()}\n`;
        csvContent += `Exported By,${exportMetadata.exportedBy}\n`;
        csvContent += `Export ID,${exportMetadata.exportId}\n`;
      }

      csvContent += "\n";
    }

    // Report progress
    if (onProgress) onProgress(30);

    // Add headers
    const headers = [
      "Record ID",
      "Field",
      "Original Value",
      "Calculated Value",
      "Discrepancy",
      "Discrepancy Percentage",
      "Severity",
      "Validated At",
      "Message",
    ];

    csvContent += headers.join(",") + "\n";

    // Add data rows
    report.data.records.forEach((record, index) => {
      const row = [
        `"${record.recordId}"`,
        `"${record.field}"`,
        record.originalValue,
        record.calculatedValue,
        record.discrepancy,
        record.discrepancyPercentage ||
          ((record.discrepancy / record.originalValue) * 100).toFixed(2),
        `"${record.severity}"`,
        `"${new Date(record.validatedAt || new Date()).toLocaleString()}"`,
        `"${record.message || ""}"`,
      ];
      csvContent += row.join(",") + "\n";

      // Report progress periodically
      if (onProgress && index % 100 === 0) {
        const progress = 30 + (index / report.data.records.length) * 60;
        onProgress(Math.min(progress, 90));
      }
    });

    // Report final progress
    if (onProgress) onProgress(100);

    return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  }

  /**
   * Export report to JSON format
   * @param {Object} report - Report data
   * @param {Object} options - Export options
   * @param {Function} onProgress - Progress callback
   * @returns {Blob} JSON blob
   */
  static async exportToJSON(report, options, onProgress = null) {
    const { includeMetadata, includeRawData, exportMetadata } = options;

    // Report progress
    if (onProgress) onProgress(20);

    const exportData = {
      reportInfo: {
        name: report.name,
        id: report.id,
        templateId: report.templateId,
        generatedAt: report.generatedAt,
        generatedBy: report.generatedBy,
        recordCount: report.recordCount,
        status: report.status,
      },
      summary: report.data.summary,
      records: report.data.records,
    };

    // Report progress
    if (onProgress) onProgress(50);

    if (includeMetadata) {
      exportData.metadata = report.metadata;
      exportData.filters = report.filters;

      // Add export metadata if available
      if (exportMetadata) {
        exportData.exportInfo = exportMetadata;
      }
    }

    if (includeRawData) {
      exportData.charts = report.data.charts;
      exportData.aggregations = report.data.aggregations;
    }

    // Report progress
    if (onProgress) onProgress(80);

    const jsonString = JSON.stringify(exportData, null, 2);

    // Report final progress
    if (onProgress) onProgress(100);

    return new Blob([jsonString], { type: "application/json;charset=utf-8;" });
  }

  /**
   * Get export progress
   * @param {string} exportId - Export ID
   * @returns {Object} Progress information
   */
  static getExportProgress(exportId) {
    return (
      this.activeExports.get(exportId) || {
        exportId,
        status: "not_found",
        progress: 0,
        currentStep: "Export not found",
        error: "Export ID not found",
      }
    );
  }

  /**
   * Add progress listener for an export
   * @param {string} exportId - Export ID
   * @param {Function} listener - Progress listener function
   * @returns {Function} Cleanup function to remove listener
   */
  static addProgressListener(exportId, listener) {
    if (!this.exportListeners.has(exportId)) {
      this.exportListeners.set(exportId, []);
    }

    const listeners = this.exportListeners.get(exportId);
    listeners.push(listener);

    // Return cleanup function
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove progress listener
   * @param {string} exportId - Export ID
   * @param {Function} listener - Listener to remove
   */
  static removeProgressListener(exportId, listener) {
    const listeners = this.exportListeners.get(exportId);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Cancel export (enhanced implementation)
   * @param {string} exportId - Export ID
   * @returns {boolean} Success status
   */
  static cancelExport(exportId) {
    const exportProgress = this.activeExports.get(exportId);

    if (!exportProgress) {
      return false;
    }

    if (
      exportProgress.status === "completed" ||
      exportProgress.status === "failed"
    ) {
      return false; // Cannot cancel completed or failed exports
    }

    // Update progress to cancelled
    this.updateProgress(exportId, {
      status: "cancelled",
      progress: 0,
      currentStep: "Export cancelled by user",
      cancelledAt: new Date(),
    });

    console.log(`Export ${exportId} cancelled`);
    return true;
  }

  /**
   * Clean up completed exports older than specified time
   * @param {number} maxAgeMs - Maximum age in milliseconds (default: 1 hour)
   */
  static cleanupOldExports(maxAgeMs = 3600000) {
    const now = Date.now();

    for (const [exportId, progress] of this.activeExports.entries()) {
      const exportTime = progress.startTime
        ? progress.startTime.getTime()
        : now;
      const age = now - exportTime;

      if (
        age > maxAgeMs &&
        (progress.status === "completed" ||
          progress.status === "failed" ||
          progress.status === "cancelled")
      ) {
        this.activeExports.delete(exportId);
        this.exportListeners.delete(exportId);
      }
    }
  }

  /**
   * Get all active exports
   * @returns {Array} Array of active export progress objects
   */
  static getAllActiveExports() {
    return Array.from(this.activeExports.values());
  }
}

export default ExportService;
