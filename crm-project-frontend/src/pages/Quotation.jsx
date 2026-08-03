import { useState, useCallback, useMemo } from "react";
import Base from "../components/Base";
import QuotationList from "../components/quotations/QuotationList";
import AddQuotation from "../components/quotations/AddQuotation";
import { useModulePermissions } from "../hooks/useAuth";

export default function Quotation() {
  const { canView, canCreate, canEdit, canDelete, isLoading: loadingUser } = useModulePermissions("quotations");

  const [mode, setMode] = useState("list");
  const [editId, setEditId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ─── Filter state ────────────────────────────────────────────────────────────
  const initialFilters = useMemo(() => ({
    search: "",
    date: { from: "", to: "" },
  }), []);

  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // ─── Filter config for FiltersPanel (via Base) ────────────────────────────────
  const filtersConfig = useMemo(() => [
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Search by customer, quotation no, site...",
    },
    {
      key: "date",
      type: "daterange",
      label: "Quotation Date",
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
    setRefreshKey(prev => prev + 1);
  };

  if (!loadingUser && !canView) {
    return (
      <Base title="Quotes">
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow mt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
          <p>You do not have permission to view Quotations.</p>
        </div>
      </Base>
    );
  }

  return (
    <Base
      title="Quotations"
      filterTitle="Quotation Filters"
      filtersConfig={filtersConfig}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      {/* LIST — always rendered so it's ready in background */}
      <QuotationList
        key={refreshKey}
        onAdd={canCreate ? openAdd : null}
        onEdit={canEdit ? openEdit : null}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        filters={appliedFilters}
      />

      {/* ADD / EDIT MODAL */}
      {mode === "add" && (
        <AddQuotation
          id={editId}
          onBack={goBack}
        />
      )}
    </Base>
  );
}