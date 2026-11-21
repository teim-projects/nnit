import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  BarChart3,
  Search,
  Download,
  Plus,
  RotateCcw,
  CheckCircle,
  IndianRupee,
  ShieldCheck,
  History,
  X,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Calendar,
  Building2,
  Tag,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { InventoryService } from "../../services/inventoryService";

export default function ProductPriceComparison({ defaultTab = "all" }) {
  // Navigation / View Tabs: 'all' | 'vendors' | 'history'
  const [activeTab, setActiveTab] = useState(
    defaultTab === "price_history" ? "history" : defaultTab === "price_comp" ? "vendors" : "all"
  );

  const [data, setData] = useState({ products: [], kpis: {} });
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [revisionFilter, setRevisionFilter] = useState("all"); // 'all' | 'high_rev' | 'increased' | 'decreased'
  
  // Selected product for individual trajectory spotlight
  const [selectedProductSku, setSelectedProductSku] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // Modals
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [revisionForm, setRevisionForm] = useState({
    sku: "",
    newPrice: "",
    reason: "",
    changedBy: "Procurement Manager",
    approvedBy: "Director Operations",
    refDoc: "",
    date: new Date().toISOString().split("T")[0]
  });
  const [formSuccess, setFormSuccess] = useState("");

  const refreshData = () => {
    const intel = InventoryService.getPriceComparisonIntelligence();
    setData(intel);
    setCategories(InventoryService.getCategories());
    if (intel.products.length > 0 && !selectedProductSku) {
      setSelectedProductSku(intel.products[0].sku);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return (data.products || []).filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        selectedCategory === "all" || p.category === selectedCategory;

      let matchRev = true;
      if (revisionFilter === "high_rev") {
        matchRev = p.revisionCount >= 3;
      } else if (revisionFilter === "increased") {
        matchRev = p.lifetimeChange > 0;
      } else if (revisionFilter === "decreased") {
        matchRev = p.lifetimeChange < 0;
      }

      return matchSearch && matchCat && matchRev;
    });
  }, [data.products, searchTerm, selectedCategory, revisionFilter]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, revisionFilter, pageSize]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  // Selected product object
  const activeProduct = useMemo(() => {
    return (
      (data.products || []).find((p) => p.sku === selectedProductSku) ||
      data.products?.[0] ||
      null
    );
  }, [data.products, selectedProductSku]);

  // Timeline chart data for active product
  const productTrajectoryData = useMemo(() => {
    if (!activeProduct || !activeProduct.revisions) return [];
    return activeProduct.revisions.map((rev) => ({
      revLabel: `Rev #${rev.revNo}`,
      date: rev.date,
      price: rev.newPrice,
      oldPrice: rev.oldPrice,
      diff: rev.changeAmount,
      diffPercent: rev.changePercent,
      reason: rev.reason,
      doc: rev.refDoc
    }));
  }, [activeProduct]);

  // Vendor comparison chart data (top 6 products)
  const vendorComparisonChartData = useMemo(() => {
    return filteredProducts.slice(0, 6).map((p) => {
      const vQuotes = p.vendorQuotes || [];
      const quote1 = vQuotes[0]?.rate || p.currentPrice;
      const quote2 = vQuotes[1]?.rate || Math.round(p.currentPrice * 1.06);

      return {
        name: p.name.length > 18 ? p.name.slice(0, 18) + "..." : p.name,
        fullName: p.name,
        sku: p.sku,
        "Current Cost": p.currentPrice,
        "Vendor A": Math.round(quote1),
        "Vendor B": Math.round(quote2),
        "Best L1 Bid": p.l1Rate,
        savings: p.savings
      };
    });
  }, [filteredProducts]);

  // Handle Add Revision Submit
  const handleAddRevisionSubmit = (e) => {
    e.preventDefault();
    if (!revisionForm.sku || !revisionForm.newPrice) return;

    InventoryService.addPriceRevision({
      sku: revisionForm.sku,
      newPrice: revisionForm.newPrice,
      reason: revisionForm.reason || "Periodic price adjustment",
      changedBy: revisionForm.changedBy,
      approvedBy: revisionForm.approvedBy,
      refDoc: revisionForm.refDoc,
      date: revisionForm.date
    });

    setFormSuccess("Price revision logged successfully!");
    refreshData();
    setTimeout(() => {
      setFormSuccess("");
      setAddModalOpen(false);
      setRevisionForm({
        sku: "",
        newPrice: "",
        reason: "",
        changedBy: "Procurement Manager",
        approvedBy: "Director Operations",
        refDoc: "",
        date: new Date().toISOString().split("T")[0]
      });
    }, 800);
  };

  // Open History Modal
  const openHistoryModal = (product) => {
    setActiveHistoryItem(product);
    setSelectedProductSku(product.sku);
    setHistoryModalOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Price Revisions Count",
      "Base Rate",
      "Current Rate",
      "Lifetime Change (Rs)",
      "Lifetime Change (%)",
      "Best L1 Bid",
      "Max Quote",
      "Savings"
    ];
    const rows = filteredProducts.map((p) => [
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${p.sku || ""}"`,
      `"${p.category || ""}"`,
      p.revisionCount,
      p.initialPrice,
      p.currentPrice,
      p.lifetimeChange,
      `${p.lifetimePercent}%`,
      p.l1Rate,
      p.highestQuote,
      p.savings
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Price_Comparison_Revision_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HERO CONTROL BAR ── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cost & Market Intelligence Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Product Price Comparison & Revision History</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Multi-vendor quotes comparison (L1), tracking how many times prices changed, and price evolution trends.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl text-xs font-bold border border-slate-200/60">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-indigo-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All-in-One Studio</span>
            </button>
            <button
              onClick={() => setActiveTab("vendors")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === "vendors"
                  ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Vendor Quotes</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === "history"
                  ? "bg-white text-purple-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Price History</span>
            </button>
          </div>

          <button
            onClick={() => {
              setRevisionForm({
                sku: filteredProducts[0]?.sku || "",
                newPrice: filteredProducts[0]?.currentPrice || "",
                reason: "",
                changedBy: "Procurement Manager",
                approvedBy: "Director Operations",
                refDoc: "",
                date: new Date().toISOString().split("T")[0]
              });
              setAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Record Price Change</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── 4 MODERN EXECUTIVE KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Price Revision Frequency */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-indigo-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Price Changes
            </span>
            <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition">
              <History className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {data.kpis?.totalRevisionsLogged || 0}
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              Revisions
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Average <strong className="text-slate-700">{data.kpis?.avgRevisionsPerProduct || 0} changes</strong> per product across catalog
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-3xl" />
        </div>

        {/* KPI 2: Highest Volatility Product */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-amber-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Most Changed Product
            </span>
            <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 truncate" title={data.kpis?.highestRevisionProduct?.name}>
              {data.kpis?.highestRevisionProduct?.name || "CMP-BLDC-CTRL-V3"}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 font-mono">
                ⚡ {data.kpis?.highestRevisionProduct?.count || 5} Times Revised
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {data.kpis?.highestRevisionProduct?.sku}
              </span>
            </div>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-3xl" />
        </div>

        {/* KPI 3: L1 Best Bid Savings */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              L1 Best Bid Savings
            </span>
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              ₹{Number(data.kpis?.totalSavingsAcrossCatalog || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Avg {data.kpis?.avgSavingsPercent || 12.8}% savings margin vs highest quotes</span>
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-3xl" />
        </div>

        {/* KPI 4: Contract Stability */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Catalog Stability
            </span>
            <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              78.5%
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              On-Target
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Procurement variance controlled within approved budget
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-3xl" />
        </div>
      </div>

      {/* ── VISUAL ANALYTICS STUDIO (Dual Interactive Cards) ── */}
      {(activeTab === "all" || activeTab === "vendors" || activeTab === "history") && (
        <div className={`grid gap-5 ${activeTab === "all" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
          {/* CHART A: Multi-Vendor Quotes Matrix */}
          {(activeTab === "all" || activeTab === "vendors") && (
            <div className={`${activeTab === "all" ? "lg:col-span-7" : "col-span-1"} bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4`}>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span>Multi-Vendor Price Comparison (L1 Matrix)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Comparing current purchase cost against supplier quotes (₹)
                    </p>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 self-start sm:self-auto">
                    ● Green = Lowest L1 Bid
                  </span>
                </div>

                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendorComparisonChartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3.5 rounded-2xl text-xs shadow-xl space-y-1.5 border border-slate-700">
                              <div className="font-black text-white border-b border-slate-700 pb-1">
                                {d.fullName}
                              </div>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Our Current Cost:</span>
                                <span className="font-mono font-bold text-blue-400">₹{d["Current Cost"].toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Vendor A Quote:</span>
                                <span className="font-mono font-semibold text-slate-200">₹{d["Vendor A"].toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Vendor B Quote:</span>
                                <span className="font-mono font-semibold text-slate-200">₹{d["Vendor B"].toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-emerald-400 font-bold border-t border-slate-700 pt-1">
                                <span>★ Best L1 Bid:</span>
                                <span className="font-mono">₹{d["Best L1 Bid"].toLocaleString()}</span>
                              </div>
                              <div className="text-[10px] text-emerald-300 font-medium">
                                Potential Savings: ₹{d.savings.toLocaleString()}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                      <Bar dataKey="Current Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                      <Bar dataKey="Vendor A" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={14} />
                      <Bar dataKey="Best L1 Bid" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 bg-slate-50/60 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3 rounded-b-3xl">
                <span>Showing top items with competitive bids</span>
                <span className="font-bold text-blue-600">Select any row below to inspect</span>
              </div>
            </div>
          )}

          {/* CHART B: Product Price Trajectory Spotlight */}
          {(activeTab === "all" || activeTab === "history") && (
            <div className={`${activeTab === "all" ? "lg:col-span-5" : "col-span-1"} bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-indigo-600" />
                      <span>Price Change Trajectory (Timeline)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Every price revision milestone since product launch
                    </p>
                  </div>

                  {/* Product Picker */}
                  <select
                    value={selectedProductSku}
                    onChange={(e) => setSelectedProductSku(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 max-w-[170px] truncate focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {(data.products || []).map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.name} ({p.revisionCount} Rev)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Product Stat Pill */}
                {activeProduct && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900 truncate max-w-[210px]" title={activeProduct.name}>
                        {activeProduct.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Base: <strong className="text-slate-700">₹{activeProduct.initialPrice?.toLocaleString()}</strong> ➔ Current: <strong className="text-indigo-700">₹{activeProduct.currentPrice?.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-2xs inline-flex items-center gap-1 font-mono">
                        ⚡ {activeProduct.revisionCount} Times
                      </span>
                      <span className={`text-[11px] font-bold block mt-0.5 ${activeProduct.lifetimeChange >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {activeProduct.lifetimeChange >= 0 ? `+₹${activeProduct.lifetimeChange.toLocaleString()} (+${activeProduct.lifetimePercent}%)` : `-₹${Math.abs(activeProduct.lifetimeChange).toLocaleString()} (${activeProduct.lifetimePercent}%)`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Area Chart */}
                <div className="h-56 w-full pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={productTrajectoryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="revLabel" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#64748b" }} domain={["auto", "auto"]} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl space-y-1 border border-slate-700 max-w-[240px]">
                              <div className="font-bold text-indigo-300 flex items-center justify-between">
                                <span>{d.revLabel}</span>
                                <span className="text-[10px] text-slate-400">{d.date}</span>
                              </div>
                              <div className="text-sm font-black font-mono text-white">
                                ₹{d.price.toLocaleString()}
                              </div>
                              {d.diff !== 0 && (
                                <div className={`text-[11px] font-bold ${d.diff > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                  {d.diff > 0 ? `+₹${d.diff.toLocaleString()} (+${d.diffPercent}%)` : `-₹${Math.abs(d.diff).toLocaleString()} (${d.diffPercent}%)`}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-300 italic pt-1 border-t border-slate-700">
                                "{d.reason}"
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#areaGradient)"
                        dot={{ r: 5, fill: "#6366f1", stroke: "#ffffff", strokeWidth: 2 }}
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <button
                onClick={() => activeProduct && openHistoryModal(activeProduct)}
                className="w-full py-2.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Full Audit Log Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SEARCH & FILTER TOOLBAR ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product or SKU..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Reset */}
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
              setRevisionFilter("all");
            }}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
          {[
            { id: "all", label: "All Items", count: data.products?.length || 0 },
            { id: "high_rev", label: "Changed ≥3 Times", count: (data.products || []).filter((p) => p.revisionCount >= 3).length },
            { id: "increased", label: "Price Increased", count: (data.products || []).filter((p) => p.lifetimeChange > 0).length }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setRevisionFilter(pill.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                revisionFilter === pill.id
                  ? "bg-white text-indigo-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{pill.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-200 text-slate-700">
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MASTER DATA COMPARISON & REVISION TABLE ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3.5 text-center w-12">SR</th>
                <th className="p-3.5 min-w-[240px]">PRODUCT</th>
                <th className="p-3.5 text-center min-w-[150px]">PRICE REVISED COUNT</th>
                <th className="p-3.5 text-right pr-4">INITIAL RATE</th>
                <th className="p-3.5 text-right pr-4">CURRENT RATE</th>
                <th className="p-3.5 text-right pr-4">LIFETIME VARIANCE</th>
                <th className="p-3.5 text-right pr-4">BEST L1 BID</th>
                <th className="p-3.5 text-center">L1 SAVINGS</th>
                <th className="p-3.5 text-center pr-6">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 font-semibold">
                    No products found matching your filter.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const isSelected = selectedProductSku === p.sku;

                  return (
                    <tr
                      key={p.sku}
                      onClick={() => setSelectedProductSku(p.sku)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isSelected ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      {/* SR */}
                      <td className="p-3.5 text-center text-slate-400 font-semibold">
                        {startIndex + idx + 1}
                      </td>

                      {/* Product */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-xs sm:text-[13px] flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Selected" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                          <span className="font-mono text-slate-500">{p.sku}</span>
                          <span>•</span>
                          <span>{p.category}</span>
                        </div>
                      </td>

                      {/* Kitni Baar Change Hua Badge */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openHistoryModal(p);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition cursor-pointer shadow-2xs ${
                            p.revisionCount >= 4
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200/60"
                              : p.revisionCount >= 2
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200/60"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200/60"
                          }`}
                          title="Click to view history timeline"
                        >
                          <History className="w-3 h-3 shrink-0" />
                          <span>{p.revisionCount} Times Changed</span>
                        </button>
                      </td>

                      {/* Base Rate */}
                      <td className="p-3.5 text-right pr-4 font-mono text-slate-500 font-medium">
                        ₹{Number(p.initialPrice).toLocaleString("en-IN")}
                      </td>

                      {/* Current Rate */}
                      <td className="p-3.5 text-right pr-4 font-mono font-black text-slate-900 text-[13px]">
                        ₹{Number(p.currentPrice).toLocaleString("en-IN")}
                      </td>

                      {/* Lifetime Variance */}
                      <td className="p-3.5 text-right pr-4 font-mono font-bold">
                        {p.lifetimeChange > 0 ? (
                          <span className="text-rose-600 inline-flex items-center gap-0.5">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>+₹{Number(p.lifetimeChange).toLocaleString()} (+{p.lifetimePercent}%)</span>
                          </span>
                        ) : p.lifetimeChange < 0 ? (
                          <span className="text-emerald-600 inline-flex items-center gap-0.5">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>-₹{Number(Math.abs(p.lifetimeChange)).toLocaleString()} ({p.lifetimePercent}%)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0%</span>
                        )}
                      </td>

                      {/* Best L1 Bid */}
                      <td className="p-3.5 text-right pr-4 font-mono font-extrabold text-emerald-700">
                        ₹{Number(p.l1Rate).toLocaleString("en-IN")}
                      </td>

                      {/* Savings */}
                      <td className="p-3.5 text-center">
                        {p.savings > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {p.savingsPercent}% (₹{p.savings.toLocaleString()})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Best Single</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center pr-6">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openHistoryModal(p);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                          >
                            Timeline
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRevisionForm({
                                sku: p.sku,
                                newPrice: p.currentPrice,
                                reason: "",
                                changedBy: "Procurement Manager",
                                approvedBy: "Director Operations",
                                refDoc: "",
                                date: new Date().toISOString().split("T")[0]
                              });
                              setAddModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                          >
                            + Revise
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION BAR ── */}
        {filteredProducts.length > 0 && (
          <div className="bg-slate-50/80 px-4 sm:px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-500 font-medium">
                Showing <strong className="text-slate-800">{startIndex + 1}</strong> to{" "}
                <strong className="text-slate-800">{endIndex}</strong> of{" "}
                <strong className="text-slate-800">{totalItems}</strong> products
              </span>
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      currentPage === page
                        ? "bg-indigo-600 text-white shadow-2xs font-extrabold"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── TIMELINE AUDIT MODAL: ALL REVISIONS ── */}
      {historyModalOpen && activeHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Price Change History Log
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {activeHistoryItem.name}
                </h3>
                <p className="text-xs text-slate-500">
                  SKU: <span className="font-mono font-semibold">{activeHistoryItem.sku}</span> • Total {activeHistoryItem.revisionCount} Price Revisions
                </p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline Items */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {(activeHistoryItem.revisions || []).map((rev, rIdx) => {
                const isCurrent = rIdx === activeHistoryItem.revisions.length - 1;
                return (
                  <div
                    key={rIdx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-indigo-700">
                        Revision #{rev.revNo} {isCurrent && "(Current Active Rate)"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {rev.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-400">₹{rev.oldPrice?.toLocaleString()}</span>
                      <span>➔</span>
                      <span className="font-black text-slate-900">₹{rev.newPrice?.toLocaleString()}</span>
                      {rev.changeAmount !== 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            rev.changeAmount > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {rev.changeAmount > 0 ? `+₹${rev.changeAmount.toLocaleString()} (+${rev.changePercent}%)` : `-₹${Math.abs(rev.changeAmount).toLocaleString()} (${rev.changePercent}%)`}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                      <strong>Reason:</strong> "{rev.reason}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>By: {rev.changedBy || "Procurement"}</span>
                      {rev.refDoc && <span className="font-mono text-indigo-600">{rev.refDoc}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-end border-t border-slate-100">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD PRICE REVISION ── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Record Price Revision
                </h3>
                <p className="text-xs text-slate-500">
                  Update product procurement rate and append to audit history
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddRevisionSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Product *
                </label>
                <select
                  required
                  value={revisionForm.sku}
                  onChange={(e) => {
                    const found = (data.products || []).find((p) => p.sku === e.target.value);
                    setRevisionForm({
                      ...revisionForm,
                      sku: e.target.value,
                      newPrice: found ? found.currentPrice : ""
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Product --</option>
                  {(data.products || []).map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.name} (Current: ₹{p.currentPrice?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Procurement Rate (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25500"
                  value={revisionForm.newPrice}
                  onChange={(e) => setRevisionForm({ ...revisionForm, newPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Effective Revision Date
                </label>
                <input
                  type="date"
                  value={revisionForm.date}
                  onChange={(e) => setRevisionForm({ ...revisionForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Price Change *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw material surge, Vendor renegotiation"
                  value={revisionForm.reason}
                  onChange={(e) => setRevisionForm({ ...revisionForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reference Document / PO Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-0044"
                  value={revisionForm.refDoc}
                  onChange={(e) => setRevisionForm({ ...revisionForm, refDoc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
