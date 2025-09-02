import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  History,
  X,
  AlertCircle,
} from "lucide-react";

import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import { Alert, AlertDescription } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { ImportModal, AuditModal } from "../../components/modals";

import {
  loadMasterData,
  exportMasterData,
  importMasterData,
  validateImportFile,
  clearError,
} from "../../redux/slices/masterDataSlice";
import { useLanguage } from "../../contexts/LanguageContext";
import { useFormatters } from "../../hooks/useFormatters";

// Distributor fields reference (from src/types/prisma.ts):
// code, name, prefix, taxId?, address?, contactAdmin?, email?, contactName?, isActive

const Distributors = () => {
  const dispatch = useDispatch();
  const distributors = useSelector((state) => state.masterData.distributors || []);
  const isLoading = useSelector((state) => state.masterData.isImporting);
  const error = useSelector((state) => state.masterData.error);
  const { t } = useLanguage();
  const { formatNumber } = useFormatters();

  // Local UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState(null);

  // Load distributors on mount
  useEffect(() => {
    dispatch(loadMasterData({ dataType: "distributors" }));
  }, [dispatch]);

  // Filter and sort distributors
  const filteredDistributors = useMemo(() => {
    const filtered = (distributors || []).filter((d) => {
      const s = (searchTerm || "").toLowerCase();
      const matchesSearch =
        !s ||
        d.name?.toLowerCase().includes(s) ||
        d.code?.toLowerCase().includes(s) ||
        d.email?.toLowerCase().includes(s) ||
        d.contactName?.toLowerCase().includes(s);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && (d.isActive ?? true)) ||
        (statusFilter === "inactive" && (d.isActive === false));

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      const aVal = (a?.[sortBy] ?? "").toString();
      const bVal = (b?.[sortBy] ?? "").toString();
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    return filtered;
  }, [distributors, searchTerm, statusFilter, sortBy, sortOrder]);

  // Columns configuration
  const columns = [
    {
      key: "code",
      header: t('distributor.code', 'Code'),
      render: (value) => <div className="font-medium text-primary">{value}</div>,
    },
    {
      key: "name",
      header: t('distributor.name', 'Name'),
      render: (value, d) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-muted-foreground">{d.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "prefix",
      header: t('distributor.prefix', 'Prefix'),
    },
    {
      key: "contactName",
      header: t('distributor.contact', 'Contact'),
      render: (value, d) => (
        <div>
          <div>{value || "-"}</div>
          {d.contactAdmin && (
            <div className="text-xs text-muted-foreground">Admin: {d.contactAdmin}</div>
          )}
        </div>
      ),
    },
    {
      key: "taxId",
      header: t('distributor.taxId', 'Tax ID'),
      render: (v) => v || "-",
    },
    {
      key: "address",
      header: t('distributor.address', 'Address'),
      render: (v) => (
        <div className="max-w-[280px] truncate" title={v}>{v || "-"}</div>
      ),
    },
    {
      key: "isActive",
      header: t('common.status', 'Status'),
      render: (value) => (
        <Badge variant={value === false ? "secondary" : "default"}>
          {value === false ? t('common.inactive', 'Inactive') : t('common.active', 'Active')}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t('common.actions', 'Actions'),
      sortable: false,
      render: (_, d) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDistributor(d);
              setShowAuditModal(true);
            }}
            title={t('common.view', 'View')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleExport = () => {
    const filters = {
      search: searchTerm,
      status: statusFilter,
    };

    dispatch(
      exportMasterData({ dataType: "distributors", filters, format: "csv", options: {} })
    );
  };

  const handleImport = () => setShowImportModal(true);

  const handleImportFile = (file) => {
    // Validation will fall back to generic rules for unknown types
    dispatch(validateImportFile({ file, dataType: "distributors" }));
    dispatch(importMasterData({ file, dataType: "distributors" }));
    setShowImportModal(false);
  };

  const clearErrorMessage = () => dispatch(clearError());

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearErrorMessage}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('navigation.distributors', 'Distributors')}</h1>
          <p className="text-muted-foreground">{t('distributor.description', 'Manage distributors and settings')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            {t('common.import', 'Import')}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('common.export', 'Export')}
          </Button>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            {t('distributor.addDistributor', 'Add Distributor')}
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('distributor.searchPlaceholder', 'Search distributors...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">{t('common.allStatus', 'All Status')}</option>
          <option value="active">{t('common.active', 'Active')}</option>
          <option value="inactive">{t('common.inactive', 'Inactive')}</option>
        </select>
        <div className="text-sm text-muted-foreground">
          {formatNumber(filteredDistributors.length)} {t('common.of', 'of')} {formatNumber(distributors.length)} {t('navigation.distributors', 'Distributors').toLowerCase()}
        </div>
      </div>

      {/* Distributors table */}
      <DataTable
        data={filteredDistributors}
        columns={columns}
        loading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchable={false}
        emptyMessage={t('distributor.empty', 'No distributors found')}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportFile}
        dataType="distributors"
        acceptedFormats={[".csv"]}
        requiredColumns={["code", "name", "prefix"]}
        optionalColumns={["email", "contactName", "contactAdmin", "taxId", "address", "isActive"]}
        isLoading={isLoading}
        error={error}
      />

      {/* Audit Modal */}
      <AuditModal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setSelectedDistributor(null);
        }}
        entity={selectedDistributor}
        entityType="distributor"
      />
    </div>
  );
};

export default Distributors;
