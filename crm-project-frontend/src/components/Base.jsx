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

      {/* ── Filter Drawer ── */}
      {filtersConfig && filtersOpen && (
        <>
          {/* Backdrop — full screen on all sizes */}
          <button
            onClick={() => setFiltersOpen(false)}
            className="fixed inset-0 bg-black/30 z-[1040]"
            aria-hidden="true"
          />

          {/* Drawer panel — slides from left, full width on mobile */}
          <div
            role="dialog"
            aria-modal="true"
            className="fixed top-[62px] left-0 bottom-0 w-full sm:w-80 bg-white shadow-2xl z-[1045] flex flex-col border-r border-slate-100"
          >
            {/* Drawer header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-indigo-500 rounded-full" />
                <h3 className="text-sm font-semibold text-slate-700">
                  {filterTitle || "Filters"}
                </h3>
              </div>
              <button
                onClick={() => setFiltersOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-hidden">
              <FiltersPanel
                config={filtersConfig}
                initialValues={initialFilterValues}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Main Content ── */}
      <div className={
        "flex-1 flex flex-col transition-all duration-300 overflow-auto " +
        (filtersOpen ? "sm:ml-80" : "")
      }>

        {/* Filter toggle — top right */}
        {filtersConfig && (
          <div className="flex justify-end px-4 sm:px-6 pt-3">
            <button
              onClick={() => setFiltersOpen(s => !s)}
              className={
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all " +
                (filtersOpen
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600")
              }
              aria-expanded={filtersOpen}
            >
              <FaFilter className="w-3 h-3" />
              <span>Filters</span>
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
