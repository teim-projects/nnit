import { useState, useRef, useCallback, useMemo } from "react";
import Base from "../components/Base";
import InvoiceList from "../components/invoice/InvoiceList";
import AddInvoice from "../components/invoice/AddInvoice";
import { useModulePermissions } from "../hooks/useAuth";

export default function Invoice() {
  const { canView, canCreate, canEdit, canDelete, isLoading: loadingUser } = useModulePermissions("invoice");

  const [mode, setMode] = useState("list");
  const [editId, setEditId] = useState(null);
  const invoiceListRef = useRef();

  // ─── Filter state ────────────────────────────────────────────────────────────
  const initialFilters = useMemo(() => ({
    search: "",
    date: { from: "", to: "" },
    gst_type: "",
  }), []);

  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // ─── Filter config for FiltersPanel (via Base) ────────────────────────────────
  const filtersConfig = useMemo(() => [
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Search by invoice no, buyer, site...",
    },
    {
      key: "date",
      type: "daterange",
      label: "Invoice Date",
    },
    {
      key: "gst_type",
      type: "select",
      label: "GST Type",
      placeholder: "All GST Types",
      options: [
        { value: "CGST_SGST", label: "CGST + SGST" },
        { value: "IGST",      label: "IGST" },
        { value: "NO_GST",    label: "No GST" },
      ],
    },
  ], []);

  const handleFilterChange = useCallback((filters) => {
    setAppliedFilters(filters);
  }, []);

  // ─── Navigation ───────────────────────────────────────────────────────────────
  const openAdd = () => {
    if (!canCreate) return;
    setEditId(null);
    setMode("add");
  };

  const openEdit = (id) => {
    if (!canEdit) return;
    setEditId(id);
    setMode("add");
  };

  const goBack = () => {
    setMode("list");
    if (invoiceListRef.current) {
      invoiceListRef.current.refreshList();
    }
  };

  if (!loadingUser && !canView) {
    return (
      <Base title="Invoices">
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow mt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
          <p>You do not have permission to view Invoices & Billing.</p>
        </div>
      </Base>
    );
  }

  return (
    <Base
      title="Invoices"
      filterTitle="Invoice Filters"
      filtersConfig={filtersConfig}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      {/* ✅ ALWAYS SHOW LIST IN BACKGROUND */}
      <InvoiceList
        ref={invoiceListRef}
        onAdd={canCreate ? openAdd : null}
        onEdit={canEdit ? openEdit : null}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        filters={appliedFilters}
      />

      {/* ✅ SHOW ADD INVOICE AS MODAL OVER LIST */}
      {mode === "add" && (
        <AddInvoice
          id={editId}
          onBack={goBack}
        />
      )}
    </Base>
  );
}