import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
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
import {
  CustomerModal,
  ImportModal,
  AuditModal,
} from "../../components/modals";
import {
  loadMasterData,
  exportMasterData,
  importMasterData,
  validateImportFile,
  clearError,
  createCustomer,
  updateMasterData,
} from "../../redux/slices/masterDataSlice";
import { useGetCustomersQuery } from "../../redux/api/customer";
import { useLanguage } from "../../contexts/LanguageContext";
import { useFormatters } from "../../hooks/useFormatters";

const Customers = () => {
  const dispatch = useDispatch();
  // const customers = useSelector((state) => state.masterData.customers);
  // const isLoading = useSelector((state) => state.masterData.isImporting);
  // const error = useSelector((state) => state.masterData.error);
  const { t } = useLanguage();
  const { formatNumber, formatCurrency } = useFormatters();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editable, setEditable] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sortBy, setSortBy] = useState("customerName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const {
    data: customers,
    isLoading: isLoading,
    error: error,
  } = useGetCustomersQuery({ page: currentPage, pageSize: itemsPerPage });

  // Load customers on component mount
  // useEffect(() => {
  //     dispatch(loadMasterData({ dataType: "customers" }));
  // }, [dispatch]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    const customerData = Array.isArray(customers)
      ? customers
      : customers?.data || [];
    let filtered = customerData.filter((customer) => {
      const matchesSearch =
        !searchTerm ||
        customer.customerName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        customer.customerCode
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && customer.isActive) ||
        (statusFilter === "inactive" && !customer.isActive);

      return matchesSearch && matchesStatus;
    });

    // Sort customers
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || "";
      const bValue = b[sortBy] || "";

      if (sortOrder === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return filtered || [];
  }, [customers, searchTerm, statusFilter, sortBy, sortOrder]);

  // Table columns configuration
  const columns = [
    {
      key: "code",
      header: t("customer.code", "Code"),
      render: (value, customer) => (
        <div className="font-medium text-primary">{value}</div>
      ),
    },
    {
      key: "distCode",
      header: t("customer.distributor", "Distributor"),
      render: (value) => <div className="font-medium">{value}</div>,
    },
    {
      key: "name",
      header: t("customer.name"),
      render: (value, customer) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "address",
      header: t("customer.address"),
      sortable: false,
      render: (value, customer) => `${customer.addr1} ${customer.addr3}` || "-",
    },
    {
      key: "city",
      header: t("customer.location", "Location"),
      render: (value, customer) => (
        <div>
          <div>{`${customer.addr4}` || "-"}</div>
          {customer.addr5 && (
            <div className="text-sm text-muted-foreground">
              {customer.addr5}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "creditLimit",
      header: t("customer.creditLimit"),
      render: (value) => formatCurrency(value) || "-",
    },
    {
      key: "status",
      header: t("common.status"),
      render: (value) => (
        <Badge variant={value === "Active" ? "success" : "secondary"}>
          {value === "Active"
            ? t("customer.active", "Active")
            : t("customer.inactive", "Inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions", "Actions"),
      sortable: false,
      render: (_, customer) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewCustomer(customer)}
            title={t("common.view", "View")}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditCustomer(customer)}
            title={t("common.edit")}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShowAudit(customer)}
            title={t("common.history", "History")}
          >
            <History className="h-4 w-4" />
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteCustomer(customer)}
            title={t("common.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Event handlers
  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowCustomerModal(true);
    setEditable(true)
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
    setEditable(true)
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = (customer) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${customer.customerName}?`
      )
    ) {
      // In a real app, this would dispatch a delete action
      alert(`Customer ${customer.customerName} would be deleted`);
    }
  };

  const handleShowAudit = (customer) => {
    setSelectedCustomer(customer);
    setShowAuditModal(true);
  };

  const handleSaveCustomer = (customerData) => {
    // In a real app, this would dispatch save action
    console.log("Saving customer:", customerData);
    dispatch(createCustomer(customerData));
    setShowCustomerModal(false);
    setSelectedCustomer(null);
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleExport = () => {
    const filters = {
      search: searchTerm,
      status: statusFilter,
    };

    dispatch(
      exportMasterData({
        dataType: "customers",
        filters,
        format: "csv",
        options: {},
      })
    );
  };

  const handleImportFile = (file) => {
    dispatch(importMasterData({ file, dataType: "customers" }));
    setShowImportModal(false);
  };

  const clearErrorMessage = () => {
    dispatch(clearError());
  };

  const customPagination = useMemo(() => {
    const totalItems = customers ? customers.meta?.total : 0;
    const totalPages = customers ? customers.meta?.totalPages : 1;
    const handlePageChange = (page) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };
    const handleItemsPerPageChange = (itemsPerPage) => {
      setItemsPerPage(itemsPerPage);
      setCurrentPage(1);
    };
    return {
      currentPage: currentPage,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: itemsPerPage,
      onPageChange: handlePageChange,
      onItemsPerPageChange: handleItemsPerPageChange,
    };
  }, [currentPage, itemsPerPage, customers]);

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {/* {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearErrorMessage}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )} */}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("navigation.customers")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "customer.description",
              "Manage customer information and validation settings"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            {t("common.import")}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t("common.export")}
          </Button>
          <Button onClick={handleAddCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            {t("customer.addCustomer")}
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("customer.searchPlaceholder", "Search customers...")}
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
          <option value="all">{t("customer.allStatus", "All Status")}</option>
          <option value="active">{t("customer.active", "Active")}</option>
          <option value="inactive">{t("customer.inactive", "Inactive")}</option>
        </select>
        <div className="text-sm text-muted-foreground">
          {formatNumber(filteredCustomers?.length)} {t("common.of", "of")}{" "}
          {formatNumber(customers?.meta?.total || 0)}{" "}
          {t("navigation.customers").toLowerCase()}
        </div>
      </div>

      {/* Customers table */}
      <DataTable
        data={filteredCustomers}
        columns={columns}
        loading={isLoading}
        error={error?.data?.error}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchable={false} // We handle search externally
        emptyMessage={t("customer.empty")}
        customPagination={customPagination}
      />

      {/* Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setSelectedCustomer(null);
          setEditable(false)
        }}
        onSave={handleSaveCustomer}
        customer={selectedCustomer}
        isLoading={isLoading}
        edit={editable}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportFile}
        dataType="customers"
        acceptedFormats={[".csv"]}
        requiredColumns={["customerCode", "customerName", "email"]}
        optionalColumns={[
          "phone",
          "address",
          "city",
          "country",
          "taxId",
          "creditLimit",
        ]}
        isLoading={isLoading}
        error={error?.data?.error}
      />

      {/* Audit Modal */}
      <AuditModal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setSelectedCustomer(null);
        }}
        entity={selectedCustomer}
        entityType="customer"
      />
    </div>
  );
};

export default Customers;
