import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Factory,
  ClipboardList,
  ShoppingCart,
  CheckCircle2,
  Plus,
  Search,
  Check,
  X,
  FileText,
  Truck,
  ArrowRight,
  IndianRupee,
  Calendar,
  AlertCircle
} from "lucide-react";
import Swal from "sweetalert2";
import { InventoryService } from "../../services/inventoryService";

export default function InventoryProcurement() {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (pathname) => {
    if (pathname.includes("grn")) return "grn";
    if (pathname.includes("purchase-orders")) return "pos";
    if (pathname.includes("material-requisitions")) return "requisitions";
    return "vendors";
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [search, setSearch] = useState("");

  const [vendors, setVendors] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [pos, setPos] = useState([]);
  const [grns, setGrns] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [poItems, setPoItems] = useState([]);
  const [grnItems, setGrnItems] = useState([]);
  const [mrItems, setMrItems] = useState([]);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const loadData = () => {
    setVendors(InventoryService.getVendors());
    setRequisitions(InventoryService.getRequisitions());
    setPos(InventoryService.getPurchaseOrders());
    setGrns(InventoryService.getGRNs());
    setProducts(InventoryService.getProducts());
    setWarehouses(InventoryService.getWarehouses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tab, path) => {
    setActiveTab(tab);
    setSearch("");
    navigate(path);
  };

  // Open Create Modal
  const openCreateModal = () => {
    if (activeTab === "vendors") {
      setFormData({
        name: "",
        code: `VEN-00${vendors.length + 1}`,
        gstin: "",
        contactPerson: "",
        email: "",
        phone: "",
        city: "Pune",
        state: "Maharashtra",
        paymentTerms: "Net 30 Days",
        rating: 4.8,
        status: "Active"
      });
    } else if (activeTab === "requisitions") {
      setFormData({
        requestedBy: "Pravin Dare (Project Lead)",
        departmentProject: "South Plaza Parking Automation",
        requiredDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        priority: "High",
        purpose: "Urgent material required for client installation"
      });
      setMrItems([
        { sku: products[2]?.sku || "CMP-BARRIER-CABINET", name: products[2]?.name, qty: 2, notes: "" }
      ]);
    } else if (activeTab === "pos") {
      const v = vendors[0];
      const wh = warehouses[0];
      setFormData({
        vendorId: v?.id || 1,
        vendorName: v?.name || "",
        warehouseId: wh?.id || 1,
        warehouseName: wh?.name || "",
        expectedDate: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
        notes: "Standard purchase order terms apply."
      });
      setPoItems([
        {
          sku: products[2]?.sku || "CMP-BARRIER-CABINET",
          name: products[2]?.name || "Barrier Cabinet",
          orderedQty: 5,
          unitPrice: products[2]?.costPrice || 9500,
          taxRate: 18
        }
      ]);
    } else if (activeTab === "grn") {
      const openPo = pos.find((p) => p.status !== "Completed") || pos[0];
      setFormData({
        poNumber: openPo ? openPo.poNumber : "",
        vendorName: openPo ? openPo.vendorName : vendors[0]?.name,
        warehouseId: openPo ? openPo.warehouseId : 1,
        warehouseName: openPo ? openPo.warehouseName : warehouses[0]?.name,
        challanNo: `INV-V-${Math.floor(1000 + Math.random() * 9000)}`,
        receivedBy: "Warehouse Stores Team",
        notes: "Inspected and verified goods on dock."
      });
      if (openPo && openPo.items) {
        setGrnItems(openPo.items.map((i) => ({
          sku: i.sku,
          name: i.name,
          receivedQty: i.orderedQty,
          acceptedQty: i.orderedQty,
          rejectedQty: 0,
          remarks: "OK - Quality Checked"
        })));
      } else {
        setGrnItems([
          {
            sku: products[2]?.sku || "CMP-BARRIER-CABINET",
            name: products[2]?.name || "Barrier Cabinet",
            receivedQty: 5,
            acceptedQty: 5,
            rejectedQty: 0,
            remarks: "Passed Inspection"
          }
        ]);
      }
    }
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (activeTab === "vendors") {
      InventoryService.saveVendor(formData);
    } else if (activeTab === "requisitions") {
      InventoryService.saveRequisition({ ...formData, items: mrItems });
    } else if (activeTab === "pos") {
      const subtotal = poItems.reduce((sum, item) => sum + (Number(item.orderedQty) || 0) * (Number(item.unitPrice) || 0), 0);
      const tax = subtotal * 0.18;
      const total = subtotal + tax;
      InventoryService.savePurchaseOrder({
        ...formData,
        subtotal,
        tax,
        total,
        items: poItems
      });
    } else if (activeTab === "grn") {
      InventoryService.saveGRN({
        ...formData,
        items: grnItems
      });
    }

    loadData();
    setModalOpen(false);
    Swal.fire({
      icon: "success",
      title: activeTab === "grn" ? "GRN Received & Warehouse Stock Increased!" : "Procurement Record Saved!",
      timer: 1600,
      showConfirmButton: false
    });
  };

  // Convert Requisition to PO
  const handleApproveMR = (mrId) => {
    InventoryService.updateRequisitionStatus(mrId, "Approved");
    loadData();
    Swal.fire("Approved!", "Material Requisition approved for purchasing.", "success");
  };

  // Quick 1-Click Receive GRN from PO
  const handleReceiveFromPO = (po) => {
    setActiveTab("grn");
    navigate("/inventory/grn");
    setFormData({
      poNumber: po.poNumber,
      vendorName: po.vendorName,
      warehouseId: po.warehouseId || 1,
      warehouseName: po.warehouseName || warehouses[0]?.name,
      challanNo: `CHALLAN-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedBy: "Dock Storekeeper",
      notes: `Goods received against Purchase Order ${po.poNumber}`
    });
    setGrnItems(po.items.map((it) => ({
      sku: it.sku,
      name: it.name,
      receivedQty: it.orderedQty,
      acceptedQty: it.orderedQty,
      rejectedQty: 0,
      remarks: "Received in Good Condition"
    })));
    setModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-5 w-full pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <span>Inventory ERP</span>
            <span>•</span>
            <span>Procurement Lifecycle</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Material Purchasing & Goods Receipt (GRN)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            <b>Typical Flow:</b> Vendor → Purchase Order (PO) → Goods Receipt Note (GRN) → Warehouse stock increases automatically.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === "vendors"
              ? "New Vendor"
              : activeTab === "requisitions"
              ? "New Material Request"
              : activeTab === "pos"
              ? "Create Purchase Order"
              : "Generate GRN"}
          </span>
        </button>
      </div>

      {/* ── TAB BUTTONS (Directly matching Screenshot 1: Vendors, Material Requisition, Purchase Orders, GRN) ── */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto no-scrollbar">
        {[
          { id: "vendors", label: "Vendors", path: "/inventory/vendors", icon: Factory },
          { id: "requisitions", label: "Material Requisition", path: "/inventory/material-requisitions", icon: ClipboardList },
          { id: "pos", label: "Purchase Orders", path: "/inventory/purchase-orders", icon: ShoppingCart },
          { id: "grn", label: "GRN (Goods Receipt)", path: "/inventory/grn", icon: CheckCircle2 },
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

      {/* ── PROCUREMENT CONTENT TABLE ── */}
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
            {activeTab === "vendors" && `${vendors.length} Registered Suppliers`}
            {activeTab === "requisitions" && `${requisitions.length} Requisitions`}
            {activeTab === "pos" && `${pos.length} Purchase Orders`}
            {activeTab === "grn" && `${grns.length} Verified Receipts`}
          </span>
        </div>

        {/* 1. VENDORS */}
        {activeTab === "vendors" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Vendor Code</th>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">GSTIN</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5">Phone / Email</th>
                  <th className="p-3.5">Payment Terms</th>
                  <th className="p-3.5 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{v.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">{v.name}</td>
                    <td className="p-3.5 font-mono text-slate-600">{v.gstin || "—"}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{v.contactPerson}</td>
                    <td className="p-3.5 text-slate-500">
                      <div>{v.phone}</div>
                      <div className="text-[11px] text-blue-600">{v.email}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{v.paymentTerms}</td>
                    <td className="p-3.5 text-center font-bold text-amber-600">★ {v.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. MATERIAL REQUISITION */}
        {activeTab === "requisitions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">MR Number</th>
                  <th className="p-3.5">Requested By</th>
                  <th className="p-3.5">Department / Site Project</th>
                  <th className="p-3.5">Required Date</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Items Required</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requisitions.map((mr) => (
                  <tr key={mr.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-indigo-700">{mr.mrNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{mr.requestedBy}</td>
                    <td className="p-3.5 text-slate-700">{mr.departmentProject}</td>
                    <td className="p-3.5 text-slate-500">{mr.requiredDate}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        mr.priority === "Urgent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {mr.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {mr.items?.map((it, idx) => (
                        <div key={idx} className="truncate max-w-xs">• {it.qty}x {it.name || it.sku}</div>
                      ))}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        mr.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {mr.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {mr.status === "Pending" ? (
                        <button
                          onClick={() => handleApproveMR(mr.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition"
                        >
                          Approve MR
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. PURCHASE ORDERS */}
        {activeTab === "pos" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">PO Number</th>
                  <th className="p-3.5">Vendor</th>
                  <th className="p-3.5">Delivery Warehouse</th>
                  <th className="p-3.5">Order Date</th>
                  <th className="p-3.5">Expected Delivery</th>
                  <th className="p-3.5 text-right">Total Amount (₹)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pos.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{po.poNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{po.vendorName}</td>
                    <td className="p-3.5 text-slate-600">{po.warehouseName}</td>
                    <td className="p-3.5 text-slate-500">{po.orderDate}</td>
                    <td className="p-3.5 text-slate-500">{po.expectedDate}</td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">
                      ₹ {Number(po.total).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        po.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {po.status !== "Completed" && (
                        <button
                          onClick={() => handleReceiveFromPO(po)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 transition"
                        >
                          Receive GRN ➔
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. GRN (GOODS RECEIPT NOTE) */}
        {activeTab === "grn" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">GRN Number</th>
                  <th className="p-3.5">PO Ref</th>
                  <th className="p-3.5">Vendor</th>
                  <th className="p-3.5">Receiving Warehouse</th>
                  <th className="p-3.5">Received Date</th>
                  <th className="p-3.5">Challan / Invoice No</th>
                  <th className="p-3.5">Received By</th>
                  <th className="p-3.5 text-center">Stock Effect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grns.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-indigo-700">{g.grnNumber}</td>
                    <td className="p-3.5 font-mono text-slate-600">{g.poNumber || "Direct"}</td>
                    <td className="p-3.5 font-bold text-slate-900">{g.vendorName}</td>
                    <td className="p-3.5 text-slate-700 font-semibold">{g.warehouseName}</td>
                    <td className="p-3.5 text-slate-500">{g.receivedDate}</td>
                    <td className="p-3.5 font-mono text-slate-600">{g.challanNo}</td>
                    <td className="p-3.5 text-slate-600">{g.receivedBy}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Stock Added
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL FOR PROCUREMENT OPERATIONS ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {activeTab === "vendors" && "Add New Supplier / Vendor"}
              {activeTab === "requisitions" && "Create Material Requisition"}
              {activeTab === "pos" && "Create Purchase Order (PO)"}
              {activeTab === "grn" && "Generate Goods Receipt Note (GRN)"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Vendor Form */}
              {activeTab === "vendors" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company / Vendor Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Magnetix Drive Systems"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Vendor Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border rounded-xl text-xs uppercase font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                      <input
                        type="text"
                        value={formData.gstin || ""}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        placeholder="27AABCM8821Q1ZV"
                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={formData.contactPerson || ""}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="e.g. Sanjay Verma"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 99201 55432"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="sales@vendor.com"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Purchase Order Form */}
              {activeTab === "pos" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Vendor *</label>
                      <select
                        value={formData.vendorId}
                        onChange={(e) => {
                          const v = vendors.find((v) => v.id === Number(e.target.value));
                          setFormData({ ...formData, vendorId: v.id, vendorName: v.name });
                        }}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Receiving Warehouse *</label>
                      <select
                        value={formData.warehouseId}
                        onChange={(e) => {
                          const wh = warehouses.find((w) => w.id === Number(e.target.value));
                          setFormData({ ...formData, warehouseId: wh.id, warehouseName: wh.name });
                        }}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PO Line Items */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">PO Component Line Items</label>
                    {poItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mb-2">
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={item.sku}
                            onChange={(e) => {
                              const p = products.find((prod) => prod.sku === e.target.value);
                              const updated = [...poItems];
                              updated[idx] = { ...updated[idx], sku: p.sku, name: p.name, unitPrice: p.costPrice };
                              setPoItems(updated);
                            }}
                            className="px-2 py-1.5 border rounded-lg text-xs"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              value={item.orderedQty}
                              onChange={(e) => {
                                const updated = [...poItems];
                                updated[idx].orderedQty = Number(e.target.value);
                                setPoItems(updated);
                              }}
                              placeholder="Qty"
                              className="w-20 px-2 py-1.5 border rounded-lg text-xs"
                            />
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const updated = [...poItems];
                                updated[idx].unitPrice = Number(e.target.value);
                                setPoItems(updated);
                              }}
                              placeholder="Rate"
                              className="w-28 px-2 py-1.5 border rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* GRN Form */}
              {activeTab === "grn" && (
                <>
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-800 mb-2">
                    <b>Stock Effect:</b> Confirming this GRN will automatically increment available warehouse stock!
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">PO Reference</label>
                      <input
                        type="text"
                        value={formData.poNumber || ""}
                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Vendor Invoice / Challan No *</label>
                      <input
                        type="text"
                        required
                        value={formData.challanNo || ""}
                        onChange={(e) => setFormData({ ...formData, challanNo: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Receiving Warehouse *</label>
                    <select
                      value={formData.warehouseId}
                      onChange={(e) => {
                        const wh = warehouses.find((w) => w.id === Number(e.target.value));
                        setFormData({ ...formData, warehouseId: wh.id, warehouseName: wh.name });
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* GRN items verification */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Received Goods Verification</label>
                    {grnItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mb-2">
                        <div className="font-bold text-xs text-slate-900">{item.name} ({item.sku})</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Received Qty</span>
                            <input
                              type="number"
                              value={item.receivedQty}
                              onChange={(e) => {
                                const updated = [...grnItems];
                                updated[idx].receivedQty = Number(e.target.value);
                                updated[idx].acceptedQty = Number(e.target.value);
                                setGrnItems(updated);
                              }}
                              className="w-full px-2 py-1 border rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-600 font-bold block">Accepted Qty</span>
                            <input
                              type="number"
                              value={item.acceptedQty}
                              onChange={(e) => {
                                const updated = [...grnItems];
                                updated[idx].acceptedQty = Number(e.target.value);
                                setGrnItems(updated);
                              }}
                              className="w-full px-2 py-1 border rounded-lg text-xs border-emerald-300 bg-emerald-50/50"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-red-500 block">Rejected Qty</span>
                            <input
                              type="number"
                              value={item.rejectedQty || 0}
                              onChange={(e) => {
                                const updated = [...grnItems];
                                updated[idx].rejectedQty = Number(e.target.value);
                                setGrnItems(updated);
                              }}
                              className="w-full px-2 py-1 border rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Material Requisition Form */}
              {activeTab === "requisitions" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Requested By *</label>
                      <input
                        type="text"
                        required
                        value={formData.requestedBy || ""}
                        onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Project Site / Dept *</label>
                      <input
                        type="text"
                        required
                        value={formData.departmentProject || ""}
                        onChange={(e) => setFormData({ ...formData, departmentProject: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Required Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.requiredDate || ""}
                        onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                      <select
                        value={formData.priority || "High"}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Purpose / Notes</label>
                    <textarea
                      rows={2}
                      value={formData.purpose || ""}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

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
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
