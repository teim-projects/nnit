import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  GitBranch,
  PlusSquare,
  Search,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Box,
  Trash2,
  Edit2,
  Copy,
  Printer,
  IndianRupee,
  ShoppingCart,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Clock,
  Cpu,
  FileText,
  Eye,
  LayoutGrid,
  List,
  Sparkles,
  Tag,
  History,
  ArrowUpRight
} from "lucide-react";
import Swal from "sweetalert2";
import { InventoryService } from "../../services/inventoryService";

// ── Version Badge Component (Matches Quotation styling) ──
function VersionBadge({ versionNo, isLatest }) {
  const num = versionNo?.split("-R")?.pop()?.replace(/^v/i, "") ?? versionNo;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
        isLatest
          ? "bg-green-100 text-green-700 border border-green-300"
          : "bg-slate-100 text-slate-500 border border-slate-200"
      }`}
    >
      V{num}
      {isLatest && (
        <span className="ml-0.5 text-[9px] bg-green-600 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
          Latest
        </span>
      )}
    </span>
  );
}



// Preset Quick Templates for 1-Click Load
const PRESET_TEMPLATES = [
  {
    id: "boom_4m",
    name: "Automatic Boom Barrier Pro 4M Assembly",
    finishedProductSku: "NNIT-ABB-PRO4",
    finishedProductName: "Automatic Boom Barrier Pro 4M (Finished)",
    category: "Barriers & Access Hardware",
    laborCost: 1500,
    notes: "Production bill of materials for standard 4-meter parking boom barrier system.",
    components: [
      { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
      { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
      { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
      { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
      { sku: "SPR-REMOTE-SET-433", name: "Wireless Remote Control Set", qty: 1, uom: "SET", unitCost: 650 },
      { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 },
      { sku: "SPR-BAL-SPRING-5MM", name: "Barrier Balancing Spring 5.0mm", qty: 1, uom: "PCS", unitCost: 450 }
    ]
  },
  {
    id: "fastag",
    name: "Fastag Integrated Boom Barrier Kit Assembly",
    finishedProductSku: "NNIT-ABB-FASTAG",
    finishedProductName: "Fastag Integrated Boom Barrier Kit (Finished)",
    category: "RFID & Fastag Tech",
    laborCost: 2800,
    notes: "Fastag toll & commercial mall express entrance lane package.",
    components: [
      { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
      { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
      { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
      { sku: "CMP-UHF-RFID-12DBI", name: "12dBi Long Range UHF RFID Reader", qty: 1, uom: "PCS", unitCost: 14500 },
      { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
      { sku: "DSP-TRAFFIC-LIGHT-200", name: "LED Traffic Signal Light (Red/Green)", qty: 1, uom: "PCS", unitCost: 3100 },
      { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 }
    ]
  },
  {
    id: "solar",
    name: "Solar Powered Smart Boom Barrier with DC Backup",
    finishedProductSku: "NNIT-ABB-PRO4",
    finishedProductName: "Automatic Boom Barrier Pro 4M (Finished)",
    category: "Green Energy & Solar",
    laborCost: 2200,
    notes: "Remote or highway perimeter installation with zero grid power requirement.",
    components: [
      { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
      { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
      { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
      { sku: "PRD-00013", name: "Solar Panel 100W 12V Monocrystalline", qty: 2, uom: "PCS", unitCost: 4200 },
      { sku: "PRD-00014", name: "12V 26Ah Sealed Lead Acid Battery", qty: 2, uom: "NOS", unitCost: 3100 },
      { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 1, uom: "PCS", unitCost: 1850 },
      { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 }
    ]
  },
  {
    id: "flap",
    name: "Pedestrian Optical Flap Barrier Turnstile Core",
    finishedProductSku: "PRD-00015",
    finishedProductName: "Flap Barrier Mechanism Core Module",
    category: "Pedestrian Access",
    laborCost: 3500,
    notes: "High-throughput building lobby and metro entrance optical flap barrier.",
    components: [
      { sku: "PRD-00015", name: "Flap Barrier Mechanism Core Module", qty: 1, uom: "SET", unitCost: 18500 },
      { sku: "PRD-00016", name: "Access Control QR / Card Reader Terminal", qty: 2, uom: "PCS", unitCost: 6500 },
      { sku: "PRD-00011", name: "Electrical Control Panel 32A 415V 4-Way", qty: 1, uom: "NOS", unitCost: 8200 },
      { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 3, uom: "SET", unitCost: 1200 },
      { sku: "PRD-00006", name: "Proximity Sensor 12V DC NPN NO", qty: 2, uom: "NOS", unitCost: 850 }
    ]
  }
];

export default function BOMManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const isCreatePath = location.pathname.includes("create");
  const [activeTab, setActiveTab] = useState(isCreatePath ? "create" : "list");

  useEffect(() => {
    setActiveTab(location.pathname.includes("create") ? "create" : "list");
  }, [location.pathname]);

  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Search, Filter & View Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [feasibilityFilter, setFeasibilityFilter] = useState("all"); // 'all' | 'ready' | 'shortage'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Pagination for BOM List
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Availability / Shortage Simulation Modal
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [unitsToProduce, setUnitsToProduce] = useState(5);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [availabilityReport, setAvailabilityReport] = useState(null);

  // Spec Sheet View / Print Modal
  const [specSheetBOM, setSpecSheetBOM] = useState(null);

  // Revision History Log Modal (Matches ProductPriceComparison / user screenshot)
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeHistoryBOM, setActiveHistoryBOM] = useState(null);

  const openHistoryModal = (bom) => {
    setActiveHistoryBOM(bom);
    setHistoryModalOpen(true);
  };

  const getLatestVersion = (b) => (b?.versions || []).find((v) => v.is_active) || b?.versions?.[0];
  const getOldVersions = (b) => (b?.versions || []).filter((v) => !v.is_active).sort((a, b) => (b.id || 0) - (a.id || 0));

  const getBOMTimelineRevisions = (bom) => {
    if (!bom) return [];
    let list = [];
    if (Array.isArray(bom.versions) && bom.versions.length > 0) {
      list = [...bom.versions];
    } else {
      const matCost = (bom.components || []).reduce(
        (acc, c) => acc + (Number(c.qty) || 0) * (Number(c.unitCost) || 0),
        0
      );
      list = [
        {
          id: bom.id || 1,
          versionNo: bom.version || "V1",
          is_active: true,
          createdAt: bom.createdAt || "2026-08-01",
          changedBy: "Engineering Team",
          changeReason: "Initial baseline recipe release",
          laborCost: Number(bom.laborCost) || 0,
          materialCost: matCost,
          totalCost: matCost + (Number(bom.laborCost) || 0),
          componentsCount: bom.components?.length || 0,
          components: bom.components || []
        }
      ];
    }

    // Sort chronologically (oldest first: V1 -> V2 -> V3)
    const parseVer = (v) => {
      if (!v) return 0;
      const m = String(v).match(/v?(\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    };

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime() || 0;
      const timeB = new Date(b.createdAt || 0).getTime() || 0;
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      const va = parseVer(a.versionNo);
      const vb = parseVer(b.versionNo);
      if (va !== vb) return va - vb;
      return (a.id || 0) - (b.id || 0);
    });

    return list.map((rev, idx, arr) => {
      const prev = idx > 0 ? arr[idx - 1] : rev;
      const comps = rev.components && rev.components.length > 0 ? rev.components : (bom.components || []);
      const matCost = rev.materialCost || comps.reduce((acc, c) => acc + (Number(c.qty) || 0) * (Number(c.unitCost) || 0), 0);
      const labCost = Number(rev.laborCost) || Number(bom.laborCost) || 0;
      const newCost = rev.totalCost || (matCost + labCost);

      const prevComps = prev.components && prev.components.length > 0 ? prev.components : comps;
      const prevMatCost = prev.materialCost || prevComps.reduce((acc, c) => acc + (Number(c.qty) || 0) * (Number(c.unitCost) || 0), 0);
      const prevLabCost = Number(prev.laborCost) || labCost;
      const oldCost = idx === 0 ? newCost : (prev.totalCost || (prevMatCost + prevLabCost));

      const changeAmount = idx === 0 ? 0 : newCost - oldCost;
      const changePercent = oldCost > 0 ? ((changeAmount / oldCost) * 100).toFixed(2) : "0.00";
      const isCurrent = idx === arr.length - 1;

      return {
        ...rev,
        revNo: idx + 1,
        oldCost,
        newCost,
        materialCost: matCost,
        laborCost: labCost,
        changeAmount,
        changePercent,
        isCurrent,
        components: comps
      };
    });
  };

  // Create / Edit Modal (matching other inventory pages)
  const [modalOpen, setModalOpen] = useState(false);

  // Form State (used for both the Page View and Modal View)
  const [editingBomId, setEditingBomId] = useState(null);
  const [bomForm, setBomForm] = useState({
    bomNumber: `BOM-ABB-${Math.floor(100 + Math.random() * 900)}`,
    name: "Automatic Boom Barrier Pro 4M Assembly",
    finishedProductSku: "NNIT-ABB-PRO4",
    finishedProductName: "Automatic Boom Barrier Pro 4M (Finished)",
    category: "Barriers & Access Hardware",
    laborCost: 1500,
    notes: "Production bill of materials for parking boom barrier system.",
    changeReason: ""
  });

  const [bomLines, setBomLines] = useState([
    { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
    { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
    { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
    { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
    { sku: "SPR-REMOTE-SET-433", name: "Wireless Remote Control Set", qty: 1, uom: "SET", unitCost: 650 },
    { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 },
    { sku: "SPR-BAL-SPRING-5MM", name: "Barrier Balancing Spring 5.0mm", qty: 1, uom: "PCS", unitCost: 450 }
  ]);

  const loadData = () => {
    setBoms(InventoryService.getBOMs());
    setProducts(InventoryService.getProducts());
    setWarehouses(InventoryService.getWarehouses());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live available stock for any SKU
  const getProductAvailableStock = (sku) => {
    const prod = products.find((p) => p.sku === sku);
    if (!prod || !prod.stocks) return 0;
    const totalOnHand = Object.values(prod.stocks).reduce((sum, v) => sum + (Number(v) || 0), 0);
    const totalRes = prod.reserved ? Object.values(prod.reserved).reduce((sum, v) => sum + (Number(v) || 0), 0) : 0;
    return Math.max(0, totalOnHand - totalRes);
  };

  // Recalculate batch feasibility when modal parameters change
  useEffect(() => {
    if (selectedBOM) {
      const rep = InventoryService.checkBOMAvailability(
        selectedBOM.id,
        unitsToProduce,
        selectedWarehouse ? Number(selectedWarehouse) : null
      );
      setAvailabilityReport(rep);
    }
  }, [selectedBOM, unitsToProduce, selectedWarehouse]);

  // Open Availability Simulation Modal
  const openAvailabilityCheck = (bom) => {
    setSelectedBOM(bom);
    setUnitsToProduce(5);
    setSelectedWarehouse("");
    const rep = InventoryService.checkBOMAvailability(bom.id, 5, null);
    setAvailabilityReport(rep);
  };

  // Open Spec Sheet View / Print Modal
  const openSpecSheet = (bom) => {
    setSpecSheetBOM(bom);
  };

  // Open Create / Edit Modal
  const openCreateModal = (existingBom = null) => {
    if (existingBom) {
      setEditingBomId(existingBom.id);
      setBomForm({
        id: existingBom.id,
        bomNumber: existingBom.bomNumber,
        name: existingBom.name,
        finishedProductSku: existingBom.finishedProductSku,
        finishedProductName: existingBom.finishedProductName,
        category: existingBom.category || "Barriers & Access Hardware",
        laborCost: Number(existingBom.laborCost) || 1500,
        notes: existingBom.notes || "",
        changeReason: ""
      });
      setBomLines(
        (existingBom.components || []).map((c) => ({
          ...c,
          unitCost: Number(c.unitCost) || 0
        }))
      );
    } else {
      setEditingBomId(null);
      const defaultProd = products.find((p) => p.itemType === "finished_product") || products[0];
      setBomForm({
        bomNumber: `BOM-ABB-${Math.floor(100 + Math.random() * 900)}`,
        name: defaultProd ? `${defaultProd.name} Assembly Recipe` : "Automatic Boom Barrier Assembly",
        finishedProductSku: defaultProd?.sku || "NNIT-ABB-PRO4",
        finishedProductName: defaultProd?.name || "Automatic Boom Barrier Pro 4M (Finished)",
        category: defaultProd?.category || "Barriers & Access Hardware",
        laborCost: 1500,
        notes: "Production bill of materials for finished parking barrier unit.",
        changeReason: "Initial baseline recipe"
      });
      // Default initial components
      const sampleComps = products.filter((p) => p.itemType === "component" || p.itemType === "spare_part").slice(0, 4);
      setBomLines(
        sampleComps.length > 0
          ? sampleComps.map((c) => ({
              sku: c.sku,
              name: c.name,
              qty: 1,
              uom: c.uom || "PCS",
              unitCost: Number(c.costPrice) || 1000
            }))
          : [
              { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
              { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
              { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
              { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 }
            ]
      );
    }
    setModalOpen(true);
  };

  // Restore older BOM Version
  const handleRestoreVersion = (bom, ver) => {
    Swal.fire({
      title: `Rollback to Version ${ver.versionNo}?`,
      text: `This will restore components and costs from revision ${ver.versionNo} as the active BOM recipe.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Restore This Revision"
    }).then((res) => {
      if (res.isConfirmed) {
        const updatedList = InventoryService.restoreBOMVersion(bom.id, ver.id);
        setBoms(updatedList);
        const updated = (updatedList || []).find((b) => b.id === bom.id);
        if (updated) {
          setActiveHistoryBOM(updated);
        }
        Swal.fire({
          icon: "success",
          title: "Revision Restored!",
          text: `BOM has been rolled back to recipe from ${ver.versionNo}.`,
          timer: 1600,
          showConfirmButton: false
        });
      }
    });
  };

  // Load Preset Template
  const handleLoadTemplate = (tpl) => {
    setEditingBomId(null);
    setBomForm({
      bomNumber: `BOM-${tpl.finishedProductSku.replace("NNIT-", "")}-${Math.floor(100 + Math.random() * 900)}`,
      name: tpl.name,
      finishedProductSku: tpl.finishedProductSku,
      finishedProductName: tpl.finishedProductName,
      category: tpl.category,
      laborCost: tpl.laborCost || 1500,
      notes: tpl.notes || ""
    });
    setBomLines(
      tpl.components.map((c) => ({
        ...c,
        unitCost: Number(c.unitCost) || 1000
      }))
    );

    Swal.fire({
      icon: "success",
      title: `Template Loaded: ${tpl.name}`,
      text: `${tpl.components.length} standard components and specifications populated.`,
      timer: 1400,
      showConfirmButton: false
    });
  };

  // Add Component Line
  const addBomLine = () => {
    const defaultProd = products.find((p) => p.itemType === "component" || p.itemType === "spare_part") || products[0];
    setBomLines([
      ...bomLines,
      {
        sku: defaultProd?.sku || "CMP-BARRIER-CABINET",
        name: defaultProd?.name || "Component Item",
        qty: 1,
        uom: defaultProd?.uom || "PCS",
        unitCost: Number(defaultProd?.costPrice) || 1000
      }
    ]);
  };

  const removeBomLine = (idx) => {
    setBomLines(bomLines.filter((_, i) => i !== idx));
  };

  const updateBomLine = (idx, field, value) => {
    const updated = [...bomLines];
    updated[idx] = { ...updated[idx], [field]: value };
    setBomLines(updated);
  };

  // Save BOM
  const handleSaveBOM = (e) => {
    e.preventDefault();
    if (bomLines.length === 0) {
      Swal.fire("Error", "Please add at least one component line.", "error");
      return;
    }

    const payload = {
      ...bomForm,
      id: editingBomId || undefined,
      components: bomLines
    };

    InventoryService.saveBOM(payload);
    loadData();

    Swal.fire({
      icon: "success",
      title: editingBomId ? "BOM Updated!" : "BOM Saved Successfully!",
      text: editingBomId ? "New revision recorded in history." : "BOM initial version (V1) saved.",
      timer: 1600,
      showConfirmButton: false
    });

    setModalOpen(false);
    setActiveTab("list");
    navigate("/inventory/bom");
  };

  // Clone BOM
  const handleCloneBOM = (bom) => {
    const cloned = {
      ...bom,
      id: undefined,
      bomNumber: `${bom.bomNumber}-COPY`,
      name: `${bom.name} (Clone)`
    };
    InventoryService.saveBOM(cloned);
    loadData();

    Swal.fire({
      icon: "success",
      title: "BOM Cloned",
      text: `Cloned as ${cloned.bomNumber}.`,
      timer: 1400,
      showConfirmButton: false
    });
  };

  // Delete BOM
  const handleDeleteBOM = (bom) => {
    Swal.fire({
      title: "Delete BOM Recipe?",
      text: `Are you sure you want to delete ${bom.bomNumber}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete"
    }).then((res) => {
      if (res.isConfirmed) {
        InventoryService.deleteBOM(bom.id);
        loadData();
        Swal.fire({
          icon: "success",
          title: "BOM Deleted",
          timer: 1200,
          showConfirmButton: false
        });
      }
    });
  };

  // 1-Click Purchase Requisition for Shortages
  const handleRaiseRequisitionForShortages = () => {
    if (!availabilityReport) return;
    const shortages = availabilityReport.components.filter((c) => c.shortageQty > 0);
    if (shortages.length === 0) return;

    InventoryService.saveRequisition({
      requestedBy: "Production Lead (BOM Shortage Automation)",
      departmentProject: `Assembly Batch: ${availabilityReport.finishedProductName} (${unitsToProduce} units)`,
      priority: "Urgent",
      requiredDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      purpose: `Shortage replenishment for manufacturing ${unitsToProduce} units of ${availabilityReport.finishedProductName}`,
      items: shortages.map((s) => ({
        sku: s.sku,
        name: s.name,
        qty: s.shortageQty,
        notes: `Shortage for BOM ${availabilityReport.bomNumber}`
      }))
    });

    Swal.fire({
      icon: "success",
      title: "Material Requisition Created!",
      text: `Urgent requisition raised for ${shortages.length} shortage components. View in Material Movement.`,
      confirmButtonColor: "#2563eb"
    });

    setSelectedBOM(null);
  };

  // Filtered BOMs for List View
  const filteredBoms = useMemo(() => {
    return boms.filter((b) => {
      const matchSearch =
        b.bomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.finishedProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.components || []).some(
          (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.sku.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchCategory =
        selectedCategory === "all" ||
        b.category === selectedCategory ||
        (b.category || "").toLowerCase() === selectedCategory.toLowerCase();

      let matchFeasibility = true;
      if (feasibilityFilter !== "all") {
        const rep = InventoryService.checkBOMAvailability(b.id, 1, null);
        if (feasibilityFilter === "ready") {
          matchFeasibility = rep && rep.canAssemble;
        } else if (feasibilityFilter === "shortage") {
          matchFeasibility = rep && !rep.canAssemble;
        }
      }

      return matchSearch && matchCategory && matchFeasibility;
    });
  }, [boms, searchQuery, selectedCategory, feasibilityFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, feasibilityFilter, pageSize]);

  // Pagination calculations
  const totalItems = filteredBoms.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedBoms = useMemo(() => {
    return filteredBoms.slice(startIndex, endIndex);
  }, [filteredBoms, startIndex, endIndex]);

  // Total Material Cost calculation for form
  const totalMaterialCost = useMemo(() => {
    return bomLines.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitCost) || 0), 0);
  }, [bomLines]);

  const totalUnitCost = totalMaterialCost + (Number(bomForm.laborCost) || 0);

  // Categories list
  const categoryOptions = useMemo(() => {
    const cats = new Set(["Barriers & Access Hardware", "RFID & Fastag Tech", "Green Energy & Solar", "Pedestrian Access"]);
    boms.forEach((b) => {
      if (b.category) cats.add(b.category);
    });
    return Array.from(cats);
  }, [boms]);

  // ── REUSABLE FORM CONTENT (Matches the exact clean styling of other inventory forms) ──
  const renderBOMForm = () => (
    <form onSubmit={handleSaveBOM} className="space-y-5">
      {/* Quick Template Selector Chips */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Template:</span>
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleLoadTemplate(tpl)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              {tpl.name.replace(" Assembly", "").replace(" Automatic", "").slice(0, 22)}...
            </button>
          ))}
        </div>
      </div>

      {/* Assembly Product Specification Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">BOM Number *</label>
          <input
            type="text"
            required
            value={bomForm.bomNumber}
            onChange={(e) => setBomForm({ ...bomForm, bomNumber: e.target.value })}
            className="w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase bg-slate-50 font-bold text-blue-700"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Finished Product *</label>
          <select
            value={bomForm.finishedProductSku}
            onChange={(e) => {
              const p = products.find((prod) => prod.sku === e.target.value);
              if (p) {
                setBomForm({
                  ...bomForm,
                  finishedProductSku: p.sku,
                  finishedProductName: p.name,
                  name: `${p.name} Assembly`,
                  category: p.category || "Barriers & Access Hardware"
                });
              }
            }}
            className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white"
          >
            {products
              .filter((p) => p.itemType === "finished_product" || true)
              .map((p) => (
                <option key={p.id} value={p.sku}>
                  {p.name} ({p.sku})
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">BOM Recipe Title *</label>
          <input
            type="text"
            required
            value={bomForm.name}
            onChange={(e) => setBomForm({ ...bomForm, name: e.target.value })}
            placeholder="e.g. Automatic Boom Barrier Assembly"
            className="w-full px-3 py-2 border rounded-xl text-xs font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
          <select
            value={bomForm.category}
            onChange={(e) => setBomForm({ ...bomForm, category: e.target.value })}
            className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white"
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Revision Reason / Change Note (When Editing Existing BOM) */}
      {editingBomId && (
        <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/70">
          <label className="block text-xs font-bold text-purple-900 mb-1">
            Reason for Revision / Change Note (Optional)
          </label>
          <input
            type="text"
            value={bomForm.changeReason || ""}
            onChange={(e) => setBomForm({ ...bomForm, changeReason: e.target.value })}
            placeholder="e.g. Upgraded motor controller, updated components and labor cost"
            className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium text-slate-800 placeholder-purple-300 focus:outline-none focus:border-purple-500"
          />
          <p className="text-[11px] text-purple-700 mt-1">
            Saving will automatically record a new version revision in history (tracking how many times it was changed).
          </p>
        </div>
      )}

      {/* Component Lines Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Required Components & Raw Materials
            </h3>
            <p className="text-[11px] text-slate-500">
              Add barrier cabinets, motors, controllers, loop detectors, sensors, and accessories
            </p>
          </div>

          <button
            type="button"
            onClick={addBomLine}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Component</span>
          </button>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 text-center w-10">#</th>
                <th className="p-3 min-w-[200px]">Component / Material</th>
                <th className="p-3 text-center min-w-[100px]">WH Stock</th>
                <th className="p-3 text-center min-w-[110px]">Required Qty</th>
                <th className="p-3 text-center w-16">UOM</th>
                <th className="p-3 text-right min-w-[110px]">Unit Cost (₹)</th>
                <th className="p-3 text-right min-w-[120px]">Total (₹)</th>
                <th className="p-3 text-center w-12">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bomLines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 font-semibold">
                    No component lines added. Click "+ Add Component" above.
                  </td>
                </tr>
              ) : (
                bomLines.map((line, idx) => {
                  const avail = getProductAvailableStock(line.sku);
                  const lineTotal = (Number(line.qty) || 0) * (Number(line.unitCost) || 0);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>

                      <td className="p-3">
                        <select
                          value={line.sku}
                          onChange={(e) => {
                            const p = products.find((prod) => prod.sku === e.target.value);
                            if (p) {
                              const updated = [...bomLines];
                              updated[idx] = {
                                ...updated[idx],
                                sku: p.sku,
                                name: p.name,
                                uom: p.uom || "PCS",
                                unitCost: Number(p.costPrice) || 1000
                              };
                              setBomLines(updated);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.sku}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            avail === 0
                              ? "bg-red-100 text-red-700"
                              : avail < line.qty
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {avail} {line.uom}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={line.qty}
                          onChange={(e) => updateBomLine(idx, "qty", Number(e.target.value))}
                          className="w-20 px-2 py-1 border rounded-lg text-xs text-center font-bold"
                        />
                      </td>

                      <td className="p-3 text-center font-semibold text-slate-500">{line.uom}</td>

                      <td className="p-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={line.unitCost}
                          onChange={(e) => updateBomLine(idx, "unitCost", Number(e.target.value))}
                          className="w-24 px-2 py-1 border rounded-lg text-xs text-right font-mono font-bold"
                        />
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹ {Number(lineTotal).toLocaleString()}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeBomLine(idx)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Total Unit Assembly Cost Summary Bar */}
        <div className="mt-3 p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-blue-900 block">
              Total Bill of Materials (BOM) Cost Per Finished Unit:
            </span>
            <span className="text-[11px] text-blue-700/80">
              Material Subtotal: ₹{totalMaterialCost.toLocaleString()} + Labor: ₹{(Number(bomForm.laborCost) || 0).toLocaleString()}
            </span>
          </div>
          <span className="text-lg font-black text-blue-700 font-mono">
            ₹ {Number(totalUnitCost).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Direct Labor Cost & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Direct Assembly & Labor Cost (₹ / Unit)
          </label>
          <input
            type="number"
            min="0"
            value={bomForm.laborCost}
            onChange={(e) => setBomForm({ ...bomForm, laborCost: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Assembly Notes & Work Instructions
          </label>
          <input
            type="text"
            value={bomForm.notes}
            onChange={(e) => setBomForm({ ...bomForm, notes: e.target.value })}
            placeholder="e.g. Standard 4M barrier wiring with loop detector calibration."
            className="w-full px-3 py-2 border rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            setModalOpen(false);
            if (activeTab === "create") {
              setActiveTab("list");
              navigate("/inventory/bom");
            }
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          {editingBomId ? "Update BOM Recipe" : "Save & Register BOM"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-5 w-full pb-16 font-sans">
      {/* ── HEADER (Identical to other Inventory ERP pages) ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <span>Inventory ERP</span>
            <span>•</span>
            <span>Manufacturing & Assembly</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Bill of Materials (BOM) & Shortage Detection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define assembly recipes for finished parking barrier models, check component availability, and identify material shortages before production.
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New BOM</span>
        </button>
      </div>

      {/* ── SUB-TABS (Matches exact items from Screenshot 2: BOM List, Create BOM) ── */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 w-fit">
        <Link
          to="/inventory/bom"
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === "list"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>BOM List ({boms.length})</span>
        </Link>
        <Link
          to="/inventory/bom/create"
          onClick={() => {
            setActiveTab("create");
            setEditingBomId(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === "create"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <PlusSquare className="w-4 h-4" />
          <span>Create BOM</span>
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
         VIEW 1: BOM LIST
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "list" && (
        <div className="space-y-4 animate-fade-in">
          {/* Search, Filter & View Controls */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search BOM code, finished product, or component..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: "all", label: "All" },
                    { id: "ready", label: "Ready" },
                    { id: "shortage", label: "Shortage" }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFeasibilityFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        feasibilityFilter === f.id
                          ? "bg-white text-blue-700 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === "grid" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Grid Cards"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === "table" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Data Table"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD GRID VIEW ── */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedBoms.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl p-10 text-center border border-slate-200">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No BOM recipes match your search criteria.</p>
                </div>
              ) : (
                paginatedBoms.map((bom) => {
                  const mCost = (bom.components || []).reduce((s, c) => s + (c.qty || 0) * (c.unitCost || 0), 0);
                  const lCost = Number(bom.laborCost) || 0;
                  const estimatedUnitCost = mCost + lCost;
                  const rep = InventoryService.checkBOMAvailability(bom.id, 1, null);
                  const isReady = rep && rep.canAssemble;
                  const latest = getLatestVersion(bom);
                  const totalVersions = bom.versions?.length || 1;

                  return (
                    <div
                      key={bom.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            {bom.bomNumber}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                isReady ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isReady ? "Ready" : "Shortage"}
                            </span>
                            <button
                              type="button"
                              onClick={() => openHistoryModal(bom)}
                              className="cursor-pointer transition-transform hover:scale-105"
                              title="Click to view Revision History Log"
                            >
                              <VersionBadge versionNo={latest?.versionNo || bom.version || "V1"} isLatest={true} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openHistoryModal(bom)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer shadow-2xs"
                              title="Show BOM Revision History Log"
                            >
                              <History size={13} />
                              <span>{totalVersions} {totalVersions > 1 ? "Revs" : "Rev"}</span>
                            </button>
                          </div>
                        </div>

                        <h2 className="text-base font-black text-slate-900">{bom.name}</h2>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-blue-600 font-semibold">{bom.finishedProductName}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{bom.notes}</p>

                        {/* Component Lines Preview */}
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Components ({bom.components?.length || 0} lines):
                          </span>
                          <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                            {bom.components?.map((c, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 px-2.5 py-1 rounded-lg"
                              >
                                <span className="truncate max-w-[200px]">
                                  • <b>{c.qty}x</b> {c.name}
                                </span>
                                <span className="font-mono text-[11px] text-slate-400">
                                  ₹ {Number(c.qty * (c.unitCost || 0)).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Estimated Unit Cost
                            </span>
                            <span className="text-sm font-black text-slate-900 font-mono">
                              ₹ {Number(estimatedUnitCost).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openHistoryModal(bom)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                              title="BOM Revision History Log"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openCreateModal(bom)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Edit BOM"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCloneBOM(bom)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              title="Clone BOM"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openSpecSheet(bom)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              title="Spec Sheet"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBOM(bom)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete BOM"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openAvailabilityCheck(bom)}
                          className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Check Availability & Shortages</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── DATA TABLE VIEW ── */}
          {viewMode === "table" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-center w-12">SR</th>
                      <th className="p-3">BOM Number</th>
                      <th className="p-3">Finished Product Model</th>
                      <th className="p-3 text-center">Latest Version</th>
                      <th className="p-3 text-center">Parts</th>
                      <th className="p-3 text-right pr-4">Total Cost</th>
                      <th className="p-3 text-center">Feasibility</th>
                      <th className="p-3 text-center">Revisions</th>
                      <th className="p-3 text-center pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedBoms.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                          No BOM recipes found.
                        </td>
                      </tr>
                    ) : (
                      paginatedBoms.map((bom, idx) => {
                        const mCost = (bom.components || []).reduce((s, c) => s + (c.qty || 0) * (c.unitCost || 0), 0);
                        const lCost = Number(bom.laborCost) || 0;
                        const rep = InventoryService.checkBOMAvailability(bom.id, 1, null);
                        const isReady = rep && rep.canAssemble;
                        const latest = getLatestVersion(bom);
                        const totalVersions = bom.versions?.length || 1;

                        return (
                          <tr key={bom.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 text-center font-bold text-slate-400">{startIndex + idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-blue-700">{bom.bomNumber}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{bom.name}</div>
                              <div className="text-[11px] text-blue-600 font-medium">{bom.finishedProductName}</div>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => openHistoryModal(bom)}
                                className="cursor-pointer transition-transform hover:scale-105"
                                title="Open BOM Revision History Log"
                              >
                                <VersionBadge versionNo={latest?.versionNo || bom.version || "V1"} isLatest={true} />
                              </button>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700">{bom.components?.length || 0}</td>
                            <td className="p-3 text-right pr-4 font-mono font-bold text-slate-900">
                              ₹{Number(mCost + lCost).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isReady ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                                }`}
                              >
                                {isReady ? "Ready" : "Shortage"}
                              </span>
                            </td>
                            {/* Revisions History Modal Trigger */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => openHistoryModal(bom)}
                                className="inline-flex items-center gap-1.5 mx-auto px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer shadow-2xs"
                                title="Open BOM Revision History Log"
                              >
                                <History size={13} />
                                <span>{totalVersions} {totalVersions > 1 ? "Revisions" : "Revision"}</span>
                              </button>
                            </td>
                            <td className="p-3 text-center pr-6">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openHistoryModal(bom)}
                                  className="p-1 rounded text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                                  title="View Revision History Log"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAvailabilityCheck(bom)}
                                  className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                                >
                                  Feasibility
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openCreateModal(bom)}
                                  className="p-1 rounded text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                  title="Edit / New Version"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSpecSheet(bom)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                  title="Spec Sheet"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBOM(bom)}
                                  className="p-1 rounded text-slate-400 hover:text-red-600 transition cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </div>
          )}

          {/* ── PAGINATION CONTROLS ── */}
          {filteredBoms.length > 0 && (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-slate-500 font-medium">
                  Showing <strong className="text-slate-800">{startIndex + 1}</strong> to{" "}
                  <strong className="text-slate-800">{endIndex}</strong> of{" "}
                  <strong className="text-slate-800">{totalItems}</strong> BOMs
                </span>
                <div className="flex items-center gap-1 text-slate-500 font-medium">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={4}>4</option>
                    <option value={6}>6</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
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
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         VIEW 2: CREATE / EDIT BOM INLINE PAGE VIEW (Same Clean Form)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "create" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs animate-fade-in">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-base font-bold text-slate-900">
              {editingBomId ? "Edit Bill of Materials (BOM)" : "Assembly Product Specification"}
            </h2>
            <p className="text-xs text-slate-500">
              Configure finished parking model and assembly formula details
            </p>
          </div>

          {renderBOMForm()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         CREATE / EDIT MODAL (Triggered from Top "+ Create New BOM" or Edit button)
         ══════════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 animate-scale-up max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingBomId ? "Edit Bill of Materials (BOM)" : "Create New Bill of Materials (BOM)"}
                </h2>
                <p className="text-xs text-slate-500">
                  Configure finished parking model and assembly formula details
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderBOMForm()}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         INTERACTIVE MATERIAL AVAILABILITY & SHORTAGE CHECKER MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      {selectedBOM && availabilityReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Production Feasibility Checker
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  {availabilityReport.finishedProductName}
                </h2>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                  <span>BOM Code: <b className="text-blue-700">{availabilityReport.bomNumber}</b></span>
                  <span>•</span>
                  <VersionBadge versionNo={selectedBOM?.version || "V1"} isLatest={true} />
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                    availabilityReport.canAssemble
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {availabilityReport.canAssemble ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Ready for Assembly
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" /> Material Shortages Found
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Batch Parameters Bar */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch Units to Assemble:</label>
                <input
                  type="number"
                  min="1"
                  value={unitsToProduce}
                  onChange={(e) => setUnitsToProduce(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 border rounded-lg font-bold text-sm bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Check Warehouse Stocks:</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg font-medium text-xs bg-white"
                >
                  <option value="">All Warehouses Combined</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Component Line Shortage Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Component Requirement vs Current Warehouse Stock:
              </span>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Component</th>
                      <th className="p-2.5 text-center">Required</th>
                      <th className="p-2.5 text-center">Available in WH</th>
                      <th className="p-2.5 text-center">Shortage</th>
                      <th className="p-2.5 text-center">Feasibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {availabilityReport.components.map((comp, idx) => {
                      const isShort = comp.shortageQty > 0;
                      return (
                        <tr key={idx} className={isShort ? "bg-red-50/40" : "hover:bg-slate-50/50"}>
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-900">{comp.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{comp.sku}</div>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-800">
                            {comp.totalRequired} {comp.uom}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            {comp.availableStock} {comp.uom}
                          </td>
                          <td className="p-2.5 text-center font-extrabold font-mono">
                            {isShort ? (
                              <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded">
                                -{comp.shortageQty} {comp.uom}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                isShort ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isShort ? "Shortage" : "Available"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedBOM(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
              >
                Close
              </button>

              {!availabilityReport.canAssemble ? (
                <button
                  type="button"
                  onClick={handleRaiseRequisitionForShortages}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Raise Urgent Requisition for Shortages ➔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    Swal.fire("Assembly Approved", "Production work order queued successfully.", "success");
                    setSelectedBOM(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve Production Work Order</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         ENGINEERING SPEC SHEET MODAL (Print / View)
         ══════════════════════════════════════════════════════════════════════ */}
      {specSheetBOM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  NNIT Core Systems • Engineering Specification
                </span>
                <h2 className="text-base font-bold text-slate-900">{specSheetBOM.name}</h2>
                <p className="text-xs text-blue-600 font-mono font-semibold">{specSheetBOM.bomNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSpecSheetBOM(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Finished Model</span>
                <span className="font-bold text-slate-800">{specSheetBOM.finishedProductName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Specification Version</span>
                <div className="mt-0.5">
                  <VersionBadge versionNo={specSheetBOM.version || "V1"} isLatest={true} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Unit Cost</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{Number((specSheetBOM.components || []).reduce((s, c) => s + (c.qty || 0) * (c.unitCost || 0), 0) + (Number(specSheetBOM.laborCost) || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-center w-8">#</th>
                    <th className="p-2.5">Component</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-center">UOM</th>
                    <th className="p-2.5 text-right">Unit Rate (₹)</th>
                    <th className="p-2.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(specSheetBOM.components || []).map((c, i) => (
                    <tr key={i}>
                      <td className="p-2.5 text-center font-bold text-slate-400">{i + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                      <td className="p-2.5 text-center font-bold">{c.qty}</td>
                      <td className="p-2.5 text-center text-slate-500">{c.uom}</td>
                      <td className="p-2.5 text-right font-mono">₹{Number(c.unitCost || 0).toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{Number((c.qty || 0) * (c.unitCost || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSpecSheetBOM(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close Spec Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         TIMELINE AUDIT MODAL: BOM REVISION HISTORY LOG
         (Matches ProductPriceComparison / User's Uploaded Screenshot)
         ══════════════════════════════════════════════════════════════════════ */}
      {historyModalOpen && activeHistoryBOM && (() => {
        const timelineRevisions = getBOMTimelineRevisions(activeHistoryBOM);
        const initialRev = timelineRevisions[0] || {};
        const latestRev = timelineRevisions[timelineRevisions.length - 1] || {};
        const initialCost = initialRev.newCost || 0;
        const currentCost = latestRev.newCost || 0;
        const lifetimeDiff = currentCost - initialCost;
        const lifetimePct = initialCost > 0 ? ((lifetimeDiff / initialCost) * 100).toFixed(2) : "0.00";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 my-8 animate-scale-up">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100">
                      BOM Revision & Price History Log
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {activeHistoryBOM.bomNumber}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    {activeHistoryBOM.finishedProductName || activeHistoryBOM.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>SKU: <b className="font-mono text-slate-700">{activeHistoryBOM.finishedProductSku || "N/A"}</b></span>
                    <span>•</span>
                    <span>Category: <b>{activeHistoryBOM.category || "Standard"}</b></span>
                    <span>•</span>
                    <span className="font-bold text-indigo-700">{timelineRevisions.length} Total Recorded Revisions</span>
                  </p>
                </div>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Executive Summary Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/20 border border-slate-200/80 text-xs">
                <div className="p-2 rounded-xl bg-white/90 border border-slate-100 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Launch Base Cost</span>
                  <span className="text-xs font-black text-slate-800 font-mono">₹{Number(initialCost).toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/90 border border-slate-100 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Unit Cost</span>
                  <span className="text-xs font-black text-indigo-700 font-mono">₹{Number(currentCost).toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/90 border border-slate-100 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Lifetime Variance</span>
                  <span className={`text-xs font-black font-mono ${lifetimeDiff > 0 ? "text-rose-600" : lifetimeDiff < 0 ? "text-emerald-600" : "text-slate-600"}`}>
                    {lifetimeDiff > 0 ? `+₹${lifetimeDiff.toLocaleString()} (+${lifetimePct}%)` : lifetimeDiff < 0 ? `-₹${Math.abs(lifetimeDiff).toLocaleString()} (${lifetimePct}%)` : "₹0 (0%)"}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/90 border border-slate-100 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Recipe</span>
                  <div className="mt-0.5">
                    <VersionBadge versionNo={latestRev.versionNo || activeHistoryBOM.version || "V1"} isLatest={true} />
                  </div>
                </div>
              </div>

              {/* Timeline Items */}
              <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
                {timelineRevisions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No revisions recorded yet.</p>
                ) : (
                  timelineRevisions.map((rev, rIdx) => {
                    const isCurrent = rev.isCurrent;
                    return (
                      <div
                        key={rIdx}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                          isCurrent
                            ? "bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 border-indigo-300 ring-2 ring-indigo-500/10 shadow-xs"
                            : "bg-slate-50/80 hover:bg-white border-slate-200/90 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${isCurrent ? "bg-indigo-600 text-white shadow-2xs" : "bg-slate-200 text-slate-700"}`}>
                              Revision #{rev.revNo}
                            </span>
                            <span className="font-mono font-bold text-slate-600 text-xs">
                              ({rev.versionNo || `V${rev.revNo}`})
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Current Active Recipe
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200/60 shadow-2xs">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{rev.createdAt || rev.date || "N/A"}</span>
                          </div>
                        </div>

                        {/* Cost & Recipe Breakdown Card */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 font-mono text-sm">
                              <span className="text-slate-400 font-medium">₹{Number(rev.oldCost || 0).toLocaleString()}</span>
                              <span className="text-slate-400 font-bold">➔</span>
                              <span className="font-black text-slate-900 text-base">₹{Number(rev.newCost || 0).toLocaleString()}</span>
                              {rev.changeAmount !== 0 ? (
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-md font-extrabold inline-flex items-center gap-0.5 ${
                                    rev.changeAmount > 0
                                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                                      : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {rev.changeAmount > 0 ? (
                                    <>
                                      <ArrowUpRight className="w-3 h-3" />
                                      +₹{rev.changeAmount.toLocaleString()} (+{rev.changePercent}%)
                                    </>
                                  ) : (
                                    <>
                                      -₹{Math.abs(rev.changeAmount).toLocaleString()} ({rev.changePercent}%)
                                    </>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600">
                                  Baseline Release (No Change)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                              <span>Materials: <strong className="text-slate-700 font-mono">₹{Number(rev.materialCost || 0).toLocaleString()}</strong></span>
                              <span>•</span>
                              <span>Labor: <strong className="text-slate-700 font-mono">₹{Number(rev.laborCost || 0).toLocaleString()}</strong></span>
                              <span>•</span>
                              <span>Lead Time: <strong className="text-slate-700">{rev.leadTimeHours || activeHistoryBOM.leadTimeHours || 4.0}h</strong></span>
                            </div>
                          </div>

                          {/* Components in this revision recipe */}
                          {rev.components && rev.components.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                  Recipe Components ({rev.components.length} parts):
                                </span>
                                <span className="text-[10px] text-blue-600 font-medium">
                                  Click Spec Sheet for detailed breakdown
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                                {rev.components.map((c, ci) => (
                                  <span
                                    key={ci}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-50 border border-slate-200/80 text-slate-700"
                                    title={`${c.name} - ₹${Number(c.unitCost || 0).toLocaleString()} / ${c.uom || 'PCS'}`}
                                  >
                                    <span className="text-blue-600 font-bold">{c.qty}x</span>
                                    <span className="truncate max-w-[160px]">{c.name}</span>
                                    <span className="font-mono text-slate-400">₹{(Number(c.qty) * Number(c.unitCost || 0)).toLocaleString()}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reason Box */}
                        <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-start gap-2">
                          <span className="text-indigo-600 font-black uppercase tracking-wider text-[9px] shrink-0 mt-0.5 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            Reason
                          </span>
                          <span className="italic font-medium text-slate-700">
                            "{rev.changeReason || "Initial production launch baseline recipe"}"
                          </span>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Changed By:</span>
                            <span className="font-bold text-slate-700">{rev.changedBy || "Engineering Team"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleRestoreVersion(activeHistoryBOM, rev)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer transition text-xs shadow-2xs"
                                title="Restore this recipe as active"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore Recipe</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSpecSheetBOM({
                                  ...activeHistoryBOM,
                                  version: rev.versionNo,
                                  laborCost: rev.laborCost,
                                  components: rev.components || activeHistoryBOM.components
                                });
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition text-xs shadow-2xs"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Spec Sheet</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close History Log
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
