import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Shield,
  Clock,
  Users,
  Database,
} from "lucide-react";
import Button from "../ui/Button";

/**
 * ComplianceReporting Component
 *
 * Generates compliance reports for audit and regulatory requirements
 */
const ComplianceReporting = () => {
  const dispatch = useDispatch();

  // Local state
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [reportFilters, setReportFilters] = useState({
    includeUserActivity: true,
    includeDataAccess: true,
    includeSecurityEvents: true,
    includeSystemChanges: true,
  });
  const [generatedReports, setGeneratedReports] = useState([]);

  // Report type definitions
  const reportTypes = [
    {
      id: "audit_summary",
      name: "Audit Summary Report",
      description: "Comprehensive overview of all audit activities",
      icon: BarChart3,
      compliance: ["SOX", "GDPR", "ISO 27001"],
    },
    {
      id: "user_activity",
      name: "User Activity Report",
      description: "Detailed user actions and access patterns",
      icon: Users,
      compliance: ["SOX", "HIPAA"],
    },
    {
      id: "data_access",
      name: "Data Access Report",
      description: "Data access logs and permission usage",
      icon: Database,
      compliance: ["GDPR", "CCPA"],
    },
    {
      id: "security_events",
      name: "Security Events Report",
      description: "Security incidents and threat detection",
      icon: Shield,
      compliance: ["ISO 27001", "NIST"],
    },
    {
      id: "compliance_status",
      name: "Compliance Status Report",
      description: "Current compliance posture and gaps",
      icon: CheckCircle,
      compliance: ["All Standards"],
    },
  ];

  // Generate compliance report
  const generateReport = async () => {
    if (!selectedReportType) {
      alert("Please select a report type");
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const reportData = await generateReportData(selectedReportType);
      const newReport = {
        id: Date.now().toString(),
        type: selectedReportType,
        name: reportTypes.find((t) => t.id === selectedReportType)?.name,
        generatedAt: new Date().toISOString(),
        dateRange: { ...dateRange },
        filters: { ...reportFilters },
        data: reportData,
        status: "completed",
      };

      setGeneratedReports((prev) => [newReport, ...prev]);
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate mock report data
  const generateReportData = async (reportType) => {
    const mockData = {
      audit_summary: {
        totalEvents: 1247,
        criticalEvents: 12,
        warningEvents: 45,
        infoEvents: 1190,
        complianceScore: 94,
        recommendations: [
          "Enable two-factor authentication for all admin users",
          "Implement automated backup verification",
          "Review and update access permissions quarterly",
        ],
      },
      user_activity: {
        activeUsers: 23,
        totalSessions: 156,
        averageSessionDuration: "2h 15m",
        topActions: [
          { action: "VIEW_INVOICES", count: 234 },
          { action: "VALIDATE_INVOICES", count: 89 },
          { action: "EXPORT_DATA", count: 45 },
        ],
      },
      data_access: {
        totalAccesses: 567,
        sensitiveDataAccesses: 89,
        unauthorizedAttempts: 3,
        dataExports: 23,
        accessByModule: {
          invoices: 234,
          customers: 156,
          reports: 89,
          users: 45,
        },
      },
      security_events: {
        totalSecurityEvents: 15,
        criticalThreats: 2,
        resolvedIncidents: 13,
        pendingReviews: 2,
        threatTypes: {
          "Unauthorized Access": 8,
          "Suspicious Activity": 4,
          "Failed Authentication": 3,
        },
      },
      compliance_status: {
        overallScore: 92,
        standards: {
          SOX: { score: 95, status: "compliant" },
          GDPR: { score: 89, status: "compliant" },
          "ISO 27001": { score: 94, status: "compliant" },
          HIPAA: { score: 88, status: "needs_attention" },
        },
        gaps: [
          "Implement data retention policy automation",
          "Enhance encryption for data at rest",
        ],
      },
    };

    return mockData[reportType] || {};
  };

  // Export report
  const exportReport = async (report, format = "pdf") => {
    try {
      // Simulate export process
      const exportData = {
        reportId: report.id,
        reportName: report.name,
        generatedAt: report.generatedAt,
        dateRange: report.dateRange,
        data: report.data,
        format: format,
      };

      if (format === "pdf") {
        // In a real implementation, this would use jsPDF
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        downloadFile(
          blob,
          `${report.name.replace(/\s+/g, "_")}_${
            new Date().toISOString().split("T")[0]
          }.json`
        );
      } else if (format === "csv") {
        const csvContent = convertToCSV(report.data);
        const blob = new Blob([csvContent], { type: "text/csv" });
        downloadFile(
          blob,
          `${report.name.replace(/\s+/g, "_")}_${
            new Date().toISOString().split("T")[0]
          }.csv`
        );
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Convert data to CSV format
  const convertToCSV = (data) => {
    const headers = Object.keys(data).join(",");
    const values = Object.values(data)
      .map((value) =>
        typeof value === "object" ? JSON.stringify(value) : value
      )
      .join(",");
    return `${headers}\n${values}`;
  };

  // Download file helper
  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setReportFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-foreground">
          Compliance Reporting
        </h3>
        <p className="text-muted-foreground">
          Generate compliance reports for audit and regulatory requirements
        </p>
      </div>

      {/* Report Generation Form */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Generate New Report</h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Type Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Report Type
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select report type...</option>
                {reportTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedReportType && (
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const reportType = reportTypes.find(
                      (t) => t.id === selectedReportType
                    );
                    const Icon = reportType?.icon || FileText;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  <span className="font-medium">
                    {reportTypes.find((t) => t.id === selectedReportType)?.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {
                    reportTypes.find((t) => t.id === selectedReportType)
                      ?.description
                  }
                </p>
                <div className="flex flex-wrap gap-1">
                  {reportTypes
                    .find((t) => t.id === selectedReportType)
                    ?.compliance.map((standard) => (
                      <span
                        key={standard}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                      >
                        {standard}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Report Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Include in Report
              </label>
              <div className="space-y-2">
                {Object.entries(reportFilters).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        handleFilterChange(key, e.target.checked)
                      }
                      className="rounded border-border"
                    />
                    <span className="text-sm">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={generateReport}
              disabled={isGenerating || !selectedReportType}
              className="w-full"
            >
              <FileText
                className={`h-4 w-4 mr-2 ${
                  isGenerating ? "animate-pulse" : ""
                }`}
              />
              {isGenerating ? "Generating Report..." : "Generate Report"}
            </Button>
          </div>
        </div>
      </div>

      {/* Generated Reports */}
      <div className="space-y-4">
        <h4 className="font-semibold">Generated Reports</h4>

        {generatedReports.length > 0 ? (
          <div className="space-y-3">
            {generatedReports.map((report) => (
              <div
                key={report.id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h5 className="font-medium">{report.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        Generated:{" "}
                        {new Date(report.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport(report, "pdf")}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport(report, "csv")}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                  </div>
                </div>

                {/* Report Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {Object.entries(report.data)
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div key={key}>
                        <span className="text-muted-foreground">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                          :
                        </span>
                        <span className="ml-1 font-medium">
                          {typeof value === "object"
                            ? JSON.stringify(value).length + " items"
                            : value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h5 className="font-medium mb-2">No Reports Generated</h5>
            <p className="text-muted-foreground">
              Generate your first compliance report using the form above
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceReporting;
