import { useState, useEffect, useMemo } from "react";
import Base from "../components/Base";
import { 
  MdPersonAdd, 
  MdSearch, 
  MdEdit, 
  MdDelete, 
  MdVisibility, 
  MdBuild, 
  MdCheckCircle, 
  MdOutlinePauseCircle, 
  MdAssignmentInd,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdClose,
  MdRefresh
} from "react-icons/md";
import Swal from "sweetalert2";

export default function TechnicianPage() {
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  ), []);

  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specFilter, setSpecFilter] = useState("all");

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    specialization: "General Maintenance",
    custom_specialization: "",
    status: "active",
    experience_years: 0,
    address: ""
  });

  // Details modal
  const [selectedTechDetails, setSelectedTechDetails] = useState(null);
  const [techTasks, setTechTasks] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      let url = `${baseApi}/api/services/technicians/`;
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (statusFilter !== "all") params.push(`status=${encodeURIComponent(statusFilter)}`);
      if (specFilter !== "all") params.push(`specialization=${encodeURIComponent(specFilter)}`);

      if (params.length > 0) url += `?${params.join("&")}`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTechnicians(Array.isArray(data) ? data : data.results || []);
      } else {
        throw new Error("Failed to load technicians");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch technicians list" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, [search, statusFilter, specFilter]);

  const handleOpenAdd = () => {
    setEditingTech(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      specialization: "General Maintenance",
      custom_specialization: "",
      status: "active",
      experience_years: 0,
      address: ""
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (tech) => {
    setEditingTech(tech);
    const standardSpecs = ["HVAC", "Electrical", "Mechanical", "Plumbing", "General Maintenance", "Parking System"];
    const isCustom = !standardSpecs.includes(tech.specialization);

    setFormData({
      name: tech.name || "",
      phone: tech.phone || "",
      email: tech.email || "",
      password: "",
      specialization: isCustom ? "Other" : tech.specialization || "General Maintenance",
      custom_specialization: isCustom ? tech.specialization : "",
      status: tech.status || "active",
      experience_years: tech.experience_years || 0,
      address: tech.address || ""
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      Swal.fire({ icon: "warning", title: "Required Fields", text: "Please enter Technician Name and Phone Number." });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      specialization: formData.specialization === "Other" ? formData.custom_specialization.trim() : formData.specialization,
      status: formData.status,
      experience_years: parseInt(formData.experience_years, 10) || 0,
      address: formData.address.trim() || null
    };

    if (formData.password && formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    try {
      const url = editingTech
        ? `${baseApi}/api/services/technicians/${editingTech.id}/`
        : `${baseApi}/api/services/technicians/`;
      const method = editingTech ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: editingTech ? "Technician updated successfully" : "Technician registered successfully",
          timer: 1500,
          showConfirmButton: false
        });
        setShowFormModal(false);
        fetchTechnicians();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || JSON.stringify(errData));
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Submission Failed", text: err.message });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Technician?",
      text: "Are you sure you want to delete this technician profile?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      confirmButtonColor: "#ef4444"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/api/services/technicians/${id}/`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Technician deleted successfully", timer: 1200, showConfirmButton: false });
        fetchTechnicians();
      } else {
        throw new Error("Failed to delete technician");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleViewTasks = async (tech) => {
    setSelectedTechDetails(tech);
    setLoadingTasks(true);
    try {
      const res = await fetch(`${baseApi}/api/services/technicians/${tech.id}/assigned-tasks/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTechTasks(data);
      }
    } catch (err) {
      console.error("Failed to load technician tasks", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Stats computation
  const stats = useMemo(() => {
    const total = technicians.length;
    const active = technicians.filter(t => t.status === "active").length;
    const onLeave = technicians.filter(t => t.status === "on_leave").length;
    const totalActiveTasks = technicians.reduce((acc, t) => acc + (t.active_services_count || 0), 0);
    return { total, active, onLeave, totalActiveTasks };
  }, [technicians]);

  const uniqueSpecs = useMemo(() => {
    const specs = new Set(["General Maintenance", "HVAC", "Electrical", "Mechanical", "Plumbing", "Parking System"]);
    technicians.forEach(t => { if (t.specialization) specs.add(t.specialization); });
    return Array.from(specs);
  }, [technicians]);

  return (
    <Base title="Technician Management">
      <div className="p-4 md:p-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MdBuild className="text-indigo-600" />
              Technician Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Register, track, and manage service field technicians & assigned contracts
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition duration-150 shrink-0"
          >
            <MdPersonAdd className="w-5 h-5" />
            Register New Technician
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Technicians</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <MdBuild className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Technicians</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.active}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MdCheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">On Leave</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{stats.onLeave}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <MdOutlinePauseCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Assigned Calls</p>
              <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{stats.totalActiveTasks}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <MdAssignmentInd className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ID, name, phone, email, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={specFilter}
              onChange={(e) => setSpecFilter(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Specializations</option>
              {uniqueSpecs.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={fetchTechnicians}
              title="Refresh List"
              className="p-2.5 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <MdRefresh className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Technicians Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading technicians data...</div>
          ) : technicians.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <MdBuild className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-base font-medium">No technicians found</p>
              <p className="text-xs mt-1">Try adjusting filters or register a new technician.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Technician ID</th>
                    <th className="py-3.5 px-4">Name & Contact</th>
                    <th className="py-3.5 px-4">Specialization</th>
                    <th className="py-3.5 px-4">Experience</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Active Calls</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {technicians.map((tech) => (
                    <tr key={tech.id} className="hover:bg-slate-50/80 transition duration-150">
                      <td className="py-3.5 px-4 font-bold text-indigo-600 whitespace-nowrap">
                        {tech.technician_id || `TECH-${tech.id}`}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{tech.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MdPhone className="w-3.5 h-3.5 text-slate-400" /> {tech.phone}
                          </span>
                          {tech.email && (
                            <span className="flex items-center gap-1">
                              <MdEmail className="w-3.5 h-3.5 text-slate-400" /> {tech.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {tech.specialization}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {tech.experience_years} {tech.experience_years === 1 ? 'Year' : 'Years'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tech.status === "active" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                          </span>
                        )}
                        {tech.status === "on_leave" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> On Leave
                          </span>
                        )}
                        {tech.status === "inactive" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          tech.active_services_count > 0 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
                        }`}>
                          {tech.active_services_count || 0} active
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewTasks(tech)}
                            title="View Assigned Tasks"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <MdVisibility className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(tech)}
                            title="Edit Technician"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <MdEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tech.id)}
                            title="Delete Technician"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Register / Edit Technician */}
        {showFormModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <MdBuild className="text-indigo-600" />
                  {editingTech ? "Edit Technician Profile" : "Register Field Technician"}
                </h3>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Login Password {editingTech ? "(Leave blank to keep current)" : "*"}
                    </label>
                    <input
                      type="password"
                      placeholder={editingTech ? "Leave blank to keep current" : "Enter password for login..."}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Specialization / Skill *
                  </label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    <option value="General Maintenance">General Maintenance</option>
                    <option value="HVAC">HVAC / Air Conditioning</option>
                    <option value="Electrical">Electrical Engineering</option>
                    <option value="Mechanical">Mechanical Services</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Parking System">Parking Systems</option>
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>

                {formData.specialization === "Other" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Custom Specialization *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Specify specialization..."
                      value={formData.custom_specialization}
                      onChange={(e) => setFormData({ ...formData, custom_specialization: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Address / Base Location
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Enter technician address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                  >
                    {editingTech ? "Save Changes" : "Register Technician"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Technician Details & Tasks */}
        {selectedTechDetails && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <MdBuild className="text-indigo-600" />
                    {selectedTechDetails.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID: {selectedTechDetails.technician_id || `TECH-${selectedTechDetails.id}`} | Specialization: {selectedTechDetails.specialization}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedTechDetails(null); setTechTasks(null); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Profile Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Phone</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <MdPhone className="text-indigo-500" /> {selectedTechDetails.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Email</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <MdEmail className="text-indigo-500" /> {selectedTechDetails.email || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Experience</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{selectedTechDetails.experience_years} Years</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Address</span>
                    <span className="text-slate-700 flex items-center gap-1 mt-0.5">
                      <MdLocationOn className="text-indigo-500 shrink-0" /> {selectedTechDetails.address || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Assigned Tasks */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Assigned Tasks & Service Calls
                  </h4>
                  {loadingTasks ? (
                    <div className="p-4 text-center text-slate-400">Loading assigned tasks...</div>
                  ) : !techTasks || (techTasks.services.length === 0 && techTasks.amc_contracts.length === 0) ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                      No service calls or AMC contracts assigned to this technician.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Services */}
                      {techTasks.services.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-slate-500 uppercase">Service Requests ({techTasks.services.length})</h5>
                          <div className="space-y-2">
                            {techTasks.services.map(srv => (
                              <div key={srv.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-bold text-slate-800">{srv.service_id} - {srv.title}</div>
                                  <div className="text-slate-500">Customer: {srv.customer_details?.name || srv.customer_details?.company_name || "N/A"}</div>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 capitalize">
                                    {srv.status_display || srv.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AMC Contracts */}
                      {techTasks.amc_contracts.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-slate-500 uppercase">Assigned AMC Contracts ({techTasks.amc_contracts.length})</h5>
                          <div className="space-y-2">
                            {techTasks.amc_contracts.map(amc => (
                              <div key={amc.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-bold text-indigo-700">{amc.contract_id} - {amc.product}</div>
                                  <div className="text-slate-500">Customer: {amc.customer_name}</div>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 capitalize">
                                    {amc.status_display || amc.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Base>
  );
}
