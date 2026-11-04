import React, { useState, useCallback } from "react";
import FiltersPanel from "./FiltersPanel";
import { FaFilter } from "react-icons/fa";

export default function Base({
  title = "Page",
  filterTitle,
  filtersConfig = null,
  initialFilterValues = {},
  onFiltersChange = () => {},
  children,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleFilterChange = useCallback((filters) => {
    onFiltersChange && onFiltersChange(filters);
  }, [onFiltersChange]);

  return (
    <div className="relative h-full flex">

      {/* ── Filter Form Panel (Right Side Panel) ── */}
      {filtersConfig && filtersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed top-[62px] right-0 bottom-0 w-full sm:w-80 bg-white shadow-xl z-[1030] flex flex-col border-l border-slate-200 transition-all duration-300"
        >
          {/* Panel header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 bg-indigo-600 rounded-full" />
              <h3 className="text-sm font-bold text-slate-800">
                {filterTitle || "Filters"}
              </h3>
            </div>
            <button
              onClick={() => setFiltersOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold transition"
              title="Close Filters"
            >
              ✕
            </button>
          </div>

          {/* Filter form body */}
          <div className="flex-1 overflow-hidden">
            <FiltersPanel
              config={filtersConfig}
              initialValues={initialFilterValues}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className={
        "flex-1 flex flex-col transition-all duration-300 overflow-auto " +
        (filtersOpen ? "sm:mr-80" : "")
      }>

        {/* Filter toggle — top right */}
        {filtersConfig && (
          <div className="flex justify-end px-4 sm:px-6 pt-3">
            <button
              onClick={() => setFiltersOpen(s => !s)}
              className={
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-sm font-bold transition-all shadow-sm " +
                (filtersOpen
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600")
              }
              aria-expanded={filtersOpen}
              title="Toggle Filter Panel (Right Side)"
            >
              <FaFilter className="w-3.5 h-3.5" />
              <span>{filtersOpen ? "Hide Filters" : "Filters"}</span>
            </button>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 p-3 sm:p-6 overflow-auto bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
}
