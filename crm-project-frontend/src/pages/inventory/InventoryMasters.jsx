import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Tag,
  Scale,
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  AlertCircle,
  BarChart3
} from "lucide-react";
import Swal from "sweetalert2";
import { InventoryService } from "../../services/inventoryService";

export default function InventoryMasters() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const getTabFromPath = (pathname) => {
    if (pathname.includes("sub-categories")) return "subcategories";
    if (pathname.includes("categories")) return "categories";
    if (pathname.includes("brands")) return "brands";
    if (pathname.includes("uom")) return "uom";
    if (pathname.includes("warehouses")) return "warehouses";
    return "products";
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [search, setSearch] = useState("");

  // Master Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const loadData = () => {
    setProducts(InventoryService.getProducts());
    setCategories(InventoryService.getCategories());
    setSubCategories(InventoryService.getSubCategories());
    setBrands(InventoryService.getBrands());
    setUoms(InventoryService.getUOMs());
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

  // Open Add / Edit Modal
  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      // Default empty form state per tab
      if (activeTab === "categories") {
        setFormData({ name: "", code: "", description: "", status: "Active" });
      } else if (activeTab === "subcategories") {
        setFormData({ name: "", code: "", categoryId: categories[0]?.id || 1, description: "" });
      } else if (activeTab === "brands") {
        setFormData({ name: "", code: "", country: "India", website: "", status: "Active" });
      } else if (activeTab === "uom") {
        setFormData({ name: "", code: "", precision: 0, status: "Active" });
      } else if (activeTab === "warehouses") {
        setFormData({ name: "", code: "", city: "", state: "Maharashtra", address: "", manager: "", phone: "", isPrimary: false, status: "Active" });
      } else {
        // Products
        setFormData({
          name: "",
          sku: "",
          itemType: "component",
          category: categories[0]?.name || "Barriers & Access Hardware",
          subCategory: "Barrier Cabinets",
          brand: brands[0]?.name || "NNIT Core Systems",
          uom: "PCS",
          costPrice: 0,
          sellingPrice: 0,
          minStock: 5,
          reorderQty: 10,
          description: ""
        });
      }
    }
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (activeTab === "categories") {
      InventoryService.saveCategory(formData);
    } else if (activeTab === "subcategories") {
      InventoryService.saveSubCategory(formData);
    } else if (activeTab === "brands") {
      InventoryService.saveBrand(formData);
    } else if (activeTab === "uom") {
      InventoryService.saveUOM(formData);
    } else if (activeTab === "warehouses") {
      InventoryService.saveWarehouse(formData);
    } else {
      InventoryService.saveProduct(formData);
    }

    loadData();
    setModalOpen(false);
    Swal.fire({
      icon: "success",
      title: "Saved Successfully!",
      timer: 1400,
      showConfirmButton: false
    });
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete "${name}" from master database?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it"
    }).then((result) => {
      if (result.isConfirmed) {
        if (activeTab === "categories") InventoryService.deleteCategory(id);
        else if (activeTab === "subcategories") InventoryService.deleteSubCategory(id);
        else if (activeTab === "brands") InventoryService.deleteBrand(id);
        else if (activeTab === "uom") InventoryService.deleteUOM(id);
        else if (activeTab === "warehouses") InventoryService.deleteWarehouse(id);
        else InventoryService.deleteProduct(id);

        loadData();
        Swal.fire("Deleted!", "Record has been removed.", "success");
      }
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
            <span>Master Configurations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory Foundation Masters
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure items, classification categories, brands, units of measurement, and multi-location warehouses.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === "categories"
              ? "Add Category"
              : activeTab === "subcategories"
              ? "Add Sub Category"
              : activeTab === "brands"
              ? "Add Brand"
              : activeTab === "uom"
              ? "Add UOM"
              : activeTab === "warehouses"
              ? "Add Warehouse"
              : "Add Product"}
          </span>
        </button>
      </div>

      {/* ── MASTER TABS (Directly matches the screenshot menu items) ── */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto no-scrollbar">
        {[
          { id: "products", label: "Products", path: "/inventory/products", icon: Box },
          { id: "categories", label: "Categories", path: "/inventory/categories", icon: Tag },
          { id: "subcategories", label: "Sub Categories", path: "/inventory/sub-categories", icon: Tag },
          { id: "brands", label: "Brands", path: "/inventory/brands", icon: Tag },
          { id: "uom", label: "Units / UOM", path: "/inventory/uom", icon: Scale },
          { id: "warehouses", label: "Warehouses", path: "/inventory/warehouses", icon: WarehouseIcon },
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

      {/* ── SEARCH & TABLE CONTAINER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${activeTab}...`}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center">
            {activeTab === "products" && (
              <Link
                to="/inventory/reports/product-price-comparison"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200/60"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Price Comparison & Trends</span>
              </Link>
            )}
            <span className="text-xs font-semibold text-slate-400">
              {activeTab === "products" && `${products.length} Products`}
              {activeTab === "categories" && `${categories.length} Categories`}
              {activeTab === "subcategories" && `${subCategories.length} Sub Categories`}
              {activeTab === "brands" && `${brands.length} Brands`}
              {activeTab === "uom" && `${uoms.length} Units`}
              {activeTab === "warehouses" && `${warehouses.length} Storage Locations`}
            </span>
          </div>
        </div>

        {/* ── TAB 1: CATEGORIES (Selected in Screenshot 1!) ── */}
        {activeTab === "categories" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-center">Subcategories</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories
                  .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
                  .map((cat) => {
                    const subCount = subCategories.filter((s) => s.categoryId === cat.id).length;
                    return (
                      <tr key={cat.id} className="hover:bg-blue-50/30 transition">
                        <td className="p-3.5 font-mono font-bold text-blue-700">{cat.code}</td>
                        <td className="p-3.5 font-bold text-slate-900">{cat.name}</td>
                        <td className="p-3.5 text-slate-500 max-w-xs truncate">{cat.description || "—"}</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {subCount} Subcats
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {cat.status || "Active"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => openModal(cat)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 2: PRODUCTS ── */}
        {activeTab === "products" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">SKU Code</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">UOM</th>
                  <th className="p-3.5 text-right">Cost Price (₹)</th>
                  <th className="p-3.5 text-right">Selling Price (₹)</th>
                  <th className="p-3.5 text-center">Available Stock</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products
                  .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
                  .map((prod) => {
                    const totalAvail = Object.values(prod.stocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900">{prod.sku}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{prod.name}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            prod.itemType === "finished_product"
                              ? "bg-purple-100 text-purple-700"
                              : prod.itemType === "component"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {prod.itemType?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{prod.category}</td>
                        <td className="p-3.5 font-bold text-slate-500">{prod.uom}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-700">₹ {Number(prod.costPrice).toLocaleString()}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600">₹ {Number(prod.sellingPrice).toLocaleString()}</td>
                        <td className="p-3.5 text-center font-extrabold text-slate-900">{totalAvail}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => openModal(prod)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 3: SUB CATEGORIES ── */}
        {activeTab === "subcategories" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Sub Category Name</th>
                  <th className="p-3.5">Parent Category</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subCategories
                  .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
                  .map((sub) => {
                    const parent = categories.find((c) => c.id === sub.categoryId)?.name || "Barriers & Access Hardware";
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-bold text-blue-700">{sub.code}</td>
                        <td className="p-3.5 font-bold text-slate-900">{sub.name}</td>
                        <td className="p-3.5 text-slate-700 font-semibold">{parent}</td>
                        <td className="p-3.5 text-slate-500">{sub.description || "—"}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => openModal(sub)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id, sub.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 4: BRANDS ── */}
        {activeTab === "brands" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Brand Code</th>
                  <th className="p-3.5">Brand Name</th>
                  <th className="p-3.5">Country of Origin</th>
                  <th className="p-3.5">Website</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{b.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">{b.name}</td>
                    <td className="p-3.5 text-slate-600">{b.country}</td>
                    <td className="p-3.5 text-blue-600 hover:underline">{b.website || "—"}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => openModal(b)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 5: UNITS / UOM ── */}
        {activeTab === "uom" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Unit Symbol / Code</th>
                  <th className="p-3.5">Unit Name</th>
                  <th className="p-3.5 text-center">Decimal Precision</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uoms.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{u.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3.5 text-center font-mono">{u.precision} decimals</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => openModal(u)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB 6: WAREHOUSES ── */}
        {activeTab === "warehouses" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Warehouse Name</th>
                  <th className="p-3.5">Location / City</th>
                  <th className="p-3.5">Facility Manager</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5 text-center">Primary</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{wh.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">{wh.name}</td>
                    <td className="p-3.5 text-slate-600">{wh.city}, {wh.state}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{wh.manager}</td>
                    <td className="p-3.5 font-mono text-slate-600">{wh.phone}</td>
                    <td className="p-3.5 text-center">
                      {wh.isPrimary ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                          Primary Plant
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => openModal(wh)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(wh.id, wh.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT MASTER MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scale-up">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingItem ? "Edit" : "Add New"}{" "}
              {activeTab === "categories"
                ? "Category"
                : activeTab === "subcategories"
                ? "Sub Category"
                : activeTab === "brands"
                ? "Brand"
                : activeTab === "uom"
                ? "Unit of Measure"
                : activeTab === "warehouses"
                ? "Warehouse"
                : "Product"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category form fields */}
              {activeTab === "categories" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Barriers & Access Hardware"
                      className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code || ""}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. BARRIERS"
                      className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-blue-500 uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief category scope..."
                      className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Product form fields */}
              {activeTab === "products" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Item Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.sku || ""}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        placeholder="e.g. NNIT-ABB-PRO4"
                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Item Type *</label>
                      <select
                        value={formData.itemType || "component"}
                        onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        <option value="finished_product">Finished Product</option>
                        <option value="component">Component</option>
                        <option value="spare_part">Spare Part</option>
                        <option value="consumable">Consumable</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Automatic Boom Barrier Pro 4M"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={formData.category || categories[0]?.name}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">UOM</label>
                      <select
                        value={formData.uom || "PCS"}
                        onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        {uoms.map((u) => (
                          <option key={u.id} value={u.code}>{u.name} ({u.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={formData.costPrice || 0}
                        onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                      <input
                        type="number"
                        value={formData.sellingPrice || 0}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Min Safety Level</label>
                      <input
                        type="number"
                        value={formData.minStock || 5}
                        onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
                      <select
                        value={formData.brand || brands[0]?.name}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Warehouse form fields */}
              {activeTab === "warehouses" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. WH-PUN"
                        className="w-full px-3 py-2 border rounded-xl text-xs uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Pune"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Warehouse Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Central Assembly Plant - Pune"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Manager Name</label>
                      <input
                        type="text"
                        value={formData.manager || ""}
                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                        placeholder="e.g. Rajesh Sharma"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98220 11223"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* UOM form fields */}
              {activeTab === "uom" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Unit Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Pieces"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Symbol / Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. PCS"
                        className="w-full px-3 py-2 border rounded-xl text-xs uppercase font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Brand form fields */}
              {activeTab === "brands" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Code</label>
                      <input
                        type="text"
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. MDS"
                        className="w-full px-3 py-2 border rounded-xl text-xs uppercase font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Sub category form fields */}
              {activeTab === "subcategories" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Barrier Cabinets"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code || ""}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. BCAB"
                      className="w-full px-3 py-2 border rounded-xl text-xs uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Category</label>
                    <select
                      value={formData.categoryId || categories[0]?.id}
                      onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Action buttons */}
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
                  Save Master Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
