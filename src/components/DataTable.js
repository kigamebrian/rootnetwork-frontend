// frontend/src/components/DataTable.js
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';

function DataTable({ 
  data, 
  columns, 
  title = 'Data Table',
  searchable = true,
  searchFields = [],
  exportable = true,
  exportFilename = 'export',
  pagination = true,
  itemsPerPage = 10,
  actions = null,
  onRowClick = null,
  customFilters = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [rowsPerPage, setRowsPerPage] = useState(itemsPerPage);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchable) return data;
    
    const searchLower = searchTerm.toLowerCase();
    const fieldsToSearch = searchFields.length > 0 
      ? searchFields 
      : columns.filter(c => c.searchable !== false).map(c => c.field);
    
    return data.filter(row => {
      return fieldsToSearch.some(field => {
        const value = row[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchTerm, searchable, searchFields, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      // Handle dates
      if (columns.find(c => c.field === sortField)?.type === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortOrder, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage, pagination]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = columns.filter(c => c.export !== false).map(c => c.header);
    const rows = sortedData.map(row => 
      columns.filter(c => c.export !== false).map(c => {
        let value = row[c.field];
        if (c.type === 'date' && value) {
          value = new Date(value).toLocaleString();
        }
        if (c.type === 'badge' && c.format) {
          value = c.format(value);
        }
        if (c.type === 'actions') return '';
        return value;
      })
    );
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${exportFilename}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Export complete!');
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = sortedData.map(row => {
      const newRow = {};
      columns.filter(c => c.export !== false).forEach(c => {
        let value = row[c.field];
        if (c.type === 'date' && value) {
          value = new Date(value).toLocaleString();
        }
        if (c.type === 'badge' && c.format) {
          value = c.format(value);
        }
        newRow[c.header] = value;
      });
      return newRow;
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${exportFilename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export complete!');
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const headers = columns.filter(c => c.export !== false).map(c => c.header);
    const rows = sortedData.map(row => 
      columns.filter(c => c.export !== false).map(c => {
        let value = row[c.field];
        if (c.type === 'date' && value) value = new Date(value).toLocaleString();
        if (c.type === 'badge' && c.format) value = c.format(value);
        if (c.type === 'actions') return '';
        return value;
      })
    );
    
    const content = [headers, ...rows].map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  // Print table
  const printTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>${title}</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
        </head>
        <body>
          <h2>${title}</h2>
          <table>
            <thead><tr>${columns.filter(c => c.export !== false).map(c => `<th>${c.header}</th>`).join('')}</tr></thead>
            <tbody>
              ${sortedData.map(row => `
                <tr>${columns.filter(c => c.export !== false).map(c => {
                  let value = row[c.field];
                  if (c.type === 'date' && value) value = new Date(value).toLocaleString();
                  if (c.type === 'badge' && c.format) value = c.format(value);
                  return `<td>${value || ''}</td>`;
                }).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="data-table">
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="mb-0">{title}</h3>
        <div className="d-flex gap-2">
          {searchable && (
            <div className="input-group" style={{ width: '300px' }}>
              <span className="input-group-text"><i className="fas fa-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          )}
          
          {exportable && (
            <div className="dropdown">
              <button className="btn btn-success dropdown-toggle" data-bs-toggle="dropdown">
                <i className="fas fa-download me-1"></i> Export
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item" onClick={exportToCSV}><i className="fas fa-file-csv me-2"></i> Export to CSV</button></li>
                <li><button className="dropdown-item" onClick={exportToExcel}><i className="fas fa-file-excel me-2"></i> Export to Excel</button></li>
                <li><button className="dropdown-item" onClick={copyToClipboard}><i className="fas fa-copy me-2"></i> Copy to Clipboard</button></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" onClick={printTable}><i className="fas fa-print me-2"></i> Print</button></li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Custom Filters */}
      {customFilters && (
        <div className="row mb-3">
          {customFilters}
        </div>
      )}

      {/* Results info */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">
          Showing {paginatedData.length} of {sortedData.length} entries
          {searchTerm && <span> (filtered from {data.length} total)</span>}
        </small>
        {pagination && sortedData.length > rowsPerPage && (
          <select className="form-select w-auto" value={rowsPerPage} onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}>
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        )}
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              {columns.map(col => (
                <th 
                  key={col.field}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default' }}
                  onClick={() => col.sortable !== false && handleSort(col.field)}
                >
                  {col.header}
                  {sortField === col.field && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr 
                key={idx} 
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map(col => (
                  <td key={col.field}>
                    {col.type === 'badge' ? (
                      <span className={`badge ${col.badgeClass?.(row[col.field]) || 'bg-secondary'}`}>
                        {col.format ? col.format(row[col.field]) : row[col.field]}
                      </span>
                    ) : col.type === 'image' ? (
                      row[col.field] && <img src={row[col.field]} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : col.type === 'actions' ? (
                      actions && actions(row)
                    ) : col.type === 'date' ? (
                      <small>{row[col.field] ? new Date(row[col.field]).toLocaleString() : '-'}</small>
                    ) : (
                      row[col.field] || '-'
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
            </li>
            {[...Array(Math.min(totalPages, 5)).keys()].map(i => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              
              return (
                <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                </li>
              );
            })}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default DataTable;