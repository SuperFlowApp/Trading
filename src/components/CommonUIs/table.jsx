import React from "react";

const Table = ({
  columns = [],
  data = [],
  rowKey = (row, idx) => idx,
  emptyMessage = "No data.",
  actions = null, // function(row): ReactNode
  className = "",
  headerClassName = "",
  bodyClassName = "",
}) => (
  <div className="overflow-x-auto">
    <table className={`w-full text-body text-left ${className}`}>
      {columns.length > 0 && (
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key || col.label}
                className={`px-2 py-1 border-b border-liquidmidgray text-liquidmidgray ${headerClassName}`}
              >
                {col.label}
              </th>
            ))}
            {actions && <th className={`px-2 py-1 border-b border-liquidmidgray text-liquidmidgray uppercase ${headerClassName}`}></th>}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.isArray(data) && data.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-liquidmidgray">
              {emptyMessage}
            </td>
          </tr>
        ) : Array.isArray(data) ? (
          data.map((row, idx) => (
            <tr key={rowKey(row, idx)} className={idx % 2 ? "bg-backgroundmid" : "bg-backgroundlight"}>
              {columns.map(col => (
                <td key={col.key} className="px-2 py-2 text-liquidwhite">
                  {col.render ? col.render(row[col.key], row, idx) : row[col.key] ?? "-"}
                </td>
              ))}
              {actions && (
                <td className="py-1 text-liquidwhite">{actions(row, idx)}</td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-red-400">
              Error loading data
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default Table;