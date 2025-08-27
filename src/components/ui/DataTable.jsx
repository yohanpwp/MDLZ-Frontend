/**
 * DataTable Component
 * 
 * Reusable data table component with sorting, filtering, and pagination support.
 * Optimized for displaying validation results and other tabular data.
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';
import Button from './Button';
import { Badge } from './Badge';
import { cn } from '../../utils/cn';

/**
 * Table header cell with sorting capability
 */
const TableHeader = ({ column, sortBy, sortOrder, onSort, className }) => {
  const isSorted = sortBy === column.key;
  const isAscending = isSorted && sortOrder === 'asc';
  const isDescending = isSorted && sortOrder === 'desc';

  const handleSort = () => {
    if (column.sortable !== false) {
      const newOrder = isSorted && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(column.key, newOrder);
    }
  };

  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
        column.sortable !== false && "cursor-pointer hover:bg-muted/70 select-none",
        className
      )}
      onClick={handleSort}
    >
      <div className="flex items-center space-x-1">
        <span>{column.header}</span>
        {column.sortable !== false && (
          <div className="flex flex-col">
            <ChevronUp 
              className={cn(
                "h-3 w-3 -mb-1",
                isAscending ? "text-primary" : "text-muted-foreground/50"
              )} 
            />
            <ChevronDown 
              className={cn(
                "h-3 w-3",
                isDescending ? "text-primary" : "text-muted-foreground/50"
              )} 
            />
          </div>
        )}
      </div>
    </th>
  );
};/**
 * Ta
ble row component with hover effects
 */
const TableRow = ({ item, columns, onRowClick, className }) => {
  return (
    <tr
      className={cn(
        "border-b border-border hover:bg-muted/50 transition-colors",
        onRowClick && "cursor-pointer",
        className
      )}
      onClick={() => onRowClick && onRowClick(item)}
    >
      {columns.map((column) => (
        <td key={column.key} className="px-4 py-3 text-sm">
          {column.render ? column.render(item[column.key], item) : item[column.key]}
        </td>
      ))}
    </tr>
  );
};

/**
 * Pagination component
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  onItemsPerPageChange 
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Show</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-border rounded px-2 py-1 text-sm"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>of {totalItems} results</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">
          {startItem}-{endItem} of {totalItems}
        </span>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};/**
 *
 Main DataTable component
 */
const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  sortBy = null,
  sortOrder = 'asc',
  onSort = () => {},
  onRowClick = null,
  pagination = true,
  itemsPerPage = 25,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No data available",
  className = ""
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(itemsPerPage);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchable) return data;
    
    return data.filter(item =>
      columns.some(column => {
        const value = item[column.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns, searchable]);

  // Calculate pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / currentItemsPerPage);
  const startIndex = (currentPage - 1) * currentItemsPerPage;
  const endIndex = startIndex + currentItemsPerPage;
  const paginatedData = pagination ? filteredData.slice(startIndex, endIndex) : filteredData;

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setCurrentItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="text-destructive mb-2">Error loading data</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-lg overflow-hidden", className)}>
      {/* Search bar */}
      {searchable && (
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column) => (
                <TableHeader
                  key={column.key}
                  column={column}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow
                  key={item.id || index}
                  item={item}
                  columns={columns}
                  onRowClick={onRowClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={currentItemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default DataTable;