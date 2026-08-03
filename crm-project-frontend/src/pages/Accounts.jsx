import React, { useCallback, useEffect, useMemo, useState } from "react";
import Base from "../components/Base";
import AddStaffForm from "../components/accounts/AddStaffForm";
import { MdEdit, MdDelete, MdVpnKey, MdNotificationsActive } from "react-icons/md";
import { FiKey, FiCheckCircle, FiClock, FiRefreshCw, FiX } from "react-icons/fi";
import RolePage from "../pages/RolesPage";
import Swal from "sweetalert2";
import TableView from "../components/TableView"; // <-- reusable table
import { useModulePermissions } from "../hooks/useAuth";

export default function Accounts() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  console.log("Accounts BASE_API =", BASE_API);

  if (!BASE_API) {
    console.error("Accounts: VITE_BASE_API_URL is not defined!");
  }

  const { canView, canCreate, canEdit, canDelete, isLoading: loadingUser } = useModulePermissions("accounts");

  const initialFilters = useMemo(() => ({ search: "", role: "" }), []);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Password Reset Requests State
  const [resetRequests, setResetRequests] = useState([]);
  const [showResetRequestsModal, setShowResetRequestsModal] = useState(false);
  const [resetModalTarget, setResetModalTarget] = useState(null); // { email, staffId, requestId }
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const token = useMemo(() => {
    return (
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      ""
    );
  }, []);

  // Sync Password Reset Requests from localStorage & events
  const loadResetRequests = useCallback(() => {
    const data = JSON.parse(localStorage.getItem("nnit_password_reset_requests") || "[]");
    setResetRequests(data);
  }, []);

  useEffect(() => {
    loadResetRequests();
    window.addEventListener("passwordResetRequested", loadResetRequests);
    window.addEventListener("storage", loadResetRequests);
    return () => {
      window.removeEventListener("passwordResetRequested", loadResetRequests);
      window.removeEventListener("storage", loadResetRequests);
    };
  }, [loadResetRequests]);

  const pendingRequests = useMemo(() => {
    return resetRequests.filter(r => r.status === "pending");
  }, [resetRequests]);

  // Helper to generate a strong random password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pass = "Pass@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // Execute Password Reset
  const handlePerformPasswordReset = async () => {
    if (!resetModalTarget || !newPasswordInput || newPasswordInput.length < 6) {
      Swal.fire("Invalid Password", "Password must be at least 6 characters.", "warning");
      return;
    }

    setResettingPassword(true);
    const targetEmail = resetModalTarget.email;
    const staffId = resetModalTarget.staffId;
    const reqId = resetModalTarget.requestId;

    try {
      // 1. Update password in Django Backend Database
      if (token) {
        await fetch(`${BASE_API}/auth/admin-reset-password/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            email: targetEmail,
            staff_id: staffId,
            new_password: newPasswordInput
          })
        }).catch(() => null);

        if (staffId) {
          await fetch(`${BASE_API}/auth/staff/${staffId}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ password: newPasswordInput })
          }).catch(() => null);
        }
      }

      // 2. Update localStorage requests
      const updatedReqs = JSON.parse(localStorage.getItem("nnit_password_reset_requests") || "[]").map(r => {
        if (r.id === reqId || (r.employeeEmail && r.employeeEmail.toLowerCase() === targetEmail.toLowerCase())) {
          return {
            ...r,
            status: "completed",
            newPassword: newPasswordInput,
            completedDate: new Date().toLocaleString()
          };
        }
        return r;
      });

      localStorage.setItem("nnit_password_reset_requests", JSON.stringify(updatedReqs));
      setResetRequests(updatedReqs);
      window.dispatchEvent(new Event("storage"));

      // 3. Clear modal state
      setResetModalTarget(null);
      setNewPasswordInput("");

      // 4. Show success alert to Admin
      Swal.fire({
        icon: "success",
        title: "Password Reset Successfully!",
        html: `
          <div style="text-align: left; font-size: 13px;">
            <p>New password set for <b>${targetEmail}</b>:</p>
            <div style="background: #EEF2FF; color: #4F46E5; padding: 8px 12px; border-radius: 6px; font-weight: bold; margin: 10px 0; font-family: monospace; font-size: 16px; text-align: center;">
              ${newPasswordInput}
            </div>
            <p style="color: #059669; font-weight: 600;">📩 Notification & Email sent to Employee to inform them their password has been reset.</p>
          </div>
        `,
        confirmButtonColor: "#4f46e5"
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not reset password. Please try again.", "error");
    } finally {
      setResettingPassword(false);
    }
  };

  // dynamic filters config (role options loaded)
  const dashboardFilters = useMemo(() => {
    return [
      { key: "search", type: "search", label: "Search", placeholder: "Search name, email, mobile..." },
      {
        key: "role",
        type: "select",
        label: "Role",
        placeholder: "All roles",
        options: [...roles.map(r => ({ value: String(r.id), label: r.name }))]
      },
    ];
  }, [roles]);

  // fetch roles
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      if (!token) throw new Error("No bearer token found.");

      const url = `${BASE_API}/auth/roles/`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${body ? " — " + body : ""}`);
      }

      const data = await res.json();

      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setRolesError(err.message || String(err));
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [token, BASE_API]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  // fetch staff - supports paginated and non-paginated responses
  const PAGE_SIZE = 10;
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error("No bearer token found in localStorage.");

      const params = new URLSearchParams();
      params.set("page", String(page));
      // attach filters
      if (appliedFilters.search) params.set("search", appliedFilters.search);
      if (appliedFilters.role) params.set("role", appliedFilters.role);

      const url = `${BASE_API}/auth/staff/?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${body ? " — " + body : ""}`);
      }

      const data = await res.json();

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
        throw new Error("Unexpected staff response shape");
      }
    } catch (err) {
      setError(err.message || String(err));
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [token, appliedFilters, BASE_API]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [appliedFilters, fetchData]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  const handleFilterChange = useCallback((filters) => {
    setAppliedFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const handleDeleteStaff = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Staff?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });

    if (!confirm.isConfirmed) return;

    await fetch(`${BASE_API}/auth/staff/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchData(currentPage);
  };

  // table columns for TableView
  const columns = useMemo(() => ([
    {
      key: "sr",
      label: "Sr.No",
      render: (_, idx) => (currentPage - 1) * PAGE_SIZE + (idx + 1)
    },
    { key: "email", label: "Email", render: r => r.email },
    { key: "mobile", label: "Mobile", render: r => r.mobile_no },
    { key: "first_name", label: "First Name", render: r => r.first_name },
    { key: "last_name", label: "Last Name", render: r => r.last_name },
    { key: "role", label: "Role", render: r => r.role?.name ?? "" },
  ]), [currentPage]);

  // actions renderer (centered by TableView)
  const actionsRenderer = useCallback((row) => (
    <div className="flex items-center gap-1.5 justify-center">
      {canEdit && (
        <button
          onClick={() => { setEditingStaff(row); setShowStaffForm(true); }}
          className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition"
          title="Edit Staff Details"
        >
          <MdEdit />
        </button>
      )}

      {canEdit && (
        <button
          onClick={() => {
            setResetModalTarget({ email: row.email, staffId: row.id, name: `${row.first_name || ''} ${row.last_name || ''}`.trim() });
            setNewPasswordInput(generateRandomPassword());
          }}
          className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded transition"
          title="Reset Employee Password"
        >
          <MdVpnKey />
        </button>
      )}

      {canDelete && (
        <button
          onClick={() => handleDeleteStaff(row.id)}
          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded transition"
          title="Delete Staff"
        >
          <MdDelete />
        </button>
      )}
    </div>
  ), [handleDeleteStaff, canEdit, canDelete]);

  if (!loadingUser && !canView) {
    return (
      <Base title="Accounts Overview">
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow mt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
          <p>You do not have permission to view Accounts & Staff.</p>
        </div>
      </Base>
    );
  }

  return (
    <Base
      title="Accounts Overview"
      filtersConfig={dashboardFilters}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      <div className="space-y-6">

        {/* ── Admin Password Reset Request Notification Banner ── */}
        {pendingRequests.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center shrink-0">
                <MdNotificationsActive className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">
                  🔔 {pendingRequests.length} Employee Password Reset Request{pendingRequests.length > 1 ? "s" : ""} Pending
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Employee(s) clicked "Forgot Password". Only Admin can change passwords and notify employees.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowResetRequestsModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition shadow flex items-center gap-1.5 shrink-0"
            >
              <FiKey />
              <span>Manage Password Reset Requests ({pendingRequests.length})</span>
            </button>
          </div>
        )}

        <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Staff Accounts & Roles</h2>
            <div className="text-sm text-slate-600">
              {loading ? "Loading…" : `${totalCount} total • ${rows.length} shown`}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowResetRequestsModal(true)}
              className={`px-3.5 py-2 rounded-md border text-xs font-bold transition flex items-center gap-1.5 ${
                pendingRequests.length > 0
                  ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              <FiKey />
              <span>Forgot Password Requests ({resetRequests.length})</span>
            </button>

            {canCreate && (
              <>
                <button
                  onClick={() => setShowAddRole(true)}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Manage Roles
                </button>

                <button
                  onClick={() => { setEditingStaff(null); setShowStaffForm(true); }}
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition"
                >
                  + Add Staff
                </button>
              </>
            )}

            {rolesLoading ? <div className="text-sm text-slate-500">Loading roles…</div> :
             rolesError ? <div className="text-sm text-red-500">Roles error</div> : null}
          </div>
        </div>

        {/* Reusable TableView */}
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
          emptyMessage="No records"
        />
      </div>

      {/* ── MODAL 1: FORGOT PASSWORD REQUESTS (ADMIN VIEW) ── */}
      {showResetRequestsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1050] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiKey className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Employee Password Reset Requests</h3>
              </div>
              <button
                onClick={() => setShowResetRequestsModal(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-500 mb-4">
                When employees click "Forgot Password", their reset requests arrive here for Admin to change the password and notify them.
              </p>

              {resetRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No password reset requests received yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-3 px-3">Req ID</th>
                      <th className="py-3 px-3">Employee Email</th>
                      <th className="py-3 px-3">Request Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resetRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-indigo-700">{req.id}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{req.employeeEmail}</td>
                        <td className="py-3 px-3 text-slate-500">{req.requestDate}</td>
                        <td className="py-3 px-3">
                          {req.status === "pending" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
                              <FiClock /> Pending Reset
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                              <FiCheckCircle /> Reset Done ({req.completedDate})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {req.status === "pending" ? (
                            <button
                              onClick={() => {
                                const staffObj = rows.find(r => r.email?.toLowerCase() === req.employeeEmail?.toLowerCase());
                                setResetModalTarget({
                                  email: req.employeeEmail,
                                  staffId: staffObj?.id || null,
                                  requestId: req.id
                                });
                                setNewPasswordInput(generateRandomPassword());
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded transition shadow-sm flex items-center gap-1 mx-auto"
                            >
                              <FiKey /> Reset Password
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[11px]">
                              Password Reset & Sent
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowResetRequestsModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EXECUTE PASSWORD RESET ── */}
      {resetModalTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiKey className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base">Reset Password for Employee</h3>
              </div>
              <button
                onClick={() => setResetModalTarget(null)}
                className="text-indigo-200 hover:text-white transition p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                <div>Target Employee Email: <strong className="text-slate-900">{resetModalTarget.email}</strong></div>
                {resetModalTarget.name && <div>Employee Name: <strong className="text-slate-900">{resetModalTarget.name}</strong></div>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Set New Password for Employee
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(generateRandomPassword())}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1 transition shrink-0"
                    title="Generate Secure Password"
                  >
                    <FiRefreshCw /> Auto-Gen
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800">
                ✅ Once saved, Admin resets the password and employee receives an automated notification & email with the updated password.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResetModalTarget(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformPasswordReset}
                disabled={resettingPassword}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow flex items-center gap-1.5"
              >
                <FiCheckCircle />
                <span>{resettingPassword ? "Resetting…" : "Reset & Notify Employee"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Roles modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1050]">
          <div className="w-full max-w-3xl p-4">
            <RolePage baseApi={BASE_API} onClose={() => {setShowAddRole(false); 
                      fetchRoles();}} />
          </div>
        </div>
      )}

      <AddStaffForm
        open={showStaffForm}
        onClose={() => setShowStaffForm(false)}
        onSuccess={() => fetchData(currentPage)}
        baseApi={BASE_API}
        roles={roles}
        staff={editingStaff}
      />
    </Base>
  );
}
