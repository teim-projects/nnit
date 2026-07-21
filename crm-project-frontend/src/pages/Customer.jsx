import React, { useCallback, useEffect, useMemo, useState } from "react";
import Base from "../components/Base";
import Swal from "sweetalert2";
import AddCustomerForm from "../components/customers/AddCustomerForm";
import CustomerDetails from "../components/customers/CustomerDetails";

export default function Customer() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
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
      const items = Array.isArray(data) ? data : data?.results || [];
      const count = data?.count ?? items.length;
      setRows(items);
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || String(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, appliedFilters]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const handleFilterChange = useCallback((filters) => {
    setAppliedFilters((prev) => ({ ...prev, ...filters }));
  }, []);

  const fmtDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <Base
      title="Customers"
      filtersConfig={customerFilters}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      {/* ── Customer Detail View ── */}
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
      <div className="space-y-2">

        {/* Page heading */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Converted leads and active customers</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">All Customers</h2>
            <button
              onClick={() => { setEditingCustomer(null); setShowCustomerForm(true); }}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition"
            >
              + Add Customer
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Name", "Phone", "Email", "City", "Converted Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-red-500 text-sm">{error}</td>
                  </tr>
                )}
                {!loading && !error && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No customers found.
                    </td>
                  </tr>
                )}
                {!loading && rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{r.name || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{r.contact_number ? `+${r.contact_number.replace(/^\+/, "")}` : "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{r.email || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{r.city || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{fmtDate(r.updated_at || r.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold border
                        ${r.is_lead_only
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-green-50 text-green-700 border-green-200"}`}>
                        {r.is_lead_only ? "Lead" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setDetailCustomerId(r.id)}
                        className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
              <span>Page {currentPage} of {totalPages} · {totalCount} total</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => fetchData(currentPage - 1)}
                  className="px-3 py-1 rounded border bg-white disabled:opacity-40 hover:bg-slate-50"
                >
                  ← Prev
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => fetchData(currentPage + 1)}
                  className="px-3 py-1 rounded border bg-white disabled:opacity-40 hover:bg-slate-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
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
