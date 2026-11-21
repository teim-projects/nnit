import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Warehouse,
  IndianRupee,
  RefreshCw,
  Plus,
  Sliders,
  CheckCircle,
  XCircle,
  X,
  ShoppingCart,
  Bell
} from "lucide-react";
import { InventoryService } from "../../services/inventoryService";

export default function StockSummaryPage() {
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [allStockList, setAllStockList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pop-off Low Stock Alert Modal
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  const loadData = () => {
    setIsRefreshing(true);
    setWarehouses(InventoryService.getWarehouses());
    setCategories(InventoryService.getCategories());
    const data = InventoryService.getStockSummary(warehouseFilter, categoryFilter, statusFilter, search);
    const unFiltered = InventoryService.getStockSummary(warehouseFilter, categoryFilter, "all", "");
    setStockList(data);
    setAllStockList(unFiltered);

    // Pop off alert modal automatically on initial page visit if low stock items exist
    const shortages = unFiltered.filter(i => i.status === "Low Stock" || i.status === "Out of Stock");
    if (shortages.length > 0 && !sessionStorage.getItem("nnit_stock_alert_popped")) {
      setShowLowStockModal(true);
      sessionStorage.setItem("nnit_stock_alert_popped", "true");
    }

    setTimeout(() => setIsRefreshing(false), 200);
  };

  useEffect(() => {
    loadData();
  }, [warehouseFilter, categoryFilter, statusFilter, search]);

  // Aggregate stats
  const totalValuation = stockList.reduce((sum, item) => sum + (item.totalValuation || 0), 0);
  const totalAvailable = stockList.reduce((sum, item) => sum + (item.availableQty || 0), 0);
  const totalReserved = stockList.reduce((sum, item) => sum + (item.reservedQty || 0), 0);

  // Shortage items across unfiltered scope for this warehouse
  const lowStockItems = allStockList.filter((item) => item.status === "Low Stock" || item.status === "Out of Stock");
  const totalLowStockCount = lowStockItems.length;
  const outOfStockCount = allStockList.filter((item) => item.status === "Out of Stock").length;
  const lowStockOnlyCount = allStockList.filter((item) => item.status === "Low Stock").length;

  const exportCSV = () => {
    const headers = "SKU,Product Name,Category,Warehouse,On Hand,Reserved,Available,Min Safety,Status,Unit Cost,Total Value\n";
    const rows = stockList.map((i) =>
      `"${i.sku}","${i.name}","${i.category}","${i.warehouseName}",${i.onHandQty},${i.reservedQty},${i.availableQty},${i.minStock},"${i.status}",${i.costPrice},${i.totalValuation}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Stock_Summary_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-4 w-full pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <span>Inventory ERP</span>
            <span>•</span>
            <span>Real-Time Stock Position</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Warehouse Stock Balances</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor available vs allocated inventory, physical warehouse balances, reorder safety thresholds, and shortages.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <span className="px-3 py-1.5 rounded-lg bg-white text-blue-700 shadow-2xs font-extrabold">
              Warehouse Balances
            </span>
            <Link
              to="/inventory/stock-record"
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition"
            >
              Stock Record
            </Link>
          </div>

          {/* Quick Alert Pop-off Trigger Button */}
          {totalLowStockCount > 0 && (
            <button
              onClick={() => setShowLowStockModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black transition shadow-xs animate-pulse cursor-pointer"
              title="Pop-off Low Stock Alert"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alert ({totalLowStockCount})</span>
            </button>
          )}

          <button
            onClick={loadData}
            className={`p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs ${
              isRefreshing ? "animate-spin text-blue-600" : ""
            }`}
            title="Refresh Stock Balances"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <Link
            to="/inventory/purchase-orders"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise PO</span>
          </Link>
        </div>
      </div>

      {/* ── SUMMARY METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Valuation</span>
          <div className="text-xl font-black text-blue-700 mt-1">
            ₹ {Number(totalValuation).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Calculated at weighted cost</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Available Stock</span>
          <div className="text-xl font-black text-slate-900 mt-1">{totalAvailable} Units</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Ready for assembly & dispatch</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reserved / Allocated</span>
          <div className="text-xl font-black text-indigo-700 mt-1">{totalReserved} Units</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Allocated to pending site orders</span>
        </div>

        {/* 4th Card: CLICKABLE POP-OFF LOW STOCK ALERT CARD */}
        <div
          onClick={() => setShowLowStockModal(true)}
          className={`bg-white p-4 rounded-xl border transition shadow-2xs cursor-pointer group relative ${
            totalLowStockCount > 0
              ? "border-amber-300 bg-amber-50/40 hover:border-amber-500 hover:shadow-amber-100 hover:shadow-md"
              : "border-slate-200/80"
          }`}
          title="Click to pop-off Low Stock & Shortages Breakdown"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Low Stock & Shortages</span>
              {totalLowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full group-hover:bg-amber-600 group-hover:text-white transition">
              View Alert ➔
            </span>
          </div>

          <div className="text-xl font-black text-amber-800 mt-1 flex items-baseline gap-2">
            <span>{totalLowStockCount} Items</span>
            {outOfStockCount > 0 && (
              <span className="text-xs font-bold text-red-600">
                ({outOfStockCount} Out of Stock)
              </span>
            )}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">
            Click card to pop-off shortage breakdown
          </span>
        </div>
      </div>

      {/* ── CRITICAL SHORTAGE ALERT BANNER ── */}
      {totalLowStockCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border border-amber-300 p-4 rounded-2xl text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-[13px] flex items-center gap-2">
                <span>Immediate Attention: {totalLowStockCount} Inventory Items Need Reordering</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-slate-600 mt-0.5 text-[11px]">
                Available warehouse quantities have fallen below configured safety thresholds. Click below to inspect shortage gaps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowLowStockModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Open Alert Popup</span>
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "Low Stock" ? "all" : "Low Stock")}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer"
            >
              {statusFilter === "Low Stock" ? "Show All Items" : "Filter Low Stock in Table"}
            </button>
            <Link
              to="/inventory/purchase-orders"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Raise PO</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── FILTERS BAR ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU or Name..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Warehouse Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Warehouse className="w-4 h-4 text-slate-400" />
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.city})</option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Status Filter Pills with Counts */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
          {[
            { id: "all", label: "All", count: allStockList.length },
            { id: "In Stock", label: "In Stock", count: allStockList.filter(i => i.status === "In Stock").length },
            { id: "Low Stock", label: "Low Stock", count: lowStockOnlyCount, isAlert: true },
            { id: "Out of Stock", label: "Out of Stock", count: outOfStockCount, isDanger: true },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === s.id
                  ? s.isAlert
                    ? "bg-amber-500 text-white shadow-2xs font-extrabold"
                    : s.isDanger
                    ? "bg-red-600 text-white shadow-2xs font-extrabold"
                    : "bg-white text-blue-700 shadow-2xs font-extrabold"
                  : s.isAlert
                  ? "text-amber-800 hover:bg-amber-50"
                  : s.isDanger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{s.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === s.id
                    ? "bg-black/15 text-white"
                    : s.isAlert
                    ? "bg-amber-100 text-amber-800"
                    : s.isDanger
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {s.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── STOCK BALANCES TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Warehouse</th>
                <th className="p-3.5 text-center">On-Hand</th>
                <th className="p-3.5 text-center">Allocated</th>
                <th className="p-3.5 text-center">Available Stock</th>
                <th className="p-3.5 text-center">Reorder Min</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Unit Cost</th>
                <th className="p-3.5 text-right">Valuation (₹)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 font-semibold">
                    No items found matching the selected filters.
                  </td>
                </tr>
              ) : (
                stockList.map((item) => {
                  const isOut = item.status === "Out of Stock";
                  const isLow = item.status === "Low Stock";

                  return (
                    <tr
                      key={`${item.id}-${item.warehouseName}`}
                      className={`transition ${
                        isOut
                          ? "bg-red-50/30 hover:bg-red-50/60"
                          : isLow
                          ? "bg-amber-50/30 hover:bg-amber-50/60"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900">{item.sku}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.brand} • {item.uom}</div>
                      </td>
                      <td className="p-3.5 text-slate-600">{item.category}</td>
                      <td className="p-3.5 text-slate-700 font-medium">{item.warehouseName}</td>
                      <td className="p-3.5 text-center font-bold text-slate-700">{item.onHandQty}</td>
                      <td className="p-3.5 text-center font-bold text-indigo-600">{item.reservedQty}</td>
                      <td className="p-3.5 text-center">
                        <span className={`font-black text-sm ${isOut ? "text-red-700" : isLow ? "text-amber-800" : "text-slate-900"}`}>
                          {item.availableQty}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">{item.uom}</span>
                      </td>
                      <td className="p-3.5 text-center text-slate-500 font-bold">{item.minStock}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isOut
                              ? "bg-red-100 text-red-700"
                              : isLow
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        ₹ {Number(item.costPrice).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-blue-700">
                        ₹ {Number(item.totalValuation).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <Link
                          to="/inventory/stock-adjustment"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                        >
                          Adjust
                        </Link>
                        {(isLow || isOut) && (
                          <Link
                            to="/inventory/purchase-orders"
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition shadow-2xs"
                            title="Raise Purchase Order"
                          >
                            + PO
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── POP-OFF LOW STOCK ALERT MODAL (POPUP) ── */}
      {showLowStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      Critical Stock Shortage Alert
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">
                      Urgent Action
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lowStockItems.length} inventory products are currently at or below minimum safety levels.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Cards Inside Popup */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Low Stock Products</span>
                <div className="text-xl font-black text-amber-900 mt-0.5">
                  {lowStockOnlyCount} Items
                </div>
                <span className="text-[10px] text-amber-600">Below safety threshold</span>
              </div>
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200">
                <span className="text-[10px] font-bold text-red-700 uppercase">Out of Stock (Zero)</span>
                <div className="text-xl font-black text-red-900 mt-0.5">
                  {outOfStockCount} Items
                </div>
                <span className="text-[10px] text-red-600">Completely exhausted</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Recommended Action</span>
                <div className="text-sm font-extrabold text-blue-900 mt-1 flex items-center gap-1">
                  <span>Raise Purchase Order</span>
                </div>
                <span className="text-[10px] text-blue-600">Reorder from approved vendors</span>
              </div>
            </div>

            {/* Scrollable Table of Critical Items */}
            <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl max-h-[360px]">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="p-3">SKU & Product</th>
                    <th className="p-3 text-center">Available</th>
                    <th className="p-3 text-center">Safety Min</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 font-semibold">
                        No low stock items detected.
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((item) => (
                      <tr key={item.sku} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.sku} • {item.category}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-black text-sm ${item.status === "Out of Stock" ? "text-red-700" : "text-amber-800"}`}>
                            {item.availableQty}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">{item.uom}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-600">
                          {item.minStock} {item.uom}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.status === "Out of Stock"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right pr-4">
                          <Link
                            to="/inventory/purchase-orders"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-2xs"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Raise PO</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowLowStockModal(false);
                  setStatusFilter("Low Stock");
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Filter Table by Low Stock
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLowStockModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Dismiss
                </button>
                <Link
                  to="/inventory/purchase-orders"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Raise Bulk PO</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
