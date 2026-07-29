import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";

const LABEL = "block text-sm font-medium text-slate-700 mb-1";
const INPUT = "w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition";

export default function AddStaffForm({ open, onClose, onSuccess, baseApi, roles = [], staff = null }) {
  const [email,          setEmail]          = useState("");
  const [mobile,         setMobile]         = useState("");
  const [firstName,      setFirstName]      = useState("");
  const [lastName,       setLastName]       = useState("");
  const [role,           setRole]           = useState("");
  const [password,       setPassword]       = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [loading,        setLoading]        = useState(false);

  const token = useMemo(() => localStorage.getItem("access") || "", []);

  useEffect(() => {
    setEmail(staff?.email || "");
    setMobile(staff?.mobile_no || "");
    setFirstName(staff?.first_name || "");
    setLastName(staff?.last_name || "");
    setRole(staff?.role?.id || "");
    setPassword("");
    setChangePassword(false);
  }, [staff, open]);

  if (!open) return null;

  const validate = () => {
    if (!email.trim())     return Swal.fire({ icon: "error", title: "Validation", text: "Email is required" }), false;
    if (!mobile.toString().trim()) return Swal.fire({ icon: "error", title: "Validation", text: "Mobile is required" }), false;
    if (!firstName.trim()) return Swal.fire({ icon: "error", title: "Validation", text: "First name is required" }), false;
    if (!role)             return Swal.fire({ icon: "error", title: "Validation", text: "Please select a role" }), false;
    if (!staff || changePassword) {
      if (!password || password.length < 6)
        return Swal.fire({ icon: "error", title: "Validation", text: "Password must be at least 6 characters" }), false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const payload = { email, mobile_no: mobile, first_name: firstName, last_name: lastName, role };
    if (!staff || changePassword) payload.password = password;
    const url    = staff ? `${baseApi}/auth/staff/${staff.id}/` : `${baseApi}/auth/staff/`;
    const method = staff ? "PATCH" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      let data; try { data = await res.json(); } catch { data = {}; }
      if (!res.ok) throw new Error(data?.detail || data?.non_field_errors?.[0] || JSON.stringify(data) || `${res.status}`);
      Swal.fire({ icon: "success", text: staff ? "Staff updated" : "Staff added", timer: 1200, showConfirmButton: false });
      onSuccess && onSuccess();
      onClose   && onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save staff" });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1050]">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-800">{staff ? "Edit Staff" : "Add Staff"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form className="space-y-4" onSubmit={handleSubmit}>

            <div>
              <label className={LABEL}>Email <span className="text-red-500">*</span></label>
              <input className={INPUT} placeholder="Email address" type="email"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div>
              <label className={LABEL}>Mobile <span className="text-red-500">*</span></label>
              <input className={INPUT} placeholder="10-digit mobile" type="text" inputMode="numeric" maxLength={10}
                value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ""))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>First Name <span className="text-red-500">*</span></label>
                <input className={INPUT} placeholder="First name"
                  value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Last Name</label>
                <input className={INPUT} placeholder="Last name"
                  value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <div>
              <label className={LABEL}>Role <span className="text-red-500">*</span></label>
              <select className={INPUT} value={role} onChange={e => setRole(e.target.value)}>
                <option value="">Select Role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            {!staff ? (
              <div>
                <label className={LABEL}>Password <span className="text-red-500">*</span></label>
                <input className={INPUT} placeholder="Min 6 characters" type="password"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={changePassword} onChange={e => setChangePassword(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                  Change password
                </label>
                {changePassword && (
                  <div>
                    <label className={LABEL}>New Password</label>
                    <input className={INPUT} placeholder="Min 6 characters" type="password"
                      value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={onClose}
                className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50">
                {loading ? (staff ? "Updating…" : "Saving…") : (staff ? "Update" : "Save")}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
