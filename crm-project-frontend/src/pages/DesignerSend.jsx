import React, { useState, useEffect, useMemo, useCallback } from "react";
import Base from "../components/Base";
import TableView from "../components/TableView";
import AddDesignerSendModal from "../components/designer/AddDesignerSendModal";
import DesignerSlipModal from "../components/designer/DesignerSlipModal";
import SalesRevisionModal from "../components/designer/SalesRevisionModal";
import DesignVersionHistoryModal from "../components/designer/DesignVersionHistoryModal";
import { getCurrentUserDisplayName, healDesignRequests, isRequestOwnedByUser, isSameDesignRequest } from "../utils/auth";
import { safeSaveDesignRequests } from "../utils/designFileStorage";
import { useUserRole } from "../hooks/useAuth";
import { MdAdd, MdRemoveRedEye, MdEdit, MdDelete, MdFileDownload } from "react-icons/md";
import { FiSend, FiClock, FiCheckCircle, FiSearch, FiPrinter, FiPaperclip, FiRepeat, FiLayers } from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io5";
import Swal from "sweetalert2";

export default function DesignerSend() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL || "";
  const token = localStorage.getItem("access") || "";

  // User role & identity for strict ownership filtering
  const { userRole, userData, userName, isSuperUser } = useUserRole(BASE_API);
  const activeRole = (userRole?.name || localStorage.getItem("user_role") || "sales").toLowerCase();
  const isSuper = isSuperUser || activeRole === "admin" || activeRole === "superadmin";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipRequest, setSlipRequest] = useState(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionRequest, setVersionRequest] = useState(null);

  // Fetch from both backend and local storage
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Read locally stored design requests
      const local = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");

      // 2. Fetch backend leads with is_sent=true
      let backendLeads = [];
      if (BASE_API) {
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(`${BASE_API.replace(/\/$/, "")}/lead/lead/?page_size=500`, { headers });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : data.results || [];
            backendLeads = list.filter((l) => l.is_sent === true || l.is_sent === 1 || l.cad_file || l.customer_layout);
          }
        } catch (apiErr) {
          console.warn("Backend fetch failed, relying on local requests:", apiErr);
        }
      }

      // 3. Map backend leads to standard Designer Request format
      const mappedBackend = backendLeads.map((l) => {
        const coName = l.company_name || l.customer_name || l.customer?.name || "Client";
        const contactPerson = l.contact_person_name || l.customer_name || "Contact";
        const contactNumber = l.contact_person_number || l.customer_contact || l.customer?.contact_number || "—";
        const req = l.site_requirement || l.requirements_details || "Standard Requirement";

        const currentLoggedIn = getCurrentUserDisplayName();
        const salesPerson =
          l.assign_to_details?.full_name ||
          l.assign_to_details?.first_name ||
          l.creatd_by_details?.full_name ||
          l.creatd_by_details?.first_name ||
          l.assigned_to_details?.username ||
          l.created_by_details?.full_name ||
          currentLoggedIn ||
          "Sales Person";
        const sentDt = l.created_at ? new Date(l.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : (l.date || "Recent");

        return {
          id: `LEAD-${l.id}`,
          reqNo: `DS-${l.id}`,
          leadId: l.id,
          salutation: coName.startsWith("M/s.") ? "M/s." : "M/s.",
          clientCoName: coName.startsWith("M/s.") ? coName : `M/s. ${coName}`,
          projectName: l.project_name || "Avdhut Residency",
          projectAddress: l.site_location || l.project_adderess || l.customer_address || "—",
          contactPersonSalutation: contactPerson.startsWith("MS.") ? "MS." : "MS.",
          contactPerson: contactPerson.startsWith("MS.") || contactPerson.startsWith("Mr.") ? contactPerson : `MS. ${contactPerson}`,
          contactNumber: contactNumber,
          requirements: req,
          quantity: "As per STD",
          remark: l.remarks || "-",
          customerLayoutName: l.customer_layout_name || (l.customer_layout ? "Customer Layout" : ""),
          customerLayoutUrl: l.customer_layout || l.customer_layout_url || "",
          drawingTitle: l.cad_file_name || "",
          drawingUrl: l.cad_file || "",
          salesPersonName: salesPerson,
          salesPersonEmail: l.assign_to_details?.email || "",
          status: l.cad_file ? "drawing_completed" : "pending_drawing",
          is_sent: 1,
          is_received: l.cad_file ? 1 : 0,
          sentDate: sentDt,
        };
      });

      // 4. Merge local and backend (local takes precedence for edited fields)
      const currentLoggedIn = getCurrentUserDisplayName();
      const mergedMap = new Map();
      mappedBackend.forEach((item) => {
        const bKey = (item.leadId && item.leadId !== "null" && item.leadId !== "undefined")
          ? `lead-${item.leadId}`
          : String(item.id || item.reqNo || "");
        mergedMap.set(bKey, item);
      });
      local.forEach((item) => {
        const lKey = (item.leadId && item.leadId !== "null" && item.leadId !== "undefined")
          ? `lead-${item.leadId}`
          : String(item.id || item.reqNo || "");
        const resolvedSales = (item.salesPersonName && item.salesPersonName !== "Sales Person")
          ? item.salesPersonName
          : (currentLoggedIn && currentLoggedIn !== "Sales Person" ? currentLoggedIn : (item.salesPersonName || "Sales Person"));
        mergedMap.set(lKey, { ...mergedMap.get(lKey), ...item, salesPersonName: resolvedSales });
      });

      // If completely empty on first launch, add default sample from user's image so they see it instantly!
      if (mergedMap.size === 0) {
        const sampleRequest = {
          id: "DS-101",
          reqNo: "DS-101",
          salutation: "M/s.",
          clientCoName: "M/s. Shree Associate",
          projectName: "Avdhut Residency",
          projectAddress: "Guruwar peth",
          contactPersonSalutation: "MS.",
          contactPerson: "MS. Jigar Patel",
          contactNumber: "9890907870",
          requirements: "2DP101 STACK & 3DP304 STACK & CANTILEVER CP401",
          quantity: "As per STD",
          remark: "-",
          customerLayoutName: "",
          customerLayoutUrl: "",
          status: "pending_drawing",
          is_sent: 1,
          is_received: 0,
          sentDate: new Date().toLocaleDateString("en-IN"),
        };
        mergedMap.set("DS-101", sampleRequest);
        localStorage.setItem("nnit_design_requests", JSON.stringify([sampleRequest]));
      }

      setRequests(Array.from(mergedMap.values()));
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  }, [BASE_API, token]);

  useEffect(() => {
    fetchRequests();
    const handleUpdate = () => fetchRequests();
    window.addEventListener("designRequestUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("designRequestUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchRequests]);

  // ── Ownership Filtering ───────────────────────────────────────────
  // Admin / Super Admin: sees ALL requests in system
  // Sales Person / Staff: sees ONLY requests created/sent by themselves
  const accessibleRequests = useMemo(() => {
    if (isSuper) return requests;
    return requests.filter((r) =>
      isRequestOwnedByUser(r, { userRole, isSuperUser, userName, userData })
    );
  }, [requests, isSuper, userRole, isSuperUser, userName, userData]);

  // Filters & Search applied to accessible requests
  const filteredRows = useMemo(() => {
    return accessibleRequests.filter((r) => {
      const matchSearch =
        !searchTerm.trim() ||
        (r.clientCoName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.projectName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.contactNumber || "").includes(searchTerm) ||
        (r.requirements || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && r.status === "pending_drawing") ||
        (statusFilter === "completed" && r.status === "drawing_completed");

      return matchSearch && matchStatus;
    });
  }, [accessibleRequests, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  // Delete Request
  const handleDelete = async (request) => {
    const confirm = await Swal.fire({
      title: "Delete Request?",
      text: `Are you sure you want to remove request for "${request.projectName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete",
    });

    if (confirm.isConfirmed) {
      const existing = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
      const updated = existing.filter((item) => !isSameDesignRequest(item, request));
      safeSaveDesignRequests(updated);

      // Also reset lead is_sent in backend if leadId exists
      if (BASE_API && request.leadId && token) {
        try {
          await fetch(`${BASE_API.replace(/\/$/, "")}/lead/lead/${request.leadId}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ is_sent: false }),
          });
        } catch {
          // ignore
        }
      }

      window.dispatchEvent(new Event("designRequestUpdated"));
      Swal.fire("Deleted!", "Request removed successfully.", "success");
    }
  };

  // Table Columns
  const columns = [
    {
      key: "reqNo",
      label: "Req #",
      render: (r) => (
        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200">
          {r.reqNo || r.id}
        </span>
      ),
    },
    {
      key: "version",
      label: "Version",
      render: (r) => {
        const verNo = r.current_version || (r.versions?.length || 1);
        return (
          <button
            onClick={() => {
              setVersionRequest(r);
              setShowVersionModal(true);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer shadow-2xs transition"
            title="Click to view Version Timeline & History"
          >
            <FiLayers className="w-3 h-3 text-indigo-500" />
            <span>V{verNo}</span>
          </button>
        );
      },
    },
    {
      key: "clientCoName",
      label: "Client / Co Name",
      render: (r) => (
        <div className="font-semibold text-gray-900">
          {r.clientCoName || r.customerName || "—"}
        </div>
      ),
    },
    {
      key: "projectName",
      label: "Project Name",
      render: (r) => (
        <div className="font-medium text-gray-800">
          {r.projectName || "—"}
        </div>
      ),
    },
    {
      key: "projectAddress",
      label: "Project Add",
      render: (r) => (
        <div className="text-gray-600 text-xs max-w-xs truncate" title={r.projectAddress}>
          {r.projectAddress || "—"}
        </div>
      ),
    },
    {
      key: "contactPerson",
      label: "Contact Person",
      render: (r) => (
        <div className="text-gray-800 font-medium text-xs">
          {r.contactPerson || "—"}
        </div>
      ),
    },
    {
      key: "contactNumber",
      label: "Contact No.",
      render: (r) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-gray-700 font-medium">
          <span>{r.contactNumber || "—"}</span>
          {r.contactNumber && r.contactNumber !== "—" && (
            <a
              href={`https://wa.me/91${r.contactNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 p-0.5"
              title="Chat on WhatsApp"
            >
              <IoLogoWhatsapp className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: "requirements",
      label: "Requirements 's",
      render: (r) => (
        <div className="max-w-xs font-mono text-xs text-indigo-900 bg-slate-50 p-1.5 rounded border border-slate-200 truncate" title={r.requirements}>
          {r.requirements || "—"}
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (r) => (
        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {r.quantity || "As per STD"}
        </span>
      ),
    },
    {
      key: "remark",
      label: "Remark",
      render: (r) => (
        <span className="text-xs text-gray-500 italic">
          {r.remark || "-"}
        </span>
      ),
    },
    {
      key: "salesPersonName",
      label: "Sent By (Sales)",
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
            👤
          </span>
          <span className="truncate max-w-[110px]">
            {(r.salesPersonName && r.salesPersonName !== "Sales Person")
              ? r.salesPersonName
              : (getCurrentUserDisplayName() || "Sales Person")}
          </span>
        </div>
      ),
    },
    {
      key: "sentDate",
      label: "Sent Date & Time",
      render: (r) => (
        <div className="text-xs text-slate-600 font-medium whitespace-nowrap">
          {r.sentDate || "—"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const verNo = r.current_version || (r.versions?.length || 1);
        if (r.status === "revision_requested") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-purple-50 text-purple-700 border-purple-200 animate-pulse">
              <FiRepeat className="w-3.5 h-3.5 text-purple-600" />
              Revision Req (V{verNo})
            </span>
          );
        }
        const isDone = r.status === "drawing_completed" || r.drawingUrl || r.cad_file;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              isDone
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {isDone ? (
              <>
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Drawing Ready (V{verNo})
              </>
            ) : (
              <>
                <FiClock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                In Queue (V{verNo})
              </>
            )}
          </span>
        );
      },
    },
  ];

  // Actions Renderer
  const actionsRenderer = (row) => (
    <div className="flex items-center gap-1.5">
      {/* Request Revision / Change Requirements */}
      <button
        onClick={() => {
          setRevisionRequest(row);
          setShowRevisionModal(true);
        }}
        className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition"
        title="Request Revision / Change Requirements"
      >
        <FiRepeat className="w-4 h-4" />
      </button>

      {/* Version History Button */}
      <button
        onClick={() => {
          setVersionRequest(row);
          setShowVersionModal(true);
        }}
        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
        title="View Version History Timeline"
      >
        <FiLayers className="w-4 h-4" />
      </button>

      <button
        onClick={() => {
          setSlipRequest(row);
          setShowSlipModal(true);
        }}
        className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        title="View & Print Slip"
      >
        <MdRemoveRedEye className="w-4 h-4" />
      </button>

      <button
        onClick={() => {
          setEditingRequest(row);
          setShowAddModal(true);
        }}
        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
        title="Edit Request"
      >
        <MdEdit className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleDelete(row)}
        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
        title="Delete Request"
      >
        <MdDelete className="w-4 h-4" />
      </button>
    </div>
  );

  // Stats
  const totalCount = accessibleRequests.length;
  const pendingCount = accessibleRequests.filter((r) => r.status === "pending_drawing" && !r.drawingUrl).length;
  const completedCount = accessibleRequests.filter((r) => r.status === "drawing_completed" || r.drawingUrl).length;

  return (
    <Base>
      <div className="space-y-6">
        {/* Top Header Card (Formatted identically to Lead.jsx) */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🎨</span> Designer Send
              </h1>
              {isSuper ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Admin: All Entries
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                  My Sent Requests ({userName || "Sales"})
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {loading ? "Loading requests..." : `${totalCount} Total Requests • ${filteredRows.length} Shown`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingRequest(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              <MdAdd className="w-5 h-5" />
              <span>+ Send to Designer</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setStatusFilter("all")}
            className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              statusFilter === "all"
                ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalCount}</p>
            </div>
            <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
              📊
            </span>
          </div>

          <div
            onClick={() => setStatusFilter("pending")}
            className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              statusFilter === "pending"
                ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">In Designer Queue</p>
              <p className="text-2xl font-bold text-amber-900 mt-0.5">{pendingCount}</p>
            </div>
            <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base">
              ⏳
            </span>
          </div>

          <div
            onClick={() => setStatusFilter("completed")}
            className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              statusFilter === "completed"
                ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Drawing Completed</p>
              <p className="text-2xl font-bold text-emerald-900 mt-0.5">{completedCount}</p>
            </div>
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
              ✅
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Client, Project, Contact, Requirement..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-gray-500">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending Drawing</option>
              <option value="completed">Drawing Completed</option>
            </select>
          </div>
        </div>

        {/* Table View Component */}
        <TableView
          columns={columns}
          rows={paginatedRows}
          loading={loading}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
          pageSize={PAGE_SIZE}
          actions={actionsRenderer}
          emptyMessage="No design requests found. Click '+ Send to Designer' to create one."
        />

        {/* Add / Edit Modal */}
        {showAddModal && (
          <AddDesignerSendModal
            open={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setEditingRequest(null);
            }}
            onSuccess={() => fetchRequests()}
            baseApi={BASE_API}
            token={token}
            initialData={editingRequest}
          />
        )}

        {/* Exact Format Slip Modal (Print / View) */}
        {showSlipModal && (
          <DesignerSlipModal
            open={showSlipModal}
            onClose={() => {
              setShowSlipModal(false);
              setSlipRequest(null);
            }}
            request={slipRequest}
          />
        )}

        {/* Sales Revision Request Modal */}
        <SalesRevisionModal
          open={showRevisionModal}
          onClose={() => {
            setShowRevisionModal(false);
            setRevisionRequest(null);
          }}
          request={revisionRequest}
          onSuccess={() => fetchRequests()}
          baseApi={BASE_API}
          token={token}
        />

        {/* Version History Timeline Modal */}
        <DesignVersionHistoryModal
          open={showVersionModal}
          onClose={() => {
            setShowVersionModal(false);
            setVersionRequest(null);
          }}
          request={versionRequest}
        />
      </div>
    </Base>
  );
}
