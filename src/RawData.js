import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './RawData.css';
import { useTable, useSortBy, useFilters } from 'react-table';

// Default Filter UI
const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => (
  <input
    value={filterValue || ''}
    onChange={(e) => setFilter(e.target.value || undefined)} // Set undefined to remove the filter entirely
    placeholder="Search..."
    style={{
      width: '100%',
      padding: '4px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    }}
  />
);

function RawData() {
  const location = useLocation();
  const { uploadedData } = location.state || {}; // Access uploaded data from location state
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [showFilters, setShowFilters] = useState(false); // State to manage filter visibility

  useEffect(() => {
    if (uploadedData && uploadedData.length > 0) {
      const headers = Object.keys(uploadedData[0]);
      setColumns(
        headers.map((header) => ({
          Header: header,
          accessor: header,
          Filter: DefaultColumnFilter, // Add filtering
          disableFilters: false,
        }))
      );
      setData(uploadedData);
    }
  }, [uploadedData]);

  const Table = ({ columns, data }) => {
    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
    } = useTable(
      {
        columns,
        data,
        defaultColumn: { Filter: DefaultColumnFilter }, // Default filter UI
      },
      useFilters, // Enable filtering
      useSortBy // Enable sorting
    );

    return (
      <table {...getTableProps()} className="data-table">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                  {showFilters && column.canFilter ? (
                    <div>{column.render('Filter')}</div>
                  ) : null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="full-screen raw-data-background">
      <div className="container">
        <h1>Raw Data Page</h1>
        <Link to="/firewall-analysis">
          <button className="back-button">←</button>
        </Link>
        {/* Show the Filter button only if data is present */}
        {data.length > 0 && (
          <button onClick={() => setShowFilters(!showFilters)} className="filter-button">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        )}
        <div className="table-container">
          {data.length > 0 && <Table columns={columns} data={data} />}
        </div>
      </div>
    </div>
  );
}

export default RawData;
