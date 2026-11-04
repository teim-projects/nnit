import React, { useState, useEffect, useMemo } from "react";
import { useUserRole } from "../hooks/useAuth";
import Swal from "sweetalert2";

const MODULE_LIST = [
  { key: "dashboard", label: "Dashboard & Telemetry", description: "View system telemetry, analytics, and overview charts" },
  { key: "leads", label: "Lead Management", description: "Create, view, edit, and manage sales leads" },
  { key: "design_drawings", label: "Design Drawings", description: "Sales Person & Designer CAD drawing workflow" },
  { key: "designer_queue", label: "Designer Work Queue", description: "Designer incoming lead queue to upload CAD drawings & return to sales" },
  { key: "followups", label: "Follow-up Management", description: "Schedule and manage customer follow-ups" },
  { key: "quotations", label: "Quotations", description: "Generate and send quotation PDFs to customers" },
  { key: "products", label: "Parking Product Master", description: "Manage products, pricing, and specifications" },
  { key: "customers", label: "Customer Management", description: "Manage customer profiles and contact details" },
  { key: "amc", label: "AMC & Renewals", description: "Track annual maintenance contracts and service renewals" },
  { key: "accounts", label: "Accounts & Staff", description: "User account creation, staff assignments, and permissions" },
  { key: "invoice", label: "Invoices & Billing", description: "Generate, download, and manage invoices" },
  { key: "reports", label: "Report & Analysis", description: "System analytics, revenue, lead sources, and reporting" },
  { key: "terms", label: "Terms & Conditions", description: "Manage legal terms and condition templates" },
  { key: "role_management", label: "Role & Access Control", description: "Configure system roles and permission matrices" },
];

