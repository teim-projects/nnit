import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  RotateCcw,
  ArrowRightLeft,
  Sliders,
  Plus,
  Search,
  CheckCircle,
  FileText,
  MapPin,
  Calendar,
  AlertTriangle,
  Layers
} from "lucide-react";
import Swal from "sweetalert2";
import { InventoryService } from "../../services/inventoryService";

export default function InventoryMaterialMovement() {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (pathname) => {
    if (pathname.includes("delivery-challan")) return "dc";
    if (pathname.includes("material-return")) return "return";
    if (pathname.includes("stock-transfer")) return "transfer";
    if (pathname.includes("stock-adjustment")) return "adjustment";
    return "mtn";
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [search, setSearch] = useState("");

  const [mtns, setMtns] = useState([]);
  const [dcs, setDcs] = useState([]);
  const [returns, setReturns] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [movementItems, setMovementItems] = useState([]);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const loadData = () => {
    setMtns(InventoryService.getMTNs());
    setDcs(InventoryService.getDeliveryChallans());
    setReturns(InventoryService.getMaterialReturns());
    setAdjustments(InventoryService.getStockAdjustments());
    setWarehouses(InventoryService.getWarehouses());
    setProducts(InventoryService.getProducts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tab, path) => {
    setActiveTab(tab);
    setSearch("");
    navigate(path);
  };

  const openCreateModal = () => {
    const wh1 = warehouses[0]?.name || "Central Assembly Plant - Pune";
    const wh2 = warehouses[1]?.name || "Mumbai Regional Distribution Hub";
    const prod = products[0] || {};

    if (activeTab === "mtn") {
      setFormData({
        sourceWarehouse: wh1,
        destinationWarehouse: wh2,
        purpose: "Project staging replenishment",
        approvedBy: "Pravin Dare",
        status: "In Transit"
      });
      setMovementItems([{ sku: prod.sku, name: prod.name, qty: 2 }]);
    } else if (activeTab === "dc") {
      setFormData({
        customerName: "Phoenix Mills Developers Ltd.",
        siteName: "Phoenix Mall Parking - Viman Nagar",
        dispatchWarehouse: wh1,
        vehicleNumber: "MH-12-PQ-8899",
        transporter: "SafeXpress Logistics",
        notes: "Materials dispatched for entry lane installation"
      });
      setMovementItems([{ sku: prod.sku, name: prod.name, qty: 2 }]);
    } else if (activeTab === "return") {
      setFormData({
        sourceDescription: "Cyber City Tech Park Gate 3",
        receivingWarehouse: wh1,
        receivingWarehouseId: warehouses[0]?.id || 1,
        reason: "Excess material returned from project site",
        notes: "Returned units checked and approved for restocking"
      });
      setMovementItems([{ sku: products[5]?.sku || prod.sku, name: products[5]?.name || prod.name, qty: 2 }]);
    } else if (activeTab === "transfer") {
      setFormData({
        sourceWarehouse: wh1,
        destinationWarehouse: wh2,
        purpose: "Inter-warehouse stock balancing",
        approvedBy: "Store Manager",
        status: "Initiated"
      });
      setMovementItems([{ sku: prod.sku, name: prod.name, qty: 5 }]);
    } else if (activeTab === "adjustment") {
      setFormData({
        warehouseName: wh1,
        warehouseId: warehouses[0]?.id || 1,
        adjustmentType: "Physical Audit Reconciliation",
        reason: "Physical count reconciliation during monthly cycle audit",
        adjustedBy: "Audit Lead"
      });
      setMovementItems([
        { sku: products[3]?.sku || prod.sku, name: products[3]?.name || prod.name, systemQty: 45, physicalQty: 44, diff: -1, reason: "1 damaged in handling" }
      ]);
    }
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (activeTab === "mtn" || activeTab === "transfer") {
      InventoryService.saveMTN({ ...formData, items: movementItems });
    } else if (activeTab === "dc") {
      InventoryService.saveDeliveryChallan({ ...formData, items: movementItems });
    } else if (activeTab === "return") {
      InventoryService.saveMaterialReturn({ ...formData, items: movementItems });
    } else if (activeTab === "adjustment") {
      InventoryService.saveStockAdjustment({ ...formData, items: movementItems });
    }

    loadData();
    setModalOpen(false);
    Swal.fire({
      icon: "success",
      title: "Movement Recorded & Warehouse Stock Updated!",
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-5 w-full pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <span>Inventory ERP</span>
            <span>•</span>
            <span>Logistics & Material Movement</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Material Movement, Transfers & Adjustments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track dispatches to customer sites (Delivery Challans), inter-warehouse transfers, project returns, and physical audit reconciliations.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === "mtn"
              ? "New MTN"
              : activeTab === "dc"
              ? "Create Delivery Challan"
              : activeTab === "return"
              ? "Record Material Return"
              : activeTab === "transfer"
              ? "New Stock Transfer"
              : "New Stock Adjustment"}
          </span>
        </button>
      </div>

      {/* ── TABS (Matches exact items from Screenshot 1 & Screenshot 2) ── */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto no-scrollbar">
        {[
          { id: "mtn", label: "MTN (Transfer Note)", path: "/inventory/mtn", icon: Package },
          { id: "dc", label: "Delivery Challan", path: "/inventory/delivery-challan", icon: Truck },
          { id: "return", label: "Material Return", path: "/inventory/material-return", icon: RotateCcw },
          { id: "transfer", label: "Stock Transfer", path: "/inventory/stock-transfer", icon: ArrowRightLeft },
          { id: "adjustment", label: "Stock Adjustment", path: "/inventory/stock-adjustment", icon: Sliders },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id, tab.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN MOVEMENT TABLE CONTAINER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${activeTab}...`}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {activeTab === "mtn" && `${mtns.length} Material Transfer Notes`}
            {activeTab === "dc" && `${dcs.length} Delivery Challans`}
            {activeTab === "return" && `${returns.length} Restocked Material Returns`}
            {activeTab === "transfer" && `${mtns.length} Inter-warehouse Movements`}
            {activeTab === "adjustment" && `${adjustments.length} Stock Adjustments Recorded`}
          </span>
        </div>

        {/* 1. MTN */}
        {activeTab === "mtn" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">MTN Number</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Source Warehouse</th>
                  <th className="p-3.5">Destination Warehouse</th>
                  <th className="p-3.5">Movement Purpose</th>
                  <th className="p-3.5">Approved By</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mtns.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{m.mtnNumber}</td>
                    <td className="p-3.5 text-slate-500">{m.date}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{m.sourceWarehouse}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{m.destinationWarehouse}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">{m.purpose}</td>
                    <td className="p-3.5 text-slate-700">{m.approvedBy}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. DELIVERY CHALLAN */}
        {activeTab === "dc" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">DC Number</th>
                  <th className="p-3.5">Customer / Client</th>
                  <th className="p-3.5">Project Installation Site</th>
                  <th className="p-3.5">Dispatch Warehouse</th>
                  <th className="p-3.5">Dispatch Date</th>
                  <th className="p-3.5">Vehicle / Transporter</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dcs.map((dc) => (
                  <tr key={dc.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{dc.dcNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{dc.customerName}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{dc.siteName}</td>
                    <td className="p-3.5 text-slate-600">{dc.dispatchWarehouse}</td>
                    <td className="p-3.5 text-slate-500">{dc.dispatchDate}</td>
                    <td className="p-3.5 font-mono text-slate-600">
                      <div>{dc.vehicleNumber}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{dc.transporter}</div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {dc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. MATERIAL RETURN */}
        {activeTab === "return" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Return Number</th>
                  <th className="p-3.5">Source Site / Origin</th>
                  <th className="p-3.5">Receiving Warehouse</th>
                  <th className="p-3.5">Return Date</th>
                  <th className="p-3.5">Reason for Return</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-indigo-700">{ret.returnNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{ret.sourceDescription}</td>
                    <td className="p-3.5 text-slate-600">{ret.receivingWarehouse}</td>
                    <td className="p-3.5 text-slate-500">{ret.returnDate}</td>
                    <td className="p-3.5 text-slate-700 max-w-xs">{ret.reason}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        {ret.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. STOCK TRANSFER */}
        {activeTab === "transfer" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Transfer Code</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">From Location</th>
                  <th className="p-3.5">To Destination</th>
                  <th className="p-3.5">Stock Items Transferred</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mtns.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{tr.mtnNumber}</td>
                    <td className="p-3.5 text-slate-500">{tr.date}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{tr.sourceWarehouse}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{tr.destinationWarehouse}</td>
                    <td className="p-3.5 text-slate-700">
                      {tr.items?.map((it, idx) => (
                        <div key={idx} className="truncate">• {it.qty}x {it.name || it.sku}</div>
                      ))}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {tr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. STOCK ADJUSTMENT */}
        {activeTab === "adjustment" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Adjustment No.</th>
                  <th className="p-3.5">Warehouse Location</th>
                  <th className="p-3.5">Audit Date</th>
                  <th className="p-3.5">Adjustment Reason / Type</th>
                  <th className="p-3.5">Items & Physical Discrepancy</th>
                  <th className="p-3.5">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-purple-700">{adj.adjNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{adj.warehouseName}</td>
                    <td className="p-3.5 text-slate-500">{adj.date}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{adj.adjustmentType}</div>
                      <div className="text-[11px] text-slate-400">{adj.reason}</div>
                    </td>
                    <td className="p-3.5">
                      {adj.items?.map((it, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-semibold">{it.name}: </span>
                          <span>Sys {it.systemQty} → Phys {it.physicalQty} </span>
                          <span className={`font-mono font-bold ${it.diff < 0 ? "text-red-600" : "text-emerald-600"}`}>
                            ({it.diff > 0 ? `+${it.diff}` : it.diff})
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{adj.adjustedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scale-up">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {activeTab === "mtn" && "Create Material Transfer Note"}
              {activeTab === "dc" && "Generate Delivery Challan (Site Dispatch)"}
              {activeTab === "return" && "Record Material Return to Warehouse"}
              {activeTab === "transfer" && "New Warehouse Stock Transfer"}
              {activeTab === "adjustment" && "Record Physical Stock Adjustment"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Delivery Challan Form */}
              {activeTab === "dc" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.customerName || ""}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Site / Project Location *</label>
                      <input
                        type="text"
                        required
                        value={formData.siteName || ""}
                        onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Number</label>
                      <input
                        type="text"
                        value={formData.vehicleNumber || ""}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                        placeholder="MH-12-PQ-8899"
                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Transporter Name</label>
                      <input
                        type="text"
                        value={formData.transporter || ""}
                        onChange={(e) => setFormData({ ...formData, transporter: e.target.value })}
                        placeholder="SafeXpress Logistics"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* MTN / Stock Transfer Form */}
              {(activeTab === "mtn" || activeTab === "transfer") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Source Warehouse *</label>
                      <select
                        value={formData.sourceWarehouse}
                        onChange={(e) => setFormData({ ...formData, sourceWarehouse: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Destination Warehouse *</label>
                      <select
                        value={formData.destinationWarehouse}
                        onChange={(e) => setFormData({ ...formData, destinationWarehouse: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Purpose / Notes</label>
                    <input
                      type="text"
                      value={formData.purpose || ""}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="e.g. Replenishing finished barrier stock"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              {/* Material Return Form */}
              {activeTab === "return" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Origin / Site Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.sourceDescription || ""}
                        onChange={(e) => setFormData({ ...formData, sourceDescription: e.target.value })}
                        placeholder="e.g. Cyber City Tech Park"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Receiving Warehouse</label>
                      <select
                        value={formData.receivingWarehouse}
                        onChange={(e) => setFormData({ ...formData, receivingWarehouse: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Return Reason *</label>
                    <input
                      type="text"
                      required
                      value={formData.reason || ""}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="e.g. Excess material after project commissioning"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              {/* Stock Adjustment Form */}
              {activeTab === "adjustment" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Warehouse *</label>
                      <select
                        value={formData.warehouseName}
                        onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Type *</label>
                      <select
                        value={formData.adjustmentType || "Physical Audit Reconciliation"}
                        onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        <option value="Physical Audit Reconciliation">Physical Audit Reconciliation</option>
                        <option value="Damaged Goods">Damaged Goods</option>
                        <option value="Shortage / Loss">Shortage / Loss</option>
                        <option value="Scrapped / Obsolete">Scrapped / Obsolete</option>
                        <option value="Surplus Found">Surplus Found</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Notes *</label>
                    <input
                      type="text"
                      required
                      value={formData.reason || ""}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Audit reconciliation notes..."
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              {/* Items in Movement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Item Lines to Move</label>
                {movementItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={item.sku}
                        onChange={(e) => {
                          const p = products.find((prod) => prod.sku === e.target.value);
                          const updated = [...movementItems];
                          updated[idx] = { ...updated[idx], sku: p.sku, name: p.name };
                          setMovementItems(updated);
                        }}
                        className="px-2 py-1.5 border rounded-lg text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.qty || 1}
                        onChange={(e) => {
                          const updated = [...movementItems];
                          updated[idx].qty = Number(e.target.value);
                          setMovementItems(updated);
                        }}
                        placeholder="Quantity"
                        className="px-2 py-1.5 border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
                >
                  Record Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
