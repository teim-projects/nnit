import React, { useCallback, useEffect, useMemo, useState } from "react";
import Base from "../components/Base";
import TableView from "../components/TableView";
import Swal from "sweetalert2";
import AddCustomerForm from "../components/customers/AddCustomerForm";
import CustomerDetails from "../components/customers/CustomerDetails";

export default function Customer() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  
  console.log("Customer BASE_API =", BASE_API);
  
  if (!BASE_API) {
    console.error("❌ VITE_BASE_API_URL is not defined!");
  }
  
  const API_URL = `${BASE_API}/lead/customer/`;

  const initialFilters = useMemo(() => ({ search: "" }), []);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [detailCustomerId, setDetailCustomerId] = useState(null);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  const customerFilters = useMemo(() => [
    { key: "search", type: "search", label: "Search", placeholder: "Search name, email, contact..." },
  ], []);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("is_lead_only", "false");
      if (appliedFilters?.search) params.set("search", appliedFilters.search);

      const res = await fetch(`${API_URL}?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      
      // Handle pagination response
      if (data && Array.isArray(data.results)) {
        setRows(data.results);
        const count = Number.isFinite(data.count) ? data.count : (data.results.length || 0);
        setTotalCount(count);
        const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
        setTotalPages(pages);
        setCurrentPage(page);
      } else if (Array.isArray(data)) {
        setRows(data);
        setTotalCount(data.length);
        setTotalPages(Math.max(1, Math.ceil(data.length / PAGE_SIZE)));
        setCurrentPage(1);
      } else {
        throw new Error("Unexpected response shape");
      }
    } catch (err) {
      setError(err.message || String(err));
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, appliedFilters]);

  useEffect(() => { fetchData(currentPage); }, [fetchData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const handleFilterChange = useCallback((filters) => {
    setAppliedFilters((prev) => ({ ...prev, ...filters }));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Define columns exactly like Lead.jsx
  const columns = [
    { key: "sr", label: "Sr.No", render: (_, idx) => (currentPage - 1) * PAGE_SIZE + (idx + 1) },
    { key: "date", label: "Date", render: (r) => formatDate(r.created_at) },
    { key: "name", label: "Name", render: (r) => r.name || "—" },
    { key: "contact", label: "Contact", render: (r) => r.contact_number || "—" },
    { key: "email", label: "Email", render: (r) => r.email || "—" },
    { key: "city", label: "City", render: (r) => r.city || "—" },
    { key: "status", label: "Status", render: (r) => r.is_lead_only ? "lead" : "active" },
  ];

  // Actions renderer (centered by TableView) - exactly like Lead.jsx
  const actionsRenderer = useCallback((row) => (
    <div className="flex items-center justify-center">
      <button
        onClick={() => setDetailCustomerId(row.id)}
        className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        title="View Details"
      >
        View Details
      </button>
    </div>
  ), []);

  return (
    <Base
      title="Customers"
      filtersConfig={customerFilters}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      {/* ── Customer Detail full-page view ── */}
      {detailCustomerId && (
        <CustomerDetails
          customerId={detailCustomerId}
          baseApi={BASE_API}
          token={token}
          onBack={() => setDetailCustomerId(null)}
        />
      )}

      {/* ── Customer List ── */}
      {!detailCustomerId && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Customer Management</h2>
              <div className="text-sm text-slate-600">
                {loading ? "Loading…" : `${totalCount} total • ${rows.length} shown`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setEditingCustomer(null); setShowCustomerForm(true); }}
                className="px-4 py-2 rounded-md bg-sky-600 text-white"
              >
                + Add
              </button>
            </div>
          </div>

          <TableView
            columns={columns}
            rows={rows}
            loading={loading}
            error={error}
            page={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
            pageSize={PAGE_SIZE}
            actions={actionsRenderer}
            emptyMessage="No customers found"
          />
        </div>
      )} {/* end !detailCustomerId */}

      {/* Add / Edit Customer Modal */}
      <AddCustomerForm
        open={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        baseApi={BASE_API}
        customer={editingCustomer}
        onSuccess={() => {
          fetchData(editingCustomer ? currentPage : 1);
          setEditingCustomer(null);
        }}
      />
    </Base>
  );
}
