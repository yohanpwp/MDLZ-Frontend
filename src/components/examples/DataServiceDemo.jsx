import { useState, useEffect } from "react";
import {
  useDataService,
  useFileOperations,
} from "../../hooks/useDataService.js";
import Button from "../ui/Button.jsx";

/**
 * Demo component แสดงการใช้งาน Data Service
 */
export default function DataServiceDemo() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", value: "" });

  // Main data service with API + localStorage fallback
  const {
    read,
    write,
    update,
    remove,
    search,
    sync,
    switchAdapter,
    loading,
    error,
    status,
    clearError,
    refreshStatus,
  } = useDataService({
    primarySource: "api",
    fallbackSource: "localStorage",
    offlineMode: true,
    syncEnabled: true,
    api: {
      baseUrl: "https://api.example.com",
      headers: {
        Authorization: "Bearer your-token-here",
      },
    },
    localStorage: {
      keyPrefix: "demo_",
      storageType: "localStorage",
    },
  });

  // File operations
  const {
    importFile,
    exportFile,
    loading: fileLoading,
    error: fileError,
  } = useFileOperations();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await read({ key: "demo_data" });
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      setData([]);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.value) return;

    try {
      const item = {
        id: Date.now().toString(),
        ...newItem,
        createdAt: new Date().toISOString(),
      };

      const updatedData = [...data, item];
      await write(updatedData, { key: "demo_data" });
      setData(updatedData);
      setNewItem({ name: "", value: "" });
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleUpdateItem = async (id, updates) => {
    try {
      const updatedData = data.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      await write(updatedData, { key: "demo_data" });
      setData(updatedData);
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const updatedData = data.filter((item) => item.id !== id);
      await write(updatedData, { key: "demo_data" });
      setData(updatedData);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await search(
        {
          field: "name",
          value: searchQuery,
          operator: "includes",
        },
        { key: "demo_data" }
      );
      setSearchResults(results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    }
  };

  const handleSync = async () => {
    try {
      const result = await sync({ key: "demo_data" });
      console.log("Sync result:", result);
      await loadData(); // Reload data after sync
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const importedData = await importFile(file, {
        saveToAdapter: true,
        key: "demo_data",
      });
      setData(Array.isArray(importedData) ? importedData : []);
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const handleFileExport = async (format) => {
    try {
      await exportFile(data, {
        filename: "demo_data",
        format,
        download: true,
      });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleSwitchAdapter = async (sourceType) => {
    try {
      await switchAdapter(sourceType);
      await loadData();
    } catch (error) {
      console.error("Failed to switch adapter:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Data Service Demo</h2>

        {/* Status Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">System Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Online:</span>
              <span
                className={status.isOnline ? "text-green-600" : "text-red-600"}
              >
                {status.isOnline ? " Yes" : " No"}
              </span>
            </div>
            <div>
              <span className="font-medium">Current Adapter:</span>
              <span className="text-blue-600">
                {" "}
                {status.currentAdapter || "None"}
              </span>
            </div>
            <div>
              <span className="font-medium">Sync Queue:</span>
              <span className="text-orange-600">
                {" "}
                {status.syncQueueLength} items
              </span>
            </div>
            <div>
              <Button onClick={refreshStatus} size="sm" variant="outline">
                Refresh Status
              </Button>
            </div>
          </div>

          {/* Adapter Status */}
          <div className="mt-3">
            <span className="font-medium">Adapters:</span>
            <div className="flex gap-2 mt-1">
              {Object.entries(status.adapters).map(([type, info]) => (
                <span
                  key={type}
                  className={`px-2 py-1 rounded text-xs ${
                    info.available
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {type}: {info.available ? "OK" : "Error"}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {(error || fileError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-red-800">{error || fileError}</span>
              <Button onClick={clearError} size="sm" variant="outline">
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Adapter Controls */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Adapter Controls</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => handleSwitchAdapter("file")}
              size="sm"
              variant={status.currentAdapter === "file" ? "default" : "outline"}
            >
              File Mode
            </Button>
            <Button
              onClick={() => handleSwitchAdapter("api")}
              size="sm"
              variant={status.currentAdapter === "api" ? "default" : "outline"}
            >
              API Mode
            </Button>
            <Button
              onClick={() => handleSwitchAdapter("localStorage")}
              size="sm"
              variant={
                status.currentAdapter === "localStorage" ? "default" : "outline"
              }
            >
              Local Storage
            </Button>
            <Button
              onClick={handleSync}
              size="sm"
              variant="secondary"
              disabled={loading}
            >
              Sync Data
            </Button>
          </div>
        </div>

        {/* File Operations */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">File Operations</h3>
          <div className="flex gap-2 items-center">
            <input
              type="file"
              accept=".json,.csv,.xlsx"
              onChange={handleFileImport}
              className="text-sm"
              disabled={fileLoading}
            />
            <Button
              onClick={() => handleFileExport("json")}
              size="sm"
              variant="outline"
              disabled={fileLoading}
            >
              Export JSON
            </Button>
            <Button
              onClick={() => handleFileExport("csv")}
              size="sm"
              variant="outline"
              disabled={fileLoading}
            >
              Export CSV
            </Button>
            <Button
              onClick={() => handleFileExport("xlsx")}
              size="sm"
              variant="outline"
              disabled={fileLoading}
            >
              Export Excel
            </Button>
          </div>
        </div>

        {/* Add New Item */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Add New Item</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="text"
              placeholder="Value"
              value={newItem.value}
              onChange={(e) =>
                setNewItem({ ...newItem, value: e.target.value })
              }
              className="px-3 py-2 border rounded-md"
            />
            <Button
              onClick={handleAddItem}
              disabled={loading || !newItem.name || !newItem.value}
            >
              Add Item
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Search</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium mb-2">
                Search Results ({searchResults.length})
              </h4>
              <div className="space-y-2">
                {searchResults.map((item) => (
                  <div key={item.id} className="p-2 bg-blue-50 rounded">
                    <span className="font-medium">{item.name}</span>:{" "}
                    {item.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data List */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Data Items ({data.length})</h3>
          {loading && <div className="text-center py-4">Loading...</div>}

          {!loading && data.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No data available. Add some items or import a file.
            </div>
          )}

          {!loading && data.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium">{item.name}</span>:{" "}
                    {item.value}
                    {item.createdAt && (
                      <div className="text-xs text-gray-500">
                        Created: {new Date(item.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleUpdateItem(item.id, {
                          value: prompt("New value:", item.value) || item.value,
                        })
                      }
                      size="sm"
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteItem(item.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
