import React from "react";
import { MdOutlineNavigateNext, MdOutlineNavigateBefore } from "react-icons/md";

/**
 * TableView — universal table component
 *
 * Props:
 *  columns      [{ key, label, render? }]
 *  rows         array
 *  loading      bool
 *  error        string|null
 *  page         number
 *  totalPages   number
 *  onPageChange fn(newPage)
 *  pageSize     number  (for Sr.No calculation)
 *  actions      function(row) → ReactNode
 *  emptyMessage string
 *  rowClassName function(row) → string
 */
export default function TableView({
  columns       = [],
  rows          = [],
  loading       = false,
  error         = null,
  page          = 1,
  totalPages    = 1,
  onPageChange  = () => {},
  pageSize      = 10,
  actions       = null,
  emptyMessage  = "No records found",
  rowClassName,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-14 text-center">
            <div className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm text-slate-500 font-medium">Loading…</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-sm text-red-500 font-medium">Error: {error}</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">

            {/* Head */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="py-14 text-center text-sm text-slate-400 font-medium"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr
                    key={row.id ?? idx}
                    className={`hover:bg-indigo-50/40 transition-colors ${rowClassName ? rowClassName(row) : ""}`}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className="px-4 py-2.5 text-center text-sm text-slate-700 whitespace-nowrap"
                      >
                        {col.render ? col.render(row, idx) : (row[col.key] ?? "—")}
                      </td>
                    ))}

                    {actions && (
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && !error && rows.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">
            Page <span className="font-bold text-slate-700">{page}</span> of{" "}
            <span className="font-bold text-slate-700">{totalPages}</span>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <MdOutlineNavigateBefore className="w-4 h-4" />
            </button>

            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <MdOutlineNavigateNext className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
