import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiUser, FiMail, FiPhone, FiCheck, FiLogOut, 
  FiLock, FiAlertCircle, FiCheckCircle, FiShield, FiKey,
  FiEdit3, FiAward, FiClock, FiCheckSquare
} from "react-icons/fi";

const ProfileSection = () => {
  const navigate = useNavigate();
  const BASE_API = import.meta.env.VITE_BASE_API_URL;

  const [user, setUser] = useState({
    full_name: "",
    email: "",
    mobile_no: "",
    user_role: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const roleName = (localStorage.getItem("user_role") || "Administrator").toUpperCase();

  const fetchUserData = async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const res = await fetch(`${BASE_API}/auth/dj-rest-auth/user/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          full_name: data.full_name || "",
          email: data.email || "",
          mobile_no: data.mobile_no || "",
          user_role: data.user_role || roleName,
        });
      } else {
        console.warn("Token invalid or expired.");
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const res = await fetch(`${BASE_API}/auth/dj-rest-auth/user/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: user.full_name,
          mobile_no: user.mobile_no,
        }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setUser((prev) => ({
          ...prev,
          full_name: updatedData.full_name || prev.full_name,
          mobile_no: updatedData.mobile_no || prev.mobile_no,
        }));
        setMessage({ type: "success", text: "Profile details updated successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to update profile details." });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({ type: "error", text: "Something went wrong while saving changes." });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md border border-slate-200">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Loading Profile...</span>
        </div>
      </div>
    );
  }

  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return "AD";
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── CLEAN PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              User Profile
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage your personal profile, contact info & account settings
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200/80 transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-2xs"
          >
            <FiLogOut className="w-4 h-4" /> Logout Account
          </button>
        </div>

        {/* ── 2-COLUMN MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN: Light Summary & Security Cards */}
          <div className="space-y-6">

            {/* Account Overview Light Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-blue-600" /> Account Summary
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-3.5 divide-y divide-slate-100 text-xs">
                <div className="pt-1 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Full Name</span>
                  <span className="font-bold text-slate-900">{user.full_name || "Not set"}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[170px]">{user.email}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Mobile Contact</span>
                  <span className="font-extrabold text-slate-900">{user.mobile_no || "Not set"}</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Role Access</span>
                  <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {roleName}
                  </span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Account Status</span>
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Active Member
                  </span>
                </div>
              </div>
            </div>

            {/* Password & Security Card (Clean Light Blue Gradient Theme) */}
            <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-slate-50 rounded-3xl p-6 border border-blue-200/80 shadow-xs space-y-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <FiShield className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Password & Protection</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Need to reset your password or manage credentials? Update security settings in Accounts.
              </p>
              <button
                onClick={() => navigate("/accounts")}
                className="w-full mt-2 py-2.5 rounded-2xl bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <FiKey className="w-4 h-4 text-blue-600" /> Manage Security Settings
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Edit Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">

              {/* Form Section Header */}
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Edit Profile Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Update your personal contact details below.</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FiEdit3 className="w-5 h-5" />
                </div>
              </div>

              {/* Toast Alert */}
              {message && (
                <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-slide-in ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}>
                  {message.type === "success" ? (
                    <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Profile Form */}
              <form onSubmit={handleSave} className="space-y-5">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={user.full_name}
                      onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                      placeholder="Enter full name"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700">Email Address</label>
                    <span className="text-[11px] font-semibold text-slate-400">Primary Account Email</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiMail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="w-full pl-10 pr-10 py-3 bg-slate-100/80 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiLock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Mobile Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mobile Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiPhone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={user.mobile_no}
                      onChange={(e) => setUser({ ...user, mobile_no: e.target.value })}
                      placeholder="Enter mobile contact number"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Assigned Role Level */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Assigned Role & Permissions</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiShield className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={`${roleName} ACCESS LEVEL`}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl text-xs font-extrabold text-blue-700 cursor-not-allowed uppercase"
                    />
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-70"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>

              </form>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProfileSection;
