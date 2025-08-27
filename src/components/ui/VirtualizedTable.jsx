/**
 * VirtualizedTable Component
 * 
 * High-performance table component with virtual scrolling for large datasets.
 * Renders only visible rows to maintain performance with thousands of records.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const ITEM_HEIGHT = 48; // Height of each row in pixels
const BUFFER_SIZE = 5; // Number of extra items to render outside viewport

/**
 * Virtual scrolling hook
 */
const useVirtualScrolling = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const containerItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + containerItemCount + BUFFER_SIZE,
      items.length
    );
    
    return {
      startIndex: Math.max(0, startIndex - BUFFER_SIZE),
      endIndex,
      visibleItems: items.slice(
        Math.max(0, startIndex - BUFFER_SIZE),
        endIndex
      )
    };
  }, [items, scrollTop, containerHeight, itemHeight]);
  
  return {
    ...visibleRange,
    scrollTop,
    setScrollTop,
    totalHeight: items.length * itemHeight
  };
};

/**
 * Table header with sorting
 */
const VirtualTableHeader = ({ columns, sortBy, sortOrder, onSort }) => {
  const handleSort = (columnKey) => {
    const newOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newOrder);
  };

  return (
    <thead className="bg-muted/50 sticky top-0 z-10">
      <tr>
        {columns.map((column) => {
          const isSorted = sortBy === column.key;
          const isAscending = isSorted && sortOrder === 'asc';
          const isDescending = isSorted && sortOrder === 'desc';
          
          return (
            <th
              key={column.key}
              className={cn(
                "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                column.sortable !== false && "cursor-pointer hover:bg-muted/70 select-none"
              )}
              onClick={() => column.sortable !== false && handleSort(column.key)}
              style={{ width: column.width }}
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
        })}
      </tr>
    </thead>
  );
};/**
 * Vi
rtual table row component
 */
const VirtualTableRow = ({ item, columns, index, onRowClick, style }) => {
  return (
    <tr
      className={cn(
        "border-b border-border hover:bg-muted/50 transition-colors",
        onRowClick && "cursor-pointer"
      )}
      onClick={() => onRowClick && onRowClick(item)}
      style={{
        ...style,
        height: ITEM_HEIGHT,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {columns.map((column) => (
        <td
          key={column.key}
          className="px-4 py-3 text-sm flex items-center"
          style={{ 
            width: column.width || 'auto',
            minWidth: column.minWidth || 100
          }}
        >
          {column.render ? column.render(item[column.key], item, index) : item[column.key]}
        </td>
      ))}
    </tr>
  );
};

/**
 * Main VirtualizedTable component
 */
const VirtualizedTable = ({
  data = [],
  columns = [],
  height = 400,
  loading = false,
  error = null,
  sortBy = null,
  sortOrder = 'asc',
  onSort = () => {},
  onRowClick = null,
  emptyMessage = "No data available",
  className = ""
}) => {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(height);
  
  const {
    startIndex,
    endIndex,
    visibleItems,
    scrollTop,
    setScrollTop,
    totalHeight
  } = useVirtualScrolling(data, containerHeight, ITEM_HEIGHT);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
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
      <div 
        ref={containerRef}
        className="overflow-auto"
        style={{ height }}
        onScroll={handleScroll}
      >
        <table className="w-full">
          <VirtualTableHeader
            columns={columns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        </table>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${startIndex * ITEM_HEIGHT}px)` }}>
              <table className="w-full">
                <tbody>
                  {visibleItems.map((item, index) => (
                    <VirtualTableRow
                      key={item.id || startIndex + index}
                      item={item}
                      columns={columns}
                      index={startIndex + index}
                      onRowClick={onRowClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with item count */}
      {data.length > 0 && (
        <div className="px-4 py-2 border-t border-border text-sm text-muted-foreground">
          Showing {visibleItems.length} of {data.length} items
        </div>
      )}
    </div>
  );
};

export default VirtualizedTable;