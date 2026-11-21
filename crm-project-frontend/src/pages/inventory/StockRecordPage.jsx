import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Download,
  RotateCcw,
  Plus,
  X,
  CheckCircle
} from "lucide-react";
import { InventoryService } from "../../services/inventoryService";

export default function StockRecordPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [records, setRecords] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Movement Modal
  const [showModal, setShowModal] = useState(false);
  const [movementForm, setMovementForm] = useState({
    sku: "",
    type: "receipt", // 'receipt' | 'sent' | 'opening' | 'reserved'
    qty: "",
    warehouseId: 1,
    notes: ""
  });
  const [modalSuccess, setModalSuccess] = useState("");

  const loadData = () => {
    setIsRefreshing(true);
    setCategories(InventoryService.getCategories());
    setWarehouses(InventoryService.getWarehouses());
    const data = InventoryService.getStockRecords(
      warehouseFilter,
      categoryFilter,
      searchTerm,
      dateFilter,
      "all"
    );
    setRecords(data);
    setTimeout(() => setIsRefreshing(false), 150);
  };

  useEffect(() => {
    loadData();
  }, [warehouseFilter, categoryFilter, dateFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleReset = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setWarehouseFilter("all");
    setDateFilter("");
    const resetData = InventoryService.getStockRecords("all", "all", "", "", "all");
    setRecords(resetData);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "SR",
      "Product Name",
      "SKU",
      "Category",
      "Warehouse",
      "Opening",
      "Receipt",
      "Sent",
      "Approved",
      "Reserved",
      "Closing",
      "Available"
    ];
    const rows = records.map((r, i) => [
      r.sr || i + 1,
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${r.sku || ""}"`,
      `"${(r.category || "").replace(/"/g, '""')}"`,
      `"${(r.warehouseName || "").replace(/"/g, '""')}"`,
      r.opening,
      r.receipt,
      r.sent,
      r.approved,
      r.reserved,
      r.closing,
      r.available
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Stock_Summary_Record_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Quick Movement
  const handleRecordMovement = (e) => {
    e.preventDefault();
    if (!movementForm.sku || !movementForm.qty) return;

    const qty = parseFloat(movementForm.qty) || 0;
    if (movementForm.type === "opening") {
      InventoryService.adjustStockMovement(movementForm.sku, {
        opening: qty,
        warehouseId: movementForm.warehouseId
      });
    } else if (movementForm.type === "receipt") {
      InventoryService.adjustStockMovement(movementForm.sku, {
        receiptDelta: qty,
        warehouseId: movementForm.warehouseId
      });
    } else if (movementForm.type === "sent") {
      InventoryService.adjustStockMovement(movementForm.sku, {
        sentDelta: qty,
        warehouseId: movementForm.warehouseId
      });
    } else if (movementForm.type === "reserved") {
      InventoryService.adjustStockMovement(movementForm.sku, {
        reservedDelta: qty,
        warehouseId: movementForm.warehouseId
      });
    }

    setModalSuccess("Stock movement recorded successfully!");
    setTimeout(() => {
      setModalSuccess("");
      setShowModal(false);
      setMovementForm({
        sku: "",
        type: "receipt",
        qty: "",
        warehouseId: 1,
        notes: ""
      });
      loadData();
    }, 800);
  };

  // Totals Summary
  const totalOpening = records.reduce((s, r) => s + (Number(r.opening) || 0), 0);
  const totalReceipt = records.reduce((s, r) => s + (Number(r.receipt) || 0), 0);
  const totalSent = records.reduce((s, r) => s + (Number(r.sent) || 0), 0);
  const totalApproved = records.reduce((s, r) => s + (Number(r.approved) || 0), 0);
  const totalReserved = records.reduce((s, r) => s + (Number(r.reserved) || 0), 0);
  const totalClosing = records.reduce((s, r) => s + (Number(r.closing) || 0), 0);
  const totalAvailable = records.reduce((s, r) => s + (Number(r.available) || 0), 0);

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-4 w-full pb-16">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <span>Inventory ERP</span>
            <span>•</span>
            <span>Stock Ledger & Register</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Stock Summary</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              Opening + Receipt - Sent = Closing
            </span>
            <span>·</span>
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Available = Closing - Reserved
            </span>
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <Link
              to="/inventory/stock-summary"
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition"
            >
              Warehouse Balances
            </Link>
            <span className="px-3 py-1.5 rounded-lg bg-white text-blue-700 shadow-2xs font-extrabold">
              Stock Record
            </span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Movement</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── FILTER BAR (Exact Match to User Image) ── */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* All Categories Dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* All Warehouses Dropdown */}
          <div className="relative">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Input */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            Search
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>

        {/* Right Export Button */}
        <div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </form>

      {/* ── STOCK RECORD DATA TABLE (Exact Columns & Colors) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3.5 text-center w-12">SR</th>
                <th className="p-3.5 min-w-[260px]">PRODUCT</th>
                <th className="p-3.5 text-right pr-4">OPENING</th>
                <th className="p-3.5 text-right pr-4">RECEIPT</th>
                <th className="p-3.5 text-right pr-4">SENT</th>
                <th className="p-3.5 text-right pr-4">APPROVED</th>
                <th className="p-3.5 text-right pr-4">RESERVED</th>
                <th className="p-3.5 text-right pr-4">CLOSING</th>
                <th className="p-3.5 text-right pr-6">AVAILABLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-10 text-center text-slate-400 font-semibold"
                  >
                    No stock records found matching your filters.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const receiptVal = Number(r.receipt) || 0;
                  const sentVal = Number(r.sent) || 0;

                  return (
                    <tr
                      key={r.id || `${r.sku}-${idx}`}
                      className="hover:bg-slate-50/80 transition"
                    >
                      {/* SR */}
                      <td className="p-3.5 text-center text-slate-400 font-semibold">
                        {r.sr || idx + 1}
                      </td>

                      {/* PRODUCT */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-xs sm:text-[13px]">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          <span className="font-mono text-slate-500">{r.sku}</span>
                          <span className="mx-1.5">•</span>
                          <span>{r.category}</span>
                        </div>
                      </td>

                      {/* OPENING */}
                      <td className="p-3.5 text-right pr-4 font-medium text-slate-700">
                        {Number(r.opening).toLocaleString("en-IN", {
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* RECEIPT (Green if > 0) */}
                      <td className="p-3.5 text-right pr-4 font-bold">
                        <span
                          className={
                            receiptVal > 0 ? "text-emerald-600" : "text-slate-400"
                          }
                        >
                          {receiptVal > 0
                            ? Number(receiptVal).toLocaleString("en-IN", {
                                maximumFractionDigits: 2
                              })
                            : "0"}
                        </span>
                      </td>

                      {/* SENT (Red/Rose if > 0) */}
                      <td className="p-3.5 text-right pr-4 font-bold">
                        <span
                          className={
                            sentVal > 0 ? "text-rose-500" : "text-slate-400"
                          }
                        >
                          {sentVal > 0
                            ? Number(sentVal).toLocaleString("en-IN", {
                                maximumFractionDigits: 2
                              })
                            : "0"}
                        </span>
                      </td>

                      {/* APPROVED */}
                      <td className="p-3.5 text-right pr-4 font-medium text-slate-500">
                        {Number(r.approved || 0).toLocaleString("en-IN", {
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* RESERVED */}
                      <td className="p-3.5 text-right pr-4 font-medium text-slate-500">
                        {Number(r.reserved || 0).toLocaleString("en-IN", {
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* CLOSING (Opening + Receipt - Sent) */}
                      <td className="p-3.5 text-right pr-4 font-black text-slate-900 text-[13px]">
                        {Number(r.closing).toLocaleString("en-IN", {
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* AVAILABLE (Closing - Reserved) */}
                      <td className="p-3.5 text-right pr-6 font-black text-blue-600 text-[13px]">
                        {Number(r.available).toLocaleString("en-IN", {
                          maximumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Totals Summary Row */}
            {records.length > 0 && (
              <tfoot className="bg-slate-50/90 font-bold text-slate-800 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="p-3.5 pl-6 text-slate-600 text-xs uppercase tracking-wider font-extrabold">
                    Total Across {records.length} Products
                  </td>
                  <td className="p-3.5 text-right pr-4 text-slate-800 font-extrabold">
                    {totalOpening.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right pr-4 text-emerald-600 font-extrabold">
                    {totalReceipt.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right pr-4 text-rose-500 font-extrabold">
                    {totalSent.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right pr-4 text-slate-600 font-extrabold">
                    {totalApproved.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right pr-4 text-slate-600 font-extrabold">
                    {totalReserved.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right pr-4 text-slate-900 font-black text-sm">
                    {totalClosing.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right pr-6 text-blue-600 font-black text-sm">
                    {totalAvailable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── RECORD MOVEMENT / QUICK ADJUSTMENT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Stock Movement
                </h3>
                <p className="text-xs text-slate-500">
                  Instantly update Opening, Receipt, Sent, or Reserved stock
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordMovement} className="space-y-3.5">
              {/* Product Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Product *
                </label>
                <select
                  required
                  value={movementForm.sku}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, sku: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose a Product --</option>
                  {records.map((r) => (
                    <option key={r.sku} value={r.sku}>
                      {r.name} ({r.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Movement Type *
                </label>
                <select
                  value={movementForm.type}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="receipt">Receipt (+ Inward / Goods Received)</option>
                  <option value="sent">Sent (- Outward / Material Dispatched)</option>
                  <option value="opening">Set / Adjust Opening Stock Balance</option>
                  <option value="reserved">Reserve / Allocate Stock (Project)</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50 or 12.5"
                  value={movementForm.qty}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, qty: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Warehouse */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Warehouse
                </label>
                <select
                  value={movementForm.warehouseId}
                  onChange={(e) =>
                    setMovementForm({
                      ...movementForm,
                      warehouseId: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reference / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-0042, Site dispatch, or Audit"
                  value={movementForm.notes}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
