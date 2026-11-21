import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  FileText,
  TrendingUp,
  Factory,
  BarChart3,
  AlertTriangle,
  IndianRupee,
  Download,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  Filter
} from "lucide-react";
import { InventoryService } from "../../services/inventoryService";
import ProductPriceComparison from "../../components/inventory/ProductPriceComparison";

export default function InventoryReportsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const getReportFromPath = (pathname) => {
    if (pathname.includes("product-purchase-history")) return "prod_history";
    if (pathname.includes("product-price-history")) return "price_history";
    if (pathname.includes("vendor-purchase-history")) return "vendor_history";
    if (pathname.includes("product-price-comparison")) return "price_comp";
    if (pathname.includes("low-stock")) return "low_stock";
    if (pathname.includes("valuation")) return "valuation";
    return "purchase_reg";
  };

  const [activeReport, setActiveReport] = useState(() => getReportFromPath(location.pathname));
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pos, setPos] = useState([]);
  const [grns, setGrns] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    setActiveReport(getReportFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    setProducts(InventoryService.getProducts());
    setVendors(InventoryService.getVendors());
    setPos(InventoryService.getPurchaseOrders());
    setGrns(InventoryService.getGRNs());
    setWarehouses(InventoryService.getWarehouses());
  }, []);

  const handleTabChange = (reportKey, path) => {
    setActiveReport(reportKey);
    setSearch("");
    navigate(path);
  };

  // Export CSV
  const handleExport = () => {
    alert("Exporting report data to CSV...");
  };

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-5 w-full pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <span>Inventory ERP</span>
            <span>•</span>
            <span>Intelligence & Audit Reports</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory Analytics & Audit Registers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit registers, vendor delivery performance, procurement history, valuation metrics, and low-stock shortages.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Report CSV</span>
        </button>
      </div>

      {/* ── REPORT SUB-TABS (Directly matches Screenshot 2: Purchase Register, Product Purchase History, Product Price History, Vendor Purchase History, Product Price Comparison, Low Stock Report, Inventory Valuation) ── */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto no-scrollbar">
        {[
          { id: "purchase_reg", label: "Purchase Register", path: "/inventory/reports/purchase-register", icon: FileText },
          { id: "prod_history", label: "Product Purchase History", path: "/inventory/reports/product-purchase-history", icon: TrendingUp },
          { id: "price_history", label: "Product Price History", path: "/inventory/reports/product-price-history", icon: TrendingUp },
          { id: "vendor_history", label: "Vendor Purchase History", path: "/inventory/reports/vendor-purchase-history", icon: Factory },
          { id: "price_comp", label: "Product Price Comparison", path: "/inventory/reports/product-price-comparison", icon: BarChart3 },
          { id: "low_stock", label: "Low Stock Report", path: "/inventory/reports/low-stock", icon: AlertTriangle },
          { id: "valuation", label: "Inventory Valuation", path: "/inventory/reports/valuation", icon: IndianRupee },
        ].map((tab) => {
          const isActive = activeReport === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id, tab.path)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── ADVANCED PRODUCT PRICE COMPARISON & REVISION INTELLIGENCE SUITE ── */}
      {(activeReport === "price_comp" || activeReport === "price_history") && (
        <ProductPriceComparison
          defaultTab={activeReport === "price_history" ? "price_history" : "all"}
        />
      )}

      {/* ── STANDARD REPORT VIEW CONTAINER (For other registers) ── */}
      {activeReport !== "price_comp" && activeReport !== "price_history" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Search & Period Bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in report..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Period: Current Financial Year 2026-27</span>
            </div>
          </div>

          {/* 1. PURCHASE REGISTER */}
          {activeReport === "purchase_reg" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">PO Number</th>
                    <th className="p-3.5">Vendor Name</th>
                    <th className="p-3.5">Order Date</th>
                    <th className="p-3.5 text-right">Subtotal (₹)</th>
                    <th className="p-3.5 text-right">GST 18% (₹)</th>
                    <th className="p-3.5 text-right">Total Invoice (₹)</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-blue-700">{p.poNumber}</td>
                      <td className="p-3.5 font-bold text-slate-900">{p.vendorName}</td>
                      <td className="p-3.5 text-slate-500">{p.orderDate}</td>
                      <td className="p-3.5 text-right font-mono text-slate-700">₹ {Number(p.subtotal).toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono text-slate-500">₹ {Number(p.tax).toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">
                        ₹ {Number(p.total).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. PRODUCT PURCHASE HISTORY */}
          {activeReport === "prod_history" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Product SKU</th>
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5">Primary Supplier</th>
                    <th className="p-3.5 text-center">Total Purchased Qty</th>
                    <th className="p-3.5 text-right">Last Purchase Rate</th>
                    <th className="p-3.5 text-right">Total Purchase Spend (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.slice(0, 8).map((prod, idx) => (
                    <tr key={prod.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-blue-700">{prod.sku}</td>
                      <td className="p-3.5 font-bold text-slate-900">{prod.name}</td>
                      <td className="p-3.5 text-slate-600 font-semibold">{vendors[idx % vendors.length]?.name}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{20 + idx * 5} {prod.uom}</td>
                      <td className="p-3.5 text-right font-mono text-slate-700">₹ {Number(prod.costPrice).toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-blue-700">
                        ₹ {Number((20 + idx * 5) * prod.costPrice).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. VENDOR PURCHASE HISTORY */}
          {activeReport === "vendor_history" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Vendor Name</th>
                    <th className="p-3.5">GSTIN</th>
                    <th className="p-3.5 text-center">Completed POs</th>
                    <th className="p-3.5 text-right">Cumulative Value (₹)</th>
                    <th className="p-3.5 text-center">On-Time Delivery %</th>
                    <th className="p-3.5 text-center">Quality Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{v.name}</td>
                      <td className="p-3.5 font-mono text-slate-600">{v.gstin}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">12 POs</td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-blue-700">₹ 8,45,000</td>
                      <td className="p-3.5 text-center font-bold text-emerald-600">98.2%</td>
                      <td className="p-3.5 text-center font-bold text-amber-600">★ {v.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. LOW STOCK REPORT */}
          {activeReport === "low_stock" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">SKU Code</th>
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-center">Available Stock</th>
                    <th className="p-3.5 text-center">Reorder Threshold</th>
                    <th className="p-3.5 text-center">Suggested PO Qty</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products
                    .filter((p) => {
                      const total = Object.values(p.stocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
                      return total <= (Number(p.minStock) || 5);
                    })
                    .map((item) => {
                      const total = Object.values(item.stocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
                      return (
                        <tr key={item.id} className="hover:bg-amber-50/40 transition">
                          <td className="p-3.5 font-mono font-bold text-slate-900">{item.sku}</td>
                          <td className="p-3.5 font-semibold text-slate-900">{item.name}</td>
                          <td className="p-3.5 text-slate-600">{item.category}</td>
                          <td className="p-3.5 text-center font-bold text-red-600">{total} {item.uom}</td>
                          <td className="p-3.5 text-center font-bold text-slate-600">{item.minStock} {item.uom}</td>
                          <td className="p-3.5 text-center font-bold text-blue-700">{item.reorderQty || 20} {item.uom}</td>
                          <td className="p-3.5 text-right">
                            <Link
                              to="/inventory/purchase-orders"
                              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px]"
                            >
                              + Raise Order
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* 7. INVENTORY VALUATION */}
          {activeReport === "valuation" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">SKU Code</th>
                    <th className="p-3.5">Item Name</th>
                    <th className="p-3.5">Classification</th>
                    <th className="p-3.5 text-center">Total Quantity</th>
                    <th className="p-3.5 text-right">Weighted Cost Rate (₹)</th>
                    <th className="p-3.5 text-right">Total Asset Valuation (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((prod) => {
                    const total = Object.values(prod.stocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
                    const totalVal = total * prod.costPrice;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900">{prod.sku}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{prod.name}</td>
                        <td className="p-3.5 text-slate-600">{prod.category}</td>
                        <td className="p-3.5 text-center font-bold text-slate-800">{total} {prod.uom}</td>
                        <td className="p-3.5 text-right font-mono text-slate-700">₹ {Number(prod.costPrice).toLocaleString()}</td>
                        <td className="p-3.5 text-right font-mono font-extrabold text-blue-700">
                          ₹ {Number(totalVal).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
