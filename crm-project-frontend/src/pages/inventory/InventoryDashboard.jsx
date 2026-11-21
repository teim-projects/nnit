import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  Box,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  TrendingUp,
  Warehouse,
  IndianRupee,
  Plus,
  RefreshCw,
  ArrowRight,
  ClipboardList,
  Truck,
  RotateCcw,
  Sliders,
  GitBranch,
  ShieldAlert,
  ChevronRight
} from "lucide-react";
import { InventoryService } from "../../services/inventoryService";

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState(() => InventoryService.getTelemetry());
  const [products, setProducts] = useState(() => InventoryService.getProducts());
  const [warehouses, setWarehouses] = useState(() => InventoryService.getWarehouses());
  const [pos, setPos] = useState(() => InventoryService.getPurchaseOrders());
  const [grns, setGrns] = useState(() => InventoryService.getGRNs());
  const [requisitions, setRequisitions] = useState(() => InventoryService.getRequisitions());
  const [challans, setChallans] = useState(() => InventoryService.getDeliveryChallans());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("low_stock");

  const loadData = () => {
    setIsRefreshing(true);
    setTelemetry(InventoryService.getTelemetry());
    setProducts(InventoryService.getProducts());
    setWarehouses(InventoryService.getWarehouses());
    setPos(InventoryService.getPurchaseOrders());
    setGrns(InventoryService.getGRNs());
    setRequisitions(InventoryService.getRequisitions());
    setChallans(InventoryService.getDeliveryChallans());
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute low stock items
  const lowStockItems = products.filter((p) => {
    const totalAvail = Object.values(p.stocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    return totalAvail <= (Number(p.minStock) || 5);
  });

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-5 w-full pb-16">
      {/* ── TOP HEADER & QUICK ACTIONS ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <span>Inventory ERP</span>
            <span>•</span>
            <span>Parking Systems Supply Chain</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Materials & Stock Telemetry</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time procurement, BOM manufacturing, multi-warehouse stock balances, and material movements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadData}
            className={`p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs ${
              isRefreshing ? "animate-spin text-blue-600" : ""
            }`}
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/inventory/purchase-orders"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New PO</span>
          </Link>

          <Link
            to="/inventory/grn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Receive GRN</span>
          </Link>

          <Link
            to="/inventory/bom/create"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Create BOM</span>
          </Link>

          <Link
            to="/inventory/stock-summary"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stock Summary</span>
          </Link>
        </div>
      </div>

      {/* ── 4 PRIMARY METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valuation */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Total Stock Valuation</span>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black tracking-tight">
              ₹ {Number(telemetry.totalValuation || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-blue-100/90 mt-1">Across 4 Central & Regional Warehouses</p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-blue-100">
            <span>Active SKUs: {telemetry.totalItemsTracked}</span>
            <Link to="/inventory/reports/valuation" className="underline font-bold hover:text-white">
              Valuation Report →
            </Link>
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Reorder & Low Stock</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{telemetry.lowStockCount + telemetry.outOfStockCount} Items</span>
              {(telemetry.lowStockCount + telemetry.outOfStockCount) > 0 && (
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {telemetry.outOfStockCount} Out of Stock
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Materials below minimum safety stock level</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-700 font-semibold">{telemetry.lowStockCount} Need Reorder</span>
            <Link to="/inventory/reports/low-stock" className="text-blue-600 font-bold hover:underline">
              View Shortage List →
            </Link>
          </div>
        </div>

        {/* Card 3: Active Procurement POs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchase Orders</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {telemetry.activePOs} Open POs
            </h2>
            <p className="text-xs text-slate-500 mt-1">{telemetry.totalGRNs} Total GRN receipts recorded</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Vendor Deliveries Pending</span>
            <Link to="/inventory/purchase-orders" className="text-blue-600 font-bold hover:underline">
              Manage Orders →
            </Link>
          </div>
        </div>

        {/* Card 4: BOM & Assembly */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">BOM Assembly Lines</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {telemetry.totalBOMs} Active BOMs
            </h2>
            <p className="text-xs text-slate-500 mt-1">Barrier cabinets, boom arms & Fastag kits</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Availability Checker Ready</span>
            <Link to="/inventory/bom" className="text-blue-600 font-bold hover:underline">
              Check Shortages →
            </Link>
          </div>
        </div>
      </div>

      {/* ── WAREHOUSE SUMMARY CARDS ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Warehouse Storage Positions</h2>
            <p className="text-xs text-slate-500">Material distribution across manufacturing and distribution centers</p>
          </div>
          <Link
            to="/inventory/warehouses"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>All Warehouses</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {warehouses.map((wh) => {
            // Count total on-hand in this warehouse
            const totalUnits = products.reduce((sum, p) => sum + (Number(p.stocks?.[wh.id]) || 0), 0);
            const totalValue = products.reduce((sum, p) => sum + (Number(p.stocks?.[wh.id]) || 0) * p.costPrice, 0);

            return (
              <div
                key={wh.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    {wh.code}
                  </span>
                  {wh.isPrimary && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Primary Plant
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 truncate" title={wh.name}>
                  {wh.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{wh.city}, {wh.state}</p>

                <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Stock</span>
                    <span className="font-extrabold text-slate-800">{totalUnits} Units</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Valuation</span>
                    <span className="font-extrabold text-blue-700">₹ {(totalValue / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── OPERATIONAL WORKFLOW TABS & TABLES ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 px-5 pt-4 border-b border-slate-200/80 overflow-x-auto no-scrollbar">
          {[
            { id: "low_stock", label: `Low Stock Alerts (${lowStockItems.length})`, icon: AlertTriangle },
            { id: "grn", label: `Recent GRNs (${grns.length})`, icon: CheckCircle2 },
            { id: "requisitions", label: `Material Requests (${requisitions.length})`, icon: ClipboardList },
            { id: "dispatches", label: `Delivery Challans (${challans.length})`, icon: Truck },
          ].map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-x-auto">
          {activeTab === "low_stock" && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Available Stock</th>
                  <th className="p-3 text-center">Min Safety Level</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                      ✅ All inventory items are adequately stocked above safety threshold.
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((item) => {
                    const totalAvail = Object.values(item.stocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
                    const isOut = totalAvail <= 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-bold text-slate-800">{item.sku}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                        <td className="p-3 text-slate-500">{item.category}</td>
                        <td className="p-3 text-center font-bold text-slate-900">{totalAvail} {item.uom}</td>
                        <td className="p-3 text-center font-bold text-slate-500">{item.minStock} {item.uom}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isOut ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isOut ? "Out of Stock" : "Low Stock"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            to="/inventory/purchase-orders"
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold transition text-[11px]"
                          >
                            + Raise PO
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === "grn" && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-3">GRN No.</th>
                  <th className="p-3">PO Reference</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Warehouse Received</th>
                  <th className="p-3">Received Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grns.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-blue-700">{g.grnNumber}</td>
                    <td className="p-3 font-mono text-slate-600">{g.poNumber || "Direct GRN"}</td>
                    <td className="p-3 font-semibold text-slate-800">{g.vendorName}</td>
                    <td className="p-3 text-slate-600">{g.warehouseName}</td>
                    <td className="p-3 text-slate-500">{g.receivedDate}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "requisitions" && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-3">MR No.</th>
                  <th className="p-3">Requested By</th>
                  <th className="p-3">Department / Project Site</th>
                  <th className="p-3">Required Date</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requisitions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-indigo-700">{r.mrNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.requestedBy}</td>
                    <td className="p-3 text-slate-600">{r.departmentProject}</td>
                    <td className="p-3 text-slate-500">{r.requiredDate}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          r.priority === "Urgent"
                            ? "bg-red-100 text-red-700"
                            : r.priority === "High"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === "Approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "dispatches" && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-3">DC Number</th>
                  <th className="p-3">Customer / Project</th>
                  <th className="p-3">Site Location</th>
                  <th className="p-3">Dispatch Date</th>
                  <th className="p-3">Vehicle No.</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challans.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-blue-700">{c.dcNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{c.customerName}</td>
                    <td className="p-3 text-slate-600">{c.siteName}</td>
                    <td className="p-3 text-slate-500">{c.dispatchDate}</td>
                    <td className="p-3 font-mono text-slate-600">{c.vehicleNumber}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