export default function RoleAccessManagement() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const { userRole, isLoading: authLoading } = useUserRole(BASE_API);

  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // New Role Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  // Active Role State
  const [rolePermissions, setRolePermissions] = useState({});

  const token = localStorage.getItem("access");

  // Fetch Roles from Backend
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_API}/auth/roles/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data);
      if (data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(data[0].id);
        setRolePermissions(data[0].permissions || getInitialDefaultPermissions());
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to load roles from server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const getInitialDefaultPermissions = () => {
    const defaults = {};
    MODULE_LIST.forEach((m) => {
      defaults[m.key] = { can_view: true, can_create: true, can_edit: true, can_delete: true };
    });
    return defaults;
  };

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  // When selected role changes, populate permissions state
  useEffect(() => {
    if (selectedRole) {
      const currentPerms = { ...getInitialDefaultPermissions(), ...(selectedRole.permissions || {}) };
      setRolePermissions(currentPerms);
    }
  }, [selectedRoleId]);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);

    const cleanMsg = message.replace(/^[✅❌⚠️]\s*/, "");
    Swal.fire({
      icon: type === "error" ? "error" : "success",
      title: type === "error" ? "Error" : "Success!",
      text: cleanMsg,
      timer: 2200,
      showConfirmButton: false
    });
  };

  const handleTogglePermission = (moduleKey, action) => {
    setRolePermissions((prev) => {
      const modulePerms = prev[moduleKey] || { can_view: false, can_create: false, can_edit: false, can_delete: false };
      const updatedModule = {
        ...modulePerms,
        [action]: !modulePerms[action],
      };

      // If enabling create/edit/delete, auto-enable view
      if (action !== "can_view" && updatedModule[action]) {
        updatedModule.can_view = true;
      }

      // If disabling view, auto-disable all sub-permissions
      if (action === "can_view" && !updatedModule.can_view) {
        updatedModule.can_create = false;
        updatedModule.can_edit = false;
        updatedModule.can_delete = false;
      }

      return {
        ...prev,
        [moduleKey]: updatedModule,
      };
    });
  };

  const handleModuleAllToggle = (moduleKey, value) => {
    setRolePermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        can_view: value,
        can_create: value,
        can_edit: value,
        can_delete: value,
      },
    }));
  };

  const handleGlobalPreset = (preset) => {
    setRolePermissions((prev) => {
      const updated = { ...prev };
      MODULE_LIST.forEach((m) => {
        if (preset === "all") {
          updated[m.key] = { can_view: true, can_create: true, can_edit: true, can_delete: true };
        } else if (preset === "readonly") {
          updated[m.key] = { can_view: true, can_create: false, can_edit: false, can_delete: false };
        } else if (preset === "clear") {
          updated[m.key] = { can_view: false, can_create: false, can_edit: false, can_delete: false };
        }
      });
      return updated;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_API}/auth/roles/${selectedRoleId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          permissions: rolePermissions,
        }),
      });

      if (!res.ok) throw new Error("Failed to update role permissions");
      const updatedRole = await res.json();

      setRoles((prev) => prev.map((r) => (r.id === selectedRoleId ? updatedRole : r)));
      
      // Persist to localStorage for immediate client-side sidebar & module access syncing
      const roleKey = (updatedRole.name || "").toLowerCase();
      localStorage.setItem(`nnit_role_permissions_${roleKey}`, JSON.stringify(rolePermissions));
      localStorage.setItem("nnit_role_permissions", JSON.stringify(rolePermissions));
      
      showToast(`✅ Permissions for role "${updatedRole.name}" updated successfully!`);

      // Trigger authChange & storage so sidebar & current session permissions reload dynamically
      window.dispatchEvent(new Event("authChange"));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
      // Fallback: Still save to local storage if server fails
      if (selectedRole) {
        const roleKey = (selectedRole.name || "").toLowerCase();
        localStorage.setItem(`nnit_role_permissions_${roleKey}`, JSON.stringify(rolePermissions));
        localStorage.setItem("nnit_role_permissions", JSON.stringify(rolePermissions));
        window.dispatchEvent(new Event("authChange"));
        window.dispatchEvent(new Event("storage"));
        showToast(`✅ Permissions for role "${selectedRole.name}" saved locally!`);
      } else {
        showToast("❌ Could not save permissions to server", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreatingRole(true);
    try {
      const res = await fetch(`${BASE_API}/auth/roles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRoleName.trim(),
          permissions: getInitialDefaultPermissions(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.name?.[0] || "Failed to create role");
      }

      const createdRole = await res.json();
      setRoles((prev) => [...prev, createdRole]);
      setSelectedRoleId(createdRole.id);
      setNewRoleName("");
      setShowCreateModal(false);
      showToast(`✅ Role "${createdRole.name}" created successfully!`);
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (roleName.toLowerCase() === "admin") {
      showToast("⚠️ System Admin role cannot be deleted", "error");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role "${roleName}"?`)) return;

    try {
      const res = await fetch(`${BASE_API}/auth/roles/${roleId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete role");

      const remaining = roles.filter((r) => r.id !== roleId);
      setRoles(remaining);
      if (remaining.length > 0) setSelectedRoleId(remaining[0].id);

      showToast(`Role "${roleName}" deleted.`);
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to delete role", "error");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white font-medium flex items-center gap-3 transition-all animate-bounce ${
            notification.type === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600" />
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Role & Access Control Management
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Configure model access rights and feature permissions for each system role. Access settings apply automatically upon user login.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Role
        </button>
      </div>

      {/* Role Selection Tabs */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Select Role to Configure
        </div>
        {loading ? (
          <div className="text-sm text-slate-500 py-4">Loading system roles...</div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {roles.map((r) => {
              const isSelected = r.id === selectedRoleId;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer text-sm font-bold transition-all border ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-300/50"
                      : "bg-slate-50/70 border-slate-200/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-indigo-600" : "bg-slate-300"}`} />
                  <span>{r.name}</span>

                  {r.name.toLowerCase() !== "admin" && isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(r.id, r.name);
                      }}
                      title="Delete Role"
                      className="ml-2 text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permission Matrix Section */}
      {selectedRole && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Action Bar */}
          <div className="p-5 bg-slate-50/70 border-b border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Permission Matrix for <span className="text-indigo-600">{selectedRole.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle module visibility and action permissions. Click Save Changes when complete.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleGlobalPreset("all")}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
              >
                Grant Full Access
              </button>
              <button
                type="button"
                onClick={() => handleGlobalPreset("readonly")}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
              >
                Read Only Access
              </button>
              <button
                type="button"
                onClick={() => handleGlobalPreset("clear")}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
              >
                Clear All Access
              </button>

              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={saving}
                className="ml-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving Matrix…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Permissions
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">System Module</th>
                  <th className="py-3.5 px-4 text-center">View Access</th>
                  <th className="py-3.5 px-4 text-center">Create Access</th>
                  <th className="py-3.5 px-4 text-center">Edit Access</th>
                  <th className="py-3.5 px-4 text-center">Delete Access</th>
                  <th className="py-3.5 px-6 text-center">Quick Select</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-sm">
                {MODULE_LIST.map((mod) => {
                  const perms = rolePermissions[mod.key] || {
                    can_view: false,
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                  };
                  const isAllChecked = perms.can_view && perms.can_create && perms.can_edit && perms.can_delete;

                  return (
                    <tr key={mod.key} className="hover:bg-slate-50/60 transition-colors">
                      {/* Module Info */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{mod.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{mod.description}</div>
                      </td>

                      {/* View Permission */}
                      <td className="py-4 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!perms.can_view}
                            onChange={() => handleTogglePermission(mod.key, "can_view")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </td>

                      {/* Create Permission */}
                      <td className="py-4 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!perms.can_create}
                            onChange={() => handleTogglePermission(mod.key, "can_create")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </td>

                      {/* Edit Permission */}
                      <td className="py-4 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!perms.can_edit}
                            onChange={() => handleTogglePermission(mod.key, "can_edit")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </td>

                      {/* Delete Permission */}
                      <td className="py-4 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!perms.can_delete}
                            onChange={() => handleTogglePermission(mod.key, "can_delete")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                      </td>

                      {/* Quick Select Module All */}
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => handleModuleAllToggle(mod.key, !isAllChecked)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                            isAllChecked
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          }`}
                        >
                          {isAllChecked ? "Clear Module" : "Select All"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create New Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-800">Create New System Role</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                  Role Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accounts Manager, Sales Executive"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
                >
                  {creatingRole ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
